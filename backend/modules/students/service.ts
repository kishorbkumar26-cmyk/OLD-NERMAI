import { logger } from '../../core/logger';
import { StudentProfileRepository, EnrollmentRepository, BatchRepository } from './repository';
import { IStudentProfile, IEnrollment, IBatch } from './types';
import { AppError } from '../../core/errors/AppError';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../../infrastructure/firebase';
import { redisClient } from '../../infrastructure/redis';
import { invalidateAccessCache } from '../../core/security/AccessCache';

const normalizeMobile = (mobile: string) => mobile.replace(/\D/g, '');

export class StudentService {
  private studentRepo = new StudentProfileRepository();
  private enrollmentRepo = new EnrollmentRepository();
  private batchRepo = new BatchRepository();

  // ----- STUDENTS -----
  async getStudent(id: string, tenantId: string) {
    const student = await this.studentRepo.findById(id);
    if (!student || student.tenantId !== tenantId) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async listStudents(tenantId: string) {
    return await this.studentRepo.findAllByTenant(tenantId);
  }

  async deleteStudent(id: string, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(id);
    if (!student || student.tenantId !== tenantId) {
      throw new AppError('Student not found', 404);
    }
    
    // Attempt to delete from Firebase Auth too
    try {
      if (!id.startsWith('mock_')) {
        await getAuth().deleteUser(id);
      }
    } catch (err) {
      logger.warn(`Could not delete Firebase Auth user ${id}`, err);
    }

    await this.studentRepo.softDelete(id, adminId);
  }

  async updateStudent(id: string, data: Partial<IStudentProfile>, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(id);
    if (!student || student.tenantId !== tenantId) {
      throw new AppError('Student not found', 404);
    }
    


    const { email, phoneNumber, rollNo } = data;
    
    // We must run a transaction if any identity fields change to keep identity_lookup in sync
    const needsIdentitySync = email !== undefined || phoneNumber !== undefined || rollNo !== undefined;

    if (needsIdentitySync) {
      await db.runTransaction(async (t) => {
        // 1. If rollNo is provided, ensure it is globally unique
        if (rollNo && rollNo !== student.rollNo) {
          const rollLookup = await t.get(db.collection('identity_lookup').doc(rollNo.toLowerCase()));
          if (rollLookup.exists && rollLookup.data()?.uid !== id) {
            throw new AppError('Roll number already assigned to another user', 400);
          }
        }

        // 2. Determine new canonical fields, fallback to existing ones
        const newEmail = email !== undefined ? email.toLowerCase() : student.email;
        const newMobile = phoneNumber !== undefined ? normalizeMobile(phoneNumber) : student.phoneNumber;
        const newRollNo = rollNo !== undefined ? (rollNo ? rollNo.toLowerCase() : null) : student.rollNo;

        // 3. Clear old identity_lookup records if they changed
        if (student.email && student.email !== newEmail) {
          t.delete(db.collection('identity_lookup').doc(student.email));
        }
        if (student.phoneNumber && student.phoneNumber !== newMobile) {
          t.delete(db.collection('identity_lookup').doc(student.phoneNumber));
        }
        if (student.rollNo && student.rollNo !== newRollNo) {
          t.delete(db.collection('identity_lookup').doc(student.rollNo));
        }

        // 4. Update student profile
        const updatePayload = {
          ...data,
          ...(email !== undefined && { email: newEmail }),
          ...(phoneNumber !== undefined && { phoneNumber: newMobile }),
          ...(rollNo !== undefined && { rollNo: newRollNo }),
          updatedAt: new Date().toISOString(),
          updatedBy: adminId
        };
        t.update(db.collection('student_profiles').doc(id), updatePayload);

        // 5. Write new identity_lookup records
        if (newEmail) t.set(db.collection('identity_lookup').doc(newEmail), { uid: id });
        if (newMobile) t.set(db.collection('identity_lookup').doc(newMobile), { uid: id });
        if (newRollNo) t.set(db.collection('identity_lookup').doc(newRollNo), { uid: id });
      });

      // 6. Sync email to Firebase Auth if it changed
      if (email && email.toLowerCase() !== student.email) {
        try {
          await getAuth().updateUser(id, { email: email.toLowerCase() });
        } catch (err) {
          logger.error(`Failed to sync email to Firebase Auth for user ${id}`, err);
          // Non-fatal, admin can retry or fix manually, though ideally this would be atomic.
        }
      }
    } else {
      // Simple update without identity sync
      await this.studentRepo.update(id, data, adminId);
    }

    return await this.studentRepo.findById(id);
  }

  async promoteStudent(id: string, adminId: string, tenantId: string) {
    // Deprecated: Moving to programMemberships instead of accessTier.
    throw new AppError('Promote student is deprecated in favor of mapping to a batch', 400);
  }

  async assignRole(id: string, role: string, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(id);
    if (!student || student.tenantId !== tenantId) {
      throw new AppError('Student not found', 404);
    }

    // DEV BYPASS: Skip Firebase if it's a mock user
    if (!id.startsWith('mock_')) {
      try {
        const auth = getAuth();
        const user = await auth.getUser(id);
        const currentClaims = user.customClaims || {};

        await auth.setCustomUserClaims(id, {
          ...currentClaims,
          role,
        });
      } catch (error) {
        logger.warn(`Could not update Firebase claims for user ${id}`, { error });
      }
    }

    await this.studentRepo.update(id, { role }, adminId);
    // Invalidate cache — role change must take effect immediately on next request
    await invalidateAccessCache(id);
    return { success: true, message: `User role updated to ${role} successfully` };
  }

  // ----- ENROLLMENTS -----
  async enrollStudent(studentId: string, courseId: string, validUntil: string | undefined, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(studentId);
    if (!student || student.tenantId !== tenantId) throw new AppError('Student not found', 404);

    const existing = await this.enrollmentRepo.findByStudentAndCourse(studentId, courseId);
    if (existing) {
      throw new AppError('Student is already enrolled in this course', 409);
    }

    const payload: Omit<IEnrollment, keyof import('../../core/types').BaseAuditFields | 'id'> = {
      studentId,
      courseId,
      tenantId,
      enrollmentDate: new Date().toISOString(),
      status: 'active' as const,
      progressPercentage: 0,
      validUntil
    };

    const enrollment = await this.enrollmentRepo.create(payload, adminId);
    // Invalidate access cache so the enrollment is reflected immediately
    await invalidateAccessCache(studentId);
    // Deprecated enrollStudent method in favor of mapping to batch.
    // Kept here so the app still compiles, but should be replaced by mapStudentToBatch.
    return enrollment;
  }

  async getStudentEnrollments(studentId: string, tenantId: string) {
    const student = await this.studentRepo.findById(studentId);
    if (!student || student.tenantId !== tenantId) throw new AppError('Student not found', 404);

    return await this.enrollmentRepo.findByStudentId(studentId);
  }

  async updateEnrollment(enrollmentId: string, data: Partial<IEnrollment>, adminId: string, tenantId: string) {
    await this.enrollmentRepo.update(enrollmentId, data, adminId);
    // Ideally we would return the updated enrollment, but we don't have a findById on enrollments yet.
    return { success: true }; 
  }

  // ----- BATCHES -----
  async createBatch(data: Omit<IBatch, keyof import('../../core/types').BaseAuditFields | 'id' | 'currentEnrollment' | 'tenantId'>, adminId: string, tenantId: string) {
    return await this.batchRepo.create({ ...data, currentEnrollment: 0, tenantId }, adminId);
  }

  async listBatches(tenantId: string) {
    return await this.batchRepo.findAllByTenant(tenantId);
  }

  async getBatch(id: string, tenantId: string) {
    const batch = await this.batchRepo.findById(id);
    if (!batch || batch.tenantId !== tenantId) throw new AppError('Batch not found', 404);
    return batch;
  }

  async updateBatch(id: string, data: Partial<IBatch>, adminId: string, tenantId: string) {
    const batch = await this.batchRepo.findById(id);
    if (!batch || batch.tenantId !== tenantId) throw new AppError('Batch not found', 404);

    await this.batchRepo.update(id, data, adminId);
    return await this.batchRepo.findById(id);
  }

  async deleteBatch(id: string, adminId: string, tenantId: string) {
    const batch = await this.batchRepo.findById(id);
    if (!batch || batch.tenantId !== tenantId) throw new AppError('Batch not found', 404);
    await this.batchRepo.softDelete(id, adminId);
  }

  async mapStudentToBatch(studentId: string, batchId: string, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(studentId);
    if (!student || student.tenantId !== tenantId) throw new AppError('Student not found', 404);

    const batch = await this.batchRepo.findById(batchId);
    if (!batch || batch.tenantId !== tenantId) throw new AppError('Batch not found', 404);

    if (batch.currentEnrollment >= batch.maxCapacity) {
      throw new AppError('Batch is at maximum capacity', 400);
    }

    // Check if already in batch
    const existing = student.programMemberships?.find(m => m.batchId === batchId);
    if (existing) {
      throw new AppError('Student is already in this batch', 400);
    }

    const memberships = student.programMemberships || [];
    memberships.push({
      batchId,
      joinedAt: new Date().toISOString(),
      status: 'active'
    });

    await this.studentRepo.update(studentId, { programMemberships: memberships }, adminId);
    await this.batchRepo.update(batchId, { currentEnrollment: batch.currentEnrollment + 1 }, adminId);
    // Invalidate access cache — student's batchIds must update on next resource/video request
    await invalidateAccessCache(studentId);
    return { success: true };
  }

  async removeStudentFromBatch(studentId: string, batchId: string, adminId: string, tenantId: string) {
    const student = await this.studentRepo.findById(studentId);
    if (!student || student.tenantId !== tenantId) throw new AppError('Student not found', 404);

    const batch = await this.batchRepo.findById(batchId);
    if (!batch || batch.tenantId !== tenantId) throw new AppError('Batch not found', 404);

    const memberships = student.programMemberships || [];
    const index = memberships.findIndex(m => m.batchId === batchId);
    if (index === -1) {
      throw new AppError('Student is not in this batch', 400);
    }

    memberships.splice(index, 1);

    await this.studentRepo.update(studentId, { programMemberships: memberships }, adminId);
    await this.batchRepo.update(batchId, { currentEnrollment: Math.max(0, batch.currentEnrollment - 1) }, adminId);
    // Invalidate access cache — revoked batch access must take effect immediately
    await invalidateAccessCache(studentId);
    return { success: true };
  }

  async updateMe(userId: string, data: Partial<IStudentProfile>, tenantId: string) {
    const student = await this.studentRepo.findById(userId);
    if (!student || student.tenantId !== tenantId) {
      throw new AppError('Student not found', 404);
    }

    const allowedUpdates = {
      fcmToken: data.fcmToken,
      // allow minimal updates like UI preferences later
    };

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    );

    const updated = await this.studentRepo.update(userId, cleanUpdates, userId);
    
    if (data.fcmToken) {
      // Save FCM token to Redis for lightning-fast broadcasts
      await redisClient.set(`fcm:${tenantId}:${userId}`, data.fcmToken);
    }

    return updated;
  }
}

import { CourseRepository, SubjectRepository, TopicRepository, ClassRepository } from './repository';
import { ICourse, ISubject, ITopic, IClass } from './types';
import { AppError } from '../../core/errors/AppError';
import { encrypt, decrypt } from '../../core/utils/encryption';
import { randomUUID } from 'crypto';
import { redisClient } from '../../infrastructure/redis';
import { db } from '../../infrastructure/firebase';
import { AccessEngine } from '../../core/security/AccessEngine';
import { AccessPolicyEngine } from '../../core/sape/AccessPolicyEngine';
import { NotificationService } from '../notifications/service';
import { analyticsWorker } from '../analytics/worker';
import { ContextService } from '../assistant/contextService';

const notificationService = new NotificationService();
const contextService = new ContextService();

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=))([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

export function deriveClassStatus(classDoc: any): 'SCHEDULED' | 'LIVE' | 'ENDED' {
  if (classDoc.classType === 'youtube_recorded') return 'ENDED';
  if (classDoc.actualEndTime) return 'ENDED';

  const now = new Date().getTime();
  const baseStart = classDoc.actualStartTime ? new Date(classDoc.actualStartTime).getTime() : new Date(classDoc.scheduledStartTime || 0).getTime();
  const durationMs = (classDoc.expectedDurationMinutes || 60) * 60 * 1000;
  const extensionMs = (classDoc.extensionMinutes || 0) * 60 * 1000;
  const gracePeriodMs = 2 * 60 * 1000; // 2 minutes grace period
  const effectiveEndTime = baseStart + durationMs + extensionMs + gracePeriodMs;

  if (now < baseStart) return 'SCHEDULED';
  if (now >= baseStart && now < effectiveEndTime) return 'LIVE';
  
  return 'ENDED';
}

export class CourseService {
  private courseRepo = new CourseRepository();
  private subjectRepo = new SubjectRepository();
  private topicRepo = new TopicRepository();
  private classRepo = new ClassRepository();

  // ----- COURSE -----
  async createCourse(data: Omit<ICourse, keyof import('../../core/types').BaseAuditFields | 'tenantId'>, userId: string, tenantId: string) {
    const existing = await this.courseRepo.findByNameAndTenant(data.name, tenantId);
    if (existing.length > 0) {
      throw new AppError(`Course with name "${data.name}" already exists in this tenant.`, 409);
    }
    return await this.courseRepo.create({ ...data, tenantId }, userId);
  }

  async updateCourse(id: string, data: Partial<ICourse>, userId: string, tenantId: string) {
    const course = await this.courseRepo.findById(id);
    if (!course || course.tenantId !== tenantId) {
      throw new AppError('Course not found', 404);
    }
    
    if (data.name && data.name !== course.name) {
      const existing = await this.courseRepo.findByNameAndTenant(data.name, tenantId);
      if (existing.length > 0) {
        throw new AppError(`Course with name "${data.name}" already exists.`, 409);
      }
    }
    
    await this.courseRepo.update(id, data, userId);
    return await this.courseRepo.findById(id);
  }

  async getCourse(id: string, tenantId: string) {
    const course = await this.courseRepo.findById(id);
    if (!course || course.tenantId !== tenantId) {
      throw new AppError('Course not found', 404);
    }
    return course;
  }

  async listCourses(tenantId: string) {
    return await this.courseRepo.findAllByTenant(tenantId);
  }

  async deleteCourse(id: string, userId: string, tenantId: string) {
    const course = await this.courseRepo.findById(id);
    if (!course || course.tenantId !== tenantId) throw new AppError('Course not found', 404);
    await this.courseRepo.softDelete(id, userId);
  }

  // ----- SUBJECT -----
  async createSubject(data: Omit<ISubject, keyof import('../../core/types').BaseAuditFields>, userId: string, tenantId: string) {
    const course = await this.courseRepo.findById(data.courseId);
    if (!course || course.tenantId !== tenantId) {
      throw new AppError('Parent course not found', 404);
    }

    const existing = await this.subjectRepo.findByNameAndCourse(data.name, data.courseId);
    if (existing.length > 0) {
      throw new AppError(`Subject with name "${data.name}" already exists in this course.`, 409);
    }
    
    return await this.subjectRepo.create(data, userId);
  }

  async listSubjectsByCourse(courseId: string, tenantId: string) {
    const course = await this.courseRepo.findById(courseId);
    if (!course || course.tenantId !== tenantId) {
      throw new AppError('Parent course not found', 404);
    }
    return await this.subjectRepo.findByCourseId(courseId);
  }

  async listAllSubjects(tenantId: string) {
    // FIX (Bug 6): Use collectionGroup query instead of N+1 per-course reads.
    // Subjects don't store tenantId directly, so we query via their parent courseIds.
    const courses = await this.courseRepo.findAllByTenant(tenantId);
    if (courses.length === 0) return [];
    const courseIds = new Set(courses.map(c => c.id!));

    const snap = await db.collectionGroup('subjects').where('isDeleted', '==', false).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ISubject))
      .filter(s => courseIds.has(s.courseId));
  }
  async updateSubject(id: string, data: Partial<ISubject>, userId: string, tenantId: string) {
    const subject = await this.subjectRepo.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);
    
    const course = await this.courseRepo.findById(subject.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    await this.subjectRepo.update(id, data, userId);
    return await this.subjectRepo.findById(id);
  }

  async deleteSubject(id: string, userId: string, tenantId: string) {
    const subject = await this.subjectRepo.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);
    
    const course = await this.courseRepo.findById(subject.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    await this.subjectRepo.softDelete(id, userId);
  }

  // ----- TOPIC -----
  async createTopic(data: Omit<ITopic, keyof import('../../core/types').BaseAuditFields>, userId: string, tenantId: string) {
    const subject = await this.subjectRepo.findById(data.subjectId);
    if (!subject) {
      throw new AppError('Parent subject not found', 404);
    }
    const course = await this.courseRepo.findById(subject.courseId);
    if (!course || course.tenantId !== tenantId) {
      throw new AppError('Tenant mismatch or course not found', 403);
    }

    const existing = await this.topicRepo.findByNameAndSubject(data.name, data.subjectId);
    if (existing.length > 0) {
      throw new AppError(`Topic with name "${data.name}" already exists in this subject.`, 409);
    }

    return await this.topicRepo.create(data, userId);
  }

  async listTopicsBySubject(subjectId: string, tenantId: string) {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new AppError('Subject not found', 404);
    
    const course = await this.courseRepo.findById(subject.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    return await this.topicRepo.findBySubjectId(subjectId);
  }

  async listAllTopics(tenantId: string) {
    // FIX (Bug 6): Use collectionGroup query instead of N+1 per-subject reads.
    const subjects = await this.listAllSubjects(tenantId);
    if (subjects.length === 0) return [];
    const subjectIds = new Set(subjects.map(s => s.id!));

    const snap = await db.collectionGroup('topics').where('isDeleted', '==', false).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ITopic))
      .filter(t => subjectIds.has(t.subjectId));
  }

  async updateTopic(id: string, data: Partial<ITopic>, userId: string, tenantId: string) {
    const topic = await this.topicRepo.findById(id);
    if (!topic) throw new AppError('Topic not found', 404);
    
    const subject = await this.subjectRepo.findById(topic.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    await this.topicRepo.update(id, data, userId);
    return await this.topicRepo.findById(id);
  }

  async deleteTopic(id: string, userId: string, tenantId: string) {
    const topic = await this.topicRepo.findById(id);
    if (!topic) throw new AppError('Topic not found', 404);
    
    const subject = await this.subjectRepo.findById(topic.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    await this.topicRepo.softDelete(id, userId);
  }

  // ----- CLASS -----
  async createClass(data: any, userId: string, tenantId: string) {
    const topic = await this.topicRepo.findById(data.topicId);
    if (!topic) throw new AppError('Parent topic not found', 404);
    
    const subject = await this.subjectRepo.findById(topic.subjectId);
    if (!subject) throw new AppError('Parent subject not found', 404);
    
    const course = await this.courseRepo.findById(subject.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);

    const existing = await this.classRepo.findByTitleAndTopic(data.title, data.topicId);
    if (existing.length > 0) {
      throw new AppError(`Class with title "${data.title}" already exists in this topic.`, 409);
    }

    const classData: any = { ...data };
    
    if (data.classType === 'youtube_live' || data.classType === 'zoom_live') {
      classData.extensionMinutes = 0;
      classData.extensionLog = [];
    }
    
    if (data.classType === 'youtube_recorded' || data.classType === 'youtube_live') {
      if (data.youtubeUrl) {
        const videoId = extractYoutubeId(data.youtubeUrl);
        if (!videoId) throw new AppError('Invalid YouTube URL', 400);
        classData.encryptedVideoId = encrypt(videoId);
        delete classData.youtubeUrl;
      }
    }

    return await this.classRepo.create(classData, userId);
  }

  async listClassesByTopic(topicId: string, tenantId: string) {
    const topic = await this.topicRepo.findById(topicId);
    if (!topic) throw new AppError('Topic not found', 404);
    
    const subject = await this.subjectRepo.findById(topic.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    return await this.classRepo.findByTopicId(topicId);
  }

  async listAllClasses(tenantId: string) {
    // FIX (Bug 6): Use collectionGroup query instead of N+1 per-topic reads.
    const topics = await this.listAllTopics(tenantId);
    if (topics.length === 0) return [];
    const topicIds = new Set(topics.map(t => t.id!));

    const snap = await db.collectionGroup('classes').where('isDeleted', '==', false).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as IClass))
      .filter(c => topicIds.has(c.topicId));
  }

  async getClass(id: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) {
      throw new AppError('Class not found', 404);
    }
    return classDoc;
  }

  async updateClass(id: string, data: Partial<IClass>, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    // Policy Lock: If class has started, prevent modification of key metrics
    const now = new Date().getTime();
    const scheduled = classDoc.scheduledStartTime ? new Date(classDoc.scheduledStartTime).getTime() : 0;
    const hasStarted = classDoc.actualStartTime || (scheduled > 0 && now >= scheduled);
    
    if (hasStarted) {
      if (data.attendance?.value !== undefined && data.attendance?.value !== classDoc.attendance?.value) {
        throw new AppError('Cannot modify attendance percentage after the class has started.', 400);
      }
      if (data.expectedDurationMinutes !== undefined && data.expectedDurationMinutes !== classDoc.expectedDurationMinutes) {
        throw new AppError('Cannot modify expected duration after the class has started. Use extensions instead.', 400);
      }
    }
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    const classData: any = { ...data };
    
    if (classData.youtubeUrl) {
      const videoId = extractYoutubeId(classData.youtubeUrl);
      if (!videoId) throw new AppError('Invalid YouTube URL', 400);
      classData.encryptedVideoId = encrypt(videoId);
      delete classData.youtubeUrl;
    }

    await this.classRepo.update(id, classData, userId);
    return await this.classRepo.findById(id);
  }

  async uploadClassRecording(id: string, youtubeUrl: string, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) throw new AppError('Invalid YouTube URL', 400);
    
    const encryptedRecordingId = encrypt(videoId);
    const now = new Date();
    await this.classRepo.update(id, { 
      encryptedRecordingId,
      // Retain encryptedVideoId for audit/history
      actualEndTime: classDoc.actualEndTime || now.toISOString()
    }, userId);
    
    const actualEndMs = classDoc.actualEndTime ? new Date(classDoc.actualEndTime).getTime() : now.getTime();
    const recordingDelayMinutes = Math.floor((now.getTime() - actualEndMs) / 60000);
    analyticsWorker.queueDeferredAnalytics(id, recordingDelayMinutes).catch(e => console.error(e));
    
    // Inject context for Assistant
    try {
      await contextService.setGlobalClassContext(id, {
        courseId: course?.id || 'unknown',
        subjectId: subject?.id || 'unknown',
        topicId: topic?.id || 'unknown',
        classId: id,
        recordingId: encryptedRecordingId,
        resourceIds: [], // Resources could be fetched here or left to async jobs
        announcementIds: []
      });
    } catch (err) {
      console.error('Failed to inject assistant context:', err);
    }
    
    // Notify users
    try {
      await notificationService.dispatchNotification({
        tenantId,
        title: 'Recording Uploaded',
        body: `The recording for ${classDoc.title} is now available.`,
        visibility: 'topic',
        metadata: { classId: id, courseId: course?.id || 'unknown' }
      });
    } catch (err) {}
    
    return await this.classRepo.findById(id);
  }

  async deleteClass(id: string, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    await this.classRepo.softDelete(id, userId);
  }

  async getClassPlaybackAccess(classId: string, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(classId);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    if (classDoc.classType === 'youtube_recorded' || classDoc.classType === 'youtube_live') {
      const isEnded = (classDoc as any).status === 'ENDED' || classDoc.actualEndTime || deriveClassStatus(classDoc) === 'ENDED';
      let targetVideoId = null;

      if (classDoc.classType === 'youtube_recorded') {
          if (!classDoc.encryptedVideoId) throw new AppError('Video ID not configured for this class', 500);
          targetVideoId = classDoc.encryptedVideoId;
      } else {
          // Live class
          if (isEnded) {
              if (!classDoc.encryptedRecordingId) {
                  throw new AppError('NOT_UPLOADED', 404); // Explicit NOT_UPLOADED state mapping
              }
              targetVideoId = classDoc.encryptedRecordingId;
          } else {
              if (!classDoc.encryptedVideoId) {
                  throw new AppError('Live Video ID not configured', 500);
              }
              targetVideoId = classDoc.encryptedVideoId;
          }
      }
      
      const videoId = decrypt(targetVideoId);

      // Use the new SAPE engine
      const sape = new AccessPolicyEngine();
      const sapeDecision = await sape.evaluateAccess(userId, 'CLASS', classId);
      
      if (!sapeDecision.allowed) {
        return {
          status: 'DENIED',
          denialReason: sapeDecision.reason,
          allowedRequestScopes: sapeDecision.allowedRequestScopes,
          remainingRecordedUnits: sapeDecision.remainingRecordedUnits
        };
      }

      // Generate the player token using the old AccessEngine for now, 
      // but only since SAPE has already strictly authorized access.
      const access = await AccessEngine.evaluateAccess({
        userId,
        tenantId,
        resourceType: 'video',
        resourceId: classId,
        tokenPayload: {
          videoId,
          classId,
          videoTitle: classDoc.title || 'Nermai IAS Video',
          videoType: classDoc.classType
        },
        visibilityRule: { visibility: 'public' } // Bypass old rules since SAPE handled it
      });
      
      return {
        provider: classDoc.classType,
        status: (classDoc as any).status,
        playerToken: access.token
      };
    } else if (classDoc.classType === 'zoom_live') {
      return {
        provider: 'zoom_live',
        status: (classDoc as any).status,
        meetingUrl: classDoc.meetingUrl,
        sdkSignature: 'GENERATED_SDK_SIGNATURE', // TODO: Implement Zoom JWT generation
        displayName: 'Student' // In real app, fetch user profile
      };
    }
    
    throw new AppError('Unknown class type', 400);
  }

  async startLiveSession(id: string, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    if (classDoc.classType !== 'youtube_live' && classDoc.classType !== 'zoom_live') {
      throw new AppError('Only live classes can be started manually', 400);
    }
    if (classDoc.actualStartTime) {
      throw new AppError('Session has already been started', 409);
    }
    
    const now = new Date();
    const scheduledStart = new Date(classDoc.scheduledStartTime || 0);
    
    // Grace period check: allow manual start only up to 15 mins after scheduled start
    const allowedStartLimit = new Date(scheduledStart.getTime() + 15 * 60 * 1000);
    if (now > allowedStartLimit) {
      throw new AppError('Cannot manually start session 15 minutes after scheduled start. Use Extend Session instead.', 400);
    }

    const actualStartTime = now.toISOString();

    await this.classRepo.update(id, {
      actualStartTime,
      // freeze attendance percentage by NOT allowing updates to it anymore (enforced in updateClass)
    }, userId);

    // Generate lifecycle event & notify students
    try {
      await notificationService.dispatchNotification({
        tenantId,
        title: 'Class Started',
        body: `Teacher has manually started the session: ${classDoc.title}`,
        visibility: 'topic',
        metadata: { classId: id }
      });
    } catch (err) {
      console.error('Failed to notify start:', err);
    }

    // TODO: Begin attendance engine (Redis initialization)

    return await this.classRepo.findById(id);
  }

  async extendLiveSession(id: string, minutes: number, reason: string | undefined, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    if (classDoc.classType !== 'youtube_live' && classDoc.classType !== 'zoom_live') {
      throw new AppError('Only live classes can be extended', 400);
    }
    if (classDoc.actualEndTime || deriveClassStatus(classDoc) === 'ENDED') {
      throw new AppError('Session has already been ended. No further extensions allowed.', 400);
    }

    const currentExt = classDoc.extensionMinutes || 0;
    const newExt = currentExt + minutes;
    
    // Max 12 hours total duration
    const totalDuration = (classDoc.expectedDurationMinutes || 0) + newExt;
    if (totalDuration > 720) {
      throw new AppError('Total session duration cannot exceed 12 hours', 400);
    }

    const logEntry = {
      minutes,
      reason,
      timestamp: new Date().toISOString(),
      adminId: userId
    };
    const extensionLog = [...(classDoc.extensionLog || []), logEntry];

    await this.classRepo.update(id, {
      extensionMinutes: newExt,
      extensionLog
    }, userId);

    // Notify students
    try {
      await notificationService.dispatchNotification({
        tenantId,
        title: 'Class Extended',
        body: `Teacher has extended the session by ${minutes} minutes.`,
        visibility: 'topic',
        metadata: { classId: id }
      });
    } catch (err) {
      console.error('Failed to notify extension:', err);
    }

    return await this.classRepo.findById(id);
  }

  async endLiveSession(id: string, userId: string, tenantId: string) {
    const classDoc = await this.classRepo.findById(id);
    if (!classDoc) throw new AppError('Class not found', 404);
    
    const topic = await this.topicRepo.findById(classDoc.topicId);
    const subject = await this.subjectRepo.findById(topic!.subjectId);
    const course = await this.courseRepo.findById(subject!.courseId);
    if (!course || course.tenantId !== tenantId) throw new AppError('Tenant mismatch', 403);
    
    if (classDoc.classType !== 'youtube_live' && classDoc.classType !== 'zoom_live') {
      throw new AppError('Only live classes can be ended', 400);
    }
    if (classDoc.actualEndTime) {
      throw new AppError('Class is already ended', 400);
    }

    await this.classRepo.update(id, {
      actualEndTime: new Date().toISOString()
    }, userId);

    // Stop attendance & Lock extension handled by actualEndTime existence.
    // Trigger BullMQ analytics & trigger reconciliation.
    analyticsWorker.queueImmediateAnalytics(id).catch(e => console.error(e));
    console.log(`[ATTENDANCE] Stopping attendance and reconciling for class ${id}`);

    // Inject context for Assistant
    try {
      // Fetch latest resources and announcements for this topic/class
      // FIX (Bug 3): IResource uses 'topicIds' (array), not 'topicId' (string).
      // The old query silently returned zero results every time.
      const [resourcesSnap, announcementsSnap] = await Promise.all([
        db.collection('resources').where('topicIds', 'array-contains', classDoc.topicId).limit(5).get(),
        db.collection('announcements').where('topicId', '==', classDoc.topicId).limit(5).get()
      ]);
      
      const resourceIds = resourcesSnap.docs.map(d => d.id);
      const announcementIds = announcementsSnap.docs.map(d => d.id);
      
      await contextService.setGlobalClassContext(id, {
        courseId: course?.id || 'unknown',
        subjectId: subject?.id || 'unknown',
        topicId: topic?.id || 'unknown',
        classId: id,
        recordingId: classDoc.encryptedRecordingId,
        resourceIds,
        announcementIds
      });
    } catch (err) {
      console.error('Failed to inject assistant context on end:', err);
    }

    return await this.classRepo.findById(id);
  }
}

import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import * as StudentController from './controller';

const applyAuth = (router: Router) => {
  router.use(requireAuth, requireRole(['super_admin', 'staff', 'teacher']));
};

export const studentRoutes = Router();

// Student Self-Service Routes (Accessible to 'student' role)
studentRoutes.patch('/me', requireAuth, StudentController.updateMe);

applyAuth(studentRoutes);

// Student Profiles
studentRoutes.get('/', StudentController.listStudents);
studentRoutes.get('/:id', StudentController.getStudent);
studentRoutes.put('/:id', StudentController.updateStudent);
studentRoutes.delete('/:id', StudentController.deleteStudent);

// Student Role Management
studentRoutes.patch('/:id/role', StudentController.assignRole);

// Student Batches Management
studentRoutes.post('/:id/batches', StudentController.mapStudentToBatch); // Replaces /enroll or /batch/map-student
studentRoutes.delete('/:id/batches/:batchId', StudentController.removeStudentFromBatch);

// ---

export const batchRoutes = Router();
applyAuth(batchRoutes);

batchRoutes.get('/', StudentController.listBatches);
batchRoutes.post('/', StudentController.createBatch);
batchRoutes.get('/:id', StudentController.getBatch);
batchRoutes.put('/:id', StudentController.updateBatch);
batchRoutes.delete('/:id', StudentController.deleteBatch);

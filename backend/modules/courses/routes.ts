import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import * as CourseController from './controller';

const applyAuth = (router: Router) => {
  router.use(requireAuth, requireRole(['super_admin', 'staff', 'teacher']));
};

export const courseRoutes = Router();
courseRoutes.use(requireAuth);

// Admin only list all courses
courseRoutes.get('/', requireRole(['super_admin', 'staff', 'teacher']), CourseController.listCourses);
courseRoutes.post('/', requireRole(['super_admin', 'staff', 'teacher']), CourseController.createCourse);

// Students can read specific courses and their subjects
courseRoutes.get('/:id', requireRole(['super_admin', 'staff', 'teacher', 'student']), CourseController.getCourse);
courseRoutes.get('/:courseId/subjects', requireRole(['super_admin', 'staff', 'teacher', 'student']), CourseController.listSubjectsByCourse);

courseRoutes.put('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.updateCourse);
courseRoutes.delete('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.deleteCourse);
courseRoutes.post('/:courseId/subjects', requireRole(['super_admin', 'staff', 'teacher']), CourseController.createSubject);

export const subjectRoutes = Router();
subjectRoutes.use(requireAuth);
subjectRoutes.get('/', requireRole(['super_admin', 'staff', 'teacher']), CourseController.listAllSubjects);
subjectRoutes.get('/:subjectId/topics', requireRole(['super_admin', 'staff', 'teacher', 'student']), CourseController.listTopicsBySubject);

subjectRoutes.put('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.updateSubject);
subjectRoutes.delete('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.deleteSubject);
subjectRoutes.post('/:subjectId/topics', requireRole(['super_admin', 'staff', 'teacher']), CourseController.createTopic);

export const topicRoutes = Router();
topicRoutes.use(requireAuth);
topicRoutes.get('/', requireRole(['super_admin', 'staff', 'teacher']), CourseController.listAllTopics);
topicRoutes.get('/:topicId/classes', requireRole(['super_admin', 'staff', 'teacher', 'student']), CourseController.listClassesByTopic);

topicRoutes.put('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.updateTopic);
topicRoutes.delete('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.deleteTopic);
topicRoutes.post('/:topicId/classes', requireRole(['super_admin', 'staff', 'teacher']), CourseController.createClass);

export const classRoutes = Router();
classRoutes.use(requireAuth);
// Access route available to all authenticated users (students)
classRoutes.get('/:id/access', requireRole(['super_admin', 'staff', 'teacher', 'student']), CourseController.getClassPlaybackAccess);

classRoutes.get('/', requireRole(['super_admin', 'staff', 'teacher']), CourseController.listAllClasses);
classRoutes.put('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.updateClass);
classRoutes.put('/:id/recording', requireRole(['super_admin', 'staff', 'teacher']), CourseController.uploadClassRecording);
classRoutes.post('/:id/start', requireRole(['super_admin', 'staff', 'teacher']), CourseController.startLiveSession);
classRoutes.post('/:id/extend', requireRole(['super_admin', 'staff', 'teacher']), CourseController.extendLiveSession);
classRoutes.post('/:id/end', requireRole(['super_admin', 'staff', 'teacher']), CourseController.endLiveSession);
classRoutes.delete('/:id', requireRole(['super_admin', 'staff', 'teacher']), CourseController.deleteClass);

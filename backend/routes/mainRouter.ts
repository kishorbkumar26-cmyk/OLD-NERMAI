import { Router } from 'express';
import { HealthRoutes } from '../core/health';
import { AuthRoutes } from '../modules/auth';
import { StudentsRoutes, BatchRoutes } from '../modules/students';
import { CoursesRoutes, SubjectRoutes, TopicRoutes, ClassRoutes } from '../modules/courses';
import { resourceRoutes } from '../modules/resources';
import { WatchHistoryRoutes } from '../modules/watch-history';
import { LiveClassesRoutes } from '../modules/live-classes';
import { AttendanceRoutes } from '../modules/attendance';
import { DashboardRoutes } from '../modules/dashboard';
import announcementRoutes from '../modules/announcements/routes';
// SACS: replaces the defunct content-filtering module
import accessRulesRouter from '../modules/access-rules';
import accessRequestsRouter from '../modules/access-requests/routes';
import { debugRoutes } from '../modules/debug';
import { kbRoutes } from '../modules/knowledge-base';
import { assistantRoutes } from '../modules/assistant';
import { interactionRoutes } from '../modules/interaction-engine';
import { liveAttendanceRoutes } from '../modules/live-attendance';
import { liveCommentsRoutes } from '../modules/live-comments';

const mainRouter = Router();

// System Health
mainRouter.use('/health', HealthRoutes);
mainRouter.use('/debug', debugRoutes);

// Modular Routes Setup
// In a true modular monolith, the module dictates its own prefix or we register them via a registrar.
// For now, we manually map them to the root or subpaths.

mainRouter.use('/auth', AuthRoutes);
mainRouter.use('/students', StudentsRoutes);
mainRouter.use('/batches', BatchRoutes);

mainRouter.use('/courses', CoursesRoutes);
mainRouter.use('/subjects', SubjectRoutes);
mainRouter.use('/topics', TopicRoutes);
mainRouter.use('/classes', ClassRoutes);

mainRouter.use('/resources', resourceRoutes);
mainRouter.use('/watch-history', WatchHistoryRoutes);
mainRouter.use('/live-classes', LiveClassesRoutes);
mainRouter.use('/attendance', AttendanceRoutes);
mainRouter.use('/live-attendance', liveAttendanceRoutes);
mainRouter.use('/live-comments', liveCommentsRoutes);
mainRouter.use('/dashboard', DashboardRoutes);
mainRouter.use('/announcements', announcementRoutes);
mainRouter.use('/access-rules', accessRulesRouter);
mainRouter.use('/access-requests', accessRequestsRouter);
mainRouter.use('/knowledge-base', kbRoutes);
mainRouter.use('/assistant', assistantRoutes);
mainRouter.use('/interaction', interactionRoutes);

export default mainRouter;

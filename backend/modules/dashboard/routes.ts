import { Router } from 'express';
import { getStudentDashboardOverview, getAdminDashboardMetrics } from './controller';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';

const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

// Student Overview
dashboardRoutes.get('/student/overview', requireRole(['student']), getStudentDashboardOverview);

// Admin Metrics
dashboardRoutes.get('/admin/metrics', requireRole(['super_admin', 'staff', 'teacher']), getAdminDashboardMetrics);

export { dashboardRoutes };

import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import * as LiveSessionController from './controller';

export const liveSessionRoutes = Router();

// --- Student Routes ---
liveSessionRoutes.use(requireAuth);
liveSessionRoutes.get('/:id/access', LiveSessionController.getLiveAccess);

// --- Admin Routes ---
const adminLiveRoutes = Router();
adminLiveRoutes.use(requireAuth, requireRole(['super_admin', 'staff', 'teacher']));

adminLiveRoutes.post('/create', LiveSessionController.createLiveSession);
adminLiveRoutes.put('/update/:id', LiveSessionController.updateLiveSession);
adminLiveRoutes.delete('/delete/:id', LiveSessionController.deleteLiveSession);
adminLiveRoutes.get('/class/:classId', LiveSessionController.listClassSessions);
adminLiveRoutes.post('/:id/start', LiveSessionController.startLiveClass);
adminLiveRoutes.post('/:id/end', LiveSessionController.endLiveClass);

liveSessionRoutes.use('/admin', adminLiveRoutes);

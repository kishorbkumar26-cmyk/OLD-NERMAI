import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import * as Controller from './controller';

const upload = multer({ storage: multer.memoryStorage() });

export const resourceRoutes = Router();

resourceRoutes.get('/', requireAuth, Controller.list);
resourceRoutes.get('/course/:courseId/hierarchy', requireAuth, Controller.getCourseHierarchy);
resourceRoutes.get('/:id', requireAuth, Controller.getById);
resourceRoutes.get('/:id/access', requireAuth, Controller.getAccess);
resourceRoutes.post('/', requireAuth, requireRole(['admin']), upload.single('file'), Controller.create);
resourceRoutes.put('/:id', requireAuth, requireRole(['admin']), Controller.update);
resourceRoutes.post('/:id/version', requireAuth, requireRole(['admin']), upload.single('file'), Controller.uploadVersion);
resourceRoutes.delete('/:id', requireAuth, requireRole(['admin']), Controller.remove);

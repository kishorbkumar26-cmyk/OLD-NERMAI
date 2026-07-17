import { Router } from 'express';
import { AssistantController } from './controller';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';

export const assistantRoutes = Router();

// Student-facing assistant routes
assistantRoutes.use(requireAuth);

assistantRoutes.get('/sync', AssistantController.syncKnowledge);
assistantRoutes.post('/context', AssistantController.setContext);
assistantRoutes.post('/chat', AssistantController.chat);

// Admin-facing Assistant Playground
assistantRoutes.post('/preview', requireRole(['super_admin', 'admin', 'staff']), AssistantController.previewSearch);

import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware';
import * as InteractionController from './controller';

export const interactionRoutes = Router();

// unified POST endpoint for all interactions
interactionRoutes.post('/', requireAuth, InteractionController.postInteraction);

// SSE connection endpoint for receiving real-time interactions
// Does NOT requireAuth middleware here if using token in query string, 
// but for simplicity we will use standard auth if it works with SSE (cookies/headers).
// Wait: standard EventSource in browser does not easily send custom headers, 
// so we usually pass a short-lived token via query string `?token=...`.
// For React Native, libraries can send headers.
interactionRoutes.get('/stream/:tenantId/:contextType/:contextId', InteractionController.streamInteractions);

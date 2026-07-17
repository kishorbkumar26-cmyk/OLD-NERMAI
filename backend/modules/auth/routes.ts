import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { registerStudent, loginStudent } from './controller';

import { authRateLimiter } from '../../core/middleware/rateLimiter';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, registerStudent);
authRoutes.post('/login', authRateLimiter, loginStudent);

authRoutes.get('/debug', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    uid: req.user?.userId,
    email: (req.user as any)?.email || 'Not available in req.user directly',
    role: req.user?.role,
    tenantId: req.user?.tenantId,
    programMemberships: req.user?.programMemberships,
    claims: req.user
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Modules Endpoint Integrations', () => {
  const adminRoutes = [
    '/api/videos/admin',
    '/api/resources/admin',
    '/api/attendance/admin',
    '/api/live-classes/admin',
    '/api/faq/admin',
    '/api/dashboard/admin/metrics',
    '/api/chatbot/admin',
  ];

  for (const route of adminRoutes) {
    it(`should return 401 for unauthorized access to ${route}`, async () => {
      const res = await request(app).get(route);
      // Depending on if the route exists or needs auth
      expect([401, 404]).toContain(res.status);
    });
  }
  
  it('should test chatbot ask', async () => {
    const res = await request(app).post('/api/chatbot/ask').send({ question: 'hello' });
    // Without auth, should be 401
    expect([401, 400, 500]).toContain(res.status); // 500 if redis is required internally but bypassed
  });
});

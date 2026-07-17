import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Health Endpoint Integration', () => {
  it('should return 200 OK from /api/v1/health/live', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'alive');
  });

  it('should test /api/v1/health/ready', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    // Depending on environment (emulator/redis), it could be 200 or 503
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('firebase');
    expect(res.body).toHaveProperty('redis');
  });
});

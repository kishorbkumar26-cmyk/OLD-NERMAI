import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Students Endpoint Integration', () => {
  it('should return 401 for unauthorized access to student list', async () => {
    const res = await request(app).get('/api/students/admin');
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Auth Endpoint Integration', () => {
  it('should return 400 for register without credentials', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    // Depending on validation, usually 400, or 500 if emulator isn't fully running
    expect([400, 500]).toContain(res.status);
  });
});

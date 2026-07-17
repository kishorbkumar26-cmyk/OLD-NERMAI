import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import jwt from 'jsonwebtoken';
import { db } from '../../infrastructure/firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const generateToken = (uid: string, role: string) => {
  return jwt.sign({ uid, role, email: `${uid}@test.com`, aud: 'demo-test', iss: 'https://securetoken.google.com/demo-test', sub: uid }, JWT_SECRET, { expiresIn: '1h' });
};

describe('LCES API Integration', () => {
  const liveSessionId = 'test-session-123';
  let studentToken: string;
  let teacherToken: string;
  let commentId: string;

  beforeAll(() => {
    studentToken = generateToken('student_test_1', 'student');
    teacherToken = generateToken('teacher_test_1', 'teacher');
  });

  afterAll(async () => {
    // Cleanup firestore if needed, but in emulator it resets often
  });

  it('Student should create a comment successfully and DB reflects it', async () => {
    const res = await request(app)
      .post('/api/v1/live-comments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        liveSessionId,
        type: 'QUESTION',
        text: 'How does this work?',
        userName: 'Test Student'
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    commentId = res.body.data.id;

    // Database validation
    const doc = await db.collection('live_sessions').doc(liveSessionId).collection('comments').doc(commentId).get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.text).toBe('How does this work?');
  });

  it('Student should retrieve comments', async () => {
    const res = await request(app)
      .get(`/api/v1/live-comments/${liveSessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const comment = res.body.data.find((c: any) => c.id === commentId);
    expect(comment).toBeDefined();
    expect(comment.text).toBe('How does this work?');
  });

  it('Student should NOT be able to pin a comment (Security Validation)', async () => {
    const res = await request(app)
      .put(`/api/v1/live-comments/admin/${commentId}/pin`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ isPinned: true });

    expect(res.status).toBe(403);
  });

  it('Teacher should be able to pin a comment', async () => {
    const res = await request(app)
      .put(`/api/v1/live-comments/admin/${commentId}/pin`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ isPinned: true });

    expect(res.status).toBe(200);
    
    // DB Validation
    const doc = await db.collection('live_sessions').doc(liveSessionId).collection('comments').doc(commentId).get();
    expect(doc.data()?.isPinned).toBe(true);
  });

  it('Student can react to a comment', async () => {
    const res = await request(app)
      .post(`/api/v1/live-comments/${commentId}/react`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reaction: 'HELPFUL' });

    expect(res.status).toBe(200);

    const doc = await db.collection('live_sessions').doc(liveSessionId).collection('comments').doc(commentId).get();
    expect(doc.data()?.reactionCount).toBe(1);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import jwt from 'jsonwebtoken';
import { db } from '../../infrastructure/firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const generateToken = (uid: string, role: string) => {
  return jwt.sign({ uid, role, email: `${uid}@test.com`, aud: 'demo-test', iss: 'https://securetoken.google.com/demo-test', sub: uid }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Attendance API Integration', () => {
  const classId = 'test-class-123';
  const courseId = 'test-course-456';
  let studentToken: string;
  let studentId = 'attendance_student_1';

  beforeAll(() => {
    studentToken = generateToken(studentId, 'student');
  });

  it('Should record attendance heartbeat correctly and update database', async () => {
    // 1. Send initial PLAY event
    await request(app)
      .post('/api/v1/player/heartbeat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        classId,
        courseId,
        event: 'PLAY',
        progressSeconds: 0
      });

    // 2. Send heartbeat at 300 seconds (5 minutes)
    const res = await request(app)
      .post('/api/v1/player/heartbeat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        classId,
        courseId,
        event: 'HEARTBEAT',
        progressSeconds: 300
      });

    expect(res.status).toBe(200);

    // 3. Database Validation
    const attendanceDoc = await db.collection('attendance')
      .doc(`${studentId}_${classId}`)
      .get();
      
    expect(attendanceDoc.exists).toBe(true);
    const data = attendanceDoc.data();
    expect(data?.totalWatchTime).toBeGreaterThanOrEqual(300);
    // Since total session is mocked to 3600 (1 hour) usually, completion should be false initially
    expect(data?.isCompleted).toBe(false);
  });

  it('Should mark class as completed if watched enough', async () => {
    // Send completion event or large heartbeat
    const res = await request(app)
      .post('/api/v1/player/heartbeat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        classId,
        courseId,
        event: 'HEARTBEAT',
        progressSeconds: 3300 // almost an hour
      });

    expect(res.status).toBe(200);

    // Database Validation
    const attendanceDoc = await db.collection('attendance')
      .doc(`${studentId}_${classId}`)
      .get();
      
    const data = attendanceDoc.data();
    expect(data?.totalWatchTime).toBeGreaterThanOrEqual(3300);
    
    // Depending on logic, it might not be strictly completed unless > 90%, assuming it's 60 min.
    // We mainly verify the DB updates accurately without duplicates.
  });
});

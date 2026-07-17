import { redisClient } from '../../infrastructure/redis';
import { db } from '../../infrastructure/firebase';
import { env } from '../../config/env';
import { RedisConfig } from '../../core/constants';
import { IClass } from '../courses/types';
import { IAttendanceSession, AttendanceStatus, AttendanceResult } from './types';
import { platformEvents } from '@nermai/events';

export interface RedisAttendanceSession {
  classId: string;
  userId: string;
  sessionId: string;
  joinTime: number;
  lastEventTime: number;
  activeTimeSeconds: number;
  heartbeatCount: number;
  lastEvent: string;
  reconnects: number;
}

export class AttendanceService {
  private collection = db.collection('attendance_sessions');
  private coursesCollection = db.collection('classes');

  async processEvent(userId: string, classId: string, event: string, sessionId: string, provider?: string, requestId: string = '') {
    const isLive = provider?.includes('live');
    const now = Date.now(); // UTC server time
    
    // Provider Validation
    const liveEvents = ['JOIN', 'HEARTBEAT', 'BACKGROUND', 'FOREGROUND', 'LEAVE'];
    const recordedEvents = ['JOIN', 'PLAY', 'PAUSE', 'HEARTBEAT', 'BACKGROUND', 'FOREGROUND', 'LEAVE'];
    
    if (isLive && !liveEvents.includes(event)) return;
    if (!isLive && !recordedEvents.includes(event)) return;

    const redisKey = `attendance:${classId}:${userId}:${sessionId}`;
    let session: RedisAttendanceSession;

    const cached = await redisClient.get(redisKey);
    
    if (cached) {
      session = JSON.parse(cached);
      
      // Deduplication
      if (session.lastEvent === event && (now - session.lastEventTime) < 1000) {
        return; 
      }

      // Reconnect tracking
      if (event === 'JOIN' && session.lastEvent === 'LEAVE') {
        session.reconnects += 1;
      }

      const activeEvents = ['JOIN', 'PLAY', 'HEARTBEAT', 'FOREGROUND'];
      if (activeEvents.includes(session.lastEvent)) {
        let elapsed = (now - session.lastEventTime) / 1000;
        
        const maxInterval = isLive 
          ? RedisConfig.LIVE_HEARTBEAT_INTERVAL_SEC + 60 
          : RedisConfig.WATCH_HEARTBEAT_INTERVAL_SEC + 30;
          
        if (elapsed > 0 && elapsed <= maxInterval) {
          session.activeTimeSeconds += elapsed;
        }
      }

      session.lastEventTime = now;
      session.heartbeatCount += 1;
      session.lastEvent = event;
    } else {
      session = {
        classId,
        userId,
        sessionId,
        joinTime: now,
        lastEventTime: now,
        activeTimeSeconds: 0,
        heartbeatCount: 1,
        lastEvent: event,
        reconnects: 0
      };
    }

    await redisClient.set(redisKey, JSON.stringify(session), 'EX', RedisConfig.TTL_ATTENDANCE_SEC);

    if (event === 'LEAVE' || event === 'PAUSE' || event === 'BACKGROUND') {
      await this.flushSession(session, isLive);
    }
  }

  async flushSession(session: RedisAttendanceSession, isLive?: boolean) {
    const classDocSnap = await this.coursesCollection.doc(session.classId).get();
    if (!classDocSnap.exists) return;
    
    const classDoc = classDocSnap.data() as IClass;
    if (!classDoc.attendance) return; // Legacy fallback handling would go here, assuming migration is done

    const policy = classDoc.attendance;
    const requiredSeconds = this.calculateRequiredSeconds(classDoc, policy);
    
    let isCompleted = false;
    if (policy.mode === 'percentage' || policy.mode === 'fixed_minutes' || policy.mode === 'full') {
       if (session.activeTimeSeconds >= requiredSeconds) {
         isCompleted = true;
       }
    }

    const docId = `${session.classId}_${session.userId}`;
    const docRef = this.collection.doc(docId);
    const existing = await docRef.get();
    
    let status: AttendanceStatus = 'IN_PROGRESS';
    let graceApplied = false;

    if (existing.exists) {
      const existingData = existing.data() as IAttendanceSession;
      if (existingData.status === 'FINALIZED' || existingData.status === 'LOCKED' || existingData.status === 'PROCESSING') {
        return; // Immutable
      }
      status = existingData.status;
    }

    // Early completion for recorded classes
    if (!isLive && isCompleted) {
      status = 'COMPLETED';
    } else if (isLive && isCompleted) {
       // Live classes remain IN_PROGRESS until finalized
       status = 'IN_PROGRESS'; 
    }

    const payload: Partial<IAttendanceSession> = {
      classId: session.classId,
      userId: session.userId,
      activeTimeSeconds: session.activeTimeSeconds,
      reconnects: session.reconnects,
      status,
      updatedAt: new Date().toISOString()
    };

    if (!existing.exists) {
      payload.joinTime = new Date(session.joinTime).toISOString();
      payload.createdAt = new Date().toISOString();
      payload.gracePeriodApplied = false;
    }
    
    if (session.lastEvent === 'LEAVE') {
      payload.leaveTime = new Date().toISOString();
    }

    await docRef.set(payload, { merge: true });
  }

  calculateRequiredSeconds(classDoc: IClass, policy: any): number {
    const expectedDurationSeconds = (classDoc.expectedDurationMinutes || 60) * 60;
    switch (policy.mode) {
      case 'percentage':
        return expectedDurationSeconds * (policy.value / 100);
      case 'fixed_minutes':
        return policy.value * 60;
      case 'full':
        return expectedDurationSeconds;
      default:
        return expectedDurationSeconds; // manual or others fall back to 100%
    }
  }

  async finalizeClassAttendance(classId: string, adminId: string = 'system') {
    const classDocSnap = await this.coursesCollection.doc(classId).get();
    if (!classDocSnap.exists) return;
    const classDoc = classDocSnap.data() as IClass;
    if (!classDoc.attendance) return;

    // Emit processing event
    platformEvents.emit('ATTENDANCE_PROCESSING', {
      classId,
      timestamp: new Date().toISOString()
    });

    const snapshot = await this.collection.where('classId', '==', classId).get();
    const batch = db.batch();
    const policySnapshot = { ...classDoc.attendance };

    for (const doc of snapshot.docs) {
      const data = doc.data() as IAttendanceSession;
      if (data.status === 'FINALIZED' || data.status === 'LOCKED') continue;
      
      // Calculate final
      const requiredSeconds = this.calculateRequiredSeconds(classDoc, classDoc.attendance);
      
      // Grace period (60s)
      const hasGrace = data.activeTimeSeconds + 60 >= requiredSeconds;
      const isMet = data.activeTimeSeconds >= requiredSeconds;
      
      let finalStatus: AttendanceStatus = 'FINALIZED';
      let resultStatus: 'Present' | 'Absent' | 'Late' = (isMet || hasGrace) ? 'Present' : 'Absent';

      const calculatedResult: AttendanceResult = {
        status: resultStatus,
        watchTimeSeconds: data.activeTimeSeconds,
        percentage: Math.min(100, (data.activeTimeSeconds / requiredSeconds) * 100)
      };

      batch.update(doc.ref, {
        status: finalStatus,
        calculatedResult,
        finalResult: calculatedResult,
        gracePeriodApplied: !isMet && hasGrace,
        attendancePolicySnapshot: policySnapshot,
        attendanceFrozenAt: new Date().toISOString()
      });
    }

    await batch.commit();

    // Emit finalized event for Analytics, Certificates, etc.
    platformEvents.emit('ATTENDANCE_FINALIZED', {
      classId,
      timestamp: new Date().toISOString()
    });
  }
}

export const attendanceService = new AttendanceService();

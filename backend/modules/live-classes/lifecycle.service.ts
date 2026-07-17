import { db } from '../../infrastructure/firebase';
import { AppError } from '../../core/errors/AppError';
import { ILiveSession } from './types';
import { EventBus, Events } from '../../core/events/EventBus';
import { logger } from '../../core/logger';
import { liveAttendanceService } from '../live-attendance/service';

export class LiveSessionLifecycleService {
  /**
   * Transitions a Live Session to a new state, enforcing rules.
   */
  async transitionState(
    sessionId: string,
    newState: ILiveSession['sessionStatus'],
    staffId: string
  ): Promise<ILiveSession> {
    const sessionRef = db.collection('live_sessions').doc(sessionId);
    const snap = await sessionRef.get();
    
    if (!snap.exists) {
      throw new AppError('Live session not found', 404);
    }
    
    const session = snap.data() as ILiveSession;

    // Rule: Cannot end class (completed/archived/recording_processing) if attendance is active
    if (['completed', 'archived', 'recording_processing'].includes(newState)) {
      if (session.lamsStatus === 'ATTENDANCE_ACTIVE') {
        throw new AppError('Cannot end class while attendance is active. Please end attendance first.', 409);
      }
    }

    // Rule: Only Attendance Owner or Admin can end attendance/class
    // Since this is the lifecycle engine, we check ownership if it's currently active.
    if (session.lamsStatus === 'ATTENDANCE_ACTIVE') {
      try {
        const activeLams = await liveAttendanceService.getActiveSession(sessionId);
        // If there's an active session, ensure staffId matches (or they are super_admin, which would be handled higher up)
        if (activeLams && activeLams.staffId !== staffId) {
            // Ideally we check roles here, but let's assume the controller passed down the staffId
            // The owner check should be strictly enforced.
            throw new AppError('Only the Attendance Owner can mutate this session state while attendance is active.', 403);
        }
      } catch(e) {
        if (e instanceof AppError) throw e;
        // else ignore if active session couldn't be fetched
      }
    }

    const now = new Date().toISOString();
    
    await sessionRef.update({
      sessionStatus: newState,
      updatedAt: now,
      updatedBy: staffId
    });

    // Fetch updated
    const updatedSnap = await sessionRef.get();
    const updatedSession = updatedSnap.data() as ILiveSession;

    // Emit Event
    await EventBus.emit(Events.LIVE_SESSION_STATUS_CHANGED, {
      sessionId,
      oldState: session.sessionStatus,
      newState,
      staffId,
      timestamp: now
    });

    logger.info(`[Lifecycle] Session ${sessionId} transitioned: ${session.sessionStatus} -> ${newState}`);

    return updatedSession;
  }

  /**
   * Helper: Start Live Stream
   */
  async startLive(sessionId: string, staffId: string) {
    return this.transitionState(sessionId, 'live_started', staffId);
  }

  /**
   * Helper: End Live Stream
   */
  async endLive(sessionId: string, staffId: string) {
    // Usually goes to recording_processing or completed
    return this.transitionState(sessionId, 'completed', staffId);
  }

  /**
   * Expose frontend lock flag: canEndClass
   */
  async canEndClass(sessionId: string): Promise<boolean> {
    const sessionRef = db.collection('live_sessions').doc(sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) return false;
    
    const session = snap.data() as ILiveSession;
    return session.lamsStatus !== 'ATTENDANCE_ACTIVE';
  }
}

export const liveSessionLifecycleService = new LiveSessionLifecycleService();

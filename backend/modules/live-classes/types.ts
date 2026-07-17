import { BaseAuditFields } from '../../core/types';

export interface ILiveSession extends BaseAuditFields {
  id?: string;
  tenantId: string;
  classId: string;
  provider: 'youtube_live' | 'zoom_live';
  encryptedVideoId?: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  title: string;
  startTime: string; // ISO string for Timestamp representation
  endTime: string;
  sessionStatus: 
    | 'scheduled' 
    | 'waiting'
    | 'live_started'
    | 'attendance_started'
    | 'attendance_ended'
    | 'recording_processing'
    | 'completed'
    | 'archived'
    | 'cancelled';
  visibility: 'public' | 'batch' | 'PUBLIC' | 'BATCH'; // accepting both cases for legacy code
  batchIds?: string[];

  // ─── LAMS: Staff Assignment ───────────────────────────────────────────────
  /** Staff member responsible for this live session (class override → subject default → course default) */
  assignedStaffId?: string;
  assignedStaffName?: string;

  // ─── LAMS: Active Attendance Session ─────────────────────────────────────
  /** ID of the currently active live_attendance_session (if any) */
  activeAttendanceSessionId?: string;
  /** High-level LAMS lifecycle status shown in UI */
  lamsStatus?: 'NOT_STARTED' | 'ATTENDANCE_ACTIVE' | 'ATTENDANCE_ENDED' | 'CLASS_ENDED';
}


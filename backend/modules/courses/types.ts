import { BaseAuditFields } from '../../core/types';

export interface ICourse extends BaseAuditFields {
  id?: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  visibility: 'public' | 'private' | 'restricted';
  courseStaffId?: string; // Primary default staff for the course
}

export interface ISubject extends BaseAuditFields {
  id?: string;
  courseId: string;
  name: string;
  order: number;
  defaultStaffId?: string; // Subject default staff override
}

export interface ITopic extends BaseAuditFields {
  id?: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface IClass extends BaseAuditFields {
  id?: string;
  topicId: string;
  title: string;
  teacherId?: string;
  order: number;
  classType: 'youtube_recorded' | 'youtube_live' | 'zoom_live';
  accessLevel: 'free' | 'premium' | 'batch';
  encryptedVideoId?: string; // Live stream ID or direct video ID
  encryptedRecordingId?: string; // Uploaded recording ID
  attendance: {
    mode: 'percentage' | 'fixed_minutes' | 'full' | 'manual' | 'first_join_only' | 'teacher_marked' | 'hybrid';
    value: number;
    version: number; // Increments on any admin modification
    lockAfterStart: boolean;
    allowEditBeforeStart: boolean;
  };
  scheduledStartTime?: string;
  expectedDurationMinutes?: number;
  extensionMinutes?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  meetingUrl?: string; // YouTube Broadcast ID or Zoom Meeting ID
  extensionLog?: Array<{ minutes: number; reason?: string; timestamp: string; adminId: string }>;
}

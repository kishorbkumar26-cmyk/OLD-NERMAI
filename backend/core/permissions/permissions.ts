// Central Registry for all actionable permissions in the system.
// This replaces string-based role matching ("teacher", "admin") with granular abilities.

export const Permissions = {
  // Course Management
  COURSE_READ: 'course:read',
  COURSE_CREATE: 'course:create',
  COURSE_UPDATE: 'course:update',
  COURSE_DELETE: 'course:delete',

  // Video Management (Deprecated for Resource Management, but kept for compatibility during transition)
  VIDEO_READ: 'video:read',
  VIDEO_UPLOAD: 'video:upload',
  VIDEO_UPDATE: 'video:update',
  VIDEO_DELETE: 'video:delete',

  // Resource Management
  RESOURCE_READ: 'resource:read',
  RESOURCE_CREATE: 'resource:create',
  RESOURCE_UPDATE: 'resource:update',
  RESOURCE_DELETE: 'resource:delete',

  // Student Management
  STUDENT_READ: 'student:read',
  STUDENT_CREATE: 'student:create',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  STUDENT_ENROLL: 'student:enroll',
  STUDENT_ASSIGN_ROLE: 'student:assign_role',

  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_MARK: 'attendance:mark',

  // Live Classes
  LIVE_CLASS_READ: 'live-class:read',
  LIVE_CLASS_CREATE: 'live-class:create',
  LIVE_CLASS_UPDATE: 'live-class:update',
  LIVE_CLASS_DELETE: 'live-class:delete',

  // Chatbot
  CHATBOT_ASK: 'chatbot:ask',
  CHATBOT_HISTORY_READ: 'chatbot-history:read',
  
  // Dashboard & Analytics
  METRICS_READ: 'metrics:read',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

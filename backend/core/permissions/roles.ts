import { Permissions, Permission } from './permissions';

export const RolePermissions: Record<string, Permission[]> = {
  // Super Admin has all permissions globally
  super_admin: Object.values(Permissions),

  // Admins can do almost everything within their tenant
  admin: [
    Permissions.COURSE_READ,
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.COURSE_DELETE,
    Permissions.VIDEO_READ,
    Permissions.VIDEO_UPLOAD,
    Permissions.VIDEO_UPDATE,
    Permissions.VIDEO_DELETE,
    Permissions.RESOURCE_READ,
    Permissions.RESOURCE_CREATE,
    Permissions.RESOURCE_UPDATE,
    Permissions.RESOURCE_DELETE,
    Permissions.STUDENT_READ,
    Permissions.STUDENT_CREATE,
    Permissions.STUDENT_UPDATE,
    Permissions.STUDENT_DELETE,
    Permissions.STUDENT_ENROLL,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_MARK,
    Permissions.LIVE_CLASS_READ,
    Permissions.LIVE_CLASS_CREATE,
    Permissions.LIVE_CLASS_UPDATE,
    Permissions.LIVE_CLASS_DELETE,
    Permissions.CHATBOT_ASK,
    Permissions.CHATBOT_HISTORY_READ,
    Permissions.METRICS_READ,
  ],

  // Teachers can manage content and students, but have limited admin access
  // (Policy constraints will limit them to *their own* courses/students)
  teacher: [
    Permissions.COURSE_READ,
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.VIDEO_READ,
    Permissions.VIDEO_UPLOAD,
    Permissions.VIDEO_UPDATE,
    Permissions.RESOURCE_READ,
    Permissions.RESOURCE_CREATE,
    Permissions.RESOURCE_UPDATE,
    Permissions.STUDENT_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_MARK,
    Permissions.LIVE_CLASS_READ,
    Permissions.LIVE_CLASS_CREATE,
    Permissions.LIVE_CLASS_UPDATE,
    Permissions.CHATBOT_ASK,
  ],

  // Students have very limited read/interaction permissions
  student: [
    Permissions.COURSE_READ,
    Permissions.VIDEO_READ,
    Permissions.RESOURCE_READ,
    Permissions.LIVE_CLASS_READ,
    Permissions.CHATBOT_ASK,
  ],
};

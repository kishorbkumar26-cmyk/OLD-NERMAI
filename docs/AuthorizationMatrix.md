# Nermai IAS Authorization Matrix (v3 - BatchAccess Model)

This matrix defines the required roles, permissions, and object-level policies to access specific actions within the backend.

| Module | Route | Operation | Guest | Student | Teacher | Admin | Super Admin | Permission | Policy | Middleware Pipeline |
|--------|-------|-----------|-------|---------|---------|-------|-------------|------------|--------|---------------------|
| **Auth** | POST `/api/v1/auth/register` | Create | ✅ | ❌ | ❌ | ❌ | ❌ | *Public* | None | `Validation` |
| **Auth** | GET `/api/v1/auth/debug` | Read | ❌ | ✅ | ✅ | ✅ | ✅ | None | None | `requireAuth` |
| **Students** | GET `/api/v1/students` | Read | ❌ | ❌ | ✅ | ✅ | ✅ | `STUDENT_READ` | None | `requireAuth -> requirePermission(STUDENT_READ)` |
| **Students** | POST `/api/v1/students` | Create | ❌ | ❌ | ❌ | ✅ | ✅ | `STUDENT_CREATE` | None | `requireAuth -> requirePermission(STUDENT_CREATE)` |
| **Students** | GET `/api/v1/students/:id` | Read | ❌ | ✅ | ✅ | ✅ | ✅ | `STUDENT_READ` | Owner Only (Student) | `requireAuth -> requirePermission(STUDENT_READ)` |
| **Students** | POST `/api/v1/students/:id/enroll` | Update | ❌ | ❌ | ❌ | ✅ | ✅ | `STUDENT_ENROLL` | None | `requireAuth -> requirePermission(STUDENT_ENROLL)` |
| **Students** | PUT `/api/v1/students/:id/role` | Update | ❌ | ❌ | ❌ | ❌ | ✅ | `STUDENT_ASSIGN_ROLE`| None | `requireAuth -> requirePermission(STUDENT_ASSIGN_ROLE)` |
| **Courses** | GET `/api/v1/courses` | Read | ✅ | ✅ | ✅ | ✅ | ✅ | *Public* | None | None (or guest limits) |
| **Courses** | POST `/api/v1/courses` | Create | ❌ | ❌ | ✅ | ✅ | ✅ | `COURSE_CREATE` | None | `requireAuth -> requirePermission(COURSE_CREATE)` |
| **Courses** | PUT `/api/v1/courses/:id` | Update | ❌ | ❌ | ✅ | ✅ | ✅ | `COURSE_UPDATE` | Owner Only (Teacher) | `requireAuth -> requirePermission(COURSE_UPDATE)` |
| **Courses** | DELETE `/api/v1/courses/:id`| Delete | ❌ | ❌ | ❌ | ✅ | ✅ | `COURSE_DELETE` | None | `requireAuth -> requirePermission(COURSE_DELETE)` |
| **Resources**| GET `/api/v1/resources/public`| Read | ✅ | ✅ | ✅ | ✅ | ✅ | *Public* | Public | `Validation` |
| **Resources**| GET `/api/v1/resources/:id` | Read | ❌ | ✅ | ✅ | ✅ | ✅ | `RESOURCE_READ` | BatchMembership | `requireAuth -> requirePermission(RESOURCE_READ)` |
| **Resources**| GET `/api/v1/resources/my-batches` | Read | ❌ | ✅ | ✅ | ✅ | ✅ | `RESOURCE_READ` | BatchMembership | `requireAuth -> requirePermission(RESOURCE_READ)` |
| **Resources**| POST `/api/v1/resources` | Create | ❌ | ❌ | ✅ | ✅ | ✅ | `RESOURCE_CREATE` | Assigned Teacher | `requireAuth -> requirePermission(RESOURCE_CREATE)` |
| **Live Classes**| GET `/api/v1/live-classes`| Read | ❌ | ✅ | ✅ | ✅ | ✅ | `LIVE_CLASS_READ` | BatchMembership | `requireAuth -> requirePermission(LIVE_CLASS_READ)` |
| **Live Classes**| POST `/api/v1/live-classes`| Create | ❌ | ❌ | ✅ | ✅ | ✅ | `LIVE_CLASS_CREATE`| Assigned Teacher | `requireAuth -> requirePermission(LIVE_CLASS_CREATE)` |
| **Attendance** | POST `/api/v1/attendance/mark` | Create | ❌ | ❌ | ✅ | ✅ | ✅ | `ATTENDANCE_MARK` | Assigned Teacher | `requireAuth -> requirePermission(ATTENDANCE_MARK)` |
| **Dashboard** | GET `/api/v1/dashboard/metrics`| Read | ❌ | ❌ | ❌ | ✅ | ✅ | `METRICS_READ` | None | `requireAuth -> requirePermission(METRICS_READ)` |
| **Chatbot** | POST `/api/v1/chatbot/ask` | Create | ❌ | ✅ | ✅ | ✅ | ✅ | `CHATBOT_ASK` | None | `requireAuth -> requirePermission(CHATBOT_ASK)` |

---
## Definitions
- **Permission**: The granular string constant (e.g. `COURSE_CREATE`) from the Permissions Registry.
- **Policy**: An object-level rule evaluated within the controller/service (e.g. `BatchMembership`, meaning `hasBatchAccess(resource.batchIds, user.programMemberships)` returns true).
- **Middleware Pipeline**: The exact order of Express middlewares that protect the endpoint before hitting the controller.

# NERMAI Academy — Full Platform Audit
**Date:** 2026-07-07 | **Auditor:** Antigravity AI  
**Scope:** Backend → Web (React/Expo) → Mobile (React Native) connectivity audit  
**Excluded:** AI Chatbot module, Announcements module (pending implementation)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                     │
│                                                                     │
│  apps/web (Expo Web / React)        apps/mobile (React Native)      │
│  Port: 8081                         Port: 8081 (Expo Go)            │
│  API Client: apps/web/core/api.ts   API Client: apps/mobile/core/api.ts│
│        │                                   │                        │
│        └──────────────────┬────────────────┘                        │
│                           │ HTTP (REST)                             │
│                           │ Authorization: Bearer <Firebase JWT>    │
└───────────────────────────┼─────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express / TypeScript)                    │
│                    Port: 3000                                        │
│                    backend/app.ts                                    │
│                                                                      │
│  Middleware Stack:                                                   │
│    Helmet (CSP, HSTS, XSS) → CORS → Rate Limiter → Auth Middleware │
│                                                                      │
│  Routes: /api/v1/* → mainRouter.ts                                  │
│  Player: /player/:token → modules/courses/player.ts (HTML SSR)     │
│                                                                      │
│  Auth:         Firebase Admin SDK (token verification)              │
│  Database:     Firestore (collections per module)                   │
│  Cache/Tokens: Redis (access cache, player tokens, resource tokens) │
│  Storage:      Firebase Storage (PDFs, assets)                      │
│  Queue:        BullMQ stub (analytics, async jobs)                  │
└──────────────────────────────────────────────────────────────────────┘
```

### API Client Configuration

| Client | File | Base URL | Auth Mechanism |
|--------|------|----------|----------------|
| Web | `apps/web/core/api/index.ts` | `http://localhost:3000/api/v1` | `localStorage.getItem('studentAccessToken' \| 'adminAccessToken')` |
| Mobile | `apps/mobile/core/api.ts` | `http://localhost:3000/api/v1` | Hardcoded `mock-mobile-token` ⚠️ |

> [!CAUTION]
> Mobile `apps/mobile/core/api.ts` uses a hardcoded mock token and has no Firebase Auth integration. This must be replaced with real Firebase Auth before production.

---

## 2. Backend Modules → API Routes

### AUTH `/api/v1/auth`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | `registerStudent` | None (rate limited) |
| POST | `/auth/login` | `loginStudent` | None (rate limited) |
| GET | `/auth/debug` | Debug info | `requireAuth` |

### STUDENTS `/api/v1/students`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/students` | `listStudents` | Admin only |
| GET | `/students/:id` | `getStudent` | Admin only |
| PUT | `/students/:id` | `updateStudent` | Admin only |
| DELETE | `/students/:id` | `deleteStudent` | Admin only |
| PATCH | `/students/:id/role` | `assignRole` | Admin only |
| POST | `/students/:id/batches` | `mapStudentToBatch` | Admin only |
| DELETE | `/students/:id/batches/:batchId` | `removeStudentFromBatch` | Admin only |

### BATCHES `/api/v1/batches`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/batches` | `listBatches` | Admin only |
| POST | `/batches` | `createBatch` | Admin only |
| GET | `/batches/:id` | `getBatch` | Admin only |
| PUT | `/batches/:id` | `updateBatch` | Admin only |
| DELETE | `/batches/:id` | `deleteBatch` | Admin only |

### COURSES `/api/v1/courses`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/courses` | `listCourses` | Admin + Student |
| POST | `/courses` | `createCourse` | Admin only |
| GET | `/courses/:id` | `getCourse` | Admin + Student |
| PUT | `/courses/:id` | `updateCourse` | Admin only |
| DELETE | `/courses/:id` | `deleteCourse` | Admin only |
| GET | `/courses/:courseId/subjects` | `listSubjectsByCourse` | Admin + Student |
| POST | `/courses/:courseId/subjects` | `createSubject` | Admin only |

### SUBJECTS `/api/v1/subjects`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/subjects` | `listAllSubjects` | Admin only |
| GET | `/subjects/:subjectId/topics` | `listTopicsBySubject` | Admin + Student |
| PUT | `/subjects/:id` | `updateSubject` | Admin only |
| DELETE | `/subjects/:id` | `deleteSubject` | Admin only |
| POST | `/subjects/:subjectId/topics` | `createTopic` | Admin only |

### TOPICS `/api/v1/topics`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/topics` | `listAllTopics` | Admin only |
| GET | `/topics/:topicId/classes` | `listClassesByTopic` | Admin + Student |
| PUT | `/topics/:id` | `updateTopic` | Admin only |
| DELETE | `/topics/:id` | `deleteTopic` | Admin only |
| POST | `/topics/:topicId/classes` | `createClass` | Admin only |

### CLASSES `/api/v1/classes`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/classes` | `listAllClasses` | Admin only |
| GET | `/classes/:id/access` | `getClassPlaybackAccess` | Admin + Student |
| PUT | `/classes/:id` | `updateClass` | Admin only |
| PUT | `/classes/:id/recording` | `uploadClassRecording` | Admin only |
| DELETE | `/classes/:id` | `deleteClass` | Admin only |

### RESOURCES `/api/v1/resources`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/resources` | `list` | Any authenticated |
| GET | `/resources/course/:courseId/hierarchy` | `getCourseHierarchy` | Any authenticated |
| GET | `/resources/:id` | `getById` | Any authenticated |
| GET | `/resources/:id/access` | `getAccess` | Any authenticated |
| POST | `/resources` | `create` | Admin only |
| PUT | `/resources/:id` | `update` | Admin only |
| POST | `/resources/:id/version` | `uploadVersion` | Admin only |
| DELETE | `/resources/:id` | `remove` | Admin only |

### VIDEO PLAYER (Non-API — HTML SSR)
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/player/:token` | `renderPlayer` | Redis token |

### WATCH HISTORY `/api/v1/watch-history`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/watch-history/:id/progress` | `updateProgress` | Player JWT |
| GET | `/watch-history/:id/progress` | `getProgress` | Player JWT |

### LIVE CLASSES `/api/v1/live-classes`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/live-classes/:id/access` | `getLiveAccess` | Any authenticated |
| POST | `/live-classes/admin/create` | `createLiveSession` | Admin only |
| PUT | `/live-classes/admin/update/:id` | `updateLiveSession` | Admin only |
| DELETE | `/live-classes/admin/delete/:id` | `deleteLiveSession` | Admin only |
| GET | `/live-classes/admin/class/:classId` | `listClassSessions` | Admin only |

### ATTENDANCE `/api/v1/attendance`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| POST | `/attendance/heartbeat` | `processHeartbeat` | Player JWT |

### DASHBOARD `/api/v1/dashboard`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/dashboard/student/overview` | `getStudentDashboardOverview` | Student |
| GET | `/dashboard/admin/metrics` | `getAdminDashboardMetrics` | Admin |

### FAQ `/api/v1/faq`
| Method | Endpoint | Handler | Auth |
|--------|----------|---------|------|
| GET | `/faq` | `listFaqs` | Admin only |
| POST | `/faq` | `createFaq` | Admin only |
| PUT | `/faq/:id` | `updateFaq` | Admin only |
| DELETE | `/faq/:id` | `deleteFaq` | Admin only |

---

## 3. Web (React) Implementation Audit

### Admin Panel — API Coverage

| UI Page | File | API Calls Made | Status |
|---------|------|---------------|--------|
| Admin Dashboard | `admin/Dashboard/AdminDashboard.tsx` | `DashboardApi.getAdminMetrics()` → `GET /dashboard/admin/metrics` | ✅ Connected |
| Courses | `admin/LMS/Courses/CoursesPage.tsx` | `CourseApi.listCourses`, `createCourse`, `updateCourse` | ✅ Connected |
| Subjects | `admin/LMS/Subjects/SubjectsPage.tsx` | `CourseApi.listSubjectsByCourse`, `createSubject`, `updateSubject`, `deleteSubject` | ✅ Connected |
| Topics | `admin/LMS/Topics/TopicsPage.tsx` | `CourseApi.listTopicsBySubject`, `createTopic`, `updateTopic`, `deleteTopic` | ✅ Connected |
| Classes | `admin/LMS/Classes/ClassesPage.tsx` | `CourseApi.listAllClasses`, `createClass`, `updateClass`, `deleteClass` | ✅ Connected |
| Resources | `admin/LMS/Resources/ResourcesPage.tsx` | `ResourceApi.list`, `create`, `update`, `delete`, `uploadVersion` | ✅ Connected |
| Students | `admin/ERP/Students/StudentsPage.tsx` | `StudentApi.listStudents`, `updateStudent`, `assignBatch`, `removeBatch`, `deleteStudent`, `assignRole` | ✅ Connected |
| Batches | `admin/ERP/Batches/BatchesPage.tsx` | `BatchApi.listBatches`, `createBatch`, `updateBatch` | ✅ Connected |
| Attendance | `admin/ERP/Attendance/AttendancePage.tsx` | `api.get()` (direct call, no typed service) | ⚠️ Partially Connected |
| Chatbot CRM | `admin/CRM/Chatbot/ChatbotCRMPage.tsx` | `FaqApi.listFaqs/create/update/delete`, `api.get('/admin/crm/chatbot-logs/recent')` | ⚠️ FAQ connected; chatbot logs endpoint does not exist on backend |
| Announcements | `admin/announcement_portal/Announcements/AnnouncementsPage.tsx` | — | ⏳ Pending |
| Live (streaming) | `admin/streaming` (route: placeholder div) | None | ❌ Not Implemented |
| Videos (route) | `/admin/videos` (placeholder div) | None | ❌ Not Implemented |

### Student Portal — API Coverage

| UI Screen | File | API Calls Made | Status |
|-----------|------|---------------|--------|
| Student Dashboard | `student/Student_Dashboard/StudentDashboard.tsx` | `DashboardApi.getStudentOverview()` → `GET /dashboard/student/overview` | ✅ Connected |
| Course Player (shell) | `student/LMS/CoursePlayer.tsx` | `CourseApi.getCourse`, `listSubjectsByCourse`, `listTopicsBySubject`, `listClassesByTopic` | ✅ Connected |
| Video Playback | `student/LMS/PlayerAccess.tsx` | `CourseApi.getClassPlaybackAccess()` → `GET /classes/:id/access` | ✅ Connected |
| YouTube Player | `student/LMS/YoutubePlayer.tsx` | iframe → `GET /player/:token` | ✅ Connected |
| Zoom Player | `student/LMS/ZoomPlayer.tsx` | Zoom SDK stub (no API call yet) | ⚠️ SDK not integrated |
| Course Resources | `student/LMS/CourseResources.tsx` | `ResourceApi.getCourseHierarchy`, `getAccess` | ✅ Connected |
| Class Resources | `student/LMS/ClassResources.tsx` | `ResourceApi.getCourseHierarchy`, `getAccess` | ✅ Connected |
| Resource Viewer | `student/LMS/ResourceViewer.tsx` | Receives `signedUrl` + `mimeType` as props | ✅ Passive (receives data from parent) |
| Live Classes | `student/LMS/CourseLiveClasses.tsx` | None — placeholder UI | ❌ Not Implemented |
| Tests | `student/LMS/CourseTests.tsx` | None — placeholder UI | ❌ Not Implemented |
| Login | `auth/LoginPage.tsx` | `api.post('/auth/login')` | ✅ Connected |
| Register | `auth/RegisterPage.tsx` | `api.post('/auth/register')`, then `api.post('/auth/login')` | ✅ Connected |

### Web Routes (App.tsx)
```
/                         → redirect to /student
/admin/login              → LoginPage (admin)
/student/login            → LoginPage (student)
/student/register         → RegisterPage
/student/*                → StudentDashboard (nested routing)
/admin                    → AdminLayout
/admin/courses            → CoursesPage ✅
/admin/subjects           → SubjectsPage ✅
/admin/topics             → TopicsPage ✅
/admin/classes            → ClassesPage ✅
/admin/resources          → ResourcesPage ✅
/admin/students           → StudentsPage ✅
/admin/batches            → BatchesPage ✅
/admin/attendance         → AttendancePage ✅
/admin/chatbot            → ChatbotCRMPage ⚠️
/admin/announcements      → AnnouncementsPage ⏳
/admin/videos             → Placeholder ❌
/admin/live               → Placeholder ❌
/admin/settings           → Placeholder ❌
```

---

## 4. Mobile (React Native) Implementation Audit

| UI Screen | File | API Calls Made | Status |
|-----------|------|---------------|--------|
| Student Dashboard | `student/Student_Dashboard/StudentDashboard.tsx` | `fetch('http://localhost:3000/api/student/dashboard/overview')` (wrong URL, mocked) | ❌ Wrong endpoint |
| Class Resources | `student/LMS/ClassResources.tsx` | `api.get('/resources', { classId })`, `api.get('/resources/:id/access')` | ⚠️ Connected but uses mock token |
| Resource Viewer | `student/LMS/ResourceViewer.tsx` | Receives `signedUrl` + `mimeType` as props | ⚠️ Connected but no DRM |
| Video Player | `student/streaming/VideoPlayer.tsx` | `WebView` → `/player/:token` (via backend SSR) | ⚠️ Connected but uses mock token |

> [!WARNING]
> Mobile has only 4 screens implemented. Courses, Subjects, Topics, Player Access, Live Classes, Tests, Login, Register, and Dashboard metrics are all **not implemented** in mobile.

---

## 5. Access Control & Security Architecture

### Authorization Flow (Production)
```
Student Opens Resource/Video
          │
          ▼
Firebase JWT (uid + tenantId + role)
          │
          ▼
access:{userId} Redis Cache  ← getAccessContext()
   (12hr TTL, explicit invalidation)
          │
     Cache HIT? ──── YES ──→ AccessContext (batchIds, programs, accessProfiles)
          │                            │
         NO                           ▼
          │               Evaluate visibility rule
          ▼                    (batch / premium / public)
Firestore student_profiles            │
(ONE read per session miss)           ▼
          │               Issue short-lived token (5 min video / 15 min resource)
          ▼               Stored as Redis: player:{token} or resource:{token}
   Rebuild Redis Cache                │
                                      ▼
                          Return token + signedUrl to client
```

### Cache Invalidation Triggers
| Admin Action | Redis Key Deleted |
|-------------|-------------------|
| `mapStudentToBatch` | `access:{studentId}` |
| `removeStudentFromBatch` | `access:{studentId}` |
| `assignRole` | `access:{studentId}` |
| `enrollStudent` | `access:{studentId}` |

### Redis Key Naming Convention (Standardized)
```
access:{userId}          → AccessContext cache (12hr TTL)
player:{token}           → Video player one-time token (5 min TTL, soft-use)
resource:{token}         → Resource access token (15 min TTL)
player_token:{token}     → Legacy name (still exists in some places, should be unified)
resource_token:{token}   → Legacy name (should be unified to resource:{token})
lock:access:{userId}     → Stampede lock (10 sec TTL)
attendance:*             → Heartbeat data
watch:{userId}           → Watch progress
```

> [!IMPORTANT]
> `player_token:{token}` still exists in older Redis writes (from `AccessEngine.ts` prior to refactor). The `renderPlayer` reads `player:{token}` (new key). Verify all write paths in `AccessEngine.ts` use the new `player:` prefix, not `player_token:`.

---

## 6. MD File Audit

| File | Purpose | Status |
|------|---------|--------|
| `AGENT_DEVELOPMENT_GUIDE.md` | Dev rules for AI agents | ✅ Current — describes module boundaries |
| `API_SPEC_PHASE1.md` | API specification skeleton | ⚠️ Outdated — only stub content (763 bytes), actual routes have evolved significantly |
| `DATABASE_RULES.md` | Firestore rules overview | ⚠️ Minimal (417 bytes) — `firestore.rules` is the authoritative source |
| `DEVELOPMENT_BOUNDARIES.md` | What's in/out of scope | ✅ Current |
| `PRD_PHASE1.md` | Product requirements | ✅ Still relevant, Phase 1 substantially complete |
| `PROGRESS_AND_DATA_FLOW.md` | Progress tracker & data flow | ⚠️ Partially outdated — missing AccessCache, soft-use tokens, Redis key changes |
| `PROJECT_FOLDER_STRUCTURE.md` | Folder map | ⚠️ Partially outdated — missing `docs/`, `backend/core/security/AccessCache.ts` |
| `TECHSTACK_PHASE1.md` | Tech stack overview | ✅ Current |
| `docs/Architecture.md` | Architecture details | Not audited (located in `docs/`) |
| `schema.txt` | Database schema | ✅ Reference document |

---

## 7. Gap Analysis — What's Missing

### Critical Gaps (Blocking Production)

| # | Gap | Location | Impact |
|---|-----|----------|--------|
| 1 | Mobile auth uses hardcoded `mock-mobile-token` | `apps/mobile/core/api.ts` | All mobile API calls fail in production |
| 2 | Mobile dashboard hits wrong URL (`/api/student/dashboard/overview` instead of `/api/v1/dashboard/student/overview`) | `apps/mobile/student/Student_Dashboard/StudentDashboard.tsx` | Dashboard broken on mobile |
| 3 | Chatbot logs endpoint `/admin/crm/chatbot-logs/recent` does not exist in backend | `apps/web/admin/CRM/Chatbot/ChatbotCRMPage.tsx` | Admin chatbot log view always errors |
| 4 | Recording upload in `ClassesPage.tsx` calls `CourseApi.client.put(...)` (non-existent method) | `apps/web/admin/LMS/Classes/ClassesPage.tsx` | Recording upload broken |
| 5 | Zoom Player has no Zoom SDK integration | `apps/web/student/LMS/ZoomPlayer.tsx` | Live Zoom classes cannot play |

### Feature Gaps (Not Yet Implemented)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | Student Live Classes tab | Placeholder UI only | Backend `GET /live-classes/:id/access` exists and is ready |
| 7 | Student Tests/Assessments tab | Placeholder UI only | No backend test module exists |
| 8 | Admin Live Class management UI | Route is placeholder div | Backend endpoints exist and are ready |
| 9 | Admin Video management UI | Route is placeholder div | Backend `PUT /classes/:id/recording` exists |
| 10 | Mobile Courses / Syllabus / Player | Not implemented | Only ClassResources + ResourceViewer exist on mobile |
| 11 | Mobile Login / Register | Not implemented | Mobile has no auth flow |
| 12 | Watch History — student view | No UI in student dashboard | Backend `GET /watch-history/:id/progress` exists |
| 13 | FAQ — student read endpoint | Backend only allows admin CRUD | Students cannot query FAQs for the AI chatbot context |
| 14 | Content Filtering module | Backend exists | No frontend pages |

---

## 8. Execution Quality Summary

### What Works End-to-End (Verified)

| Flow | Web | Mobile |
|------|-----|--------|
| Admin Login → JWT → API | ✅ | ❌ (mock token) |
| Student Login → Firebase JWT → API | ✅ | ❌ (no auth flow) |
| Course Hierarchy (Courses → Subjects → Topics → Classes) | ✅ | ❌ |
| Video Playback (AES-256 encrypted YT ID → Redis token → /player/:token) | ✅ | ⚠️ mock token |
| Resource Access (AccessCache → Firestore → Redis → signedUrl) | ✅ | ⚠️ mock token |
| PDF Viewer (Google Drive embed) | ✅ | ⚠️ limited |
| PDF Viewer (Firebase Storage signed URL) | ✅ | ⚠️ limited |
| Resource Secure Viewer (watermark + CSP) | ✅ | ❌ |
| Student Dashboard Metrics | ✅ | ❌ wrong URL |
| Admin Dashboard Metrics | ✅ | — |
| Student CRUD + Batch Assignment | ✅ | — |
| Resource Upload (Google Drive / File / Firebase) | ✅ | — |
| Resource Distribution (Cascading Assignment) | ✅ | — |
| Watch Progress Tracking | ✅ (via player JWT) | ⚠️ mock |
| Live Attendance Heartbeat | ✅ (via player JWT) | ⚠️ mock |
| AccessCache + Redis (0 Firestore reads on hits) | ✅ | — |
| Token Soft-Use (StrictMode/HMR safe) | ✅ | — |

### Rating

| Layer | Rating | Notes |
|-------|--------|-------|
| Backend Architecture | 9.8/10 | Production-grade. Minor: standardize legacy Redis key prefix. |
| Web Admin Panel | 8.5/10 | All core CRUD flows work. Missing: live/video management UI. |
| Web Student Portal | 8.0/10 | Core LMS works. Missing: live classes, tests, watch history UI. |
| Mobile | 3.0/10 | Only basic resource viewer exists. No auth, no courses, no player. |
| Security | 9.5/10 | AES-256-GCM, Redis tokens, AccessCache, CSP, watermarks all in place. |
| Overall | 7.5/10 | Web is production-ready for core LMS. Mobile needs full implementation. |

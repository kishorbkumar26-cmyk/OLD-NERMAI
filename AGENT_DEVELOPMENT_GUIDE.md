# NERMAI Agent Development Guide

Version: 1.0  
Status: Production Standard  
Type: Master Development Rulebook  

---

# IMPORTANT

This document is the official source of truth for:

- Project architecture
- Database architecture
- Folder architecture
- Module boundaries
- Development rules

All developers and AI agents MUST follow this.

No exceptions.

---

# DATABASE IMMUTABILITY RULE

IMPORTANT:

The database schema is finalized.

DO NOT:

- Delete collections
- Rename collections
- Rename fields
- Change hierarchy
- Restructure references
- Nest unrelated collections

ALLOWED:

- Add optional fields
- Add new collections only if absolutely required
- Add indexes

ONLY IF BACKWARD COMPATIBLE.

The database is the permanent contract.

Reference: Approved Firestore Production Schema (44 Collections)

---

# PROJECT STACK

## Frontend

Mobile:

- React Native
- Expo SDK Latest
- TypeScript
- Expo Router
- React Query
- Zustand
- React Hook Form
- NativeWind
- Axios

Web Admin:

- Next.js
- TypeScript
- Tailwind CSS
- ShadCN

---

## Backend

- Node.js
- Express.js
- TypeScript
- Firebase Admin SDK
- Zod
- Winston
- BullMQ
- Redis
- JWT
- AES-256

---

## Database

- Firestore
- Firebase Storage
- Firebase Auth
- Firebase Cloud Messaging

---

# BACKEND STRUCTURE

This structure MUST be followed.

backend/
├── core/
├── admin/
├── student/
├── routes/
├── controllers/
├── models/

Domain structure inside admin and student MUST remain modular.

---

# FRONTEND STRUCTURE

Frontend MUST mirror backend.

This is mandatory.

frontend/
├── core/
├── admin/
├── student/
├── app/
├── components/

Same domain names.

Same ownership.

Same API boundaries.

---

# DATABASE STRUCTURE

This is the approved production database.

---

# CORE MODULE

## tenants

/tenants/{tenantId}

Fields:

- name
- code
- settings
- status

---

## users

/users/{userId}

Fields:

- tenantId
- role
- name
- phone
- email
- accessTier
- status

---

## students

/students/{studentId}

Fields:

- userId
- admissionNo
- currentBatchId
- subscriptionType
- joinedAt

---

## staff

/staff/{staffId}

Fields:

- userId
- department
- designation
- salary

---

## staff_roles

/staff_roles/{staffRoleId}

Fields:

- staffId
- roleType
- permissions[]
- assignedAt

---

# ACADEMIC MODULE

## batches

/batches/{batchId}

Fields:

- tenantId
- name
- type
- parentBatchId
- startDate
- endDate

---

## batch_memberships

/batch_memberships/{membershipId}

Fields:

- studentId
- batchId
- joinedAt
- leftAt
- status

Purpose:

Student transfer support.

Do NOT store batch history inside students.

---

## courses

/courses/{courseId}

Fields:

- tenantId
- name
- description
- price
- visibility

---

## enrollments

/enrollments/{enrollmentId}

Fields:

- studentId
- courseId
- batchId
- paymentStatus
- enrolledAt

Purpose:

One student can have multiple courses.

---

## subjects

/subjects/{subjectId}

Fields:

- courseId
- name
- order

---

## topics

/topics/{topicId}

Fields:

- subjectId
- name
- order

---

## classes

/classes/{classId}

Fields:

- topicId
- title
- teacherId
- order
- isLive
- accessLevel

---

# CONTENT MODULE

## videos

/videos/{videoId}

Fields:

- classId
- sourceType
- encryptedVideoId
- duration
- visibility

IMPORTANT:

YouTube IDs must remain encrypted.

Never store raw IDs.

---

## resources

/resources/{resourceId}

Fields:

- classId
- type
- title
- fileUrl
- visibility

---

## live_sessions

/live_sessions/{sessionId}

Fields:

- classId
- batchId
- provider
- startTime
- endTime
- status

Use Zoom.

---

## watch_history

/watch_history/{watchId}

Fields:

- studentId
- videoId
- watchedSeconds
- completed
- updatedAt

---

# TEST MODULE

Do NOT change structure.

## tests

/tests/{testId}

---

## test_targets

/test_targets/{targetId}

---

## questions

/questions/{questionId}

---

## question_translations

/question_translations/{translationId}

---

## attempts

/attempts/{attemptId}

---

## attempt_answers

/attempt_answers/{answerId}

---

## daily_quizzes

/daily_quizzes/{dailyQuizId}

---

# FINANCE MODULE

## fees
## payments
## fee_reminders
## ledger
## transactions
## expense_categories
## expenses
## income_sources
## wallets
## refunds

Must remain isolated.

Do NOT merge financial logic into enrollments.

---

# CRM MODULE

## crm_leads
## admissions
## chatbot_logs
## referrals
## coupons
## crm_followups
## alumni_feedback
## campaigns

---

# COMMUNICATION MODULE

## announcements

Target support:

- all
- free
- premium
- batch
- individual
- staff

---

## notifications

Per-user.

---

## conversations

Only metadata.

Do NOT store full message arrays.

---

## messages

Root-level collection.

Required.

Do NOT nest inside conversations.

Correct:

/messages/{messageId}

Wrong:

/conversations/{conversationId}/messages/{messageId}

---

## support_tickets

For escalations.

---

## user_devices

Stores FCM tokens.

---

# SYSTEM MODULE

## audit_logs
## analytics
## certificates
## access_rules
## documents

---

# MANDATORY RULES

Every collection must contain:

- createdAt
- updatedAt
- createdBy
- updatedBy
- isDeleted
- deletedAt
- deletedBy

This is mandatory.

---

# VIDEO SECURITY RULES

Recorded:

Workflow:

1. Admin enters YouTube URL
2. Backend extracts video ID
3. Encrypts with AES-256
4. Stores encryptedVideoId
5. Raw ID discarded

Student flow:

1. Request access
2. Verify JWT
3. Decrypt in memory
4. Create player token
5. Serve secure player

Frontend must NEVER see raw YouTube ID.

---

# LIVE SESSION RULES

Provider:

Zoom

Attendance must track:

- joinTime
- leaveTime
- totalDuration

---

# FIRESTORE RULES

DO NOT:

- Deeply nest collections
- Store large arrays
- Store large read receipts arrays
- Store messages inside conversations
- Store questions inside tests

Correct:

Flat top-level collections.

---

# MODULE OWNERSHIP RULE

Each module owner owns:

LMS:

- courses
- subjects
- topics
- classes
- resources
- videos
- watch_history

Streaming:

- live_sessions
- attendance

CRM:

- chatbot_logs

Finance:

- fees
- payments
- ledger

Communication:

- announcements
- notifications
- conversations
- messages

No developer should modify another module’s owned collections without approval.

---

# FINAL RULE

This is the permanent production architecture.

All development must follow this.

No schema deviation allowed.
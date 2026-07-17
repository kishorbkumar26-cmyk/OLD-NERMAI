# NERMAI Phase 1 Product Requirement Document (PRD)

Version: 1.0
Status: Production Development
Owner: UNISTRIX IT SOLUTIONS

---

# DATABASE IMMUTABILITY RULE

IMPORTANT:

Agents/developers MUST NOT remove, rename, or restructure any existing database collection or attribute from the approved NERMAI schema.

They may ONLY add new attributes or collections if absolutely necessary and backward-compatible.

Future modules must integrate into the existing schema without breaking contracts.

---

# Product Overview

NERMAI is a multi-tenant educational platform designed to support:

- LMS
- ERP
- CRM
- Live classes
- Recorded classes
- Student engagement

Phase 1 focuses only on:

- LMS Core
- AI Chatbot
- Video Streaming
- Attendance Tracking
- Admin Dashboard
- Student Dashboard

Test engine will be integrated later.

---

# Scope

## Included Modules

### LMS

- Course Management
- Subject Management
- Topic Management
- Class Management
- Notes Upload
- Learning Resources
- Content Filtering
- Test Materials Upload (No execution engine)

---

### CRM

Only:

- AI Chatbot

---

### Video

- Recorded videos
- Live Zoom classes

---

### Attendance

- Live attendance
- Recorded watch tracking

---

### Dashboards

- Admin dashboard
- Student dashboard

---

# Excluded Modules

- Test engine
- Fee management
- Staff management
- Full CRM
- Admissions
- Marketing campaigns
- Announcements system
- Hall tickets
- Certificates

---

# User Roles

## Admin

Can:

- Create courses
- Upload notes
- Upload videos
- Create live sessions
- Manage content filtering
- View analytics
- View attendance
- Use AI chatbot analytics

---

## Student

Can:

- View courses
- View resources
- Watch videos
- Join live sessions
- View attendance
- Access chatbot

---

# Core Functional Requirements

---

# LMS MODULE

## Course Management

Admin can:

- Create course
- Edit course
- Archive course
- Assign visibility

Collections:

courses
subjects
topics
classes

---

## Notes Upload

Admin uploads:

- PDF
- DOC
- Notes

Stored in:

resources

---

## Learning Resources

Supports:

- PDFs
- Downloadables
- External references

---

## Content Filtering

Types:

- free
- premium
- batch-specific
- student-specific

Collection:

access_rules

---

# VIDEO STREAMING

## Recorded Video Workflow

### Admin Upload

1. Admin submits YouTube URL.

Example:

https://youtube.com/watch?v=XYZ123

2. Backend extracts:

XYZ123

3. Encrypts using AES-256

4. Stores:

encrypted_video_id

5. Raw ID discarded

---

### Student Playback

1. Student clicks video

2. Frontend:

GET /student/video/:id/access

3. Backend:

- verifies JWT
- decrypts ID in memory
- creates short-lived player token

4. Returns:

playerToken

5. Frontend loads:

/player/:token

6. Backend injects YouTube ID into secure HTML

7. React Native never sees raw ID

---

## Security Features

- Hidden YouTube IDs
- Tokenized playback
- Expiring sessions
- Anti-inspect deterrent

---

# LIVE CLASS WORKFLOW

Provider:

Zoom

---

## Admin

Creates:

- title
- zoomMeetingId
- zoomJoinUrl
- startTime
- endTime

Stored:

live_sessions

---

## Student

Requests:

GET /student/live/:id/access

Backend:

- verifies JWT
- returns temporary join token

Frontend:

Opens Zoom WebView

---

# Attendance Tracking

## Live

Tracks:

- joinTime
- leaveTime
- totalDuration
- sessionCompletion

---

## Recorded

Tracks:

- watchedSeconds
- completion %
- resumeTime

Stored:

watch_history

---

# AI CHATBOT

Supports:

- FAQ
- syllabus guidance
- navigation help
- student doubts

Stores:

chatbot_logs

---

# ADMIN DASHBOARD

Working modules:

- Total courses
- Total classes
- Total resources
- Total videos
- Live sessions
- Attendance %
- Chatbot queries
- Watch analytics

Placeholder buttons:

- ERP
- CRM
- Test Portal
- Fees
- Staff
- Admissions

Must NOT implement.

---

# STUDENT DASHBOARD

Shows:

- My courses
- Continue watching
- Upcoming live classes
- Notes
- Resources
- Attendance
- Chatbot

---

# Non Functional Requirements

- Scalable to 10k+ users
- Low latency
- Secure video delivery
- Modular
- Firebase-compatible
- Mobile-first

---

# Performance Targets

API latency:

<300ms

Video access:

<500ms

Attendance writes:

<150ms

Chatbot:

<2 seconds

---

# Future Ready

Reserved for future:

- Test engine
- ERP
- Fees
- Admissions
- Certificates
- Marketing
- Announcements
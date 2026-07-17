# NERMAI Project Folder Structure

Version: 1.0  
Status: Production Standard  
Architecture Type: Domain-Driven Modular Architecture  

---

# IMPORTANT

This is the official project folder structure.

It must be followed across the entire project.

This structure is permanent.

Frontend and backend must mirror each other.

No module should be developed outside this architecture.

---

# Backend Structure

```text
backend/
├── core/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   ├── services/
│   ├── validators/
│   ├── constants/
│   ├── helpers/
│   ├── jobs/
│   └── firebase/
│
├── admin/
│   ├── announcement_portal/
│   │
│   ├── CRM/
│   │   ├── Admission_registration_management/
│   │   ├── AI_Chatbot/
│   │   ├── feedback_and_alumini_management/
│   │   ├── Fee_reminder_and_communication_management/
│   │   ├── Marketing_campaigns/
│   │   └── Student_Enquiry_and_lead_management/
│   │
│   ├── ERP/
│   │   ├── fees_management/
│   │   ├── id_card_or_hall_ticket_generation/
│   │   ├── marks_and_performance_management/
│   │   ├── overall_institutional_analytics/
│   │   ├── staff_management/
│   │   └── student_management/
│   │
│   ├── LMS/
│   │   ├── course_management/
│   │   ├── notes_upload/
│   │   ├── learning_resources/
│   │   ├── content_filtering/
│   │   ├── video_management/
│   │   └── quiz/
│   │
│   ├── streaming/
│   │   ├── recorded_video_proxy/
│   │   ├── live_zoom_sessions/
│   │   └── attendance_tracking/
│   │
│   └── test_portal/
│       ├── question_bank_management/
│       ├── test_creation_and_scheduling/
│       └── test_review_and_answer_key/
│
├── student/
│   ├── ERP_Dashboard/
│   │
│   ├── LMS/
│   │   ├── course_access/
│   │   ├── notes_access/
│   │   ├── resources_access/
│   │   ├── content_filtering/
│   │   └── quiz/
│   │
│   ├── Student_Dashboard/
│   │
│   ├── streaming/
│   │   ├── video_player/
│   │   ├── live_classes/
│   │   └── attendance_tracking/
│   │
│   ├── chatbot/
│   │
│   └── test_portal/
│       ├── auto_evaluation_engine/
│       ├── examination_engine/
│       └── test_review_and_answer_key/
│
├── routes/
├── controllers/
├── models/
└── app.ts
```

---

# Frontend Structure

```text
frontend/
├── core/
│   ├── config/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── constants/
│   ├── store/
│   ├── providers/
│   └── types/
│
├── admin/
│   ├── announcement_portal/
│   │
│   ├── CRM/
│   │   ├── Admission_registration_management/
│   │   ├── AI_Chatbot/
│   │   ├── feedback_and_alumini_management/
│   │   ├── Fee_reminder_and_communication_management/
│   │   ├── Marketing_campaigns/
│   │   └── Student_Enquiry_and_lead_management/
│   │
│   ├── ERP/
│   │   ├── fees_management/
│   │   ├── id_card_or_hall_ticket_generation/
│   │   ├── marks_and_performance_management/
│   │   ├── overall_institutional_analytics/
│   │   ├── staff_management/
│   │   └── student_management/
│   │
│   ├── LMS/
│   │   ├── course_management/
│   │   ├── notes_upload/
│   │   ├── learning_resources/
│   │   ├── content_filtering/
│   │   ├── video_management/
│   │   └── quiz/
│   │
│   ├── streaming/
│   │   ├── recorded_video_proxy/
│   │   ├── live_zoom_sessions/
│   │   └── attendance_tracking/
│   │
│   └── test_portal/
│       ├── question_bank_management/
│       ├── test_creation_and_scheduling/
│       └── test_review_and_answer_key/
│
├── student/
│   ├── ERP_Dashboard/
│   │
│   ├── LMS/
│   │   ├── course_access/
│   │   ├── notes_access/
│   │   ├── resources_access/
│   │   ├── content_filtering/
│   │   └── quiz/
│   │
│   ├── Student_Dashboard/
│   │
│   ├── streaming/
│   │   ├── video_player/
│   │   ├── live_classes/
│   │   └── attendance_tracking/
│   │
│   ├── chatbot/
│   │
│   └── test_portal/
│       ├── auto_evaluation_engine/
│       ├── examination_engine/
│       └── test_review_and_answer_key/
│
├── app/
├── components/
└── assets/
```

---

# Architecture Rules

## 1. Frontend and Backend Mirror Rule

Frontend and backend must always have matching modules.

Example:

Backend:

```text
admin/LMS/course_management/
```

Frontend:

```text
admin/LMS/course_management/
```

This ensures:

- API consistency
- Easier debugging
- Clear ownership
- Easy onboarding
- Better AI-agent support

---

## 2. Domain Ownership Rule

Each module owns its own business logic.

Example:

LMS owns:

- courses
- subjects
- topics
- classes
- resources
- videos

Streaming owns:

- live_sessions
- attendance
- watch_history

CRM owns:

- chatbot_logs
- leads
- campaigns

ERP owns:

- fees
- payments
- ledger
- refunds

Test Portal owns:

- tests
- questions
- attempts

---

## 3. No Cross-Domain Pollution

Bad:

```text
LMS/course_management/fees_logic.ts
```

Wrong.

Correct:

```text
ERP/fees_management/
```

Each module stays isolated.

---

## 4. Shared Logic Rule

Reusable logic must go inside:

```text
core/
```

Examples:

- Firebase initialization
- JWT verification
- Validators
- Helpers
- Constants
- Queue jobs

---

## 5. Future Expansion Rule

New modules must fit inside the existing structure.

Do not create random folders.

Always attach under:

- admin/
- student/
- core/

---

# Final Rule

This is the permanent project structure.

All future development must follow this.

No exceptions.
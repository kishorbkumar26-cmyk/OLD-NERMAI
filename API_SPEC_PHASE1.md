# NERMAI Phase 1 API Contracts

---

# LMS

POST /admin/course/create
PUT /admin/course/update/:id
GET /student/course/list

POST /admin/subject/create
POST /admin/topic/create
POST /admin/class/create

---

# Resources

POST /admin/resource/upload
GET /student/resources/:classId

---

# Videos

POST /admin/video/create
GET /student/video/:id/access
GET /player/:token

---

# Live

POST /admin/live/create
GET /student/live/:id/access

---

# Attendance

POST /attendance/live/start
POST /attendance/live/end
POST /attendance/video/progress

GET /student/attendance

---

# Chatbot

POST /chatbot/ask
GET /admin/chatbot/logs

---

# Dashboards

GET /dashboard/admin/overview
GET /dashboard/student/home
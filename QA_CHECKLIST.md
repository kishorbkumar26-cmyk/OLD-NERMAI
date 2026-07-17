# Stage 2 & 3: RC1 QA Validation Checklist

This document serves as the formal release gating checklist for Manual Synchronization (Stage 2) and Failure Testing (Stage 3). 
Execute these tests with the Web App open alongside a Mobile Emulator (or physical device).

---

## 1. Stage 2: Cross-Platform Synchronization

| Scenario | Steps to Reproduce | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Web → Mobile Chat** | Send a message from Web browser. | Appears instantly on Mobile chat. | [ ] |
| **Mobile → Web Chat** | Send a message from Mobile app. | Appears instantly on Web browser. | [ ] |
| **Web → Web Chat** | Send a message from Web Tab 1. | Appears instantly in Web Tab 2. | [ ] |
| **Mobile → Mobile Chat** | Send a message from Mobile Device 1. | Appears instantly on Mobile Device 2. | [ ] |
| **Teacher Announcement** | Teacher sends an announcement. | Announcement styling appears immediately on all clients. | [ ] |
| **Teacher Pins** | Teacher pins a message on Web. | Message shows pinned styling everywhere. | [ ] |
| **Teacher Deletes** | Teacher deletes a message on Web. | Message disappears from all active clients immediately. | [ ] |
| **Student Likes** | Student A clicks "Helpful" on a Doubt. | Reaction count increments accurately on all clients. | [ ] |
| **Question Answered** | Teacher marks a question as Answered. | Status updates to "Answered" (Green check) on all clients. | [ ] |
| **Reply Thread Sync** | User replies to a comment. | Reply renders correctly on every platform's thread view. | [ ] |
| **Hidden Comment** | Teacher hides a comment. | Disappears for students, but remains visible (dimmed) to authorized staff. | [ ] |
| **New User Joins Mid-Session**| Student joins an active live class. | Receives the latest pinned messages and recent chat history instantly. | [ ] |

---

## 2. Attendance Integrity

| Scenario | Steps to Reproduce | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Leave before 5 minutes** | Join class, stay 4m 59s, leave. | No heartbeat recorded. DB unchanged. | [ ] |
| **Stay beyond 10 minutes** | Join class, stay 10m 5s. | Two heartbeat intervals accurately recorded in DB. | [ ] |
| **Refresh after 4:59** | Hard refresh browser exactly at 4m 59s. | No duplicate or premature heartbeat sent. | [ ] |
| **Join from two browsers** | Same user joins from 2 Web tabs simultaneously. | Only one attendance stream counted; DB not inflated. | [ ] |
| **Analytics Update** | Complete video on Web. Dashboard refreshes. | Study Time and Attendance cards on dashboard increment accurately. | [ ] |

---

## 3. Stage 3: Failure & Edge Case Testing

| Scenario | Steps to Reproduce | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Wi-Fi Loss (Mobile)** | Join class, disable Wi-Fi for 30s, reconnect. | Chat resumes polling, no duplicated messages or attendance. | [ ] |
| **Slow Network (3G)** | Throttle network to 3G/High Latency. | UI remains responsive and eventually synchronizes without crash. | [ ] |
| **Browser Sleep/Wake** | Close laptop lid for 5 min, reopen. | Playback and polling recover without duplicate heartbeats/messages. | [ ] |
| **Backend Restart** | Stop Node.js server during live session, restart. | Clients show reconnecting state, recover seamlessly when UP. | [ ] |
| **Redis Restart** | Stop Redis server, start after 30s. | Auth middleware/cache recovers without logging users out. | [ ] |
| **Browser Refresh** | Hard refresh (F5) during playback. | Video resumes from correct timestamp, chat reloads correctly. | [ ] |
| **Mobile Background** | Send app to background for 60s, return. | Polling paused while in BG, resumes instantly on FG. | [ ] |
| **Teacher Logout** | Teacher logs out while viewing chat on another tab. | Attempting moderation action yields 401/403. | [ ] |
| **VPN Switch** | Toggle VPN connection on/off during class. | Socket/Polling survives IP change without crashing. | [ ] |
| **Device Time Change** | Fast-forward device time by 1 hour manually. | Client time manipulation does not inflate/affect attendance DB tracking. | [ ] |
| **Token Expiry** | Wait for JWT to expire during live class. | User is prompted to reauthenticate or token refreshes gracefully. | [ ] |

---

## 4. Data Integrity Checks
After completing the manual scenarios, verify backend state directly in the Firebase Emulator/Console:
- `[ ]` No duplicate attendance documents per user per class.
- `[ ]` No duplicate comments from connection drops.
- `[ ]` Correct reaction counts (no negative or inflated numbers).
- `[ ]` Accurate analytics totals.
- `[ ]` Expected audit logs generated (if tracking moderator actions).
- `[ ]` No orphaned or partially written records.

---

## 5. QA Execution Log
*Use this template to record test runs for regression tracking.*

- **Date / Time**: YYYY-MM-DD HH:MM
- **QA Tester(s)**: [Name]
- **Environment**: [Staging / Local]
- **App Version / Build**: [v1.X.X-RC1]
- **Backend Version**: [v1.X.X]
- **Devices Used**: [e.g., Chrome v115 Web, Android 13 Emulator]
- **Pass / Fail Status**: [PASS / FAIL]
- **Notes / Bugs Found**: [Links to issues]

---

## 6. Exit Criteria & Severity Classification

### Severity Definitions
| Severity | Description | RC1 Decision |
| :--- | :--- | :--- |
| **Critical** | Data corruption, attendance loss, authentication bypass | **Block Release** |
| **High** | Cross-platform sync failure, missing moderation enforcement | **Block Release** |
| **Medium** | Incorrect UI state that recovers after refresh | **Review before release** |
| **Low** | Minor visual or spacing issues | **Can be deferred if approved** |

### Release Candidate 1 (RC1) Sign-off Gates
> [!IMPORTANT]
> The following criteria **must** be met to approve the release:
> - `[ ]` 100% of Stage 2 synchronization tests passed.
> - `[ ]` 100% of Stage 3 failure tests passed.
> - `[ ]` No Critical severity defects.
> - `[ ]` No High severity defects.
> - `[ ]` Medium defects accepted only if formally documented and approved.
> - `[ ]` Performance meets agreed load testing thresholds (k6).
> - `[ ]` Security authorization checks pass.
> - `[ ]` Attendance accuracy verified (Data Integrity Checklist).

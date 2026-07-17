# ADR 005: Smart Attendance Engine

## Status
Accepted

## Context
Unlike physical classrooms, e-learning requires proof of engagement. Simple "clicked link" metrics are easily gamed. We needed a system to verify that a student legitimately consumed the required content (VOD or Live) to mark attendance.

## Decision
We implemented a Smart Checkpoint and Watch History Engine.

1. **Granular Checkpointing**: The React Native and Web video players emit `watch_progress` heartbeats to the backend at regular intervals (e.g., every 30 seconds).
2. **Offline Queueing**: On mobile, if the network drops, these heartbeats are enqueued in an atomic `expo-sqlite` database and automatically flushed via background sync when connectivity is restored.
3. **Threshold Calculation**: The backend aggregates the discrete watch segments. If the total unique seconds watched exceeds the threshold (e.g., 85% of total video duration), the backend automatically generates an `Attendance` record for that Class.
4. **Live Class Extensibility**: This same architecture will process connection/disconnection logs from Zoom/Custom WebRTC to calculate Live Attendance.

## Consequences
- **Positive**: Provides undeniable, robust metrics for student engagement. Protects against offline data loss.
- **Negative**: Generates high write-volume to the backend. Resolved by batching checkpoints on the client and leveraging Redis or buffered writes on the server if scaling becomes necessary.

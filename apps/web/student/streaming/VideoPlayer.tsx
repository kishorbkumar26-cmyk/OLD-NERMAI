/**
 * VideoPlayer.tsx — Streaming directory entry point
 *
 * This file re-exports the MeetingPlayerFactory component from the LMS directory.
 * Actual logic for player authentication and instantiation lives in:
 *   apps/web/student/LMS/MeetingPlayerFactory.tsx
 *   apps/web/student/LMS/YoutubePlayer.tsx
 *   apps/web/student/LMS/ZoomMeetingPlayer.tsx
 */
export { MeetingPlayerFactory as VideoPlayer } from '../LMS/MeetingPlayerFactory';
export { YoutubePlayer } from '../LMS/YoutubePlayer';

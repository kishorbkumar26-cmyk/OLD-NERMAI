import { z } from 'zod';

export const createLiveSessionSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1),
  provider: z.enum(['youtube_live', 'zoom_live']),
  youtubeVideoId: z.string().optional(),
  zoomMeetingId: z.string().optional(),
  zoomJoinUrl: z.string().url().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionStatus: z.enum(['scheduled', 'live', 'ended', 'cancelled']).default('scheduled'),
  visibility: z.enum(['public', 'batch', 'PUBLIC', 'BATCH']),
}).refine(data => {
  if (data.provider === 'youtube_live' && !data.youtubeVideoId) {
    return false;
  }
  if (data.provider === 'zoom_live' && (!data.zoomMeetingId || !data.zoomJoinUrl)) {
    return false;
  }
  return true;
}, {
  message: "Missing provider specific fields (youtubeVideoId for youtube_live, zoomMeetingId and zoomJoinUrl for zoom_live)",
  path: ["provider"]
});

export const updateLiveSessionSchema = z.object({
  title: z.string().min(1).optional(),
  sessionStatus: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  visibility: z.enum(['public', 'batch', 'PUBLIC', 'BATCH']).optional(),
});

import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().default(''),
  price: z.number().min(0, 'Price must be positive'),
  visibility: z.enum(['public', 'private', 'restricted']).default('private'),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createSubjectSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  name: z.string().min(1, 'Subject name is required'),
  order: z.number().int().default(0),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createTopicSchema = z.object({
  subjectId: z.string().min(1, 'subjectId is required'),
  name: z.string().min(1, 'Topic name is required'),
  order: z.number().int().default(0),
});

export const updateTopicSchema = createTopicSchema.partial();

const baseClassSchema = z.object({
  topicId: z.string().min(1, 'topicId is required'),
  title: z.string().min(1, 'Class title is required'),
  teacherId: z.string().optional(),
  order: z.number().int().default(0),
  accessLevel: z.enum(['free', 'premium', 'batch']).default('premium'),
  attendance: z.object({
    mode: z.enum(['percentage', 'fixed_minutes', 'full', 'manual', 'first_join_only', 'teacher_marked', 'hybrid']),
    value: z.number().min(0),
    version: z.number().int().default(1),
    lockAfterStart: z.boolean().default(true),
    allowEditBeforeStart: z.boolean().default(true)
  }).optional() // Optional for backward compatibility before migration
});

export const createClassSchema = z.discriminatedUnion('classType', [
  baseClassSchema.extend({
    classType: z.literal('youtube_recorded'),
    youtubeUrl: z.string().url().regex(/(youtube\.com|youtu\.be)/, 'Must be a valid YouTube URL'),
  }),
  baseClassSchema.extend({
    classType: z.literal('youtube_live'),
    youtubeUrl: z.string().url().regex(/(youtube\.com|youtu\.be)/, 'Must be a valid YouTube URL').optional(),
    scheduledStartTime: z.string().min(1, 'Scheduled start time is required'),
    expectedDurationMinutes: z.number().int().positive('Duration must be positive'),
  }),
  baseClassSchema.extend({
    classType: z.literal('zoom_live'),
    meetingNumber: z.string().min(1, 'Meeting number is required'),
    scheduledStartTime: z.string().min(1, 'Scheduled start time is required'),
    expectedDurationMinutes: z.number().int().positive('Duration must be positive'),
  }),
]);

export const updateClassSchema = z.object({
  topicId: z.string().optional(),
  title: z.string().optional(),
  teacherId: z.string().optional(),
  order: z.number().int().optional(),
  classType: z.enum(['youtube_recorded', 'youtube_live', 'zoom_live']).optional(),
  accessLevel: z.enum(['free', 'premium', 'batch']).optional(),
  youtubeUrl: z.string().url().optional(),
  meetingNumber: z.string().optional(),
  scheduledStartTime: z.string().optional(),
  expectedDurationMinutes: z.number().int().positive().optional(),
  attendance: z.object({
    mode: z.enum(['percentage', 'fixed_minutes', 'full', 'manual', 'first_join_only', 'teacher_marked', 'hybrid']),
    value: z.number().min(0),
    version: z.number().int(),
    lockAfterStart: z.boolean(),
    allowEditBeforeStart: z.boolean()
  }).optional(),
});

export const extendClassSchema = z.object({
  minutes: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60)
  ]),
  reason: z.string().optional(),
});


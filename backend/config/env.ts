import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  AES_SECRET_KEY: z.string().min(1, 'AES_SECRET_KEY is required'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  REDIS_REQUIRED: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  FCM_SERVER_KEY: z.string().optional(),
  FIREBASE_API_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:8081,http://localhost:3000'),
  ADMIN_ID: z.string().default('admin@nermai.com'),
  ADMIN_PASSWORD: z.string().default('123456'),
  WATCH_PROGRESS_INTERVAL: z.coerce.number().default(90),
  ATTENDANCE_HEARTBEAT_INTERVAL: z.coerce.number().default(300),
  VIDEO_COMPLETION_PERCENT: z.coerce.number().default(95),
  ATTENDANCE_MIN_PERCENTAGE: z.coerce.number().default(50),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;

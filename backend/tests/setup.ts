// Set environment variables to point Firebase Admin to the emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.NODE_ENV = 'test';
process.env.REDIS_REQUIRED = 'false';

// These mock values satisfy the Zod schema validation in env.ts
process.env.FIREBASE_PROJECT_ID = 'demo-test';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMOCK\\n-----END PRIVATE KEY-----';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.AES_SECRET_KEY = 'test-aes-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

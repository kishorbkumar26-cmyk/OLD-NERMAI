import { logger } from '../core/logger';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// Assumes GOOGLE_APPLICATION_CREDENTIALS is set, or running locally via Firebase CLI
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'nermai-academy-backend'
});

const db = getFirestore();

// Extracted from AGENT_DEVELOPMENT_GUIDE.md
const collections = [
  'tenants', 'users', 'students', 'staff', 'staff_roles',
  'batches', 'batch_memberships', 'courses', 'enrollments', 'subjects', 'topics', 'classes',
  'videos', 'resources', 'live_sessions', 'watch_history',
  'tests', 'test_targets', 'questions', 'question_translations', 'attempts', 'attempt_answers', 'daily_quizzes',
  'fees', 'payments', 'fee_reminders', 'ledger', 'transactions', 'expense_categories', 'expenses', 'income_sources', 'wallets', 'refunds',
  'crm_leads', 'admissions', 'chatbot_logs', 'referrals', 'coupons', 'crm_followups', 'alumni_feedback', 'campaigns',
  'announcements', 'notifications', 'conversations', 'messages', 'support_tickets', 'user_devices',
  'audit_logs', 'analytics', 'certificates', 'access_rules', 'documents'
];

async function initializeCollections() {
  logger.info('Initializing Firestore collections...');
  const batch = db.batch();

  for (const col of collections) {
    // Create a dummy document in each collection so the collection appears in the Firebase Console
    const docRef = db.collection(col).doc('_schema_init');
    batch.set(docRef, {
      initializedAt: FieldValue.serverTimestamp(),
      note: `Initialized collection ${col} as per AGENT_DEVELOPMENT_GUIDE.md schema.`
    }, { merge: true });
    logger.info(`Prepared initialization for collection: ${col}`);
  }

  try {
    await batch.commit();
    logger.info('Successfully initialized all backend collections in Firestore!');
  } catch (error) {
    logger.error('Failed to initialize collections:', error);
  }
}

initializeCollections().catch(logger.error);

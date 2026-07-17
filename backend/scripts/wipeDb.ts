import { logger } from '../core/logger';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env';

const run = async () => {
  try {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    const db = getFirestore();
    const collectionsToWipe = [
      'student_profiles',
      'courses',
      'videos',
      'resources',
      'live_sessions',
      'watch_history'
    ];

    for (const collectionName of collectionsToWipe) {
      logger.info(`Wiping collection: ${collectionName}...`);
      const snapshot = await db.collection(collectionName).get();
      const batchSize = snapshot.size;
      
      if (batchSize === 0) {
        logger.info(`${collectionName} is empty.`);
        continue;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logger.info(`Deleted ${batchSize} documents from ${collectionName}`);
    }

    logger.info('Database wipe completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error wiping database:', error);
    process.exit(1);
  }
};

run();

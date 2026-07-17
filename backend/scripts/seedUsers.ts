import { logger } from '../core/logger';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

    const auth = getAuth();
    const db = getFirestore();

    const usersToCreate = [
      {
        email: 'admin@nermai.com',
        password: 'password123',
        displayName: 'Super Admin',
        role: 'super_admin',
        programMemberships: [],
      },
      {
        email: 'student@nermai.com',
        password: 'password123',
        displayName: 'Test Student',
        role: 'student',
        programMemberships: [{
          batchId: 'mock_upsc_2026',
          joinedAt: new Date().toISOString(),
          status: 'active'
        }],
      }
    ];

    for (const u of usersToCreate) {
      let uid = '';
      try {
        const existing = await auth.getUserByEmail(u.email);
        logger.info(`User ${u.email} already exists.`);
        uid = existing.uid;
        
        // Update password if it already exists, just in case
        await auth.updateUser(uid, { password: u.password, displayName: u.displayName });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          logger.info(`Creating user: ${u.email}`);
          const newUser = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.displayName,
          });
          uid = newUser.uid;
        } else {
          throw e;
        }
      }

      logger.info(`Setting custom claims for ${u.email} (UID: ${uid})`);
      await auth.setCustomUserClaims(uid, {
        role: u.role,
        tenantId: 'default_tenant',
        programMemberships: u.programMemberships
      });

      logger.info(`Syncing profile to Firestore for ${u.email}`);
      const profileRef = db.collection('student_profiles').doc(uid);
      await profileRef.set({
        id: uid,
        name: u.displayName,
        email: u.email,
        phoneNumber: '',
        tenantId: 'default_tenant',
        status: 'active',
        programMemberships: u.programMemberships,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true }); // Use merge so we don't wipe out existing data
    }

    logger.info('Successfully seeded users!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding users:', error);
    process.exit(1);
  }
};

run();

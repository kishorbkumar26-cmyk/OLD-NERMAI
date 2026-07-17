import { logger } from '../core/logger';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';
import * as path from 'path';

// Parse command line args
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const roleIndex = args.indexOf('--role');
const tenantIndex = args.indexOf('--tenant');

const email = emailIndex !== -1 ? args[emailIndex + 1] : null;
const role = roleIndex !== -1 ? args[roleIndex + 1] : 'super_admin';
const tenantId = tenantIndex !== -1 ? args[tenantIndex + 1] : 'default_tenant';

if (!email) {
  logger.error('Usage: tsx setAdminClaims.ts --email <email> [--role <role>] [--tenant <tenantId>]');
  process.exit(1);
}

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
    logger.info(`Fetching user by email: ${email}`);
    const user = await auth.getUserByEmail(email);
    
    logger.info(`Setting claims for UID: ${user.uid}`);
    await auth.setCustomUserClaims(user.uid, {
      role,
      tenantId,
      accessTier: 'premium'
    });

    logger.info(`Successfully set claims for ${email}: role=${role}, tenantId=${tenantId}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error setting claims:', error);
    process.exit(1);
  }
};

run();

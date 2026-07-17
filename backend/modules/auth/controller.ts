import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../../infrastructure/firebase';
import { z } from 'zod';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

const normalizeMobile = (mobile: string) => {
  // Strip all non-numeric characters, add a + prefix if needed. For simplicity, just strip spaces/dashes.
  return mobile.replace(/\D/g, ''); 
};

export const registerStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, firstName, lastName } = registerSchema.parse(req.body);
    const normalizedMobile = phone ? normalizeMobile(phone) : null;
    const name = `${firstName} ${lastName}`.trim();

    // 1. Create Firebase User via Admin SDK (Use real email now)
    const userRecord = await auth.createUser({
      email,
      password: password,
      displayName: name,
    });

    const uid = userRecord.uid;

    // 2. Set Custom Claims (Role/Tenant)
    await auth.setCustomUserClaims(uid, {
      role: 'student',
      tenantId: 'default_tenant'
    });

    // 3. Batch write Firestore profile and identity_lookup records
    const batch = db.batch();

    const profileRef = db.collection('student_profiles').doc(uid);
    batch.set(profileRef, {
      id: uid,
      rollNo: null, // Admin assigns this later
      name,
      displayName: name,
      firstName,
      lastName,
      email,
      phoneNumber: normalizedMobile,
      tenantId: 'default_tenant',
      status: 'active',
      programMemberships: [],
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: uid,
      updatedBy: uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    });

    const emailLookupRef = db.collection('identity_lookup').doc(email.toLowerCase());
    batch.set(emailLookupRef, { uid });

    if (normalizedMobile) {
      const mobileLookupRef = db.collection('identity_lookup').doc(normalizedMobile);
      batch.set(mobileLookupRef, { uid });
    }

    await batch.commit();

    res.status(201).json({
      status: 'success',
      data: {
        uid,
        email,
        phone: normalizedMobile,
        name,
        firstName,
        lastName,
        role: 'student'
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const loginStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    // ── ADMIN HARDCODED BYPASS ────────────────────────────────────────────────
    // Admin never goes through identity_lookup or Firebase Auth.
    // Credentials are set via ADMIN_ID and ADMIN_PASSWORD in .env
    if (identifier.trim() === env.ADMIN_ID) {
      if (password !== env.ADMIN_PASSWORD) {
        return res.status(401).json({ status: 'error', message: 'Invalid admin credentials' });
      }
      // Issue a long-lived JWT with admin claims
      const adminToken = jwt.sign(
        {
          userId: 'admin_root',
          user_id: 'admin_root',
          email: 'admin@nermai.internal',
          name: 'System Admin',
          role: 'super_admin',
          tenantId: 'default_tenant',
          isAdmin: true,
        },
        env.JWT_SECRET,
        { expiresIn: '12h' }
      );
      return res.status(200).json({
        status: 'success',
        data: {
          token: adminToken,
          refreshToken: null,
          expiresIn: '43200',
          localId: 'admin_root',
          role: 'super_admin'
        }
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    let searchId = identifier.trim().toLowerCase();

    // If it looks like a mobile number (just digits and +), normalize it
    if (/^[\d+]+$/.test(searchId)) {
      searchId = normalizeMobile(searchId);
    }

    if (!env.FIREBASE_API_KEY) {
      throw new Error('FIREBASE_API_KEY is not configured in backend environment variables');
    }

    // 1. Resolve UID from identity_lookup
    const lookupDoc = await db.collection('identity_lookup').doc(searchId).get();
    
    if (!lookupDoc.exists) {
       return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    const { uid } = lookupDoc.data()!;

    // 2. Fetch canonical email from student_profiles
    const profileDoc = await db.collection('student_profiles').doc(uid).get();
    
    if (!profileDoc.exists) {
       return res.status(401).json({ status: 'error', message: 'User profile not found' });
    }

    const canonicalEmail = profileDoc.data()!.email;

    // 3. Use Firebase Identity Toolkit REST API to verify password using canonical email
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`;
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: canonicalEmail,
        password: password,
        returnSecureToken: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Return 401 for bad credentials
      if (data.error && data.error.message === 'INVALID_LOGIN_CREDENTIALS') {
         return res.status(401).json({ status: 'error', message: 'Invalid Credentials' });
      }
      return res.status(400).json({ status: 'error', message: data.error?.message || 'Login failed' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        token: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        localId: data.localId
      }
    });

  } catch (error: any) {
    next(error);
  }
};

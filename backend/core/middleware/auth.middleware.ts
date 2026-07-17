import { Request, Response, NextFunction } from 'express';
import { auth } from '../../infrastructure/firebase';
import { AppError } from '../errors/AppError';
import { logger } from '../logger';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    logger.info(`Received Auth Header: ${authHeader?.substring(0, 30)}...`);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid auth header prefix');
      throw new AppError('Unauthorized: Missing or invalid token', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    
    // DEV BYPASS for local testing
    if (token === 'DEV_ADMIN_TOKEN') {
      req.user = {
        userId: 'dev_admin_123',
        tenantId: 'default_tenant',
        role: 'super_admin',
        programMemberships: [],
      };
      return next();
    }
    if (token === 'DEV_STUDENT_TOKEN') {
      req.user = {
        userId: 'TgjDWxOoKigtYqVKs6aMC2SRKht2', // KISHOR — real student enrolled in batch-43
        tenantId: 'default_tenant',
        role: 'student',
        programMemberships: [],
        // Note: batch membership is resolved at request time via AccessCache,
        // never embedded in the token.
      };
      return next();
    }

    let customError: any;
    // Try to verify as our custom Admin JWT first
    try {
      const decodedCustom = jwt.verify(token, env.JWT_SECRET) as any;
      if (decodedCustom && decodedCustom.isAdmin) {
        req.user = {
          userId: decodedCustom.userId,
          tenantId: decodedCustom.tenantId || 'default_tenant',
          role: decodedCustom.role || 'super_admin',
          programMemberships: [],
        };
        logger.info(`Auth verified via Custom Admin JWT for UID: ${decodedCustom.userId}`);
        return next();
      }
    } catch (e) {
      customError = e;
      logger.warn('Custom Admin JWT verification failed (falling through to Firebase)', { error: e });
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      logger.info(`Auth verified for UID: ${decodedToken.uid}`, { claims: decodedToken });

      // According to the PRD, custom claims should hold tenantId, role, accessTier.
      // Fallbacks provided for development if claims are not fully set yet.
      req.user = {
        userId: decodedToken.uid,
        tenantId: (decodedToken.tenantId as string) || 'default_tenant',
        role: (decodedToken.role as string) || 'student',
        programMemberships: (decodedToken.programMemberships as any[]) || [],
        // currentBatchId intentionally NOT read from JWT.
        // Access context (batchIds, programs) is resolved via AccessCache on each request.
      };

      return next();
    } catch (fbError) {
      logger.warn('Authentication failed (both Custom JWT and Firebase)', { customError, fbError });
      return next(new AppError(`Unauthorized: Custom JWT Error: ${customError?.message} | Firebase Error: ${(fbError as any)?.message}`, 401));
    }
  } catch (error) {
    logger.warn('Authentication failed in wrapper', { error });
    next(new AppError('Unauthorized: Token verification failed completely', 401));
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Forbidden: User not authenticated', 403));
    }
    
    // allow super_admin to access anything, or check if role is in allowed list
    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return next(new AppError(`Forbidden: Requires one of roles [${allowedRoles.join(', ')}]`, 403));
  };
};

export const requirePlayerJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new AppError('Unauthorized: Missing player token', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (!decoded || !decoded.userId || !decoded.classId) {
      throw new AppError('Unauthorized: Invalid player token payload', 401);
    }

    // Attach decoded player info directly to req (or req.user)
    req.user = {
      userId: decoded.userId,
      tenantId: 'default_tenant', // Not strictly needed for player tracking but keeps types happy
      role: 'student',
      programMemberships: [],
    };
    (req as any).sessionId = decoded.jti;
    
    // We can also attach the classId for convenience if needed, but it's in req.body usually.
    next();
  } catch (error) {
    logger.warn('Player JWT authentication failed', { error });
    next(new AppError('Unauthorized: Player token verification failed', 401));
  }
};

import { Request, Response, NextFunction } from 'express';
import { StudentLiveService } from './service';

const studentLiveService = new StudentLiveService();

export const getLiveAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { deviceId, sessionId } = req.query as { deviceId?: string, sessionId?: string };
    const { userId, tenantId, programMemberships } = req.user!;
    const email = (req.user as any).email || 'student@nermai.com';
    const accessData = await studentLiveService.generateLiveAccessProxy(id, userId, email, programMemberships, tenantId, deviceId, sessionId);
    res.status(200).json({ status: 'success', data: accessData });
  } catch (error) { next(error); }
};


import { LiveSessionService } from './service';
import * as Validators from './validator';

const liveService = new LiveSessionService();

export const createLiveSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = Validators.createLiveSessionSchema.parse(req.body);
    const { userId, tenantId } = req.user!;
    const session = await liveService.createLiveSession(parsedData, userId, tenantId);
    res.status(201).json({ status: 'success', data: session });
  } catch (error) { next(error); }
};

export const updateLiveSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsedData = Validators.updateLiveSessionSchema.parse(req.body);
    const { userId, tenantId } = req.user!;
    const session = await liveService.updateLiveSession(id, parsedData, userId, tenantId);
    res.status(200).json({ status: 'success', data: session });
  } catch (error) { next(error); }
};

export const deleteLiveSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId, tenantId } = req.user!;
    await liveService.deleteLiveSession(id, userId, tenantId);
    res.status(200).json({ status: 'success', message: 'Live session deleted successfully' });
  } catch (error) { next(error); }
};

export const listClassSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId as string;
    const { tenantId } = req.user!;
    const sessions = await liveService.getSessionsByClass(classId, tenantId);
    res.status(200).json({ status: 'success', data: sessions });
  } catch (error) { next(error); }
};

import { liveSessionLifecycleService } from './lifecycle.service';

export const startLiveClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId } = req.user!;
    const session = await liveSessionLifecycleService.startLive(id, userId);
    res.status(200).json({ status: 'success', data: session });
  } catch (error) { next(error); }
};

export const endLiveClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { userId } = req.user!;
    const session = await liveSessionLifecycleService.endLive(id, userId);
    res.status(200).json({ status: 'success', data: session });
  } catch (error) { next(error); }
};

import { LiveSessionRepository } from './repository';
import { ILiveSession } from './types';
import { ClassRepository } from '../courses/repository';
import { Policies } from '../../core/permissions/policies';
import { AppError } from '../../core/errors/AppError';
import { encrypt, decrypt } from '../../core/utils/aes.util';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../../infrastructure/redis';

export class StudentLiveService {
  private liveRepo = new LiveSessionRepository();

  async generateLiveAccessProxy(id: string, userId: string, studentEmail: string, programMemberships: any[], tenantId: string, deviceId?: string, sessionId?: string) {
    const session = await this.liveRepo.findById(id);
    if (!session || session.tenantId !== tenantId) {
      throw new AppError('Live session not found', 404);
    }

    // Must evaluate access before serving
    const userBatchIds = programMemberships ? programMemberships.map(m => m.batchId) : [];
    const isAllowed = session.visibility === 'public' || Policies.hasBatchAccess(session.batchIds || [], userBatchIds);

    if (!isAllowed) {
      throw new AppError('You do not have permission to access this live session', 403);
    }

    // For youtube_live
    if (session.provider === 'youtube_live') {
      if (!session.encryptedVideoId) throw new AppError('Corrupted session data', 500);

      const token = uuidv4();
      const payload = {
        sourceType: session.provider,
        encryptedVideoId: session.encryptedVideoId,
        studentId: userId,
        studentEmail: studentEmail,
        deviceId: deviceId || 'unknown',
        sessionId: sessionId || 'unknown',
        issuedAt: Date.now()
      };

      await redisClient.set(`player:${token}`, JSON.stringify(payload), 'EX', 120);
      return { playerToken: token, cacheable: false, provider: session.provider };
    }

    // For zoom_live
    if (session.provider === 'zoom_live') {
      if (!session.zoomJoinUrl || !session.zoomMeetingId) throw new AppError('Corrupted zoom session data', 500);
      
      const token = uuidv4();
      const payload = {
        sourceType: session.provider,
        zoomMeetingId: session.zoomMeetingId,
        zoomJoinUrl: session.zoomJoinUrl,
        studentId: userId,
        studentEmail: studentEmail,
        deviceId: deviceId || 'unknown',
        sessionId: sessionId || 'unknown',
        issuedAt: Date.now()
      };

      await redisClient.set(`player:${token}`, JSON.stringify(payload), 'EX', 120);
      return { playerToken: token, cacheable: false, provider: session.provider, zoomJoinUrl: session.zoomJoinUrl };
    }

    throw new AppError('Unsupported live provider', 400);
  }
}


export class LiveSessionService {
  private liveRepo = new LiveSessionRepository();
  private classRepo = new ClassRepository();

  async createLiveSession(
    data: {
      classId: string;
      title: string;
      provider: 'youtube_live' | 'zoom_live';
      youtubeVideoId?: string;
      zoomMeetingId?: string;
      zoomJoinUrl?: string;
      startTime: string;
      endTime: string;
      sessionStatus: 'scheduled' | 'live' | 'ended' | 'cancelled';
      visibility: 'public' | 'batch' | 'PUBLIC' | 'BATCH';
    },
    userId: string,
    tenantId: string
  ) {
    const classDoc = await this.classRepo.findById(data.classId);
    if (!classDoc) {
      throw new AppError('Parent class not found', 404);
    }

    const payload: Omit<ILiveSession, keyof import('../../core/types').BaseAuditFields | 'id'> = {
      tenantId,
      classId: data.classId,
      provider: data.provider,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      sessionStatus: data.sessionStatus,
      visibility: data.visibility,
    };

    if (data.provider === 'youtube_live' && data.youtubeVideoId) {
      payload.encryptedVideoId = encrypt(data.youtubeVideoId);
    } else if (data.provider === 'zoom_live') {
      payload.zoomMeetingId = data.zoomMeetingId;
      payload.zoomJoinUrl = data.zoomJoinUrl;
    }

    return await this.liveRepo.create(payload, userId);
  }

  async updateLiveSession(
    id: string,
    data: Partial<Pick<ILiveSession, 'title' | 'sessionStatus' | 'startTime' | 'endTime' | 'visibility'>>,
    userId: string,
    tenantId: string
  ) {
    const session = await this.liveRepo.findById(id);
    if (!session || session.tenantId !== tenantId) {
      throw new AppError('Live session not found', 404);
    }

    // Clean undefined fields
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] === undefined) {
        delete data[key as keyof typeof data];
      }
    });

    await this.liveRepo.update(id, data, userId);
    return await this.liveRepo.findById(id);
  }

  async deleteLiveSession(id: string, userId: string, tenantId: string) {
    const session = await this.liveRepo.findById(id);
    if (!session || session.tenantId !== tenantId) {
      throw new AppError('Live session not found', 404);
    }
    await this.liveRepo.softDelete(id, userId);
  }

  async getSessionsByClass(classId: string, tenantId: string) {
    const sessions = await this.liveRepo.findByClassId(classId);
    return sessions.filter((s: ILiveSession) => s.tenantId === tenantId);
  }
}

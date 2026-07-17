import { db } from '../../infrastructure/firebase';
import { ILiveSession } from './types';
import { BaseAuditFields } from '../../core/types';

export const LIVE_SESSIONS_COLLECTION = 'live_sessions';

export class LiveSessionRepository {
  private collection = db.collection(LIVE_SESSIONS_COLLECTION);

  private generateAuditFields(userId: string): BaseAuditFields {
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
  }

  async create(data: Omit<ILiveSession, keyof BaseAuditFields | 'id'>, userId: string): Promise<ILiveSession> {
    const docRef = this.collection.doc();
    const payload: ILiveSession = {
      ...data,
      ...this.generateAuditFields(userId),
      id: docRef.id,
    };
    await docRef.set(payload);
    return payload;
  }

  async update(id: string, data: Partial<ILiveSession>, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
  }

  async findById(id: string): Promise<ILiveSession | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as ILiveSession;
    if (data.isDeleted) return null;
    return data;
  }

  async findByClassId(classId: string): Promise<ILiveSession[]> {
    const snapshot = await this.collection
      .where('classId', '==', classId)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as ILiveSession);
  }
}

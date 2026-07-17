import { db } from '../../infrastructure/firebase';
import { LMS_COLLECTIONS } from './constants';
import { BaseAuditFields } from '../../core/types';
import { ICourse, ISubject, ITopic, IClass } from './types';

class BaseRepository {
  protected generateAuditFields(userId: string): BaseAuditFields {
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

  protected generateUpdateAuditFields(userId: string): Partial<BaseAuditFields> {
    return {
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };
  }
}

export class CourseRepository extends BaseRepository {
  private collection = db.collection(LMS_COLLECTIONS.COURSES);

  async create(data: Omit<ICourse, keyof BaseAuditFields>, userId: string): Promise<ICourse> {
    const docRef = this.collection.doc();
    const payload: ICourse = {
      ...data,
      ...this.generateAuditFields(userId),
      id: docRef.id,
    };
    await docRef.set(payload);
    return payload;
  }

  async update(id: string, data: Partial<ICourse>, userId: string): Promise<void> {
    const payload = {
      ...data,
      ...this.generateUpdateAuditFields(userId),
    };
    await this.collection.doc(id).update(payload);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    });
  }

  async findById(id: string): Promise<ICourse | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as ICourse;
    if (data.isDeleted) return null;
    return data;
  }

  async findAllByTenant(tenantId: string): Promise<ICourse[]> {
    const snapshot = await this.collection
      .where('tenantId', '==', tenantId)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as ICourse);
  }

  async findByNameAndTenant(name: string, tenantId: string): Promise<ICourse[]> {
    const snapshot = await this.collection
      .where('tenantId', '==', tenantId)
      .where('name', '==', name)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as ICourse);
  }
}

export class SubjectRepository extends BaseRepository {
  private collection = db.collection(LMS_COLLECTIONS.SUBJECTS);

  async create(data: Omit<ISubject, keyof BaseAuditFields>, userId: string): Promise<ISubject> {
    const docRef = this.collection.doc();
    const payload: ISubject = {
      ...data,
      ...this.generateAuditFields(userId),
      id: docRef.id,
    };
    await docRef.set(payload);
    return payload;
  }

  async update(id: string, data: Partial<ISubject>, userId: string): Promise<void> {
    const payload = {
      ...data,
      ...this.generateUpdateAuditFields(userId),
    };
    await this.collection.doc(id).update(payload);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    });
  }

  async findById(id: string): Promise<ISubject | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as ISubject;
    if (data.isDeleted) return null;
    return data;
  }

  async findByCourseId(courseId: string): Promise<ISubject[]> {
    const snapshot = await this.collection
      .where('courseId', '==', courseId)
      .where('isDeleted', '==', false)
      .get();
    const subjects = snapshot.docs.map((doc: any) => doc.data() as ISubject);
    return subjects.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async findByNameAndCourse(name: string, courseId: string): Promise<ISubject[]> {
    const snapshot = await this.collection
      .where('courseId', '==', courseId)
      .where('name', '==', name)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as ISubject);
  }
}

export class TopicRepository extends BaseRepository {
  private collection = db.collection(LMS_COLLECTIONS.TOPICS);

  async create(data: Omit<ITopic, keyof BaseAuditFields>, userId: string): Promise<ITopic> {
    const docRef = this.collection.doc();
    const payload: ITopic = {
      ...data,
      ...this.generateAuditFields(userId),
      id: docRef.id,
    };
    await docRef.set(payload);
    return payload;
  }

  async update(id: string, data: Partial<ITopic>, userId: string): Promise<void> {
    const payload = {
      ...data,
      ...this.generateUpdateAuditFields(userId),
    };
    await this.collection.doc(id).update(payload);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    });
  }

  async findById(id: string): Promise<ITopic | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as ITopic;
    if (data.isDeleted) return null;
    return data;
  }

  async findBySubjectId(subjectId: string): Promise<ITopic[]> {
    const snapshot = await this.collection
      .where('subjectId', '==', subjectId)
      .where('isDeleted', '==', false)
      .get();
    const topics = snapshot.docs.map((doc: any) => doc.data() as ITopic);
    return topics.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async findByNameAndSubject(name: string, subjectId: string): Promise<ITopic[]> {
    const snapshot = await this.collection
      .where('subjectId', '==', subjectId)
      .where('name', '==', name)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as ITopic);
  }
}

export class ClassRepository extends BaseRepository {
  private collection = db.collection(LMS_COLLECTIONS.CLASSES);

  async create(data: Omit<IClass, keyof BaseAuditFields>, userId: string): Promise<IClass> {
    const docRef = this.collection.doc();
    const payload: IClass = {
      ...data,
      ...this.generateAuditFields(userId),
      id: docRef.id,
    };
    await docRef.set(payload);
    return payload;
  }

  async update(id: string, data: Partial<IClass>, userId: string): Promise<void> {
    const payload = {
      ...data,
      ...this.generateUpdateAuditFields(userId),
    };
    await this.collection.doc(id).update(payload);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    });
  }

  async findById(id: string): Promise<IClass | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as IClass;
    if (data.isDeleted) return null;
    return data;
  }

  async findByTopicId(topicId: string): Promise<IClass[]> {
    const snapshot = await this.collection
      .where('topicId', '==', topicId)
      .where('isDeleted', '==', false)
      .get();
    const classes = snapshot.docs.map((doc: any) => doc.data() as IClass);
    return classes.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async findByTitleAndTopic(title: string, topicId: string): Promise<IClass[]> {
    const snapshot = await this.collection
      .where('topicId', '==', topicId)
      .where('title', '==', title)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as IClass);
  }
}

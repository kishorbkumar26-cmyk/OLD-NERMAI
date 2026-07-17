import { db } from '../infrastructure/firebase';
import { Policies } from '../core/permissions/policies';

async function test() {
    const userId = "TgjDWxOoKigtYqVKs6aMC2SRKht2";
    const tenantId = "default_tenant";
    
    const studentDoc = await db.collection('student_profiles').doc(userId).get();
    const programMemberships = studentDoc.exists ? studentDoc.data()?.programMemberships || [] : [];
    
    const userBatchIds = programMemberships ? programMemberships.map((m: any) => m.batchId) : [];
    console.log('userBatchIds:', userBatchIds);

    let userCourseIds: string[] = [];
    if (userBatchIds.length > 0) {
      const batchChunks = [];
      for (let i = 0; i < userBatchIds.length; i += 10) {
        batchChunks.push(userBatchIds.slice(i, i + 10));
      }
      
      for (const chunk of batchChunks) {
        const batchesSnapshot = await db.collection('student_batches')
          .where('__name__', 'in', chunk)
          .get();
        const courseIds = batchesSnapshot.docs.map(doc => doc.data().courseId).filter(Boolean);
        userCourseIds.push(...courseIds);
      }
    }
    console.log('userCourseIds:', userCourseIds);

    const coursesSnapshot = await db.collection('courses')
      .where('tenantId', '==', tenantId)
      .where('isDeleted', '==', false)
      .limit(20)
      .get();
    
    const accessibleCourses = [];
    for (const doc of coursesSnapshot.docs) {
      const course = { id: doc.id, ...doc.data() } as any;
      console.log(`Checking Course: ${course.title} (${course.id}) - visibility: ${course.visibility}, batchIds: ${course.batchIds}`);
      const isAllowed = course.visibility === 'public' || 
                        Policies.hasBatchAccess(course.batchIds || [], userBatchIds) || 
                        userCourseIds.includes(course.id);
      console.log(`-> isAllowed: ${isAllowed}`);
      if (isAllowed) {
        accessibleCourses.push({
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnailUrl || ''
        });
      }
    }
    console.log('Accessible Courses:', accessibleCourses);
}

test().catch(console.error);

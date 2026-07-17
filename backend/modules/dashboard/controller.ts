import { Request, Response, NextFunction } from 'express';
import { db } from '../../infrastructure/firebase';
import { AppError } from '../../core/errors/AppError';
import { Policies } from '../../core/permissions/policies';
import { deriveClassStatus } from '../courses/service';

export const getStudentDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    
    // Fetch latest student profile to get programMemberships
    const studentDoc = await db.collection('student_profiles').doc(userId).get();
    const programMemberships = studentDoc.exists ? studentDoc.data()?.programMemberships || [] : [];
    
    const userBatchIds = programMemberships 
      ? programMemberships.map((m: any) => m.batchId).filter(Boolean) 
      : [];

    // Fetch batch details to know which courses these batches belong to
    let userCourseIds: string[] = [];
    if (userBatchIds.length > 0) {
      try {
        const batchPromises = userBatchIds.map((batchId: string) => 
          db.collection('student_batches').doc(batchId).get()
        );
        const batchDocs = await Promise.all(batchPromises);
        
        const courseIds = batchDocs
          .filter(doc => doc.exists)
          .map(doc => doc.data()?.courseId)
          .filter(Boolean);
          
        userCourseIds.push(...courseIds);
      } catch (err) {
        console.error("Error fetching batches for dashboard:", err);
      }
    }

    // 1. My Courses (Simplified for Phase 1: Fetch all courses and filter by access rules)
    const coursesSnapshot = await db.collection('courses')
      .where('tenantId', '==', tenantId)
      .where('isDeleted', '==', false)
      .limit(20) // Limit for performance
      .get();
    
    const accessibleCourses = [];
    for (const doc of coursesSnapshot.docs) {
      const course = { id: doc.id, ...doc.data() } as any;
      const isAllowed = course.visibility === 'public' || 
                        Policies.hasBatchAccess(course.batchIds || [], userBatchIds) || 
                        userCourseIds.includes(course.id);
      if (isAllowed) {
        accessibleCourses.push({
          id: course.id,
          title: course.name,
          thumbnail: course.thumbnailUrl || ''
        });
      }
    }

    // 2. Continue Watching (Watch History < 100%)
    const watchHistorySnapshot = await db.collection('watch_history')
      .where('tenantId', '==', tenantId)
      .where('studentId', '==', userId)
      .get();
      
    const continueWatching = watchHistorySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(doc => doc.completionPercentage < 100)
      .sort((a, b) => {
        if (b.completionPercentage !== a.completionPercentage) {
          return b.completionPercentage - a.completionPercentage;
        }
        return new Date(b.lastWatchedAt || 0).getTime() - new Date(a.lastWatchedAt || 0).getTime();
      })
      .slice(0, 3);

    // 3. Live Classes
    // Fetch all live classes across the platform
    const liveClassesSnapshot = await db.collection('classes')
      .where('classType', 'in', ['youtube_live', 'zoom_live'])
      .where('isDeleted', '==', false)
      .get();

    let liveClasses: any[] = [];
    
    for (const doc of liveClassesSnapshot.docs) {
      const session = { id: doc.id, ...doc.data() } as any;
      
      const topicDoc = await db.collection('topics').doc(session.topicId).get();
      if (!topicDoc.exists) continue;
      
      const subjectDoc = await db.collection('subjects').doc(topicDoc.data()?.subjectId).get();
      if (!subjectDoc.exists) continue;
      
      const courseId = subjectDoc.data()?.courseId;
      if (!courseId) continue;

      const courseDoc = await db.collection('courses').doc(courseId).get();
      const isPublic = courseDoc.data()?.visibility === 'public';
      
      if (isPublic || userCourseIds.includes(courseId)) {
        const liveStatus = deriveClassStatus(session);
        
        const baseStart = new Date(session.scheduledStartTime || 0).getTime();
        const durationMs = (session.expectedDurationMinutes || 60) * 60 * 1000;
        const extensionMs = (session.extensionMinutes || 0) * 60 * 1000;
        const gracePeriodMs = 2 * 60 * 1000;
        const effectiveEnd = baseStart + durationMs + extensionMs + gracePeriodMs;

        const currentNow = Date.now();
        let remainingSeconds = 0;
        if (liveStatus === 'LIVE') {
          remainingSeconds = Math.max(0, Math.floor((effectiveEnd - currentNow) / 1000));
        } else if (liveStatus === 'SCHEDULED') {
          remainingSeconds = Math.max(0, Math.floor((baseStart - currentNow) / 1000));
        }

        let derivedStatus: string = liveStatus;
        if (derivedStatus === 'ENDED' && !session.encryptedRecordingId) {
            derivedStatus = 'NOT_UPLOADED';
        } else if (derivedStatus === 'ENDED' && session.encryptedRecordingId) {
            derivedStatus = 'RECORDED_AVAILABLE';
        }

        liveClasses.push({
          id: session.id,
          title: session.title,
          startTime: session.scheduledStartTime || session.scheduledAt,
          provider: session.classType.includes('zoom') ? 'zoom' : 'youtube',
          courseId: courseId,
          liveStatus: derivedStatus,
          joinAllowed: liveStatus === 'LIVE',
          remainingSeconds,
          effectiveEndTime: new Date(effectiveEnd).toISOString(),
          isExtended: (session.extensionMinutes || 0) > 0,
          recordingUrl: session.encryptedRecordingId || null
        });
      }
    }
    
    // Custom Sorting: LIVE > SCHEDULED > ENDED
    const statusOrder: Record<string, number> = {
      'LIVE': 1,
      'SCHEDULED': 2,
      'NOT_UPLOADED': 3,
      'RECORDED_AVAILABLE': 4,
      'ENDED': 5
    };

    liveClasses = liveClasses
      .sort((a, b) => {
        // First sort by status
        const rankA = statusOrder[a.liveStatus] || 99;
        const rankB = statusOrder[b.liveStatus] || 99;
        if (rankA !== rankB) return rankA - rankB;
        // Then sort by schedule time (earliest first)
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      })
      .slice(0, 4); // Fetch top 4 to show a mix of states

    // 4. Recent Resources (Notes/PDFs)
    const resourcesSnapshot = await db.collection('resources')
      .where('tenantId', '==', tenantId)
      .where('isDeleted', '==', false)
      .get();

    let recentResources: any[] = [];
    for (const doc of resourcesSnapshot.docs) {
      const resource = { id: doc.id, ...doc.data() } as any;
      const isAllowed = resource.visibility === 'PUBLIC' || Policies.hasBatchAccess(resource.batchIds || [], userBatchIds);
      if (isAllowed) {
        recentResources.push({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          createdAt: resource.createdAt
        });
      }
    }
    recentResources = recentResources
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);

    res.status(200).json({
      status: 'success',
      serverTime: new Date().toISOString(),
      serverTimestamp: Date.now(),
      data: {
        myCourses: accessibleCourses,
        continueWatching,
        liveClasses,
        recentResources
      }
    });

  } catch (error: any) {
    console.error('Dashboard Error:', error.message);
    next(new AppError('Failed to fetch student dashboard: ' + error.message, 500));
  }
};


export const getAdminDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.user!;
    
    // Simplistic count aggregations (In production, use aggregate queries or maintain counters)
    const [
      coursesSnap, 
      classesSnap, 
      resourcesSnap, 
      videosSnap, 
      liveSessionsSnap,
      chatbotQueriesSnap
    ] = await Promise.all([
      db.collection('courses').where('tenantId', '==', tenantId).where('isDeleted', '==', false).count().get(),
      db.collection('classes').where('tenantId', '==', tenantId).where('isDeleted', '==', false).count().get(),
      db.collection('resources').where('tenantId', '==', tenantId).where('isDeleted', '==', false).count().get(),
      db.collection('videos').where('tenantId', '==', tenantId).where('isDeleted', '==', false).count().get(),
      db.collection('live_sessions').where('tenantId', '==', tenantId).where('isDeleted', '==', false).count().get(),
      db.collection('chat_sessions').where('tenantId', '==', tenantId).count().get()
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalCourses: coursesSnap.data().count,
        totalClasses: classesSnap.data().count,
        totalResources: resourcesSnap.data().count,
        totalVideos: videosSnap.data().count,
        totalLiveSessions: liveSessionsSnap.data().count,
        totalChatbotQueries: chatbotQueriesSnap.data().count
      }
    });
  } catch (error) {
    next(new AppError('Failed to load admin dashboard metrics', 500));
  }
};

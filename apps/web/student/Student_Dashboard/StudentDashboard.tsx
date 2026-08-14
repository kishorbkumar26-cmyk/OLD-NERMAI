import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import { DashboardApi, getApiClient } from '@nermai/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveSessionsState } from '@nermai/shared';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, MessageSquare, User, Home, Settings, Bell, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LivePulseBadge } from '../../components/ui/LivePulseBadge';
import { CoursePlayer } from '../LMS/CoursePlayer';
import { StudentAnnouncements } from '../LMS/Announcements/StudentAnnouncements';
import { NERMAIAssistantWidget } from '../LMS/Assistant/NERMAIAssistantWidget';

import { PlayCircle, Clock, Video, CheckCircle, Flame, BarChart3 } from 'lucide-react';

const ResourceViewer = React.lazy(() => import('../LMS/ResourceViewer').then(m => ({ default: m.ResourceViewer })));

const UsageMetricCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
  <Card className="hover:border-primary/50 transition-colors h-full flex flex-col justify-between">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardDescription className="font-medium text-textSecondary">{title}</CardDescription>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-textPrimary">{value}</div>
      {subtitle && <div className="text-xs text-textSecondary mt-1">{subtitle}</div>}
    </CardContent>
  </Card>
);

declare global {
  interface Window {
    __SERVER_TIME__?: string;
  }
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference <= 0) return 'Starting soon...';

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
};

const LiveCountdown = ({ effectiveEndTime, serverTime, isExtended }: { effectiveEndTime: string, serverTime: string, isExtended?: boolean }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const endMs = new Date(effectiveEndTime).getTime();
    const serverMs = new Date(serverTime).getTime();
    const driftMs = Date.now() - serverMs;

    const calculateRemaining = () => {
      const currentServerTimeEstimate = Date.now() - driftMs;
      return Math.max(0, Math.floor((endMs - currentServerTimeEstimate) / 1000));
    };

    setRemaining(calculateRemaining());
    
    const timer = setInterval(() => {
      setRemaining(calculateRemaining());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [effectiveEndTime, serverTime]);

  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;
  
  const formatted = hrs > 0 
    ? `${hrs}h ${mins}m ${secs}s`
    : `${mins}m ${secs}s`;

  return (
    <span className="flex items-center gap-2">
      <span>Ends in {formatted}</span>
      {isExtended && (
        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] uppercase rounded font-bold tracking-wider">Extended</span>
      )}
    </span>
  );
};

const LiveClassCard = ({ live, isCompact = false, onJoin }: { live: any, isCompact?: boolean, onJoin?: (id: string) => void }) => {
  const statusColors = {
    LIVE: 'border-green-500/50 bg-green-500/10 text-green-400',
    JOINING: 'border-green-500/50 bg-green-500/10 text-green-400',
    HOST_CONNECTED: 'border-green-500/50 bg-green-500/10 text-green-400',
    SCHEDULED: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    RECORDED_AVAILABLE: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    NOT_UPLOADED: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
    ENDED: 'border-red-500/50 bg-red-500/10 text-red-400'
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'JOINING':
      case 'HOST_CONNECTED': return 'LIVE NOW';
      case 'SCHEDULED': return 'UPCOMING';
      case 'RECORDED_AVAILABLE': return 'WATCH RECORDING';
      case 'NOT_UPLOADED': return 'RECORDING PENDING';
      case 'ENDED': return 'ENDED';
      default: return status;
    }
  };

  if (isCompact) {
    return (
      <Card 
        onClick={() => onJoin && onJoin(live.courseId)}
        className={`cursor-pointer hover:border-primary/50 transition-colors ${statusColors[live.liveStatus as keyof typeof statusColors] || 'border-border'}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{getStatusText(live.liveStatus)}</Badge>
            {['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(live.liveStatus) && <LivePulseBadge />}
          </div>
          <h4 className="font-medium text-sm text-textPrimary truncate">{live.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
            {live.liveStatus === 'SCHEDULED' ? (
              <><Clock className="w-3 h-3" /> <CountdownTimer targetDate={live.startTime} /></>
            ) : ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(live.liveStatus) ? (
              <><Clock className="w-3 h-3" /> <LiveCountdown effectiveEndTime={live.effectiveEndTime} serverTime={window.__SERVER_TIME__ || new Date().toISOString()} isExtended={live.isExtended} /></>
            ) : (
              <><Calendar className="w-3 h-3" /> {new Date(live.startTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view (not currently used in Dashboard, but updated for safety)
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline">{getStatusText(live.liveStatus)}</Badge>
            {['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(live.liveStatus) && <LivePulseBadge />}
          </div>
          <h3 className="text-xl font-bold text-textPrimary mb-2">{live.title}</h3>
          <p className="text-textSecondary text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(live.startTime).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <span className="mx-2">•</span>
            <Video className="w-4 h-4" />
            {live.provider === 'zoom' ? 'Zoom Live' : 'YouTube Live'}
          </p>
        </div>
        <div className="shrink-0 mt-4 md:mt-0">
          {['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(live.liveStatus) && (
            <Button onClick={() => onJoin && onJoin(live.courseId)} variant="default">Join Now</Button>
          )}
          {live.liveStatus === 'RECORDED_AVAILABLE' && (
            <Button onClick={() => onJoin && onJoin(live.courseId)} variant="secondary" leftIcon={<PlayCircle size={16} />}>Watch Recording</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StudentDashboard: React.FC = () => {
  const { currentUser, role, loading: authLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [viewingResourceId, setViewingResourceId] = useState<string | null>(null);

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['studentDashboard', currentUser?.uid],
    queryFn: async () => {
      const res = await DashboardApi.getStudentOverview();
      if ((res as any).serverTime) {
        window.__SERVER_TIME__ = (res as any).serverTime;
      }
      return res.data?.data || res.data;
    },
    enabled: !!currentUser && role === 'student' && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = dashboardData;
  const loading = isLoading || authLoading;

  const { sessions: realtimeLiveSessions } = useLiveSessionsState(getApiClient());

  // Overlay real-time status onto dashboard liveClasses
  const patchedLiveClasses = data?.liveClasses?.map((live: any) => {
    // Determine the ID to match against the real-time hook.
    // The backend uses liveSession.classId as the primary link.
    const realTimeSession = realtimeLiveSessions.find(s => s.classId === live.classId || s.id === (live.sessionId || live.id));
    if (realTimeSession) {
      return {
        ...live,
        liveStatus: realTimeSession.status
      };
    }
    return live;
  }) || [];


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || role !== 'student') {
    return <Navigate to="/student/login" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-textPrimary flex flex-col relative w-full h-full">

      <main className="flex-1 overflow-y-auto relative z-10 w-full">
        
        {selectedCourseId ? (
          <CoursePlayer 
            courseId={selectedCourseId} 
            onBack={() => setSelectedCourseId(null)} 
          />
        ) : (
          <>
          {/* 1. Page Header */}
          <header className="mb-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold tracking-tight text-textPrimary">Welcome Back, Scholar</h1>
              <p className="text-textSecondary mt-1">Ready to master today's subjects?</p>
            </motion.div>
          </header>

          {/* 2. Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button leftIcon={<Video size={16} />}>Join Next Class</Button>
            <Button variant="secondary" leftIcon={<Calendar size={16} />}>View Timetable</Button>
            <Button variant="outline" leftIcon={<BookOpen size={16} />}>Browse Library</Button>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            
            {/* 3. Usage Analytics Grid (Metrics) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <motion.div variants={itemVariants}>
              <UsageMetricCard 
                title="Study Time" 
                value={`${Math.floor((data?.metrics?.studyTimeMinutes || 0) / 60)}h ${(data?.metrics?.studyTimeMinutes || 0) % 60}m`}
                subtitle="This month"
                icon={Clock} 
                colorClass="bg-blue-500/20 text-blue-400" 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <UsageMetricCard 
                title="Attendance" 
                value={`${data?.metrics?.attendancePercentage || 0}%`} 
                subtitle="Live Classes"
                icon={Video} 
                colorClass="bg-green-500/20 text-green-400" 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <UsageMetricCard 
                title="Assignments" 
                value={`${data?.metrics?.completedAssignments || 0}/${data?.metrics?.totalAssignments || 0}`} 
                subtitle="Completed"
                icon={CheckCircle} 
                colorClass="bg-purple-500/20 text-purple-400" 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <UsageMetricCard 
                title="Avg Score" 
                value={`${data?.metrics?.averageScore || 0}%`} 
                subtitle="Overall"
                icon={BarChart3} 
                colorClass="bg-orange-500/20 text-orange-400" 
              />
            </motion.div>
            <motion.div variants={itemVariants} className="hidden lg:block">
              <UsageMetricCard 
                title="Current Streak" 
                value={`${data?.metrics?.streak || 0} Days`} 
                subtitle="Keep it up!"
                icon={Flame} 
                colorClass="bg-red-500/20 text-red-400" 
              />
            </motion.div>
          </div>

            {/* 4. Charts & Live Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                
                {/* Continue Learning */}
                <motion.section variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Continue Learning</CardTitle>
                      <CardDescription>Pick up where you left off</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data?.continueWatching?.map((item: any) => (
                          <div key={item.id} className="p-4 rounded-lg bg-surfaceHighlight border border-border flex flex-col gap-2">
                            <span className="font-medium text-textPrimary">{item.title || 'UPSC Main Stream Video'}</span>
                            <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${item.completionPercentage}%` }} />
                            </div>
                            <span className="text-xs text-textSecondary text-right">{item.completionPercentage}% Complete</span>
                          </div>
                        ))}
                        {data?.continueWatching?.length === 0 && (
                          <p className="text-textSecondary text-sm py-4">No active courses. Start learning!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>

                {/* My Courses */}
                <motion.section variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Enrolled Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data?.myCourses?.map((course: any) => (
                          <div 
                            key={course.id} 
                            className="h-28 rounded-lg bg-gradient-to-br from-surface to-accent/20 border border-border flex items-end p-4 cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => setSelectedCourseId(course.id)}
                          >
                            <h3 className="font-bold text-lg text-textPrimary line-clamp-2">{course.title || course.name}</h3>
                          </div>
                        ))}
                        {data?.myCourses?.length === 0 && (
                          <p className="text-textSecondary text-sm col-span-2 py-4">No courses enrolled yet.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              </div>

              {/* Right Column (Span 1) */}
              <div className="space-y-8">
                {/* Upcoming Live Classes */}
                <motion.section variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {patchedLiveClasses?.map((live: any) => (
                          <LiveClassCard 
                            key={live.id} 
                            live={live} 
                            isCompact={true}
                            onJoin={(courseId) => navigate(`/student/live-session/${live.sessionId || live.id}`)}
                          />
                        ))}
                        {patchedLiveClasses?.length === 0 && (
                          <p className="text-textSecondary text-sm">No live sessions scheduled.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>

                {/* Quick Resources */}
                <motion.section variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data?.recentResources?.map((res: any, idx: number) => (
                          <div 
                            key={res.id}
                            className="p-3 bg-surfaceHighlight border border-border rounded-lg flex items-center justify-between cursor-pointer hover:border-primary/50"
                            onClick={() => setViewingResourceId(res.id)}
                          >
                            <span className="text-sm font-medium text-textPrimary">{res.title}</span>
                            {idx === 1 ? <span className="text-xs text-textSecondary">Locked</span> : <span className="text-xs text-primary">New</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              </div>
            </div>
          </motion.div>
        </>
        )}
      </main>
      
      <NERMAIAssistantWidget />

      {viewingResourceId && (
        <React.Suspense fallback={null}>
          <ResourceViewer 
            resourceId={viewingResourceId} 
            onClose={() => setViewingResourceId(null)} 
          />
        </React.Suspense>
      )}
    </div>
  );
};

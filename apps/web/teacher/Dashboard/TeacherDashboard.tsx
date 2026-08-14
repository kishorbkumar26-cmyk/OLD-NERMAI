import React, { useEffect, useState } from 'react';
import { DashboardApi } from '@nermai/api';
import { BookOpen, Layers, Radio, Clock, Files, CheckCircle, AlertCircle, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface TeacherMetrics {
  assignedCourses: number;
  assignedSubjects: number;
  liveToday: number;
  pendingAttendance: number;
  resourcesUploaded: number;
  weeklyHours: number;
  nextSession: any;
}

export const TeacherDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<TeacherMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await DashboardApi.getTeacherMetrics();
        setMetrics(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to load teacher metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-textPrimary">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-6 h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return <div className="p-8 text-textPrimary">Error loading dashboard</div>;

  const stats = [
    { label: "Today's Classes", value: metrics.liveToday, icon: Radio, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Pending Attendance', value: metrics.pendingAttendance, icon: AlertCircle, color: metrics.pendingAttendance > 0 ? 'text-red-400' : 'text-green-400', bg: metrics.pendingAttendance > 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
    { label: 'Weekly Hours', value: `${metrics.weeklyHours}h`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Assigned Courses', value: metrics.assignedCourses, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Assigned Subjects', value: metrics.assignedSubjects, icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Resources Uploaded', value: metrics.resourcesUploaded, icon: Files, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Teacher Dashboard</h1>
          <p className="text-textSecondary">Welcome back. Here's your teaching summary.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/teacher/live')} className="flex items-center gap-2 bg-primary hover:bg-primary/80">
            <Plus size={20} /> Schedule Session
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={stat.label} 
            className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all"
          >
            <div className={`absolute top-4 right-4 p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-textSecondary text-sm font-medium mb-2">{stat.label}</h3>
            <p className="text-3xl font-bold text-textPrimary">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <h2 className="text-xl font-bold text-textPrimary mb-6 relative z-10">Up Next</h2>
          {metrics.nextSession ? (
            <div className="bg-surfaceHighlight border border-border rounded-xl p-6 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Radio size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-textPrimary">{metrics.nextSession.title}</h3>
                  <p className="text-primary text-sm">
                    {new Date(metrics.nextSession.scheduledStartTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/teacher/live')} className="w-full">Manage Session</Button>
            </div>
          ) : (
            <div className="text-center py-12 text-textSecondary relative z-10">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>No upcoming sessions scheduled.</p>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-textPrimary mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/teacher/resources')} className="w-full text-left px-4 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-xl text-sm text-textSecondary transition-colors flex items-center gap-3">
              <Files size={18} className="text-amber-400" /> Upload Resource
            </button>
            <button onClick={() => navigate('/teacher/attendance')} className="w-full text-left px-4 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-xl text-sm text-textSecondary transition-colors flex items-center gap-3">
              <CheckCircle size={18} className="text-green-400" /> Mark Attendance
            </button>
            <button onClick={() => navigate('/teacher/students')} className="w-full text-left px-4 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-xl text-sm text-textSecondary transition-colors flex items-center gap-3">
              <Users size={18} className="text-blue-400" /> View Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

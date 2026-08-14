import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthProvider';
import { 
  Users, Calendar as CalendarIcon, Video, CheckCircle, Clock, 
  MessageSquare, Star, ArrowRight, PieChart,
  Search, Bell, FileSignature
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';

// ----------------------------------------------------------------------
// Universal UI Components
// ----------------------------------------------------------------------

const StatCard = ({ stat, delay }: { stat: any, delay: number }) => {
  return (
    <div 
      className="relative bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
          {stat.icon}
        </div>
      </div>
      
      <div>
        <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
        <p className="text-sm font-medium text-white/60 mb-3">{stat.label}</p>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Sub-Views: Overview Components
// ----------------------------------------------------------------------

const ScheduleTimeline = ({ role }: { role: string }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/staff/me/live-sessions');
        // Only show today's sessions or upcoming
        const sorted = (response.data.data || []).sort((a: any, b: any) => 
          new Date(a.scheduledStartTime || 0).getTime() - new Date(b.scheduledStartTime || 0).getTime()
        );
        setSessions(sorted);
      } catch (error) {
        console.error('Failed to fetch assigned sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Upcoming Sessions</h2>
          <p className="text-sm text-white/50">Your scheduled live classes</p>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#D4AF37]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-white/40 mt-10">No upcoming sessions.</div>
        ) : sessions.map((item, idx) => (
          <div key={item.id} className="relative pl-6 pb-6 last:pb-0 border-l border-white/10 last:border-transparent">
            
            {/* Timeline Dot */}
            <div className={`absolute left-[-5px] top-1 w-[9px] h-[9px] rounded-full ring-4 ring-[#1A1A1A] ${
              item.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 
              item.status === 'ENDED' ? 'bg-white/20' : 'bg-[#D4AF37]'
            }`} />

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-base font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{item.title}</h4>
                  <div className="flex items-center text-xs text-white/50 mt-1 space-x-3">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> 
                      {item.scheduledStartTime ? new Date(item.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}
                    </span>
                    <span className="flex items-center uppercase font-bold text-[#D4AF37]">
                      {item.sessionRole}
                    </span>
                  </div>
                </div>
                
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                  item.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  item.status === 'ENDED' ? 'bg-white/10 text-white/40 border border-white/10' :
                  'bg-white/10 text-white/70 border border-white/10'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Action Buttons */}
              {(item.status === 'LIVE' || item.status === 'SCHEDULED') && (
                <button 
                  onClick={() => navigate(`/staff/live/${item.id}`)}
                  className={`mt-4 w-full py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center ${
                    item.sessionRole === 'HOST' ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-lg' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                  }`}
                >
                  {item.sessionRole === 'HOST' ? (
                    <><Video className="w-4 h-4 mr-2" /> Start Session</>
                  ) : (
                    <><ArrowRight className="w-4 h-4 mr-2" /> Join Session</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ----------------------------------------------------------------------
// Main Dashboard Component Wrapper
// ----------------------------------------------------------------------

export const StaffDashboard: React.FC = () => {
  const { currentUser, role } = useAuth();
  
  // Normalize role
  const normalizedRole = role === 'super_admin' || role === 'admin' ? 'teacher' : (role || 'teacher');
  const isManagement = normalizedRole === 'management';
  
  const [sessionCount, setSessionCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    // Fetch counts from the backend
    api.get('/staff/me/live-sessions').then(res => setSessionCount(res.data.data?.length || 0)).catch(() => {});
    api.get('/staff/me/courses').then(res => setCourseCount(res.data.data?.length || 0)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Assigned Courses', value: courseCount.toString(), icon: <CalendarIcon className="w-5 h-5" />, color: 'from-[#8B0000] to-[#B22222]' },
    { label: 'Live Sessions', value: sessionCount.toString(), icon: <Video className="w-5 h-5" />, color: 'from-blue-600 to-blue-400' },
    { label: 'Assigned Students', value: '--', icon: <Users className="w-5 h-5" />, color: 'from-amber-500 to-yellow-400' },
    { label: 'Avg Attendance', value: '--', icon: <PieChart className="w-5 h-5" />, color: 'from-emerald-600 to-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8 font-sans selection:bg-[#8B0000]/30 overflow-x-hidden">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold uppercase tracking-widest text-[#8B0000]">
            <span className="w-2 h-2 rounded-full bg-[#8B0000] animate-pulse shadow-[0_0_10px_rgba(139,0,0,0.8)]"></span>
            <span>NERMAI Academy Portal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50"> {currentUser?.displayName || 'Staff'}</span>
          </h1>
          <p className="text-white/50 text-base">
            Here's your overview for today.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2 flex items-center focus-within:border-[#8B0000]/50 transition-colors shadow-inner">
             <Search className="w-4 h-4 text-white/40 mr-2" />
             <input 
               type="text" 
               placeholder="Search..." 
               className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-white/30"
             />
          </div>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-[#B22222] flex items-center justify-center font-bold text-sm border-2 border-white/10 shadow-[0_0_15px_rgba(139,0,0,0.3)]">
            {currentUser?.displayName?.[0] || 'S'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} delay={i * 100} />
          ))}
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <ScheduleTimeline role={normalizedRole} />
        </div>
      </div>
      
      {/* Global CSS overrides for custom scrollbar within this scoped component */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

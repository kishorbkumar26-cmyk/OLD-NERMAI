import React, { useEffect, useState } from 'react';
import { DashboardApi  } from '@nermai/api';

interface DashboardMetrics {
  totalCourses: number;
  totalClasses: number;
  totalResources: number;
  totalStudents: number;
  activeBatches: number;
  totalLiveSessions: number;
  pendingAccessRequests: number;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch metrics from API
    const fetchMetrics = async () => {
      try {
        const response = await DashboardApi.getAdminMetrics();
        setMetrics(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading metrics...</div>;
  if (!metrics) return <div className="p-8 text-white">Error loading dashboard</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-textPrimary">Academy Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Total Students</h3>
          <p className="text-4xl font-bold text-white">{metrics.totalStudents || 0}</p>
        </div>
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Total Courses</h3>
          <p className="text-4xl font-bold text-white">{metrics.totalCourses || 0}</p>
        </div>
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Active Batches</h3>
          <p className="text-4xl font-bold text-white">{metrics.activeBatches || 0}</p>
        </div>
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Resources</h3>
          <p className="text-4xl font-bold text-white">{metrics.totalResources || 0}</p>
        </div>
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Live Sessions</h3>
          <p className="text-4xl font-bold text-white">{metrics.totalLiveSessions || 0}</p>
        </div>
        <div className="bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-2">Pending Requests</h3>
          <p className="text-4xl font-bold text-white">{metrics.pendingAccessRequests || 0}</p>
        </div>
      </div>
    </div>
  );
};

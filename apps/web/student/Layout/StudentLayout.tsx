import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import {
  Home, BookOpen, Radio, User, LogOut, Bell, Bot, FolderOpen
} from 'lucide-react';
import { AppLayout } from '../../components/ui/AppLayout';
import { Topbar } from '../../components/ui/Topbar';
import { Button } from '../../components/ui/Button';

const TABS = [
  { path: '/student',       label: 'Home',      icon: Home,       exact: true },
  { path: '/student/courses', label: 'Courses',   icon: BookOpen,   exact: false },
  { path: '/student/live',    label: 'Live',      icon: Radio,      exact: false },
  { path: '/student/resources', label: 'Resources', icon: FolderOpen, exact: false },
  { path: '/student/profile', label: 'Profile',   icon: User,       exact: false },
];

export const StudentLayout: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-surfaceHighlight border-t-primary" />
        <div className="text-sm tracking-wide text-textSecondary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/student/login" replace />;
  }

  const topbarLeft = (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-yellow-600 text-background font-black shadow-sm">
        N
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-extrabold uppercase tracking-widest text-textPrimary leading-tight">NERMAI</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary -mt-1">Student Portal</div>
      </div>
    </div>
  );

  const topbarRight = (
    <div className="flex items-center gap-4">
      <NavLink to="/student/resources">
        {({ isActive }) => (
          <Button variant={isActive ? "outline" : "ghost"} size="icon" className={isActive ? 'border-primary text-primary' : 'text-textSecondary hover:text-textPrimary'}>
            <FolderOpen size={18} />
          </Button>
        )}
      </NavLink>
      <Button variant="ghost" size="icon" className="text-primary hover:bg-surfaceHighlight">
        <Bot size={18} />
      </Button>
      <Button variant="ghost" size="icon" className="text-textSecondary hover:text-textPrimary">
        <Bell size={18} />
      </Button>
      <div className="h-6 w-[1px] bg-border" />
      <div className="hidden sm:flex flex-col text-right">
        <span className="text-sm font-semibold text-textPrimary">{currentUser?.email?.split('@')[0] || 'Student'}</span>
        <span className="text-[10px] text-primary">Online Batch</span>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-surface to-background text-mutedForeground shadow-sm">
        <User size={18} />
      </div>
      <Button variant="ghost" size="icon" onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
        <LogOut size={18} />
      </Button>
    </div>
  );

  return (
    <AppLayout
      topbar={<Topbar leftContent={topbarLeft} rightContent={topbarRight} />}
    >
      <div className="pb-32 max-w-7xl mx-auto h-full px-6 pt-6">
        <Outlet />
      </div>

      {/* Floating Bottom Tab Bar */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface p-2 shadow-lg backdrop-blur-md">
        {TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.exact}
            className={({ isActive }) => `
              flex items-center overflow-hidden rounded-full transition-all duration-300 ease-out
              ${isActive ? 'bg-gradient-to-br from-primary to-yellow-600 px-5 py-2.5 text-background shadow-md' : 'px-3 py-2.5 text-textSecondary hover:text-textPrimary'}
            `}
          >
            {({ isActive }) => (
              <>
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span 
                  className={`
                    whitespace-nowrap text-sm font-bold transition-all duration-300 ease-out
                    ${isActive ? 'ml-2 max-w-[100px] opacity-100' : 'max-w-0 opacity-0 overflow-hidden'}
                  `}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </AppLayout>
  );
};

export default StudentLayout;

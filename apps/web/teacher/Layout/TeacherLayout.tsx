import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import {
  LayoutDashboard, Radio, Files, Users, ClipboardCheck,
  Bell, User, LogOut, Menu, X, BookOpen, Clock
} from 'lucide-react';
import { AppLayout } from '../../components/ui/AppLayout';
import { Topbar } from '../../components/ui/Topbar';
import { Sidebar, SidebarGroup, SidebarItem } from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';

/* ─── Nav Items ─────────────────────────────────────────────────────────────── */
interface NavItem { icon: React.ElementType; label: string; path: string; group?: string; }

const TEACHER_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/teacher',            group: 'Overview' },
  { icon: Radio,           label: 'Live Sessions', path: '/teacher/live',       group: 'Teaching' },
  { icon: BookOpen,        label: 'Courses',       path: '/teacher/courses',    group: 'Teaching' },
  { icon: Files,           label: 'Resources',     path: '/teacher/resources',  group: 'Management' },
  { icon: ClipboardCheck,  label: 'Assignments',   path: '/teacher/assignments',group: 'Management' },
  { icon: Clock,           label: 'Attendance',    path: '/teacher/attendance', group: 'Management' },
  { icon: Users,           label: 'Students',      path: '/teacher/students',   group: 'Community' },
  { icon: Bell,            label: 'Announcements', path: '/teacher/announcements',group: 'Community' },
  { icon: User,            label: 'Profile',       path: '/teacher/profile',    group: 'Settings' },
];

const GROUPS = ['Overview', 'Teaching', 'Management', 'Community', 'Settings'];

/* ─── Main Layout Shell ───────────────────────────────────────────────────────── */
export const TeacherLayout: React.FC = () => {
  const { currentUser, role, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-surfaceHighlight border-t-primary" />
        <div className="text-sm tracking-wide text-textSecondary">Loading...</div>
      </div>
    );
  }

  if (!currentUser || role !== 'teacher') {
    return <Navigate to="/teacher/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const topbarLeft = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-textSecondary hover:text-textPrimary">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-yellow-600 text-background font-black shadow-sm">
          T
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-extrabold uppercase tracking-widest text-textPrimary leading-tight">NERMAI</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary -mt-1">Teacher Portal</div>
        </div>
      </div>
    </div>
  );

  const topbarRight = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="relative text-textSecondary hover:text-textPrimary">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
      </Button>
      <div className="h-6 w-px bg-border" />
      <div className="hidden sm:flex flex-col text-right">
        <span className="text-sm font-semibold text-textPrimary">{currentUser?.email?.split('@')[0] || 'Teacher'}</span>
        <span className="text-[10px] text-primary">Educator</span>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-surface to-background text-mutedForeground shadow-sm">
        <User size={18} />
      </div>
      <Button variant="ghost" size="icon" onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
        <LogOut size={18} />
      </Button>
    </div>
  );

  const sidebarContent = (
    <Sidebar isOpen={sidebarOpen}>
      {GROUPS.map((group) => {
        const items = TEACHER_NAV.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <SidebarGroup key={group} title={group}>
            {items.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/teacher'} className="outline-none">
                {({ isActive }) => (
                  <SidebarItem
                    isActive={isActive}
                    icon={<item.icon size={18} />}
                  >
                    {item.label}
                  </SidebarItem>
                )}
              </NavLink>
            ))}
          </SidebarGroup>
        );
      })}
    </Sidebar>
  );

  return (
    <AppLayout
      topbar={<Topbar leftContent={topbarLeft} rightContent={topbarRight} />}
      sidebar={sidebarContent}
    >
      <Outlet />
    </AppLayout>
  );
};

export default TeacherLayout;

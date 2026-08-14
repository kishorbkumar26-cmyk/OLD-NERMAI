import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import {
  LayoutDashboard, BookOpen, Radio, Users, CheckSquare, Bell, LogOut, Menu, X
} from 'lucide-react';
import { AppLayout } from '../../components/ui/AppLayout';
import { Topbar } from '../../components/ui/Topbar';
import { Sidebar, SidebarGroup, SidebarItem } from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
  { icon: BookOpen, label: 'My Courses', path: '/staff/courses' },
  { icon: Radio, label: 'My Live Classes', path: '/staff/classes' },
  { icon: Users, label: 'Students', path: '/staff/students' },
  { icon: CheckSquare, label: 'Attendance', path: '/staff/attendance' },
  { icon: Bell, label: 'Announcements', path: '/staff/announcements' },
];

export const StaffLayout = () => {
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

  const normalizedRole = (role || '').toLowerCase();
  if (!currentUser || !['super_admin', 'staff', 'teacher', 'management'].includes(normalizedRole)) {
    return <Navigate to="/admin/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const topbarLeft = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-textSecondary hover:text-textPrimary">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-yellow-600 text-background font-black shadow-sm">
          N
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-extrabold uppercase tracking-widest text-textPrimary leading-tight">NERMAI</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary -mt-1">Staff Portal</div>
        </div>
      </div>
    </div>
  );

  const topbarRight = (
    <div className="flex items-center gap-4">
      <div className="hidden sm:block text-right">
        <div className="text-sm font-semibold text-textPrimary">{currentUser.email?.split('@')[0]}</div>
        <div className="text-[11px] text-primary uppercase">{role}</div>
      </div>
      <div className="h-9 w-9 rounded-lg border border-border bg-gradient-to-br from-primary/50 to-destructive/50" />
      <Button variant="destructive" size="sm" onClick={logout} leftIcon={<LogOut size={16} />}>
        Logout
      </Button>
    </div>
  );

  const sidebarContent = (
    <Sidebar isOpen={sidebarOpen}>
      <SidebarGroup title="Menu">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/staff'} className="outline-none">
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

export default StaffLayout;

/**
 * NERMAI SACS — Web Neumorphic + Rectangular Navbar + Tab Layout
 * 
 * Design Language:
 *   - Dark neumorphism (surface #1B1B1B, bg #0E0E0E)
 *   - Gold (#D4AF37) primary, Red (#FF3B30) accent
 *   - Rectangular top navbar + neumorphic sidebar tabs (web)
 *   - All SACS screens embedded in this layout
 */

import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import {
  LayoutDashboard, BookOpen, Library, Layers, Presentation,
  Files, Video, Radio, Users, CheckSquare, MessageSquare,
  Bell, Settings, Bot, ShieldCheck, LogOut, ChevronRight,
  Menu, X,
} from 'lucide-react';

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const C = {
  bg:       '#0E0E0E',
  surface:  '#1B1B1B',
  surfHigh: '#252525',
  gold:     '#D4AF37',
  red:      '#FF3B30',
  text:     '#F8F8F8',
  muted:    '#A0A0A0',
  border:   'rgba(255,255,255,0.07)',
  goldA15:  'rgba(212,175,55,0.15)',
  goldA08:  'rgba(212,175,55,0.08)',
  redA15:   'rgba(255,59,48,0.15)',
};

/** Neumorphic shadow pair — raised element on #1B1B1B surface */
const NM_RAISED  = '5px 5px 14px #0a0a0a, -5px -5px 14px #2c2c2c';
/** Neumorphic shadow — active/pressed inset */
const NM_INSET   = 'inset 3px 3px 9px #0a0a0a, inset -3px -3px 9px #2c2c2c';
/** Neumorphic shadow — gold accent glow ring */
const NM_ACTIVE  = `3px 3px 12px #0a0a0a, -3px -3px 12px #2c2c2c, 0 0 0 1px rgba(212,175,55,0.35)`;
/** Flat/subtle raised */
const NM_FLAT    = '3px 3px 8px #0d0d0d, -3px -3px 8px #292929';

/* ─── Nav Items ─────────────────────────────────────────────────────────────── */
interface NavItem { icon: React.ElementType; label: string; path: string; group?: string; }

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/admin',             group: 'Overview'   },
  { icon: BookOpen,        label: 'Courses',        path: '/admin/courses',     group: 'LMS'        },
  { icon: Library,         label: 'Subjects',       path: '/admin/subjects',    group: 'LMS'        },
  { icon: Layers,          label: 'Topics',         path: '/admin/topics',      group: 'LMS'        },
  { icon: Presentation,   label: 'Classes',        path: '/admin/classes',     group: 'LMS'        },
  { icon: Files,           label: 'Resources',      path: '/admin/resources',   group: 'LMS'        },
  { icon: Video,           label: 'Videos',         path: '/admin/videos',      group: 'LMS'        },
  { icon: Radio,           label: 'Live Sessions',  path: '/admin/live',        group: 'LMS'        },
  { icon: ShieldCheck,     label: 'Access Control', path: '/admin/access',      group: 'Security'   },
  { icon: Users,           label: 'Students',       path: '/admin/students',    group: 'ERP'        },
  { icon: Users,           label: 'Staff',          path: '/admin/staff',       group: 'ERP'        },
  { icon: Layers,          label: 'Batches',        path: '/admin/batches',     group: 'ERP'        },
  { icon: CheckSquare,     label: 'Attendance',     path: '/admin/attendance',  group: 'ERP'        },
  { icon: Bot,             label: 'AI Assistant',   path: '/admin/assistant',   group: 'Tools'      },
  { icon: Bell,            label: 'Announcements',  path: '/admin/announcements', group: 'Tools'    },
  { icon: Settings,        label: 'Settings',       path: '/admin/settings',    group: 'Tools'      },
];

const GROUPS = ['Overview', 'LMS', 'Security', 'ERP', 'Tools'];

/* ─── Rectangular Top Navbar ─────────────────────────────────────────────────── */
const AdminNavbar: React.FC<{ onMenuToggle: () => void; sidebarOpen: boolean }> = ({
  onMenuToggle, sidebarOpen,
}) => {
  const { logout } = useAuth();

  return (
    <header
      style={{
        height: 60,
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        // subtle top gold line
        borderTop: `2px solid ${C.gold}`,
      }}
    >
      {/* Left: Brand + Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onMenuToggle}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: 8,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text)}
          onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.gold}, #b8942a)`,
              boxShadow: `0 0 16px rgba(212,175,55,0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              color: '#0E0E0E',
            }}
          >
            N
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              NERMAI
            </div>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 2, textTransform: 'uppercase', marginTop: -2 }}>
              Admin Hub
            </div>
          </div>
        </div>
      </div>

      {/* Center: Breadcrumb / Title tab strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: C.bg,
          borderRadius: 8,
          padding: '4px 6px',
          boxShadow: NM_INSET,
        }}
      >
        {['Dashboard', 'LMS', 'Access Control', 'Students', 'Settings'].map((tab, i) => (
          <NavbarTab key={tab} label={tab} active={i === 0} />
        ))}
      </div>

      {/* Right: Profile + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>System Admin</div>
          <div style={{ fontSize: 10, color: C.gold }}>super_admin</div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.gold}80, ${C.red}80)`,
            boxShadow: NM_FLAT,
            border: `1px solid ${C.border}`,
          }}
        />
        <button
          onClick={logout}
          style={{
            background: C.redA15,
            border: `1px solid ${C.red}30`,
            borderRadius: 8,
            padding: '7px 10px',
            cursor: 'pointer',
            color: C.red,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: NM_FLAT,
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
};

/* ─── Rectangular Navbar Tab Pill ─────────────────────────────────────────────── */
const NavbarTab: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div
    style={{
      padding: '5px 14px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: active ? 700 : 500,
      color: active ? '#0E0E0E' : C.muted,
      background: active
        ? `linear-gradient(135deg, ${C.gold}, #c9a732)`
        : 'transparent',
      boxShadow: active ? `0 2px 8px rgba(212,175,55,0.4)` : 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
    }}
  >
    {label}
  </div>
);

/* ─── Neumorphic Sidebar ──────────────────────────────────────────────────────── */
const AdminSidebar: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <aside
      style={{
        width: open ? 230 : 0,
        minWidth: open ? 230 : 0,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        backgroundColor: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ padding: '16px 12px', flex: 1 }}>
        {GROUPS.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group);
          return (
            <div key={group} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: C.gold,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  padding: '0 10px',
                  marginBottom: 6,
                }}
              >
                {group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(item => (
                  <SidebarNavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

/* ─── Individual Neumorphic Sidebar Item ─────────────────────────────────────── */
const SidebarNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        color: isActive ? C.text : C.muted,
        background: isActive ? C.surfHigh : (hovered ? C.surfHigh + 'cc' : 'transparent'),
        boxShadow: isActive ? NM_ACTIVE : (hovered ? NM_FLAT : 'none'),
        transition: 'all 0.2s',
        // Left gold border on active
        borderLeft: isActive ? `2px solid ${C.gold}` : '2px solid transparent',
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        whiteSpace: 'nowrap',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <item.icon size={15} />
      <span>{item.label}</span>
      {item.path === '/admin/access' && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            background: C.goldA15,
            color: C.gold,
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 700,
          }}
        >
          NEW
        </span>
      )}
    </NavLink>
  );
};

/* ─── Main Layout Shell ───────────────────────────────────────────────────────── */
export const AdminLayout: React.FC = () => {
  const { currentUser, role, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          background: C.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Neumorphic spinner ring */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `3px solid ${C.surfHigh}`,
            borderTopColor: C.gold,
            animation: 'spin 0.9s linear infinite',
            boxShadow: NM_RAISED,
          }}
        />
        <div style={{ color: C.muted, fontSize: 13, letterSpacing: 1 }}>Loading...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser || (role !== 'super_admin' && role !== 'admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: C.bg,
        fontFamily: `'Inter', 'Segoe UI', sans-serif`,
        color: C.text,
        overflow: 'hidden',
      }}
    >
      {/* Rectangular Navbar — full width at top */}
      <AdminNavbar onMenuToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />

      {/* Body: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AdminSidebar open={sidebarOpen} />

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 28,
            position: 'relative',
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: 'fixed',
              top: 80,
              right: -100,
              width: 500,
              height: 500,
              background: `radial-gradient(circle, ${C.goldA08} 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

/**
 * NERMAI SACS — Web Premium Student Profile
 *
 * Design:
 *   - Dark Neumorphism with Gold/Red glowing accents
 *   - Glassmorphism effect over Neumorphic surfaces
 *   - Desktop optimized layout
 */

import React from 'react';
import { useAuth } from '../../core/auth/AuthProvider';
import { Settings, Bell, LogOut, ShieldCheck, Mail, GraduationCap, ChevronRight } from 'lucide-react';
import { StudentGlassCard } from '../../components/ui/StudentGlassCard';

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const C = {
  bg:       '#0E0E0E',
  surface:  '#1B1B1B',
  gold:     '#D4AF37',
  red:      '#FF3B30',
  text:     '#F8F8F8',
  muted:    '#A0A0A0',
  goldA15:  'rgba(212,175,55,0.15)',
  redA15:   'rgba(255,59,48,0.15)',
};

export const StudentProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const email = currentUser?.email || 'scholar@nermai.com';
  const name = email.split('@')[0].toUpperCase();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="w-full md:w-1/3">
          <StudentGlassCard className="flex flex-col items-center text-center p-8 relative overflow-hidden">
            {/* Ambient glow inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            
            <div className="w-24 h-24 rounded-full bg-surface border-[3px] border-primary flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-4 relative z-10">
              <span className="text-4xl font-black text-primary">{name.charAt(0)}</span>
            </div>
            
            <h2 className="text-2xl font-black text-textPrimary tracking-wide">{name}</h2>
            
            <div className="mt-2 mb-6 inline-block bg-primary/20 text-primary text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
              Premium Scholar
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-2">
              <div>
                <div className="text-2xl font-black text-textPrimary">12</div>
                <div className="text-[10px] font-bold text-textSecondary tracking-widest uppercase">Courses</div>
              </div>
              <div className="border-l border-white/5 pl-4">
                <div className="text-2xl font-black text-textPrimary">94%</div>
                <div className="text-[10px] font-bold text-textSecondary tracking-widest uppercase">Attendance</div>
              </div>
            </div>
          </StudentGlassCard>
        </div>

        {/* Right Column: Details & Preferences */}
        <div className="w-full md:w-2/3 space-y-8">
          
          <section>
            <h3 className="text-xs font-bold text-textSecondary uppercase tracking-[2px] mb-4 ml-2">Account Information</h3>
            <StudentGlassCard className="p-0 overflow-hidden divide-y divide-white/5">
              
              <div className="flex items-center p-5 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mr-4">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-textSecondary mb-1">Email Address</div>
                  <div className="text-base font-bold text-textPrimary">{email}</div>
                </div>
              </div>

              <div className="flex items-center p-5 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mr-4">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-textSecondary mb-1">Current Batch</div>
                  <div className="text-base font-bold text-textPrimary">UPSC Online Foundation</div>
                </div>
              </div>

              <div className="flex items-center p-5 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mr-4">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-textSecondary mb-1">Account Status</div>
                  <div className="text-base font-bold text-success">Active & Verified</div>
                </div>
              </div>

            </StudentGlassCard>
          </section>

          <section>
            <h3 className="text-xs font-bold text-textSecondary uppercase tracking-[2px] mb-4 ml-2">Preferences</h3>
            <StudentGlassCard className="p-0 overflow-hidden divide-y divide-white/5">
              
              <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left group">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-surfaceHighlight flex items-center justify-center mr-4 group-hover:bg-surfaceHighlight/80 transition-colors">
                    <Settings className="w-5 h-5 text-textPrimary" />
                  </div>
                  <span className="text-base font-bold text-textPrimary">Platform Settings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-textSecondary group-hover:text-textPrimary transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left group">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-surfaceHighlight flex items-center justify-center mr-4 group-hover:bg-surfaceHighlight/80 transition-colors">
                    <Bell className="w-5 h-5 text-textPrimary" />
                  </div>
                  <span className="text-base font-bold text-textPrimary">Notification Preferences</span>
                </div>
                <ChevronRight className="w-5 h-5 text-textSecondary group-hover:text-textPrimary transition-colors" />
              </button>

            </StudentGlassCard>
          </section>

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border border-accent/40 bg-accent/15 hover:bg-accent/25 transition-all text-accent font-bold group shadow-sm shadow-accent/10"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Log Out Securely</span>
          </button>
          
          <div className="text-center text-xs font-bold tracking-widest text-textSecondary/50 uppercase">
            NERMAI Academy v2.0.0
          </div>

        </div>
      </div>
    </div>
  );
};

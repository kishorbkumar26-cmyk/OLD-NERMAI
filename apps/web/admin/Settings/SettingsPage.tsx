import React from 'react';
import { AdminButton as Button } from '../components/ui/AdminForms';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#D4AF37]/10 transition-colors" />
          <h3 className="text-lg font-bold text-white mb-2">Academy Profile</h3>
          <p className="text-gray-400 text-sm mb-4">Update logo, name, and domain settings.</p>
          <Button variant="secondary" className="w-full justify-center">Manage Profile</Button>
        </div>
        
        <div className="bg-[#1E1E1E] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#D4AF37]/10 transition-colors" />
          <h3 className="text-lg font-bold text-white mb-2">Billing & Subscriptions</h3>
          <p className="text-gray-400 text-sm mb-4">View your current NERMAI plan and usage limits.</p>
          <Button variant="secondary" className="w-full justify-center">Manage Billing</Button>
        </div>
        
        <div className="bg-[#1E1E1E] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#D4AF37]/10 transition-colors" />
          <h3 className="text-lg font-bold text-white mb-2">Meeting Providers</h3>
          <p className="text-gray-400 text-sm mb-4">Manage Zoom, Google Meet accounts, and concurrency limits.</p>
          <Button variant="secondary" className="w-full justify-center" onClick={() => window.location.href = '/admin/settings/meeting-providers'}>Configure Providers</Button>
        </div>

        <div className="bg-[#1E1E1E] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#D4AF37]/10 transition-colors" />
          <h3 className="text-lg font-bold text-white mb-2">Security & MFA</h3>
          <p className="text-gray-400 text-sm mb-4">Enforce 2FA for staff and manage security policies.</p>
          <Button variant="secondary" className="w-full justify-center">Security Settings</Button>
        </div>
      </div>
    </div>
  );
};

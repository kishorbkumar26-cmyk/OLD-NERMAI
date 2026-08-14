import React, { useState } from 'react';
import { Bot, FileText, Activity, Search, HelpCircle, Zap, Settings, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock components for the tabs
const FAQsTab = () => <div className="p-4 text-gray-400">Manage Multilingual FAQs here...</div>;
const IntentsTab = () => <div className="p-4 text-gray-400">Manage Intent Dictionary here...</div>;
const AnalyticsTab = () => <div className="p-4 text-gray-400">Assistant Analytics (Top Searches) here...</div>;
const LogsTab = () => <div className="p-4 text-gray-400">Search Logs here...</div>;
const UnansweredTab = () => <div className="p-4 text-gray-400">Unanswered Questions here...</div>;
const QuickActionsTab = () => <div className="p-4 text-gray-400">Configure Quick Actions here...</div>;
const SettingsTab = () => <div className="p-4 text-gray-400">Assistant Settings here...</div>;
const PreviewTab = () => <div className="p-4 text-gray-400">Test the Assistant here...</div>;

export const AssistantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('faqs');

  const tabs = [
    { id: 'faqs', label: 'FAQs', icon: <FileText className="w-5 h-5" /> },
    { id: 'intents', label: 'Intent Dictionary', icon: <Bot className="w-5 h-5" /> },
    { id: 'quickActions', label: 'Quick Actions', icon: <Zap className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity className="w-5 h-5" /> },
    { id: 'logs', label: 'Search Logs', icon: <Search className="w-5 h-5" /> },
    { id: 'unanswered', label: 'Unanswered', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'preview', label: 'Preview Assistant', icon: <Eye className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex-none p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NERMAI Assistant</h1>
            <p className="text-slate-400 mt-1">Manage knowledge base, intents, and assistant settings</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative z-10 p-6">
        <div className="h-full bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-md overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'faqs' && <FAQsTab />}
              {activeTab === 'intents' && <IntentsTab />}
              {activeTab === 'quickActions' && <QuickActionsTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'logs' && <LogsTab />}
              {activeTab === 'unanswered' && <UnansweredTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'preview' && <PreviewTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

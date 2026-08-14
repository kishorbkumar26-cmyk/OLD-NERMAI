import React, { useState } from 'react';
import { Search, Clock, Users } from 'lucide-react';
import { AdminTable, AdminInput, AdminButton, AdminSelect } from '../../components/ui';
import api from '../../../core/api';

export const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('session'); // 'session' or 'student'
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const endpoint = searchMode === 'session' 
        ? `/admin/attendance/session/${searchQuery}`
        : `/admin/attendance/student/${searchQuery}`;
      
      const res = await api.get(endpoint);
      setLogs(res.data || []);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      alert('Error fetching attendance logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'sessionId', label: 'Session ID' },
    { key: 'joinedAt', label: 'Joined At', render: (val: string) => new Date(val).toLocaleString() },
    { key: 'leftAt', label: 'Left At', render: (val: string) => val ? new Date(val).toLocaleString() : 'Currently Active' },
    { key: 'durationSeconds', label: 'Duration', render: (val: number) => {
      if (val === undefined || val === null) return '-';
      const m = Math.floor(val / 60);
      const s = val % 60;
      return `${m}m ${s}s`;
    }}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Live Attendance Logs</h1>
        <p className="text-textSecondary text-sm">Monitor student engagement across live streaming sessions.</p>
      </div>

      <div className="bg-surface/80 border border-accent/20 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="w-48">
            <AdminSelect 
              label="Search By"
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              options={[
                { value: 'session', label: 'Session ID' },
                { value: 'student', label: 'Student ID' }
              ]}
            />
          </div>
          <div className="flex-1">
            <AdminInput 
              label={`Enter ${searchMode === 'session' ? 'Session' : 'Student'} ID`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`e.g. ${searchMode === 'session' ? 'sess_123' : 'user_456'}`}
              required
            />
          </div>
          <div className="mb-4">
            <AdminButton type="submit" isLoading={isLoading}>
              <Search className="w-4 h-4" /> Search
            </AdminButton>
          </div>
        </form>
      </div>

      {logs.length > 0 ? (
        <AdminTable 
          columns={columns} 
          data={logs} 
          isLoading={isLoading}
        />
      ) : (
        <div className="bg-surface/50 border border-accent/10 rounded-xl p-12 text-center text-textSecondary/70 flex flex-col items-center justify-center">
          <Clock className="w-12 h-12 mb-4 opacity-30" />
          <p>Search for a session or student to view attendance records.</p>
        </div>
      )}
    </div>
  );
};

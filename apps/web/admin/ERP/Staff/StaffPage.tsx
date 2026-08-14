import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, Trash2, X, MoreVertical } from 'lucide-react';
import { AdminTable, AdminModal, AdminInput, AdminSelect, AdminButton } from '../../components/ui';
import { StaffApi } from '@nermai/api';

export const StaffPage = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('All Staff');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    staffId: '',
    staffRole: 'TEACHER',
    password: '',
    confirmPassword: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await StaffApi.listStaff();
      let staffData = res.data?.data || [];
      
      // Fetch stats for each staff member
      const withStats = await Promise.all(staffData.map(async (st: any) => {
        try {
          const [classRes, sessionRes] = await Promise.all([
            StaffApi.getStaffClasses(st.id),
            StaffApi.getStaffLiveSessions(st.id)
          ]);
          return {
            ...st,
            classes: classRes.data?.data?.classes || 0,
            liveSessions: sessionRes.data?.data?.liveSessions || 0
          };
        } catch(e) {
          return { ...st, classes: 0, liveSessions: 0 };
        }
      }));
      
      setStaff(withStats);
    } catch (error) {
      console.error('Failed to fetch staff data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.password !== createFormData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    try {
      await StaffApi.createStaff({
        name: createFormData.name,
        email: createFormData.email,
        staffRole: createFormData.staffRole,
        staffId: createFormData.staffId || undefined,
        password: createFormData.password
      });
      
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '', email: '', phoneNumber: '', staffId: '', staffRole: 'TEACHER', password: '', confirmPassword: ''
      });
      fetchData();
      alert('Staff created successfully!');
    } catch (error) {
      console.error('Failed to create staff', error);
      alert('Error creating staff.');
    }
  };

  const columns = [
    { key: 'staffId', label: 'STAFF ID', render: (val: string, row: any) => <span className="text-gray-400 text-xs font-mono">{row.staffId || row.id?.substring(0, 8).toUpperCase()}</span> },
    { key: 'name', label: 'NAME' },
    { key: 'email', label: 'EMAIL' },
    { key: 'staffRole', label: 'ROLE', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'TEACHER' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
        {val?.toUpperCase() || 'STAFF'}
      </span>
    )},
    { key: 'status', label: 'STATUS', render: (val: string) => {
      let colorClass = 'bg-gray-500/20 text-gray-400';
      const status = (val || 'ACTIVE').toUpperCase();
      if (status === 'ACTIVE') colorClass = 'bg-green-500/20 text-green-400';
      if (status === 'SUSPENDED') colorClass = 'bg-orange-500/20 text-orange-400';
      if (status === 'DISABLED') colorClass = 'bg-red-500/20 text-red-400';
      if (status === 'ARCHIVED') colorClass = 'bg-neutral-800 text-neutral-400';
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {status}
        </span>
      );
    }},
    { key: 'classes', label: 'ASSIGNED CLASSES', render: (val: number) => <span className="font-semibold text-gray-300">{val || 0}</span> },
    { key: 'liveSessions', label: 'LIVE SESSIONS HOSTED', render: (val: number) => <span className="font-semibold text-gray-300">{val || 0}</span> },
    { key: 'actions', label: 'ACTIONS', render: (_: any, row: any) => (
      <div className="flex gap-2">
        <button disabled className="text-gray-500 text-xs font-semibold px-2 py-1 border border-gray-500/30 rounded-lg flex items-center gap-1 opacity-50 cursor-not-allowed" title="Edit Profile">
          ✏️ Edit
        </button>
        <button disabled className="text-red-500/50 text-xs font-semibold px-2 py-1 border border-red-500/30 rounded-lg flex items-center gap-1 opacity-50 cursor-not-allowed" title="Archive Account">
          🗑️ Archive
        </button>
      </div>
    )}
  ];

  const filteredStaff = staff.filter(s => {
    // Tab Filter
    if (activeTab === 'Teachers' && s.staffRole !== 'TEACHER') return false;
    if (activeTab === 'Management' && s.staffRole !== 'MANAGEMENT') return false;
    if (activeTab === 'Archived' && s.status !== 'ARCHIVED') return false;
    if (activeTab !== 'Archived' && s.status === 'ARCHIVED') return false; // Hide archived from other tabs
    
    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.email?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Staff Management</h1>
          <p className="text-textSecondary text-sm mt-1">Manage teachers, administrators, and organization staff.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/50 border border-accent/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <AdminButton onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4" /> Create Staff
          </AdminButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-accent/20">
        {['All Staff', 'Teachers', 'Management', 'Archived'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AdminTable 
        columns={columns} 
        data={filteredStaff} 
        isLoading={isLoading}
      />

      {/* Create Staff Modal */}
      <AdminModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New Staff Member"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <AdminInput 
              label="Full Name" 
              value={createFormData.name} 
              onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})} 
              required 
            />
            <AdminInput 
              label="Staff ID (Optional)" 
              value={createFormData.staffId} 
              onChange={(e) => setCreateFormData({...createFormData, staffId: e.target.value})} 
              placeholder="e.g. STF-001"
            />
          </div>
          <AdminInput 
            label="Phone Number" 
            value={createFormData.phoneNumber} 
            onChange={(e) => setCreateFormData({...createFormData, phoneNumber: e.target.value})} 
          />
          <AdminInput 
            label="Email Address (Username)" 
            type="email"
            value={createFormData.email} 
            onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})} 
            required
          />
          <AdminSelect 
            label="Role"
            value={createFormData.staffRole}
            onChange={(e) => setCreateFormData({...createFormData, staffRole: e.target.value})}
            options={[
              { value: 'TEACHER', label: 'Teacher' },
              { value: 'MANAGEMENT', label: 'Management' }
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput 
              label="Password" 
              type="password"
              value={createFormData.password} 
              onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})} 
              required
            />
            <AdminInput 
              label="Confirm Password" 
              type="password"
              value={createFormData.confirmPassword} 
              onChange={(e) => setCreateFormData({...createFormData, confirmPassword: e.target.value})} 
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <AdminButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">Create Staff</AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { UserPlus, BookOpen, Trash2, X } from 'lucide-react';
import { AdminTable, AdminModal, AdminInput, AdminSelect, AdminButton } from '../../components/ui';
import { StudentApi  } from '@nermai/api';
import { BatchApi  } from '@nermai/api';
import { StaffApi } from '@nermai/api';

export const StudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<any>(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteStudent, setPromoteStudent] = useState<any>(null);
  const [promoteRole, setPromoteRole] = useState('TEACHER');
  
  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    rollNo: '',
    accessTier: 'free',
    status: 'active'
  });

  // Batch Assignment State
  const [enrollFormData, setEnrollFormData] = useState({
    batchId: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studRes, batchRes] = await Promise.all([
        StudentApi.listStudents(),
        BatchApi.listBatches()
      ]);
      setStudents(studRes.data?.data || []);
      setCourses(batchRes.data?.data || []); // We'll keep the state variable named courses for now or change it. Actually let's just use it as is but it holds batches
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setEditFormData({
      displayName: student.displayName || '',
      email: student.email || '',
      phoneNumber: student.phoneNumber || '',
      rollNo: student.rollNo || '',
      accessTier: student.accessTier || 'free',
      status: student.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEnroll = (student: any) => {
    setEnrollStudent(student);
    setEnrollStudentId(student.id);
    setEnrollFormData({ batchId: '' });
    setIsEnrollModalOpen(true);
  };

  const handleOpenPromote = (student: any) => {
    setPromoteStudent(student);
    setPromoteRole('TEACHER');
    setIsPromoteModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await StudentApi.updateStudent(editingStudent.id, editFormData);
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update student', error);
      alert('Error updating student.');
    }
  };

  const handleSaveEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollFormData.batchId) return alert('Select a batch');
    try {
      await StudentApi.assignBatch(enrollStudentId, enrollFormData.batchId);
      setIsEnrollModalOpen(false);
      fetchData();
      alert('Student added to batch successfully!');
    } catch (error: any) {
      console.error('Failed to enroll student', error);
      alert(error?.response?.data?.message || 'Error assigning to batch.');
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the batch?')) return;
    try {
      await StudentApi.removeBatch(enrollStudentId, batchId);
      alert('Removed from batch successfully!');
      setIsEnrollModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error removing batch.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record? This cannot be undone.')) return;
    try {
      await StudentApi.deleteStudent(studentId);
      alert('Student deleted successfully!');
      fetchData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error deleting student.');
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to promote this user to ${promoteRole}? They will be removed from all batches.`)) return;
    try {
      await StaffApi.promoteStudent(promoteStudent.id, promoteRole);
      
      setIsPromoteModalOpen(false);
      fetchData();
      alert(`User promoted to ${promoteRole} successfully!`);
    } catch (error) {
      console.error('Failed to promote user', error);
      alert('Error promoting user.');
    }
  };

  const columns = [
    { key: 'rollNo', label: 'Roll No', render: (val: string) => val || <span className="text-gray-500 italic">Unassigned</span> },
    { key: 'displayName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'accessTier', label: 'Tier', render: (val: string, row: any) => {
      let tier = val;
      if (!tier) {
        if (row.programMemberships && row.programMemberships.some((m: any) => m.status === 'active')) {
          tier = 'enrolled';
        } else {
          tier = 'free';
        }
      }
      return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tier === 'premium' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : tier === 'paid' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : tier === 'enrolled' ? 'bg-blue-500/20 text-blue-400' : tier === 'scholarship' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
        {tier?.toUpperCase()}
      </span>
      );
    }},
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {val?.toUpperCase()}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (_: any, row: any) => (
      <div className="flex gap-2">
        <button onClick={() => handleOpenEnroll(row)} className="text-accent hover:text-primary text-xs font-semibold px-2 py-1 border border-accent/30 rounded-lg flex items-center gap-1 transition-colors" title="Assign to Batch">
          <BookOpen className="w-3 h-3" />
        </button>
        {row.role !== 'staff' && row.role !== 'super_admin' && (
          <button onClick={() => handleOpenPromote(row)} className="text-blue-500 hover:text-blue-400 text-xs font-semibold px-2 py-1 border border-blue-500/30 rounded-lg flex items-center gap-1 transition-colors" title="Promote to Staff">
            🛡️ Promote
          </button>
        )}
        <button onClick={() => handleDeleteStudent(row.id)} className="text-red-500 hover:text-red-400 text-xs font-semibold px-2 py-1 border border-red-500/30 rounded-lg flex items-center gap-1 transition-colors" title="Delete Student">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )}
  ];

  const filteredStudents = students.filter(s => 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Student Directory</h1>
          <p className="text-textSecondary text-sm mt-1">Manage students, tiers, and enrollments.</p>
        </div>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/50 border border-accent/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={filteredStudents} 
        isLoading={isLoading}
        onEdit={handleOpenEdit}
      />

      {/* Edit Student Modal */}
      <AdminModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveEdit} className="space-y-2">
          <AdminInput 
            label="Full Name" 
            value={editFormData.displayName} 
            onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})} 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput 
              label="Email Address" 
              type="email"
              value={editFormData.email} 
              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
              required
            />
            <AdminInput 
              label="Phone Number" 
              value={editFormData.phoneNumber} 
              onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})} 
            />
          </div>
          <AdminInput 
            label="Roll Number (Admin Assigned)" 
            value={editFormData.rollNo} 
            onChange={(e) => setEditFormData({...editFormData, rollNo: e.target.value})} 
            placeholder="e.g. NERMAI-001"
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect 
              label="Access Tier"
              value={editFormData.accessTier}
              onChange={(e) => setEditFormData({...editFormData, accessTier: e.target.value})}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'paid', label: 'Paid' },
                { value: 'scholarship', label: 'Scholarship' },
                { value: 'blocked', label: 'Blocked' }
              ]}
            />
            <AdminSelect 
              label="Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' }
              ]}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <AdminButton type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</AdminButton>
              <AdminButton type="submit">Save Changes</AdminButton>
            </div>
          </form>
        </AdminModal>

      {/* Promote to Staff Modal */}
      <AdminModal 
        isOpen={isPromoteModalOpen} 
        onClose={() => setIsPromoteModalOpen(false)} 
        title="Promote to Staff"
      >
        <div className="mb-4 text-sm text-gray-300">
          Promoting <b>{promoteStudent?.displayName || promoteStudent?.email}</b> will remove them from all batches and archive their student profile.
        </div>
        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          <AdminSelect
            label="Staff Role"
            value={promoteRole}
            onChange={(e) => setPromoteRole(e.target.value)}
            options={[
              { value: 'TEACHER', label: 'Teacher' },
              { value: 'MANAGEMENT', label: 'Management' }
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <AdminButton type="button" variant="secondary" onClick={() => setIsPromoteModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">Promote</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Enroll Student Modal */}
      <AdminModal 
        isOpen={isEnrollModalOpen} 
        onClose={() => setIsEnrollModalOpen(false)} 
        title="Assign to Batch"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Batches</h3>
          {enrollStudent?.programMemberships?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {enrollStudent.programMemberships.map((m: any) => {
                const batchInfo = courses.find((b: any) => b.id === m.batchId);
                return (
                  <span key={m.batchId} className="flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-semibold border border-[#D4AF37]/30">
                    {batchInfo ? batchInfo.name : 'Unknown Batch'}
                    <button type="button" onClick={() => handleRemoveBatch(m.batchId)} className="hover:text-white transition-colors" title="Remove from batch">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Not enrolled in any batches</p>
          )}
        </div>

        <form onSubmit={handleSaveEnroll} className="space-y-2 border-t border-white/10 pt-4">
          <AdminSelect 
            label="Assign New Batch"
            value={enrollFormData.batchId}
            onChange={(e) => setEnrollFormData({...enrollFormData, batchId: e.target.value})}
            required
            options={[
              { value: '', label: 'Select a batch...' },
              ...courses.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <div className="pt-4 flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsEnrollModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">Complete Enrollment</AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

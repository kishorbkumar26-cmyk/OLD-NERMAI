import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminTable, AdminModal, AdminInput, AdminSelect, AdminButton } from '../../components/ui';
import { BatchApi  } from '@nermai/api';
import { CourseApi  } from '@nermai/api';

export const BatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    maxCapacity: 100,
    startDate: '',
    status: 'upcoming',
    batchType: 'online'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [batchRes, courseRes] = await Promise.all([
        BatchApi.listBatches(),
        CourseApi.listCourses()
      ]);
      setBatches(batchRes.data?.data || []);
      setCourses(courseRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (batch: any) => {
    setDeleteConfirm(batch.id);
  };

  const performDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await BatchApi.deleteBatch(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete batch', error);
      alert('Failed to delete batch');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleOpenModal = (batch: any = null) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        name: batch.name || '',
        courseId: batch.courseId || '',
        maxCapacity: batch.maxCapacity || 100,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 16) : '',
        status: batch.status || 'upcoming',
        batchType: batch.batchType || 'online'
      });
    } else {
      setEditingBatch(null);
      setFormData({ name: '', courseId: '', maxCapacity: 100, startDate: '', status: 'upcoming', batchType: 'online' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) return alert('Select a course');
    try {
      const payload = {
        ...formData,
        maxCapacity: Number(formData.maxCapacity),
        startDate: new Date(formData.startDate).toISOString()
      };
      
      if (editingBatch) {
        await BatchApi.updateBatch(editingBatch.id, payload);
      } else {
        await BatchApi.createBatch(payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save batch', error);
      alert('Error saving batch.');
    }
  };

  const columns = [
    { key: 'name', label: 'Batch Name' },
    { key: 'courseId', label: 'Course', render: (val: string) => courses.find(c => c.id === val)?.name || courses.find(c => c.id === val)?.title || val },
    { key: 'batchType', label: 'Type', render: (val: string) => (
      <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs capitalize">{val || 'Online'}</span>
    )},
    { key: 'currentEnrollment', label: 'Enrollment', render: (val: number, row: any) => `${val || 0} / ${row.maxCapacity}` },
    { key: 'startDate', label: 'Start Date', render: (val: string) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {val?.toUpperCase()}
      </span>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Batches</h1>
          <p className="text-textSecondary text-sm mt-1">Manage cohorts and batch capacities.</p>
        </div>
        <AdminButton onClick={handleOpenModal}>
          <Plus className="w-5 h-5" />
          Create Batch
        </AdminButton>
      </div>

      <AdminTable 
        columns={columns} 
        data={batches} 
        isLoading={isLoading}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingBatch ? "Edit Batch" : "Create New Batch"}
      >
        <form onSubmit={handleSave} className="space-y-2">
          <AdminInput 
            label="Batch Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <AdminSelect 
            label="Belongs to Course"
            value={formData.courseId}
            onChange={(e) => setFormData({...formData, courseId: e.target.value})}
            required
            options={[
              { value: '', label: 'Select a course...' },
              ...courses.map(c => ({ value: c.id, label: c.name || c.title }))
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput 
              label="Max Capacity" 
              type="number"
              value={formData.maxCapacity} 
              onChange={(e) => setFormData({...formData, maxCapacity: Number(e.target.value)})} 
              required
            />
            <AdminInput 
              label="Start Date" 
              type="datetime-local"
              value={formData.startDate} 
              onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect 
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' }
              ]}
            />
            <AdminSelect 
              label="Batch Type"
              value={formData.batchType}
              onChange={(e) => setFormData({...formData, batchType: e.target.value})}
              options={[
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
                { value: 'recorded', label: 'Recorded' }
              ]}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">{editingBatch ? 'Save Changes' : 'Create Batch'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-nermai-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Batch</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete this batch? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={() => performDelete(deleteConfirm)} 
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 shadow-lg shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

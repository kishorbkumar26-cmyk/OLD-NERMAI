import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminTable, AdminModal, AdminInput, AdminSelect, AdminButton } from '../../components/ui';
import { CourseApi  } from '@nermai/api';

export const SubjectsPage = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    order: 0,
    status: 'active'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subjRes, coursesRes] = await Promise.all([
        CourseApi.listAllSubjects(),
        CourseApi.listCourses()
      ]);
      setSubjects(subjRes.data?.data || []);
      setCourses(coursesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (subject: any) => {
    setDeleteConfirm(subject.id);
  };

  const performDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await CourseApi.deleteSubject(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete subject', error);
      alert('Failed to delete subject');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleOpenModal = (subject: any = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name || subject.title || '',
        description: subject.description || '',
        courseId: subject.courseId || '',
        order: subject.order || 0,
        status: subject.status || 'active'
      });
    } else {
      setEditingSubject(null);
      setFormData({ name: '', description: '', courseId: '', order: 0, status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      alert('Please select a course.');
      return;
    }

    try {
      if (editingSubject) {
        await CourseApi.updateSubject(editingSubject.id, formData);
      } else {
        await CourseApi.createSubject(formData.courseId, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save subject', error);
      alert('Error saving subject. Check console.');
    }
  };

  const columns = [
    { key: 'name', label: 'Subject Name' },
    { key: 'courseId', label: 'Course', render: (val: string) => courses.find(c => c.id === val)?.name || courses.find(c => c.id === val)?.title || val },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(val || 'active') === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {(val || 'active').toUpperCase()}
      </span>
    )},
    { key: 'order', label: 'Order' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Subjects</h1>
          <p className="text-textSecondary text-sm mt-1">Manage subjects within courses.</p>
        </div>
        <AdminButton onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5" />
          Create Subject
        </AdminButton>
      </div>

      <AdminTable 
        columns={columns} 
        data={subjects} 
        isLoading={isLoading}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSubject ? "Edit Subject" : "Create New Subject"}
      >
        <form onSubmit={handleSave} className="space-y-2">
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
          <AdminInput 
            label="Subject Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-medium text-[#E5E5E5]">Description</label>
            <textarea
              className="bg-surface border border-accent/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect 
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
            <AdminInput 
              label="Display Order" 
              type="number"
              value={formData.order} 
              onChange={(e) => setFormData({...formData, order: Number(e.target.value)})} 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">Save Subject</AdminButton>
          </div>
        </form>
      </AdminModal>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-nermai-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Subject</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete this subject? This action cannot be undone.
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

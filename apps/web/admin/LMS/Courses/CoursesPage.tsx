import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminTable, AdminModal, AdminInput, AdminSelect, AdminButton } from '../../components/ui';
import { CourseApi  } from '@nermai/api';

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    price: 0,
    tags: ''
  });

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await CourseApi.listCourses();
      setCourses(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = (course: any) => {
    setDeleteConfirm(course.id);
  };

  const performDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await CourseApi.deleteCourse(id);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course', error);
      alert('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleOpenModal = (course: any = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name || course.title || '',
        description: course.description || '',
        visibility: course.visibility || course.status || 'private',
        price: course.price || 0,
        tags: course.tags ? course.tags.join(', ') : ''
      });
    } else {
      setEditingCourse(null);
      setFormData({ name: '', description: '', visibility: 'private', price: 0, tags: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Number(formData.price)
      };

      if (editingCourse) {
        await CourseApi.updateCourse(editingCourse.id, payload);
      } else {
        await CourseApi.createCourse(payload);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (error) {
      console.error('Failed to save course', error);
      alert('Error saving course. Check console.');
    }
  };

  const columns = [
    { key: 'name', label: 'Course Name' },
    { key: 'visibility', label: 'Visibility', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(val || 'private') === 'public' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {(val || 'private').toUpperCase()}
      </span>
    )},
    { key: 'price', label: 'Price', render: (val: number) => `₹${val}` }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="text-textSecondary text-sm mt-1">Manage master courses and offerings.</p>
        </div>
        <AdminButton onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5" />
          Create Course
        </AdminButton>
      </div>

      <AdminTable 
        columns={columns} 
        data={courses} 
        isLoading={isLoading}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCourse ? "Edit Course" : "Create New Course"}
      >
        <form onSubmit={handleSave} className="space-y-2">
          <AdminInput 
            label="Course Name" 
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
              label="Visibility"
              value={formData.visibility}
              onChange={(e) => setFormData({...formData, visibility: e.target.value})}
              options={[
                { value: 'private', label: 'Private' },
                { value: 'public', label: 'Public' },
                { value: 'restricted', label: 'Restricted (Batch only)' }
              ]}
            />
            <AdminInput 
              label="Price (₹)" 
              type="number"
              value={formData.price} 
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
            />
          </div>
          <AdminInput 
            label="Tags (comma separated)" 
            value={formData.tags} 
            onChange={(e) => setFormData({...formData, tags: e.target.value})} 
          />
          
          <div className="pt-4 flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit">Save Course</AdminButton>
          </div>
        </form>
      </AdminModal>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-nermai-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Course</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete this course? This action cannot be undone.
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

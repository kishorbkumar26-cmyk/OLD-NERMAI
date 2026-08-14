import React, { useEffect, useState } from 'react';
import { ResourceApi  } from '@nermai/api';
import { Plus, Search, FileText, Lock, Globe, UploadCloud, Edit } from 'lucide-react';
import ResourceForm from '../Resources/ResourceForm'; // Re-evaluating import

export function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data } = await ResourceApi.list({ search, categoryId });
      setResources(data.data);
    } catch (error) {
      console.error('Failed to fetch resources', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, categoryId]);

  const performDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await ResourceApi.deleteResource(id);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource', err);
      alert('Failed to delete resource');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-8 text-white w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Resource Management</h1>
          <p className="text-gray-400">Manage PDFs, documents, and other global assets.</p>
        </div>
        <button
          onClick={() => { setEditingResource(null); setIsFormOpen(true); }}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Upload Resource
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="p-4 font-medium text-gray-400 text-sm">Title</th>
                <th className="p-4 font-medium text-gray-400 text-sm">Type</th>
                <th className="p-4 font-medium text-gray-400 text-sm">Visibility</th>
                <th className="p-4 font-medium text-gray-400 text-sm">Category</th>
                <th className="p-4 font-medium text-gray-400 text-sm">Version</th>
                <th className="p-4 font-medium text-gray-400 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading resources...</td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No resources found.</td>
                </tr>
              ) : (
                resources.map(res => (
                  <tr key={res.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{res.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{res.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 uppercase tracking-wider">{res.mimeType === 'application/pdf' ? 'PDF' : 'DOC'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm bg-gray-800 w-max px-2.5 py-1 rounded-md text-gray-300">
                        {res.visibility === 'public' ? <Globe className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                        <span className="capitalize">{res.visibility}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{res.categoryId || 'General'}</td>
                    <td className="p-4">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">v{res.version}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => { setEditingResource(res); setIsFormOpen(true); }}
                        className="text-gray-400 hover:text-white p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(res.id)}
                        className="text-gray-400 hover:text-red-500 p-2 ml-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <ResourceForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); fetchResources(); }}
          initialData={editingResource}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Resource</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete this resource? This action cannot be undone.
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
}

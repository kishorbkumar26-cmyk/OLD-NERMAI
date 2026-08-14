import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProviderAccountsApi } from '@nermai/api';
import { Plus, Video, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { ProviderAccountDialog } from './ProviderAccountDialog';

export const MeetingProvidersPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await ProviderAccountsApi.listAccounts();
      if (res.data?.success) {
        setAccounts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this provider account? Active sessions may fail.')) {
      try {
        await ProviderAccountsApi.deleteAccount(id);
        fetchAccounts();
      } catch (e) {
        alert('Failed to delete account');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'healthy': return <Badge variant="success">Healthy</Badge>;
      case 'busy': return <Badge variant="warning">Busy</Badge>;
      case 'rate_limited': return <Badge variant="destructive">Rate Limited</Badge>;
      case 'disconnected': return <Badge variant="destructive">Disconnected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Meeting Providers" 
          description="Manage external meeting providers, accounts, credentials, and load balancing configurations." 
        />
        <Button onClick={() => { setEditingAccount(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-textSecondary py-8">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Video className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-textPrimary mb-2">No Provider Accounts</h3>
          <p className="text-textSecondary mb-4">Add your Zoom or Google Meet credentials to enable automatic session creation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className={`bg-surface border ${acc.isActive ? 'border-border' : 'border-red-500/20 opacity-75'} rounded-xl p-6 relative overflow-hidden group`}>
              {!acc.isActive && (
                <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-bl-lg font-medium flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Disabled
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary capitalize">{acc.displayName}</h3>
                  <p className="text-sm text-textSecondary capitalize">{acc.provider.replace('_', ' ')}</p>
                </div>
                {getStatusBadge(acc.status)}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Active Load</span>
                  <span className="font-medium text-textPrimary">
                    {acc.currentRunningMeetings} / {acc.maxConcurrentMeetings} sessions
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${acc.currentRunningMeetings >= acc.maxConcurrentMeetings ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (acc.currentRunningMeetings / acc.maxConcurrentMeetings) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-border pt-4">
                <Button variant="ghost" size="sm" onClick={() => { setEditingAccount(acc); setDialogOpen(true); }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(acc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <ProviderAccountDialog 
          account={editingAccount} 
          onClose={() => setDialogOpen(false)} 
          onSaved={fetchAccounts} 
        />
      )}
    </div>
  );
};

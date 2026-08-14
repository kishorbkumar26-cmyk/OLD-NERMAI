import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, History, Lock, Grid3X3, BookTemplate,
  CheckCircle2, XCircle
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { AdminButton as Button } from '../components/ui/AdminForms';
import { Badge } from '../../components/ui/Badge';
import { AccessRulesApi } from '@nermai/api';

/* ─── Sub-tabs ─────────────────────────────────────────────────────────────── */
const SUB_TABS = [
  { key: 'permissions', label: 'Permissions', Icon: ShieldCheck },
  { key: 'requests',    label: 'Requests',    Icon: Clock       },
  { key: 'history',    label: 'History',     Icon: History     },
  { key: 'permanent',  label: 'Permanent',   Icon: Lock        },
  { key: 'analytics',  label: 'Analytics',   Icon: Grid3X3     },
  { key: 'templates',  label: 'Templates',   Icon: BookTemplate },
];

export const AccessControlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-white">Access Control (SACS)</h1>
      <p className="text-gray-400 mb-8">Manage NERMAI's Smart Access Control System across all modules.</p>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-white/5 mb-6 overflow-x-auto pb-2">
        {SUB_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors
                ${isActive ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]Highlight'}
              `}
            >
              <tab.Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === 'permissions' && <div className="p-8 text-center text-gray-400 border border-dashed border-white/5 rounded-xl">Select an entity from LMS to manage its permissions.</div>}
        {activeTab === 'requests'    && <RequestsTab />}
        {activeTab === 'history'     && <HistoryTab />}
        {activeTab === 'permanent'   && <PermanentGrantsTab />}
        {activeTab === 'analytics'   && <div className="p-8 text-center text-gray-400 border border-dashed border-white/5 rounded-xl">Analytics module coming soon.</div>}
        {activeTab === 'templates'   && <div className="p-8 text-center text-gray-400 border border-dashed border-white/5 rounded-xl">Templates module coming soon.</div>}
      </div>
    </div>
  );
};

/* ─── Requests Tab ─────────────────────────────────────────────────────────────── */
const RequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    AccessRulesApi.listAccessRequests()
      .then((res) => {
        if (mounted) {
          setRequests(res.data?.data || res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError('Failed to sync requests');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map(r => r.id)));
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve ${selectedIds.size} requests?`)) return;
    try {
      await AccessRulesApi.bulkApprove({
        requestIds: Array.from(selectedIds),
        grantType: 'TEMPORARY',
        durationHours: 48,
        consumeMonthlyUnits: true,
        respectMonthlyLimit: true,
        presetId: null,
        overrideLimit: false
      });
      setRequests(prev => prev.filter(req => !selectedIds.has(req.id)));
      setSelectedIds(new Set());
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Approval failed');
    }
  };

  if (loading) return <div className="text-gray-400 p-4">Loading requests...</div>;
  if (error) return <div className="text-destructive p-4">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Pending ({requests.length})</h2>
        <div className="flex gap-2">
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleSelectAll}>
            {selectedIds.size === requests.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selectedIds.size > 0 && (
            <Button className="px-3 py-1.5 text-xs" onClick={handleBulkApprove}>Approve ({selectedIds.size})</Button>
          )}
        </div>
      </div>

      {requests.length === 0 && <div className="text-gray-400 p-4 text-center">No pending requests found.</div>}

      <div className="grid grid-cols-1 gap-4">
        {requests.map((req, i) => {
          const isSelected = selectedIds.has(req.id);
          return (
            <div 
              key={req.id || i} 
              className={`bg-[#1E1E1E] border shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-primary/50'}`}
              onClick={() => toggleSelect(req.id)}
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-white/5'}`}>
                  {isSelected && <CheckCircle2 size={14} className="text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{req.studentName || req.studentId || 'Unknown Student'}</div>
                  <div className="text-sm text-gray-400">{req.contentName || req.entityName || req.contentId || 'Unknown Content'}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-primary text-primary">{(req.requestType || req.entityType || 'Resource').toUpperCase()}</Badge>
                    <Badge variant="secondary">{req.reason || 'General'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── History Tab ─────────────────────────────────────────────────────────────── */
const HistoryTab: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AccessRulesApi.listAccessHistory()
      .then(res => setHistory(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 p-4">Loading history...</div>;

  return (
    <div className="space-y-4">
      {history.map((item, i) => {
        const isApproved = item.status === 'APPROVED';
        return (
          <div key={item.id || i} className={`bg-[#1E1E1E] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl border-l-4 border-y border-r border-y-white/5 border-r-white/5 ${isApproved ? 'border-l-success' : 'border-l-destructive'}`}>
            <div className="p-4 flex gap-4">
              {isApproved ? <CheckCircle2 className="text-success" /> : <XCircle className="text-destructive" />}
              <div className="flex-1">
                <div className="font-bold text-white">{item.studentName || item.studentId}</div>
                <div className="text-sm text-gray-400">{item.contentName || item.entityName}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={isApproved ? 'success' : 'destructive'}>{item.status}</Badge>
                  <Badge variant="outline" className="border-primary text-primary">{(item.requestType || 'Resource').toUpperCase()}</Badge>
                </div>
                <div className="text-xs text-gray-400 mt-2">{new Date(item.updatedAt || item.requestedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Permanent Grants Tab ─────────────────────────────────────────────────────────────── */
const PermanentGrantsTab: React.FC = () => {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AccessRulesApi.listPermanentGrants()
      .then(res => setGrants(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 p-4">Loading permanent grants...</div>;

  return (
    <div className="space-y-4">
      {grants.map((grant, i) => (
        <div key={grant.id || i} className="bg-[#1E1E1E] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl border-l-4 border-y border-r border-y-white/5 border-r-white/5 border-l-success">
          <div className="p-4 flex gap-4">
            <div className="flex-1">
              <div className="font-bold text-white">{grant.studentName || 'Unknown Student'}</div>
              <div className="text-sm text-gray-400">{grant.studentEmail || ''}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-primary text-primary">{(grant.entityType || 'Resource').toUpperCase()}</Badge>
                <Badge variant="success">PERMANENT</Badge>
              </div>
              <div className="text-xs text-gray-400 mt-2">Granted: {new Date(grant.grantedAt).toLocaleDateString()}</div>
            </div>
            <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={async () => {
              if (window.confirm('Permanently revoke this grant?')) {
                await AccessRulesApi.revokeGrant(grant.id, 'Revoked by admin');
                setGrants(prev => prev.filter(g => g.id !== grant.id));
              }
            }}>Revoke</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { X } from 'lucide-react';
import { ProviderAccountsApi } from '@nermai/api';

interface ProviderAccountDialogProps {
  account?: any;
  onClose: () => void;
  onSaved: () => void;
}

export const ProviderAccountDialog: React.FC<ProviderAccountDialogProps> = ({ account, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    provider: 'zoom',
    isActive: true,
    maxConcurrentMeetings: 1,
    priority: 0,
    status: 'healthy',
    clientId: '',
    clientSecret: '',
    accountId: '',
    sdkKey: '',
    sdkSecret: '',
    hostKey: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        displayName: account.displayName || '',
        provider: account.provider || 'zoom',
        isActive: account.isActive ?? true,
        maxConcurrentMeetings: account.maxConcurrentMeetings || 1,
        priority: account.priority || 0,
        status: account.status || 'healthy',
        clientId: account.credentials?.clientId || '',
        clientSecret: account.credentials?.clientSecret ? '******' : '',
        accountId: account.credentials?.accountId || '',
        sdkKey: account.credentials?.sdkKey ? '******' : '',
        sdkSecret: account.credentials?.sdkSecret ? '******' : '',
        hostKey: account.credentials?.hostKey ? '******' : ''
      });
    }
  }, [account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      displayName: formData.displayName,
      provider: formData.provider,
      isActive: formData.isActive,
      maxConcurrentMeetings: formData.maxConcurrentMeetings,
      priority: formData.priority,
      status: formData.status,
      credentials: {}
    };

    if (formData.clientId) payload.credentials.clientId = formData.clientId;
    if (formData.accountId) payload.credentials.accountId = formData.accountId;
    if (formData.clientSecret && formData.clientSecret !== '******') payload.credentials.clientSecret = formData.clientSecret;
    if (formData.sdkKey && formData.sdkKey !== '******') payload.credentials.sdkKey = formData.sdkKey;
    if (formData.sdkSecret && formData.sdkSecret !== '******') payload.credentials.sdkSecret = formData.sdkSecret;
    if (formData.hostKey && formData.hostKey !== '******') payload.credentials.hostKey = formData.hostKey;

    try {
      if (account?.id) {
        await ProviderAccountsApi.updateAccount(account.id, payload);
      } else {
        await ProviderAccountsApi.createAccount(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-hover">
          <h2 className="text-lg font-bold text-textPrimary">
            {account ? 'Edit Provider Account' : 'Add Provider Account'}
          </h2>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="provider-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Display Name</label>
                <input required type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Zoom Science Dept" />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Provider Type</label>
                <select name="provider" value={formData.provider} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textPrimary focus:ring-2 focus:ring-primary outline-none">
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="bbb">BigBlueButton</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Max Concurrent</label>
                <input required type="number" min="1" max="100" name="maxConcurrentMeetings" value={formData.maxConcurrentMeetings} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textPrimary focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Priority</label>
                <input required type="number" name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textPrimary focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textPrimary focus:ring-2 focus:ring-primary outline-none">
                  <option value="healthy">Healthy</option>
                  <option value="busy">Busy</option>
                  <option value="rate_limited">Rate Limited</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </div>
            </div>

            <label className="flex items-center space-x-2 text-sm text-textPrimary cursor-pointer">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded border-border text-primary focus:ring-primary" />
              <span>Enable Account for Auto Assignment</span>
            </label>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-textPrimary mb-4">API Credentials <span className="text-textSecondary font-normal text-xs ml-2">(Encrypted at Rest)</span></h3>
              
              <div className="space-y-4">
                {formData.provider === 'zoom' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">Account ID</label>
                        <input type="text" name="accountId" value={formData.accountId} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="Zoom Account ID" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">Host Key (Optional)</label>
                        <input type="password" name="hostKey" value={formData.hostKey} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="6-digit Host Key" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">S2S OAuth Client ID</label>
                        <input type="text" name="clientId" value={formData.clientId} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="Client ID" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">S2S OAuth Client Secret</label>
                        <input type="password" name="clientSecret" value={formData.clientSecret} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="Client Secret" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">Meeting SDK Key</label>
                        <input type="password" name="sdkKey" value={formData.sdkKey} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="SDK Key" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-1">Meeting SDK Secret</label>
                        <input type="password" name="sdkSecret" value={formData.sdkSecret} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:ring-2 focus:ring-primary outline-none" placeholder="SDK Secret" />
                      </div>
                    </div>
                  </>
                )}
                {formData.provider === 'google_meet' && (
                  <div className="text-sm text-textSecondary">Google Meet API integration fields (Service Account JSON) will appear here.</div>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface-hover flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="provider-form" disabled={loading}>
            {loading ? 'Saving...' : 'Save Account'}
          </Button>
        </div>
      </div>
    </div>
  );
};

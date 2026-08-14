import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProviderAccount {
  id: string;
  provider: string;
  name: string;
  credentials: any;
  secretStatus: string;
  status: string;
  priority: number;
  maxConcurrentMeetings: number;
  currentRunningMeetings: number;
}

export default function ProviderAccountsPage() {
  const [accounts, setAccounts] = useState<ProviderAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/v1/provider-accounts');
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading Provider Accounts...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Provider Credential Management</h1>
          <p className="text-gray-400 mt-2">Manage Zoom and Google Meet API credentials for live sessions.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">
          + Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold capitalize">{account.name} ({account.provider})</h3>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                account.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                account.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {account.status.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-400">Secret Status</p>
                <p className="font-mono text-sm capitalize">{account.secretStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Capacity</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (account.currentRunningMeetings / account.maxConcurrentMeetings) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-gray-400 mt-1">{account.currentRunningMeetings} / {account.maxConcurrentMeetings} Active</p>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Masked Credentials</p>
                <code className="text-xs text-gray-500 bg-gray-900 p-2 block rounded break-all">
                  Client ID: {account.credentials?.clientId || 'N/A'}<br/>
                  Account ID: {account.credentials?.accountId || 'N/A'}
                </code>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                Rotate Secrets
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                Assignments
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

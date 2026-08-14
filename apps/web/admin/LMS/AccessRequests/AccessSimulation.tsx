import React, { useState } from 'react';

export const AccessSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResult({
        allowed: false,
        reason: 'RECORDED_ONLY',
        remainingRecordedUnits: 3,
        allowedRequestScopes: [
          { type: 'CLASS', count: 1, units: 1, allowed: true },
          { type: 'TOPIC', count: 5, units: 5, allowed: false, reason: 'LIMIT_EXCEEDED' }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Access Simulation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Simulation Parameters</h2>
          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Student ID / Email</label>
              <input type="text" className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white" placeholder="Enter student identifier" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Content Type</label>
              <select className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white" required>
                <option value="CLASS">Class</option>
                <option value="TOPIC">Topic</option>
                <option value="SUBJECT">Subject</option>
                <option value="COURSE">Course</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Content ID</label>
              <input type="text" className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white" placeholder="Enter Content ID" required />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black font-bold py-2 rounded mt-4">
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </form>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Simulation Results</h2>
          {loading ? (
            <div className="flex justify-center p-8 text-yellow-500">Loading...</div>
          ) : result ? (
            <div>
              {result.allowed ? (
                <div className="bg-green-900/30 border border-green-800 text-green-400 p-4 rounded mb-4">
                  <strong>Access Granted</strong><br/>
                  Reason: {result.reason}
                </div>
              ) : (
                <div className="bg-red-900/30 border border-red-800 text-red-400 p-4 rounded mb-4">
                  <strong>Access Denied</strong><br/>
                  Reason: {result.reason}
                </div>
              )}
              
              {!result.allowed && result.allowedRequestScopes && (
                <div className="mt-4 bg-[#1a1a1a] p-4 rounded border border-gray-700">
                  <h3 className="font-semibold mb-2 text-gray-300">Request Options (Units Remaining: {result.remainingRecordedUnits})</h3>
                  <ul className="list-disc pl-5">
                    {result.allowedRequestScopes.map((scope: any, idx: number) => (
                      <li key={idx} className={scope.allowed ? "text-green-500" : "text-red-500 line-through"}>
                        {scope.type} - Consumes {scope.units} Units 
                        {!scope.allowed && ` (${scope.reason})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Run a simulation to see the SAPE decision tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

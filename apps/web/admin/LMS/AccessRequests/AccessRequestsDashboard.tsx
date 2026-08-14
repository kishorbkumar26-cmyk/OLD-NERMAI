import React, { useState, useEffect } from 'react';

export const AccessRequestsDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      setRequests([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Access Requests Dashboard</h1>
        <button className="bg-yellow-500 text-black px-4 py-2 rounded font-bold opacity-50 cursor-not-allowed">
          Bulk Approve (0)
        </button>
      </div>

      <div className="bg-[#121212] rounded-lg border border-gray-800 p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading requests...</div>
        ) : (
          <div className="text-center py-8 text-gray-400">No pending requests found.</div>
        )}
      </div>
    </div>
  );
};

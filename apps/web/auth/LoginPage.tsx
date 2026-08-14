import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../core/api';

interface LoginPageProps {
  type: 'admin' | 'student' | 'staff';
}

export const LoginPage: React.FC<LoginPageProps> = ({ type }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {

      // Call our secure backend API to verify credentials via Firebase Admin/REST
      const endpoint = `/auth/${type}/login`;
      const response = await api.post(endpoint, {
        identifier: identifier.trim(),
        password
      });

      const token = response.data.data.token;
      const refreshToken = response.data.data.refreshToken;
      
      if (type === 'admin' || type === 'staff') {
        localStorage.setItem('adminAccessToken', token);
        if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);
        localStorage.removeItem('studentAccessToken');
        localStorage.removeItem('studentRefreshToken');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = type === 'staff' ? '/staff' : '/admin';
      } else {
        localStorage.setItem('studentAccessToken', token);
        if (refreshToken) localStorage.setItem('studentRefreshToken', refreshToken);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = '/student';
      }
      
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to login');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center font-sans">
      <div className="w-full max-w-md p-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#8B0000] to-[#B22222] shadow-[0_0_15px_rgba(139,0,0,0.5)] rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-4">
            N
          </div>
          <h2 className="text-2xl font-bold text-white">
            {type === 'admin' ? 'Admin Portal Login' : type === 'staff' ? 'Staff Portal Login' : 'Student Portal Login'}
          </h2>
          <p className="text-[#E5E5E5]/70 mt-2 text-sm">
            Please sign in to your {type} account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Email, Roll Number or Mobile Number</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
              placeholder="e.g. student@gmail.com, NERMAI-001, 9876543210"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#8B0000] to-[#B22222] hover:from-[#A50000] hover:to-[#CC2222] text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(139,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(139,0,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {type === 'student' && (
          <p className="mt-6 text-center text-[#E5E5E5]/70 text-sm">
            Don't have an account?{' '}
            <Link to="/student/register" className="text-[#8B0000] hover:text-[#B22222] font-medium">
              Sign Up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

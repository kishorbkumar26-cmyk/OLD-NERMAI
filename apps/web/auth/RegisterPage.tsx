import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../core/api';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Call backend to create user profile in Firestore and Firebase Auth natively
      await api.post('/auth/register', { 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password 
      });

      // 2. Automatically log them in using the backend login API to get the token
      const loginResponse = await api.post('/auth/login', {
        identifier: email.trim().toLowerCase(), // We use email as the identifier right after registering
        password
      });

      const token = loginResponse.data.data.token;

      // 3. Save real token and redirect
      localStorage.setItem('studentAccessToken', token);
      
      // Allow listener time to run
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force reload to apply interceptor and state
      window.location.href = '/student';
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to register account');
      }
      console.error('Registration error:', err);
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
            Create Student Account
          </h2>
          <p className="text-[#E5E5E5]/70 mt-2 text-sm">
            Join NERMAI Academy today
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
              placeholder="student@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">Mobile Number (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1A0A0A] border border-[#8B0000]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors"
              placeholder="e.g. 9876543210"
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
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#8B0000] to-[#B22222] hover:from-[#A50000] hover:to-[#CC2222] text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(139,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(139,0,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-[#E5E5E5]/70 text-sm">
          Already have an account?{' '}
          <Link to="/student/login" className="text-[#8B0000] hover:text-[#B22222] font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

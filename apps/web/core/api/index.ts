import { configureApiClient } from '@nermai/api';
import axios from 'axios';

// Initialize the shared API client for the web platform
const api = configureApiClient({
  baseURL: 'http://127.0.0.1:3000/api/v1',
  platform: 'web',
  getAccessToken: async (isAdmin) => {
    // If the route explicitly requests admin (e.g. /admin/...) or the current page is an admin page, use admin token.
    const isUrlAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdmin || isUrlAdmin) {
      return localStorage.getItem('adminAccessToken');
    }
    return localStorage.getItem('studentAccessToken') || localStorage.getItem('adminAccessToken');
  },
  refreshAccessToken: async (isAdmin) => {
    // Determine which token to refresh based on what we currently have
    const isUrlAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const actualIsAdmin = isAdmin || isUrlAdmin || !!localStorage.getItem('adminAccessToken');
    const rolePrefix = actualIsAdmin ? 'admin' : 'student';
    
    const refreshResponse = await axios.post(
      `http://127.0.0.1:3000/api/v1/auth/refresh`,
      { refreshToken: localStorage.getItem(`${rolePrefix}RefreshToken`) || '' },
      { withCredentials: true }
    );

    const newToken = refreshResponse.data?.data?.token;
    const newRefreshToken = refreshResponse.data?.data?.refreshToken;
    
    if (newToken) {
      if (actualIsAdmin) {
        localStorage.setItem('adminAccessToken', newToken);
        if (newRefreshToken) localStorage.setItem('adminRefreshToken', newRefreshToken);
      } else {
        localStorage.setItem('studentAccessToken', newToken);
        if (newRefreshToken) localStorage.setItem('studentRefreshToken', newRefreshToken);
      }
      return newToken;
    }
    return null;
  },
  onLogout: () => {
    const isUrlAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('studentAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('studentRefreshToken');
    window.location.href = isUrlAdmin ? '/admin/login' : '/student/login';
  }
});

export default api;

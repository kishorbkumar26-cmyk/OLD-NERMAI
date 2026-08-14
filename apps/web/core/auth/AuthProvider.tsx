import React, { createContext, useContext, useEffect, useState } from 'react';

// Defining a mock user interface since we removed firebase User
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  role: string | null;
  tenantId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  tenantId: null,
  loading: true,
  logout: async () => {},
  refreshToken: async () => null,
});

// Safely decode a JWT payload without verification (server-side will verify)
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken');
    const studentToken = localStorage.getItem('studentAccessToken');

    if (adminToken === 'DEV_ADMIN_TOKEN') {
      setCurrentUser({ uid: 'dev_admin_123', email: 'admin@nermai.com', displayName: 'Super Admin' });
      setRole('super_admin');
      setTenantId('default_tenant');
    } else if (studentToken === 'DEV_STUDENT_TOKEN') {
      setCurrentUser({ uid: 'dev_student_123', email: 'student@nermai.com', displayName: 'Test Student' });
      setRole('student');
      setTenantId('default_tenant');
    } else if (adminToken && adminToken !== 'DEV_ADMIN_TOKEN') {
      // Decode real Firebase JWT
      const payload = decodeJwt(adminToken);
      if (payload) {
        setCurrentUser({ uid: payload.user_id || payload.sub, email: payload.email || null, displayName: payload.name || null });
        setRole(payload.role || 'super_admin');
        setTenantId(payload.tenantId || 'default_tenant');
      }
    } else if (studentToken && studentToken !== 'DEV_STUDENT_TOKEN') {
      // Decode real Firebase JWT
      const payload = decodeJwt(studentToken);
      if (payload) {
        setCurrentUser({ uid: payload.user_id || payload.sub, email: payload.email || null, displayName: payload.name || null });
        setRole(payload.role || 'student');
        setTenantId(payload.tenantId || 'default_tenant');
      }
    } else {
      setCurrentUser(null);
      setRole(null);
      setTenantId(null);
    }
    
    setLoading(false);
  }, []);

  const logout = async () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('studentAccessToken');
    setCurrentUser(null);
    setRole(null);
    setTenantId(null);
    window.location.href = '/';
  };

  const refreshToken = async () => {
    if (role === 'super_admin' || role === 'admin') {
      return localStorage.getItem('adminAccessToken');
    }
    return localStorage.getItem('studentAccessToken');
  };

  return (
    <AuthContext.Provider value={{ currentUser, role, tenantId, loading, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

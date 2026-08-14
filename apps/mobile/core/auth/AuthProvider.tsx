import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from '../../utils/SecureStoreProxy';
import { setApiLogoutHandler } from '../api';
import { Platform } from 'react-native';

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
  checkAuth: () => Promise<void>;
  /** Returns the current bearer token for the authenticated user, or null. */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  tenantId: null,
  loading: true,
  logout: async () => {},
  checkAuth: async () => {},
  getToken: async () => null,
});

// React Native friendly base64 decode
const base64Decode = (str: string) => {
  // We can use a lightweight decode function or just rely on a library
  // For basic JWT payload decoding in RN without polyfills:
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/=+$/, '');
  
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string');
  }

  for (
    // initialize result and counters
    let bc = 0, bs, buffer, idx = 0;
    // get next character
    buffer = str.charAt(idx++);
    // character found in table? initialize bit storage and add its ascii value;
    ~buffer && (bs = bc % 4 ? bs! * 64 + chars.indexOf(buffer) : chars.indexOf(buffer),
      // and if not first of each 4 characters,
      // convert the first 8 bits to one ascii character
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    //
  }
  return output;
};

const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = base64Decode(base64);
    // handle unicode chars if needed, but for simple claims standard base64 is usually fine
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('JWT Decode error', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const adminToken = await SecureStore.getItemAsync('adminAccessToken');
      const studentToken = await SecureStore.getItemAsync('studentAccessToken');

      if (adminToken === 'DEV_ADMIN_TOKEN') {
        setCurrentUser({ uid: 'dev_admin_123', email: 'admin@nermai.com', displayName: 'Super Admin' });
        setRole('super_admin');
        setTenantId('default_tenant');
      } else if (studentToken === 'DEV_STUDENT_TOKEN') {
        setCurrentUser({ uid: 'dev_student_123', email: 'student@nermai.com', displayName: 'Test Student' });
        setRole('student');
        setTenantId('default_tenant');
      } else if (adminToken && adminToken !== 'DEV_ADMIN_TOKEN') {
        const payload = decodeJwt(adminToken);
        if (payload) {
          setCurrentUser({ uid: payload.user_id || payload.sub, email: payload.email || null, displayName: payload.name || null });
          setRole(payload.role || 'super_admin');
          setTenantId(payload.tenantId || 'default_tenant');
        }
      } else if (studentToken && studentToken !== 'DEV_STUDENT_TOKEN') {
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
    } catch (e) {
      console.error('Auth Check Error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    await SecureStore.deleteItemAsync('adminAccessToken');
    await SecureStore.deleteItemAsync('studentAccessToken');
    setCurrentUser(null);
    setRole(null);
    setTenantId(null);
  };

  /**
   * Returns the current bearer token. Tries the student token first, then admin.
   * Works on both native (SecureStore) and web (localStorage via SecureStoreProxy).
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const studentToken = await SecureStore.getItemAsync('studentAccessToken');
      if (studentToken) return studentToken;
      const adminToken = await SecureStore.getItemAsync('adminAccessToken');
      return adminToken;
    } catch (e) {
      console.warn('[AuthProvider] getToken failed', e);
      return null;
    }
  }, []);

  useEffect(() => {
    // Register global logout handler for the API client
    setApiLogoutHandler(logout);
    return () => setApiLogoutHandler(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, role, tenantId, loading, logout, checkAuth, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

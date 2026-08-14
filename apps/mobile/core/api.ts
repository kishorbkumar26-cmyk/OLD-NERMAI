import { configureApiClient } from '@nermai/api';
import * as SecureStore from '../utils/SecureStoreProxy';

// On Android emulator, 10.0.2.2 maps to the host machine's localhost.
// 'localhost' inside the emulator refers to the emulator itself (no server there).
import { Platform } from 'react-native';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Global logout handler that AuthProvider can register
let globalLogoutHandler: (() => void) | null = null;
export const setApiLogoutHandler = (handler: () => void) => {
  globalLogoutHandler = handler;
};

// Mobile API Client configuration
const api = configureApiClient({
  baseURL: API_BASE_URL,
  platform: 'mobile',
  getAccessToken: async (isAdmin) => {
    // Determine token key based on role context
    const tokenKey = isAdmin ? 'adminAccessToken' : 'studentAccessToken';

    try {
      let token = await SecureStore.getItemAsync(tokenKey);

      // Fallback 1: If requesting student and student token is missing, try admin token
      if (!isAdmin && !token) {
        token = await SecureStore.getItemAsync('adminAccessToken');
      }
      // Fallback 2: If requesting admin and admin token is missing, try student token
      // (This happens if an admin logs in via the Student Login page, which saves it as studentAccessToken)
      if (isAdmin && !token) {
        token = await SecureStore.getItemAsync('studentAccessToken');
      }
      return token;
    } catch (e) {
      console.warn('Failed to get token from SecureStore', e);
      return null;
    }
  },
  refreshAccessToken: async (isAdmin) => {
    // The backend uses Firebase Auth ID tokens which expire in 1 hour.
    // Since we don't have a dedicated /auth/refresh endpoint for mobile yet,
    // we will simply return null here to force a re-login when the token expires.
    console.warn('Token expired, triggering logout.');
    return null;
  },
  onLogout: async () => {
    try {
      await SecureStore.deleteItemAsync('adminAccessToken');
      await SecureStore.deleteItemAsync('studentAccessToken');

      // Trigger the React context logout so the navigator resets
      if (globalLogoutHandler) {
        globalLogoutHandler();
      } else if (typeof window !== 'undefined') {
        // Fallback for Expo Web
        window.location.reload();
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  }
});

export default api;

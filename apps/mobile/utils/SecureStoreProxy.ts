import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage error', e);
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage error', e);
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
};

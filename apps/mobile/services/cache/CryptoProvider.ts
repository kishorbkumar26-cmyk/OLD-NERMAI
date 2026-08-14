import CryptoJS from 'crypto-js';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_ALIAS = 'NERMAI_RESOURCE_KEY';
const IV_ALIAS = 'NERMAI_RESOURCE_IV';

export class CryptoProvider {
  // We use SecureStore to persist the AES key so encrypted files are locked to the device/app installation
  private static async getOrGenerateKeys(): Promise<{ key: string, iv: string }> {
    if (Platform.OS === 'web') {
      return { key: '', iv: '' };
    }

    try {
      let key = await SecureStore.getItemAsync(KEY_ALIAS);
      let iv = await SecureStore.getItemAsync(IV_ALIAS);

      if (!key || !iv) {
        // Generate a 256-bit key (32 bytes -> 64 hex chars) and 128-bit IV (16 bytes -> 32 hex chars)
        key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex); 
        iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
        
        await SecureStore.setItemAsync(KEY_ALIAS, key);
        await SecureStore.setItemAsync(IV_ALIAS, iv);
      }

      return { key, iv };
    } catch (e) {
      console.error('[CryptoProvider] Error fetching/generating keys', e);
      throw new Error('Failed to access secure crypto keys');
    }
  }

  static async encryptFile(sourcePath: string, targetPath: string): Promise<string> {
    if (Platform.OS === 'web') return sourcePath;

    try {
      const { key, iv } = await this.getOrGenerateKeys();
      
      const base64Data = await FileSystem.readAsStringAsync(sourcePath, { encoding: FileSystem.EncodingType.Base64 });
      
      const keyObj = CryptoJS.enc.Hex.parse(key);
      const ivObj = CryptoJS.enc.Hex.parse(iv);
      
      // Encrypt
      const encrypted = CryptoJS.AES.encrypt(base64Data, keyObj, { iv: ivObj });
      const encryptedData = encrypted.toString();
      
      await FileSystem.writeAsStringAsync(targetPath, encryptedData, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (sourcePath !== targetPath) {
        await FileSystem.deleteAsync(sourcePath, { idempotent: true });
      }

      return targetPath;
    } catch (e) {
      console.error('[CryptoProvider] File Encryption Failed', e);
      throw new Error('Encryption failed');
    }
  }

  static async decryptFile(encryptedPath: string, tempDecryptedPath: string): Promise<string> {
    if (Platform.OS === 'web') return encryptedPath;

    try {
      const { key, iv } = await this.getOrGenerateKeys();
      
      const encryptedData = await FileSystem.readAsStringAsync(encryptedPath, { encoding: FileSystem.EncodingType.UTF8 });
      
      const keyObj = CryptoJS.enc.Hex.parse(key);
      const ivObj = CryptoJS.enc.Hex.parse(iv);
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(encryptedData, keyObj, { iv: ivObj });
      const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
      
      await FileSystem.writeAsStringAsync(tempDecryptedPath, decryptedBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      return tempDecryptedPath;
    } catch (e) {
      console.error('[CryptoProvider] File Decryption Failed', e);
      throw new Error('Decryption failed. The file may be corrupted or keys are invalid.');
    }
  }
}

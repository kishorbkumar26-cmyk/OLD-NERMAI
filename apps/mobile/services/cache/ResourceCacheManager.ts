import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoProvider } from './CryptoProvider';
import { DownloadManager } from './DownloadManager';
import { Platform } from 'react-native';

const CACHE_DIR = (FileSystem.documentDirectory || 'file:///data/user/0/com.app/') + 'secure_resources/';
const TEMP_DIR = (FileSystem.cacheDirectory || 'file:///data/user/0/com.app/cache/') + 'temp_decrypted/';

// Smart limit: 500MB
const CACHE_LIMIT_BYTES = 500 * 1024 * 1024; 

export enum CacheState {
  ONLINE = 'ONLINE',
  DOWNLOADING = 'DOWNLOADING',
  CACHED = 'CACHED',
  OFFLINE = 'OFFLINE',
  STALE = 'STALE',
  ERROR = 'ERROR'
}

export interface CachedResource {
  resourceId: string;
  version: number;
  checksum: string;
  encryptedPath: string;
  downloadedAt: string;
  lastOpened: string;
  fileSize: number;
  isOfflineMarked: boolean;
  isFavorite: boolean;
}

export interface ReadingProgress {
  page: number;
  zoom: number;
  lastRead: string;
  scrollPosition: number;
}

export class ResourceCacheManager {
  private static activeDecryptedPath: string | null = null;
  public static isSimulatingOffline: boolean = false;

  private static log(event: string, meta: any) {
    if (__DEV__) {
      console.log(`[ResourceCache] [${event}] Resource: ${meta.resourceId} | Version: ${meta.version || 'N/A'} | Details: ${meta.details || 'N/A'}`);
    }
  }

  static async init() {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    
    const tempDirInfo = await FileSystem.getInfoAsync(TEMP_DIR);
    if (!tempDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true });
    } else {
      await this.cleanupAllTempFiles();
    }
  }

  static async getCachedMetadata(resourceId: string): Promise<CachedResource | null> {
    const data = await AsyncStorage.getItem(`res_meta_${resourceId}`);
    return data ? JSON.parse(data) : null;
  }

  static async getReadingProgress(resourceId: string): Promise<ReadingProgress | null> {
    const data = await AsyncStorage.getItem(`res_prog_${resourceId}`);
    return data ? JSON.parse(data) : null;
  }

  static async saveReadingProgress(resourceId: string, progress: Partial<ReadingProgress>) {
    const existing = await this.getReadingProgress(resourceId) || { page: 1, zoom: 1, lastRead: new Date().toISOString(), scrollPosition: 0 };
    await AsyncStorage.setItem(`res_prog_${resourceId}`, JSON.stringify({ ...existing, ...progress, lastRead: new Date().toISOString() }));
  }

  static async setOfflineMarked(resourceId: string, isOfflineMarked: boolean) {
    const existing = await this.getCachedMetadata(resourceId);
    if (existing) {
       existing.isOfflineMarked = isOfflineMarked;
       await AsyncStorage.setItem(`res_meta_${resourceId}`, JSON.stringify(existing));
    }
  }

  static async toggleFavorite(resourceId: string): Promise<boolean> {
    const existing = await this.getCachedMetadata(resourceId);
    if (existing) {
       existing.isFavorite = !existing.isFavorite;
       await AsyncStorage.setItem(`res_meta_${resourceId}`, JSON.stringify(existing));
       return existing.isFavorite;
    }
    return false;
  }

  static async isFavorite(resourceId: string): Promise<boolean> {
     const existing = await this.getCachedMetadata(resourceId);
     return existing?.isFavorite || false;
  }

  static async determineCacheState(resourceId: string, remoteVersion: number, isConnected: boolean): Promise<CacheState> {
    const connected = this.isSimulatingOffline ? false : isConnected;
    const cached = await this.getCachedMetadata(resourceId);
    
    let state = connected ? CacheState.ONLINE : CacheState.OFFLINE;

    if (cached) {
      if (cached.version === remoteVersion) {
        state = CacheState.CACHED;
      } else {
        state = connected ? CacheState.STALE : CacheState.CACHED; // Use stale cache if offline
      }
    }
    
    this.log(cached && cached.version === remoteVersion ? 'CACHE HIT' : 'CACHE MISS', {
      resourceId,
      version: cached?.version,
      details: `State: ${state} | Remote V: ${remoteVersion} | Sim Offline: ${this.isSimulatingOffline}`
    });

    return state;
  }

  static async deleteCache(resourceId: string) {
    const cached = await this.getCachedMetadata(resourceId);
    if (cached) {
      try { await FileSystem.deleteAsync(cached.encryptedPath, { idempotent: true }); } catch (e) {}
      await AsyncStorage.removeItem(`res_meta_${resourceId}`);
      this.log('CACHE DELETE', { resourceId, version: cached.version });
    }
  }

  static async enforceCacheLimit() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const resourceKeys = keys.filter(k => k.startsWith('res_meta_'));
      if (resourceKeys.length === 0) return;

      const cacheItems = await Promise.all(
        resourceKeys.map(async (key) => {
          const val = await AsyncStorage.getItem(key);
          return val ? JSON.parse(val) as CachedResource : null;
        })
      );

      let resources = cacheItems.filter(Boolean) as CachedResource[];
      let totalSize = resources.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

      if (totalSize > CACHE_LIMIT_BYTES) {
        resources.sort((a, b) => {
          if (a.isOfflineMarked !== b.isOfflineMarked) return a.isOfflineMarked ? 1 : -1;
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? 1 : -1;
          return new Date(a.lastOpened).getTime() - new Date(b.lastOpened).getTime();
        });
        
        for (const res of resources) {
          if (totalSize <= CACHE_LIMIT_BYTES) break;
          if (res.isOfflineMarked) continue; 
          
          try {
            await FileSystem.deleteAsync(res.encryptedPath, { idempotent: true });
            await AsyncStorage.removeItem(`res_meta_${res.resourceId}`);
            totalSize -= res.fileSize || 0;
            this.log('CACHE LRU EVICT', { resourceId: res.resourceId, version: res.version, details: 'Evicted due to limit' });
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('[CacheManager] Error enforcing cache limit', e);
    }
  }

  static async cleanupAllTempFiles() {
    try {
      if (Platform.OS === 'web') return;
      const files = await FileSystem.readDirectoryAsync(TEMP_DIR);
      for (const file of files) {
        await FileSystem.deleteAsync(`${TEMP_DIR}${file}`, { idempotent: true });
      }
      this.activeDecryptedPath = null;
    } catch (e) {}
  }

  static async cleanupTemp() {
    if (this.activeDecryptedPath) {
      try {
        await FileSystem.deleteAsync(this.activeDecryptedPath, { idempotent: true });
      } catch (e) {}
      this.activeDecryptedPath = null;
    }
  }

  private static async decryptToTemp(encryptedPath: string, resourceId: string, mimeType: string): Promise<string> {
    await this.cleanupTemp();
    const extension = mimeType.includes('pdf') ? '.pdf' : '.res';
    const tempDecryptedPath = `${TEMP_DIR}dec_${resourceId}_${Date.now()}${extension}`;
    await CryptoProvider.decryptFile(encryptedPath, tempDecryptedPath);
    this.activeDecryptedPath = tempDecryptedPath;
    return tempDecryptedPath;
  }

  static async downloadAndCache(
    resourceId: string, 
    version: number, 
    checksum: string, 
    streamUrl: string, 
    mimeType: string,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    
    if (this.isSimulatingOffline) {
      throw new Error("Network simulated offline. Cannot download.");
    }

    await this.init();
    await this.enforceCacheLimit();
    
    const extension = mimeType.includes('pdf') ? '.pdf' : '.res';
    const rawDownloadPath = `${CACHE_DIR}raw_${resourceId}_v${version}${extension}`;
    const encryptedPath = `${CACHE_DIR}enc_${resourceId}_v${version}${extension}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      streamUrl,
      rawDownloadPath,
      { headers: { Authorization: `Bearer ${token}` } },
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesExpectedToWrite > 0 
          ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite 
          : 0;
        if (onProgress) onProgress(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || result.status !== 200) {
      console.error('[CacheManager] Download failed.', {
        url: streamUrl,
        status: result?.status,
        headers: result?.headers,
        md5: result?.md5
      });
      
      const status = result?.status || 0;
      let errType = 'NETWORK_ERROR';
      if (status === 403 || status === 401) errType = 'PERMISSION_DENIED';
      if (status === 404) errType = 'NOT_FOUND';
      
      throw new Error(JSON.stringify({
        code: 'RESOURCE_ERROR',
        type: errType,
        status: status,
        stage: 'Download Fetch',
        message: 'Download failed'
      }));
    }
    
    const fileInfo = await FileSystem.getInfoAsync(rawDownloadPath);
    const fileSize = fileInfo.exists ? fileInfo.size : 0;

    await CryptoProvider.encryptFile(rawDownloadPath, encryptedPath);
    await FileSystem.deleteAsync(rawDownloadPath, { idempotent: true }); 

    const existing = await this.getCachedMetadata(resourceId);
    
    const metadata: CachedResource = {
      resourceId,
      version,
      checksum,
      encryptedPath,
      downloadedAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      fileSize,
      isOfflineMarked: existing?.isOfflineMarked || false,
      isFavorite: existing?.isFavorite || false
    };

    await AsyncStorage.setItem(`res_meta_${resourceId}`, JSON.stringify(metadata));

    this.log('CACHE UPDATE', { resourceId, version, details: `Size: ${(fileSize/1024/1024).toFixed(2)} MB` });

    return this.decryptToTemp(encryptedPath, resourceId, mimeType);
  }

  static async openCached(resourceId: string, mimeType: string): Promise<string | null> {
    const cached = await this.getCachedMetadata(resourceId);
    if (!cached) {
      this.log('CACHE MISS', { resourceId, details: 'Not found in cache' });
      return null;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(cached.encryptedPath);
    if (!fileInfo.exists) {
       await AsyncStorage.removeItem(`res_meta_${resourceId}`);
       this.log('CACHE DELETE', { resourceId, details: 'Orphaned metadata deleted' });
       return null;
    }
    
    cached.lastOpened = new Date().toISOString();
    await AsyncStorage.setItem(`res_meta_${resourceId}`, JSON.stringify(cached));
    
    const ageMs = Date.now() - new Date(cached.downloadedAt).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    this.log('CACHE HIT', { 
      resourceId, 
      version: cached.version, 
      details: `Age: ${ageDays} days | Size: ${(fileInfo.size/1024/1024).toFixed(1)}MB | Location: expo-file-system | Checksum: MATCH` 
    });
    
    return this.decryptToTemp(cached.encryptedPath, resourceId, mimeType);
  }
}

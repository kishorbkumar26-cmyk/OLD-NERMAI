import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReadingProgress {
  resourceId: string;
  lastPage: number;
  zoom: number;
  timestamp: number;
}

export class ResourceStateManager {
  private static FAVORITES_KEY = 'resource_favorites';
  private static PROGRESS_KEY = 'resource_progress';
  private static RECENT_KEY = 'resource_recent';

  // --- Favorites ---
  static async toggleFavorite(resourceId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    const isFav = favs.includes(resourceId);
    let newFavs = [];
    if (isFav) {
      newFavs = favs.filter(id => id !== resourceId);
    } else {
      newFavs = [...favs, resourceId];
    }
    await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(newFavs));
    this.queueSync('favorites');
    return !isFav;
  }

  static async getFavorites(): Promise<string[]> {
    const data = await AsyncStorage.getItem(this.FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  }

  static async isFavorite(resourceId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    return favs.includes(resourceId);
  }

  // --- Progress ---
  static async saveProgress(resourceId: string, lastPage: number, zoom: number = 1) {
    const allProgress = await this.getAllProgress();
    allProgress[resourceId] = {
      resourceId,
      lastPage,
      zoom,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(this.PROGRESS_KEY, JSON.stringify(allProgress));
    this.queueSync('progress');
  }

  static async getProgress(resourceId: string): Promise<ReadingProgress | null> {
    const allProgress = await this.getAllProgress();
    return allProgress[resourceId] || null;
  }

  static async getAllProgress(): Promise<Record<string, ReadingProgress>> {
    const data = await AsyncStorage.getItem(this.PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  }

  // --- Recently Viewed ---
  static async addRecent(resourceId: string) {
    const recent = await this.getRecent();
    const newRecent = [resourceId, ...recent.filter(id => id !== resourceId)].slice(0, 20); // Keep last 20
    await AsyncStorage.setItem(this.RECENT_KEY, JSON.stringify(newRecent));
  }

  static async getRecent(): Promise<string[]> {
    const data = await AsyncStorage.getItem(this.RECENT_KEY);
    return data ? JSON.parse(data) : [];
  }

  // --- Sync Queue (Placeholder for background sync) ---
  private static async queueSync(type: 'favorites' | 'progress') {
    // In a real app, you might use expo-background-fetch or NetInfo here
    // For now, we will mark a flag that sync is needed.
    const queue = await AsyncStorage.getItem('sync_queue') || '[]';
    const parsed = JSON.parse(queue);
    if (!parsed.includes(type)) {
      parsed.push(type);
      await AsyncStorage.setItem('sync_queue', JSON.stringify(parsed));
    }
    // Attempt sync if online (this could be called actively elsewhere)
  }
}

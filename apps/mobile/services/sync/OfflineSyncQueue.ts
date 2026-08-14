import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';
import { getApiClient } from '@nermai/api';

interface SyncTask {
  id: string;
  /**
   * chat_message: offline chatbot messages queued while device was offline.
   * Other types: standard LMS event syncing.
   */
  type: 'watch_progress' | 'attendance' | 'quiz_submission' | 'completion_events' | 'analytics_events' | 'chat_message';
  endpoint: string;
  payload: any;
  timestamp: string;
  retries: number;
}

export class OfflineSyncQueue {
  private static db = SQLite.openDatabaseSync('sync_queue.db');
  private static isInitialized = false;

  /**
   * Initialize the SQLite database table and start background intervals.
   */
  static init() {
    if (this.isInitialized) return;
    
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        schemaVersion TEXT NOT NULL DEFAULT 'v1',
        appVersion TEXT NOT NULL DEFAULT '1.0.0',
        retries INTEGER NOT NULL DEFAULT 0
      );
    `);
    
    // Purge old schemas gracefully
    try {
      this.db.execSync(`DELETE FROM sync_tasks WHERE schemaVersion != 'v1'`);
    } catch(e) {
      // Column might not exist in old migrations, ignore or handle migration
    }

    this.isInitialized = true;

    // Set up an interval to process queue periodically (fallback to background-fetch later)
    setInterval(() => {
      this.processQueue();
    }, 1000 * 60 * 5); // Try every 5 minutes
  }

  private static getQueue(): SyncTask[] {
    const result = this.db.getAllSync('SELECT * FROM sync_tasks ORDER BY timestamp ASC');
    return result.map((row: any) => ({
      id: row.id,
      type: row.type as SyncTask['type'],
      endpoint: row.endpoint,
      payload: JSON.parse(row.payload),
      timestamp: row.timestamp,
      retries: row.retries,
    }));
  }

  /**
   * Enqueue a task to be synced later.
   */
  static enqueue(type: SyncTask['type'], endpoint: string, payload: any) {
    this.init();
    
    const timestamp = new Date().toISOString();

    // De-duplicate: If it's a watch progress for the same video, replace the old one
    if (type === 'watch_progress' && payload.videoId) {
      const existing = this.db.getFirstSync('SELECT id, payload FROM sync_tasks WHERE type = ?', [type]);
      let replaced = false;
      
      // Since payload is JSON, we can't easily query by videoId in basic SQLite without json1 extension,
      // so we fetch and check manually.
      if (existing) {
        const allWatchTasks = this.db.getAllSync('SELECT id, payload FROM sync_tasks WHERE type = ?', [type]);
        for (const task of allWatchTasks as any[]) {
          const parsedPayload = JSON.parse(task.payload);
          if (parsedPayload.videoId === payload.videoId) {
            this.db.runSync(
              'UPDATE sync_tasks SET payload = ?, timestamp = ?, retries = 0 WHERE id = ?',
              [JSON.stringify(payload), timestamp, task.id]
            );
            replaced = true;
            break;
          }
        }
      }
      if (replaced) {
        this.processQueue();
        return;
      }
    }

    const id = Math.random().toString(36).substring(2, 15);
    const schemaVersion = 'v1';
    const appVersion = '1.0.0';
    
    this.db.runSync(
      'INSERT INTO sync_tasks (id, type, endpoint, payload, timestamp, schemaVersion, appVersion, retries) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, type, endpoint, JSON.stringify(payload), timestamp, schemaVersion, appVersion, 0]
    );
    
    // Attempt sync immediately if we might be online
    this.processQueue();
  }

  /**
   * Process the queue, sending items to the server.
   */
  static async processQueue() {
    this.init();

    // ✅ Expo-compatible network check (replaces @react-native-community/netinfo)
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        return; // Device is offline — keep tasks in queue
      }
    } catch {
      return; // Cannot determine network state — skip processing
    }

    const queue = this.getQueue();
    if (queue.length === 0) return;

    const api = getApiClient();

    for (const task of queue) {
      try {
        await api.post(task.endpoint, task.payload);
        console.log(`Synced offline task: ${task.type}`);
        // Success: remove from DB
        this.db.runSync('DELETE FROM sync_tasks WHERE id = ?', [task.id]);
      } catch (error: any) {
        // If it's a 4xx error (bad request), drop it. Otherwise (5xx or network), retry later.
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          console.warn(`Dropping invalid offline task: ${task.type}`);
          this.db.runSync('DELETE FROM sync_tasks WHERE id = ?', [task.id]);
        } else {
          const newRetries = task.retries + 1;
          if (newRetries >= 5) {
            console.warn(`Dropping offline task after 5 retries: ${task.type}`);
            this.db.runSync('DELETE FROM sync_tasks WHERE id = ?', [task.id]);
          } else {
            this.db.runSync('UPDATE sync_tasks SET retries = ? WHERE id = ?', [newRetries, task.id]);
          }
        }
      }
    }
  }

  /**
   * Hook for background fetch tasks (e.g. expo-background-fetch).
   * Called by the OS periodically when the app is in the background.
   */
  static async backgroundSyncTask() {
    await this.processQueue();
    // Return indicating success or no-data for the background fetch API
    return true;
  }
}

import { IInteractionAdapter, SendInteractionParams } from '@nermai/interaction';
import EventSource from 'react-native-sse';
import * as Network from 'expo-network'; // ✅ Expo Go compatible (replaces @react-native-community/netinfo)
import { OfflineSyncQueue } from '../services/sync/OfflineSyncQueue';

/**
 * MobileInteractionAdapter
 *
 * Implements the IInteractionAdapter interface for React Native / Expo Go.
 * Uses only Expo-safe packages:
 *   ✅ expo-network   — for connectivity detection
 *   ✅ expo-sqlite    — for offline queue (via OfflineSyncQueue)
 *   ✅ react-native-sse — for SSE streaming
 *
 * Avoids:
 *   ❌ @react-native-community/netinfo (requires expo prebuild)
 *   ❌ Native AI SDKs
 *   ❌ ONNX / TFLite / Realm / WatermelonDB
 */
export class MobileInteractionAdapter implements IInteractionAdapter {
  private eventSource: EventSource | null = null;
  private online: boolean = true;

  constructor() {
    // Initialize offline queue and start periodic background sync
    OfflineSyncQueue.init();

    // Poll network state every 30 seconds and attempt to drain the queue when back online
    setInterval(async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const wasOffline = !this.online;
        this.online = !!(state.isConnected && state.isInternetReachable);

        // If we just came back online, drain the queued messages
        if (wasOffline && this.online) {
          OfflineSyncQueue.processQueue();
        }
      } catch {
        // Network.getNetworkStateAsync can throw in some environments
      }
    }, 30_000);

    // Also update connectivity immediately on construction
    Network.getNetworkStateAsync()
      .then(state => {
        this.online = !!(state.isConnected && state.isInternetReachable);
      })
      .catch(() => {});
  }

  connectStream(url: string, onMessage: (data: any) => void): void {
    if (this.eventSource) this.eventSource.close();

    // React Native uses react-native-sse polyfill
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener('message', (event: any) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error('[MobileInteractionAdapter] Failed to parse SSE', e);
        }
      }
    });
    this.eventSource.addEventListener('error', (e: any) => {
      console.warn('[MobileInteractionAdapter] SSE error', e);
    });
  }

  disconnectStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Enqueue a chat message or interaction to SQLite for later sync.
   * Called automatically when the device is offline.
   */
  enqueueOffline(params: SendInteractionParams): void {
    OfflineSyncQueue.enqueue(
      'chat_message',
      '/api/assistant/chat',
      {
        query: (params as any).query || params,
        language: (params as any).language || 'en',
        queuedAt: new Date().toISOString(),
      }
    );
    console.log('[MobileInteractionAdapter] Message queued in SQLite for offline sync:', params);
  }

  /**
   * Pull pending messages from the SQLite queue and replay them.
   * Returns interactions as SendInteractionParams[] for the caller to re-send.
   */
  dequeueOffline(): SendInteractionParams[] {
    // The OfflineSyncQueue handles replay automatically via processQueue().
    // This method is kept for compatibility with the IInteractionAdapter interface.
    // The adapter's periodic interval above handles actual replay on reconnect.
    return [];
  }

  isOnline(): boolean {
    return this.online;
  }
}

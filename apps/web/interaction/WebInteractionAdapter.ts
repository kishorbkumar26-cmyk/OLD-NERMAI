import { IInteractionAdapter, SendInteractionParams } from '@nermai/interaction';

const IDB_DB_NAME = 'nermai_assistant_offline';
const IDB_STORE_NAME = 'offline_queue';
const IDB_VERSION = 1;

/**
 * WebInteractionAdapter
 *
 * Implements IInteractionAdapter for the web browser.
 * - SSE streaming via native browser EventSource
 * - Offline queue persisted in IndexedDB (survives page refresh, no extra library)
 * - Online detection via navigator.onLine + window events
 */
export class WebInteractionAdapter implements IInteractionAdapter {
  private eventSource: EventSource | null = null;
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initIndexedDB();

    // Listen for online/offline browser events and drain queue on reconnect
    window.addEventListener('online', () => {
      this.drainQueue();
    });
  }

  // ─── IndexedDB Setup ──────────────────────────────────────────────────────

  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('[WebInteractionAdapter] IndexedDB not available');
        resolve();
        return;
      }

      const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          const store = db.createObjectStore(IDB_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[WebInteractionAdapter] IndexedDB open failed', event);
        resolve(); // Fail gracefully — don't block the app
      };
    });
  }

  // ─── SSE Streaming ────────────────────────────────────────────────────────

  connectStream(url: string, onMessage: (data: any) => void): void {
    if (this.eventSource) this.eventSource.close();

    // Web uses native browser EventSource
    this.eventSource = new EventSource(url);
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('[WebInteractionAdapter] Failed to parse SSE', e);
      }
    };
    this.eventSource.onerror = () => {
      console.warn('[WebInteractionAdapter] SSE connection error');
    };
  }

  disconnectStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // ─── Offline Queue (IndexedDB) ────────────────────────────────────────────

  /**
   * Persist a queued interaction to IndexedDB so it survives page refresh.
   */
  async enqueueOffline(params: SendInteractionParams): Promise<void> {
    await this.dbReady;
    if (!this.db) {
      console.warn('[WebInteractionAdapter] IndexedDB unavailable — cannot queue offline message');
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const record = {
        params,
        endpoint: '/api/assistant/chat',
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      const req = store.add(record);
      req.onsuccess = () => {
        console.log('[WebInteractionAdapter] Message persisted to IndexedDB for offline sync');
        resolve();
      };
      req.onerror = () => {
        console.error('[WebInteractionAdapter] IndexedDB enqueue failed', req.error);
        resolve(); // Fail gracefully
      };
    });
  }

  /**
   * Drain all pending IndexedDB records and replay them via fetch.
   * Called automatically when the browser comes back online.
   */
  async drainQueue(): Promise<void> {
    await this.dbReady;
    if (!this.db || !this.isOnline()) return;

    const records = await this.getAllRecords();
    if (records.length === 0) return;

    console.log(`[WebInteractionAdapter] Replaying ${records.length} offline message(s)`);

    for (const record of records) {
      try {
        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record.params),
        });

        if (response.ok) {
          await this.deleteRecord(record.id);
          console.log('[WebInteractionAdapter] Offline message replayed successfully');
        } else if (response.status >= 400 && response.status < 500) {
          // Client error — drop, not retryable
          await this.deleteRecord(record.id);
          console.warn('[WebInteractionAdapter] Dropping non-retryable offline message:', response.status);
        } else {
          // Server error — increment retry counter
          await this.incrementRetry(record);
        }
      } catch {
        // Network error — leave in queue for next attempt
      }
    }
  }

  /**
   * Returns all pending records (IInteractionAdapter compat).
   * Actual replay is handled by drainQueue() automatically on reconnect.
   */
  dequeueOffline(): SendInteractionParams[] {
    // Async drain is managed by the 'online' event listener.
    return [];
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // ─── IndexedDB Helpers ────────────────────────────────────────────────────

  private getAllRecords(): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.db) { resolve([]); return; }
      const tx = this.db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  private deleteRecord(id: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      const tx = this.db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  private incrementRetry(record: any): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      const MAX_RETRIES = 5;
      const updated = { ...record, retries: (record.retries || 0) + 1 };

      if (updated.retries >= MAX_RETRIES) {
        console.warn('[WebInteractionAdapter] Dropping offline message after 5 retries');
        this.deleteRecord(record.id).then(resolve);
        return;
      }

      const tx = this.db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(updated);
      tx.oncomplete = () => resolve();
    });
  }
}

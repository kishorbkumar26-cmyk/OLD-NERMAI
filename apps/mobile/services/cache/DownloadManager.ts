import * as FileSystem from 'expo-file-system/legacy';

interface DownloadTask {
  id: string;
  url: string;
  targetPath: string;
  headers?: Record<string, string>;
  resolve: (path: string) => void;
  reject: (error: Error) => void;
  retries: number;
}

export class DownloadManager {
  private static queue: DownloadTask[] = [];
  private static isDownloading = false;

  static async downloadFile(id: string, url: string, targetPath: string, headers?: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        url,
        targetPath,
        headers,
        resolve,
        reject,
        retries: 0
      });
      this.processQueue();
    });
  }

  private static async processQueue() {
    if (this.isDownloading || this.queue.length === 0) return;

    this.isDownloading = true;
    const task = this.queue[0]; // peek

    try {
      console.log(`[DownloadManager] Starting download for ${task.id} (Attempt ${task.retries + 1})`);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        task.url,
        task.targetPath,
        { headers: task.headers || {} },
        (progress) => {
          // Optional: emit progress events
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result || result.status !== 200) {
        throw new Error(`HTTP Status ${result?.status}`);
      }

      // Success
      this.queue.shift(); // remove from queue
      task.resolve(task.targetPath);
    } catch (error: any) {
      console.warn(`[DownloadManager] Download failed for ${task.id}:`, error.message);
      
      task.retries++;
      if (task.retries >= 3) {
        console.error(`[DownloadManager] Max retries reached for ${task.id}. Failing.`);
        this.queue.shift(); // remove
        task.reject(new Error('Download failed after 3 retries'));
      } else {
        // Wait briefly before retry
        await new Promise(res => setTimeout(res, 2000));
        // We leave it at the front of the queue to retry
      }
    } finally {
      this.isDownloading = false;
      this.processQueue(); // process next or retry
    }
  }
}

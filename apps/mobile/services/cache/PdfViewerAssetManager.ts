import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

/**
 * PDF Viewer Asset Manager
 * 
 * Responsible ONLY for ensuring the PDF.js viewer HTML and related scripts
 * are copied to a versioned local cache directory so they can be served
 * to a WKWebView on iOS (which requires allowingReadAccessToURL to a local dir).
 */
export class PdfViewerAssetManager {
  // Bump this version if viewer.html, pdf.min.js, or pdf.worker.min.js change
  // Bumped to 3 after animated bouncing watermark update (2026-07-25)
  private static readonly VIEWER_VERSION = 3;
  private static readonly BASE_DIR = (FileSystem.cacheDirectory || 'file:///data/user/0/com.app/cache/') + 'pdfjs_assets/';
  
  static get currentViewerDir() {
    return `${this.BASE_DIR}v${this.VIEWER_VERSION}/`;
  }

  static get viewerHtmlUri() {
    return `${this.currentViewerDir}viewer.html`;
  }

  static async preparePdfViewerAssets(): Promise<string> {
    const targetDir = this.currentViewerDir;
    
    // Check if the current version is already cached
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (dirInfo.exists) {
      return this.viewerHtmlUri;
    }

    // Auto Migration: Delete old viewer caches to save space
    await this.cleanupOldVersions();

    // Create the new version directory
    await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

    // Note on .txt workaround:
    // Expo/Metro bundles .js files as source code. By renaming the PDF.js library files 
    // to .txt, we trick the bundler into including them as raw file assets, allowing us 
    // to copy them natively and restore the .js extension for the WebView.
    const viewerAsset = Asset.fromModule(require('../../assets/pdfjs/viewer.html'));
    const jsAsset = Asset.fromModule(require('../../assets/pdfjs/pdf.min.js.txt'));
    const workerAsset = Asset.fromModule(require('../../assets/pdfjs/pdf.worker.min.js.txt'));

    await Promise.all([
      viewerAsset.downloadAsync(),
      jsAsset.downloadAsync(),
      workerAsset.downloadAsync()
    ]);

    await FileSystem.copyAsync({ from: viewerAsset.localUri || viewerAsset.uri, to: targetDir + 'viewer.html' });
    await FileSystem.copyAsync({ from: jsAsset.localUri || jsAsset.uri, to: targetDir + 'pdf.min.js' });
    await FileSystem.copyAsync({ from: workerAsset.localUri || workerAsset.uri, to: targetDir + 'pdf.worker.min.js' });

    return this.viewerHtmlUri;
  }

  private static async cleanupOldVersions() {
    try {
      const baseInfo = await FileSystem.getInfoAsync(this.BASE_DIR);
      if (!baseInfo.exists) return;
      
      const files = await FileSystem.readDirectoryAsync(this.BASE_DIR);
      for (const file of files) {
        if (file !== `v${this.VIEWER_VERSION}`) {
          await FileSystem.deleteAsync(`${this.BASE_DIR}${file}`, { idempotent: true });
        }
      }
    } catch (e) {
      console.warn('[PdfViewerAssetManager] Failed to cleanup old versions', e);
    }
  }
}

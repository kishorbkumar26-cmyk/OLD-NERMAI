import { DatabaseService } from './DatabaseService';
import api from '../../core/api';
import { Platform } from 'react-native';

export class AssistantSyncService {
  static async sync() {
    if (Platform.OS === 'web') return; // Web uses backend directly

    try {
      await DatabaseService.init();
      const db = DatabaseService.getDb();
      if (!db) return;

      // Get last sync timestamp
      const row: any = await db.getFirstAsync(`SELECT lastSyncTimestamp FROM sync_metadata WHERE id = 'assistant_sync'`);
      const sinceTimestamp = row?.lastSyncTimestamp || '1970-01-01T00:00:00.000Z';

      // Fetch delta pack
      const response = await api.get(`/assistant/sync?since=${encodeURIComponent(sinceTimestamp)}`);
      const pack = response.data.data;

      if (!pack) return;

      // Perform atomic updates using transactions
      // Note: expo-sqlite next uses runAsync inside withTransactionAsync, but standard use is execAsync or runAsync
      // For simplicity here, we'll do sequential awaits. (For production 100K+ rows, a transaction is recommended)
      
      for (const article of pack.articles) {
        await db.runAsync(`
          INSERT OR REPLACE INTO kb_articles 
          (id, tenantId, collectionId, keywords, synonyms, tags, aliases, category, translations, visibility, targetCourseIds, targetSubjectIds, targetTopicIds, relatedArticleIds, relatedResourceIds, relatedClassIds, status, version, priority, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          article.id,
          article.tenantId,
          article.collectionId,
          JSON.stringify(article.keywords || []),
          JSON.stringify(article.synonyms || []),
          JSON.stringify(article.tags || []),
          JSON.stringify(article.aliases || []),
          article.category || 'General',
          JSON.stringify(article.translations || {}),
          article.visibility || 'all',
          JSON.stringify(article.targetCourseIds || []),
          JSON.stringify(article.targetSubjectIds || []),
          JSON.stringify(article.targetTopicIds || []),
          JSON.stringify(article.relatedArticleIds || []),
          JSON.stringify(article.relatedResourceIds || []),
          JSON.stringify(article.relatedClassIds || []),
          article.status,
          article.version,
          article.priority || 0,
          article.updatedAt
        ]);
      }

      for (const intent of pack.intents) {
        await db.runAsync(`
          INSERT OR REPLACE INTO kb_intents 
          (id, tenantId, name, keywords, priority, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          intent.id,
          intent.tenantId,
          intent.name,
          JSON.stringify(intent.keywords || []),
          intent.priority || 0,
          intent.updatedAt
        ]);
      }

      for (const qa of pack.quickActions) {
        await db.runAsync(`
          INSERT OR REPLACE INTO kb_quick_actions 
          (id, tenantId, label, intent, icon, "order", isActive, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          qa.id,
          qa.tenantId,
          qa.label,
          qa.intent,
          qa.icon || '',
          qa.order || 0,
          qa.isActive ? 1 : 0,
          qa.updatedAt
        ]);
      }

      // Update sync metadata
      await db.runAsync(`
        INSERT OR REPLACE INTO sync_metadata (id, lastSyncTimestamp) VALUES ('assistant_sync', ?)
      `, [pack.timestamp]);

      console.log(`[AssistantSyncService] Sync completed. Server timestamp: ${pack.timestamp}`);

    } catch (e) {
      console.error("[AssistantSyncService] Sync failed", e);
    }
  }
}

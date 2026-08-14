import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'nermai_knowledge.db';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async init() {
    if (Platform.OS === 'web') return; // SQLite not supported on web natively this way without extra setup, but Assistant on web uses API directly.
    
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.setupSchema();
    }
  }

  private static async setupSchema() {
    if (!this.db) return;

    // We store JSON strings for complex fields (arrays/objects)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS kb_articles (
        id TEXT PRIMARY KEY,
        tenantId TEXT,
        collectionId TEXT,
        keywords TEXT,
        synonyms TEXT,
        tags TEXT,
        aliases TEXT,
        category TEXT,
        translations TEXT,
        visibility TEXT,
        targetCourseIds TEXT,
        targetSubjectIds TEXT,
        targetTopicIds TEXT,
        relatedArticleIds TEXT,
        relatedResourceIds TEXT,
        relatedClassIds TEXT,
        status TEXT,
        version INTEGER,
        priority INTEGER,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS kb_intents (
        id TEXT PRIMARY KEY,
        tenantId TEXT,
        name TEXT,
        keywords TEXT,
        priority INTEGER,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS kb_quick_actions (
        id TEXT PRIMARY KEY,
        tenantId TEXT,
        label TEXT,
        intent TEXT,
        icon TEXT,
        "order" INTEGER,
        isActive INTEGER,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        id TEXT PRIMARY KEY,
        lastSyncTimestamp TEXT
      );
    `);
  }

  static getDb() {
    if (!this.db && Platform.OS !== 'web') {
      throw new Error("Database not initialized");
    }
    return this.db;
  }
}

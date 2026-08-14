import * as SQLite from 'expo-sqlite';

export interface QueuedInteraction {
  id: string;
  contextType: string;
  contextId: string;
  type: string;
  payload: string; // JSON string of message, voiceUrl, etc
  timestamp: number;
}

export class InteractionQueue {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('interactions.db');
    this.initDB();
  }

  private initDB() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS interaction_queue (
        id TEXT PRIMARY KEY,
        contextType TEXT NOT NULL,
        contextId TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);
  }

  public enqueue(interaction: QueuedInteraction) {
    this.db.runSync(
      `INSERT INTO interaction_queue (id, contextType, contextId, type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [interaction.id, interaction.contextType, interaction.contextId, interaction.type, interaction.payload, interaction.timestamp]
    );
  }

  public dequeueAll(): QueuedInteraction[] {
    const rows = this.db.getAllSync(`SELECT * FROM interaction_queue ORDER BY timestamp ASC`);
    return rows as QueuedInteraction[];
  }

  public remove(id: string) {
    this.db.runSync(`DELETE FROM interaction_queue WHERE id = ?`, [id]);
  }
}

export const interactionQueue = new InteractionQueue();

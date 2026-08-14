import { DatabaseService } from './DatabaseService';

export interface LocalContext {
  activeCourseId?: string;
}

export interface AssistantMemory {
  lastResults: any[];
}

export class LocalAssistantEngine {
  private memory: AssistantMemory = { lastResults: [] };

  /**
   * Universal Local Deterministic Knowledge Search Engine (10-Tier Ranking)
   * Pipeline: Exact -> Alias -> Synonym -> Tag -> Keyword -> Category -> Priority -> Latest
   */
  async search(query: string, tenantId: string, context: LocalContext | null) {
    const db = DatabaseService.getDb();
    if (!db) return [];

    const normalizedQuery = query.toLowerCase().trim();

    // Fetch all published articles
    // Note: expo-sqlite next has getAllAsync
    const allArticles: any[] = await db.getAllAsync(`
      SELECT * FROM kb_articles 
      WHERE tenantId = ? AND status = 'published'
    `, [tenantId]);

    const scored: { article: any; score: number }[] = [];

    for (const article of allArticles) {
      const targetCourseIds = JSON.parse(article.targetCourseIds || '[]');
      
      // 0. Context Filtering
      if (context && context.activeCourseId && targetCourseIds.length > 0) {
        if (!targetCourseIds.includes(context.activeCourseId)) continue;
      }

      let score = 0;
      const translations = JSON.parse(article.translations || '{}');
      const enTitle = translations.en?.title?.toLowerCase() || '';
      const taTitle = translations.ta?.title?.toLowerCase() || '';
      
      const aliases: string[] = JSON.parse(article.aliases || '[]');
      const synonyms: string[] = JSON.parse(article.synonyms || '[]');
      const tags: string[] = JSON.parse(article.tags || '[]');
      const keywords: string[] = JSON.parse(article.keywords || '[]');
      
      // 1. Exact Match (Score 100)
      if (enTitle === normalizedQuery || taTitle === normalizedQuery) {
        score = Math.max(score, 100);
      }
      
      // 2. Alias Match (Score 90)
      if (aliases.some(a => a.toLowerCase() === normalizedQuery)) {
        score = Math.max(score, 90);
      }
      
      // 3. Synonym Match (Score 80)
      if (synonyms.some(s => normalizedQuery.includes(s.toLowerCase()))) {
        score = Math.max(score, 80);
      }

      // 4. Tag Match (Score 70)
      if (tags.some(t => normalizedQuery.includes(t.toLowerCase()))) {
        score = Math.max(score, 70);
      }

      // 5. Keyword Match (Score 60)
      if (keywords.some(k => normalizedQuery.includes(k.toLowerCase()))) {
        score = Math.max(score, 60);
      }

      // Partial Title Match (Score 55)
      if (enTitle.includes(normalizedQuery) || taTitle.includes(normalizedQuery)) {
        score = Math.max(score, 55);
      }

      // 6. Category Match (Score 50)
      if (article.category && article.category.toLowerCase().includes(normalizedQuery)) {
        score = Math.max(score, 50);
      }

      if (score > 0) {
        // 7 & 8. Add Priority Score as a tie-breaker (Max +10)
        score += Math.min(article.priority || 0, 10);
        scored.push({ article, score });
      }
    }

    // 9. Latest Updated Sorting (Sort by score DESC, then by Date DESC)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = new Date(a.article.updatedAt).getTime();
      const dateB = new Date(b.article.updatedAt).getTime();
      return dateB - dateA; // Latest first
    });

    return scored.map(s => s.article);
  }

  /**
   * Search specifically for Quick Actions and map to Intent
   */
  async getQuickActions(tenantId: string) {
    const db = DatabaseService.getDb();
    if (!db) return [];
    
    return await db.getAllAsync(`
      SELECT * FROM kb_quick_actions 
      WHERE tenantId = ? AND isActive = 1 
      ORDER BY "order" ASC
    `, [tenantId]);
  }

  /**
   * Search Intents (Slash Commands)
   */
  async matchIntent(query: string, tenantId: string) {
    const db = DatabaseService.getDb();
    if (!db) return null;

    const normalized = query.toLowerCase();
    if (normalized.startsWith('/')) {
      const intentName = normalized.substring(1).trim();
      const row: any = await db.getFirstAsync(`SELECT * FROM kb_intents WHERE tenantId = ? AND name = ?`, [tenantId, intentName]);
      return row;
    }

    const allIntents: any[] = await db.getAllAsync(`SELECT * FROM kb_intents WHERE tenantId = ?`, [tenantId]);
    
    let bestMatch = null;
    let highestScore = 0;

    for (const intent of allIntents) {
       const keywords: string[] = JSON.parse(intent.keywords || '[]');
       const matchCount = keywords.filter(k => normalized.includes(k.toLowerCase())).length;
       const score = (matchCount / Math.max(keywords.length, 1)) * 100;
       
       if (score > highestScore && score >= 80) {
         highestScore = score;
         bestMatch = intent;
       }
    }

    return bestMatch;
  }

  // --- Memory and Ordinal Parsing ---
  setLastResults(results: any[]) {
    this.memory.lastResults = results;
  }

  resolveOrdinal(query: string) {
    const normalized = query.toLowerCase();
    const ordinals: Record<string, number> = {
      'first': 0, '1st': 0, 'one': 0, '1': 0,
      'second': 1, '2nd': 1, 'two': 1, '2': 1,
      'third': 2, '3rd': 2, 'three': 2, '3': 2,
      'fourth': 3, '4th': 3, 'four': 3, '4': 3,
      'fifth': 4, '5th': 4, 'five': 4, '5': 4,
      'last': -1
    };

    let matchedIndex = -2;

    for (const [key, index] of Object.entries(ordinals)) {
      if (normalized.includes(`open ${key}`) || normalized.includes(key)) {
        matchedIndex = index;
        break;
      }
    }

    if (matchedIndex === -2 || this.memory.lastResults.length === 0) return null;

    if (matchedIndex === -1) {
      return this.memory.lastResults[this.memory.lastResults.length - 1];
    }

    if (matchedIndex >= 0 && matchedIndex < this.memory.lastResults.length) {
      return this.memory.lastResults[matchedIndex];
    }

    return null;
  }
}

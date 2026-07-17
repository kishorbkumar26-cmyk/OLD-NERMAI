import { Request, Response, NextFunction } from 'express';
import { ContextService } from './contextService';
import { IntentRouter } from './intentRouter';
import { KnowledgeService } from './knowledgeService';
import { ResponseBuilder, IAssistantResponse } from './responseBuilder';
import { AssistantEngine } from './assistantEngine';
import { UniversalSearchService } from './universalSearch';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';

const contextService = new ContextService();
const intentRouter = new IntentRouter();
const knowledgeService = new KnowledgeService();
const assistantEngine = new AssistantEngine();
const universalSearch = new UniversalSearchService();

const chatSchema = z.object({
  query: z.string().min(1),
  language: z.string().default('en')
});

export class AssistantController {
  
  static async setContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.user!;
      await contextService.setContext(userId, req.body);
      res.status(200).json({ status: 'success' });
    } catch (err) { next(err); }
  }

  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, userId } = req.user!;
      const { query, language } = chatSchema.parse(req.body);

      // --- ASSISTANT PIPELINE ---

      // 1. Slash Command (Quick Actions)
      if (query.startsWith('/')) {
        const intentName = query.substring(1).toLowerCase().trim();
        const responsePayload = await AssistantController.handleIntent(intentName, tenantId, userId, language);
        return res.status(200).json({ status: 'success', data: responsePayload });
      }

      // 2. Conversation Memory & Context
      const memory = await contextService.getMemory(userId);
      const context = memory.context;

      // 3. Ordinal Resolution ("Open the second one")
      const resolvedItem = await contextService.resolveOrdinal(query, userId);
      if (resolvedItem) {
        // Build a special response that triggers opening the item on the client
        const responsePayload = ResponseBuilder.buildText(`Opening: ${resolvedItem.title}`);
        responsePayload.actions = [{
          type: 'OPEN_RESOURCE',
          payload: resolvedItem
        } as any];
        
        await contextService.updateMemory(userId, {
          query,
          intent: 'ordinal_open',
          results: [] // clear results on action
        });

        return res.status(200).json({ status: 'success', data: responsePayload });
      }

      // 4. Intent Matching
      const matches = await intentRouter.routeQuery(query, tenantId);

      let responsePayload: IAssistantResponse | null = null;

      if (matches.length > 0 && matches[0].confidence >= 90) {
        // High Confidence -> Direct Answer
        responsePayload = await AssistantController.handleIntent(matches[0].name, tenantId, userId, language);
      } else {
        // 5. Universal Search (Courses, Resources, Announcements, FAQs)
        const searchResults = await universalSearch.search(query, tenantId, context as any);
        
        if (searchResults.length > 0) {
          // If multiple categories matched, we send the first one as primary, or we could aggregate.
          // For simplicity, we just return the first block (e.g. FAQ or Resource List).
          // Future enhancement: The UI could accept an array of responses.
          responsePayload = searchResults[0];
        } else {
          // 6. Future LLM Fallback
          // Log Unanswered Question
          await getFirestore().collection('unanswered_queries').add({
            tenantId,
            userId,
            query,
            context,
            timestamp: new Date().toISOString()
          });

          const aiResponse = await assistantEngine.llmFallback(query, context as any);
          if (aiResponse && !aiResponse.includes('Not configured')) {
            responsePayload = ResponseBuilder.buildText(aiResponse);
          } else {
            responsePayload = ResponseBuilder.buildUnanswered();
          }
        }
      }

      // Update Memory
      await contextService.updateMemory(userId, {
        query,
        intent: matches.length > 0 ? matches[0].name : 'universal_search',
        results: responsePayload?.items || []
      });

      res.status(200).json({ status: 'success', data: responsePayload });
    } catch (err) { next(err); }
  }

  static async previewSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.user!;
      const { query, language } = chatSchema.parse(req.body);
      
      const start = Date.now();
      
      // Simulate pipeline
      const matches = await intentRouter.routeQuery(query, tenantId);
      let responsePayload: IAssistantResponse | null = null;
      let matchedVia = 'none';
      let confidence = 0;

      if (matches.length > 0 && matches[0].confidence >= 90) {
        responsePayload = await AssistantController.handleIntent(matches[0].name, tenantId, 'preview-user', language);
        matchedVia = 'Intent: ' + matches[0].name;
        confidence = matches[0].confidence;
      } else {
        const searchResults = await universalSearch.search(query, tenantId, {} as any);
        if (searchResults.length > 0) {
          responsePayload = searchResults[0];
          matchedVia = 'Universal Search';
          confidence = 80;
        } else {
          matchedVia = 'Fallback (LLM / Default)';
        }
      }

      res.status(200).json({ 
        status: 'success', 
        data: {
           response: responsePayload,
           diagnostics: {
             matchedVia,
             confidence,
             latencyMs: Date.now() - start
           }
        } 
      });
    } catch (err) { next(err); }
  }

  static async syncKnowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.user!;
      const since = req.query.since as string;
      const contentPack = await knowledgeService.getContentPack(tenantId, since);
      res.status(200).json({ status: 'success', data: contentPack });
    } catch (err) { next(err); }
  }

  private static async handleIntent(intentName: string, tenantId: string, userId: string, language: string): Promise<IAssistantResponse> {
    const normalized = intentName.toLowerCase();
    const memory = await contextService.getMemory(userId);

    // Quick Actions Handling
    switch (normalized) {
      case 'courses':
        return ResponseBuilder.buildResourceList('My Courses', 'Quick access to your enrolled courses.', [
          { title: 'My Enrolled Courses', type: 'View Module', intent: '/view_courses' }
        ]);
      
      case 'notes':
      case 'resources':
        const resources = await knowledgeService.searchResources(normalized, tenantId, memory.context as any);
        return ResponseBuilder.buildResourceList('Today\'s Notes', 'Based on your recent classes.', resources);
      
      case 'live':
        return ResponseBuilder.buildResourceList('Live Classes', 'Upcoming live sessions.', [
          { title: 'View Schedule', type: 'Link', intent: '/view_live_schedule' }
        ]);
      
      case 'attendance':
        return ResponseBuilder.buildText('Attendance module quick action: View your overall attendance percentage.');
      
      case 'hallticket':
      case 'tests':
      case 'payments':
      case 'profile':
      case 'certificates':
        return ResponseBuilder.buildText(`The **${normalized.toUpperCase()}** module is coming soon! This quick action will be available shortly.`);
      
      case 'announcements':
        return ResponseBuilder.buildResourceList('Recent Announcements', 'Important updates from the academy.', [
          { title: 'Open Announcements Portal', type: 'Link', intent: '/view_announcements' }
        ]);
      
      case 'help':
      case 'faq':
        const knowledgeTop = await knowledgeService.searchKnowledgePlatform('', tenantId, memory.context as any);
        const items = knowledgeTop.slice(0, 5).map(r => {
          const tr = r.article.translations[language] || r.article.translations['en'];
          return { title: tr?.title, answer: tr?.content };
        });
        return {
          type: 'faq',
          title: 'Knowledge Base Top Articles',
          items
        };
    }

    // Default: use universal Deterministic Knowledge Search Pipeline
    const knowledgeResults = await knowledgeService.searchKnowledgePlatform(normalized, tenantId, memory.context as any);

    if (knowledgeResults.length > 0) {
      const bestFaq = knowledgeResults[0].article;
      const translation = bestFaq.translations[language] || bestFaq.translations['en'];
      if (translation) {
         return ResponseBuilder.buildFAQ(translation.title, translation.content);
      }
    }
    
    return ResponseBuilder.buildText(`I understand you're asking about "${intentName}", but I don't have detailed info yet.`);
  }
}

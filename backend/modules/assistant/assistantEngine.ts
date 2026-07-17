import { IStudentContext } from './contextService';
import { logger } from '../../core/logger';

export class AssistantEngine {
  /**
   * DeterministicEngine: Current active engine mapping queries to exact records.
   * Runs first for precision, bandwidth efficiency, and data privacy.
   */
  async deterministicFallback(query: string, context: IStudentContext | null): Promise<string | null> {
    logger.info(`[AssistantEngine] Deterministic fallback for query: "${query}"`);
    return null; // Signals controller that it couldn't be answered deterministically beyond basic FAQs
  }

  /**
   * LLMEngine: Future Local LLM integration (e.g., Llama, Qwen via Ollama)
   * Only called if DeterministicEngine yields no result.
   */
  async llmFallback(query: string, context: IStudentContext | null): Promise<string | null> {
    logger.info(`[AssistantEngine] Future LLMEngine called for query: "${query}"`);
    return "Not configured. This system is currently running in Deterministic Mode.";
  }
}

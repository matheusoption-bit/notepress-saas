/**
 * perplexity-client.ts
 *
 * Re-exporta providers e seletores de modelo de src/lib/ai-providers.ts.
 * Mantido por compatibilidade — a fonte da verdade é a raiz.
 *
 * Para importar diretamente:
 *   import { perplexityProvider, sonar, claude } from '@/lib/ai-providers'
 */

export {
  perplexityProvider,
  anthropicProvider,
  googleProvider,
  openaiProvider,
  sonar,
  claude,
  gemini,
  gpt,
} from '../ai-providers';

export type {
  SonarModel,
  ClaudeModel,
  GeminiModel,
  GptModel,
} from '../ai-providers';

// ─── Guard de configuração ────────────────────────────────────────────────────

export function assertAiEnv() {
  const missing: string[] = [];

  if (!process.env.PERPLEXITY_API_KEY) missing.push('PERPLEXITY_API_KEY');
  if (!process.env.AI_ANTHROPIC_KEY)   missing.push('AI_ANTHROPIC_KEY');
  if (!process.env.AI_GOOGLE_KEY)      missing.push('AI_GOOGLE_KEY');
  if (!process.env.AI_OPENAI_KEY)      missing.push('AI_OPENAI_KEY');

  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[ai] Variáveis não configuradas: ${missing.join(', ')}. ` +
      'Funcionalidades AI podem falhar.'
    );
  }
}

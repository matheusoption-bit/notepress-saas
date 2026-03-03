/**
 * src/lib/ai/index.ts
 *
 * Barrel de exportação para o módulo de IA do Notepress.
 *
 * Uso:
 *   import { runBrain, validateInnovation, enrichEdital } from '@/lib/ai'
 */

// ─── Providers e modelos ──────────────────────────────────────────────────────
export {
  perplexityProvider,
  anthropicProvider,
  googleProvider,
  openaiProvider,
  sonar,
  claude,
  gemini,
  gpt,
  assertAiEnv,
} from './perplexity-client';

export type {
  SonarModel,
  ClaudeModel,
  GeminiModel,
  GptModel,
} from './perplexity-client';

// ─── Innovation Validator ─────────────────────────────────────────────────────
export {
  validateInnovation,
  getValidationHistory,
  InnovationResultSchema,
} from './innovation-validator';

export type {
  InnovationResult,
  ValidateInnovationInput,
  ValidateInnovationOutput,
} from './innovation-validator';

// ─── Brain Orchestrator ───────────────────────────────────────────────────────
export {
  runBrain,
  getBrainRunHistory,
} from './brain-orchestrator';

export type {
  AgentRole,
  AgentOutput,
  BrainRunInput,
  BrainRunOutput,
} from './brain-orchestrator';

// ─── Edital Enricher ──────────────────────────────────────────────────────────
export {
  enrichEdital,
  generateEditalSummary,
  compareEditais,
  checkEditalStatus,
  EditalEnrichmentSchema,
  EditalSummarySchema,
} from './edital-enricher';

export type {
  EditalEnrichment,
  EditalSummary,
  EnrichEditalInput,
} from './edital-enricher';

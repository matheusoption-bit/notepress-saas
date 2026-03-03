/**
 * perplexity-client.ts
 *
 * Cliente singleton para a API Sonar da Perplexity, configurado via
 * createOpenAI do @ai-sdk/openai (interface compatível com OpenAI).
 *
 * Inclui:
 * - Retry automático com backoff exponencial (trata 429 / rate-limit)
 * - Modelos tipados para cada caso de uso
 * - Guard de variável de ambiente em dev
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// ─── Configuração de retry ────────────────────────────────────────────────────

const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 1_000; // 1s → 2s → 4s → 8s

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch customizado com backoff exponencial.
 * Reprocessa automaticamente erros 429 (rate-limit) e 5xx.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0
): Promise<Response> {
  const response = await fetch(input, init);

  if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
    const retryAfter = response.headers.get('retry-after');
    const delay = retryAfter
      ? parseInt(retryAfter, 10) * 1_000
      : INITIAL_DELAY_MS * Math.pow(2, attempt);

    console.warn(
      `[perplexity-client] status ${response.status} - retry ${attempt + 1}/${MAX_RETRIES} em ${delay}ms`
    );

    await sleep(delay);
    return fetchWithRetry(input, init, attempt + 1);
  }

  return response;
}

// ─── Providers ────────────────────────────────────────────────────────────────

/**
 * Provider Perplexity (Sonar) — busca web integrada nativa.
 * Ideal para: pesquisa de editais, validação de inovação, enriquecimento.
 */
export const perplexityProvider = createOpenAI({
  name: 'perplexity',
  apiKey: process.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai',
  fetch: fetchWithRetry as typeof fetch,
});

/**
 * Provider Anthropic (Claude) — raciocínio profundo, análise crítica.
 * Ideal para: Agente Reviewer, DEVILS_ADVOCATE, STRESS_TEST.
 */
export const anthropicProvider = createAnthropic({
  apiKey: process.env.AI_ANTHROPIC_KEY ?? '',
});

/**
 * Provider Google (Gemini) — janela de contexto longa (1M tokens).
 * Ideal para: Agente Analyst, análise de documentos extensos.
 */
export const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.AI_GOOGLE_KEY ?? '',
});

/**
 * Provider OpenAI (GPT) — outputs estruturados, function calling.
 * Ideal para: Agente GPT, geração de checklists, passos a passo.
 */
export const openaiProvider = createOpenAI({
  name: 'openai',
  apiKey: process.env.AI_OPENAI_KEY ?? '',
});

// ─── Seletores de modelo tipados ──────────────────────────────────────────────

/** Modelos Sonar disponíveis na Perplexity */
export type SonarModel =
  | 'llama-3.1-sonar-small-128k-online'  // mais barato, testes e enriquecimento
  | 'sonar'                               // rápido, queries diretas
  | 'sonar-pro'                           // análise profunda
  | 'sonar-reasoning-pro';               // raciocínio avançado (debate)

/** Retorna um modelo Sonar configurado com retry built-in */
export function sonar(model: SonarModel = 'llama-3.1-sonar-small-128k-online') {
  return perplexityProvider(model);
}

/** Retorna um modelo Claude configurado */
export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229';

export function claude(model: ClaudeModel = 'claude-3-5-sonnet-20241022') {
  return anthropicProvider(model);
}

/** Retorna um modelo Gemini configurado */
export type GeminiModel =
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-pro';

export function gemini(model: GeminiModel = 'gemini-2.0-flash') {
  return googleProvider(model);
}

/** Retorna um modelo GPT configurado */
export type GptModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo';

export function gpt(model: GptModel = 'gpt-4o-mini') {
  return openaiProvider(model);
}

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

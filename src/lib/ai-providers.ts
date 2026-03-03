/**
 * ai-providers.ts
 *
 * Configuração centralizada de TODOS os providers de IA do Notepress SaaS.
 * Fonte da verdade única — demais módulos re-exportam daqui.
 *
 * ┌──────────────────┬────────────────────────────────────┬──────────────────────┐
 * │ Agente           │ Provider                           │ Papel                │
 * ├──────────────────┼────────────────────────────────────┼──────────────────────┤
 * │ GEMINI_SEARCH    │ Google Gemini 2.5 Flash + Grounding│ Auditor c/ web real  │
 * │ GEMINI_CREATE    │ Google Gemini 2.5 Flash            │ Pesquisador criativo │
 * │ DEEPSEEK         │ DeepSeek Chat                      │ Analista quantitativo│
 * │ LLAMA            │ Groq Llama 3.3 70B                 │ Revisor ultra-rápido │
 * │ WATSONX_BR       │ IBM WatsonX Granite 3.8B           │ Árbitro de compliance│
 * │ PERPLEXITY       │ Sonar (OpenAI-compat) + retry      │ Pesquisa web nativa  │
 * │ ANTHROPIC        │ Claude 3.x                         │ Raciocínio profundo  │
 * │ OPENAI           │ GPT-4o                             │ Outputs estruturados │
 * └──────────────────┴────────────────────────────────────┴──────────────────────┘
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { watsonxGranite } from './watsonx-client';
import type { LanguageModel } from 'ai';

// ─── Retry helper ──────────────────────────────────────────────────────────────
// Usado pelo perplexityProvider para tratar 429 / 5xx com backoff exponencial.

const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 1_000; // 1s → 2s → 4s → 8s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      `[ai-providers] status ${response.status} — retry ${attempt + 1}/${MAX_RETRIES} em ${delay}ms`
    );

    await sleep(delay);
    return fetchWithRetry(input, init, attempt + 1);
  }

  return response;
}

// ─── 1. Google Gemini ──────────────────────────────────────────────────────────
// Papel: Pesquisador Criativo + Auditor com Busca Web Real (Search Grounding)
// Cada busca com grounding consome crédito das Google Search API calls
// Obter key: https://aistudio.google.com/app/apikey
export const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.AI_GOOGLE_KEY ?? '',
});

/** Alias semântico para o geminiProvider (compatibilidade com perplexity-client) */
export const googleProvider = geminiProvider;

// ─── 2. DeepSeek ──────────────────────────────────────────────────────────────
// Papel: Analista Quantitativo e Financeiro
// API compatível com OpenAI — melhor raciocínio matemático, custo baixíssimo
// Obter key: https://platform.deepseek.com
export const deepseekProvider = createOpenAI({
  name: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1',
});

// ─── 3. Groq ──────────────────────────────────────────────────────────────────
// Papel: Revisor Ultra-Rápido (300+ tok/s)
// Valida e refina o output dos outros agentes em milissegundos
// Obter key: https://console.groq.com/keys
export const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? '',
});

// ─── 4. IBM WatsonX ───────────────────────────────────────────────────────────
// Papel: Árbitro de Compliance — LGPD, FINEP, FAPESP, Lei de Inovação
// Política IBM: nunca usa dados dos clientes para treino (enterprise grade)
// Implementação: openai-compatible fetch + IAM token refresh (ver watsonx-client.ts)
// Obter: https://dataplatform.cloud.ibm.com

// ─── 5. Perplexity (Sonar) ────────────────────────────────────────────────────
// Papel: Pesquisa web nativa integrada — ideal para validação de anterioridade,
// enriquecimento de editais e dados de mercado em tempo real.
// Obter key: https://www.perplexity.ai/settings/api
export const perplexityProvider = createOpenAI({
  name: 'perplexity',
  apiKey: process.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai',
  fetch: fetchWithRetry as typeof fetch,
});

// ─── 6. Anthropic (Claude) ────────────────────────────────────────────────────
// Papel: Raciocínio profundo, análise crítica, DEVILS_ADVOCATE / STRESS_TEST
// Obter key: https://console.anthropic.com
export const anthropicProvider = createAnthropic({
  apiKey: process.env.AI_ANTHROPIC_KEY ?? '',
});

// ─── 7. OpenAI (GPT) ──────────────────────────────────────────────────────────
// Papel: Outputs estruturados, function calling, checklists passo a passo
// Obter key: https://platform.openai.com/api-keys
export const openaiProvider = createOpenAI({
  name: 'openai',
  apiKey: process.env.AI_OPENAI_KEY ?? '',
});

// ─── Agentes do Cérebro Quadripartite ─────────────────────────────────────────

export const quadripartiteProviders: Record<'GEMINI_SEARCH' | 'GEMINI_CREATE' | 'DEEPSEEK' | 'LLAMA' | 'WATSONX_BR', LanguageModel> = {
  // Gemini com Google Search Grounding — respostas embasadas em dados reais da web
  // useSearchGrounding: acessa novidades de editais, publicações, alterações normativas
  // @ts-expect-error @ai-sdk/google aceita useSearchGrounding em runtime; tipos v3 omitem o 2º arg
  GEMINI_SEARCH: geminiProvider('gemini-2.5-flash', { useSearchGrounding: true }) as LanguageModel,

  // Gemini puro — geração criativa sem latência de busca
  GEMINI_CREATE: geminiProvider('gemini-2.5-flash') as LanguageModel,

  // DeepSeek — análise quantitativa, cálculo de TRL, estimativas financeiras
  DEEPSEEK: deepseekProvider('deepseek-chat') as LanguageModel,

  // Groq / Llama 3.3 — revisão relâmpago, validação e síntese em ms
  LLAMA: groqProvider('llama-3.3-70b-versatile') as LanguageModel,

  // IBM WatsonX Granite — compliance com regulação brasileira, sem vazamento de dados
  // IAM token é buscado lazy na primeira chamada (ver watsonx-client.ts)
  WATSONX_BR: watsonxGranite,
};

// ─── Modelos alternativos disponíveis por provider ────────────────────────────
//
// Groq:
//   groqProvider('llama-4-scout')         → Llama 4 Scout (mais recente)
//   groqProvider('kimi-k2-instruct')      → Kimi K2 via Groq (gratuito)
//   groqProvider('qwen-qwq-32b')          → Raciocínio Qwen
//
// DeepSeek:
//   deepseekProvider('deepseek-reasoner') → DeepSeek R1 (raciocínio profundo)
//
// Gemini:
//   geminiProvider('gemini-2.5-pro')      → Gemini Pro (mais poderoso)
//   geminiProvider('gemini-2.0-flash')    → Versão anterior (mais econômica)
//
// IBM WatsonX:
//   createWatsonxModel('ibm/granite-3-2-8b-instruct', projectId, serviceUrl)
//   createWatsonxModel('meta-llama/llama-3-3-70b-instruct', projectId, serviceUrl)

// ─── Seletores de modelo tipados ──────────────────────────────────────────────
// Funções utilitárias que encapsulam o provider + tipo do modelo.
// Importadas por innovation-validator, edital-enricher, brain-orchestrator etc.

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

/** Modelos Claude disponíveis na Anthropic */
export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229';

/** Retorna um modelo Claude configurado */
export function claude(model: ClaudeModel = 'claude-3-5-sonnet-20241022') {
  return anthropicProvider(model);
}

/** Modelos Gemini disponíveis via Google */
export type GeminiModel =
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-pro';

/** Retorna um modelo Gemini configurado (sem Search Grounding) */
export function gemini(model: GeminiModel = 'gemini-2.0-flash') {
  return geminiProvider(model);
}

/** Modelos GPT disponíveis na OpenAI */
export type GptModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo';

/** Retorna um modelo GPT configurado */
export function gpt(model: GptModel = 'gpt-4o-mini') {
  return openaiProvider(model);
}

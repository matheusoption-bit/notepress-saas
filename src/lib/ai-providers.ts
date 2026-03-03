/**
 * ai-providers.ts
 *
 * Configuração centralizada dos providers de IA do Notepress SaaS.
 * Cérebro Quadripartite — 4 agentes especializados com providers distintos.
 *
 * ┌──────────────────┬────────────────────────────────────┬──────────────────────┐
 * │ Agente           │ Provider                           │ Papel                │
 * ├──────────────────┼────────────────────────────────────┼──────────────────────┤
 * │ GEMINI_SEARCH    │ Google Gemini 2.5 Flash + Grounding│ Auditor c/ web real  │
 * │ GEMINI_CREATE    │ Google Gemini 2.5 Flash            │ Pesquisador criativo │
 * │ DEEPSEEK         │ DeepSeek Chat                      │ Analista quantitativo│
 * │ LLAMA            │ Groq Llama 3.3 70B                 │ Revisor ultra-rápido │
 * │ WATSONX_BR       │ IBM WatsonX Granite 3.8B           │ Árbitro de compliance│
 * └──────────────────┴────────────────────────────────────┴──────────────────────┘
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { watsonxGranite } from './watsonx-client';
import type { LanguageModel } from 'ai';

// ─── 1. Google Gemini ──────────────────────────────────────────────────────────
// Papel: Pesquisador Criativo + Auditor com Busca Web Real (Search Grounding)
// Cada busca com grounding consome crédito das Google Search API calls
// Obter key: https://aistudio.google.com/app/apikey
export const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.AI_GOOGLE_KEY ?? '',
});

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

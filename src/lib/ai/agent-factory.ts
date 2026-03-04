/**
 * agent-factory.ts
 *
 * Notepress AI — Factory centralizada de agentes
 *
 * Fonte da verdade ÚNICA para instanciação de agentes de IA do Notepress.
 * Elimina duplicação entre o Brain Orchestrator (sequencial, 4 agentes)
 * e o Debate Engine (paralelo, 5 agentes).
 *
 * DOIS FLUXOS COEXISTEM por design:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Brain Orchestrator (brain-orchestrator.ts)                        │
 *   │  4 agentes sequenciais · Análise profunda individual               │
 *   │  ANALYST → REVIEWER → EXECUTOR → COMPLIANCE_BR                    │
 *   │  Cada agente recebe contexto acumulado dos anteriores              │
 *   │  Persistência: BrainRun → BrainNode[] + AgentMemory               │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Debate Engine (/api/ai/debate/route.ts)                           │
 *   │  5 agentes paralelos · 3 rodadas de debate cruzado                 │
 *   │  GEMINI_SEARCH + GEMINI_CREATE + DEEPSEEK + LLAMA + WATSONX_BR    │
 *   │  Agentes debatem entre si, convergem para consenso                 │
 *   │  Persistência: DebateRound → DebateMessage[]                       │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * A Factory provê configuração unificada (modelo, temperatura, system prompt)
 * para que ambos os fluxos consumam dos mesmos defaults sem divergir.
 */

import type { LanguageModel } from 'ai';
import { quadripartiteProviders } from '@/lib/ai-providers';

// ── Tipos ──────────────────────────────────────────────────────

/**
 * Todos os tipos de agente disponíveis no sistema.
 * Compatível com o enum AgentType do Prisma.
 */
export type AgentType =
  | 'GEMINI_SEARCH'
  | 'GEMINI_CREATE'
  | 'DEEPSEEK'
  | 'LLAMA'
  | 'WATSONX_BR';

/**
 * Papéis funcionais dos agentes (usados no Brain Orchestrator).
 */
export type AgentRole = 'ANALYST' | 'REVIEWER' | 'EXECUTOR' | 'COMPLIANCE_BR';

/**
 * Configuração completa de um agente retornada pela factory.
 */
export interface AgentConfig {
  type: AgentType;
  model: LanguageModel;
  temperature: number;
  label: string;
  description: string;
}

// ── Registry de agentes ────────────────────────────────────────

const AGENT_REGISTRY: Record<AgentType, Omit<AgentConfig, 'type'>> = {
  GEMINI_SEARCH: {
    model: quadripartiteProviders.GEMINI_SEARCH,
    temperature: 0.3,
    label: 'Auditor Web',
    description: 'Google Gemini 2.5 Flash + Search Grounding — pesquisa em tempo real, evidências e dados atualizados.',
  },
  GEMINI_CREATE: {
    model: quadripartiteProviders.GEMINI_CREATE,
    temperature: 0.7,
    label: 'Pesquisador Criativo',
    description: 'Google Gemini 2.5 Flash puro — conexões interdisciplinares, TRL, hipóteses inovadoras.',
  },
  DEEPSEEK: {
    model: quadripartiteProviders.DEEPSEEK,
    temperature: 0.5,
    label: 'Analista Quantitativo',
    description: 'DeepSeek Chat — viabilidade econômica, custos, ROI, métricas concretas.',
  },
  LLAMA: {
    model: quadripartiteProviders.LLAMA,
    temperature: 0.5,
    label: 'Revisor Ultra-Rápido',
    description: 'Groq / Llama 3.3 70B — revisão relâmpago, validação, síntese e estruturação.',
  },
  WATSONX_BR: {
    model: quadripartiteProviders.WATSONX_BR,
    temperature: 0.2,
    label: 'Compliance BR',
    description: 'IBM Granite 3.8B — conformidade com LGPD, FINEP, FAPESP, Lei de Inovação brasileira.',
  },
};

/**
 * Mapeamento padrão: papel funcional → tipo de agente.
 * Usado pelo Brain Orchestrator para resolução sequencial.
 */
export const ROLE_TO_AGENT: Record<AgentRole, AgentType> = {
  ANALYST: 'GEMINI_SEARCH',
  REVIEWER: 'DEEPSEEK',
  EXECUTOR: 'LLAMA',
  COMPLIANCE_BR: 'WATSONX_BR',
};

/**
 * Sequência padrão do Brain Orchestrator (4 agentes).
 */
export const BRAIN_SEQUENCE: Array<{ role: AgentRole; agentType: AgentType }> = [
  { role: 'ANALYST', agentType: 'GEMINI_SEARCH' },
  { role: 'REVIEWER', agentType: 'DEEPSEEK' },
  { role: 'EXECUTOR', agentType: 'LLAMA' },
  { role: 'COMPLIANCE_BR', agentType: 'WATSONX_BR' },
];

/**
 * Lista padrão do Debate Engine (5 agentes).
 */
export const DEBATE_AGENTS: AgentType[] = [
  'GEMINI_SEARCH',
  'GEMINI_CREATE',
  'DEEPSEEK',
  'LLAMA',
  'WATSONX_BR',
];

// ── Factory ────────────────────────────────────────────────────

/**
 * Retorna a configuração completa de um agente pelo tipo.
 *
 * @example
 * const agent = getAgent('GEMINI_SEARCH');
 * const { text } = await generateText({
 *   model: agent.model,
 *   temperature: agent.temperature,
 *   ...
 * });
 */
export function getAgent(type: AgentType): AgentConfig {
  const config = AGENT_REGISTRY[type];
  if (!config) {
    throw new Error(`[AgentFactory] Agente desconhecido: ${type}`);
  }
  return { type, ...config };
}

/**
 * Retorna as configurações de múltiplos agentes.
 *
 * @example
 * const agents = getAgents(DEBATE_AGENTS);
 */
export function getAgents(types: AgentType[]): AgentConfig[] {
  return types.map(getAgent);
}

/**
 * Retorna o modelo e temperatura otimizados para um papel funcional.
 * Atalho para o Brain Orchestrator.
 */
export function getAgentForRole(role: AgentRole): AgentConfig {
  return getAgent(ROLE_TO_AGENT[role]);
}

/**
 * brain-orchestrator.ts
 *
 * Notepress Brain — Cérebro Quadripartite
 *
 * Orquestra 4 agentes especializados em sequência, cada um com um papel distinto:
 *   GEMINI       → Analyst   : análise profunda de documentos (contexto longo)
 *   CLAUDE       → Reviewer  : revisão crítica e identificação de riscos
 *   GPT          → Executor  : estruturação em checklist, passos e ações concretas
 *   PERPLEXITY   → EspecialistaBR : contexto regulatório brasileiro em tempo real
 *
 * Padrão: adaptado do "ConversationManager" do api-cookbook da Perplexity.
 *
 * Persiste: BrainRun → BrainNode[] + AgentMemory (Prisma).
 */

import { generateText } from 'ai';
import { sonar, claude, gemini, gpt } from './perplexity-client';
import { prisma } from '@/lib/prisma';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AgentRole = 'ANALYST' | 'REVIEWER' | 'EXECUTOR' | 'ESPECIALISTA_BR';

export interface AgentOutput {
  role: AgentRole;
  agentType: 'GEMINI' | 'CLAUDE' | 'GPT' | 'ESPECIALISTA_BR';
  content: string;
  tokenUsage?: { inputTokens: number; outputTokens: number };
}

export interface BrainRunInput {
  /** Prompt/objetivo principal do usuário */
  prompt: string;
  /** Conteúdo do documento atual (Lexical serializado como texto puro) */
  documentContent?: string;
  /** ID do notebook */
  notebookId: string;
  /** ID do usuário autenticado */
  userId: string;
  /** Quais agentes executar (padrão: todos os 4) */
  agents?: AgentRole[];
}

export interface BrainRunOutput {
  brainRunId: string;
  agentOutputs: AgentOutput[];
  synthesis: string;
  status: 'completed' | 'failed';
  error?: string;
}

// ─── System prompts por agente ────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  ANALYST: `Você é o Agente Analyst do Notepress Brain — um analista especialista em inovação tecnológica e editais de financiamento no Brasil.

MISSÃO: Analisar profundamente o conteúdo fornecido e identificar:
- Pontos fortes e oportunidades da proposta
- Lacunas técnicas ou conceituais
- Alinhamento com o objetivo do usuário
- Nível de maturidade tecnológica (TRL) implícito

ESTILO: Analítico, preciso, sem jargões desnecessários. Use subtítulos para organizar sua análise.`,

  REVIEWER: `Você é o Agente Reviewer do Notepress Brain — um revisor crítico especializado em identificar riscos, inconsistências e pontos de melhoria em propostas de inovação.

MISSÃO: Com base na análise já realizada, atuar como "advogado do diabo" e:
- Identificar as 3-5 principais fraquezas ou riscos
- Questionar premissas não comprovadas
- Avaliar viabilidade técnica, financeira e operacional
- Apontar o que avaliadores de editais tipicamente rejeitam

ESTILO: Crítico mas construtivo. Seja direto. Cada crítica deve vir acompanhada de uma sugestão de melhoria.`,

  EXECUTOR: `Você é o Agente Executor do Notepress Brain — especialista em transformar análises complexas em planos de ação claros e acionáveis.

MISSÃO: Com base nas análises anteriores, estruturar:
- Checklist de ações prioritárias (formato markdown)
- Passos concretos numerados para implementação
- Prazo estimado para cada etapa (curto/médio/longo prazo)
- KPIs para medir progresso

ESTILO: Objetivo, estruturado, prático. Use listas e tabelas markdown. Evite texto corrido.`,

  ESPECIALISTA_BR: `Você é o Agente EspecialistaBR do Notepress Brain — especialista em regulamentação, marcos legais e contexto de inovação no Brasil, com acesso a informações em tempo real.

MISSÃO: Validar e contextualizar a proposta dentro do ecossistema brasileiro:
- Marcos legais aplicáveis (Lei do Bem, Lei de Informática, LGPD, etc.)
- Editais e programas de fomento relevantes abertos atualmente (FINEP, CNPq, BNDES, etc.)
- Riscos regulatórios específicos do setor no Brasil
- Experiências de empresas similares (benchmarks nacionais)

ESTILO: Técnico e preciso sobre o contexto brasileiro. Cite sempre fontes e links quando disponíveis. Use dados atualizados.`,
};

// ─── Helpers de memória ───────────────────────────────────────────────────────

async function loadMemory(
  agentType: 'GEMINI' | 'CLAUDE' | 'GPT' | 'ESPECIALISTA_BR',
  userId: string,
  notebookId: string
): Promise<string> {
  const memories = await prisma.agentMemory.findMany({
    where: {
      userId,
      agentType,
      OR: [{ notebookId }, { notebookId: null }],
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: { key: true, value: true },
  });

  if (memories.length === 0) return '';

  return (
    '\n\n[MEMÓRIA DE INTERAÇÕES ANTERIORES]\n' +
    memories.map((m) => `- ${m.key}: ${m.value}`).join('\n')
  );
}

async function saveMemory(
  agentType: 'GEMINI' | 'CLAUDE' | 'GPT' | 'ESPECIALISTA_BR',
  userId: string,
  notebookId: string,
  key: string,
  value: string
) {
  await prisma.agentMemory.upsert({
    where: { userId_agentType_key: { userId, agentType, key } },
    create: { userId, notebookId, agentType, key, value },
    update: { value, notebookId },
  });
}

// ─── Execução de um agente individual ────────────────────────────────────────

interface RunAgentParams {
  role: AgentRole;
  agentType: 'GEMINI' | 'CLAUDE' | 'GPT' | 'ESPECIALISTA_BR';
  prompt: string;
  context: string; // outputs anteriores acumulados
  userId: string;
  notebookId: string;
}

async function runAgent(params: RunAgentParams): Promise<AgentOutput> {
  const { role, agentType, prompt, context, userId, notebookId } = params;

  const memory = await loadMemory(agentType, userId, notebookId);

  const fullPrompt = [
    context ? `## CONTEXTO (outputs dos agentes anteriores)\n${context}` : '',
    `## TAREFA PRINCIPAL\n${prompt}`,
    memory,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Seleciona o modelo correto por agente
  const model =
    agentType === 'GEMINI'
      ? gemini('gemini-2.0-flash')
      : agentType === 'CLAUDE'
        ? claude('claude-3-5-sonnet-20241022')
        : agentType === 'GPT'
          ? gpt('gpt-4o-mini')
          : sonar('sonar-pro'); // ESPECIALISTA_BR via Perplexity

  const { text, usage } = await generateText({
    model,
    system: SYSTEM_PROMPTS[role],
    prompt: fullPrompt,
    maxOutputTokens: 2048,
  });

  // Salva resumo do output na memória do agente
  const summaryKey = `last_output_${new Date().toISOString().slice(0, 10)}`;
  const summary = text.slice(0, 500) + (text.length > 500 ? '...' : '');
  await saveMemory(agentType, userId, notebookId, summaryKey, summary);

  return {
    role,
    agentType,
    content: text,
    tokenUsage: usage
      ? {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
        }
      : undefined,
  };
}

// ─── Orquestrador principal ───────────────────────────────────────────────────

const AGENT_SEQUENCE: Array<{
  role: AgentRole;
  agentType: 'GEMINI' | 'CLAUDE' | 'GPT' | 'ESPECIALISTA_BR';
}> = [
  { role: 'ANALYST', agentType: 'GEMINI' },
  { role: 'REVIEWER', agentType: 'CLAUDE' },
  { role: 'EXECUTOR', agentType: 'GPT' },
  { role: 'ESPECIALISTA_BR', agentType: 'ESPECIALISTA_BR' },
];

/**
 * Executa o Notepress Brain com os 4 agentes em sequência.
 * Cada agente recebe o contexto acumulado dos anteriores.
 * Persiste BrainRun + BrainNode[] no Prisma.
 */
export async function runBrain(input: BrainRunInput): Promise<BrainRunOutput> {
  const { prompt, documentContent, notebookId, userId, agents } = input;

  // Cria o registro BrainRun
  const brainRun = await prisma.brainRun.create({
    data: { notebookId, userId, prompt, status: 'running' },
  });

  const activeAgents = agents
    ? AGENT_SEQUENCE.filter((a) => agents.includes(a.role))
    : AGENT_SEQUENCE;

  const agentOutputs: AgentOutput[] = [];
  let contextAccumulator = documentContent
    ? `## CONTEÚDO DO DOCUMENTO ATUAL\n${documentContent}\n`
    : '';

  try {
    for (let i = 0; i < activeAgents.length; i++) {
      const { role, agentType } = activeAgents[i];

      console.log(`[brain] Executando agente ${i + 1}/${activeAgents.length}: ${role}`);

      const output = await runAgent({
        role,
        agentType,
        prompt,
        context: contextAccumulator,
        userId,
        notebookId,
      });

      agentOutputs.push(output);

      // Adiciona output ao contexto para o próximo agente
      contextAccumulator +=
        `\n\n### ${role} (${agentType})\n` + output.content;

      // Persiste como BrainNode
      await prisma.brainNode.create({
        data: {
          brainRunId: brainRun.id,
          nodeType: role,
          content: {
            agentType,
            text: output.content,
            tokenUsage: output.tokenUsage ?? null,
          },
          order: i,
        },
      });
    }

    // Síntese final usando Sonar (barato e rápido)
    const { text: synthesis } = await generateText({
      model: sonar('llama-3.1-sonar-small-128k-online'),
      system:
        'Você é um sintetizador de informações. Crie um resumo executivo em português, ' +
        'com no máximo 3 parágrafos, integrando os pontos mais importantes de todos os agentes. ' +
        'Seja direto e acionável.',
      prompt: contextAccumulator,
      maxOutputTokens: 512,
    });

    // Salva nó de síntese
    await prisma.brainNode.create({
      data: {
        brainRunId: brainRun.id,
        nodeType: 'SYNTHESIS',
        content: { text: synthesis },
        order: activeAgents.length,
      },
    });

    // Marca como concluído
    await prisma.brainRun.update({
      where: { id: brainRun.id },
      data: { status: 'completed' },
    });

    return {
      brainRunId: brainRun.id,
      agentOutputs,
      synthesis,
      status: 'completed',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[brain] Erro na execução:', errorMessage);

    await prisma.brainRun.update({
      where: { id: brainRun.id },
      data: { status: 'failed' },
    });

    return {
      brainRunId: brainRun.id,
      agentOutputs,
      synthesis: '',
      status: 'failed',
      error: errorMessage,
    };
  }
}

// ─── Histórico de execuções ───────────────────────────────────────────────────

/**
 * Busca histórico de BrainRuns de um notebook com seus nós.
 */
export async function getBrainRunHistory(notebookId: string, limit = 5) {
  return prisma.brainRun.findMany({
    where: { notebookId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      nodes: {
        orderBy: { order: 'asc' },
        select: { nodeType: true, content: true, order: true },
      },
    },
  });
}

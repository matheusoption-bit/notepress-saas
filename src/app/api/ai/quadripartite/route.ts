/**
 * POST /api/ai/quadripartite
 *
 * Notepress Debate Engine — 5 agentes de IA debatem em 3 rodadas progressivas.
 *
 * Este é o fluxo PARALELO de debate cruzado. Os 5 agentes analisam
 * simultaneamente e depois debatem entre si em 3 rodadas:
 *   Rodada 1: Análise independente
 *   Rodada 2: Debate cruzado (reagem às análises uns dos outros)
 *   Rodada 3: Síntese e convergência
 *
 * Stack (5 agentes — configuração centralizada em agent-factory.ts):
 *   GEMINI_SEARCH  → Auditor Web (busca em tempo real)
 *   GEMINI_CREATE  → Pesquisador Criativo (conexões interdisciplinares)
 *   DEEPSEEK       → Analista Quantitativo (viabilidade financeira)
 *   LLAMA          → Revisor Ultra-Rápido (identifica inconsisências)
 *   WATSONX_BR     → Compliance BR (LGPD, FINEP, Lei de Inovação)
 *
 * Nota: Para o fluxo SEQUENCIAL com 4 agentes, veja brain-orchestrator.ts.
 *
 * @see src/lib/ai/agent-factory.ts — Factory centralizada de agentes.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAgent, DEBATE_AGENTS, type AgentType } from '@/lib/ai/agent-factory';
import { DebateMode } from '@prisma/client';

// ─── Configuração do Next.js ──────────────────────────────────────────────────

export const maxDuration = 60; // segundos — aumentado para acomodar 5 agentes × 3 rodadas

// ─── System prompts por agente e por modo ────────────────────────────────────

function buildSystemPrompt(agent: AgentType, mode: DebateMode): string {
  const modeContext: Record<DebateMode, string> = {
    CONSENSUS:
      'Trabalhe em direção a um consenso com os demais agentes. Seja colaborativo.',
    DEVILS_ADVOCATE:
      'Questione premissas e assuma posições contrárias quando necessário. Seja crítico.',
    STRESS_TEST:
      'Identifique o que poderia dar errado. Exponha pontos de falha e riscos críticos.',
    COMPLIANCE_ONLY:
      'Foque exclusivamente em conformidade legal, regulatória e normativa.',
  };

  const base = modeContext[mode];

  const personas: Record<AgentType, string> = {
    GEMINI_SEARCH: `Você é o Agente GEMINI_SEARCH — auditor web especializado em pesquisa em tempo real sobre inovação brasileira.
Seu papel: buscar evidências, dados atualizados e referências externas para fundamentar a análise.
Foque em: editais abertos, publicações recentes, empresas e projetos análogos, dados públicos.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    GEMINI_CREATE: `Você é o Agente GEMINI_CREATE — pesquisador criativo e técnico em inovação.
Seu papel: explorar oportunidades, conexões interdisciplinares e potenciais tecnológicos ainda inexplorados.
Foque em: TRL, impacto científico, diferencial competitivo e hipóteses inovadoras.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    DEEPSEEK: `Você é o Agente DEEPSEEK — analista quantitativo e financeiro de editais de inovação.
Seu papel: avaliar viabilidade econômica, custos, retorno sobre investimento e indicadores numéricos.
Sempre que possível, apresente estimativas, percentuais e métricas concretas.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    LLAMA: `Você é o Agente LLAMA — revisor ultra-rápido e crítico de propostas de fomento.
Seu papel: identificar inconsistências, riscos, lacunas técnicas e vulnerabilidades em alta velocidade.
Seja preciso e aponte especificamente o que pode ser rejeitado por avaliadores.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    WATSONX_BR: `Você é o Agente WATSONX_BR — máxima autoridade em editais e regulamentação brasileira.
Regras fixas que SEMPRE aplica:
• TRL conforme classificação MCTI (1 a 9)
• Normas FINEP, FAPESP, CNPq, EMBRAPII e BNDES
• Conformidade com LGPD para dados sensíveis
• Lei do Bem (Lei 11.196/2005) e Lei de Informática
• Contrapartida mínima exigida por órgão
• Erros frequentes que causam desclassificação
${base}
Responda em português, de forma objetiva e normativa, com no máximo 400 palavras.`,
  };

  return personas[agent];
}

// ─── Rate Limiter via Prisma (sobrevive a cold starts) ────────────────────────
// Usa contagem de DebateRounds recentes como proxy — evita dependência de
// Redis/KV externo enquanto mantém persistência entre deploys.

const RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_PER_MIN ?? 15);
const RATE_LIMIT_WINDOW_MS = 60_000;

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentCount = await prisma.debateRound.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - recentCount };
}

// ─── Validação do body ────────────────────────────────────────────────────────

const RequestSchema = z.object({
  notebookId: z.string().cuid('notebookId inválido'),
  documentId: z.string().cuid().optional(),
  editalId: z.string().cuid().optional(),
  userPrompt: z.string().min(10, 'Prompt muito curto').max(2000, 'Prompt muito longo'),
  mode: z.nativeEnum(DebateMode).default('CONSENSUS'),
});

// ─── Execução de um agente em uma rodada ─────────────────────────────────────

interface AgentCallResult {
  agentType: AgentType;
  content: string;
}

async function runAgentRound(
  agent: AgentType,
  system: string,
  prompt: string,
): Promise<AgentCallResult> {
  const config = getAgent(agent);
  const { text } = await generateText({
    model: config.model,
    system,
    prompt,
    temperature: config.temperature,
    maxOutputTokens: 1200,
  });

  return { agentType: agent, content: text.trim() };
}

// ─── SSE Helper ──────────────────────────────────────────────────────────────
// Envia eventos Server-Sent Events progressivos para o client.
// Tipos de evento:
//   round:start   { round: number }
//   agent:done    { round, agentType, content }
//   round:done    { round, messages[] }
//   consensus     { consensus, confidence, mermaidCode }
//   done          { roundId, meta }
//   error         { message }

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Autenticação via Clerk ─────────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // Resolve userId interno (Prisma) a partir do clerkId
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado no banco de dados.' },
      { status: 404 }
    );
  }

  const userId = user.id;

  // 2. Rate limiting ──────────────────────────────────────────────────────────
  const { allowed, remaining } = await checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Limite de requisições atingido. Aguarde 1 minuto.',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 3. Validação do body ──────────────────────────────────────────────────────
  let body: z.infer<typeof RequestSchema>;
  try {
    const raw = await req.json();
    body = RequestSchema.parse(raw);
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : 'Body inválido.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { notebookId, userPrompt, mode } = body;

  // Verifica se o notebook pertence ao usuário
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId },
    select: { id: true, title: true },
  });

  if (!notebook) {
    return NextResponse.json(
      { error: 'Notebook não encontrado ou sem permissão.' },
      { status: 403 }
    );
  }

  // 4. Cria o DebateRound no banco ────────────────────────────────────────────
  const debateRound = await prisma.debateRound.create({
    data: {
      notebookId,
      userId,
      mode,
      title: `Debate: ${userPrompt.slice(0, 80)}${userPrompt.length > 80 ? '...' : ''}`,
    },
  });

  const agents: AgentType[] = DEBATE_AGENTS;

  // System prompts (estáticos por rodada neste modo)
  const systemPrompts = Object.fromEntries(
    agents.map((a) => [a, buildSystemPrompt(a, mode)])
  ) as Record<AgentType, string>;

  // ─── SSE Stream ────────────────────────────────────────────────────────────
  // Envia eventos progressivos conforme os agentes completam cada rodada.
  // O client pode renderizar avatares "digitando" e resultados incrementais.

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      try {
        // ── Função auxiliar para rodar uma rodada com SSE ────────────────────
        async function runRound(
          round: number,
          prompt: string | ((agent: AgentType) => string),
        ): Promise<{ agentType: AgentType; content: string }[]> {
          send('round:start', { round, agents });

          const results = await Promise.allSettled(
            agents.map(async (agent) => {
              const p = typeof prompt === 'function' ? prompt(agent) : prompt;
              const result = await runAgentRound(agent, systemPrompts[agent], p);
              send('agent:done', { round, agentType: agent, content: result.content });
              return result;
            })
          );

          const messages: { agentType: AgentType; content: string }[] = [];
          await Promise.all(
            results.map(async (result, i) => {
              const agentType = agents[i];
              const content =
                result.status === 'fulfilled'
                  ? result.value.content
                  : `[Agente indisponível: ${(result as PromiseRejectedResult).reason?.message ?? 'erro desconhecido'}]`;

              messages.push({ agentType, content });

              await prisma.debateMessage.create({
                data: { debateRoundId: debateRound.id, agentType, content, round },
              });
            })
          );

          send('round:done', { round, messages });
          return messages;
        }

        // ── RODADA 1: Análise independente ────────────────────────────────────
        const round1Messages = await runRound(
          1,
          `TAREFA: Analise a seguinte proposta/pergunta e forneça sua avaliação inicial.\n\n` +
          `PROPOSTA:\n${userPrompt}\n\n` +
          `Dê sua perspectiva única de acordo com seu papel.`,
        );

        // ── RODADA 2: Debate cruzado ──────────────────────────────────────────
        const round1Context = round1Messages
          .map((m) => `### ${m.agentType}\n${m.content}`)
          .join('\n\n---\n\n');

        const round2Messages = await runRound(
          2,
          `RODADA 2 — DEBATE CRUZADO\n\n` +
          `PROPOSTA ORIGINAL:\n${userPrompt}\n\n` +
          `ANÁLISES DA RODADA 1:\n${round1Context}\n\n` +
          `Responda às análises dos outros agentes. Concorde, discorde ou complemente ` +
          `com base no seu papel específico. Identifique lacunas e pontos de conflito.`,
        );

        // ── RODADA 3: Síntese e convergência ──────────────────────────────────
        const round2Context = round2Messages
          .map((m) => `### ${m.agentType}\n${m.content}`)
          .join('\n\n---\n\n');

        const round3Messages = await runRound(
          3,
          `RODADA 3 — SÍNTESE FINAL\n\n` +
          `PROPOSTA ORIGINAL:\n${userPrompt}\n\n` +
          `DEBATE ACUMULADO (Rodadas 1 e 2):\n${round1Context}\n\n---\n\n${round2Context}\n\n` +
          `Com base em todo o debate, forneça sua posição final consolidada. ` +
          `Apresente os 3 pontos mais críticos e 2 recomendações concretas de acordo com seu papel.`,
        );

        // ── CONSENSO FINAL ────────────────────────────────────────────────────
        const round3Context = round3Messages
          .map((m) => `### ${m.agentType}\n${m.content}`)
          .join('\n\n---\n\n');

        const llamaConfig = getAgent('LLAMA');
        let consensus = '';
        try {
          const { text } = await generateText({
            model: llamaConfig.model,
            system:
              'Você é um sintetizador de debates multidisciplinares. ' +
              'Crie um CONSENSO FINAL em português: resumo executivo com os pontos de acordo, ' +
              'pontos de conflito, e as 3 ações mais recomendadas pelo painel de agentes. ' +
              'Seja objetivo, estruturado e direto. Máximo de 300 palavras.',
            prompt:
              `PROPOSTA ANALISADA:\n${userPrompt}\n\n` +
              `POSIÇÕES FINAIS DOS AGENTES (Rodada 3):\n${round3Context}`,
            temperature: 0.4,
            maxOutputTokens: 600,
          });
          consensus = text.trim();
        } catch (err) {
          console.error('[quadripartite] Falha na geração do consenso:', err);
          consensus = round3Messages
            .map((m) => `**${m.agentType}:** ${m.content.slice(0, 150)}...`)
            .join('\n\n');
        }

        // ── Geração opcional de diagrama Mermaid ──────────────────────────────
        const MERMAID_KEYWORDS = [
          'fluxo', 'cronograma', 'diagrama', 'gantt',
          'arquitetura', 'fluxograma', 'sequência', 'sequencia',
          'processo', 'pipeline',
        ];

        const promptLower = userPrompt.toLowerCase();
        const needsMermaid =
          MERMAID_KEYWORDS.some((kw) => promptLower.includes(kw)) &&
          !consensus.includes('```mermaid');

        let mermaidCode: string | null = null;

        if (needsMermaid) {
          try {
            const geminiConfig = getAgent('GEMINI_CREATE');
            const { text: mermaidRaw } = await generateText({
              model: geminiConfig.model,
              system:
                'Você é um especialista em diagramas Mermaid.js. ' +
                'Responda APENAS com um único bloco de código mermaid válido, sem texto adicional, ' +
                'sem explicações, sem markdown além do próprio bloco. ' +
                'Use flowchart TD ou gantt conforme o contexto. ' +
                'O diagrama deve ter no máximo 20 nós/itens para manter a legibilidade. ' +
                'Escreva labels em português.',
              prompt:
                `Com base no seguinte consenso de análise, gere um diagrama Mermaid (flowchart ou gantt) ` +
                `que visualize o processo, arquitetura ou cronograma principal discutido:\n\n${consensus}`,
              temperature: 0.3,
              maxOutputTokens: 800,
            });

            const match = mermaidRaw.match(/```mermaid\s*([\s\S]*?)```/i);
            if (match) {
              mermaidCode = match[1].trim();
              consensus = `${consensus}\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
            }
          } catch (err) {
            console.warn('[quadripartite] Falha na geração do diagrama Mermaid:', err);
          }
        }

        // ── Calcula confiança ─────────────────────────────────────────────────
        const allResults = [
          ...round1Messages, ...round2Messages, ...round3Messages,
        ];
        const fulfilledCount = allResults.filter(
          (m) => !m.content.startsWith('[Agente indisponível'),
        ).length;
        const total = allResults.length;

        let base = fulfilledCount / total;
        const modePenalty: Record<DebateMode, number> = {
          CONSENSUS: 0,
          DEVILS_ADVOCATE: -0.1,
          STRESS_TEST: -0.15,
          COMPLIANCE_ONLY: -0.05,
        };
        const confidence = Math.max(0, Math.min(1, base + modePenalty[mode]));
        const confidenceRounded = Math.round(confidence * 100) / 100;

        // ── Evento final com payload completo ─────────────────────────────────
        send('consensus', {
          consensus,
          confidence: confidenceRounded,
          mermaidCode,
        });

        send('done', {
          roundId: debateRound.id,
          consensus,
          confidence: confidenceRounded,
          mermaidCode,
          mode,
          rounds: {
            1: round1Messages,
            2: round2Messages,
            3: round3Messages,
          },
          meta: {
            agents: ['GEMINI_SEARCH', 'GEMINI_CREATE', 'DEEPSEEK', 'LLAMA', 'WATSONX_BR'],
            stack: 'Google Gemini + DeepSeek + Groq/Llama + IBM WatsonX',
            rateLimitRemaining: remaining - 1,
            mermaidGenerated: mermaidCode !== null,
          },
        });
      } catch (err) {
        send('error', {
          message: err instanceof Error ? err.message : 'Erro interno no debate.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
      'X-RateLimit-Remaining': String(Math.max(0, remaining - 1)),
    },
  });
}

/**
 * POST /api/ai/quadripartite
 *
 * Cérebro Quadripartite — 4 agentes de IA debatem em 3 rodadas progressivas.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  MODO DESENVOLVIMENTO — todos os agentes usam Perplexity Sonar  │
 * │  $10/mês ≈ 500–700 debates completos (12 chamadas × ~15k tokens)│
 * │  Rate limit Perplexity: 20 req/min                              │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * PRODUÇÃO: substituir providers por:
 *   GEMINI       → google('gemini-2.0-flash-exp')
 *   CLAUDE       → anthropic('claude-3-7-sonnet-20250219')
 *   GPT          → openai('gpt-4o')
 *   ESPECIALISTA_BR → openai('gpt-4o-mini')
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DebateMode, AgentType } from '@prisma/client';

// ─── Configuração do Next.js ──────────────────────────────────────────────────

export const maxDuration = 45; // segundos — timeout da rota

// ─── Provider Perplexity (modo DEV) ──────────────────────────────────────────

const perplexity = createOpenAI({
  name: 'perplexity',
  apiKey: process.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai',
});

// PRODUÇÃO: substituir cada entrada pelo provider real do agente
const DEV_MODEL = 'llama-3.1-sonar-small-128k-online' as const;

const AGENT_MODELS = {
  GEMINI: perplexity(DEV_MODEL),        // PROD: google('gemini-2.0-flash-exp')
  CLAUDE: perplexity(DEV_MODEL),        // PROD: anthropic('claude-3-7-sonnet-20250219')
  GPT: perplexity(DEV_MODEL),           // PROD: openai('gpt-4o')
  ESPECIALISTA_BR: perplexity(DEV_MODEL), // PROD: openai('gpt-4o-mini')
} as const;

// Temperaturas diferentes por agente (personalidade)
const AGENT_TEMPERATURES: Record<AgentType, number> = {
  GEMINI: 0.7,         // criativo, exploratório
  CLAUDE: 0.3,         // rigoroso, auditor
  GPT: 0.5,            // equilibrado, quantitativo
  ESPECIALISTA_BR: 0.2, // determinístico, normativo
};

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
    GEMINI: `Você é o Agente GEMINI — pesquisador criativo e técnico em inovação brasileira.
Seu papel: explorar oportunidades, conexões interdisciplinares e potenciais tecnológicos.
Foque em TRL, impacto científico e diferencial competitivo.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    CLAUDE: `Você é o Agente CLAUDE — auditor rigoroso de propostas de fomento à inovação.
Seu papel: identificar inconsistências, riscos, lacunas técnicas e vulnerabilidades da proposta.
Seja preciso e aponte especificamente o que está faltando ou pode ser rejeitado por avaliadores.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    GPT: `Você é o Agente GPT — analista quantitativo e financeiro de editais de inovação.
Seu papel: avaliar viabilidade econômica, custos, retorno sobre investimento e indicadores numéricos.
Sempre que possível, apresente estimativas, percentuais e métricas concretas.
${base}
Responda em português, de forma estruturada, com no máximo 400 palavras.`,

    ESPECIALISTA_BR: `Você é o Agente Especialista BR — máxima autoridade em editais e regulamentação brasileira.
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

// ─── Rate Limiter em memória ──────────────────────────────────────────────────

const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  rateLimitStore.set(userId, timestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX - timestamps.length };
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
  const { text } = await generateText({
    model: AGENT_MODELS[agent],
    system,
    prompt,
    temperature: AGENT_TEMPERATURES[agent],
    maxOutputTokens: 1200,
  });

  return { agentType: agent, content: text.trim() };
}

// ─── Cálculo de confiança do consenso ────────────────────────────────────────

function calculateConfidence(
  settledResults: PromiseSettledResult<AgentCallResult>[],
  mode: DebateMode,
): number {
  const fulfilled = settledResults.filter((r) => r.status === 'fulfilled').length;
  const total = settledResults.length;

  // Base: proporção de agentes que responderam com sucesso
  let base = fulfilled / total;

  // Penalidade por modo adversarial (menos consenso esperado)
  const modePenalty: Record<DebateMode, number> = {
    CONSENSUS: 0,
    DEVILS_ADVOCATE: -0.1,
    STRESS_TEST: -0.15,
    COMPLIANCE_ONLY: -0.05,
  };

  const confidence = Math.max(0, Math.min(1, base + modePenalty[mode]));
  return Math.round(confidence * 100) / 100;
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
  const { allowed, remaining } = checkRateLimit(userId);
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

  const agents: AgentType[] = ['GEMINI', 'CLAUDE', 'GPT', 'ESPECIALISTA_BR'];

  // System prompts (estáticos por rodada neste modo)
  const systemPrompts = Object.fromEntries(
    agents.map((a) => [a, buildSystemPrompt(a, mode)])
  ) as Record<AgentType, string>;

  // ─── RODADA 1: Análise independente ────────────────────────────────────────
  const round1Prompt =
    `TAREFA: Analise a seguinte proposta/pergunta e forneça sua avaliação inicial.\n\n` +
    `PROPOSTA:\n${userPrompt}\n\n` +
    `Dê sua perspectiva única de acordo com seu papel.`;

  const round1Results = await Promise.allSettled(
    agents.map((agent) => runAgentRound(agent, systemPrompts[agent], round1Prompt))
  );

  // Persiste mensagens da Rodada 1
  const round1Messages: { agentType: AgentType; content: string }[] = [];
  await Promise.all(
    round1Results.map(async (result, i) => {
      const agentType = agents[i];
      const content =
        result.status === 'fulfilled'
          ? result.value.content
          : `[Agente indisponível: ${result.reason?.message ?? 'erro desconhecido'}]`;

      round1Messages.push({ agentType, content });

      await prisma.debateMessage.create({
        data: { debateRoundId: debateRound.id, agentType, content, round: 1 },
      });
    })
  );

  // ─── RODADA 2: Debate cruzado ───────────────────────────────────────────────
  const round1Context = round1Messages
    .map((m) => `### ${m.agentType}\n${m.content}`)
    .join('\n\n---\n\n');

  const round2Results = await Promise.allSettled(
    agents.map((agent) =>
      runAgentRound(
        agent,
        systemPrompts[agent],
        `RODADA 2 — DEBATE CRUZADO\n\n` +
        `PROPOSTA ORIGINAL:\n${userPrompt}\n\n` +
        `ANÁLISES DA RODADA 1:\n${round1Context}\n\n` +
        `Responda às análises dos outros agentes. Concorde, discorde ou complemente ` +
        `com base no seu papel específico. Identifique lacunas e pontos de conflito.`
      )
    )
  );

  // Persiste mensagens da Rodada 2
  const round2Messages: { agentType: AgentType; content: string }[] = [];
  await Promise.all(
    round2Results.map(async (result, i) => {
      const agentType = agents[i];
      const content =
        result.status === 'fulfilled'
          ? result.value.content
          : `[Agente indisponível: ${result.reason?.message ?? 'erro desconhecido'}]`;

      round2Messages.push({ agentType, content });

      await prisma.debateMessage.create({
        data: { debateRoundId: debateRound.id, agentType, content, round: 2 },
      });
    })
  );

  // ─── RODADA 3: Síntese e convergência ──────────────────────────────────────
  const round2Context = round2Messages
    .map((m) => `### ${m.agentType}\n${m.content}`)
    .join('\n\n---\n\n');

  const round3Results = await Promise.allSettled(
    agents.map((agent) =>
      runAgentRound(
        agent,
        systemPrompts[agent],
        `RODADA 3 — SÍNTESE FINAL\n\n` +
        `PROPOSTA ORIGINAL:\n${userPrompt}\n\n` +
        `DEBATE ACUMULADO (Rodadas 1 e 2):\n${round1Context}\n\n---\n\n${round2Context}\n\n` +
        `Com base em todo o debate, forneça sua posição final consolidada. ` +
        `Apresente os 3 pontos mais críticos e 2 recomendações concretas de acordo com seu papel.`
      )
    )
  );

  // Persiste mensagens da Rodada 3
  const round3Messages: { agentType: AgentType; content: string }[] = [];
  await Promise.all(
    round3Results.map(async (result, i) => {
      const agentType = agents[i];
      const content =
        result.status === 'fulfilled'
          ? result.value.content
          : `[Agente indisponível: ${result.reason?.message ?? 'erro desconhecido'}]`;

      round3Messages.push({ agentType, content });

      await prisma.debateMessage.create({
        data: { debateRoundId: debateRound.id, agentType, content, round: 3 },
      });
    })
  );

  // ─── CONSENSO FINAL ────────────────────────────────────────────────────────
  const round3Context = round3Messages
    .map((m) => `### ${m.agentType}\n${m.content}`)
    .join('\n\n---\n\n');

  // Usa o modelo mais econômico para gerar o consenso
  let consensus = '';
  try {
    const { text } = await generateText({
      model: perplexity(DEV_MODEL),
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

  // ─── Calcula confiança ─────────────────────────────────────────────────────
  const allRoundResults = [...round1Results, ...round2Results, ...round3Results];
  const confidence = calculateConfidence(allRoundResults, mode);

  // ─── Resposta ──────────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      roundId: debateRound.id,
      consensus,
      confidence,
      mode,
      rounds: {
        1: round1Messages,
        2: round2Messages,
        3: round3Messages,
      },
      meta: {
        model: DEV_MODEL,
        environment: 'development',
        rateLimitRemaining: remaining - 1,
        note: 'Em produção, cada agente usará seu provider próprio (Gemini, Claude, GPT, OpenAI).',
      },
    },
    {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(Math.max(0, remaining - 1)),
      },
    }
  );
}

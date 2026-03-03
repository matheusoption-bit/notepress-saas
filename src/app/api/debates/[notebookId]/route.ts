// src/app/api/debates/[notebookId]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DebateMode } from '@prisma/client';

type RouteContext = { params: Promise<{ notebookId: string }> };

// ── Configurações do debate ─────────────────────────────────────────────────
const TOTAL_AGENTS = 5;

/**
 * Recalcula a confiança do consenso com base nas mensagens persistidas na
 * Rodada 3 e no modo de debate — mesma fórmula da rota quadripartite.
 */
function deriveConfidence(round3Count: number, mode: DebateMode): number {
  const base = round3Count / TOTAL_AGENTS;

  const modePenalty: Record<DebateMode, number> = {
    CONSENSUS:        0,
    DEVILS_ADVOCATE: -0.1,
    STRESS_TEST:     -0.15,
    COMPLIANCE_ONLY: -0.05,
  };

  const raw = Math.max(0, Math.min(1, base + modePenalty[mode]));
  return Math.round(raw * 100);
}

/**
 * Gera um resumo do consenso a partir das posições finais (rodada 3).
 * Cada agente contribui com os primeiros 240 caracteres de sua análise.
 */
function deriveConsensusSummary(
  round3Messages: { agentType: string; content: string }[],
  title: string | null,
): string {
  if (round3Messages.length === 0) {
    return title ?? 'Debate sem mensagens de síntese.';
  }

  const excerpts = round3Messages.map(
    (m) => `[${m.agentType}] ${m.content.slice(0, 240).trimEnd()}${m.content.length > 240 ? '…' : ''}`,
  );

  return excerpts.join('\n\n');
}

// ── Tipo local derivado da query Prisma ─────────────────────────────────────
type DebateMsg = {
  id: string;
  agentType: string;
  content: string;
  round: number;
  createdAt: Date;
};

type RawDebate = {
  id: string;
  createdAt: Date;
  mode: DebateMode;
  title: string | null;
  messages: DebateMsg[];
};

/**
 * GET /api/debates/[notebookId]
 *
 * Retorna todos os DebateRound do notebook, ordenados do mais recente
 * para o mais antigo, enriquecidos com `confidence`, `prompt` e
 * `consensusSummary` derivados das mensagens persistidas.
 *
 * Requer autenticação via Clerk e que o notebook pertença ao usuário.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    // ── 1. Autenticação ──────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      );
    }

    // ── 2. Resolve parâmetro dinâmico ────────────────────────────────────
    const { notebookId } = await params;

    // ── 3. Verifica propriedade do notebook ──────────────────────────────
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId: user.id },
      select: { id: true },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook não encontrado ou acesso negado.' },
        { status: 403 },
      );
    }

    // ── 4. Busca os debates com mensagens ───────────────────────────────
    const rawDebates: RawDebate[] = await prisma.debateRound.findMany({
      where: { notebookId },
      include: {
        messages: {
          orderBy: { round: 'asc' },
          select: {
            id:           true,
            agentType:    true,
            content:      true,
            round:        true,
            createdAt:    true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── 5. Enriquece com campos derivados ───────────────────────────────
    const debates = rawDebates.map((debate) => {
      const round3Messages = debate.messages.filter((m) => m.round === 3);
      const confidence = deriveConfidence(round3Messages.length, debate.mode);
      const consensusSummary = deriveConsensusSummary(round3Messages, debate.title);

      // O title é salvo como "Debate: <prompt truncado>" pela rota quadripartite.
      const prompt = debate.title?.replace(/^Debate:\s*/i, '') ?? '—';

      return {
        id:               debate.id,
        createdAt:        debate.createdAt,
        mode:             debate.mode,
        title:            debate.title,
        prompt,
        confidence,
        consensusSummary,
        messageCount:     debate.messages.length,
        messages:         debate.messages,
      };
    });

    return NextResponse.json({ debates });
  } catch (error) {
    console.error('[API /debates/:notebookId GET]', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

/**
 * POST /api/ai/innovation-validator
 *
 * Executa a validação de inovação com busca real de patentes se os tokens
 * Lens.org e/ou SerpApi estiverem configurados no perfil do usuário.
 *
 * Fluxo:
 *   1. Autenticação via Clerk
 *   2. Busca UserProfile no Prisma
 *   3. Decriptografa lensApiToken e serpApiKey (AES-256-GCM)
 *   4. Chama validateInnovation() com os tokens
 *   5. Retorna resultado para montar o InnovationValidatorNode no editor
 */

import { NextResponse }         from 'next/server';
import { auth }                 from '@clerk/nextjs/server';
import { prisma }               from '@/lib/prisma';
import { decrypt }              from '@/lib/encrypt';
import { validateInnovation }   from '@/lib/ai/innovation-validator';
import { buildRateLimitHeaders, checkAiRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60; // segundos — buscas externas podem ser lentas

// ─── Body esperado ────────────────────────────────────────────────────────────

interface RequestBody {
  /** Descrição da solução a ser validada */
  solutionDescription: string;
  /** Setor tecnológico (opcional) */
  sector?: string;
  /** ID do notebook onde o resultado será inserido */
  notebookId: string;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── 1. Autenticação ──────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const rate = checkAiRateLimit(`innovation-validator:${clerkId}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Limite de validações atingido. Aguarde alguns segundos.' },
      { status: 429, headers: buildRateLimitHeaders(rate) },
    );
  }

  // ── 2. Parse do body ──────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  const { solutionDescription, sector, notebookId } = body;

  if (!solutionDescription?.trim()) {
    return NextResponse.json(
      { error: 'Campo `solutionDescription` é obrigatório.' },
      { status: 400 },
    );
  }

  if (!notebookId?.trim()) {
    return NextResponse.json(
      { error: 'Campo `notebookId` é obrigatório.' },
      { status: 400 },
    );
  }

  // ── 3. Busca User + UserProfile no banco ──────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { clerkId },
    select: {
      id: true,
      profile: {
        select: {
          lensApiToken: true,
          serpApiKey:   true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  // ── 4. Decriptografa tokens (falha silenciosa por token) ──────────────────
  let lensToken: string | undefined;
  let serpKey:   string | undefined;

  if (user.profile?.lensApiToken) {
    try {
      lensToken = decrypt(user.profile.lensApiToken);
    } catch (err) {
      console.warn('[innovation-validator] Falha ao decriptografar lensApiToken:', err);
    }
  }

  if (user.profile?.serpApiKey) {
    try {
      serpKey = decrypt(user.profile.serpApiKey);
    } catch (err) {
      console.warn('[innovation-validator] Falha ao decriptografar serpApiKey:', err);
    }
  }

  // ── 5. Executa a validação ────────────────────────────────────────────────
  try {
    const output = await validateInnovation({
      solutionDescription,
      sector,
      notebookId,
      userId: user.id,
      lensToken,
      serpKey,
    });

    const { result, patentResults, validationId } = output;

    // Monta a resposta no formato esperado pelo InnovationValidatorNode
    return NextResponse.json({
      validationId,
      score:           result.score,
      level:           result.level,
      explanation:     result.explanation,
      recommendations: result.recomendacoes.join('\n'),
      patentResults,
      // Dados completos para uso externo
      veredicto:        result.veredicto,
      anterioridades:   result.anterioridades,
      fontesPesquisadas: result.fontesPesquisadas,
      sourcesUsed: {
        lens:    !!lensToken,
        serpApi: !!serpKey,
        ai:      true,
      },
    });
  } catch (err) {
    console.error('[innovation-validator] Erro na validação:', err);
    return NextResponse.json(
      {
        error: 'Erro interno ao validar inovação.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

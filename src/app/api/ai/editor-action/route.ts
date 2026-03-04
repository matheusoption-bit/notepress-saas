// src/app/api/ai/editor-action/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groqProvider, geminiProvider } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, checkAiRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/ai/editor-action
 *
 * Ações de IA sobre texto selecionado no LexicalEditor.
 *
 * Body: {
 *   action: 'improve' | 'validate' | 'risk';
 *   selectedText: string;
 *   editalId?: string;
 * }
 *
 * Response: { result: string; action: string }
 *
 * ┌──────────────┬──────────────────────┬────────────────────────────────────────┐
 * │ action       │ Modelo               │ Objetivo                               │
 * ├──────────────┼──────────────────────┼────────────────────────────────────────┤
 * │ improve      │ Groq / Llama 3.3 70B │ Reescreve com clareza + norma culta    │
 * │ validate     │ Gemini 2.5 Flash     │ Verifica aderência aos critérios edital│
 * │ risk         │ Gemini 2.5 Flash     │ Mapeia riscos jurídicos/técnicos       │
 * └──────────────┴──────────────────────┴────────────────────────────────────────┘
 */

type EditorAction = 'improve' | 'validate' | 'risk';

// ── Prompts de sistema ─────────────────────────────────────────
const SYSTEM_IMPROVE =
  'Você é um revisor de textos técnico-científicos especializado em propostas de inovação brasileiras. ' +
  'Reescreva o trecho a seguir com mais clareza, coesão e norma culta, ' +
  'preservando integralmente o conteúdo e o tom técnico originais. ' +
  'Retorne SOMENTE o texto reescrito — sem prefixos, rótulos, comentários ou aspas.';

function buildSystemValidate(criteriosBlock: string): string {
  return (
    'Você é um analista especializado em editais de fomento à inovação brasileiros (FINEP, CNPq, BNDES, FAPs). ' +
    'Avalie se o trecho a seguir está aderente aos critérios do edital de referência. ' +
    'Estruture sua resposta em três seções usando markdown:\n' +
    '**✅ Pontos de Convergência** — lista de aspectos alinhados\n' +
    '**⚠️ Lacunas Identificadas** — o que está ausente ou fraco\n' +
    '**💡 Sugestões de Melhoria** — ações concretas para fortalecer a proposta\n' +
    'Seja objetivo e use tópicos curtos.' +
    criteriosBlock
  );
}

const SYSTEM_RISK =
  'Você é um consultor sênior de gestão de riscos para projetos de C&T&I no Brasil, ' +
  'com expertise em legislação de inovação (Lei 10.973/2004, Lei 13.243/2016), LGPD, ' +
  'regulações FINEP, CNPq e normas de propriedade intelectual. ' +
  'Identifique e classifique os riscos presentes no trecho a seguir. ' +
  'Use o formato markdown:\n' +
  '**🔴 Risco Alto** | **🟡 Risco Médio** | **🟢 Risco Baixo**\n' +
  'Para cada risco: nome, descrição curta e mitigação sugerida. ' +
  'Seja direto e prático.';

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // ── Autenticação ──────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const rate = checkAiRateLimit(`editor-action:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Limite de uso de IA atingido. Aguarde alguns segundos.' },
        { status: 429, headers: buildRateLimitHeaders(rate) },
      );
    }

    // ── Payload ───────────────────────────────────────────────
    const body = (await req.json()) as {
      action?: unknown;
      selectedText?: unknown;
      editalId?: unknown;
    };

    const action = typeof body.action === 'string' ? (body.action as EditorAction) : null;
    if (!action || !['improve', 'validate', 'risk'].includes(action)) {
      return NextResponse.json(
        { error: 'Campo `action` inválido. Use: improve | validate | risk.' },
        { status: 400 },
      );
    }

    const selectedText =
      typeof body.selectedText === 'string' ? body.selectedText.trim() : '';
    if (!selectedText) {
      return NextResponse.json(
        { error: 'Campo `selectedText` é obrigatório.' },
        { status: 400 },
      );
    }

    // Limita entrada para evitar abusos
    const textInput = selectedText.slice(0, 4_000);

    const editalId =
      typeof body.editalId === 'string' && body.editalId.trim()
        ? body.editalId.trim()
        : null;

    // ── Critérios do edital (para validate) ──────────────────
    let criteriosBlock = '';
    if (editalId) {
      const edital = await prisma.edital.findUnique({
        where: { id: editalId },
        select: {
          nome: true,
          criteriosAvaliacao: true,
          resumo: true,
          temas: true,
        },
      });

      if (edital) {
        const criterios =
          edital.criteriosAvaliacao
            ? typeof edital.criteriosAvaliacao === 'string'
              ? edital.criteriosAvaliacao
              : JSON.stringify(edital.criteriosAvaliacao, null, 2)
            : null;

        const temas = edital.temas?.length ? edital.temas.join(', ') : null;

        criteriosBlock =
          `\n\n---\nEdital de referência: **${edital.nome ?? editalId}**` +
          (temas ? `\nTemas prioritários: ${temas}` : '') +
          (edital.resumo ? `\nResumo: ${edital.resumo}` : '') +
          (criterios ? `\nCritérios de Avaliação:\n${criterios}` : '') +
          '\n---';
      }
    }

    // ── Roteamento por ação ───────────────────────────────────
    let result: string;

    if (action === 'improve') {
      // Groq / Llama 3.3 70B — velocidade + qualidade suficiente para revisão
      const { text } = await generateText({
        model: groqProvider('llama-3.3-70b-versatile'),
        system: SYSTEM_IMPROVE,
        prompt: textInput,
        temperature: 0.35,
      });
      result = text.trim();
    } else if (action === 'validate') {
      // Gemini 2.5 Flash — análise de aderência com contexto do edital
      const { text } = await generateText({
        model: geminiProvider('gemini-2.5-flash'),
        system: buildSystemValidate(criteriosBlock),
        prompt: `Avalie o seguinte trecho da proposta:\n\n${textInput}`,
        temperature: 0.3,
      });
      result = text.trim();
    } else {
      // risk — Gemini 2.5 Flash — análise de riscos jurídicos/técnicos
      const { text } = await generateText({
        model: geminiProvider('gemini-2.5-flash'),
        system: SYSTEM_RISK,
        prompt: `Analise os riscos no seguinte trecho:\n\n${textInput}`,
        temperature: 0.3,
      });
      result = text.trim();
    }

    return NextResponse.json({ result, action });
  } catch (error) {
    console.error('[API /ai/editor-action]', error);
    return NextResponse.json(
      { error: 'Erro ao processar ação de IA.' },
      { status: 500 },
    );
  }
}

// src/app/api/ai/ghost-text/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groqProvider } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/ghost-text
 *
 * Autocompletar estilo Ghost Text para o LexicalEditor.
 * Usa Groq / Llama 3.3 70B — latência ~200 ms, ideal para autocomplete.
 *
 * Body: { context: string; editalId?: string }
 * Response: { suggestion: string }
 */
export async function POST(req: Request) {
  try {
    // ── Autenticação ──────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ── Payload ───────────────────────────────────────────────
    const body = (await req.json()) as { context?: unknown; editalId?: unknown };

    const context = typeof body.context === 'string' ? body.context.trim() : '';
    if (!context) {
      return NextResponse.json(
        { error: 'Campo `context` é obrigatório e não pode ser vazio.' },
        { status: 400 },
      );
    }

    const editalId =
      typeof body.editalId === 'string' && body.editalId.trim()
        ? body.editalId.trim()
        : null;

    // ── Critérios do edital (opcional) ───────────────────────
    let criteriosBlock = '';
    if (editalId) {
      const edital = await prisma.edital.findUnique({
        where: { id: editalId },
        select: { criteriosAvaliacao: true, nome: true },
      });

      if (edital?.criteriosAvaliacao) {
        const criterios =
          typeof edital.criteriosAvaliacao === 'string'
            ? edital.criteriosAvaliacao
            : JSON.stringify(edital.criteriosAvaliacao, null, 2);

        criteriosBlock = `\n\nEdital de referência: "${edital.nome ?? editalId}"\nCritérios de avaliação:\n${criterios}`;
      }
    }

    // ── System prompt ─────────────────────────────────────────
    const systemPrompt =
      'Continue o texto do pesquisador de forma natural, técnica e alinhada com editais de inovação brasileiros. ' +
      'Máximo 2 frases. Responda APENAS com a continuação — sem prefixos, aspas ou explicações.' +
      criteriosBlock;

    // ── Geração via Groq / Llama 3.3 70B ─────────────────────
    const { text } = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: context,
      maxTokens: 120,
      temperature: 0.4,
    });

    return NextResponse.json({ suggestion: text.trim() });
  } catch (error) {
    console.error('[API /ai/ghost-text]', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestão de texto.' },
      { status: 500 },
    );
  }
}

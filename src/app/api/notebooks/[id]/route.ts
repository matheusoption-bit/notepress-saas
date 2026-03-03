// src/app/api/notebooks/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/notebooks/:id
 * Retorna o Notebook com o Document associado (conteúdo Lexical em JSON).
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const notebook = await prisma.notebook.findUnique({
      where: { id },
      include: {
        document: true,
        sources: {
          orderBy: { uploadedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json(notebook);
  } catch (error) {
    console.error('[API /notebooks/:id GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/notebooks/:id
 * Salva/atualiza o conteúdo Lexical (campo `content: Json` do Document).
 *
 * Body esperado: { content: object | string }
 *   - `content` é o estado Lexical serializado (resultado de editorState.toJSON()).
 *   - Se recebido como string, será parseado para objeto antes de persistir.
 *
 * A operação usa upsert: cria o Document se ainda não existir para o Notebook.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Aceita tanto objeto quanto string JSON (compatível com onChange do Lexical)
    const rawContent: unknown = body.content;
    const content =
      typeof rawContent === 'string'
        ? (JSON.parse(rawContent) as object)
        : (rawContent as object);

    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: 'Campo `content` inválido ou ausente' },
        { status: 400 },
      );
    }

    // Verifica se o notebook existe
    const notebook = await prisma.notebook.findUnique({ where: { id } });
    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook não encontrado' },
        { status: 404 },
      );
    }

    // Upsert do Document (1:1 com Notebook)
    const document = await prisma.document.upsert({
      where: { notebookId: id },
      create: {
        notebookId: id,
        content,
        version: 1,
      },
      update: {
        content,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true, version: document.version });
  } catch (error) {
    console.error('[API /notebooks/:id PATCH]', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}

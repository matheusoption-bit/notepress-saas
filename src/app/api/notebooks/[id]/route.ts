// src/app/api/notebooks/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/notebooks/:id
 * Retorna o Notebook com o Document associado (conteúdo Lexical em JSON).
 * Requer autenticação via Clerk e que o notebook pertença ao usuário.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

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

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || notebook.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
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
 * Requer autenticação via Clerk e que o notebook pertença ao usuário.
 *
 * Body esperado: { content: string } — JSON serializado do estado Lexical
 *   (resultado de JSON.stringify(editorState.toJSON())).
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const rawContent: unknown = body.content;
    if (typeof rawContent !== 'string') {
      return NextResponse.json(
        { error: 'Campo `content` deve ser uma string JSON' },
        { status: 400 },
      );
    }

    const content = JSON.parse(rawContent) as object;

    // Verifica se o notebook existe e pertence ao usuário autenticado
    const notebook = await prisma.notebook.findUnique({ where: { id } });
    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook não encontrado' },
        { status: 404 },
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || notebook.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const document = await prisma.document.update({
      where: { notebookId: id },
      data: {
        content,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, version: document.version });
  } catch (error) {
    console.error('[API /notebooks/:id PATCH]', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}

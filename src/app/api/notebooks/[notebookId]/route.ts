// src/app/api/notebooks/[notebookId]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ notebookId: string }> };

// ── Helper: resolve auth + ownership em dois passos ──────────────────────────

async function resolveOwnership(clerkId: string, notebookId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) return { user: null, notebook: null };

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id },
    select: { id: true, userId: true },
  });

  return { user, notebook };
}

// ── GET /api/notebooks/[notebookId] ──────────────────────────────────────────

/**
 * Retorna o notebook com document.content completo (JSON Lexical),
 * sources e contadores de tarefas.
 * Requer autenticação via Clerk e que o notebook pertença ao usuário.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    // ── 1. Autenticação ──────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // ── 2. Resolve parâmetro dinâmico ────────────────────────────────────
    const { notebookId } = await params;

    // ── 3. Verifica propriedade ──────────────────────────────────────────
    const { user, notebook: owned } = await resolveOwnership(clerkId, notebookId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }
    if (!owned) {
      return NextResponse.json(
        { error: 'Notebook não encontrado ou acesso negado.' },
        { status: 403 },
      );
    }

    // ── 4. Busca dados completos ─────────────────────────────────────────
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      include: {
        document: true,
        sources: {
          orderBy: { uploadedAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(notebook);
  } catch (error) {
    console.error('[API /notebooks/[notebookId] GET]', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// ── PATCH /api/notebooks/[notebookId] ────────────────────────────────────────

/**
 * Atualiza `title` e/ou `document.content` (JSON Lexical serializado como string).
 * Ao atualizar o conteúdo, incrementa `document.version`.
 *
 * Body esperado (ao menos um campo obrigatório):
 *   { title?: string; content?: string }
 *   onde `content` é o resultado de JSON.stringify(editorState.toJSON()).
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    // ── 1. Autenticação ──────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // ── 2. Resolve parâmetro dinâmico ────────────────────────────────────
    const { notebookId } = await params;

    // ── 3. Verifica propriedade ──────────────────────────────────────────
    const { user, notebook: owned } = await resolveOwnership(clerkId, notebookId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }
    if (!owned) {
      return NextResponse.json(
        { error: 'Notebook não encontrado ou acesso negado.' },
        { status: 403 },
      );
    }

    // ── 4. Valida body ───────────────────────────────────────────────────
    const body = await req.json();
    const { title, content: rawContent } = body as {
      title?: unknown;
      content?: unknown;
    };

    const hasTitle = typeof title === 'string' && title.trim().length > 0;
    const hasContent = rawContent !== undefined;

    if (!hasTitle && !hasContent) {
      return NextResponse.json(
        { error: 'Informe ao menos `title` ou `content` para atualizar.' },
        { status: 400 },
      );
    }

    if (hasContent && typeof rawContent !== 'string') {
      return NextResponse.json(
        { error: 'Campo `content` deve ser uma string JSON.' },
        { status: 400 },
      );
    }

    // ── 5. Executa atualizações em transação ─────────────────────────────
    const [updatedNotebook, updatedDocument] = await prisma.$transaction(
      async (tx) => {
        const notebook = hasTitle
          ? await tx.notebook.update({
              where: { id: notebookId },
              data: { title: (title as string).trim() },
              select: { id: true, title: true, updatedAt: true },
            })
          : await tx.notebook.findUnique({
              where: { id: notebookId },
              select: { id: true, title: true, updatedAt: true },
            });

        const document = hasContent
          ? await tx.document.update({
              where: { notebookId },
              data: {
                content: JSON.parse(rawContent as string) as object,
                version: { increment: 1 },
              },
              select: { id: true, version: true, updatedAt: true },
            })
          : await tx.document.findUnique({
              where: { notebookId },
              select: { id: true, version: true, updatedAt: true },
            });

        return [notebook, document];
      },
    );

    return NextResponse.json({ notebook: updatedNotebook, document: updatedDocument });
  } catch (error) {
    console.error('[API /notebooks/[notebookId] PATCH]', error);
    return NextResponse.json({ error: 'Erro ao atualizar notebook.' }, { status: 500 });
  }
}

// ── DELETE /api/notebooks/[notebookId] ───────────────────────────────────────

/**
 * Hard delete do notebook e do document associado.
 * Remove em transação: document primeiro (FK), depois notebook.
 * Recursos relativos (sources, tasks, debateRounds, etc.) são removidos
 * em cascata conforme as relações do schema.
 *
 * Requer autenticação via Clerk e que o notebook pertença ao usuário.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    // ── 1. Autenticação ──────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // ── 2. Resolve parâmetro dinâmico ────────────────────────────────────
    const { notebookId } = await params;

    // ── 3. Verifica propriedade ──────────────────────────────────────────
    const { user, notebook: owned } = await resolveOwnership(clerkId, notebookId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }
    if (!owned) {
      return NextResponse.json(
        { error: 'Notebook não encontrado ou acesso negado.' },
        { status: 403 },
      );
    }

    // ── 4. Remove em transação ────────────────────────────────────────────
    // Modelos com onDelete: Cascade no schema (removidos automaticamente
    // ao excluir Notebook ou Document):
    //   DebateRound → DebateMessage, DocumentSnapshot, InnovationValidation,
    //   BrainRun → BrainNode, AgentMemory
    //
    // Modelos SEM cascade (precisam ser deletados manualmente):
    //   Document, SourceFile, Task
    await prisma.$transaction(async (tx) => {
      // 1. Document: elimina DocumentSnapshot via cascade (documentId FK)
      await tx.document.deleteMany({ where: { notebookId } });

      // 2. Demais sem cascade
      await tx.sourceFile.deleteMany({ where: { notebookId } });
      await tx.task.deleteMany({ where: { notebookId } });

      // 3. Notebook: dispara cascades restantes (DebateRound, InnovationValidation,
      //    BrainRun, AgentMemory, DocumentSnapshot remanescentes)
      await tx.notebook.delete({ where: { id: notebookId } });
    });

    return NextResponse.json({ success: true, deleted: notebookId });
  } catch (error) {
    console.error('[API /notebooks/[notebookId] DELETE]', error);
    return NextResponse.json({ error: 'Erro ao excluir notebook.' }, { status: 500 });
  }
}

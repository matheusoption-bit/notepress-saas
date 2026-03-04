// src/app/api/notebooks/route.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Garante que o registro User existe no Prisma para o clerkId autenticado.
 * Cria o usuário na primeira chamada (upsert), evitando dependência de webhook.
 */
async function ensureUser(clerkId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

  return prisma.user.upsert({
    where: { clerkId },
    update: { email, name, imageUrl: clerkUser.imageUrl ?? null },
    create: { clerkId, email, name, imageUrl: clerkUser.imageUrl ?? null },
  });
}

/**
 * GET /api/notebooks
 * Lista todos os notebooks do usuário autenticado via Clerk.
 * O campo `document` é retornado em versão resumida (sem o `content` completo).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await ensureUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const notebooks = await prisma.notebook.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        document: {
          select: {
            id: true,
            version: true,
            updatedAt: true,
            // `content` omitido intencionalmente para manter a resposta leve
          },
        },
        _count: {
          select: {
            sources: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(notebooks);
  } catch (error) {
    console.error('[API /notebooks GET]', error);
    return NextResponse.json({ error: 'Erro interno ao listar notebooks' }, { status: 500 });
  }
}

/**
 * POST /api/notebooks
 * Cria um novo notebook vinculado ao usuário autenticado.
 *
 * Body esperado: { title: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await ensureUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';

    if (!title) {
      return NextResponse.json(
        { error: 'O campo `title` é obrigatório e não pode estar vazio' },
        { status: 400 },
      );
    }

    const notebook = await prisma.notebook.create({
      data: {
        title,
        userId: user.id,
        document: {
          create: {
            content: {},
            version: 1,
          },
        },
      },
      include: {
        document: {
          select: {
            id: true,
            version: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(notebook, { status: 201 });
  } catch (error) {
    console.error('[API /notebooks POST]', error);
    return NextResponse.json({ error: 'Erro interno ao criar notebook' }, { status: 500 });
  }
}

// src/app/api/export/pdf/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { exportLexicalToPdf } from '@/lib/export-pdf';

/**
 * POST /api/export/pdf
 *
 * Gera e retorna o PDF de um notebook do usuário autenticado.
 *
 * Body : { notebookId: string }
 * Response: application/pdf (binário)
 *
 * Regras de acesso:
 *  - Requer autenticação via Clerk.
 *  - O notebook deve pertencer ao usuário.
 *  - O usuário deve ter assinatura ativa (plano Pro ou Team).
 *    Gratuito não tem exportação PDF conforme a tabela de planos.
 */
export async function POST(req: NextRequest) {
  // ── Autenticação ──────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // ── Payload ───────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const notebookId: string | undefined = body?.notebookId;

  if (!notebookId) {
    return NextResponse.json(
      { error: 'O campo notebookId é obrigatório' },
      { status: 400 },
    );
  }

  // ── Usuário no banco ──────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { plan: true, status: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado' },
      { status: 404 },
    );
  }

  // ── Verificação de plano (Pro ou Team para exportar PDF) ──────
  const activeSub = user.subscriptions[0];
  const hasPdfAccess =
    activeSub?.status === 'active' &&
    (activeSub.plan?.includes('pro') || activeSub.plan?.includes('team'));

  if (!hasPdfAccess) {
    return NextResponse.json(
      {
        error: 'Exportação PDF disponível apenas nos planos Pro e Team.',
        upgradeUrl: '/pricing',
      },
      { status: 403 },
    );
  }

  // ── Notebook + Document ───────────────────────────────────────
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id },
    select: {
      title: true,
      document: { select: { content: true } },
    },
  });

  if (!notebook) {
    return NextResponse.json(
      { error: 'Notebook não encontrado ou sem permissão de acesso' },
      { status: 404 },
    );
  }

  if (!notebook.document?.content) {
    return NextResponse.json(
      { error: 'O notebook ainda não possui conteúdo para exportar' },
      { status: 422 },
    );
  }

  // ── Geração do PDF ────────────────────────────────────────────
  let lexicalJson: string;
  try {
    // O Prisma retorna o campo Json já parsado; precisamos re-serializar
    // para string para que o lexicalJsonToHtml() possa fazer JSON.parse().
    lexicalJson = typeof notebook.document.content === 'string'
      ? notebook.document.content
      : JSON.stringify(notebook.document.content);
  } catch {
    return NextResponse.json(
      { error: 'Falha ao processar o conteúdo do documento' },
      { status: 500 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await exportLexicalToPdf(lexicalJson, notebook.title);
  } catch (err) {
    console.error('[PDF Export] Falha ao gerar PDF:', err);
    return NextResponse.json(
      { error: 'Falha ao gerar o PDF. Tente novamente em instantes.' },
      { status: 500 },
    );
  }

  // ── Resposta binária ──────────────────────────────────────────
  const safeTitle = notebook.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80);

  // NextResponse espera BodyInit; Uint8Array é universalmente aceito
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-store',
    },
  });
}

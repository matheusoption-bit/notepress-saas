// src/app/api/editais/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const edital = await prisma.edital.findUnique({
      where: { id },
    });

    if (!edital) {
      return NextResponse.json({ error: 'Edital não encontrado' }, { status: 404 });
    }

    return NextResponse.json(edital);
  } catch (error) {
    console.error('Erro ao buscar edital:', error);
    return NextResponse.json({ error: 'Erro interno ao carregar o edital' }, { status: 500 });
  }
}

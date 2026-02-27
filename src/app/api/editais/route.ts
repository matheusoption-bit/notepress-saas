// src/app/api/editais/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const editais = await prisma.edital.findMany({
      where: { status: 'aberto' },
      select: {
        id: true,
        nome: true,
        orgao: true,
        dataFechamento: true,
        valorMax: true,
        status: true,
      },
      orderBy: { dataFechamento: 'asc' },
    });

    return NextResponse.json(editais);
  } catch (error) {
    console.error('Erro ao buscar editais:', error);
    return NextResponse.json(
      { error: 'Erro interno ao carregar editais' },
      { status: 500 }
    );
  }
}


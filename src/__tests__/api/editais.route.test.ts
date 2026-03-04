// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    edital: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/editais/route';
import { prisma } from '@/lib/prisma';

describe('GET /api/editais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna a lista de editais com status 200', async () => {
    const mockEditais = [
      {
        id: 'edital-1',
        nome: 'Edital FINEP 2026',
        orgao: 'FINEP',
        dataFechamento: null,
        valorMax: 1000000,
        status: 'aberto',
      },
    ];

    vi.mocked(prisma.edital.findMany).mockResolvedValue(mockEditais as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockEditais);
    expect(prisma.edital.findMany).toHaveBeenCalledOnce();
  });
});

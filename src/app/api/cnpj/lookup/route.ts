import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  CnpjLookupError,
  CnpjLookupResult,
  lookupCnpjData,
} from '@/lib/cnpj-service';

export const runtime = 'nodejs';
type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

const requestSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ e obrigatorio.'),
});

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario nao autenticado.',
          },
        },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_USER_NOT_FOUND',
            message: 'Nao foi possivel identificar o usuario autenticado.',
          },
        },
        { status: 401 }
      );
    }

    const payload = await safeParseJson(request);
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Payload invalido. Envie o campo cnpj como string.',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const lookupResult = await lookupCnpjData(parsed.data.cnpj);
    const dbUser = await ensureDatabaseUser(clerkUser);

    const solution = await prisma.solution.create({
      data: {
        userId: dbUser.id,
        name: lookupResult.company.tradeName || lookupResult.company.officialName,
        description: buildSolutionDescription(lookupResult),
        trl: null,
        benefits: buildSolutionBenefits(lookupResult),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lookup: lookupResult,
        solution,
      },
    });
  } catch (error) {
    const mapped = mapLookupError(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: mapped.code,
          message: mapped.message,
          details: mapped.details,
        },
      },
      { status: mapped.status }
    );
  }
}

async function safeParseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new CnpjLookupError(
      'Body JSON invalido.',
      'INVALID_JSON_BODY',
      400
    );
  }
}

async function ensureDatabaseUser(clerkUser: ClerkUser) {
  const email = resolvePrimaryEmail(clerkUser);
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
    clerkUser?.username ||
    null;

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name,
      imageUrl: clerkUser?.imageUrl ?? null,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      imageUrl: clerkUser?.imageUrl ?? null,
    },
  });
}

function resolvePrimaryEmail(clerkUser: ClerkUser): string {
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    throw new CnpjLookupError(
      'Usuario autenticado sem e-mail valido no Clerk.',
      'AUTH_EMAIL_MISSING',
      400
    );
  }

  return email;
}

function buildSolutionDescription(lookup: CnpjLookupResult): string {
  const company = lookup.company;
  const address = [
    company.address.street,
    company.address.number,
    company.address.complement,
    company.address.district,
    company.address.city,
    company.address.state,
  ]
    .filter(Boolean)
    .join(', ');

  const lines = [
    lookup.scraping.about ?? '',
    `Razao social: ${company.officialName}`,
    company.tradeName ? `Nome fantasia: ${company.tradeName}` : '',
    company.registrationStatus ? `Situacao cadastral: ${company.registrationStatus}` : '',
    company.primaryCnae?.description ? `CNAE principal: ${company.primaryCnae.description}` : '',
    address ? `Endereco: ${address}` : '',
    lookup.website.url ? `Site oficial: ${lookup.website.url}` : '',
  ].filter(Boolean);

  return lines.join('\n').slice(0, 4000);
}

function buildSolutionBenefits(lookup: CnpjLookupResult): string[] {
  const fromServices = lookup.scraping.services;
  const fromCnae = lookup.company.secondaryCnaes
    .map((cnae) => cnae.description)
    .filter((value): value is string => Boolean(value));

  const merged = [...fromServices, ...fromCnae];

  return [...new Set(merged.map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function mapLookupError(error: unknown): CnpjLookupError {
  if (error instanceof CnpjLookupError) {
    return error;
  }

  console.error('Erro interno no CNPJ lookup:', error);
  return new CnpjLookupError(
    'Erro interno ao importar dados por CNPJ.',
    'INTERNAL_ERROR',
    500
  );
}

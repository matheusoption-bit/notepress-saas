/**
 * PATCH /api/user/profile
 *
 * Atualiza campos do UserProfile do usuário autenticado.
 * Campos de token (lensApiToken, serpApiKey) são criptografados com
 * AES-256-GCM antes de persistir no banco via Prisma.
 *
 * Body aceito (todos opcionais):
 *   {
 *     companyType?:     string
 *     preferredThemes?: string[]
 *     trlInterest?:     number
 *     writingProfile?:  WritingProfile
 *     lensApiToken?:    string   ← armazenado criptografado
 *     serpApiKey?:      string   ← armazenado criptografado
 *   }
 *
 * Resposta 200:
 *   { profile: { id, userId, companyType, writingProfile, ... } }
 *   (tokens omitidos da resposta por segurança)
 */

import { NextResponse }   from 'next/server';
import { auth }           from '@clerk/nextjs/server';
import { prisma }         from '@/lib/prisma';
import { encrypt }        from '@/lib/encrypt';
import { WritingProfile } from '@prisma/client';

// ─── Campos que devem ser criptografados antes de persistir ──────────────────
const ENCRYPTED_FIELDS = new Set(['lensApiToken', 'serpApiKey'] as const);
type EncryptedField = typeof ENCRYPTED_FIELDS extends Set<infer T> ? T : never;

// ─── Campos permitidos do UserProfile ────────────────────────────────────────
type AllowedField =
  | 'companyType'
  | 'preferredThemes'
  | 'trlInterest'
  | 'writingProfile'
  | EncryptedField;

const ALLOWED_FIELDS: Set<AllowedField> = new Set([
  'companyType',
  'preferredThemes',
  'trlInterest',
  'writingProfile',
  'lensApiToken',
  'serpApiKey',
]);

// ─── Handler PATCH ────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  // ── 1. Autenticação ──────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── 2. Parse do body ──────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body deve ser um objeto JSON.' }, { status: 400 });
  }

  // ── 3. Filtra e valida campos permitidos ──────────────────────────────────
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(key as AllowedField)) continue;

    // Validações por campo
    if (key === 'trlInterest') {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 9) {
        return NextResponse.json(
          { error: `trlInterest deve ser um inteiro entre 1 e 9.` },
          { status: 422 },
        );
      }
      data[key] = value;
      continue;
    }

    if (key === 'writingProfile') {
      const validProfiles = Object.values(WritingProfile);
      if (!validProfiles.includes(value as WritingProfile)) {
        return NextResponse.json(
          { error: `writingProfile inválido. Valores aceitos: ${validProfiles.join(', ')}` },
          { status: 422 },
        );
      }
      data[key] = value;
      continue;
    }

    if (key === 'preferredThemes') {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
        return NextResponse.json(
          { error: 'preferredThemes deve ser um array de strings.' },
          { status: 422 },
        );
      }
      data[key] = value;
      continue;
    }

    // Campos de token: validação + criptografia
    if (ENCRYPTED_FIELDS.has(key as EncryptedField)) {
      if (value === null || value === '') {
        // Permitir limpar o token
        data[key] = null;
        continue;
      }
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: `${key} deve ser uma string.` },
          { status: 422 },
        );
      }
      try {
        data[key] = encrypt(value.trim());
      } catch (err) {
        console.error(`[profile PATCH] Falha ao criptografar ${key}:`, err);
        return NextResponse.json(
          { error: 'Erro interno ao criptografar o token. Verifique ENCRYPTION_KEY.' },
          { status: 500 },
        );
      }
      continue;
    }

    // companyType e outros campos string genéricos
    if (typeof value !== 'string') {
      return NextResponse.json(
        { error: `${key} deve ser uma string.` },
        { status: 422 },
      );
    }
    data[key] = value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'Nenhum campo válido fornecido para atualização.' },
      { status: 400 },
    );
  }

  // ── 4. Busca ID interno do usuário ────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { clerkId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  // ── 5. Upsert do UserProfile ──────────────────────────────────────────────
  try {
    const profile = await prisma.userProfile.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      select: {
        id:              true,
        userId:          true,
        companyType:     true,
        preferredThemes: true,
        trlInterest:     true,
        writingProfile:  true,
        // Tokens omitidos da resposta — apenas confirma presença
        lensApiToken:    true,
        serpApiKey:      true,
      },
    });

    return NextResponse.json({
      profile: {
        ...profile,
        // Substitui o valor criptografado por boolean indicando se está configurado
        lensApiToken: profile.lensApiToken ? true : false,
        serpApiKey:   profile.serpApiKey   ? true : false,
      },
    });
  } catch (err) {
    console.error('[profile PATCH] Erro no upsert:', err);
    return NextResponse.json(
      { error: 'Erro ao salvar perfil no banco de dados.' },
      { status: 500 },
    );
  }
}

// ─── GET /api/user/profile ────────────────────────────────────────────────────
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { clerkId },
    select: {
      id: true,
      profile: {
        select: {
          id:              true,
          userId:          true,
          companyType:     true,
          preferredThemes: true,
          trlInterest:     true,
          writingProfile:  true,
          lensApiToken:    true,
          serpApiKey:      true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    profile: user.profile
      ? {
          ...user.profile,
          lensApiToken: user.profile.lensApiToken ? true : false,
          serpApiKey:   user.profile.serpApiKey   ? true : false,
        }
      : null,
  });
}

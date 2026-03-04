// src/app/api/stripe/checkout/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/stripe/checkout
 *
 * Cria uma Checkout Session de assinatura no Stripe e retorna a URL de redirect.
 *
 * Body : { priceId: string }
 * Response: { url: string }
 */
export async function POST(req: NextRequest) {
  // ── Autenticação ──────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // ── Payload ───────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const priceId: string | undefined = body?.priceId;

  if (!priceId) {
    return NextResponse.json(
      { error: 'O campo priceId é obrigatório' },
      { status: 400 },
    );
  }

  // ── Usuário no banco ──────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado no banco de dados' },
      { status: 404 },
    );
  }

  // ── Base URL (usado nas URLs de retorno) ──────────────────────
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  // ── Criação da Checkout Session ───────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=canceled`,
    // clerkUserId propagado para o webhook processar sem depender de customer
    metadata: { clerkUserId: userId },
    subscription_data: {
      metadata: { clerkUserId: userId },
    },
  });

  return NextResponse.json({ url: session.url });
}

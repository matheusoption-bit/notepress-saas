// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/webhooks/stripe
 *
 * Recebe eventos do Stripe, verifica a assinatura com STRIPE_WEBHOOK_SECRET
 * e atualiza a tabela Subscription no Prisma.
 *
 * Eventos tratados:
 *  - checkout.session.completed       → cria / atualiza Subscription
 *  - customer.subscription.updated    → atualiza status, plano e período
 *  - customer.subscription.deleted    → marca status como 'canceled'
 *
 * Rota pública — isPublicRoute já inclui /api/webhooks(.*) no middleware.ts
 */
export async function POST(req: NextRequest) {
  // ── Leitura do corpo bruto (obrigatório para verificação de assinatura) ───
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Header stripe-signature ausente' },
      { status: 400 },
    );
  }

  // ── Verificação da assinatura ─────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[Stripe Webhook] Falha na verificação de assinatura:', err);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  // ── Processamento dos eventos ─────────────────────────────────
  try {
    switch (event.type) {
      // ── 1. Checkout concluído → criar / atualizar Subscription ───
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;

        if (!clerkUserId || !session.subscription) {
          console.warn('[Stripe Webhook] checkout.session.completed sem clerkUserId ou subscription');
          break;
        }

        const user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          select: { id: true },
        });

        if (!user) {
          console.warn('[Stripe Webhook] Usuário não encontrado:', clerkUserId);
          break;
        }

        // Busca detalhes da subscription para obter priceId e período
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const priceId =
          stripeSubscription.items.data[0]?.price.id ?? 'unknown';

        // current_period_end existe no payload da API mas foi removido dos
        // tipos TypeScript no Stripe SDK v20 (API 2025+)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd: number | undefined = (stripeSubscription as any).current_period_end;

        await prisma.subscription.upsert({
          where: { stripeSubId: stripeSubscription.id },
          create: {
            userId: user.id,
            status: stripeSubscription.status,
            plan: priceId,
            stripeSubId: stripeSubscription.id,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
          update: {
            status: stripeSubscription.status,
            plan: priceId,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });

        console.info(
          `[Stripe Webhook] Subscription criada/atualizada: ${stripeSubscription.id}`,
        );
        break;
      }

      // ── 2. Subscription atualizada (upgrade / downgrade / renovação) ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId =
          subscription.items.data[0]?.price.id ?? 'unknown';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd: number | undefined = (subscription as any).current_period_end;

        await prisma.subscription.update({
          where: { stripeSubId: subscription.id },
          data: {
            status: subscription.status,
            plan: priceId,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });

        console.info(
          `[Stripe Webhook] Subscription atualizada: ${subscription.id} → ${subscription.status}`,
        );
        break;
      }

      // ── 3. Subscription cancelada ─────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.update({
          where: { stripeSubId: subscription.id },
          data: { status: 'canceled' },
        });

        console.info(
          `[Stripe Webhook] Subscription cancelada: ${subscription.id}`,
        );
        break;
      }

      default:
        // Eventos não tratados são ignorados silenciosamente
        break;
    }
  } catch (err) {
    console.error('[Stripe Webhook] Erro ao processar evento:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

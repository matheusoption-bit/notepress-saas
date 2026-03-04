'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Zap,
  Users,
  Sparkles,
  Lock,
  FileText,
  Search,
  MessageSquare,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

// ── Planos ────────────────────────────────────────────────────────────────────
// Defina os priceIds reais do Stripe no dashboard e os substitua abaixo.
const PRICE_IDS = {
  pro:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO  ?? 'price_pro_placeholder',
  team: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM ?? 'price_team_placeholder',
} as const;

interface Feature {
  text: string;
  included: boolean;
  icon?: React.ReactNode;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  priceId: string | null;
  cta: string;
  popular: boolean;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  glowColor: string;
  features: Feature[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    description: 'Explore o Notepress sem compromisso.',
    priceId: null,
    cta: 'Começar grátis',
    popular: false,
    accentFrom: 'from-zinc-500',
    accentTo: 'to-zinc-600',
    borderColor: 'border-zinc-700/60',
    glowColor: '',
    features: [
      { text: '3 notebooks', included: true,  icon: <BookOpen size={14} /> },
      { text: '5 debates por mês', included: true,  icon: <MessageSquare size={14} /> },
      { text: 'Radar de editais', included: true,  icon: <Search size={14} /> },
      { text: 'Exportação PDF', included: false },
      { text: 'Pesquisa de patentes (Lens.org)', included: false },
      { text: 'Colaboração em tempo real', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Mais Popular',
    price: 'R$ 97',
    period: '/mês',
    description: 'Tudo que você precisa para vencer editais sozinho.',
    priceId: PRICE_IDS.pro,
    cta: 'Assinar Pro',
    popular: true,
    accentFrom: 'from-violet-600',
    accentTo: 'to-indigo-600',
    borderColor: 'border-violet-500/70',
    glowColor: 'shadow-[0_0_48px_-8px_rgba(124,58,237,0.55)]',
    features: [
      { text: 'Notebooks ilimitados', included: true,  icon: <BookOpen size={14} /> },
      { text: 'Debates ilimitados', included: true,  icon: <MessageSquare size={14} /> },
      { text: 'Radar de editais', included: true,  icon: <Search size={14} /> },
      { text: 'Exportação PDF', included: true,  icon: <FileText size={14} /> },
      { text: 'Pesquisa de patentes (Lens.org)', included: true,  icon: <FlaskConical size={14} /> },
      { text: 'Colaboração em tempo real', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 'R$ 297',
    period: '/mês',
    description: 'Para equipes que operam em alta velocidade.',
    priceId: PRICE_IDS.team,
    cta: 'Assinar Team',
    popular: false,
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-600',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
    features: [
      { text: 'Notebooks ilimitados', included: true,  icon: <BookOpen size={14} /> },
      { text: 'Debates ilimitados', included: true,  icon: <MessageSquare size={14} /> },
      { text: 'Radar de editais', included: true,  icon: <Search size={14} /> },
      { text: 'Exportação PDF', included: true,  icon: <FileText size={14} /> },
      { text: 'Pesquisa de patentes (Lens.org)', included: true,  icon: <FlaskConical size={14} /> },
      { text: 'Colaboração Y.js (5 membros)', included: true,  icon: <Users size={14} /> },
      { text: 'API access', included: true,  icon: <Lock size={14} /> },
    ],
  },
];

// ── Componente do card ────────────────────────────────────────────────────────
function PlanCard({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!plan.priceId) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao iniciar checkout');
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        relative flex flex-col rounded-3xl p-8
        backdrop-blur-xl bg-white/4 border
        transition-transform duration-300 hover:-translate-y-1
        ${plan.borderColor}
        ${plan.glowColor}
        ${plan.popular ? 'scale-[1.04] z-10' : ''}
      `}
    >
      {/* Badge "Mais Popular" */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span
            className={`
              inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold
              bg-gradient-to-r ${plan.accentFrom} ${plan.accentTo} text-white
              shadow-lg shadow-violet-900/40
            `}
          >
            <Sparkles size={11} />
            {plan.badge}
          </span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6 pt-2">
        <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
        <p className="text-sm text-zinc-400 mt-1 leading-snug">{plan.description}</p>
      </div>

      {/* Preço */}
      <div className="mb-8 flex items-end gap-1">
        <span className="text-5xl font-extrabold text-white leading-none">
          {plan.price}
        </span>
        {plan.period && (
          <span className="text-zinc-400 text-sm pb-1">{plan.period}</span>
        )}
      </div>

      {/* Divisor com gradiente */}
      <div
        className={`h-px mb-7 bg-gradient-to-r ${plan.accentFrom} ${plan.accentTo} opacity-40`}
      />

      {/* Features */}
      <ul className="space-y-3.5 flex-1 mb-8">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            {feat.included ? (
              <span
                className={`
                  mt-0.5 shrink-0 rounded-full p-0.5
                  bg-gradient-to-br ${plan.accentFrom} ${plan.accentTo} text-white
                `}
              >
                <Check size={11} strokeWidth={3} />
              </span>
            ) : (
              <span className="mt-0.5 shrink-0 text-zinc-600">
                <X size={13} strokeWidth={2} />
              </span>
            )}
            <span className={feat.included ? 'text-zinc-200' : 'text-zinc-600 line-through'}>
              {feat.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Erro inline */}
      {error && (
        <p className="text-xs text-red-400 text-center mb-3">{error}</p>
      )}

      {/* Botão CTA */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`
          w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${plan.popular
            ? `bg-gradient-to-r ${plan.accentFrom} ${plan.accentTo} text-white hover:brightness-110 shadow-lg shadow-violet-900/30`
            : plan.id === 'team'
              ? `bg-gradient-to-r ${plan.accentFrom} ${plan.accentTo} text-white hover:brightness-110 shadow-lg shadow-emerald-900/30`
              : 'bg-white/8 hover:bg-white/14 text-white border border-white/10'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            Redirecionando…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {plan.id !== 'free' && <Zap size={14} />}
            {plan.cta}
          </span>
        )}
      </button>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      {/* Blobs decorativos de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px]
          bg-gradient-to-r from-violet-700/20 via-indigo-700/15 to-transparent
          rounded-full blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[400px]
          bg-emerald-700/10 rounded-full blur-[100px]"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            bg-violet-500/15 text-violet-300 border border-violet-500/25 mb-5">
            <Sparkles size={11} />
            Planos e preços
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br
            from-white to-zinc-400 bg-clip-text text-transparent leading-tight mb-5">
            Invista no seu próximo<br className="hidden sm:block" /> projeto aprovado
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Do primeiro rascunho à aprovação final. Escolha o plano que acompanha o seu ritmo.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Rodapé */}
        <p className="text-center text-zinc-600 text-sm mt-14">
          Cancele a qualquer momento &mdash; sem multas, sem burocracia.
          Nos planos pagos, você tem 7 dias de teste grátis.
        </p>
      </div>
    </div>
  );
}

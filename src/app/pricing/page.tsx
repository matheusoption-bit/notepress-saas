'use client';

import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: "Spark",
    price: "0",
    period: "/mês",
    description: "Comece a experimentar",
    features: [
      "3 notebooks",
      "Radar básico de editais",
      "Gemini Flash",
      "Suporte comunitário"
    ],
    buttonText: "Começar grátis",
    popular: false,
    color: "zinc"
  },
  {
    name: "NoteTese",
    price: "49",
    period: "/mês",
    description: "Ideal para pesquisadores",
    features: [
      "Notebooks ilimitados",
      "Humanização anti-IA",
      "Risco 5 Pilares",
      "Recomendador básico",
      "Export PDF ilimitado"
    ],
    buttonText: "Assinar NoteTese",
    popular: false,
    color: "violet"
  },
  {
    name: "Notepress",
    price: "79",
    period: "/mês",
    description: "Para quem quer resultados",
    features: [
      "Tudo do NoteTese",
      "Recomendador turbo",
      "LOI automática",
      "Notepress Cast (áudio)",
      "Prioridade no suporte"
    ],
    buttonText: "Assinar Notepress",
    popular: true,
    color: "violet"
  },
  {
    name: "Forge",
    price: "199",
    period: "/usuário/mês",
    description: "Para equipes e instituições",
    features: [
      "Tudo do Notepress",
      "Colaboração em tempo real",
      "Admin central",
      "SSO + Custom branding",
      "Relatórios institucionais"
    ],
    buttonText: "Assinar Forge",
    popular: false,
    color: "emerald"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-2xl text-zinc-400">Transforme suas ideias em aprovações. Escolha o plano ideal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-zinc-900 rounded-3xl p-8 flex flex-col h-full border ${plan.popular ? 'border-violet-500 scale-105' : 'border-zinc-800'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-6 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold">R$ {plan.price}</span>
                <span className="text-zinc-400">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="text-emerald-400 mt-1" size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Spark" ? "/dashboard" : "#"}
                className={`w-full py-4 rounded-2xl text-center font-semibold transition ${plan.popular 
                  ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center text-zinc-500 text-sm mt-12">
          Cancelamento a qualquer momento • 7 dias de teste grátis nos planos pagos
        </div>
      </div>
    </div>
  );
}

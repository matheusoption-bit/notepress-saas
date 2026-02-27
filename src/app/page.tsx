'use client';

import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { Sparkles, BookOpen, TrendingUp, Target, Play } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from '@/src/components/OnboardingWizard';
import { useState } from 'react';

export default function Home() {
  const { user, isLoaded } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* HERO NETFLIX */}
      <div className="relative h-screen flex items-center justify-center hero-bg overflow-hidden">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-6">
            Notepress
          </h1>
          <p className="text-3xl md:text-4xl mb-10 max-w-2xl mx-auto">
            O assistente que transforma suas ideias em aprovações de editais
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-violet-600 hover:bg-violet-700 px-12 py-6 rounded-3xl text-2xl font-bold transition flex items-center gap-3">
                  <Sparkles size={32} />
                  Começar grátis agora
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-white text-black px-12 py-6 rounded-3xl text-2xl font-bold hover:bg-zinc-200 transition flex items-center gap-3"
              >
                Configurar meu perfil
              </button>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Onboarding Wizard */}
      {showOnboarding && <OnboardingWizard onClose={() => setShowOnboarding(false)} />}

      {/* Netflix Rows */}
      <div className="px-8 md:px-16 -mt-20 relative z-10 space-y-20 pb-32">
        <NetflixRow title="Editais quentes agora" />
        <NetflixRow title="Continue suas teses" />
        <NetflixRow title="Suas soluções cadastradas" />
      </div>
    </div>
  );
}

function NetflixRow({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        {title}
      </h2>
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6">
        {[1,2,3,4].map((i) => (
          <div key={i} className="netflix-card min-w-[280px] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <div className="h-40 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Play size={48} className="opacity-70" />
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg">Item exemplo {i}</h3>
              <p className="text-sm text-zinc-400 mt-1">Prazo em breve</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

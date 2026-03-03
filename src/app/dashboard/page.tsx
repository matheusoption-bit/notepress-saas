"use client";

import { useUser } from "@clerk/nextjs";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { HotEditais } from "@/components/dashboard/HotEditais";
import { RecentNotebooks } from "@/components/dashboard/RecentNotebooks";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.username ?? "usuário";

  return (
    <div className="px-8 pb-12 pt-8 max-w-[1400px] mx-auto space-y-10">

      {/* Saudação */}
      <section className="relative">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
        <h1 className="relative text-5xl md:text-6xl font-black tracking-tight text-white mb-2">
          {getGreeting()},{" "}
          <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            {firstName}
          </span>{" "}
          👋
        </h1>
        <p className="text-zinc-400 text-lg">
          Aqui está o resumo das suas oportunidades hoje.
        </p>
      </section>

      {/* Cards de métricas */}
      <StatsCards />

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna esquerda — ações + editais */}
        <div className="lg:col-span-2 space-y-8">
          <QuickActions />
          <HotEditais />
        </div>

        {/* Coluna direita — notebooks */}
        <div>
          <RecentNotebooks />
        </div>
      </div>

    </div>
  );
}

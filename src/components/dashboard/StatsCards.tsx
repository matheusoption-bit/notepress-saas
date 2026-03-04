"use client";

import { BookOpen, FileSearch, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  accent: string;
  glow: string;
}

const STATS: StatCard[] = [
  {
    label: "Notebooks",
    value: "12",
    change: "+3 esta semana",
    positive: true,
    icon: BookOpen,
    accent: "text-indigo-400",
    glow: "bg-indigo-500/10",
  },
  {
    label: "Editais Monitorados",
    value: "47",
    change: "+8 novos",
    positive: true,
    icon: FileSearch,
    accent: "text-violet-400",
    glow: "bg-violet-500/10",
  },
  {
    label: "Soluções Geradas",
    value: "23",
    change: "+5 esta semana",
    positive: true,
    icon: Lightbulb,
    accent: "text-emerald-400",
    glow: "bg-emerald-500/10",
  },
  {
    label: "Match Rate IA",
    value: "89%",
    change: "+4% vs mês passado",
    positive: true,
    icon: TrendingUp,
    accent: "text-amber-400",
    glow: "bg-amber-500/10",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-5 relative overflow-hidden group"
          >
            {/* Glow */}
            <div
              className={cn(
                "absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                stat.glow
              )}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                  {stat.label}
                </span>
                <div
                  className={cn(
                    "p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]",
                    stat.accent
                  )}
                >
                  <Icon size={16} />
                </div>
              </div>

              <p className="text-3xl font-bold tracking-tight text-[--color-text-primary] mb-1">
                {stat.value}
              </p>

              <p
                className={cn(
                  "text-xs font-medium",
                  stat.positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stat.change}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

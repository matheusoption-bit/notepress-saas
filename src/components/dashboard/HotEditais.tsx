"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Calendar, ArrowUpRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Edital {
  id: string;
  title: string;
  org: string;
  deadline: string;
  matchScore: number;
  value: string;
}

const MOCK_EDITAIS: Edital[] = [
  {
    id: "1",
    title: "Programa de Inovação Tecnológica em Saúde Digital",
    org: "FAPESP",
    deadline: "15 Mar 2026",
    matchScore: 94,
    value: "R$ 500.000",
  },
  {
    id: "2",
    title: "Edital de Pesquisa em Inteligência Artificial Aplicada",
    org: "CNPq",
    deadline: "22 Mar 2026",
    matchScore: 87,
    value: "R$ 200.000",
  },
  {
    id: "3",
    title: "Fomento à Startups de Impacto Social",
    org: "FINEP",
    deadline: "01 Abr 2026",
    matchScore: 82,
    value: "R$ 1.000.000",
  },
];

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : score >= 80
        ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
        color
      )}
    >
      <Flame size={12} />
      {score}% match
    </span>
  );
}

export function HotEditais() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[--color-text-primary]">
          Editais em Destaque
        </h2>
        <Link
          href="/editais"
          className="text-xs font-medium text-[--color-primary] hover:text-[--color-primary-hover] transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {MOCK_EDITAIS.map((edital, i) => (
          <motion.div
            key={edital.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Link
              href={`/editais/${edital.id}`}
              className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[--color-text-primary] group-hover:text-white transition-colors line-clamp-1">
                  {edital.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[--color-text-muted]">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {edital.org}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {edital.deadline}
                  </span>
                  <span className="font-semibold text-[--color-text-secondary]">
                    {edital.value}
                  </span>
                </div>
              </div>

              <MatchBadge score={edital.matchScore} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

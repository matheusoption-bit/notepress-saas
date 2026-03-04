"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowUpRight } from "lucide-react";

interface Notebook {
  id: string;
  title: string;
  updatedAt: string;
  noteCount: number;
}

const MOCK_NOTEBOOKS: Notebook[] = [
  {
    id: "1",
    title: "FAPESP 2026 — Proposta Saúde Digital",
    updatedAt: "Há 2 horas",
    noteCount: 14,
  },
  {
    id: "2",
    title: "CNPq IA Aplicada — Rascunho",
    updatedAt: "Ontem",
    noteCount: 8,
  },
  {
    id: "3",
    title: "FINEP Impacto Social — Pesquisa",
    updatedAt: "3 dias atrás",
    noteCount: 22,
  },
];

export function RecentNotebooks() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[--color-text-primary]">
          Notebooks Recentes
        </h2>
        <Link
          href="/notebooks"
          className="text-xs font-medium text-[--color-primary] hover:text-[--color-primary-hover] transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {MOCK_NOTEBOOKS.map((nb, i) => (
          <motion.div
            key={nb.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Link
              href={`/notebooks/${nb.id}`}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 group"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[--color-text-primary] group-hover:text-white transition-colors line-clamp-1">
                  {nb.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[--color-text-muted]">
                  <Clock size={10} />
                  <span>{nb.updatedAt}</span>
                  <span className="text-[--color-text-muted]">
                    {nb.noteCount} notas
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

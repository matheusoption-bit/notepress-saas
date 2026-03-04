"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Upload,
  Radar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Novo Notebook",
    description: "Comece um projeto do zero",
    href: "/notebooks/new",
    icon: Plus,
    gradient: "from-indigo-500 to-indigo-600",
    shadowColor: "shadow-indigo-500/20",
  },
  {
    label: "Upload de Edital",
    description: "Importe PDF ou DOCX",
    href: "/editais/upload",
    icon: Upload,
    gradient: "from-violet-500 to-violet-600",
    shadowColor: "shadow-violet-500/20",
  },
  {
    label: "Radar de Editais",
    description: "Monitore oportunidades",
    href: "/editais",
    icon: Radar,
    gradient: "from-emerald-500 to-emerald-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    label: "IA Assistente",
    description: "Gere soluções com IA",
    href: "/solucoes",
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/20",
  },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[--color-text-primary] mb-4">
        Ações Rápidas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href={action.href}
                className={cn(
                  "glass-card rounded-2xl p-5 flex items-center gap-4 group relative overflow-hidden"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                    action.gradient,
                    action.shadowColor
                  )}
                >
                  <Icon size={20} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[--color-text-primary] group-hover:text-white transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-[--color-text-muted] mt-0.5">
                    {action.description}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={16}
                  className="text-[--color-text-muted] group-hover:text-[--color-text-primary] group-hover:translate-x-1 transition-all"
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

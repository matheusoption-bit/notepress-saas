"use client";

import React from "react";
import { motion } from "framer-motion";
import { Waves, Target, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFocusMode,
  FOCUS_MODES,
  type FocusMode,
} from "./FocusModeProvider";

const ICONS: Record<FocusMode, React.ElementType> = {
  flow: Waves,
  deep: Target,
  ultra: Zap,
  creative: Sparkles,
};

interface FocusModeSwitcherProps {
  /** Compact mode for sidebar */
  compact?: boolean;
  className?: string;
}

export function FocusModeSwitcher({
  compact = false,
  className,
}: FocusModeSwitcherProps) {
  const { mode, setMode } = useFocusMode();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {(Object.keys(FOCUS_MODES) as FocusMode[]).map((m) => {
          const Icon = ICONS[m];
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "relative p-2 rounded-xl transition-all duration-300",
                active
                  ? "text-white"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              )}
              title={FOCUS_MODES[m].label}
            >
              {active && (
                <motion.div
                  layoutId="focus-indicator"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3">
        Modo de Foco
      </span>
      <div className="space-y-0.5">
        {(Object.keys(FOCUS_MODES) as FocusMode[]).map((m) => {
          const Icon = ICONS[m];
          const config = FOCUS_MODES[m];
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group",
                active
                  ? "bg-white/[0.08] text-white border border-white/[0.08]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  active ? "bg-white/10" : "bg-white/[0.03] group-hover:bg-white/[0.06]"
                )}
              >
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{config.label}</div>
                <div className="text-[11px] text-white/30 truncate">
                  {config.description}
                </div>
              </div>
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-white/60"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

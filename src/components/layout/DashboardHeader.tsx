"use client";

import { useKBar } from "kbar";
import { Bell, HelpCircle, Search } from "lucide-react";
import { WeatherIndicator } from "@/components/atmosphere/WeatherIndicator";

function useKBarSafe() {
  try {
    return useKBar();
  } catch {
    return { query: undefined };
  }
}

export function DashboardHeader() {
  const { query } = useKBarSafe();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel-static border-b border-[--glass-border]">
      <div className="flex h-16 items-center justify-between px-8 gap-8">
        {/* Search — opens Command Palette */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-[--color-text-muted]" />
            </div>
            <button
              type="button"
              onClick={() => query?.toggle()}
              className="block w-full rounded-2xl py-2.5 pl-10 pr-12 text-left text-[--color-text-muted] glass-input text-sm cursor-text"
              aria-label="Abrir paleta de comandos"
            >
              Buscar notebooks, editais ou ações...
            </button>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <kbd className="inline-flex items-center rounded-lg border border-[--glass-border] px-2 py-0.5 font-mono text-[10px] text-[--color-text-muted] bg-white/[0.03]">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Weather */}
          <WeatherIndicator />

          {/* Notifications */}
          <button
            aria-label="Notificações"
            className="relative p-2 text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-white/[0.04] rounded-xl transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[--color-background-base]" />
          </button>

          <div className="h-6 w-px bg-[--glass-border]" />

          {/* Help */}
          <button
            aria-label="Ajuda"
            className="p-2 text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-white/[0.04] rounded-xl transition-colors"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

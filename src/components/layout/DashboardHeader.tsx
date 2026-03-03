"use client";

import { useState } from "react";

export function DashboardHeader() {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex h-20 items-center justify-between px-8 gap-8">

        {/* Busca central */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500">search</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-xl border-0 bg-[#18181b] py-2.5 pl-10 pr-12 text-zinc-300 ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm transition-all outline-none"
              placeholder="Buscar notebooks, editais ou ações..."
              type="text"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <kbd className="inline-flex items-center rounded border border-white/10 px-2 py-0.5 font-sans text-xs text-zinc-500">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Notificações"
            className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#09090b]" />
          </button>

          <div className="h-8 w-px bg-white/10 mx-2" />

          <button
            aria-label="Ajuda"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>

      </div>
    </header>
  );
}

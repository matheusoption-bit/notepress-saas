"use client";

import { useState } from "react";

const TAGS = [
  "Subvenção Econômica",
  "Crédito",
  "Bolsas",
  "Pesquisa",
  "Parceria",
  "Infraestrutura",
];

interface SearchHeroProps {
  onSearch?: (query: string, tag: string | null) => void;
}

export function SearchHero({ onSearch }: SearchHeroProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("Subvenção Econômica");

  function handleTagClick(tag: string) {
    const next = activeTag === tag ? null : tag;
    setActiveTag(next ?? "");
    onSearch?.(query, next);
  }

  function handleSearch() {
    onSearch?.(query, activeTag || null);
  }

  return (
    <div className="flex flex-col items-center justify-center mb-12 w-full max-w-5xl mx-auto space-y-6">
      {/* Título hero */}
      <h1 className="text-3xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 tracking-tight leading-tight py-2">
        Encontre o fomento ideal <br className="hidden md:block" />
        para sua tecnologia.
      </h1>

      {/* Barra de busca */}
      <div className="relative w-full max-w-3xl mx-auto group">
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-[#3b2bee]/20 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

        <div className="relative flex items-center w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-full shadow-lg focus-within:border-[#3b2bee] focus-within:bg-zinc-900 transition-all overflow-hidden p-1.5">
          <span className="material-symbols-outlined text-zinc-500 ml-4" style={{ fontSize: 24 }}>
            search
          </span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="search-pill-input w-full bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 px-4 py-2 text-lg h-12 outline-none focus-visible:outline-none"
            style={{ outline: 'none', boxShadow: 'none' }}
            placeholder="Descreva seu projeto para a IA..."
            type="text"
          />

          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={handleSearch}
              className="h-10 px-6 rounded-full bg-[#3b2bee] text-white font-medium text-sm shadow-lg shadow-[#3b2bee]/30 hover:bg-[#2e22d6] transition-all hover:scale-105 flex items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                auto_awesome
              </span>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tags de filtro */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TAGS.map((tag) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "bg-zinc-800 text-white border-zinc-700"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

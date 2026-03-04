"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookGrid } from "@/components/notebooks/NotebookGrid";
import type { NotebookCardData } from "@/components/notebooks/NotebookCard";

// ── Tipo retornado pela GET /api/notebooks ─────────────────────────────────────
interface ApiNotebook {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  document: { id: string; version: number; updatedAt: string } | null;
  _count: { sources: number; tasks: number };
}

// ── Utilitário: tempo relativo (sem dependência externa) ───────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (mins < 1)    return "agora mesmo";
  if (mins < 60)   return `${mins} min atrás`;
  if (hours < 24)  return `${hours}h atrás`;
  if (days === 1)  return "ontem";
  if (days < 7)    return `${days} dias atrás`;
  if (weeks < 4)   return `${weeks} sem atrás`;
  if (months < 12) return `${months} meses atrás`;
  return `${Math.floor(months / 12)} anos atrás`;
}

// ── Mapeia resposta da API → NotebookCardData ─────────────────────────────────
function toCardData(nb: ApiNotebook): NotebookCardData {
  const tags: string[] = [];
  if (nb.document) tags.push(`v${nb.document.version}`);
  if (nb._count.tasks > 0) tags.push(`${nb._count.tasks} tarefas`);

  return {
    id: nb.id,
    title: nb.title,
    tags,
    sourceCount: nb._count.sources,
    updatedAt: relativeTime(nb.updatedAt),
  };
}

// ── Componente: Modal "Novo Notebook" ─────────────────────────────────────────
function NewNotebookModal({
  onClose,
  onCreate,
  isCreating,
}: {
  onClose: () => void;
  onCreate: (title: string) => void;
  isCreating: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed) onCreate(trimmed);
  }

  // Fecha ao clicar fora
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 mx-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-400" style={{ fontSize: 20 }}>
                note_add
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">Novo Notebook</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-zinc-800"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nb-title" className="block text-sm font-medium text-zinc-400 mb-2">
              Título do projeto
            </label>
            <input
              ref={inputRef}
              id="nb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Edital Petrobras 2026 — IA Generativa"
              maxLength={120}
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  Criar Notebook
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function NotebooksPage() {
  const router = useRouter();

  const [isLoading, setIsLoading]   = useState(true);
  const [notebooks, setNotebooks]   = useState<NotebookCardData[]>([]);
  const [query, setQuery]           = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Fetch notebooks ────────────────────────────────────────────────────────
  const fetchNotebooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notebooks", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiNotebook[] = await res.json();
      setNotebooks(data.map(toCardData));
    } catch (err) {
      console.error("[NotebooksPage] fetch falhou:", err);
      setError("Não foi possível carregar os notebooks. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotebooks();
  }, [fetchNotebooks]);

  // ── Criação ────────────────────────────────────────────────────────────────
  async function handleCreate(title: string) {
    setIsCreating(true);
    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { id } = await res.json() as { id: string };
      router.push(`/notebooks/${id}`);
    } catch (err) {
      console.error("[NotebooksPage] criação falhou:", err);
      setIsCreating(false);
      setShowModal(false);
      setError("Erro ao criar notebook. Tente novamente.");
    }
  }

  // ── Filtro local ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return notebooks;
    const q = query.toLowerCase();
    return notebooks.filter(
      (nb) =>
        nb.title.toLowerCase().includes(q) ||
        nb.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notebooks, query]);

  return (
    <>
      {/* Modal "Novo Notebook" ─────────────────────────────────────────────── */}
      {showModal && (
        <NewNotebookModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          isCreating={isCreating}
        />
      )}

      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Meus Notebooks
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {isLoading
                  ? "Carregando…"
                  : `${notebooks.length} projeto${notebooks.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Busca */}
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  style={{ fontSize: 18 }}
                >
                  search
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar notebooks…"
                  className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all w-52"
                />
              </div>

              {/* Botão "Novo Notebook" */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-900/30"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Novo Notebook
              </button>
            </div>
          </div>

          {/* ── Banner de erro ─────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>
                error
              </span>
              <span>{error}</span>
              <button
                onClick={() => { setError(null); void fetchNotebooks(); }}
                className="ml-auto underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* ── Grade de notebooks ─────────────────────────────────────────── */}
          <NotebookGrid
            notebooks={filtered}
            isLoading={isLoading}
            onNew={() => setShowModal(true)}
          />
        </div>
      </div>
    </>
  );
}

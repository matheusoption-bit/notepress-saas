"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookGrid } from "@/components/notebooks/NotebookGrid";
import type { NotebookCardData } from "@/components/notebooks/NotebookCard";

/* ── Dados mock (substituir por fetch quando a API existir) ── */

const MOCK_NOTEBOOKS: NotebookCardData[] = [
  {
    id: "nb-1",
    title: "Otimização de Processos com IA Generativa",
    tags: ["Deep Tech", "FAPESP", "TRL 3"],
    sourceCount: 15,
    updatedAt: "2 dias atrás",
    coverUrl:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
  },
  {
    id: "nb-2",
    title: "Nanomateriais para Baterias Sólidas",
    tags: ["Hard Science", "CNPq"],
    sourceCount: 8,
    updatedAt: "Ontem",
    coverUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
  },
  {
    id: "nb-3",
    title: "AgriTech: Sensores IoT de Baixo Custo",
    tags: ["IoT", "Finep", "TRL 5"],
    sourceCount: 23,
    updatedAt: "3 semanas atrás",
    coverUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
  },
  {
    id: "nb-4",
    title: "BioTech: Vacinas de RNA Mensageiro",
    tags: ["Saúde", "BNDES"],
    sourceCount: 42,
    updatedAt: "1 mês atrás",
    coverUrl:
      "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&q=80",
  },
];

/* ── Página ───────────────────────────────────────────────── */

export default function NotebooksPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<NotebookCardData[]>([]);
  const [query, setQuery] = useState("");

  /* Simula fetch — trocar por fetch('/api/notebooks') quando disponível */
  useEffect(() => {
    const t = setTimeout(() => {
      setNotebooks(MOCK_NOTEBOOKS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return notebooks;
    const q = query.toLowerCase();
    return notebooks.filter(
      (nb) =>
        nb.title.toLowerCase().includes(q) ||
        nb.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [notebooks, query]);

  function handleNew() {
    router.push("/notebooks/new");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Grade de notebooks */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <NotebookGrid
            notebooks={filtered}
            isLoading={isLoading}
            onNew={handleNew}
          />
        </div>
      </div>
    </div>
  );
}

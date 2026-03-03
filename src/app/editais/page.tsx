"use client";

import { useEffect, useState } from "react";
import { SearchHero } from "@/components/editais/SearchHero";
import { EditalGrid } from "@/components/editais/EditalGrid";
import type { EditalCardData } from "@/components/editais/EditalCard";

/* ── Tipos da API ──────────────────────────────────── */

type ApiEdital = {
  id: string;
  nome: string;
  orgao: string;
  dataFechamento: string | null;
  valorMax: number | null;
  status: string;
};

/* ── Enriquecimento mock (até a API suportar esses campos) ── */

const TIPOS = ["Subvenção", "Pesquisa", "Crédito", "Bolsas", "Parceria", "Infraestrutura"];
const TRLS = ["3 a 7", "4+", "6 a 9", "N/A", "3 a 6", "1 a 4"];
const DESCRICOES = [
  "Chamada pública para projetos de inovação aplicada à indústria 4.0, focando em otimização de processos e eficiência energética.",
  "Apoio para desenvolvimento de produto e inserção no mercado para pequenas empresas com base tecnológica.",
  "Fomento para tecnologias aplicadas ao agronegócio sustentável, visando aumento de produtividade.",
  "Recuperação e modernização de infraestrutura de pesquisa em universidades e centros de pesquisa.",
  "Co-financiamento para projetos de mobilidade e logística com foco em descarbonização.",
  "Inserção de mestres e doutores em empresas privadas para projetos de P&D.",
];

/** Gera um índice estável a partir de uma string (sem aleatoriedade) */
function stableIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xfffffff;
  }
  return Math.abs(hash) % mod;
}

function enrichEdital(e: ApiEdital): EditalCardData {
  const idx = stableIndex(e.id, 100);
  const matchPercent = 20 + (idx % 75); // 20–94%

  return {
    id: e.id,
    nome: e.nome,
    orgao: e.orgao,
    tipo: TIPOS[stableIndex(e.id + "tipo", TIPOS.length)],
    status:
      e.status === "aberto"
        ? "aberto"
        : e.status === "continuo"
        ? "continuo"
        : "fechado",
    matchPercent,
    valorMax: e.valorMax,
    trl: TRLS[stableIndex(e.id + "trl", TRLS.length)],
    dataFechamento: e.dataFechamento,
    descricao: DESCRICOES[stableIndex(e.id + "desc", DESCRICOES.length)],
  };
}

/* ── Página ────────────────────────────────────────── */

export default function EditaisPage() {
  const [editais, setEditais] = useState<EditalCardData[]>([]);
  const [filtered, setFiltered] = useState<EditalCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/editais")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar editais");
        return res.json();
      })
      .then((data: ApiEdital[]) => {
        const enriched = data.map(enrichEdital);
        setEditais(enriched);
        setFiltered(enriched);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  function handleSearch(query: string, tag: string | null) {
    let result = editais;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.nome.toLowerCase().includes(q) ||
          e.orgao.toLowerCase().includes(q) ||
          e.descricao.toLowerCase().includes(q)
      );
    }

    if (tag) {
      result = result.filter(
        (e) => e.tipo.toLowerCase() === tag.toLowerCase()
      );
    }

    setFiltered(result);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <SearchHero onSearch={handleSearch} />
        <EditalGrid editais={filtered} isLoading={isLoading} />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Calendar, Building2, Clock, ArrowRight } from 'lucide-react';

const editais = [
  {
    id: "finep-transicao",
    nome: "Finep Mais Inovação Brasil – Rodada 2 – Transição Energética",
    orgao: "FINEP / MCTI",
    prazo: "31/08/2026",
    valor: "R$ 500 milhões",
    status: "aberto",
    temas: ["energia", "sustentabilidade"]
  },
  {
    id: "finep-defesa",
    nome: "Finep Mais Inovação Brasil – Rodada 2 – Base Industrial de Defesa",
    orgao: "FINEP",
    prazo: "30/09/2026",
    valor: "R$ 300 milhões",
    status: "aberto",
    temas: ["defesa", "segurança"]
  },
  {
    id: "bndes-centros",
    nome: "Chamada BNDES/Finep – Centros de PD&I (Nova Indústria Brasil)",
    orgao: "BNDES / FINEP",
    prazo: "30/06/2026",
    valor: "Até R$ 3 bilhões",
    status: "aberto",
    temas: ["pd&i", "nova indústria"]
  }
];

export default function EditaisPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Radar de Editais</h1>
            <p className="text-xl text-zinc-400 mt-3">Editais abertos e quentes para inovação no Brasil</p>
          </div>
          <div className="text-sm text-zinc-500">Atualizado em 25/02/2026</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editais.map((edital) => (
            <Link key={edital.id} href={`/editais/${edital.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 hover:border-violet-600 rounded-3xl p-8 transition-all group h-full flex flex-col">
                <div className="flex justify-between mb-6">
                  <Building2 className="text-violet-400" size={28} />
                  <div className="text-xs px-3 py-1 bg-emerald-900/50 text-emerald-400 rounded-full">Aberto</div>
                </div>

                <h3 className="font-semibold text-2xl leading-tight mb-6 group-hover:text-violet-300 transition">
                  {edital.nome}
                </h3>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-zinc-400">Prazo</div>
                    <div className="font-medium">{edital.prazo}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-zinc-400">Valor máximo</div>
                    <div className="font-medium text-emerald-400">{edital.valor}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


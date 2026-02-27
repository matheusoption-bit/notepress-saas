'use client';

import { Calendar, DollarSign, Target, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function EditalPage({ params }: { params: { id: string } }) {
  // Dados mockados - depois vamos puxar do banco
  const edital = {
    nome: "Finep Mais Inovação Brasil – Rodada 2 – Transição Energética",
    orgao: "FINEP / MCTI",
    prazo: "31 de agosto de 2026",
    valor: "R$ 500 milhões",
    resumo: "Subvenção econômica para projetos de inovação em hidrogênio, armazenamento de energia e biocombustíveis.",
    status: "aberto"
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/editais" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8">
          <ArrowLeft size={20} /> Voltar para todos os editais
        </Link>

        <h1 className="text-4xl font-bold leading-tight mb-6">{edital.nome}</h1>
        
        <div className="flex items-center gap-8 text-sm text-zinc-400 mb-12">
          <div className="flex items-center gap-2">
            <Building2 size={18} /> {edital.orgao}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} /> Prazo: {edital.prazo}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={18} /> Até {edital.valor}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Resumo do Edital</h2>
              <p className="text-zinc-300 leading-relaxed">{edital.resumo}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Checklist para submissão</h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-5 bg-zinc-900 rounded-2xl">
                  <div className="text-emerald-400 mt-1">✓</div>
                  <div>Parceria com ICT obrigatória</div>
                </div>
                <div className="flex gap-4 p-5 bg-zinc-900 rounded-2xl">
                  <div className="text-emerald-400 mt-1">✓</div>
                  <div>TRL entre 3 e 9</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Target className="text-violet-400" />
                Termômetro de Aderência
              </h3>
              <div className="text-7xl font-bold text-emerald-400">92</div>
              <p className="text-zinc-400 mt-2">Excelente aderência</p>
            </div>

            <button className="w-full bg-violet-600 hover:bg-violet-700 py-6 rounded-2xl text-xl font-bold transition">
              Gerar proposta completa em 1 clique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

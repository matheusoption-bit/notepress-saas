'use client';

import Link from 'next/link';
import { Calendar, Building2, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type Edital = {
  id: string;
  nome: string;
  orgao: string;
  dataFechamento: string | null;
  valorMax: number | null;
  status: string;
};

export default function EditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/editais')
    .then(res => {
      if (!res.ok) throw new Error('Falha ao carregar editais');
      return res.json();
    })
    .then(data => {
      setEditais(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
}, []);

  if (loading) return <div className="p-8 text-center">Carregando editais...</div>;

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
                  <div className="text-xs px-4 py-1 bg-emerald-900/60 text-emerald-400 rounded-full font-medium">
                    {edital.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </div>
                </div>

                <h3 className="font-semibold text-2xl leading-tight mb-8 group-hover:text-violet-300 transition">
                  {edital.nome}
                </h3>

                <div className="mt-auto space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-zinc-400 flex items-center gap-2">
                      <Calendar size={16} /> Prazo
                    </div>
                    <div className="font-medium">{edital.dataFechamento ? new Date(edital.dataFechamento).toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-zinc-400">Valor máximo</div>
                    <div className="font-medium text-emerald-400">
                      {edital.valorMax ? `R$ ${(edital.valorMax / 1_000_000).toFixed(0)} milhões` : '—'}
                    </div>
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

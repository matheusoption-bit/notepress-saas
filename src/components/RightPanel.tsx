'use client';

import { ThermometerSun, MessageCircle, Target } from 'lucide-react';

export default function RightPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Termômetro */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <ThermometerSun className="text-orange-400" />
          <h3 className="font-semibold">Termômetro de Aderência</h3>
        </div>
        <div className="text-6xl font-bold text-emerald-400 mb-1">87</div>
        <p className="text-sm text-zinc-400">Excelente aderência ao edital Finep Transição Energética</p>
      </div>

      {/* Critérios */}
      <div className="p-6 border-b border-zinc-800 flex-1 overflow-auto">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target size={18} />
          Critérios do Edital
        </h3>
        <div className="space-y-4 text-sm">
          <div className="p-4 bg-zinc-900 rounded-xl">
            <div className="font-medium text-emerald-400">Risco Tecnológico</div>
            <div className="text-xs text-zinc-400 mt-1">Bem estruturado (5 pilares)</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl">
            <div className="font-medium text-amber-400">Impacto Social</div>
            <div className="text-xs text-zinc-400 mt-1">Precisa reforçar</div>
          </div>
        </div>
      </div>

      {/* Chat IA */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle size={18} />
            Consultor Técnico
          </h3>
        </div>
        <div className="flex-1 p-6 overflow-auto text-sm text-zinc-300">
          Olá! Como posso ajudar na sua tese hoje?
        </div>
        <div className="p-4 border-t border-zinc-800">
          <input
            type="text"
            placeholder="Pergunte algo sobre o edital..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { Upload, FileText, Clock, Trash2 } from 'lucide-react';

export default function SourcesSidebar() {
  return (
    <div className="h-full flex flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Fontes */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Fontes</h3>
          <button className="text-violet-400 hover:text-violet-300">
            <Upload size={18} />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-2 bg-zinc-900 rounded-lg">
            <FileText size={16} />
            <div className="flex-1 truncate">Proposta_Finep_2026.pdf</div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-zinc-900 rounded-lg">
            <FileText size={16} />
            <div className="flex-1 truncate">Artigo_Bioeconomia.docx</div>
          </div>
        </div>
      </div>

      {/* Estrutura */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold mb-3">Estrutura da Tese</h3>
        <div className="text-sm text-zinc-400 space-y-1 pl-2">
          <div>1. Introdução</div>
          <div>2. Revisão Bibliográfica</div>
          <div>3. Metodologia</div>
          <div>4. Risco Tecnológico</div>
          <div>5. Resultados Esperados</div>
        </div>
      </div>

      {/* Versões */}
      <div className="flex-1 p-4 overflow-auto">
        <h3 className="font-semibold mb-3">Versões</h3>
        <div className="space-y-2 text-sm">
          <div className="p-3 bg-zinc-900 rounded-lg border border-emerald-500/30">
            <div className="font-medium">v1.3 - Revisão IA</div>
            <div className="text-xs text-zinc-500">Há 2 horas</div>
          </div>
          <div className="p-3 bg-zinc-900 rounded-lg">
            <div className="font-medium">v1.2 - Versão inicial</div>
            <div className="text-xs text-zinc-500">Ontem</div>
          </div>
        </div>
      </div>
    </div>
  );
}

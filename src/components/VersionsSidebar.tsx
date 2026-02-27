'use client';

import { Clock, History } from 'lucide-react';

export default function VersionsSidebar() {
  return (
    <div className="p-4 border-b border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} className="text-zinc-400" />
        <h3 className="font-semibold">Versões</h3>
      </div>

      <div className="space-y-3 text-sm">
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl">
          <p className="font-medium">v1.4 - Revisão IA</p>
          <p className="text-xs text-zinc-500">Há 2 horas</p>
        </div>
        <div className="p-3 bg-zinc-900 rounded-2xl">
          <p className="font-medium">v1.3 - Versão inicial</p>
          <p className="text-xs text-zinc-500">Ontem 14:32</p>
        </div>
      </div>
    </div>
  );
}

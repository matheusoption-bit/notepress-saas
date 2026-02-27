'use client';

import { use, useState } from 'react';
import TipTapEditor from '@/src/components/TipTapEditor';
import SourcesSidebar from '@/src/components/SourcesSidebar';
import VersionsSidebar from '@/src/components/VersionsSidebar';
import RightPanel from '@/src/components/RightPanel';

export default function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedTab, setSelectedTab] = useState<'editor' | 'sources'>('editor');

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* LEFT SIDEBAR - Fontes + Estrutura + Versões */}
      <div className="w-72 border-r border-zinc-800 flex flex-col">
        <SourcesSidebar />
        <VersionsSidebar />
      </div>

      {/* CENTER - Editor Principal */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-6">
          <h1 className="text-2xl font-semibold">Tese de Bioeconomia - Finep 2026</h1>
          <div className="flex-1" />
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">
            Exportar
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <TipTapEditor />
        </div>
      </div>

      {/* RIGHT SIDEBAR - Termômetro + Chat + Critérios */}
      <div className="w-96 border-l border-zinc-800 bg-zinc-900 flex flex-col">
        <RightPanel />
      </div>
    </div>
  );
}

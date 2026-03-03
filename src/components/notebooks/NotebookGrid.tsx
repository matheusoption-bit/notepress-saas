import { NotebookCard, NotebookCardData } from "./NotebookCard";

interface NotebookGridProps {
  notebooks: NotebookCardData[];
  isLoading: boolean;
  onNew: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 overflow-hidden min-h-[340px] animate-pulse">
      <div className="h-48 bg-zinc-900" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-16 bg-zinc-800 rounded-full" />
          <div className="h-6 w-16 bg-zinc-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function NotebookGrid({ notebooks, isLoading, onNew }: NotebookGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Card "Novo notebook" */}
      <button
        onClick={onNew}
        className="group relative flex flex-col items-center justify-center h-full min-h-[340px] rounded-2xl border-2 border-dashed border-zinc-800 hover:border-[#3b2bee]/50 hover:bg-zinc-900/30 transition-all duration-300 cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-zinc-900 group-hover:bg-[#3b2bee]/20 flex items-center justify-center transition-colors mb-4 border border-zinc-800 group-hover:border-[#3b2bee]/30">
          <span
            className="material-symbols-outlined text-zinc-400 group-hover:text-[#3b2bee] transition-colors"
            style={{ fontSize: 32 }}
          >
            add
          </span>
        </div>
        <h3 className="text-lg font-medium text-zinc-300 group-hover:text-white transition-colors">
          Desenvolver novo projeto
        </h3>
        <p className="text-zinc-500 text-sm mt-2 text-center px-8">
          Inicie um novo notebook de pesquisa
        </p>
      </button>

      {/* Skeletons durante loading */}
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

      {/* Cards dos notebooks */}
      {!isLoading &&
        notebooks.map((nb) => <NotebookCard key={nb.id} {...nb} />)}

      {/* Estado vazio */}
      {!isLoading && notebooks.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span
            className="material-symbols-outlined text-zinc-600"
            style={{ fontSize: 48 }}
          >
            folder_open
          </span>
          <p className="text-zinc-400 text-lg font-medium">
            Nenhum notebook encontrado
          </p>
          <p className="text-zinc-600 text-sm">
            Ajuste a busca ou crie um novo projeto.
          </p>
        </div>
      )}
    </div>
  );
}

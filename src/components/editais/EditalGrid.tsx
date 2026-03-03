import { EditalCard, EditalCardData } from "./EditalCard";

interface EditalGridProps {
  editais: EditalCardData[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl h-80 animate-pulse" />
  );
}

export function EditalGrid({ editais, isLoading }: EditalGridProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho da grade */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Destaques da Semana
        </h3>
        <div className="flex gap-2">
          <button
            aria-label="Anterior"
            className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          </button>
          <button
            aria-label="Próximo"
            className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : editais.length === 0
          ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center gap-4">
              <span className="material-symbols-outlined text-zinc-600" style={{ fontSize: 48 }}>
                search_off
              </span>
              <p className="text-zinc-400 text-lg font-medium">Nenhum edital encontrado</p>
              <p className="text-zinc-600 text-sm">Tente ajustar os filtros ou a busca.</p>
            </div>
          )
          : editais.map((edital) => (
            <EditalCard key={edital.id} {...edital} />
          ))
        }
      </div>
    </div>
  );
}

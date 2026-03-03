import Link from "next/link";

export interface NotebookCardData {
  id: string;
  title: string;
  tags: string[];
  sourceCount: number;
  updatedAt: string;
  coverUrl?: string;
}

const COVER_COLORS = [
  "from-violet-900/60 to-zinc-900",
  "from-blue-900/60 to-zinc-900",
  "from-emerald-900/60 to-zinc-900",
  "from-orange-900/60 to-zinc-900",
  "from-pink-900/60 to-zinc-900",
  "from-cyan-900/60 to-zinc-900",
];

export function NotebookCard({
  id,
  title,
  tags,
  sourceCount,
  updatedAt,
  coverUrl,
}: NotebookCardData) {
  const colorIdx =
    Math.abs(
      id.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
    ) % COVER_COLORS.length;

  return (
    <Link
      href={`/notebooks/${id}`}
      className="group relative flex flex-col h-full rounded-2xl bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1 overflow-hidden min-h-[340px]"
    >
      {/* Capa */}
      <div className="relative h-48 w-full overflow-hidden border-b border-zinc-800/50 shrink-0">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Capa de ${title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${COVER_COLORS[colorIdx]}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
      </div>

      {/* Corpo */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#3b2bee] transition-colors line-clamp-2 pr-2">
            {title}
          </h3>
          <button
            onClick={(e) => e.preventDefault()}
            className="text-zinc-500 hover:text-white transition-colors p-1 -mr-2 -mt-1 rounded-full hover:bg-zinc-800 shrink-0"
            aria-label="Mais opções"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              more_vert
            </span>
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rodapé */}
        <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              description
            </span>
            <span>{sourceCount} fontes</span>
          </div>
          <span>{updatedAt}</span>
        </div>
      </div>
    </Link>
  );
}

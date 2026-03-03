/* ─── RecentNotebooks.tsx ───────────────────────────── */

type Status =
  | { type: "done" }
  | { type: "progress"; percent: number; ringColor: string; textColor: string };

interface Notebook {
  icon: string;
  iconColor: string;
  hoverBorder: string;
  title: string;
  subtitle: string;
  status: Status;
}

const NOTEBOOKS: Notebook[] = [
  {
    icon: "folder",
    iconColor: "text-blue-400",
    hoverBorder: "group-hover:border-blue-500/50",
    title: "Edital Petrobras 2024",
    subtitle: "Atualizado há 2h",
    status: { type: "done" },
  },
  {
    icon: "folder",
    iconColor: "text-orange-400",
    hoverBorder: "group-hover:border-orange-500/50",
    title: "Projeto SebraeTec",
    subtitle: "Editando rascunho",
    status: { type: "progress", percent: 45, ringColor: "text-orange-500", textColor: "text-orange-400" },
  },
  {
    icon: "folder_shared",
    iconColor: "text-purple-400",
    hoverBorder: "group-hover:border-purple-500/50",
    title: "Licitação BB Tecnologia",
    subtitle: "Aguardando revisão",
    status: { type: "progress", percent: 80, ringColor: "text-purple-500", textColor: "text-purple-400" },
  },
  {
    icon: "folder",
    iconColor: "text-zinc-400",
    hoverBorder: "group-hover:border-zinc-500/50",
    title: "Rascunho: Embrapii",
    subtitle: "Criado ontem",
    status: { type: "progress", percent: 10, ringColor: "text-zinc-500", textColor: "text-zinc-400" },
  },
];

function ProgressRing({
  percent,
  ringColor,
  textColor,
}: {
  percent: number;
  ringColor: string;
  textColor: string;
}) {
  return (
    <div className="relative h-8 w-8 flex items-center justify-center shrink-0">
      <span className={`text-[10px] font-bold z-10 ${textColor}`}>{percent}%</span>
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 36 36"
        aria-hidden
      >
        <path
          className="text-[#27272a]"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={ringColor}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${percent}, 100`}
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export function RecentNotebooks() {
  return (
    <div className="glass-panel rounded-3xl p-6 h-full border border-white/[0.08]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Notebooks Recentes</h3>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="space-y-1">
        {NOTEBOOKS.map((nb) => (
          <div
            key={nb.title}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div
              className={`h-12 w-12 rounded-xl bg-[#18181b] border border-white/5 flex items-center justify-center ${nb.iconColor} ${nb.hoverBorder} transition-colors shrink-0`}
            >
              <span className="material-symbols-outlined">{nb.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-white font-medium truncate">{nb.title}</h5>
              <p className="text-zinc-500 text-xs">{nb.subtitle}</p>
            </div>

            {nb.status.type === "done" ? (
              <div className="h-8 w-8 rounded-full border-2 border-[#18181b] flex items-center justify-center text-white bg-green-500 ml-auto shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
              </div>
            ) : (
              <ProgressRing
                percent={nb.status.percent}
                ringColor={nb.status.ringColor}
                textColor={nb.status.textColor}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <button className="w-full py-2 rounded-lg bg-[#18181b] text-zinc-400 hover:text-white text-sm font-medium hover:bg-white/5 transition-all">
          Ver todos os notebooks
        </button>
      </div>
    </div>
  );
}

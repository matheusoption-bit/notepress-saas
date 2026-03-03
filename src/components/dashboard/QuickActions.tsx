/* ─── QuickActions.tsx ──────────────────────────────── */

const ACTIONS = [
  { icon: "note_add",       label: "Novo\nNotebook",   iconClass: "bg-[#3b2bee]/10 text-[#3b2bee] group-hover:bg-[#3b2bee] group-hover:text-white" },
  { icon: "post_add",       label: "Nova\nProposta",   iconClass: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white" },
  { icon: "radar",          label: "Acessar\nRadar",   iconClass: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white" },
  { icon: "domain",         label: "Importar\nCNPJ",   iconClass: "bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white" },
  { icon: "podcasts",       label: "Notepress\nCast",  iconClass: "bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white" },
  { icon: "calendar_month", label: "Ver\nAgenda",      iconClass: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white" },
];

export function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#3b2bee]">bolt</span>
        Ações Rápidas
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {ACTIONS.map((action) => (
          <button
            key={action.icon}
            className="flex flex-col items-center justify-center gap-3 bg-[#18181b] border border-white/[0.08] p-4 rounded-3xl hover:bg-[#27272a] hover:border-[#3b2bee]/50 hover:-translate-y-1 transition-all group aspect-square"
          >
            <div className={`p-3 rounded-2xl transition-colors ${action.iconClass}`}>
              <span className="material-symbols-outlined">{action.icon}</span>
            </div>
            <span className="text-xs font-medium text-zinc-300 text-center whitespace-pre-line leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── StatsCards.tsx ───────────────────────────────── */

interface Stat {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  badge: {
    icon?: string;
    text: string;
    className: string;
  };
}

const STATS: Stat[] = [
  {
    icon: "folder_special",
    iconBg: "bg-blue-500/10 text-blue-400",
    label: "Notebooks Ativos",
    value: "12",
    badge: { icon: "trending_up", text: "+2%", className: "text-emerald-400 bg-emerald-400/10" },
  },
  {
    icon: "radar",
    iconBg: "bg-violet-500/10 text-violet-400",
    label: "Editais no Radar",
    value: "48",
    badge: { icon: "add", text: "15 novos", className: "text-emerald-400 bg-emerald-400/10" },
  },
  {
    icon: "analytics",
    iconBg: "bg-orange-500/10 text-orange-400",
    label: "Aderência Média",
    value: "85%",
    badge: { icon: "trending_up", text: "+5%", className: "text-emerald-400 bg-emerald-400/10" },
  },
  {
    icon: "send",
    iconBg: "bg-pink-500/10 text-pink-400",
    label: "Propostas Enviadas",
    value: "7",
    badge: { text: "Esta semana", className: "text-zinc-400 bg-zinc-800" },
  },
];

export function StatsCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="glass-panel rounded-2xl p-6 hover:border-violet-500/30 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`rounded-lg p-3 ${stat.iconBg}`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stat.badge.className}`}>
              {stat.badge.icon && (
                <span className="material-symbols-outlined mr-1" style={{ fontSize: 14 }}>
                  {stat.badge.icon}
                </span>
              )}
              {stat.badge.text}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
            <span className="text-3xl font-bold text-white mt-1">{stat.value}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

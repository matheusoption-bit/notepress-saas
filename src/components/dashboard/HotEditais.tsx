/* ─── HotEditais.tsx ────────────────────────────────── */
import Link from 'next/link';

interface Edital {
  badge: { text: string; className: string };
  borderColor: string;
  hoverTitleClass: string;
  deadline: string;
  title: string;
  description: string;
  matchPercent: number;
  barGradient: string;
}

const EDITAIS: Edital[] = [
  {
    badge: { text: "Alta Aderência", className: "bg-[#3b2bee]/20 text-[#3b2bee]" },
    borderColor: "border-l-[#3b2bee]",
    hoverTitleClass: "group-hover:text-[#3b2bee]",
    deadline: "2 dias",
    title: "Inovação Tecnológica - FINEP",
    description: "Seleção pública para projetos de desenvolvimento de IA aplicada à saúde pública.",
    matchPercent: 92,
    barGradient: "from-violet-600 to-[#3b2bee]",
  },
  {
    badge: { text: "Média Aderência", className: "bg-emerald-500/20 text-emerald-400" },
    borderColor: "border-l-emerald-500",
    hoverTitleClass: "group-hover:text-emerald-400",
    deadline: "5 dias",
    title: "Smart City - Pref. Curitiba",
    description: "Licitação para sistema de monitoramento inteligente de tráfego urbano.",
    matchPercent: 68,
    barGradient: "from-emerald-600 to-emerald-400",
  },
];

export function HotEditais() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
          Editais Quentes
        </h3>
        <Link href="/editais" className="text-sm font-medium text-[#3b2bee] hover:text-[#3b2bee]/80">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDITAIS.map((edital) => (
          <div
            key={edital.title}
            className={`glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border-l-4 ${edital.borderColor} group`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${edital.badge.className}`}>
                {edital.badge.text}
              </span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                {edital.deadline}
              </span>
            </div>

            <h4 className={`text-white font-bold text-lg leading-tight mb-2 transition-colors ${edital.hoverTitleClass}`}>
              {edital.title}
            </h4>
            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{edital.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-300">Match IA</span>
                <span className="text-white">{edital.matchPercent}%</span>
              </div>
              <div className="h-2 w-full bg-[#18181b] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${edital.barGradient} rounded-full`}
                  style={{ width: `${edital.matchPercent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

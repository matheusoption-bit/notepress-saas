import Link from "next/link";

export interface EditalCardData {
  id: string;
  nome: string;
  orgao: string;
  tipo: string;
  status: "aberto" | "continuo" | "fechado";
  matchPercent: number;
  valorMax: number | null;
  trl: string;
  dataFechamento: string | null;
  descricao: string;
}

/* ── Utilitários ──────────────────────────────────── */

function getMatchStyle(pct: number): {
  barClass: string;
  barStyle?: React.CSSProperties;
  textClass: string;
  icon: string;
} {
  if (pct >= 80) {
    return {
      barClass: "match-progress-bar",
      textClass: "text-[#3b2bee] font-bold",
      icon: "text-[#3b2bee]",
    };
  }
  if (pct >= 50) {
    return {
      barClass: "match-progress-bar opacity-50",
      barStyle: { background: "linear-gradient(to right, #52525b, #71717a)" },
      textClass: "text-zinc-300 font-bold",
      icon: "text-zinc-500",
    };
  }
  return {
    barClass: "match-progress-bar bg-zinc-600",
    barStyle: {
      background: "#52525b",
      opacity: pct < 30 ? 0.25 : 0.4,
    },
    textClass: "text-zinc-300 font-bold",
    icon: "text-zinc-500",
  };
}

function getDeadlineStyle(dataFechamento: string | null): {
  label: string;
  className: string;
} {
  if (!dataFechamento) {
    return { label: "Indeterminado", className: "text-zinc-300" };
  }
  const diff = Math.ceil(
    (new Date(dataFechamento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return { label: "Encerrado", className: "text-zinc-500" };
  if (diff <= 5) return { label: `${diff} dias`, className: "text-red-400" };
  if (diff <= 15) return { label: `${diff} dias`, className: "text-orange-400" };
  return {
    label: new Date(dataFechamento).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    className: "text-white",
  };
}

function StatusBadge({ status }: { status: EditalCardData["status"] }) {
  if (status === "aberto") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Aberto
      </span>
    );
  }
  if (status === "continuo") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
        Fluxo Contínuo
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
      Fechado
    </span>
  );
}

/* ── Componente principal ─────────────────────────── */

export function EditalCard({
  id,
  nome,
  orgao,
  tipo,
  status,
  matchPercent,
  valorMax,
  trl,
  dataFechamento,
  descricao,
}: EditalCardData) {
  const matchStyle = getMatchStyle(matchPercent);
  const deadline = getDeadlineStyle(dataFechamento);

  const valorFormatado = valorMax
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(valorMax)
    : "—";

  return (
    <div className="relative w-full rounded-2xl bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-300 group hover:-translate-y-1">
      <div className="p-6 flex flex-col h-full">

        {/* Topo: logo + badges */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center shrink-0 p-1">
            <span className="text-black font-bold text-[10px] uppercase text-center leading-tight">
              {orgao.length > 8 ? orgao.slice(0, 8) : orgao}
            </span>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
              {tipo}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-white leading-tight mb-2 tracking-tight group-hover:text-[#3b2bee] transition-colors">
          {nome}
        </h3>

        {/* Descrição */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-2">
          {descricao}
        </p>

        {/* Match de IA */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className={`text-zinc-400 font-medium flex items-center gap-1`}>
              <span className={`material-symbols-outlined ${matchStyle.icon}`} style={{ fontSize: 14 }}>
                auto_awesome
              </span>
              Match de IA
            </span>
            <span className={matchStyle.textClass}>{matchPercent}%</span>
          </div>
          <div className="match-progress-container">
            <div
              className={matchStyle.barClass}
              style={{ width: `${matchPercent}%`, ...(matchStyle.barStyle ?? {}) }}
            />
          </div>
        </div>

        {/* Valor + TRL */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-t border-zinc-800/50 pt-4">
          <div>
            <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Valor Máximo</p>
            <p className="text-white font-bold text-base">{valorFormatado}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">TRL Exigido</p>
            <p className="text-white font-bold text-base">{trl}</p>
          </div>
        </div>

        {/* Rodapé: prazo + CTA */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Encerra em</span>
            <span className={`text-xs font-bold ${deadline.className}`}>{deadline.label}</span>
          </div>

          <Link
            href={`/editais/${id}`}
            className="h-9 px-4 flex items-center justify-center bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-[#3b2bee] hover:border-[#3b2bee] transition-all text-xs font-bold gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
            Ver Edital
          </Link>
        </div>

      </div>
    </div>
  );
}

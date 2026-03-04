/* ─── RecentNotebooks.tsx ───────────────────────────── */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status =
  | { type: "done" }
  | { type: "progress"; percent: number; ringColor: string; textColor: string };

interface ApiNotebook {
  id: string;
  title: string;
  updatedAt: string;
  document: { id: string; version: number; updatedAt: string } | null;
}

interface Notebook {
  id: string;
  icon: string;
  iconColor: string;
  hoverBorder: string;
  title: string;
  subtitle: string;
  status: Status;
}

const NOTEBOOK_STYLES = [
  {
    icon: 'folder',
    iconColor: 'text-blue-400',
    hoverBorder: 'group-hover:border-blue-500/50',
    statusColor: { ringColor: 'text-blue-500', textColor: 'text-blue-400' },
  },
  {
    icon: 'folder',
    iconColor: 'text-orange-400',
    hoverBorder: 'group-hover:border-orange-500/50',
    statusColor: { ringColor: 'text-orange-500', textColor: 'text-orange-400' },
  },
  {
    icon: 'folder_shared',
    iconColor: 'text-purple-400',
    hoverBorder: 'group-hover:border-purple-500/50',
    statusColor: { ringColor: 'text-purple-500', textColor: 'text-purple-400' },
  },
  {
    icon: 'folder',
    iconColor: 'text-zinc-400',
    hoverBorder: 'group-hover:border-zinc-500/50',
    statusColor: { ringColor: 'text-zinc-500', textColor: 'text-zinc-400' },
  },
] as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return 'Atualizado agora mesmo';
  if (mins < 60) return `Atualizado há ${mins} min`;
  if (hours < 24) return `Atualizado há ${hours}h`;
  if (days === 1) return 'Atualizado ontem';
  return `Atualizado há ${days} dias`;
}

function toDashboardNotebook(item: ApiNotebook, index: number): Notebook {
  const style = NOTEBOOK_STYLES[index % NOTEBOOK_STYLES.length];
  const version = item.document?.version ?? 1;
  const status: Status =
    version > 1
      ? { type: 'done' }
      : {
          type: 'progress',
          percent: 20,
          ringColor: style.statusColor.ringColor,
          textColor: style.statusColor.textColor,
        };

  return {
    id: item.id,
    icon: style.icon,
    iconColor: style.iconColor,
    hoverBorder: style.hoverBorder,
    title: item.title,
    subtitle: relativeTime(item.updatedAt),
    status,
  };
}

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
  const router = useRouter();
  const [items, setItems] = useState<ApiNotebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotebooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notebooks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ApiNotebook[];
      setItems(data.slice(0, 4));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotebooks();
  }, [fetchNotebooks]);

  const notebooks = useMemo(
    () => items.map((item, index) => toDashboardNotebook(item, index)),
    [items],
  );

  async function handleCreateNotebook() {
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Novo Notebook' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as { id: string };
      router.push(`/notebooks/${created.id}`);
    } catch {
      router.push('/notebooks');
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 h-full border border-white/[0.08]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Notebooks Recentes</h3>
        <button
          onClick={handleCreateNotebook}
          className="text-zinc-500 hover:text-white transition-colors"
          title="Novo notebook"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="space-y-1">
        {!isLoading && notebooks.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-[#18181b] p-4 text-sm text-zinc-400">
            Nenhum notebook ainda. Crie o primeiro para começar.
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-white/5 bg-[#18181b] p-4 text-sm text-zinc-500">
            Carregando notebooks...
          </div>
        )}

        {notebooks.map((nb) => (
          <button
            key={nb.id}
            onClick={() => router.push(`/notebooks/${nb.id}`)}
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
          </button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <button
          onClick={() => router.push('/notebooks')}
          className="w-full py-2 rounded-lg bg-[#18181b] text-zinc-400 hover:text-white text-sm font-medium hover:bg-white/5 transition-all"
        >
          Ver todos os notebooks
        </button>
      </div>
    </div>
  );
}

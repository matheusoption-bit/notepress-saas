"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Radar,
  BarChart3,
  FileText,
  Plus,
  Building2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout";

/* ═══════════════════════════════════════════════════════════════
   Utilitários
   ═══════════════════════════════════════════════════════════════ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getMotivation(): string {
  const h = new Date().getHours();
  if (h < 12) return "Comece o dia revisando seus melhores editais.";
  if (h < 18) return "Sua semana está produtiva. Continue assim.";
  return "Hora de revisar o progresso dos seus notebooks.";
}

/* ═══════════════════════════════════════════════════════════════
   Dados mock
   ═══════════════════════════════════════════════════════════════ */

const METRICS = [
  { id: "notebooks", label: "Notebooks Ativos",     value: "12",  change: "+2 este mês",      up: true,  icon: BookOpen,  accent: "indigo"  as const },
  { id: "editais",   label: "Editais Recomendados", value: "34",  change: "esta semana",       up: true,  icon: Radar,     accent: "violet"  as const },
  { id: "aderencia", label: "Taxa de Aderência",    value: "78%", change: "+5pp vs. anterior", up: true,  icon: BarChart3, accent: "emerald" as const },
  { id: "propostas", label: "Propostas Geradas",    value: "8",   change: "este mês",          up: false, icon: FileText,  accent: "amber"   as const },
];

const HOT_EDITAIS = [
  { id: "1", titulo: "FINEP — Subvenção Econômica para Startups DeepTech", orgao: "FINEP",   aderencia: 92, prazo: "15 mar 2026", valor: "R$ 1,5 M", status: "alta"      as const },
  { id: "2", titulo: "CNPq — Chamada Universal — Pesquisa e Inovação",     orgao: "CNPq",    aderencia: 84, prazo: "30 mar 2026", valor: "R$ 300 K",  status: "nova"      as const },
  { id: "3", titulo: "SEBRAE — Aceleração de Empresas com IA Generativa",  orgao: "SEBRAE",  aderencia: 79, prazo: "10 abr 2026", valor: "R$ 150 K",  status: "expirando" as const },
  { id: "4", titulo: "BNDES Garagem — Fase 3 — Startups Cleantech",       orgao: "BNDES",   aderencia: 71, prazo: "20 abr 2026", valor: "R$ 500 K",  status: "normal"    as const },
];

const NOTEBOOKS = [
  { id: "nb-1", titulo: "FINEP 2026 — Estratégia de Pesquisa", editais: 3, tempo: "há 2 horas",  progresso: 72 },
  { id: "nb-2", titulo: "CNPq — Proposta de Subvenção em IA",  editais: 1, tempo: "ontem",        progresso: 45 },
  { id: "nb-3", titulo: "SEBRAE — Aceleração Q1 2026",         editais: 2, tempo: "3 dias atrás", progresso: 88 },
  { id: "nb-4", titulo: "Mapeamento Geral — Editais Março",    editais: 5, tempo: "há 1 semana",  progresso: 30 },
];

/* ═══════════════════════════════════════════════════════════════
   Tokens de acento mapeados a CSS vars
   ═══════════════════════════════════════════════════════════════ */

const ACCENT = {
  indigo:  { fg: "var(--accent-indigo)",  bg: "var(--accent-indigo-bg)"  },
  violet:  { fg: "var(--accent-violet)",  bg: "var(--accent-violet-bg)"  },
  emerald: { fg: "var(--accent-emerald)", bg: "var(--accent-emerald-bg)" },
  amber:   { fg: "var(--accent-amber)",   bg: "var(--accent-amber-bg)"   },
} as const;

const STATUS_STYLE = {
  alta:      { dot: "bg-[var(--accent-emerald)]", text: "text-[var(--accent-emerald)]", bg: "bg-[var(--accent-emerald-bg)]", label: "Alta aderência" },
  nova:      { dot: "bg-[var(--accent-indigo)]",  text: "text-[var(--accent-indigo)]",  bg: "bg-[var(--accent-indigo-bg)]",  label: "Nova"           },
  expirando: { dot: "bg-[var(--accent-amber)]",   text: "text-[var(--accent-amber)]",   bg: "bg-[var(--accent-amber-bg)]",   label: "Expirando"      },
  normal:    { dot: "bg-[var(--color-text-muted)]", text: "text-[var(--color-text-muted)]", bg: "bg-[var(--color-background-hover)]", label: "Recomendada" },
} as const;

/* ═══════════════════════════════════════════════════════════════
   Componentes atômicos
   ═══════════════════════════════════════════════════════════════ */

/** Skeleton para loading state */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--color-background-hover)] animate-pulse",
        className,
      )}
    />
  );
}

/** Badge de status compacto */
function StatusPill({ status }: { status: keyof typeof STATUS_STYLE }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
        "text-[10px] font-medium tracking-wide",
        s.bg, s.text,
      )}
    >
      <span className={cn("w-1 h-1 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/** Barra de progresso fina */
function ProgressBar({
  value,
  accent = "indigo",
}: {
  value: number;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <div className="h-1 w-full rounded-full bg-[var(--color-border-default)] overflow-hidden" style={{ opacity: 0.45 }}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${value}%`, backgroundColor: ACCENT[accent].fg }}
      />
    </div>
  );
}

/** Cabeçalho de seção com hierarquia tipográfica */
function SectionHead({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5 font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-1 text-[13px] font-medium",
            "text-[var(--color-text-muted)]",
            "hover:text-[var(--color-primary)] transition-colors duration-200",
          )}
        >
          Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MetricCard
   ─────────────────────────────────────────────────────────────
   Light: fundo branco + borda sutil 1px
   Dark:  cinza pouquíssimo mais claro que o fundo base
   Hover: mudança sutil de fundo, sem translate/scale
   ═══════════════════════════════════════════════════════════════ */

function MetricCard({
  label,
  value,
  change,
  up,
  icon: Icon,
  accent,
}: (typeof METRICS)[number]) {
  const a = ACCENT[accent];

  return (
    <div
      className={cn(
        "group flex flex-col justify-between gap-5 p-5 rounded-xl",
        /* Fundo + borda */
        "bg-[var(--card-bg)] border border-[var(--card-border)]",
        /* Micro-interação: hover suave sem translate */
        "transition-colors duration-200 ease-out",
        "hover:bg-[var(--card-bg-hover)]",
      )}
    >
      {/* Rótulo + ícone */}
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-normal text-[var(--color-text-muted)] leading-snug max-w-[8rem]">
          {label}
        </p>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: a.bg }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: a.fg }} strokeWidth={1.6} />
        </div>
      </div>

      {/* Valor grande + variação */}
      <div>
        <p className="text-3xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] leading-none">
          {value}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          {up && (
            <TrendingUp
              className="w-3.5 h-3.5"
              style={{ color: ACCENT.emerald.fg, opacity: 0.8 }}
              strokeWidth={2}
            />
          )}
          <p className="text-xs text-[var(--color-text-muted)] font-normal">{change}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EditalCard
   ─────────────────────────────────────────────────────────────
   Card integrado, não "caixa isolada". Borda sutil, hover suave.
   ═══════════════════════════════════════════════════════════════ */

function EditalCard({
  id,
  titulo,
  orgao,
  aderencia,
  prazo,
  valor,
  status,
}: (typeof HOT_EDITAIS)[number]) {
  const barAccent: keyof typeof ACCENT =
    aderencia >= 85 ? "emerald" : aderencia >= 70 ? "amber" : "indigo";

  return (
    <Link
      href={`/editais/${id}`}
      className={cn(
        "group flex flex-col gap-4 p-5 rounded-xl",
        "bg-[var(--card-bg)] border border-[var(--card-border)]",
        "transition-colors duration-200 ease-out",
        "hover:bg-[var(--card-bg-hover)]",
      )}
    >
      {/* Topo — orgão + badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--color-text-muted)]">
          {orgao}
        </span>
        <StatusPill status={status} />
      </div>

      {/* Título */}
      <p className={cn(
        "text-sm font-medium leading-snug line-clamp-2",
        "text-[var(--color-text-secondary)]",
        "group-hover:text-[var(--color-text-primary)] transition-colors duration-200",
      )}>
        {titulo}
      </p>

      {/* Barra de aderência */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)] font-normal">Aderência</span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: ACCENT[barAccent].fg }}
          >
            {aderencia}%
          </span>
        </div>
        <ProgressBar value={aderencia} accent={barAccent} />
      </div>

      {/* Rodapé — prazo + valor */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <CalendarDays className="w-3 h-3" strokeWidth={1.5} />
          <span className="font-normal">{prazo}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-sm font-semibold",
            "text-[var(--color-text-secondary)]",
            "group-hover:text-[var(--color-text-primary)] transition-colors duration-200",
          )}>
            {valor}
          </span>
          <ArrowUpRight
            className={cn(
              "w-3.5 h-3.5",
              "text-[var(--color-text-muted)]",
              "group-hover:text-[var(--color-primary)] transition-colors duration-200",
            )}
            strokeWidth={2}
          />
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NotebookCard
   ─────────────────────────────────────────────────────────────
   Linha horizontal. Hover: fundo sutil sem deslocamento.
   ═══════════════════════════════════════════════════════════════ */

function NotebookCard({
  id,
  titulo,
  editais,
  tempo,
  progresso,
}: (typeof NOTEBOOKS)[number]) {
  return (
    <Link
      href={`/notebooks/${id}`}
      className={cn(
        "group flex items-center gap-4 px-4 py-3.5 rounded-xl",
        "transition-colors duration-200",
        "hover:bg-[var(--color-background-hover)]",
      )}
    >
      {/* Ícone */}
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
          "bg-[var(--color-background-hover)]",
          "group-hover:bg-[var(--accent-indigo-bg)]",
          "transition-colors duration-200",
        )}
      >
        <BookOpen
          className={cn(
            "w-4 h-4",
            "text-[var(--color-text-muted)]",
            "group-hover:text-[var(--accent-indigo)]",
            "transition-colors duration-200",
          )}
          strokeWidth={1.6}
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
          {titulo}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1">
            <ProgressBar value={progresso} />
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums flex-shrink-0 font-normal">
            {progresso}%
          </span>
        </div>
      </div>

      {/* Meta — visível em telas maiores */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
        <p className="text-xs text-[var(--color-text-secondary)] font-normal">
          {editais} edital{editais > 1 ? "is" : ""}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] font-normal">{tempo}</p>
      </div>

      <ChevronRight
        className={cn(
          "w-4 h-4 flex-shrink-0",
          "text-[var(--color-text-muted)]",
          "group-hover:text-[var(--color-text-secondary)]",
          "transition-colors duration-200",
        )}
        strokeWidth={1.5}
      />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Página principal — Dashboard
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const firstName = user?.firstName ?? user?.username ?? "usuário";

  /* ── Loading skeleton ─────────────── */
  if (!isLoaded) {
    return (
      <Layout>
        <div className="max-w-[1080px] mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1080px] mx-auto flex flex-col gap-12">

        {/* ── Hero ────────────────────────────────────── */}
        <section className="flex flex-col gap-4 pt-1">
          {/* Badge IA */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full",
              "text-[11px] font-medium tracking-wide",
              "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
            )}
          >
            <Sparkles className="w-3 h-3" strokeWidth={2} />
            Notepress IA ativo
          </span>

          {/* Saudação */}
          <div>
            <h1 className="text-[2rem] sm:text-[2.5rem] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)] leading-tight">
              {getGreeting()},{" "}
              <span className="font-normal text-[var(--color-text-muted)]">{firstName}</span>
            </h1>
            <p className="mt-2 text-[15px] text-[var(--color-text-muted)] max-w-lg leading-relaxed font-normal">
              {getMotivation()}{" "}
              <span className="text-[var(--color-text-secondary)] font-medium">
                3 editais com alta aderência
              </span>{" "}
              aguardam análise.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 mt-1">
            <Link
              href="/notebooks/new"
              className={cn(
                "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold",
                "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                "hover:opacity-90 transition-opacity duration-200",
              )}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Novo notebook
            </Link>
            <Link
              href="/editais"
              className={cn(
                "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium",
                "text-[var(--color-text-secondary)]",
                "border border-[var(--color-border-default)]",
                "hover:bg-[var(--color-background-hover)] hover:text-[var(--color-text-primary)]",
                "transition-colors duration-200",
              )}
            >
              <Radar className="w-3.5 h-3.5" strokeWidth={2} />
              Radar de editais
            </Link>
            <Link
              href="/solucoes/importar"
              className={cn(
                "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium",
                "text-[var(--color-text-secondary)]",
                "border border-[var(--color-border-default)]",
                "hover:bg-[var(--color-background-hover)] hover:text-[var(--color-text-primary)]",
                "transition-colors duration-200",
              )}
            >
              <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
              Importar por CNPJ
            </Link>
          </div>
        </section>

        {/* ── Métricas ────────────────────────────────── */}
        <section>
          <SectionHead title="Visão geral" subtitle="Suas métricas atualizadas" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <MetricCard key={m.id} {...m} />
            ))}
          </div>
        </section>

        {/* ── Editais quentes ─────────────────────────── */}
        <section>
          <SectionHead
            title="Editais recomendados"
            subtitle="Selecionados pelo Notepress IA com base no seu perfil"
            href="/editais"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {HOT_EDITAIS.map((e) => (
              <EditalCard key={e.id} {...e} />
            ))}
          </div>
        </section>

        {/* ── Notebooks recentes ──────────────────────── */}
        <section>
          <SectionHead
            title="Notebooks recentes"
            subtitle="Continue de onde parou"
            href="/notebooks"
          />
          <div
            className={cn(
              "flex flex-col divide-y divide-[var(--color-border-default)]",
              "rounded-xl border border-[var(--card-border)]",
              "bg-[var(--card-bg)]",
              "overflow-hidden",
            )}
          >
            {NOTEBOOKS.map((nb) => (
              <NotebookCard key={nb.id} {...nb} />
            ))}
          </div>
        </section>

        {/* ── Rodapé sutil ────────────────────────────── */}
        <footer className="flex items-center justify-between py-6">
          <p className="text-xs text-[var(--color-text-muted)] font-normal">
            Notepress IA · dados em tempo real
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)] font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            Sistemas operacionais
          </div>
        </footer>

      </div>
    </Layout>
  );
}

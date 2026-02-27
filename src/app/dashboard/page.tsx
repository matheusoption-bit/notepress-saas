"use client";

import React, { useState, useRef, useEffect } from "react";
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
  MessageCircle,
  X,
  Send,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout";

// ─── Utilitários ──────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getMotivation(): string {
  const h = new Date().getHours();
  if (h < 12) return "Comece o dia revisando seus melhores editais.";
  if (h < 18) return "Você tem oportunidades esperando análise agora.";
  return "Hora de revisar o progresso dos seus notebooks.";
}

// ─── Dados mock ───────────────────────────────────────────────────────────────

const METRICS = [
  { id: "notebooks", label: "Notebooks Ativos",       value: "12",  change: "+2 este mês",      up: true,  icon: BookOpen, accent: "indigo"  as const },
  { id: "editais",   label: "Editais Recomendados",   value: "34",  change: "esta semana",       up: true,  icon: Radar,    accent: "violet"  as const },
  { id: "aderencia", label: "Taxa de Aderência",      value: "78%", change: "+5pp vs. anterior", up: true,  icon: BarChart3,accent: "emerald" as const },
  { id: "propostas", label: "Propostas Geradas",      value: "8",   change: "este mês",          up: false, icon: FileText, accent: "amber"   as const },
];

const HOT_EDITAIS = [
  { id: "1", titulo: "FINEP — Subvenção Econômica para Startups DeepTech", orgao: "FINEP",  aderencia: 92, prazo: "15 mar 2026", valor: "R$ 1,5 M", status: "alta"      as const },
  { id: "2", titulo: "CNPq — Chamada Universal — Pesquisa e Inovação",     orgao: "CNPq",  aderencia: 84, prazo: "30 mar 2026", valor: "R$ 300 K", status: "nova"      as const },
  { id: "3", titulo: "SEBRAE — Aceleração de Empresas com IA Generativa",  orgao: "SEBRAE",aderencia: 79, prazo: "10 abr 2026", valor: "R$ 150 K", status: "expirando" as const },
  { id: "4", titulo: "BNDES Garagem — Fase 3 — Startups Cleantech",        orgao: "BNDES", aderencia: 71, prazo: "20 abr 2026", valor: "R$ 500 K", status: "normal"    as const },
];

const NOTEBOOKS = [
  { id: "nb-1", titulo: "FINEP 2026 — Estratégia de Pesquisa",    editais: 3, tempo: "há 2 horas",  progresso: 72 },
  { id: "nb-2", titulo: "CNPq — Proposta de Subvenção em IA",     editais: 1, tempo: "ontem",        progresso: 45 },
  { id: "nb-3", titulo: "SEBRAE — Aceleração Q1 2026",            editais: 2, tempo: "3 dias atrás", progresso: 88 },
  { id: "nb-4", titulo: "Mapeamento Geral — Editais Março",       editais: 5, tempo: "há 1 semana",  progresso: 30 },
];

// ─── Design tokens locais ─────────────────────────────────────────────────────

const ACCENT = {
  indigo:  { bg: "bg-indigo-500/[.08]",  border: "border-indigo-500/[.12]",  text: "text-indigo-400",  glow: "rgba(99,102,241,.18)"  },
  violet:  { bg: "bg-violet-500/[.08]",  border: "border-violet-500/[.12]",  text: "text-violet-400",  glow: "rgba(139,92,246,.18)"  },
  emerald: { bg: "bg-emerald-500/[.08]", border: "border-emerald-500/[.12]", text: "text-emerald-400", glow: "rgba(16,185,129,.18)"  },
  amber:   { bg: "bg-amber-500/[.08]",   border: "border-amber-500/[.12]",   text: "text-amber-400",   glow: "rgba(245,158,11,.18)"  },
} as const;

const STATUS = {
  alta:      { dot: "bg-emerald-400", pill: "text-emerald-400 bg-emerald-400/[.08] ring-emerald-400/[.15]", label: "Alta aderência" },
  nova:      { dot: "bg-indigo-400",  pill: "text-indigo-400  bg-indigo-400/[.08]  ring-indigo-400/[.15]",  label: "Nova"          },
  expirando: { dot: "bg-amber-400",   pill: "text-amber-400   bg-amber-400/[.08]   ring-amber-400/[.15]",   label: "Expirando"     },
  normal:    { dot: "bg-zinc-500",    pill: "text-zinc-400    bg-zinc-500/[.08]    ring-zinc-500/[.12]",    label: "Recomendada"   },
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-2xl bg-white/[.03] animate-pulse", className)} />;
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1", s.pill)}>
      <span className={cn("w-1 h-1 rounded-full flex-shrink-0", s.dot)} />
      {s.label}
    </span>
  );
}

// ─── Bar (barra de progresso) ─────────────────────────────────────────────────

function Bar({ value, accent = "indigo" }: { value: number; accent?: "indigo" | "emerald" | "amber" }) {
  const grad = { indigo: "from-indigo-500 to-violet-500", emerald: "from-emerald-500 to-teal-400", amber: "from-amber-500 to-orange-400" };
  return (
    <div className="h-px w-full rounded-full bg-white/[.06] overflow-hidden">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", grad[accent])}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, change, up, icon: Icon, accent }: (typeof METRICS)[number]) {
  const a = ACCENT[accent];
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-5 p-6 rounded-2xl overflow-hidden cursor-default",
        "bg-white/[.025] border border-white/[.055]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-px hover:bg-white/[.035] hover:border-white/[.08]"
      )}
      style={{ "--glow": a.glow } as React.CSSProperties}
    >
      {/* Glow radial no topo ao hover */}
      <div
        className="absolute inset-x-0 -top-10 h-28 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, var(--glow), transparent)" }}
      />

      {/* Label + ícone */}
      <div className="flex items-start justify-between relative z-10">
        <p className="text-[11px] font-medium text-zinc-500 tracking-wide leading-snug max-w-[8rem]">{label}</p>
        <div className={cn("flex items-center justify-center w-7 h-7 rounded-xl border transition-all duration-300 group-hover:scale-110", a.bg, a.border, a.text)}>
          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        </div>
      </div>

      {/* Valor */}
      <div className="relative z-10">
        <p className="text-[2.6rem] font-bold tracking-[-0.04em] text-white leading-none">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          {up && <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />}
          <p className="text-[11px] text-zinc-600">{change}</p>
        </div>
      </div>
    </div>
  );
}

// ─── EditalCard ───────────────────────────────────────────────────────────────

function EditalCard({ id, titulo, orgao, aderencia, prazo, valor, status }: (typeof HOT_EDITAIS)[number]) {
  const barAccent: "indigo" | "emerald" | "amber" = aderencia >= 85 ? "emerald" : aderencia >= 70 ? "amber" : "indigo";
  const valueColor = aderencia >= 85 ? "text-emerald-400" : aderencia >= 70 ? "text-amber-400" : "text-indigo-400";
  const lineGrad = aderencia >= 85
    ? "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
    : aderencia >= 70
    ? "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
    : "bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent";

  return (
    <Link
      href={`/editais/${id}`}
      className={cn(
        "group relative flex flex-col gap-4 p-5 rounded-2xl overflow-hidden",
        "bg-white/[.025] border border-white/[.055]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-px hover:bg-white/[.035] hover:border-white/[.08]",
        "hover:shadow-[0_24px_56px_-12px_rgba(0,0,0,.7)]"
      )}
    >
      <div className={cn("absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400", lineGrad)} />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[.14em] text-zinc-700">{orgao}</span>
        <StatusPill status={status} />
      </div>

      <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 leading-snug line-clamp-2 transition-colors duration-200">
        {titulo}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-700">Aderência</span>
          <span className={cn("text-xs font-bold tabular-nums", valueColor)}>{aderencia}%</span>
        </div>
        <Bar value={aderencia} accent={barAccent} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/[.05]">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-700">
          <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
          <span>{prazo}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200">{valor}</span>
          <ArrowUpRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-all duration-200 group-hover:-translate-y-px group-hover:translate-x-px" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

// ─── NotebookCard ─────────────────────────────────────────────────────────────

function NotebookCard({ id, titulo, editais, tempo, progresso }: (typeof NOTEBOOKS)[number]) {
  return (
    <Link
      href={`/notebooks/${id}`}
      className={cn(
        "group flex items-center gap-4 px-4 py-3.5 rounded-xl",
        "bg-white/[.02] border border-white/[.045]",
        "transition-all duration-200",
        "hover:bg-white/[.035] hover:border-white/[.07]"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0",
        "bg-white/[.04] border border-white/[.07]",
        "group-hover:bg-indigo-500/[.1] group-hover:border-indigo-500/[.2]",
        "transition-all duration-200"
      )}>
        <BookOpen className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors duration-200" strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors duration-150 truncate">{titulo}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex-1"><Bar value={progresso} accent="indigo" /></div>
          <span className="text-[10px] text-zinc-700 tabular-nums flex-shrink-0">{progresso}%</span>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
        <p className="text-[10px] text-zinc-700">{editais} edital{editais > 1 ? "is" : ""}</p>
        <p className="text-[10px] text-zinc-800">{tempo}</p>
      </div>

      <ChevronRight className="w-3 h-3 text-zinc-800 group-hover:text-zinc-500 transition-all duration-150 group-hover:translate-x-0.5 flex-shrink-0" />
    </Link>
  );
}

// ─── FloatingChatWidget ───────────────────────────────────────────────────────

interface ChatMsg { id: string; role: "user" | "ai"; text: string; }

const INITIAL_MSGS: ChatMsg[] = [
  { id: "w", role: "ai", text: "Olá! Sou o assistente Notepress. Como posso ajudar hoje? Posso buscar editais, analisar aderência ou ajudar com seus notebooks." },
];

function FloatingChatWidget() {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [msgs, setMsgs]           = useState<ChatMsg[]>(INITIAL_MSGS);
  const [input, setInput]         = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open, minimized]);

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open, minimized]);

  function send() {
    const t = input.trim();
    if (!t) return;
    setMsgs((p) => [...p, { id: `u${Date.now()}`, role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMsgs((p) => [...p, { id: `a${Date.now()}`, role: "ai", text: "Entendido! O assistente IA do Notepress estará totalmente disponível em breve. Continue explorando enquanto isso 🚀" }]);
    }, 800);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <>
      {/* Painel de chat */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 w-[340px] sm:w-[380px] rounded-2xl overflow-hidden",
          "bg-[#0d0d0d] border border-white/[.07]",
          "shadow-[0_32px_80px_-8px_rgba(0,0,0,.9)]",
          "flex flex-col transition-all duration-300 ease-out origin-bottom-right",
          open && !minimized  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : minimized         ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                              : "opacity-0 scale-95 translate-y-3 pointer-events-none"
        )}
        style={{ maxHeight: minimized ? "auto" : "510px" }}
        role="dialog"
        aria-label="Chat Notepress IA"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[.05] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/[.1] border border-indigo-500/[.18] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Notepress IA</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-600">Online · Preview</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized((v) => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[.05] transition-all duration-150">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[.05] transition-all duration-150">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mensagens + Input */}
        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0" style={{ maxHeight: "360px" }}>
              {msgs.map((m) => (
                <div key={m.id} className={cn("flex gap-2 items-end", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  {m.role === "ai" && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500/[.1] border border-indigo-500/[.2] flex items-center justify-center flex-shrink-0 mb-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" strokeWidth={2} />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[82%] px-3 py-2 rounded-xl text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white/[.04] text-zinc-300 border border-white/[.06] rounded-bl-sm"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 px-3 py-3 border-t border-white/[.05] flex-shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Pergunte ao Notepress IA…"
                className={cn(
                  "flex-1 min-w-0 h-8 px-3 rounded-lg text-sm",
                  "bg-white/[.04] border border-white/[.07]",
                  "text-zinc-200 placeholder:text-zinc-700",
                  "outline-none focus:border-indigo-500/40 focus:bg-white/[.06]",
                  "transition-all duration-150"
                )}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0",
                  "bg-indigo-600 text-white border border-indigo-500/40",
                  "hover:bg-indigo-500 transition-all duration-150",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  "shadow-[0_0_12px_0_rgba(99,102,241,.3)]"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Botão flutuante (bolinha estilo Grok) */}
      <button
        onClick={() => { setOpen((v) => !v); setMinimized(false); }}
        aria-label="Abrir assistente Notepress"
        className={cn(
          "fixed bottom-5 right-5 z-50 rounded-full",
          "bg-[#0d0d0d] border border-white/[.1]",
          "flex items-center justify-center",
          "shadow-[0_8px_32px_0_rgba(0,0,0,.8),0_0_0_1px_rgba(255,255,255,.05)]",
          "hover:border-indigo-500/30 hover:shadow-[0_8px_32px_0_rgba(0,0,0,.8),0_0_20px_0_rgba(99,102,241,.2)]",
          "transition-all duration-200 active:scale-95 relative",
          open && "border-indigo-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,.8),0_0_20px_0_rgba(99,102,241,.2)]"
        )}
        style={{ width: "52px", height: "52px" }}
      >
        {open
          ? <X className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          : <MessageCircle className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
        }
        {!open && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0a0a0a]" />
        )}
      </button>
    </>
  );
}

// ─── Helpers de layout ────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-white/[.04]" />;
}

function SectionHead({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200 tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="text-[11px] text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-[11px] font-medium text-zinc-700 hover:text-zinc-300 transition-colors duration-150">
          Ver todos <ArrowUpRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const firstName = user?.firstName ?? user?.username ?? "usuário";

  if (!isLoaded) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-4 w-[26rem] max-w-full" />
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => <Skeleton key={i} className="h-52" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <div className="max-w-5xl mx-auto flex flex-col gap-12">

          {/* Hero ────────────────────────────────────── */}
          <section className="relative pt-2">
            {/* Blob decorativo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -left-8 w-[420px] h-[260px] rounded-full opacity-[.04] blur-3xl"
              style={{ background: "radial-gradient(ellipse at 30% 50%, #6366f1, transparent 70%)" }}
            />

            <div className="relative flex flex-col gap-4">
              {/* Tag */}
              <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-500/[.08] text-indigo-400 ring-1 ring-indigo-500/[.15]">
                <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                Notepress IA ativo
              </span>

              {/* Saudação */}
              <div>
                <h1 className="text-[2.5rem] sm:text-[2.8rem] font-bold tracking-[-0.04em] text-white leading-[1.1]">
                  {getGreeting()},{" "}
                  <span className="text-zinc-500 font-semibold">{firstName}</span>
                  <span className="text-zinc-700">.</span>
                </h1>
                <p className="mt-3 text-sm text-zinc-600 max-w-sm leading-relaxed">
                  {getMotivation()}{" "}
                  <span className="text-zinc-400 font-medium">3 editais com alta aderência</span>{" "}
                  aguardam análise.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Link
                  href="/notebooks/new"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-indigo-600 text-white border border-indigo-500/40 hover:bg-indigo-500 transition-all duration-150 shadow-[0_0_18px_0_rgba(99,102,241,.28)] hover:shadow-[0_0_24px_0_rgba(99,102,241,.38)]"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Novo notebook
                </Link>
                <Link
                  href="/editais"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-white/[.04] text-zinc-300 border border-white/[.07] hover:bg-white/[.07] hover:text-white hover:border-white/[.1] transition-all duration-150"
                >
                  <Radar className="w-3.5 h-3.5" strokeWidth={2} />
                  Radar de editais
                </Link>
                <Link
                  href="/solucoes/importar"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-white/[.04] text-zinc-300 border border-white/[.07] hover:bg-white/[.07] hover:text-white hover:border-white/[.1] transition-all duration-150"
                >
                  <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Importar por CNPJ
                </Link>
              </div>
            </div>
          </section>

          <Divider />

          {/* Métricas ─────────────────────────────────── */}
          <section>
            <SectionHead title="Visão geral" subtitle="Suas métricas de hoje" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {METRICS.map((m) => <MetricCard key={m.id} {...m} />)}
            </div>
          </section>

          {/* Editais quentes ──────────────────────────── */}
          <section>
            <SectionHead
              title="Editais quentes para você"
              subtitle="Selecionados pelo Notepress IA com base no seu perfil"
              href="/editais"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {HOT_EDITAIS.map((e) => <EditalCard key={e.id} {...e} />)}
            </div>
          </section>

          {/* Notebooks recentes ───────────────────────── */}
          <section>
            <SectionHead title="Notebooks recentes" subtitle="Continue de onde parou" href="/notebooks" />
            <div className="flex flex-col gap-2">
              {NOTEBOOKS.map((nb) => <NotebookCard key={nb.id} {...nb} />)}
            </div>
          </section>

          {/* Rodapé ──────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 pb-8 border-t border-white/[.04]">
            <p className="text-[11px] text-zinc-800">Notepress IA · dados em tempo real</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Todos os sistemas operacionais
            </div>
          </div>

        </div>
      </Layout>

      {/* Chat flutuante fora do Layout para não ser afetado pelo padding */}
      <FloatingChatWidget />
    </>
  );
}

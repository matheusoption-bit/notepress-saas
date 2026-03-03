"use client";

import React from "react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { FloatingChat } from "./FloatingChat";
import { cn } from "@/lib/utils";

/* ── Tipos ──────────────────────────────────────────── */

interface LayoutProps {
  children: React.ReactNode;
  /**
   * Define qual shell de layout renderizar:
   *
   *   'public' — Rotas abertas (landing, /pricing, /editais público):
   *              Header de navegação público (logo + links + CTA) sem sidebars.
   *
   *   'app'    — Rotas autenticadas (/dashboard, /notebooks, /settings):
   *              DashboardSidebar (ícones hover-expand) + DashboardHeader
   *              (barra de busca + notificações) + FloatingChat.
   *
   * @default 'app'
   */
  variant?: "public" | "app";
  /** Sidebar contextual opcional — só aplicada no variant 'app' */
  contextSidebar?: React.ReactNode;
  /** Classes extras para o container de conteúdo */
  className?: string;
}

/* ═══════════════════════════════════════════════════════
   VARIANT: PUBLIC — cabeçalho simples sem sidebar
   ═══════════════════════════════════════════════════════ */

function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-white/5 flex items-center px-6 gap-6">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 select-none group"
        aria-label="Notepress"
      >
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
          N
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Notepress
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 ml-4">
        {[
          { href: "/editais", label: "Editais" },
          { href: "/pricing", label: "Preços" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* CTA */}
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/sign-up"
          className="px-4 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
        >
          Começar grátis
        </Link>
      </div>
    </header>
  );
}

function PublicLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <PublicHeader />
      <main className={cn("pt-16", className)}>{children}</main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VARIANT: APP — DashboardSidebar + DashboardHeader
   ═══════════════════════════════════════════════════════ */

function AppLayout({
  children,
  contextSidebar,
  className,
}: {
  children: React.ReactNode;
  contextSidebar?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Sidebar esquerda — hover-expand de 80px → 256px */}
      <DashboardSidebar />

      {/* Coluna principal — offset da sidebar (80px fixo) */}
      <div className="flex-1 flex flex-col min-w-0 pl-20">
        {/* Header com barra de busca e ações */}
        <DashboardHeader />

        <div className="flex flex-1 min-h-0">
          {/* Context sidebar opcional (ex: SourcesSidebar, VersionsSidebar) */}
          {contextSidebar && (
            <aside className="hidden lg:flex flex-col flex-shrink-0 w-64 xl:w-72 border-r border-white/5 bg-zinc-950 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
              {contextSidebar}
            </aside>
          )}

          {/* Conteúdo da página */}
          <main
            className={cn(
              "flex-1 min-w-0",
              "px-6 sm:px-8 lg:px-10 py-8",
              className,
            )}
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>

      <FloatingChat />
    </div>
  );
}

/* ── Shell raiz — entrada pública ────────────────────── */

export function Layout({
  children,
  contextSidebar,
  className,
  variant = "app",
}: LayoutProps) {
  if (variant === "public") {
    return (
      <PublicLayout className={className}>{children}</PublicLayout>
    );
  }

  // variant === 'app'
  return (
    <AppLayout contextSidebar={contextSidebar} className={className}>
      {children}
    </AppLayout>
  );
}

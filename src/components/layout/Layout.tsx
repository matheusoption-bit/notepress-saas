"use client";

import React from "react";
import { Header } from "./Header";
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { FloatingChat } from "./FloatingChat";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  /**
   * Sidebar contextual opcional (ex: SourcesSidebar no editor de notebooks).
   * É renderizada à direita da sidebar de navegação persistente.
   */
  contextSidebar?: React.ReactNode;
  /** Classe extra para o container principal de conteúdo */
  className?: string;
}

// ─── Área de conteúdo sensível ao estado da sidebar ───────────────────────────

function SidebarAwareContent({
  children,
  contextSidebar,
  className,
}: {
  children: React.ReactNode;
  contextSidebar?: React.ReactNode;
  className?: string;
}) {
  const { desktopCollapsed } = useSidebar();
  const sidebarWidth = desktopCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div
      className="flex pt-20 min-h-screen transition-[padding-left] duration-300 ease-in-out"
      style={{ paddingLeft: `${sidebarWidth}px` }}
    >
      {/* Sidebar contextual opcional (painel de fontes, versões, etc.) */}
      {contextSidebar && (
        <aside
          className={cn(
            "hidden lg:flex flex-col flex-shrink-0",
            "w-64 xl:w-72",
            "border-r border-[--color-border-default]",
            "bg-[--color-background-surface]",
            "sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto"
          )}
        >
          {contextSidebar}
        </aside>
      )}

      {/* Conteúdo principal */}
      <main
        className={cn(
          "flex-1 min-w-0",
          "px-4 sm:px-6 lg:px-8 py-8",
          className
        )}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}

// ─── Componente principal: Layout ─────────────────────────────────────────────

/**
 * Layout global para páginas protegidas do Notepress.
 *
 * Inclui automaticamente Header fixo e Sidebar de navegação persistente.
 *
 * Uso básico:
 * ```tsx
 * <Layout>
 *   <MeuConteudo />
 * </Layout>
 * ```
 *
 * Com sidebar contextual (ex: editor de notebooks):
 * ```tsx
 * <Layout contextSidebar={<SourcesSidebar />}>
 *   <TipTapEditor />
 * </Layout>
 * ```
 */
export function Layout({ children, contextSidebar, className }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[--color-background-base] text-[--color-text-primary]">
        {/* ── Header fixo ───────────────────────────────── */}
        <Header />

        {/* ── Sidebar de navegação persistente ─────────── */}
        <Sidebar />

        {/* ── Área de conteúdo (desloca conforme sidebar) ─ */}
        <SidebarAwareContent contextSidebar={contextSidebar} className={className}>
          {children}
        </SidebarAwareContent>

        {/* ── Chat flutuante global ──────────────────── */}
        <FloatingChat />
      </div>
    </SidebarProvider>
  );
}

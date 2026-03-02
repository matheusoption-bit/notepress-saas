"use client";

import React from "react";
import { Header } from "./Header";
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { FloatingChat } from "./FloatingChat";
import { cn } from "@/lib/utils";

/* ── Tipos ──────────────────────────────────────────── */

interface LayoutProps {
  children: React.ReactNode;
  /** Sidebar contextual opcional (SourcesSidebar, VersionsSidebar…) */
  contextSidebar?: React.ReactNode;
  /** Classes extras para o container de conteúdo */
  className?: string;
}

/* ── Content area com offset dinâmico ───────────────── */

function ContentArea({
  children,
  contextSidebar,
  className,
}: {
  children: React.ReactNode;
  contextSidebar?: React.ReactNode;
  className?: string;
}) {
  const { desktopCollapsed } = useSidebar();
  const sidebarW = desktopCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div
      className="flex pt-16 min-h-screen transition-[padding-left] duration-300 ease-in-out"
      style={{ paddingLeft: `${sidebarW}px` }}
    >
      {/* Context sidebar opcional */}
      {contextSidebar && (
        <aside
          className={cn(
            "hidden lg:flex flex-col flex-shrink-0",
            "w-64 xl:w-72",
            "border-r border-[var(--color-border-default)]",
            "bg-[var(--color-background-surface)]",
            "sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
          )}
        >
          {contextSidebar}
        </aside>
      )}

      {/* Main content — padding generoso */}
      <main
        className={cn(
          "flex-1 min-w-0",
          "px-6 sm:px-8 lg:px-10 py-8 lg:py-10",
          className
        )}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}

/* ── Layout shell ───────────────────────────────────── */

export function Layout({ children, contextSidebar, className }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[var(--color-background-base)] text-[var(--color-text-primary)]">
        <Header />
        <Sidebar />
        <ContentArea contextSidebar={contextSidebar} className={className}>
          {children}
        </ContentArea>
        <FloatingChat />
      </div>
    </SidebarProvider>
  );
}

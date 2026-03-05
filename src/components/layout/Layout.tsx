"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingChat } from "./FloatingChat";
import { WeatherBackground } from "@/components/atmosphere/WeatherBackground";
import { useFocusMode } from "@/components/focus/FocusModeProvider";

/* ── Types ───────────────────────────────────────────── */
interface LayoutProps {
  children: React.ReactNode;
  variant?: "public" | "app";
  contextSidebar?: React.ReactNode;
  className?: string;
}

/* ═══════════════════════════════════════════════════════
   VARIANT: PUBLIC — Apple-style minimal header
   ═══════════════════════════════════════════════════════ */
function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass-panel-static flex items-center px-6 gap-6">
      <Link
        href="/"
        className="flex items-center gap-2.5 select-none group"
        aria-label="Notepress"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
          N
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[--color-text-primary]">
          Notepress
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 ml-4">
        {[
          { href: "/editais", label: "Editais" },
          { href: "/pricing", label: "Preços" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-lg hover:bg-[--color-background-hover] transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="px-3 py-1.5 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/sign-up"
          className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
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
    <div className="min-h-screen text-[--color-text-primary] relative">
      <WeatherBackground />
      <PublicHeader />
      <main className={cn("pt-14 relative z-10", className)}>{children}</main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VARIANT: APP — Glass Sidebar + Header + Weather
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
  const { config } = useFocusMode();

  return (
    <div className="min-h-screen text-[--color-text-primary] flex relative">
      <WeatherBackground />

      {/* Sidebar — glass, auto-hide in focus modes */}
      <div
        className={cn(
          "sidebar-auto-hide transition-all duration-500 ease-out relative z-10",
          !config.sidebarVisible && "opacity-0 pointer-events-none -translate-x-full"
        )}
      >
        <DashboardSidebar />
      </div>

      {/* Main column */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-500",
          config.sidebarVisible ? "pl-20" : "pl-0"
        )}
      >
        {/* Header — auto-hide in ultra focus */}
        <div
          className={cn(
            "header-auto-hide transition-all duration-500 ease-out",
            !config.headerVisible && "opacity-0 pointer-events-none -translate-y-full"
          )}
        >
          <DashboardHeader />
        </div>

        <div className="flex flex-1 min-h-0">
          {contextSidebar && (
            <aside className="hidden lg:flex flex-col flex-shrink-0 w-64 xl:w-72 border-r border-[--glass-border] glass-panel-static sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
              {contextSidebar}
            </aside>
          )}

          <main
            className={cn(
              "flex-1 min-w-0",
              "px-6 sm:px-8 lg:px-10 py-8",
              className
            )}
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Floating chat — auto-hide */}
      <div
        className={cn(
          "chat-auto-hide transition-all duration-500 ease-out",
          !config.chatVisible && "opacity-0 pointer-events-none translate-x-full"
        )}
      >
        <FloatingChat />
      </div>
    </div>
  );
}

/* ── Shell raiz ──────────────────────────────────────── */
export function Layout({
  children,
  contextSidebar,
  className,
  variant = "app",
}: LayoutProps) {
  if (variant === "public") {
    return <PublicLayout className={className}>{children}</PublicLayout>;
  }
  return (
    <AppLayout contextSidebar={contextSidebar} className={className}>
      {children}
    </AppLayout>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Menu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

// ─── Subcomponente: Logo ──────────────────────────────────────────────────────

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 group select-none"
      aria-label="Notepress — página inicial"
    >
      {/* ícone estilizado */}
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg",
          "bg-[--color-primary] border border-[--color-primary]/30",
          "shadow-[0_0_12px_0_rgb(99_102_241_/_0.4)]",
          "group-hover:shadow-[0_0_20px_0_rgb(99_102_241_/_0.6)]",
          "transition-shadow duration-300"
        )}
      >
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
      </div>

      {/* wordmark */}
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          "text-[--color-text-primary]",
          "group-hover:text-white transition-colors duration-200"
        )}
      >
        Notepress
      </span>
    </Link>
  );
}

// ─── Subcomponente: PlanBadge ─────────────────────────────────────────────────

function PlanBadge() {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
        "bg-[--color-accent-subtle] border border-[--color-accent]/20",
        "cursor-default select-none"
      )}
      title="Seu plano atual"
    >
      <Zap className="w-3.5 h-3.5 text-[--color-accent-hover]" fill="currentColor" />
      <span className="text-xs font-semibold text-[--color-accent-hover]">
        Pro
      </span>
    </div>
  );
}

// ─── Componente principal: Header ─────────────────────────────────────────────

export function Header() {
  const { toggleMobile, mobileOpen } = useSidebar();
  const { isSignedIn } = useUser();

  return (
    <header
      className={cn(
        // posicionamento — z-50 garante ficar acima da sidebar (z-40)
        "fixed top-0 left-0 right-0 z-50",
        // dimensões
        "h-20",
        // fundo semi-transparente com blur
        "bg-[--color-background-base]/80 backdrop-blur-xl",
        // borda inferior sutil
        "border-b border-[--color-border-default]/60",
        // sombra discreta
        "shadow-[0_1px_0_0_rgb(255_255_255_/_0.04)]"
      )}
      role="banner"
    >
      {/* container interno */}
      <div className="flex items-center h-full px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto gap-4">

        {/* ── Esquerda: Logo ─────────────────────────── */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Spacer — empurra itens para a direita */}
        <div className="flex-1" aria-hidden="true" />

        {/* ── Direita ───────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Badge de plano — só desktop */}
          <div className="hidden sm:block">
            <PlanBadge />
          </div>

          {/* Separador */}
          <div
            className="hidden sm:block w-px h-5 bg-[--color-border-muted]"
            aria-hidden="true"
          />

          {/* Avatar Clerk com dropdown nativo */}
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: cn(
                    "w-8 h-8 ring-2 ring-[--color-border-muted]",
                    "hover:ring-[--color-primary]/50 transition-all duration-200"
                  ),
                  userButtonPopoverCard: cn(
                    "bg-[--color-background-surface]",
                    "border border-[--color-border-muted]",
                    "shadow-2xl"
                  ),
                  userButtonPopoverActionButton: cn(
                    "text-[--color-text-secondary]",
                    "hover:text-[--color-text-primary]",
                    "hover:bg-[--color-background-elevated]"
                  ),
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "hidden",
                },
              }}
              userProfileMode="navigation"
              userProfileUrl="/profile"
            />
          )}

          {/* Botão hamburger — controla Sidebar em mobile/tablet */}
          <button
            className={cn(
              "flex lg:hidden items-center justify-center w-9 h-9 rounded-lg",
              "text-[--color-text-secondary]",
              "hover:bg-[--color-background-elevated] hover:text-[--color-text-primary]",
              "border border-[--color-border-muted]",
              "transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[--color-primary]/60 outline-none"
            )}
            onClick={toggleMobile}
            aria-label={mobileOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={mobileOpen}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

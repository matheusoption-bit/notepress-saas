"use client";

import React from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { BookOpen, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

/* ── Logo ───────────────────────────────────────────── */

function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 group select-none"
      aria-label="Notepress — página inicial"
    >
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg",
          "bg-[var(--color-primary)] text-white"
        )}
      >
        <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
      </div>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
        Notepress
      </span>
    </Link>
  );
}

/* ── Header ─────────────────────────────────────────── */

export function Header() {
  const { mobileOpen, toggleMobile } = useSidebar();
  const { isSignedIn } = useUser();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "h-16",
        "bg-[var(--color-background-base)] backdrop-blur-sm",
        "border-b border-[var(--color-border-default)]"
      )}
      role="banner"
    >
      <div className="flex items-center h-full px-4 sm:px-5 gap-4">
        {/* Logo */}
        <Logo />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Avatar */}
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                  userButtonPopoverCard: cn(
                    "bg-[var(--color-background-surface)]",
                    "border border-[var(--color-border-default)]",
                    "shadow-[var(--shadow-lg)]"
                  ),
                  userButtonPopoverActionButton: cn(
                    "text-[var(--color-text-secondary)]",
                    "hover:text-[var(--color-text-primary)]",
                    "hover:bg-[var(--color-background-hover)]"
                  ),
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "hidden",
                },
              }}
              userProfileMode="navigation"
              userProfileUrl="/profile"
            />
          )}

          {/* Hamburger — mobile only */}
          <button
            className={cn(
              "flex lg:hidden items-center justify-center w-8 h-8 rounded-md",
              "text-[var(--color-text-secondary)]",
              "hover:bg-[var(--color-background-hover)]",
              "transition-colors duration-150"
            )}
            onClick={toggleMobile}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-4 h-4" strokeWidth={1.8} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botão de alternância de tema — Light / Dark / System.
 * Cicla entre os três modos a cada clique.
 * Versão compacta para header.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function cycle() {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  }

  const icon = !mounted ? (
    <Monitor className="w-4 h-4" strokeWidth={1.5} />
  ) : theme === "dark" ? (
    <Moon className="w-4 h-4" strokeWidth={1.5} />
  ) : theme === "light" ? (
    <Sun className="w-4 h-4" strokeWidth={1.5} />
  ) : (
    <Monitor className="w-4 h-4" strokeWidth={1.5} />
  );

  const label = !mounted
    ? "Tema"
    : theme === "dark"
      ? "Modo escuro"
      : theme === "light"
        ? "Modo claro"
        : "Tema do sistema";

  return (
    <button
      onClick={cycle}
      title={label}
      aria-label={label}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg",
        "text-[--color-text-secondary]",
        "hover:bg-[--color-background-hover] hover:text-[--color-text-primary]",
        "transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[--color-border-focus] outline-none"
      )}
    >
      {icon}
    </button>
  );
}

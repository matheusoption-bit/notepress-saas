"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Radar,
  Lightbulb,
  CreditCard,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

/* ── Constantes ─────────────────────────────────────── */

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 60;

/* ── Nav data ───────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard",        href: "/dashboard",  icon: LayoutDashboard },
  { label: "Meus Notebooks",   href: "/notebooks",  icon: BookOpen        },
  { label: "Radar de Editais", href: "/editais",    icon: Radar           },
  { label: "Minhas Soluções",  href: "/solucoes",   icon: Lightbulb       },
];

const NAV_BOTTOM: NavItem[] = [
  { label: "Preços",         href: "/pricing",  icon: CreditCard },
  { label: "Configurações",  href: "/settings", icon: Settings   },
];

/* ── NavLink ────────────────────────────────────────── */

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[13px] font-medium",
        "transition-colors duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1",
        collapsed
          ? "justify-center w-9 h-9 mx-auto"
          : "gap-2.5 px-3 py-2 w-full",
        active
          ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-hover)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {/* Active indicator bar */}
      {active && !collapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-primary)]"
          aria-hidden
        />
      )}

      <Icon
        className={cn(
          "flex-shrink-0 transition-colors duration-150",
          collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
          active
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
        )}
        strokeWidth={active ? 2.2 : 1.8}
      />

      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Active dot — collapsed */}
      {active && collapsed && (
        <span
          className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-l-full bg-[var(--color-primary)]"
          aria-hidden
        />
      )}

      {/* Tooltip — collapsed */}
      {collapsed && (
        <span
          className={cn(
            "pointer-events-none absolute left-full ml-2.5 z-50",
            "hidden group-hover:flex items-center",
            "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
            "bg-[var(--color-background-elevated)] text-[var(--color-text-primary)]",
            "border border-[var(--color-border-default)]",
            "shadow-[var(--shadow-md)]"
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

/* ── Sidebar ────────────────────────────────────────── */

export function Sidebar() {
  const { mobileOpen, desktopCollapsed, closeMobile, toggleDesktop } = useSidebar();
  const width = desktopCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-[var(--color-background-overlay)] lg:hidden",
          "transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
        aria-hidden
      />

      {/* Panel */}
      <aside
        style={{ width: `${width}px` }}
        className={cn(
          "fixed top-16 left-0 bottom-0 z-40",
          "flex flex-col",
          "bg-[var(--color-background-surface)]",
          "border-r border-[var(--color-border-default)]",
          "transition-[transform,width] duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navegação principal"
      >
        {/* ── Collapse toggle (desktop) ─────────────── */}
        <div
          className={cn(
            "hidden lg:flex items-center flex-shrink-0 h-11",
            desktopCollapsed ? "justify-center px-2" : "justify-end px-3"
          )}
        >
          <button
            onClick={toggleDesktop}
            aria-label={desktopCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md",
              "text-[var(--color-text-muted)]",
              "hover:bg-[var(--color-background-hover)] hover:text-[var(--color-text-secondary)]",
              "transition-colors duration-150"
            )}
          >
            {desktopCollapsed ? (
              <PanelLeft className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* ── Nav principal ─────────────────────────── */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "py-2",
            desktopCollapsed ? "px-2.5 space-y-1" : "px-3 space-y-0.5"
          )}
        >
          {!desktopCollapsed && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--color-text-muted)] select-none">
              Menu
            </p>
          )}

          {NAV_MAIN.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={desktopCollapsed}
              onClick={closeMobile}
            />
          ))}
        </nav>

        {/* ── Rodapé ─────────────────────────────────── */}
        <div
          className={cn(
            "flex-shrink-0",
            "border-t border-[var(--color-border-default)]",
            "py-2",
            desktopCollapsed ? "px-2.5 space-y-1" : "px-3 space-y-0.5"
          )}
        >
          {NAV_BOTTOM.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={desktopCollapsed}
              onClick={closeMobile}
            />
          ))}

          {/* Theme switcher — na base da sidebar */}
          <div className={cn(
            "pt-1",
            desktopCollapsed ? "flex justify-center" : "px-1"
          )}>
            <ThemeSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}

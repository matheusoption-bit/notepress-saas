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
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

// ─── Constantes ───────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 64;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ─── Dados de navegação ───────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",        href: "/dashboard",  icon: LayoutDashboard },
  { label: "Meus Notebooks",   href: "/notebooks",  icon: BookOpen        },
  { label: "Radar de Editais", href: "/editais",    icon: Radar           },
  { label: "Minhas Soluções",  href: "/solucoes",   icon: Lightbulb       },
  { label: "Preços",           href: "/pricing",    icon: CreditCard      },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Configurações", href: "/settings", icon: Settings },
];

// ─── Subcomponente: SidebarNavLink ────────────────────────────────────────────

function SidebarNavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
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
        "group relative flex items-center rounded-xl text-sm font-medium",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[--color-primary]/60",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5 w-full",
        isActive
          ? [
              "bg-[--color-primary-subtle] text-[--color-primary-hover]",
              "border border-[--color-primary]/20",
              "shadow-[inset_0_1px_0_0_rgb(99_102_241_/_0.1)]",
            ]
          : [
              "text-[--color-text-secondary] border border-transparent",
              "hover:bg-[--color-background-elevated]",
              "hover:text-[--color-text-primary]",
              "hover:border-[--color-border-muted]",
            ]
      )}
    >
      {/* Glow no item ativo */}
      {isActive && !collapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[--color-primary]"
          aria-hidden="true"
        />
      )}

      {/* Ícone */}
      <Icon
        className={cn(
          "flex-shrink-0 transition-colors duration-200",
          collapsed ? "w-5 h-5" : "w-4 h-4",
          isActive
            ? "text-[--color-primary-hover]"
            : "text-[--color-text-muted] group-hover:text-[--color-text-secondary]"
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />

      {/* Label (oculto quando colapsado) */}
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}

      {/* Indicador de ativo quando colapsado */}
      {isActive && collapsed && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-l-full bg-[--color-primary]"
          aria-hidden="true"
        />
      )}

      {/* Tooltip para modo colapsado */}
      {collapsed && (
        <span
          className={cn(
            "pointer-events-none absolute left-full ml-3 z-50",
            "hidden group-hover:flex items-center",
            "px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
            "bg-[--color-background-elevated] text-[--color-text-primary]",
            "border border-[--color-border-muted]",
            "shadow-lg shadow-black/30"
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

// ─── Subcomponente: PlanBadge ─────────────────────────────────────────────────

function PlanBadge({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 mx-auto rounded-xl",
          "bg-[--color-accent-subtle] border border-[--color-accent]/20"
        )}
        title="Plano Pro"
      >
        <Zap
          className="w-4 h-4 text-[--color-accent-hover]"
          fill="currentColor"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-xl",
        "bg-gradient-to-br from-[--color-accent-subtle] to-[--color-primary-subtle]",
        "border border-[--color-accent]/15"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
          "bg-[--color-accent]/20 border border-[--color-accent]/30"
        )}
      >
        <Zap className="w-4 h-4 text-[--color-accent-hover]" fill="currentColor" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[--color-text-primary] leading-tight">
          Plano Pro
        </p>
        <p className="text-[10px] text-[--color-text-muted] leading-tight mt-0.5 truncate">
          Todos os recursos ativos
        </p>
      </div>
    </div>
  );
}

// ─── Subcomponente: CollapseButton ────────────────────────────────────────────

function CollapseButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      className={cn(
        "group flex items-center justify-center",
        "w-6 h-6 rounded-full",
        "bg-[--color-background-surface] border border-[--color-border-muted]",
        "text-[--color-text-muted]",
        "hover:bg-[--color-background-elevated] hover:text-[--color-text-primary]",
        "hover:border-[--color-border-focus]",
        "transition-all duration-200 shadow-md",
        "focus-visible:ring-2 focus-visible:ring-[--color-primary]/60 outline-none"
      )}
    >
      {collapsed ? (
        <ChevronRight className="w-3 h-3" />
      ) : (
        <ChevronLeft className="w-3 h-3" />
      )}
    </button>
  );
}

// ─── Componente principal: Sidebar ────────────────────────────────────────────

export function Sidebar() {
  const { mobileOpen, desktopCollapsed, closeMobile, toggleDesktop } =
    useSidebar();

  const sidebarWidth = desktopCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH;

  return (
    <>
      {/* ── Overlay mobile ────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-300",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Painel da Sidebar ─────────────────────────── */}
      <aside
        style={{
          width: `${sidebarWidth}px`,
        }}
        className={cn(
          // posicionamento
          "fixed top-20 left-0 bottom-0 z-40",
          // fundo e borda
          "bg-[--color-background-surface]",
          "border-r border-[--color-border-default]",
          // sombra sutil
          "shadow-[1px_0_0_0_rgb(255_255_255_/_0.03)]",
          // layout interno
          "flex flex-col overflow-hidden",
          // transições
          "transition-[transform,width] duration-300 ease-in-out",
          // mobile: slide-in/out
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navegação principal"
      >
        {/* ── Botão de colapsar (só desktop) ──────────── */}
        <div
          className={cn(
            "hidden lg:flex items-center h-14 px-4 flex-shrink-0",
            desktopCollapsed ? "justify-center" : "justify-end",
            "border-b border-[--color-border-default]/50"
          )}
        >
          <CollapseButton
            collapsed={desktopCollapsed}
            onClick={toggleDesktop}
          />
        </div>

        {/* ── Navegação principal ──────────────────────── */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "py-4",
            desktopCollapsed ? "px-2" : "px-3",
            "space-y-1"
          )}
        >
          {/* Cabeçalho de seção */}
          {!desktopCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[--color-text-muted] select-none">
              Menu
            </p>
          )}

          {NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              collapsed={desktopCollapsed}
              onClick={closeMobile}
            />
          ))}
        </nav>

        {/* ── Rodapé ───────────────────────────────────── */}
        <div
          className={cn(
            "flex-shrink-0 border-t border-[--color-border-default]/50",
            "py-3",
            desktopCollapsed ? "px-2 space-y-2" : "px-3 space-y-1"
          )}
        >
          {/* Badge do plano */}
          {!desktopCollapsed && (
            <div className="mb-3">
              <PlanBadge collapsed={desktopCollapsed} />
            </div>
          )}
          {desktopCollapsed && (
            <div className="mb-2">
              <PlanBadge collapsed={desktopCollapsed} />
            </div>
          )}

          {/* Item de Configurações */}
          {BOTTOM_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              collapsed={desktopCollapsed}
              onClick={closeMobile}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

// ─── Exports de utilidade ─────────────────────────────────────────────────────

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Radar,
  Lightbulb,
  CreditCard,
  Settings,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FocusModeSwitcher } from "@/components/focus/FocusModeSwitcher";

/* ── Nav data ───────────────────────────────────────── */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Notebooks", href: "/notebooks", icon: BookOpen },
  { label: "Radar de Editais", href: "/editais", icon: Radar },
  { label: "Minhas Soluções", href: "/solucoes", icon: Lightbulb },
];

const NAV_BOTTOM: NavItem[] = [
  { label: "Preços", href: "/pricing", icon: CreditCard },
  { label: "Configurações", href: "/settings", icon: Settings },
];

/* ── NavLink ────────────────────────────────────────── */
function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
        active
          ? "text-white"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon size={18} className="relative z-10 shrink-0" />
      <span className="text-sm font-medium nav-text relative z-10">
        {item.label}
      </span>
    </Link>
  );
}

/* ── Sidebar ────────────────────────────────────────── */
export function DashboardSidebar() {
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "sidebar-group fixed top-0 left-0 h-screen z-50",
        "w-20 hover:w-64 transition-all duration-300 ease-out",
        "glass-panel-static flex flex-col",
        "border-r border-[--glass-border]"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20 shrink-0">
          N
        </div>
        <span className="text-lg font-semibold tracking-tight text-white nav-text">
          Notepress
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Separator */}
        <div className="my-4 h-px bg-white/[0.06]" />

        {/* Focus Mode Switcher */}
        <div className="nav-text">
          <FocusModeSwitcher />
        </div>

        {/* Compact focus switcher when collapsed */}
        <div className="flex justify-center sidebar-group-collapsed-only">
          <FocusModeSwitcher compact />
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-2 space-y-1">
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-white/[0.06] mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer overflow-hidden">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Foto de perfil"
              src={user.imageUrl}
              className="h-8 w-8 rounded-2xl object-cover shrink-0 border border-white/[0.08]"
            />
          ) : (
            <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/[0.08] flex items-center justify-center shrink-0">
              <span className="text-white/60 text-xs font-medium">
                {user?.firstName?.[0] ?? "U"}
              </span>
            </div>
          )}
          <div className="flex flex-col nav-text">
            <span className="text-sm font-medium text-white leading-none">
              {user?.firstName ?? "Usuário"}
            </span>
            <span className="text-[10px] font-semibold text-indigo-400 mt-1 uppercase tracking-wide">
              Pro Plan
            </span>
          </div>
          <Settings size={16} className="text-white/20 ml-auto nav-text" />
        </div>
      </div>
    </aside>
  );
}

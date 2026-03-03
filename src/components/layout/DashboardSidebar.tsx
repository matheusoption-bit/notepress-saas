"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

/* ── Nav items ──────────────────────────────────────── */

const NAV_ITEMS = [
  { href: "/dashboard",  icon: "dashboard",   label: "Dashboard"       },
  { href: "/editais",    icon: "radar",        label: "Radar de Editais" },
  { href: "/notebooks",  icon: "folder_open",  label: "Notebooks"       },
  { href: "/ia",         icon: "smart_toy",    label: "Soluções de IA"  },
];

/* ── Componente ─────────────────────────────────────── */

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="sidebar-group fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#09090b] border-r border-white/10 flex flex-col transition-all duration-300 z-50 overflow-hidden shadow-2xl">

      {/* Logo */}
      <div className="h-20 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 text-white">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bolt</span>
          </div>
          <span className="text-lg font-bold text-white nav-text tracking-tight">
            Notepress
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 py-6">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-4 px-3 py-3 rounded-xl overflow-hidden transition-colors",
                active
                  ? "bg-white/5 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {/* Indicador lateral ativo */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-violet-600 rounded-r-full" />
              )}

              <span
                className={cn(
                  "material-symbols-outlined shrink-0",
                  active ? "text-violet-400" : ""
                )}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium nav-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer overflow-hidden">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Foto de perfil"
              src={user.imageUrl}
              className="h-8 w-8 rounded-2xl object-cover shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-8 w-8 rounded-2xl bg-violet-600/30 border border-white/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-violet-400" style={{ fontSize: 18 }}>
                person
              </span>
            </div>
          )}

          <div className="flex flex-col nav-text">
            <span className="text-sm font-medium text-white leading-none">
              {user?.firstName ?? "Usuário"}
            </span>
            <span className="text-[10px] font-semibold text-violet-400 mt-1 uppercase tracking-wide">
              Pro Plan
            </span>
          </div>

          <span className="material-symbols-outlined text-zinc-500 ml-auto nav-text" style={{ fontSize: 20 }}>
            settings
          </span>
        </div>
      </div>
    </aside>
  );
}

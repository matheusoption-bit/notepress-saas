"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SidebarContextType {
  /** Sidebar aberta em mobile/tablet */
  mobileOpen: boolean;
  /** Sidebar colapsada em desktop (icon-only) */
  desktopCollapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const toggleDesktop = useCallback(() => setDesktopCollapsed((v) => !v), []);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        desktopCollapsed,
        openMobile,
        closeMobile,
        toggleMobile,
        toggleDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function useSidebar(): SidebarContextType {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar deve ser utilizado dentro de <SidebarProvider>");
  }
  return ctx;
}

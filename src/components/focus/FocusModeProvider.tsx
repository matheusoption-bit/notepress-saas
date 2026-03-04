"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

/* ── Focus Mode Types ────────────────────────────────── */
export type FocusMode = "flow" | "deep" | "ultra" | "creative";

export interface FocusModeConfig {
  id: FocusMode;
  label: string;
  description: string;
  icon: string;
  /** Whether sidebar is visible */
  sidebarVisible: boolean;
  /** Whether chat widget is visible */
  chatVisible: boolean;
  /** Whether header is visible */
  headerVisible: boolean;
  /** Spotify playlist suggestion */
  spotifyPlaylist: string;
  spotifyPlaylistName: string;
  /** CSS class applied to body */
  bodyClass: string;
  /** Accent override */
  accentHue: number;
}

export const FOCUS_MODES: Record<FocusMode, FocusModeConfig> = {
  flow: {
    id: "flow",
    label: "Flow",
    description: "Modo padrão — tudo visível, interface completa",
    icon: "waves",
    sidebarVisible: true,
    chatVisible: true,
    headerVisible: true,
    spotifyPlaylist: "37i9dQZF1DX8Uebhn9wzrS",
    spotifyPlaylistName: "Chill Lofi Study Beats",
    bodyClass: "focus-flow",
    accentHue: 260,
  },
  deep: {
    id: "deep",
    label: "Foco Profundo",
    description: "Sidebar recolhida, chat minimizado, foco no conteúdo",
    icon: "target",
    sidebarVisible: false,
    chatVisible: false,
    headerVisible: true,
    spotifyPlaylist: "37i9dQZF1DWZeKCadgRdKQ",
    spotifyPlaylistName: "Focus Editais",
    bodyClass: "focus-deep",
    accentHue: 220,
  },
  ultra: {
    id: "ultra",
    label: "Ultra Foco",
    description: "Zero distração — apenas o editor, nada mais",
    icon: "zap",
    sidebarVisible: false,
    chatVisible: false,
    headerVisible: false,
    spotifyPlaylist: "37i9dQZF1DX4sWSpwq3LiO",
    spotifyPlaylistName: "Peaceful Piano",
    bodyClass: "focus-ultra",
    accentHue: 200,
  },
  creative: {
    id: "creative",
    label: "Criativo",
    description: "Brainstorm mode — cores vibrantes, tudo aberto",
    icon: "sparkles",
    sidebarVisible: true,
    chatVisible: true,
    headerVisible: true,
    spotifyPlaylist: "37i9dQZF1DX56bqlsMxJYR",
    spotifyPlaylistName: "Brainstorm Noturno",
    bodyClass: "focus-creative",
    accentHue: 300,
  },
};

/* ── Context ─────────────────────────────────────────── */
interface FocusModeContextValue {
  mode: FocusMode;
  config: FocusModeConfig;
  setMode: (mode: FocusMode) => void;
  cycleMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextValue | null>(null);

const STORAGE_KEY = "notepress_focus_mode";
const MODE_ORDER: FocusMode[] = ["flow", "deep", "ultra", "creative"];

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<FocusMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in FOCUS_MODES) return saved as FocusMode;
    }
    return "flow";
  });

  const setMode = useCallback((newMode: FocusMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((prev) => {
      const idx = MODE_ORDER.indexOf(prev);
      const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  // Apply body class
  useEffect(() => {
    const config = FOCUS_MODES[mode];
    document.body.classList.remove(
      "focus-flow",
      "focus-deep",
      "focus-ultra",
      "focus-creative"
    );
    document.body.classList.add(config.bodyClass);

    // Set CSS custom property for accent hue
    document.documentElement.style.setProperty(
      "--focus-accent-hue",
      String(config.accentHue)
    );
  }, [mode]);

  const config = FOCUS_MODES[mode];

  return (
    <FocusModeContext.Provider value={{ mode, config, setMode, cycleMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const ctx = useContext(FocusModeContext);
  if (!ctx) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }
  return ctx;
}

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusMode } from "@/components/focus/FocusModeProvider";

/* ── Types ───────────────────────────────────────────── */
interface Playlist {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  icon: string;
  spotifyUri?: string;
}

/* ── Curated playlists by mode ───────────────────────── */
const PLAYLISTS: Playlist[] = [
  {
    id: "focus-editais",
    name: "Focus Editais",
    description: "Concentração profunda para análise de editais",
    coverGradient: "from-indigo-600 to-blue-700",
    icon: "🎯",
    spotifyUri: "spotify:playlist:37i9dQZF1DX5trt9i14X7j",
  },
  {
    id: "brainstorm-noturno",
    name: "Brainstorm Noturno",
    description: "Criatividade livre para sessões noturnas",
    coverGradient: "from-violet-600 to-purple-700",
    icon: "🌙",
    spotifyUri: "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    id: "vibe-fapesp",
    name: "Vibe FAPESP",
    description: "Energia para escrever propostas vencedoras",
    coverGradient: "from-emerald-600 to-teal-700",
    icon: "🚀",
    spotifyUri: "spotify:playlist:37i9dQZF1DX8NTLI2TtZa6",
  },
  {
    id: "deep-work",
    name: "Deep Work",
    description: "Silêncio produtivo com ambient sounds",
    coverGradient: "from-slate-600 to-zinc-700",
    icon: "🧠",
    spotifyUri: "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO",
  },
  {
    id: "cafe-academico",
    name: "Café Acadêmico",
    description: "Lo-fi beats para leitura e pesquisa",
    coverGradient: "from-amber-600 to-orange-700",
    icon: "☕",
    spotifyUri: "spotify:playlist:37i9dQZF1DXc8kgYqQLMfH",
  },
];

/* ── Mini player bar ─────────────────────────────────── */
function MiniPlayer({ playlist }: { playlist: Playlist }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      {/* Cover */}
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg shadow-lg",
          playlist.coverGradient
        )}
      >
        {playlist.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[--color-text-primary] truncate">
          {playlist.name}
        </p>
        <p className="text-[10px] text-[--color-text-muted] truncate">
          {playlist.description}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 text-[--color-text-muted] hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
          aria-label="Anterior"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 text-white bg-[--color-primary] hover:bg-[--color-primary-hover] rounded-full transition-colors shadow-lg shadow-indigo-500/20"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        <button
          className="p-1.5 text-[--color-text-muted] hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
          aria-label="Próxima"
        >
          <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Playlist card ───────────────────────────────────── */
function PlaylistCard({
  playlist,
  isActive,
  onSelect,
}: {
  playlist: Playlist;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
        isActive
          ? "bg-white/[0.06] border border-white/[0.1]"
          : "hover:bg-white/[0.03] border border-transparent"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg shadow-md",
          playlist.coverGradient
        )}
      >
        {playlist.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-text-primary] truncate">
          {playlist.name}
        </p>
        <p className="text-[10px] text-[--color-text-muted] truncate">
          {playlist.description}
        </p>
      </div>
      {isActive && (
        <div className="shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((bar) => (
              <motion.div
                key={bar}
                className="w-0.5 bg-[--color-primary] rounded-full"
                animate={{
                  height: [4, 12, 6, 10, 4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: bar * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.button>
  );
}

/* ── Main Widget ─────────────────────────────────────── */
export function SpotifyWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const { mode } = useFocusMode();

  // Auto-suggest playlist based on focus mode
  const suggestedPlaylist = React.useMemo(() => {
    switch (mode) {
      case "deep":
        return PLAYLISTS.find((p) => p.id === "deep-work") ?? PLAYLISTS[0];
      case "ultra":
        return PLAYLISTS.find((p) => p.id === "focus-editais") ?? PLAYLISTS[0];
      case "creative":
        return PLAYLISTS.find((p) => p.id === "brainstorm-noturno") ?? PLAYLISTS[0];
      default:
        return PLAYLISTS.find((p) => p.id === "cafe-academico") ?? PLAYLISTS[0];
    }
  }, [mode]);

  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Music size={16} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-[--color-text-primary]">
              Spotify
            </h3>
            <p className="text-[10px] text-[--color-text-muted]">
              Playlists para produtividade
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-[--color-text-muted]" />
        ) : (
          <ChevronDown size={16} className="text-[--color-text-muted]" />
        )}
      </button>

      {/* Mini player (always visible) */}
      <div className="px-5 pb-4">
        <MiniPlayer playlist={activePlaylist} />
      </div>

      {/* Expanded: playlist list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-1">
              {/* Suggestion banner */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[--color-primary-subtle] border border-[--color-primary]/10 mb-3">
                <Headphones size={14} className="text-[--color-primary] shrink-0" />
                <p className="text-xs text-[--color-primary]">
                  Sugestão para modo{" "}
                  <span className="font-semibold capitalize">{mode}</span>:{" "}
                  <button
                    onClick={() => setActivePlaylist(suggestedPlaylist)}
                    className="underline hover:no-underline font-medium"
                  >
                    {suggestedPlaylist.name}
                  </button>
                </p>
              </div>

              {/* Playlist list */}
              {PLAYLISTS.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  isActive={activePlaylist.id === playlist.id}
                  onSelect={() => setActivePlaylist(playlist)}
                />
              ))}

              {/* Spotify link */}
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl text-xs font-medium text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-white/[0.03] transition-colors"
              >
                Abrir no Spotify
                <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

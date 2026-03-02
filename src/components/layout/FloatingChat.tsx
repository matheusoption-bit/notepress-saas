"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Olá! Sou o assistente Notepress. Posso te ajudar a encontrar editais, analisar aderência ou criar notebooks estratégicos.",
    timestamp: new Date(),
  },
];

/* ── MessageBubble ──────────────────────────────────── */

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mb-0.5 bg-[var(--color-primary-subtle)]">
          <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed",
          isUser
            ? "bg-[var(--color-primary)] text-white rounded-br-sm"
            : "bg-[var(--color-background-hover)] text-[var(--color-text-primary)] rounded-bl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

/* ── FloatingChat ───────────────────────────────────── */

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(WELCOME);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, minimized]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [
        ...p,
        { id: `a-${Date.now()}`, role: "assistant", content: "Em breve o Notepress IA estará integrado. Por enquanto estou em modo preview.", timestamp: new Date() },
      ]);
    }, 800);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <>
      {/* ── Chat panel ──────────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-40 w-[340px] sm:w-[380px]",
          "flex flex-col overflow-hidden",
          "rounded-xl border border-[var(--color-border-default)]",
          "bg-[var(--color-background-surface)]",
          "shadow-[var(--shadow-xl)]",
          "transition-all duration-200 ease-out origin-bottom-right",
          open && !minimized
            ? "opacity-100 scale-100 pointer-events-auto"
            : minimized
              ? "opacity-100 scale-100 pointer-events-auto h-auto"
              : "opacity-0 scale-95 pointer-events-none translate-y-1"
        )}
        style={{ maxHeight: minimized ? "auto" : "480px" }}
        role="dialog"
        aria-label="Chat Notepress IA"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-primary-subtle)]">
              <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-tight">Notepress IA</p>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5">Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMinimized((v) => !v)} className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-background-hover)] transition-colors" aria-label="Minimizar">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-background-hover)] transition-colors" aria-label="Fechar">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((m) => <Bubble key={m.id} message={m} />)}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-t border-[var(--color-border-default)]">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Pergunte algo…"
                className={cn(
                  "flex-1 min-w-0 h-8 px-3 rounded-lg text-[13px]",
                  "bg-[var(--color-background-hover)] border border-[var(--color-border-default)]",
                  "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
                  "outline-none focus:border-[var(--color-border-focus)]",
                  "transition-colors duration-150"
                )}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                  "bg-[var(--color-primary)] text-white",
                  "hover:bg-[var(--color-primary-hover)]",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  "transition-colors duration-150 active:scale-95"
                )}
                aria-label="Enviar"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────── */}
      <button
        onClick={() => { setOpen((v) => !v); setMinimized(false); }}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-40",
          "flex items-center justify-center w-11 h-11",
          "rounded-full",
          "bg-[var(--color-background-elevated)] text-[var(--color-text-secondary)]",
          "border border-[var(--color-border-default)]",
          "hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-muted)]",
          "transition-all duration-200 active:scale-95"
        )}
      >
        {/* Dot */}
        <span className={cn(
          "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
          "bg-[var(--color-primary)]",
          "transition-opacity duration-200",
          open ? "opacity-0" : "opacity-100"
        )} />

        <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-150", open ? "opacity-100 rotate-0" : "opacity-0 rotate-90")}>
          <X className="w-4 h-4" />
        </span>
        <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-150", open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0")}>
          <Sparkles className="w-4 h-4" />
        </span>
      </button>
    </>
  );
}

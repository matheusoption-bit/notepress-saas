"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Mensagens iniciais (placeholder) ────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Olá! Sou o assistente Notepress. Posso te ajudar a encontrar editais, analisar aderência da sua empresa ou criar notebooks estratégicos. Como posso ajudar?",
    timestamp: new Date(),
  },
];

// ─── Subcomponente: Bolha de mensagem ─────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-2.5 items-end",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mb-0.5",
            "bg-[--color-primary-subtle] border border-[--color-primary]/20"
          )}
        >
          <Sparkles className="w-3 h-3 text-[--color-primary-hover]" />
        </div>
      )}

      {/* Texto */}
      <div
        className={cn(
          "max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
          isUser
            ? [
                "bg-[--color-primary] text-white",
                "rounded-br-sm",
              ]
            : [
                "bg-[--color-background-elevated] text-[--color-text-primary]",
                "border border-[--color-border-muted]",
                "rounded-bl-sm",
              ]
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Componente principal: FloatingChat ───────────────────────────────────────

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Foca o input quando abre
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Resposta placeholder após 800ms
    setTimeout(() => {
      const reply: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content:
          "Entendido! Em breve o assistente Notepress IA estará totalmente integrado. Por enquanto estou em modo de preview. Fique ligado! 🚀",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      {/* ── Painel de chat ──────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-40 w-[340px] sm:w-[380px]",
          "flex flex-col overflow-hidden",
          "rounded-2xl border border-[--color-border-muted]",
          "bg-[--color-background-surface]",
          "shadow-[0_24px_64px_0_rgb(0_0_0_/_0.7)]",
          "transition-all duration-300 ease-in-out origin-bottom-right",
          open && !minimized
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : minimized
              ? "opacity-100 scale-100 pointer-events-auto translate-y-0 h-auto"
              : "opacity-0 scale-95 pointer-events-none translate-y-2"
        )}
        style={{ maxHeight: minimized ? "auto" : "540px" }}
        role="dialog"
        aria-label="Chat com assistente Notepress"
        aria-modal="false"
      >
        {/* ── Header do painel ──────── */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 flex-shrink-0",
            "border-b border-[--color-border-default]",
            "bg-[--color-background-surface]"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                "bg-[--color-primary-subtle] border border-[--color-primary]/20"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[--color-primary-hover]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[--color-text-primary] leading-tight">
                Notepress IA
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[--color-success] animate-pulse" />
                <span className="text-[10px] text-[--color-text-muted]">
                  Online · Preview
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((v) => !v)}
              aria-label={minimized ? "Expandir chat" : "Minimizar chat"}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                "text-[--color-text-muted] hover:text-[--color-text-primary]",
                "hover:bg-[--color-background-elevated]",
                "transition-colors duration-150"
              )}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                "text-[--color-text-muted] hover:text-[--color-text-primary]",
                "hover:bg-[--color-background-elevated]",
                "transition-colors duration-150"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Área de mensagens ─────── */}
        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ─────────────────── */}
            <div
              className={cn(
                "flex-shrink-0 flex items-center gap-2 p-3",
                "border-t border-[--color-border-default]"
              )}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre editais, notebooks…"
                className={cn(
                  "flex-1 min-w-0 h-9 px-3 rounded-xl text-sm",
                  "bg-[--color-background-elevated] border border-[--color-border-muted]",
                  "text-[--color-text-primary] placeholder:text-[--color-text-muted]",
                  "outline-none focus:border-[--color-primary]/50",
                  "transition-colors duration-150"
                )}
                aria-label="Mensagem para o assistente"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Enviar mensagem"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0",
                  "bg-[--color-primary] text-white",
                  "border border-[--color-primary]/30",
                  "transition-all duration-150",
                  "hover:bg-[--color-primary-hover]",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[--color-primary]",
                  "active:scale-95"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── FAB — botão flutuante ───────────────────── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setMinimized(false);
        }}
        aria-label={open ? "Fechar assistente" : "Abrir assistente Notepress IA"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-40",
          "flex items-center justify-center w-13 h-13",
          "rounded-full",
          "bg-[--color-primary] text-white",
          "border border-[--color-primary]/30",
          "shadow-[0_0_0_4px_rgb(99_102_241_/_0.12),var(--shadow-lg)]",
          "hover:bg-[--color-primary-hover]",
          "hover:shadow-[0_0_0_6px_rgb(99_102_241_/_0.18),var(--shadow-xl)]",
          "transition-all duration-200 active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-[--color-primary]/60 outline-none"
        )}
        style={{ width: 52, height: 52 }}
      >
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-all duration-200",
            open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
          )}
        >
          <X className="w-5 h-5" />
        </span>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-all duration-200",
            open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
          )}
        >
          <MessageCircle className="w-5 h-5" />
        </span>
      </button>
    </>
  );
}

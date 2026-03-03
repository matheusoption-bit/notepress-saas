'use client';

/**
 * ModalApiTokenConfig — Modal glassmorphism reutilizável para configurar
 * tokens de APIs externas (Lens.org, SerpApi, etc.).
 *
 * O token é enviado em plain-text para o PATCH /api/user/profile;
 * a criptografia AES-256-GCM acontece no servidor antes de persistir.
 *
 * Uso para Lens.org:
 *   <ModalApiTokenConfig
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => toast.success('Lens.org configurado!')}
 *     title="Configurar Lens.org"
 *     description="Gere um token em lens.org/user/subscriptions e cole abaixo."
 *     linkUrl="https://lens.org/user/subscriptions"
 *     linkLabel="Abrir Lens.org →"
 *     fieldName="lensApiToken"
 *   />
 *
 * Uso para SerpApi:
 *   fieldName="serpApiKey"
 *   linkUrl="https://serpapi.com/manage-api-key"
 */

import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ── Props ──────────────────────────────────────────────────────
export interface ModalApiTokenConfigProps {
  /** Controla a visibilidade do modal */
  isOpen: boolean;
  /** Chamado ao fechar (X ou backdrop) */
  onClose: () => void;
  /** Chamado após salvar com sucesso */
  onSuccess?: () => void;
  /** Título do modal */
  title: string;
  /** Texto explicativo sobre o token */
  description: string;
  /** URL para o usuário obter o token */
  linkUrl?: string;
  /** Texto do link (ex.: "Gerar token na Lens.org →") */
  linkLabel?: string;
  /** Nome do campo em UserProfile (ex.: "lensApiToken" | "serpApiKey") */
  fieldName: 'lensApiToken' | 'serpApiKey';
  /** Placeholder do input */
  placeholder?: string;
}

// ── Constantes de estilo (glass-panel) ─────────────────────────
const S = {
  backdrop: [
    'fixed inset-0 z-50',
    'flex items-center justify-center p-4',
    'bg-black/80 backdrop-blur-md',
  ].join(' '),

  panel: [
    'relative w-full max-w-md',
    'rounded-2xl',
    'border border-white/10',
    'bg-gradient-to-br from-[#0f0f19]/95 to-[#14142380]/95',
    'backdrop-blur-xl',
    'shadow-[0_24px_80px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.05)_inset]',
    'text-white',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────
export default function ModalApiTokenConfig({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  linkUrl,
  linkLabel,
  fieldName,
  placeholder = 'Cole o token aqui…',
}: ModalApiTokenConfigProps) {
  const inputId   = useId();
  const inputRef  = useRef<HTMLInputElement>(null);

  const [token,    setToken]    = useState('');
  const [visible,  setVisible]  = useState(false);
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Foca o input ao abrir
  useEffect(() => {
    if (isOpen) {
      setToken('');
      setVisible(false);
      setStatus('idle');
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  async function handleSave() {
    const trimmed = token.trim();
    if (!trimmed) {
      setErrorMsg('Por favor, insira o token antes de salvar.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Erro ${res.status}`);
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido.');
      setStatus('error');
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className={S.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={S.panel}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Ícone cadeado */}
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
              <Lock size={16} className="text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-white/90 leading-tight">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Corpo ────────────────────────────────────────────── */}
        <div className="p-5 flex flex-col gap-4">

          {/* Descrição */}
          <p className="text-sm text-white/55 leading-relaxed">{description}</p>

          {/* Link externo */}
          {linkUrl && linkLabel && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors w-fit"
            >
              <ExternalLink size={11} />
              {linkLabel}
            </a>
          )}

          {/* Input do token */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Token de API
            </label>

            <div className="relative">
              <input
                id={inputId}
                ref={inputRef}
                type={visible ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                className={[
                  'w-full h-10 px-3 pr-10 rounded-xl text-sm font-mono',
                  'bg-white/[0.05] border',
                  status === 'error'
                    ? 'border-rose-500/60 text-rose-200 placeholder:text-rose-500/40'
                    : 'border-white/[0.08] text-white/85 placeholder:text-white/20',
                  'focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08]',
                  'transition-colors',
                ].join(' ')}
              />
              {/* Botão olho */}
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={visible ? 'Ocultar token' : 'Revelar token'}
              >
                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Mensagem de erro */}
            {status === 'error' && errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle size={12} />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Indicador de segurança */}
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/[0.15]">
            <Lock size={12} className="text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-400/80 leading-tight">
              🔒&nbsp; Criptografado com <strong className="text-emerald-400">AES-256-GCM</strong> antes de armazenar
            </span>
          </div>

          {/* Sucesso */}
          {status === 'success' && (
            <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-300">Token salvo com sucesso!</span>
            </div>
          )}
        </div>

        {/* ── Footer / Ações ──────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="h-9 px-4 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={status === 'loading' || status === 'success' || !token.trim()}
            className={[
              'h-9 px-5 rounded-xl text-sm font-semibold transition-all duration-150',
              'flex items-center gap-2',
              status === 'loading' || status === 'success' || !token.trim()
                ? 'bg-violet-600/40 text-violet-300/50 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]',
            ].join(' ')}
          >
            {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
            {status === 'success' && <CheckCircle size={14} />}
            {status === 'loading' ? 'Salvando…' : status === 'success' ? 'Salvo!' : 'Salvar token'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

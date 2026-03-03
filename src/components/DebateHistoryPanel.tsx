'use client';

/**
 * DebateHistoryPanel — Lista os debates Quadripartite de um notebook.
 *
 * Busca GET /api/debates/[notebookId], exibe os rounds ordenados por data
 * e oferece botão "↪ Inserir no editor" que publica um CustomEvent captado
 * pelo WidgetInsertPlugin (que vive dentro do LexicalComposer).
 *
 * Uso: montar fora do LexicalComposer (ex: RightPanel, painel lateral).
 */

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import type { DebateConsensusPayload } from './editor/nodes/DebateConsensusNode';

// ── Tipos ──────────────────────────────────────────────────────
interface DebateMessage {
  id: string;
  agentType: string;
  content: string;
  round: number;
  createdAt: string;
}

interface DebateEntry {
  id: string;
  createdAt: string;
  mode: string;
  title: string | null;
  prompt: string;
  confidence: number;       // 0–100, derivado das msgs da rodada 3
  consensusSummary: string; // text construído a partir dos msgs da rodada 3
  messageCount: number;
  messages: DebateMessage[];
}

interface Props {
  notebookId: string;
}

// ── Helpers visuais ────────────────────────────────────────────
const MODE_LABELS: Record<string, string> = {
  CONSENSUS:        'Consenso',
  DEVILS_ADVOCATE:  'Advogado do Diabo',
  STRESS_TEST:      'Stress Test',
  COMPLIANCE_ONLY:  'Compliance',
};

function confidenceBadgeStyle(value: number): React.CSSProperties {
  const color =
    value >= 85 ? '#a78bfa' :
    value >= 60 ? '#818cf8' :
                  '#f87171';
  return {
    color,
    background: `${color}18`,
    border: `1px solid ${color}44`,
    borderRadius: '99px',
    padding: '1px 8px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  };
}

// ── Sub-componente: Card de um debate ──────────────────────────
function DebateCard({ debate }: { debate: DebateEntry }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(debate.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  function handleInsert() {
    const payload: DebateConsensusPayload = {
      consensus:  debate.consensusSummary,
      confidence: debate.confidence,
      roundId:    debate.id,
    };

    window.dispatchEvent(
      new CustomEvent<DebateConsensusPayload>('notepress:insert-consensus', {
        detail: payload,
      }),
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(109,40,217,0.12) 0%, rgba(76,29,149,0.16) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderLeft: '3px solid #8b5cf6',
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* ── Header do card ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px 10px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Ícone */}
        <BrainCircuit
          size={15}
          style={{ color: '#a78bfa', marginTop: '2px', flexShrink: 0 }}
        />

        {/* Texto central */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Prompt */}
          <p
            style={{
              margin: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#e9d5ff',
              lineHeight: 1.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={debate.prompt}
          >
            {debate.prompt}
          </p>

          {/* Meta-linha */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '5px',
              flexWrap: 'wrap',
            }}
          >
            {/* Data relativa */}
            <span style={{ fontSize: '10.5px', color: 'rgba(196,181,253,0.45)' }}>
              {timeAgo}
            </span>

            {/* Badge de modo */}
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(196,181,253,0.55)',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '4px',
                padding: '1px 6px',
              }}
            >
              {MODE_LABELS[debate.mode] ?? debate.mode}
            </span>

            {/* Confiança */}
            <span style={confidenceBadgeStyle(debate.confidence)}>
              ✓ {debate.confidence}%
            </span>
          </div>
        </div>

        {/* Seta */}
        <span style={{ color: 'rgba(196,181,253,0.4)', flexShrink: 0, marginTop: '2px' }}>
          {expanded
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />}
        </span>
      </div>

      {/* ── Corpo expansível ──────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Resumo do consenso */}
          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(139,92,246,0.12)',
              borderRadius: '7px',
              padding: '10px 12px',
              marginBottom: '10px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            <p
              style={{
                fontFamily: "'Merriweather', Georgia, serif",
                fontSize: '12px',
                lineHeight: '1.7',
                color: '#c4b5fd',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {debate.consensusSummary}
            </p>
          </div>

          {/* Rodapé: mensagens + botão inserir */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                color: 'rgba(196,181,253,0.35)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {debate.messageCount} msgs · 3 rodadas
            </span>

            {/* Botão inserir no editor */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleInsert(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#c4b5fd',
                background: 'rgba(139,92,246,0.14)',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                btn.style.background = 'rgba(139,92,246,0.28)';
                btn.style.borderColor = 'rgba(139,92,246,0.65)';
                btn.style.color = '#ede9fe';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                btn.style.background = 'rgba(139,92,246,0.14)';
                btn.style.borderColor = 'rgba(139,92,246,0.35)';
                btn.style.color = '#c4b5fd';
              }}
              aria-label="Inserir consenso deste debate no editor"
            >
              ↪ Inserir no editor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Componente principal ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function DebateHistoryPanel({ notebookId }: Props) {
  const [debates, setDebates]   = useState<DebateEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchDebates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/debates/${notebookId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { debates: DebateEntry[] };
      setDebates(data.debates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        height: '100%',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={16} style={{ color: '#a78bfa' }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: '13px',
              color: '#e9d5ff',
              letterSpacing: '0.01em',
            }}
          >
            Histórico de Debates
          </span>
          {debates.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#a78bfa',
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '99px',
                padding: '1px 7px',
              }}
            >
              {debates.length}
            </span>
          )}
        </div>

        {/* Botão de refresh */}
        <button
          type="button"
          onClick={fetchDebates}
          disabled={loading}
          aria-label="Atualizar lista de debates"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            color: loading ? 'rgba(196,181,253,0.2)' : 'rgba(196,181,253,0.5)',
            background: 'transparent',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            borderRadius: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget).style.color = '#c4b5fd';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.color = loading
              ? 'rgba(196,181,253,0.2)'
              : 'rgba(196,181,253,0.5)';
          }}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: 'spin 1s linear infinite' } : undefined}
          />
        </button>
      </div>

      {/* Lista de debates */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Estado: carregando */}
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '40px 0',
              color: 'rgba(196,181,253,0.45)',
            }}
          >
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px' }}>Carregando debates…</span>
          </div>
        )}

        {/* Estado: erro */}
        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#f87171',
              fontSize: '12.5px',
            }}
          >
            <p style={{ margin: '0 0 10px' }}>{error}</p>
            <button
              type="button"
              onClick={fetchDebates}
              style={{
                fontSize: '11px',
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '6px',
                padding: '4px 12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado: vazio */}
        {!loading && !error && debates.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: 'rgba(196,181,253,0.35)',
            }}
          >
            <BrainCircuit
              size={32}
              style={{ margin: '0 auto 12px', opacity: 0.3 }}
            />
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5 }}>
              Nenhum debate realizado ainda.
              <br />
              Use o painel Quadripartite para iniciar.
            </p>
          </div>
        )}

        {/* Lista de cards */}
        {!loading && !error && debates.map((debate) => (
          <DebateCard key={debate.id} debate={debate} />
        ))}
      </div>

      {/* CSS de animação para spinner (injeta via <style> inline) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

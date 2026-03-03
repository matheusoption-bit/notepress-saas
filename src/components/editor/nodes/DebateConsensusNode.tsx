'use client';

/**
 * DebateConsensusNode — Decorator Node do Lexical para resultado
 * do pipeline Quadripartite (Analyst + Designer + Executor + Reviewer).
 *
 * Armazena o texto de consenso, a pontuação de confiança (0–100) e o
 * identificador da rodada de debate. Renderiza um card glass-panel com
 * visual premium roxo e tipografia Merriweather no corpo do consenso.
 */

import { useState } from 'react';
import type { JSX } from 'react';
import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { Trash2 } from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
export interface DebateConsensusPayload {
  consensus?: string;
  confidence?: number;
  roundId?: string;
}

export type SerializedDebateConsensusNode = Spread<
  {
    consensus: string;
    confidence: number;
    roundId: string;
    type: 'debate-consensus';
    version: 1;
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_DEBATE_CONSENSUS_COMMAND: LexicalCommand<DebateConsensusPayload> =
  createCommand('INSERT_DEBATE_CONSENSUS_COMMAND');

// ── Factories ──────────────────────────────────────────────────
export function $createDebateConsensusNode(
  payload: DebateConsensusPayload = {},
): DebateConsensusNode {
  return new DebateConsensusNode(
    payload.consensus ?? '',
    payload.confidence ?? 0,
    payload.roundId ?? '',
  );
}

export function $isDebateConsensusNode(
  node: LexicalNode | null | undefined,
): node is DebateConsensusNode {
  return node instanceof DebateConsensusNode;
}

// ── Helpers visuais ────────────────────────────────────────────
function confidenceColor(value: number): string {
  if (value >= 85) return '#a78bfa'; // violet-400
  if (value >= 60) return '#818cf8'; // indigo-400
  return '#f87171';                  // red-400
}

function confidenceLabel(value: number): string {
  if (value >= 85) return 'Alta confiança';
  if (value >= 60) return 'Confiança moderada';
  return 'Confiança baixa';
}

// ══════════════════════════════════════════════════════════════
// ── Componente React do Widget ────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface DebateConsensusWidgetProps {
  nodeKey: NodeKey;
  consensus: string;
  confidence: number;
  roundId: string;
}

function DebateConsensusWidget({
  nodeKey,
  consensus,
  confidence,
  roundId,
}: DebateConsensusWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [collapsed, setCollapsed] = useState(false);

  const color = confidenceColor(confidence);
  const badgeLabel = `✓ ${confidence}%`;

  function handleRemove() {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) node.remove();
    });
  }

  return (
    <div
      contentEditable={false}
      data-lexical-decorator="true"
      data-key={nodeKey}
      onClick={() => setSelected(true)}
      style={{
        /* glass-panel base */
        background: 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(76,29,149,0.22) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(139,92,246,0.25)',
        borderLeft: '4px solid #8b5cf6',
        borderRadius: '12px',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(139,92,246,0.55), 0 8px 32px rgba(109,40,217,0.3)'
          : '0 4px 24px rgba(109,40,217,0.18)',
        margin: '16px 0',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.2s ease',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px 10px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(139,92,246,0.15)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        {/* Emoji + Título */}
        <span style={{ fontSize: '18px', lineHeight: 1 }}>🧠</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.02em',
            color: '#e9d5ff',
            flex: 1,
            fontFamily: 'inherit',
          }}
        >
          Consenso Quadripartite
        </span>

        {/* Badge de confiança */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: color,
            background: `${color}18`,
            border: `1px solid ${color}44`,
            borderRadius: '99px',
            padding: '2px 10px',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
          title={confidenceLabel(confidence)}
        >
          {badgeLabel}
        </span>

        {/* Seta de colapso */}
        <span
          style={{
            color: 'rgba(196,181,253,0.5)',
            fontSize: '12px',
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </div>

      {/* ── Corpo ──────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: '14px 18px 0' }}>
          {consensus ? (
            <p
              style={{
                fontFamily: "'Merriweather', 'Georgia', serif",
                fontSize: '14.5px',
                lineHeight: '1.75',
                color: '#ddd6fe',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {consensus}
            </p>
          ) : (
            <p
              style={{
                fontFamily: "'Merriweather', 'Georgia', serif",
                fontSize: '13px',
                color: 'rgba(196,181,253,0.45)',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              Nenhum consenso gerado ainda.
            </p>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 12px',
          marginTop: collapsed ? 0 : '12px',
          borderTop: collapsed ? 'none' : '1px solid rgba(139,92,246,0.12)',
        }}
      >
        {/* Round ID */}
        <span
          style={{
            fontSize: '10.5px',
            color: 'rgba(196,181,253,0.4)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            letterSpacing: '0.06em',
          }}
        >
          {roundId ? `rodada · ${roundId}` : 'rodada · —'}
        </span>

        {/* Botão Remover */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          aria-label="Remover bloco de consenso"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            fontSize: '11px',
            color: 'rgba(248,113,113,0.75)',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: '6px',
            cursor: 'pointer',
            lineHeight: 1,
            fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.07)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.75)';
          }}
        >
          <Trash2 size={11} />
          Remover
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── DebateConsensusNode — DecoratorNode ───────────────────────
// ══════════════════════════════════════════════════════════════
export class DebateConsensusNode extends DecoratorNode<JSX.Element> {
  __consensus: string;
  __confidence: number;
  __roundId: string;

  static getType(): string {
    return 'debate-consensus';
  }

  static clone(node: DebateConsensusNode): DebateConsensusNode {
    return new DebateConsensusNode(
      node.__consensus,
      node.__confidence,
      node.__roundId,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedDebateConsensusNode): DebateConsensusNode {
    return new DebateConsensusNode(
      serialized.consensus,
      serialized.confidence,
      serialized.roundId,
    );
  }

  constructor(
    consensus: string = '',
    confidence: number = 0,
    roundId: string = '',
    key?: NodeKey,
  ) {
    super(key);
    this.__consensus = consensus;
    this.__confidence = Math.min(100, Math.max(0, confidence));
    this.__roundId = roundId;
  }

  exportJSON(): SerializedDebateConsensusNode {
    return {
      ...super.exportJSON(),
      type: 'debate-consensus',
      version: 1,
      consensus: this.__consensus,
      confidence: this.__confidence,
      roundId: this.__roundId,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'lexical-decorator-block';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return (
      <DebateConsensusWidget
        nodeKey={this.__key}
        consensus={this.__consensus}
        confidence={this.__confidence}
        roundId={this.__roundId}
      />
    );
  }
}

'use client';

/**
 * InnovationValidatorNode — Decorator Node do Lexical para validação de inovação.
 *
 * Renderiza um card glass-panel com:
 *   • Score de inovação (0-100) com barra de progresso colorida
 *   • Nível em badge grande (INCREMENTAL / MODERADA / RADICAL / DISRUPTIVA)
 *   • Explicação gerada por IA
 *   • Lista de patentes similares (Lens.org / SerpApi)
 *   • Seção de recomendações
 *   • Botão de exclusão do bloco
 *
 * Cores da barra:
 *   emerald  ≥ 90  (DISRUPTIVA)
 *   violet   ≥ 75  (RADICAL)
 *   amber    ≥ 60  (MODERADA)
 *   rose     <  60  (INCREMENTAL)
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
  $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Trash2,
  Sparkles,
  FileSearch,
  ClipboardList,
  Zap,
} from 'lucide-react';

// ── Tipos públicos ─────────────────────────────────────────────
export interface PatentResult {
  title: string;
  source: string;       // ex.: "Lens.org" | "Google Patents"
  url: string;
  similarity: number;   // 0-100
  abstract?: string;
}

export interface InnovationValidatorPayload {
  level?: string;
  score?: number;
  explanation?: string;
  recommendations?: string;
  patentResults?: PatentResult[];
  validationId?: string;
  isLoading?: boolean;
}

export type SerializedInnovationValidatorNode = Spread<
  {
    level: string;
    score: number;
    explanation: string;
    recommendations: string;
    patentResults: PatentResult[];
    validationId: string;
    type: 'innovation-validator';
    version: 1;
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_INNOVATION_VALIDATOR_COMMAND: LexicalCommand<InnovationValidatorPayload | undefined> =
  createCommand('INSERT_INNOVATION_VALIDATOR_COMMAND');

// ── Factories ──────────────────────────────────────────────────
export function $createInnovationValidatorNode(
  payload: InnovationValidatorPayload = {},
): InnovationValidatorNode {
  return new InnovationValidatorNode(
    payload.level ?? 'INCREMENTAL',
    payload.score ?? 0,
    payload.explanation ?? '',
    payload.recommendations ?? '',
    payload.patentResults ?? [],
    payload.validationId ?? crypto.randomUUID(),
    payload.isLoading ?? false,
  );
}

export function $isInnovationValidatorNode(
  node: LexicalNode | null | undefined,
): node is InnovationValidatorNode {
  return node instanceof InnovationValidatorNode;
}

// ── Helpers de estilo baseados em score ────────────────────────
function getScoreTheme(score: number) {
  if (score >= 90) return { bar: '#10b981', glow: 'rgba(16,185,129,0.25)', label: 'DISRUPTIVA',  labelBg: 'rgba(16,185,129,0.15)',  labelColor: '#10b981' };
  if (score >= 75) return { bar: '#8b5cf6', glow: 'rgba(139,92,246,0.25)', label: 'RADICAL',      labelBg: 'rgba(139,92,246,0.15)',  labelColor: '#8b5cf6' };
  if (score >= 60) return { bar: '#f59e0b', glow: 'rgba(245,158,11,0.25)', label: 'MODERADA',     labelBg: 'rgba(245,158,11,0.15)',  labelColor: '#f59e0b' };
  return              { bar: '#f43f5e', glow: 'rgba(244,63,94,0.25)',  label: 'INCREMENTAL', labelBg: 'rgba(244,63,94,0.15)',   labelColor: '#f43f5e' };
}

function levelFromScore(score: number): string {
  if (score >= 90) return 'DISRUPTIVA';
  if (score >= 75) return 'RADICAL';
  if (score >= 60) return 'MODERADA';
  return 'INCREMENTAL';
}

// ══════════════════════════════════════════════════════════════
// ── Componente React do Widget ────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface InnovationValidatorWidgetProps {
  nodeKey: NodeKey;
  level: string;
  score: number;
  explanation: string;
  recommendations: string;
  patentResults: PatentResult[];
  validationId: string;
  isLoading: boolean;
}

function InnovationValidatorWidget({
  nodeKey,
  level,
  score,
  explanation,
  recommendations,
  patentResults,
  validationId,
  isLoading,
}: InnovationValidatorWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [patentsOpen, setPatentsOpen]   = useState(true);
  const [recoOpen, setRecoOpen]         = useState(true);

  const displayLevel = level || levelFromScore(score);
  const theme = getScoreTheme(score);

  function handleDelete() {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }

  return (
    <div
      data-lexical-decorator="true"
      data-key={nodeKey}
      style={{
        margin: '1.5rem 0',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(15,15,25,0.85) 0%, rgba(20,20,35,0.90) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 32px ${theme.glow}, 0 1px 0 rgba(255,255,255,0.05) inset`,
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: theme.labelBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color={theme.labelColor} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
            Validador de Inovação
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            #{validationId.slice(0, 8)}
          </span>
        </div>
        <button
          onClick={handleDelete}
          title="Remover bloco"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
            padding: 4, borderRadius: 6, transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* ── Corpo ──────────────────────────────────────────── */}
      <div style={{ padding: '20px 18px 18px' }}>

        {isLoading ? (
          /* ── Loading state ─────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid ${theme.bar}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
              Analisando inovação e buscando patentes…
            </p>
          </div>
        ) : (
          <>
            {/* ── Score + Nível ─────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 18 }}>

              {/* Score numérico */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontSize: 56, fontWeight: 800, lineHeight: 1,
                  color: theme.bar,
                  textShadow: `0 0 20px ${theme.glow}`,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {score}
                </span>
                <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                  /100
                </span>
              </div>

              {/* Badge de nível */}
              <div style={{
                padding: '6px 14px',
                borderRadius: 100,
                background: theme.labelBg,
                border: `1px solid ${theme.bar}55`,
                color: theme.bar,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {displayLevel}
              </div>
            </div>

            {/* ── Barra de Progresso ────────────────────── */}
            <div style={{
              height: 8, borderRadius: 100,
              background: 'rgba(255,255,255,0.07)',
              marginBottom: 20,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(2, score)}%`,
                borderRadius: 100,
                background: `linear-gradient(90deg, ${theme.bar}99, ${theme.bar})`,
                boxShadow: `0 0 8px ${theme.bar}88`,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>

            {/* ── Explicação ────────────────────────────── */}
            {explanation && (
              <section style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Sparkles size={13} color={theme.bar} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Análise
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.65, margin: 0,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  borderLeft: `3px solid ${theme.bar}`,
                }}>
                  {explanation}
                </p>
              </section>
            )}

            {/* ── Patentes ──────────────────────────────── */}
            {patentResults.length > 0 && (
              <section style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setPatentsOpen((o) => !o)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  }}
                >
                  <FileSearch size={13} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Patentes Similares ({patentResults.length})
                  </span>
                  {patentsOpen
                    ? <ChevronDown size={12} color="rgba(255,255,255,0.35)" />
                    : <ChevronRight size={12} color="rgba(255,255,255,0.35)" />
                  }
                </button>

                {patentsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {patentResults.map((patent, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.07)',
                          display: 'flex', flexDirection: 'column', gap: 5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <a
                            href={patent.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 13, fontWeight: 600,
                              color: 'rgba(255,255,255,0.85)',
                              textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: 4,
                              flex: 1,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = theme.bar)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                          >
                            <span style={{ flex: 1 }}>{patent.title}</span>
                            <ExternalLink size={11} style={{ flexShrink: 0 }} />
                          </a>

                          {/* Similarity badge */}
                          <div style={{
                            flexShrink: 0,
                            padding: '2px 8px',
                            borderRadius: 100,
                            fontSize: 11, fontWeight: 700,
                            background: patent.similarity >= 70
                              ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                            color: patent.similarity >= 70 ? '#f43f5e' : '#f59e0b',
                            border: `1px solid ${patent.similarity >= 70 ? '#f43f5e33' : '#f59e0b33'}`,
                          }}>
                            {patent.similarity}% similar
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {patent.source}
                          </span>
                        </div>

                        {patent.abstract && (
                          <p style={{
                            fontSize: 12, color: 'rgba(255,255,255,0.45)',
                            margin: 0, lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {patent.abstract}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Recomendações ─────────────────────────── */}
            {recommendations && (
              <section>
                <button
                  onClick={() => setRecoOpen((o) => !o)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  }}
                >
                  <ClipboardList size={13} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Recomendações
                  </span>
                  {recoOpen
                    ? <ChevronDown size={12} color="rgba(255,255,255,0.35)" />
                    : <ChevronRight size={12} color="rgba(255,255,255,0.35)" />
                  }
                </button>

                {recoOpen && (
                  <div style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.65,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    borderLeft: `3px solid rgba(255,255,255,0.15)`,
                    whiteSpace: 'pre-line',
                  }}>
                    {recommendations}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{
        padding: '8px 18px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Lightbulb size={11} color="rgba(255,255,255,0.25)" />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Powered by Notepress Innovation AI
          {patentResults.length > 0 && ' · ' + (
            patentResults.some(p => p.source === 'Lens.org') ? 'Lens.org' : patentResults[0].source
          )}
        </span>
      </div>

      {/* ── CSS keyframe para o spinner de loading ──────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── DecoratorNode ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export class InnovationValidatorNode extends DecoratorNode<JSX.Element> {
  __level: string;
  __score: number;
  __explanation: string;
  __recommendations: string;
  __patentResults: PatentResult[];
  __validationId: string;
  __isLoading: boolean;

  // ── Registro do tipo ───────────────────────────────────────
  static getType(): string {
    return 'innovation-validator';
  }

  static clone(node: InnovationValidatorNode): InnovationValidatorNode {
    return new InnovationValidatorNode(
      node.__level,
      node.__score,
      node.__explanation,
      node.__recommendations,
      node.__patentResults,
      node.__validationId,
      node.__isLoading,
      node.__key,
    );
  }

  // ── Construtor ─────────────────────────────────────────────
  constructor(
    level = 'INCREMENTAL',
    score = 0,
    explanation = '',
    recommendations = '',
    patentResults: PatentResult[] = [],
    validationId = crypto.randomUUID(),
    isLoading = false,
    key?: NodeKey,
  ) {
    super(key);
    this.__level         = level;
    this.__score         = score;
    this.__explanation   = explanation;
    this.__recommendations = recommendations;
    this.__patentResults = patentResults;
    this.__validationId  = validationId;
    this.__isLoading     = isLoading;
  }

  // ── Serialização ───────────────────────────────────────────
  static importJSON(serialized: SerializedInnovationValidatorNode): InnovationValidatorNode {
    return new InnovationValidatorNode(
      serialized.level,
      serialized.score,
      serialized.explanation,
      serialized.recommendations,
      serialized.patentResults,
      serialized.validationId,
      false, // nunca persiste isLoading
    );
  }

  exportJSON(): SerializedInnovationValidatorNode {
    return {
      ...super.exportJSON(),
      type: 'innovation-validator',
      version: 1,
      level:           this.__level,
      score:           this.__score,
      explanation:     this.__explanation,
      recommendations: this.__recommendations,
      patentResults:   this.__patentResults,
      validationId:    this.__validationId,
    };
  }

  // ── DOM container ──────────────────────────────────────────
  createDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'lexical-decorator-block';
    return el;
  }

  updateDOM(): false {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }

  // ── Render React ───────────────────────────────────────────
  decorate(): JSX.Element {
    return (
      <InnovationValidatorWidget
        nodeKey={this.__key}
        level={this.__level}
        score={this.__score}
        explanation={this.__explanation}
        recommendations={this.__recommendations}
        patentResults={this.__patentResults}
        validationId={this.__validationId}
        isLoading={this.__isLoading}
      />
    );
  }
}

'use client';

/**
 * MermaidDiagramNode — Decorator Node do Lexical para diagramas Mermaid.
 *
 * Renderiza um diagrama SVG a partir de código Mermaid diretamente no
 * corpo do documento. O código é persistido no JSON do editor (Prisma).
 *
 * Recursos:
 *   • Renderização via mermaid.render() com dynamic import (SSR-safe)
 *   • Tema dark/default detectado em runtime por document.documentElement.classList
 *   • Botão editar: abre textarea + preview ao vivo
 *   • Botão deletar: remove o bloco do documento
 *   • Visual glass-panel com accent violet-500
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { GitBranch, Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-react';

// ── Tipos de serialização ──────────────────────────────────────
export type SerializedMermaidDiagramNode = Spread<
  {
    code: string;
    type: 'mermaid-diagram';
    version: 1;
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_MERMAID_COMMAND: LexicalCommand<{ code?: string }> =
  createCommand('INSERT_MERMAID_COMMAND');

// ── Diagrama padrão ────────────────────────────────────────────
export const DEFAULT_MERMAID_CODE = `flowchart TD
    A[Início] --> B{Decisão}
    B -->|Sim| C[Ação A]
    B -->|Não| D[Ação B]
    C --> E[Fim]
    D --> E`;

// ── Contador global para IDs únicos do Mermaid ─────────────────
let _mermaidCounter = 0;

// ── Renderizador assíncrono com dynamic import ─────────────────
async function renderMermaidSvg(code: string): Promise<{ svg: string; error: null } | { svg: null; error: string }> {
  try {
    const mermaid = (await import('mermaid')).default;

    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      fontFamily: 'inherit',
      securityLevel: 'loose',
    });

    const id = `mermaid-render-${++_mermaidCounter}-${Date.now()}`;
    const { svg } = await mermaid.render(id, code.trim());
    return { svg, error: null };
  } catch (err) {
    return { svg: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ══════════════════════════════════════════════════════════════
// ── Componente React do Widget ────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface MermaidWidgetProps {
  nodeKey: NodeKey;
  initialCode: string;
}

function MermaidWidget({ nodeKey, initialCode }: MermaidWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);

  // ── Estado do diagrama ──────────────────────────────────────
  const [svg, setSvg]         = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  // ── Estado de edição ────────────────────────────────────────
  const [editing, setEditing]           = useState(false);
  const [draftCode, setDraftCode]       = useState(initialCode);
  const [previewSvg, setPreviewSvg]     = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Renderização inicial ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsRendering(true);
    renderMermaidSvg(initialCode).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setRenderError(result.error);
        setSvg('');
      } else {
        setSvg(result.svg!);
        setRenderError(null);
      }
      setIsRendering(false);
    });
    return () => { cancelled = true; };
  }, [initialCode]);

  // ── Preview ao vivo (debounced 600 ms) ──────────────────────
  useEffect(() => {
    if (!editing) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsPreviewRendering(true);
    debounceRef.current = setTimeout(async () => {
      const result = await renderMermaidSvg(draftCode);
      if (result.error) {
        setPreviewError(result.error);
        setPreviewSvg('');
      } else {
        setPreviewSvg(result.svg!);
        setPreviewError(null);
      }
      setIsPreviewRendering(false);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draftCode, editing]);

  // ── Salvar edição ───────────────────────────────────────────
  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node instanceof MermaidDiagramNode) {
        (node.getWritable() as MermaidDiagramNode).__code = draftCode;
      }
    });
    // Aplica o SVG do preview como o diagrama principal
    if (previewSvg) {
      setSvg(previewSvg);
      setRenderError(null);
    }
    setEditing(false);
  }, [editor, nodeKey, draftCode, previewSvg]);

  // ── Cancelar edição ─────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setDraftCode(initialCode);
    setEditing(false);
  }, [initialCode]);

  // ── Deletar bloco ───────────────────────────────────────────
  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node instanceof MermaidDiagramNode) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  // ── Abrir editor ─────────────────────────────────────────────
  const handleEdit = useCallback(() => {
    setDraftCode(initialCode);
    setPreviewSvg(svg);
    setPreviewError(null);
    setEditing(true);
  }, [initialCode, svg]);

  return (
    <div
      contentEditable={false}
      onClick={() => setSelected(true)}
      data-lexical-decorator="true"
      data-key={nodeKey}
      style={{
        background: 'rgba(124, 58, 237, 0.05)',
        border: `1.5px solid ${isSelected ? 'rgba(139, 92, 246, 0.65)' : 'rgba(139, 92, 246, 0.28)'}`,
        borderRadius: '10px',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        marginBlock: '12px',
        transition: 'border-color 0.2s',
        position: 'relative',
      }}
    >
      {/* ── Cabeçalho ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: editing ? '12px' : '10px',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#a78bfa',
            flexShrink: 0,
          }}
        >
          <GitBranch size={13} />
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#a78bfa',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          Diagrama Mermaid
        </span>

        {/* Botões de ação */}
        {!editing && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              title="Editar diagrama"
              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#a78bfa',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.22)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.1)')
              }
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              title="Deletar diagrama"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.18)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.08)')
              }
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {/* Botões salvar/cancelar no modo edição */}
        {editing && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              title="Salvar"
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                background: 'rgba(52, 211, 153, 0.1)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(52, 211, 153, 0.2)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(52, 211, 153, 0.1)')
              }
            >
              <Check size={11} />
              Salvar
            </button>
            <button
              type="button"
              title="Cancelar"
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(148, 163, 184, 0.06)',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(148, 163, 184, 0.14)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(148, 163, 184, 0.06)')
              }
            >
              <X size={11} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ══ MODO VISUALIZAÇÃO ══ */}
      {!editing && (
        <div
          style={{
            background: 'rgba(15, 10, 30, 0.35)',
            borderRadius: '7px',
            padding: '16px',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
          }}
        >
          {isRendering && (
            <span style={{ color: '#64748b', fontSize: '13px' }}>Renderizando…</span>
          )}
          {!isRendering && renderError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: '#f87171',
                fontSize: '12px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                <strong>Erro de sintaxe Mermaid:</strong>
                <br />
                <code style={{ fontSize: '11px', opacity: 0.8 }}>{renderError}</code>
              </span>
            </div>
          )}
          {!isRendering && !renderError && svg && (
            <div
              dangerouslySetInnerHTML={{ __html: svg }}
              style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center' }}
            />
          )}
        </div>
      )}

      {/* ══ MODO EDIÇÃO ══ */}
      {editing && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {/* Textarea */}
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}
            >
              Código Mermaid
            </p>
            <textarea
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              spellCheck={false}
              rows={12}
              style={{
                width: '100%',
                background: 'rgba(15, 10, 30, 0.5)',
                border: '1.5px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '7px',
                color: '#e2e8f0',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '12px',
                lineHeight: 1.6,
                padding: '10px 12px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Preview ao vivo */}
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}
            >
              Preview
            </p>
            <div
              style={{
                background: 'rgba(15, 10, 30, 0.35)',
                border: '1.5px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '7px',
                padding: '12px',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
              }}
            >
              {isPreviewRendering && (
                <span style={{ color: '#64748b', fontSize: '12px' }}>Atualizando…</span>
              )}
              {!isPreviewRendering && previewError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    color: '#f87171',
                    fontSize: '11px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <code style={{ opacity: 0.85 }}>{previewError}</code>
                </div>
              )}
              {!isPreviewRendering && !previewError && previewSvg && (
                <div
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── MermaidDiagramNode — DecoratorNode ────────────────────────
// ══════════════════════════════════════════════════════════════
export class MermaidDiagramNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static getType(): string {
    return 'mermaid-diagram';
  }

  static clone(node: MermaidDiagramNode): MermaidDiagramNode {
    return new MermaidDiagramNode(node.__code, node.__key);
  }

  static importJSON(serialized: SerializedMermaidDiagramNode): MermaidDiagramNode {
    return $createMermaidDiagramNode(serialized.code ?? DEFAULT_MERMAID_CODE);
  }

  constructor(code: string = DEFAULT_MERMAID_CODE, key?: NodeKey) {
    super(key);
    this.__code = code;
  }

  exportJSON(): SerializedMermaidDiagramNode {
    return {
      ...super.exportJSON(),
      type: 'mermaid-diagram',
      code: this.__code,
      version: 1,
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
      <MermaidWidget
        nodeKey={this.__key}
        initialCode={this.__code}
      />
    );
  }
}

// ── Factories ──────────────────────────────────────────────────
export function $createMermaidDiagramNode(code: string = DEFAULT_MERMAID_CODE): MermaidDiagramNode {
  return new MermaidDiagramNode(code);
}

export function $isMermaidDiagramNode(
  node: LexicalNode | null | undefined,
): node is MermaidDiagramNode {
  return node instanceof MermaidDiagramNode;
}

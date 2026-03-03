'use client';

/**
 * FloatingActionToolbar — Barra de ação de IA sobre seleção de texto.
 *
 * Aparece quando o usuário seleciona texto no editor.
 * Contém ações rápidas que enviam o texto selecionado para os agentes IA.
 * Exibe popover com o resultado e opções "Substituir" / "Descartar".
 *
 * Também exporta `AIStampPlugin` para decorar parágrafos revisados pela IA
 * com um brilho lateral em primary (violet).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  Sparkles,
  FileSearch2,
  ShieldAlert,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  ClipboardCopy,
  CheckCheck,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// ── Tipos públicos ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

/** Ações disparadas para os agentes IA */
export type AIAction = 'improve' | 'validate' | 'risk';

export interface AIActionEvent {
  action: AIAction;
  /** Texto selecionado pelo usuário */
  selectedText: string;
  /** Chave do agente responsável pela ação */
  agent: 'Analyst' | 'Reviewer';
}

export interface FloatingActionToolbarProps {
  /**
   * Callback acionado ao clicar em uma ação de IA.
   * Chamado antes da requisição à API (para integrações externas).
   */
  onAction?: (payload: AIActionEvent) => void;
  /** ID do edital vinculado ao notebook atual (usado em 'validate') */
  editalId?: string;
  /** Desativa a barra */
  disabled?: boolean;
}

// ── Resultado de IA ────────────────────────────────────────────
interface AIResult {
  text: string;
  action: AIAction;
}

// ── Seleção salva do Lexical ───────────────────────────────────
interface SavedSelection {
  anchorKey: string;
  anchorOffset: number;
  anchorType: 'text' | 'element';
  focusKey: string;
  focusOffset: number;
  focusType: 'text' | 'element';
}

// ── Definição das ações ────────────────────────────────────────
interface ActionDef {
  key: AIAction;
  label: string;
  icon: React.ReactNode;
  agent: AIActionEvent['agent'];
  title: string;
  accentColor: string;
}

const ACTIONS: ActionDef[] = [
  {
    key: 'improve',
    label: 'Melhorar Escrita',
    icon: <Sparkles size={13} />,
    agent: 'Reviewer',
    title: 'Reviewer Agent: refinar clareza, coesão e norma culta',
    accentColor: '#a78bfa',
  },
  {
    key: 'validate',
    label: 'Validar com Edital',
    icon: <FileSearch2 size={13} />,
    agent: 'Analyst',
    title: 'Analyst Agent: verificar aderência ao edital ativo',
    accentColor: '#34d399',
  },
  {
    key: 'risk',
    label: 'Analisar Risco',
    icon: <ShieldAlert size={13} />,
    agent: 'Analyst',
    title: 'Analyst Agent: identificar riscos jurídicos e técnicos',
    accentColor: '#f87171',
  },
];

const ACTION_LABELS: Record<AIAction, string> = {
  improve: 'Melhoria de Escrita',
  validate: 'Validação com Edital',
  risk: 'Análise de Riscos',
};

// ══════════════════════════════════════════════════════════════
// ── FloatingActionToolbar ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export default function FloatingActionToolbar({
  onAction,
  editalId,
  disabled = false,
}: FloatingActionToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const [toolbarRect, setToolbarRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied]             = useState(false);
  const [resultCopied, setResultCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [aiResult, setAiResult]           = useState<AIResult | null>(null);
  const [apiError, setApiError]           = useState<string | null>(null);

  // Seleção Lexical salva antes da chamada à API
  const savedSelectionRef = useRef<SavedSelection | null>(null);
  const toolbarRef        = useRef<HTMLDivElement>(null);
  const popoverRef        = useRef<HTMLDivElement>(null);

  // ── Calcula posição da barra baseada na seleção DOM ────────
  const computePosition = useCallback((): {
    top: number;
    left: number;
    width: number;
  } | null => {
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.isCollapsed || domSelection.rangeCount === 0) {
      return null;
    }
    const range = domSelection.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    if (rect.width === 0) return null;

    const TOOLBAR_WIDTH = 340;
    const MARGIN        = 8;

    const left = Math.max(
      MARGIN,
      Math.min(
        rect.left + rect.width / 2 - TOOLBAR_WIDTH / 2,
        window.innerWidth - TOOLBAR_WIDTH - MARGIN,
      ),
    );

    const topAbove = rect.top - 46 - 6;
    const top      = topAbove < MARGIN ? rect.bottom + 6 : topAbove;

    return { top, left, width: TOOLBAR_WIDTH };
  }, []);

  // ── Rastreia seleção via comando Lexical ───────────────────
  useEffect(() => {
    if (disabled) return;

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            setToolbarRect(null);
            setSelectedText('');
            // Fecha o popover apenas se não há resultado aguardando ação do usuário
            if (!aiResult) setAiResult(null);
            return;
          }

          const text = selection.getTextContent();
          if (!text.trim()) {
            setToolbarRect(null);
            return;
          }

          setSelectedText(text);
          requestAnimationFrame(() => {
            const pos = computePosition();
            setToolbarRect(pos);
          });
        });

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, disabled, computePosition, aiResult]);

  // ── Fecha popover ao clicar fora da toolbar + popover ─────
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      // Clique fora: fecha o popover mas não limpa a seleção (o editor trata via SELECTION_CHANGE)
      setAiResult(null);
      setApiError(null);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // ── Ação IA: salva seleção + chama API ─────────────────────
  const handleAction = useCallback(
    async (actionDef: ActionDef) => {
      if (!selectedText || loadingAction) return;

      // 1. Salva a seleção Lexical atual para uso posterior no "Substituir"
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          savedSelectionRef.current = {
            anchorKey:    sel.anchor.key,
            anchorOffset: sel.anchor.offset,
            anchorType:   sel.anchor.type,
            focusKey:     sel.focus.key,
            focusOffset:  sel.focus.offset,
            focusType:    sel.focus.type,
          };
        }
      });

      // 2. Callback prop (desacoplamento)
      onAction?.({
        action:       actionDef.key,
        selectedText,
        agent:        actionDef.agent,
      });

      // 3. Evento nativo
      window.dispatchEvent(
        new CustomEvent<AIActionEvent>('notepress:ai-action', {
          detail: { action: actionDef.key, selectedText, agent: actionDef.agent },
        }),
      );

      // 4. Chama a API
      setLoadingAction(actionDef.key);
      setAiResult(null);
      setApiError(null);

      try {
        const res = await fetch('/api/ai/editor-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:       actionDef.key,
            selectedText,
            editalId:     editalId ?? undefined,
          }),
        });

        const json = (await res.json()) as { result?: string; error?: string };

        if (!res.ok || !json.result) {
          setApiError(json.error ?? 'Erro desconhecido na API.');
        } else {
          setAiResult({ text: json.result, action: actionDef.key });
        }
      } catch {
        setApiError('Falha na conexão com a API de IA.');
      } finally {
        setLoadingAction(null);
      }
    },
    [selectedText, loadingAction, onAction, editor, editalId],
  );

  // ── Substituir seleção original com o resultado da IA ─────
  const handleReplace = useCallback(() => {
    if (!aiResult || !savedSelectionRef.current) return;

    const { anchorKey, anchorOffset, anchorType, focusKey, focusOffset, focusType } =
      savedSelectionRef.current;

    editor.update(() => {
      try {
        const sel = $createRangeSelection();
        sel.anchor.set(anchorKey, anchorOffset, anchorType);
        sel.focus.set(focusKey, focusOffset, focusType);
        $setSelection(sel);
        sel.insertRawText(aiResult.text);
      } catch {
        // Se os nós já não existem (edição entre ações), insere na posição atual
        const current = $getSelection();
        if ($isRangeSelection(current)) {
          current.insertRawText(aiResult.text);
        }
      }
    });

    setAiResult(null);
    setApiError(null);
    savedSelectionRef.current = null;
  }, [editor, aiResult]);

  // ── Descartar resultado ────────────────────────────────────
  const handleDiscard = useCallback(() => {
    setAiResult(null);
    setApiError(null);
    savedSelectionRef.current = null;
  }, []);

  // ── Copiar seleção ─────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!selectedText) return;
    await navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [selectedText]);

  // ── Copiar resultado da IA ─────────────────────────────────
  const handleCopyResult = useCallback(async () => {
    if (!aiResult) return;
    await navigator.clipboard.writeText(aiResult.text);
    setResultCopied(true);
    setTimeout(() => setResultCopied(false), 1800);
  }, [aiResult]);

  // ── Render ─────────────────────────────────────────────────
  if (disabled || !toolbarRect || !selectedText || typeof document === 'undefined') {
    return null;
  }

  const popoverTop  = toolbarRect.top + 48;
  const popoverLeft = toolbarRect.left;
  const POPOVER_W   = 480;
  const popoverLeftClamped = Math.max(
    8,
    Math.min(popoverLeft, window.innerWidth - POPOVER_W - 8),
  );

  const activeActionDef = ACTIONS.find((a) => a.key === (aiResult?.action ?? loadingAction));

  return createPortal(
    <>
      {/* ── Toolbar principal ── */}
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Ações de IA para o texto selecionado"
        className="fat-toolbar"
        style={{
          position: 'fixed',
          top:      toolbarRect.top,
          left:     toolbarRect.left,
          zIndex:   9999,
          width:    toolbarRect.width,
        }}
      >
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            title={action.title}
            disabled={!!loadingAction}
            aria-pressed={loadingAction === action.key}
            className={`fat-toolbar__btn${loadingAction === action.key ? ' fat-toolbar__btn--active' : ''}`}
            onClick={() => handleAction(action)}
            style={loadingAction === action.key ? { color: action.accentColor } : undefined}
          >
            {loadingAction === action.key ? (
              <Loader2 size={13} className="fat-toolbar__spinner" />
            ) : (
              action.icon
            )}
            <span>{action.label}</span>
          </button>
        ))}

        {/* Separador */}
        <div className="fat-toolbar__sep" aria-hidden="true" />

        {/* Copiar seleção */}
        <button
          type="button"
          title="Copiar seleção"
          className="fat-toolbar__btn fat-toolbar__btn--icon"
          onClick={handleCopy}
        >
          {copied
            ? <Check size={13} className="text-emerald-400" />
            : <Copy size={13} />}
        </button>
      </div>

      {/* ── Popover de resultado ── */}
      {(aiResult || apiError) && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Resultado da análise de IA"
          style={{
            position:     'fixed',
            top:          popoverTop,
            left:         popoverLeftClamped,
            width:        POPOVER_W,
            maxHeight:    420,
            zIndex:       9998,
            borderRadius: '12px',
            border:       `1.5px solid ${activeActionDef?.accentColor ? activeActionDef.accentColor + '44' : 'rgba(139,92,246,0.35)'}`,
            background:   'rgba(10, 8, 22, 0.94)',
            backdropFilter: 'blur(20px)',
            boxShadow:    '0 16px 48px rgba(0,0,0,0.55)',
            display:      'flex',
            flexDirection: 'column',
            overflow:     'hidden',
          }}
        >
          {/* Cabeçalho do popover */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              padding:        '10px 14px',
              borderBottom:   '1px solid rgba(255,255,255,0.07)',
              flexShrink:     0,
            }}
          >
            <span
              style={{
                width:          '22px',
                height:         '22px',
                borderRadius:   '5px',
                background:     `${activeActionDef?.accentColor ?? '#a78bfa'}22`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          activeActionDef?.accentColor ?? '#a78bfa',
                flexShrink:     0,
              }}
            >
              {activeActionDef?.icon}
            </span>
            <span
              style={{
                fontSize:   '12px',
                fontWeight: 600,
                color:      activeActionDef?.accentColor ?? '#a78bfa',
                flex:       1,
                letterSpacing: '0.03em',
              }}
            >
              {aiResult ? ACTION_LABELS[aiResult.action] : 'Erro'}
            </span>
            <button
              type="button"
              title="Fechar"
              onClick={handleDiscard}
              style={{
                background:     'transparent',
                border:         'none',
                color:          '#64748b',
                cursor:         'pointer',
                display:        'flex',
                padding:        '2px',
                borderRadius:   '4px',
                transition:     'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#64748b')}
            >
              <X size={14} />
            </button>
          </div>

          {/* Corpo do popover */}
          <div
            style={{
              flex:       1,
              overflowY:  'auto',
              padding:    '12px 14px',
            }}
          >
            {apiError ? (
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>
                ⚠️ {apiError}
              </p>
            ) : aiResult ? (
              <div
                style={{
                  color:       '#cbd5e1',
                  fontSize:    '13px',
                  lineHeight:  1.65,
                  whiteSpace:  'pre-wrap',
                  margin:      0,
                  fontFamily:  'inherit',
                }}
              >
                {aiResult.text}
              </div>
            ) : null}
          </div>

          {/* Rodapé com ações */}
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '10px 14px',
              borderTop:    '1px solid rgba(255,255,255,0.07)',
              flexShrink:   0,
            }}
          >
            {/* Botão Substituir — apenas quando há resultado sem erro */}
            {aiResult && (
              <button
                type="button"
                onClick={handleReplace}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '5px 14px',
                  borderRadius: '7px',
                  border:       `1px solid ${activeActionDef?.accentColor ?? '#a78bfa'}55`,
                  background:   `${activeActionDef?.accentColor ?? '#a78bfa'}18`,
                  color:        activeActionDef?.accentColor ?? '#a78bfa',
                  fontSize:     '12px',
                  fontWeight:   600,
                  cursor:       'pointer',
                  transition:   'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    `${activeActionDef?.accentColor ?? '#a78bfa'}30`)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    `${activeActionDef?.accentColor ?? '#a78bfa'}18`)
                }
              >
                <RefreshCw size={12} />
                Substituir texto
              </button>
            )}

            {/* Botão Copiar resultado */}
            {aiResult && (
              <button
                type="button"
                onClick={handleCopyResult}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '5px 14px',
                  borderRadius: '7px',
                  border:       '1px solid rgba(148,163,184,0.2)',
                  background:   'rgba(148,163,184,0.07)',
                  color:        resultCopied ? '#34d399' : '#94a3b8',
                  fontSize:     '12px',
                  fontWeight:   600,
                  cursor:       'pointer',
                  transition:   'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.14)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.07)')
                }
              >
                {resultCopied ? <CheckCheck size={12} /> : <ClipboardCopy size={12} />}
                {resultCopied ? 'Copiado!' : 'Copiar'}
              </button>
            )}

            {/* Espaçador */}
            <span style={{ flex: 1 }} />

            {/* Botão Descartar */}
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '5px 12px',
                borderRadius: '7px',
                border:       '1px solid rgba(239,68,68,0.25)',
                background:   'rgba(239,68,68,0.07)',
                color:        '#f87171',
                fontSize:     '12px',
                fontWeight:   600,
                cursor:       'pointer',
                transition:   'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.16)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.07)')
              }
            >
              <X size={12} />
              Descartar
            </button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

// ══════════════════════════════════════════════════════════════
// ── AIStampPlugin ─────────────────────────────────────────────
// Ouve `notepress:ai-stamp` e decora parágrafos com brilho
// lateral violet, indicando que foram gerados/revisados por IA.
// ══════════════════════════════════════════════════════════════

export interface AIStampEvent {
  /**
   * Chave Lexical do nó a ser decorado.
   * Se omitida, decora o parágrafo onde o cursor está.
   */
  nodeKey?: string;
}

export function AIStampPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleStamp = (e: Event) => {
      const { nodeKey } = (e as CustomEvent<AIStampEvent>).detail ?? {};

      // Tenta decorar por nodeKey primeiro; senão, usa o parágrafo do cursor
      if (nodeKey) {
        const el = editor.getElementByKey(nodeKey);
        if (el) {
          el.classList.add('lexical-ai-generated');
          // Remove ao editar para não poluir parágrafos modificados pelo usuário
          const observer = new MutationObserver(() => {
            el.classList.remove('lexical-ai-generated');
            observer.disconnect();
          });
          observer.observe(el, { characterData: true, subtree: true });
        }
        return;
      }

      // Fallback: decora o parágrafo atual via seleção DOM
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;
      const range = domSelection.getRangeAt(0);
      let container: Element | null = range.commonAncestorContainer as Element;
      // Sobe até o elementNode do Lexical (tem data-lexical-editor ou role)
      while (container && !container.hasAttribute?.('data-lexical-node-key')) {
        container = container.parentElement;
      }
      if (container) container.classList.add('lexical-ai-generated');
    };

    window.addEventListener('notepress:ai-stamp', handleStamp);
    return () => window.removeEventListener('notepress:ai-stamp', handleStamp);
  }, [editor]);

  return null;
}

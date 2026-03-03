'use client';

/**
 * FloatingActionToolbar — Barra de ação de IA sobre seleção de texto.
 *
 * Aparece quando o usuário seleciona texto no editor.
 * Contém ações rápidas que enviam o texto selecionado para os agentes IA.
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
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Sparkles, FileSearch2, ShieldAlert, Copy, Check } from 'lucide-react';

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
   * Use este callback para enviar o texto ao seu pipeline de agentes.
   */
  onAction?: (payload: AIActionEvent) => void;
  /** Desativa a barra */
  disabled?: boolean;
}

// ── Definição das ações ────────────────────────────────────────
interface ActionDef {
  key: AIAction;
  label: string;
  icon: React.ReactNode;
  agent: AIActionEvent['agent'];
  title: string;
}

const ACTIONS: ActionDef[] = [
  {
    key: 'improve',
    label: 'Melhorar Escrita',
    icon: <Sparkles size={13} />,
    agent: 'Reviewer',
    title: 'Reviewer Agent: refinar clareza, coesão e norma culta',
  },
  {
    key: 'validate',
    label: 'Validar com Edital',
    icon: <FileSearch2 size={13} />,
    agent: 'Analyst',
    title: 'Analyst Agent: verificar aderência ao edital ativo',
  },
  {
    key: 'risk',
    label: 'Analisar Risco',
    icon: <ShieldAlert size={13} />,
    agent: 'Analyst',
    title: 'Analyst Agent: identificar riscos jurídicos e técnicos',
  },
];

// ══════════════════════════════════════════════════════════════
// ── FloatingActionToolbar ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export default function FloatingActionToolbar({
  onAction,
  disabled = false,
}: FloatingActionToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const [toolbarRect, setToolbarRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);

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
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) return null;

    const TOOLBAR_WIDTH = 312; // aprox. largura da barra em px
    const MARGIN = 8;

    const left = Math.max(
      MARGIN,
      Math.min(
        rect.left + rect.width / 2 - TOOLBAR_WIDTH / 2,
        window.innerWidth - TOOLBAR_WIDTH - MARGIN,
      ),
    );

    // Posiciona acima da seleção; se não couber, vai abaixo
    const topAbove = rect.top - 46 - 6;
    const top = topAbove < MARGIN ? rect.bottom + 6 : topAbove;

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
            setActiveAction(null);
            return;
          }

          const text = selection.getTextContent();
          if (!text.trim()) {
            setToolbarRect(null);
            return;
          }

          setSelectedText(text);
          // Usa rAF para garantir que o DOM da seleção foi atualizado
          requestAnimationFrame(() => {
            const pos = computePosition();
            setToolbarRect(pos);
          });
        });

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, disabled, computePosition]);

  // ── Limpa ao clicar fora ───────────────────────────────────
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) return;
      // Não limpa se ainda houver seleção (o editor tratará disso pelo SELECTION_CHANGE_COMMAND)
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // ── Ação IA ────────────────────────────────────────────────
  const handleAction = useCallback(
    (actionDef: ActionDef) => {
      if (!selectedText) return;

      setActiveAction(actionDef.key);

      const payload: AIActionEvent = {
        action: actionDef.key,
        selectedText,
        agent: actionDef.agent,
      };

      // 1. Callback prop (para composição no editor pai)
      onAction?.(payload);

      // 2. Evento nativo para desacoplamento total (FloatingChat, painel lateral, etc.)
      window.dispatchEvent(
        new CustomEvent<AIActionEvent>('notepress:ai-action', { detail: payload }),
      );
    },
    [selectedText, onAction],
  );

  // ── Copiar seleção ─────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!selectedText) return;
    await navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [selectedText]);

  // ── Render ─────────────────────────────────────────────────
  if (disabled || !toolbarRect || !selectedText || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Ações de IA para o texto selecionado"
      className="fat-toolbar"
      style={{
        position: 'fixed',
        top: toolbarRect.top,
        left: toolbarRect.left,
        zIndex: 9999,
      }}
    >
      {/* Ações de IA */}
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          title={action.title}
          aria-pressed={activeAction === action.key}
          className={`fat-toolbar__btn${activeAction === action.key ? ' fat-toolbar__btn--active' : ''}`}
          onClick={() => handleAction(action)}
        >
          {action.icon}
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
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    </div>,
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

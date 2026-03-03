'use client';

/**
 * GhostTextPlugin — Autocomplete estilo Copilot para o Notepress.
 *
 * Comportamento:
 *  - Após `debounceMs` de inatividade no cursor (collapsed, fim de parágrafo),
 *    chama `onRequestSuggestion(context)` para obter sugestão da IA.
 *  - Exibe o texto fantasma em zinc-500 imediatamente à direita do cursor.
 *  - Tab → aceita: insere o texto no documento.
 *  - Escape / qualquer outra tecla → descarta a sugestão.
 *  - A sugestão nunca faz parte do documento Lexical até ser aceita.
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
  $isElementNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createTextNode,
} from 'lexical';
import { $isAtNodeEnd } from '@lexical/selection';
import { Loader2 } from 'lucide-react';

// ── Tipos públicos ─────────────────────────────────────────────
export interface GhostTextPluginProps {
  /**
   * Callback assíncrono para requisitar sugestão da IA.
   * Recebe o texto do parágrafo atual como contexto.
   * Retorne `null` para não exibir sugestão.
   */
  onRequestSuggestion?: (context: string) => Promise<string | null>;
  /** Tempo de espera após parada de digitação antes de requisitar (ms). Padrão: 1200 */
  debounceMs?: number;
  /** Desativa completamente o plugin */
  disabled?: boolean;
}

// ── Estado interno ─────────────────────────────────────────────
interface GhostState {
  text: string;
  /** Posição CSS do cursor no viewport (para o overlay) */
  left: number;
  top: number;
  height: number;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  color: string;
}

// ── Plugin ─────────────────────────────────────────────────────
export default function GhostTextPlugin({
  onRequestSuggestion,
  debounceMs = 1200,
  disabled = false,
}: GhostTextPluginProps) {
  const [editor] = useLexicalComposerContext();

  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContext = useRef<string>('');
  const ghostPending = useRef<boolean>(false);

  // ── Limpa qualquer sugestão ativa ─────────────────────────
  const clearGhost = useCallback(() => {
    setGhost(null);
    setLoading(false);
    ghostPending.current = false;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  // ── Aceita a sugestão (insere no documento) ────────────────
  const acceptGhost = useCallback(
    (suggestion: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const textNode = $createTextNode(suggestion);
        selection.insertNodes([textNode]);
      });
      clearGhost();
    },
    [editor, clearGhost],
  );

  // ── Obtém a posição DOM do cursor para posicionar o overlay ─
  const getCursorRect = useCallback((): DOMRect | null => {
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return null;
    const range = domSelection.getRangeAt(0);
    // Range colapsado → rect tem left/right iguais na posição do cursor
    const rects = range.getClientRects();
    if (rects.length === 0) return range.getBoundingClientRect();
    return rects[rects.length - 1];
  }, []);

  // ── Obtém o estilo computado do elemento DOM do cursor ─────
  const getCursorStyle = useCallback((): Pick<GhostState, 'fontFamily' | 'fontSize' | 'lineHeight' | 'color'> => {
    const defaults = {
      fontFamily: "Merriweather, Georgia, serif",
      fontSize: '18px',
      lineHeight: '1.8',
      color: '#52525b',
    };
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return defaults;
    const range = domSelection.getRangeAt(0);
    const el = range.startContainer.parentElement;
    if (!el) return defaults;
    const cs = window.getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily || defaults.fontFamily,
      fontSize: cs.fontSize || defaults.fontSize,
      lineHeight: cs.lineHeight || defaults.lineHeight,
      color: '#52525b', // zinc-600 fixo para fantasma
    };
  }, []);

  // ── Pipeline: selecionar → debounce → requisitar → exibir ─
  useEffect(() => {
    if (disabled || !onRequestSuggestion) return;

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        // Limpa sugestão atual ao mover cursor
        clearGhost();

        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;

          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();

          // Só sugere no fim de um nó de texto dentro de um ElementNode
          const parent = anchorNode.getParent();
          if (!$isElementNode(parent)) return;
          if (!$isAtNodeEnd(anchor)) return;

          // Coleta o texto do parágrafo como contexto
          const context = parent.getTextContent().trim();
          if (!context || context.length < 20) return; // contexto mínimo

          latestContext.current = context;
          ghostPending.current = true;

          debounceTimer.current = setTimeout(async () => {
            if (!ghostPending.current) return;

            const rect = getCursorRect();
            const style = getCursorStyle();
            if (!rect) return;

            setLoading(true);

            try {
              const suggestion = await onRequestSuggestion(context);
              if (!suggestion || !ghostPending.current) return;

              setGhost({
                text: suggestion,
                left: rect.right,
                top: rect.top,
                height: rect.height,
                ...style,
              });
            } finally {
              setLoading(false);
            }
          }, debounceMs);
        });

        return false; // não consome o evento
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, disabled, onRequestSuggestion, debounceMs, clearGhost, getCursorRect, getCursorStyle]);

  // ── Tab: aceitar sugestão ──────────────────────────────────
  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        if (!ghost) return false;
        event?.preventDefault();
        acceptGhost(ghost.text);
        return true; // consome o Tab (evita indentação)
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, ghost, acceptGhost]);

  // ── Escape: descartar sugestão ─────────────────────────────
  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        if (!ghost && !loading) return false;
        clearGhost();
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, ghost, loading, clearGhost]);

  // ── Render ─────────────────────────────────────────────────
  if (disabled || typeof document === 'undefined') return null;

  // Indicador de carregamento próximo ao cursor
  if (loading) {
    const rect = getCursorRect();
    if (!rect) return null;
    return createPortal(
      <span
        className="ghost-text-loader"
        style={{
          position: 'fixed',
          top: rect.top + (rect.height - 14) / 2,
          left: rect.right + 6,
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      >
        <Loader2 size={14} className="animate-spin" />
      </span>,
      document.body,
    );
  }

  if (!ghost) return null;

  return createPortal(
    <span
      aria-hidden="true"
      className="ghost-text-overlay"
      style={{
        position: 'fixed',
        top: ghost.top,
        left: ghost.left,
        height: ghost.height,
        lineHeight: ghost.lineHeight,
        fontFamily: ghost.fontFamily,
        fontSize: ghost.fontSize,
        color: ghost.color,
        pointerEvents: 'none',
        whiteSpace: 'pre',
        zIndex: 9998,
        userSelect: 'none',
      }}
    >
      {ghost.text}
      <kbd className="ghost-text-hint">Tab</kbd>
    </span>,
    document.body,
  );
}

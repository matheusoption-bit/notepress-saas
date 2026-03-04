'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { type EditorState } from 'lexical';
import LexicalTheme from './LexicalTheme';
import SlashCommandPlugin from './SlashCommandPlugin';
import { MarkdownShortcutPlugin, NOTEPRESS_TRANSFORMERS } from './MarkdownPlugins';
import GhostTextPlugin, { type GhostTextPluginProps } from './GhostTextPlugin';
import FloatingActionToolbar, {
  AIStampPlugin,
  type FloatingActionToolbarProps,
} from './FloatingActionToolbar';
import { CUSTOM_NODES } from './CustomNodes';
import WidgetInsertPlugin from './WidgetInsertPlugin';
import AudioRecorderPlugin from './AudioRecorderPlugin';

// ── Nodes registrados ──────────────────────────────────────────
const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
  // ── Decorator Nodes (widgets reativos) ───────────────────
  ...CUSTOM_NODES,
];

// ── Placeholder "Floating Paper" ───────────────────────────────
function Placeholder() {
  return (
    <div className="lexical-placeholder">
      Comece a escrever sua tese de inovação...
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────
interface LexicalEditorProps {
  /** Namespace único por instância do editor */
  namespace?: string;
  /**
   * Callback disparado ao modificar o conteúdo.
   * Recebe o estado serializado como JSON puro (string) — pronto
   * para ser persistido no campo `content` do modelo Document do Prisma.
   */
  onChange?: (json: string) => void;
  /** Conteúdo inicial serializado (JSON do Lexical) */
  initialState?: string | null;
  /** Habilita foco automático ao montar */
  autoFocus?: boolean;
  /** Modo de leitura — desabilita edição e slash commands */
  readOnly?: boolean;
  /** Ignora mudanças de historico (undo/redo) para o callback onChange */
  ignoreHistoryMerge?: boolean;
  /**
   * ID do notebook para auto-save via PATCH /api/notebooks/[notebookId].
   * Quando fornecido, o editor salva automaticamente com debounce de 2s.
   */
  notebookId?: string;
  // ── IA ──────────────────────────────────────────────────────
  /**
   * Callback de ação de IA (Melhorar Escrita, Validar, Analisar Risco).
   * Recebe o texto selecionado e qual agente deve tratar a ação.
   */
  onAIAction?: FloatingActionToolbarProps['onAction'];
  /**
   * Função assíncrona para Ghost Text: dado o contexto (parágrafo atual),
   * retorna a sugestão de autocomplete. Use null para desabilitar o Ghost Text.
   */
  onRequestSuggestion?: GhostTextPluginProps['onRequestSuggestion'];
  /** Desabilita explicitamente o Ghost Text (útil em readOnly) */
  ghostTextDisabled?: boolean;
}

// ── Status do auto-save ────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Componente principal ───────────────────────────────────────
export default function LexicalEditor({
  namespace = 'notepress-editor',
  onChange,
  initialState,
  autoFocus = true,
  readOnly = false,
  ignoreHistoryMerge = false,
  notebookId,
  onAIAction,
  onRequestSuggestion,
  ghostTextDisabled = false,
}: LexicalEditorProps) {
  const onError = useCallback((error: Error) => {
    console.error('[LexicalEditor]', error);
  }, []);

  // ── Auto-save ──────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const onAutoSave = useCallback(
    async (json: string) => {
      if (!notebookId) return;
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/notebooks/${notebookId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: json }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSaveStatus('saved');
        // Retorna para 'idle' após 3s
        savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('[LexicalEditor] auto-save falhou:', err);
        setSaveStatus('error');
      }
    },
    [notebookId],
  );

  // ── Persistência JSON ──────────────────────────────────────
  const handleChange = useCallback(
    (editorState: EditorState) => {
      // Serializa o estado para JSON puro compatível com Prisma
      const json = JSON.stringify(editorState.toJSON());

      // Callback externo (se fornecido)
      onChange?.(json);

      // Auto-save com debounce de 2s
      if (notebookId) {
        setSaveStatus('saving');
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        debounceTimer.current = setTimeout(() => {
          void onAutoSave(json);
        }, 2000);
      }
    },
    [onChange, notebookId, onAutoSave],
  );

  const initialConfig = {
    namespace,
    theme: LexicalTheme,
    nodes: editorNodes,
    onError,
    editorState: initialState ?? undefined,
    editable: !readOnly,
  };

  // ── Label do status de salvamento ──────────────────────────
  const saveLabel =
    saveStatus === 'saving' ? 'Salvando…' :
    saveStatus === 'saved'  ? 'Salvo ✓'  :
    saveStatus === 'error'  ? 'Erro ao salvar' :
    null;

  return (
    // ── Canvas de rolagem infinita ─────────────────────────
    <div className="lexical-canvas">
      <LexicalComposer initialConfig={initialConfig}>
        {/* ── Folha A4 flutuante ──────────────────────── */}
        <div className="lexical-paper">
          {/* ── Área de edição ──────────────────────── */}
          <div className="lexical-editor-wrapper">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="lexical-content-editable"
                  aria-label="Editor de texto"
                  aria-multiline
                  spellCheck
                />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />

            {/* ── Plugins de estrutura ──────────────── */}
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <TabIndentationPlugin />
            <TablePlugin />

            {/* ── Markdown Shortcuts ────────────────── */}
            {/* # → H1  ## → H2  > → quote  - → lista  1. → ol  ``` → code */}
            <MarkdownShortcutPlugin transformers={NOTEPRESS_TRANSFORMERS} />

            {/* ── Slash Commands (/bloco) ───────────── */}
            {!readOnly && <SlashCommandPlugin />}

            {/* ── Widget Decorator Nodes ─────────────── */}
            {!readOnly && <WidgetInsertPlugin />}

            {/* ── Auto foco ─────────────────────────── */}
            {autoFocus && <AutoFocusPlugin />}

            {/* ── Persistência JSON → Prisma ────────── */}
            {onChange && (
              <OnChangePlugin
                onChange={handleChange}
                ignoreHistoryMergeTagChange={ignoreHistoryMerge}
              />
            )}

            {/* ── Ghost Text (Copilot) ──────────────── */}
            {!readOnly && (
              <GhostTextPlugin
                onRequestSuggestion={onRequestSuggestion}
                disabled={ghostTextDisabled || !onRequestSuggestion}
              />
            )}

            {/* ── Floating IA Toolbar ───────────────── */}
            {!readOnly && (
              <FloatingActionToolbar
                onAction={onAIAction}
                disabled={false}
              />
            )}

            {/* ── AI Stamp (decoração de parágrafos IA) */}
            <AIStampPlugin />

            {/* ── Brainstorm: escuta evento e insere BrainstormNode ── */}
            {!readOnly && <AudioRecorderPlugin />}
          </div>

          {/* ── Indicador de auto-save ────────────────────────────── */}
          {notebookId && saveLabel && (
            <div
              aria-live="polite"
              className={[
                'lexical-save-status',
                saveStatus === 'saving' ? 'lexical-save-status--saving' : '',
                saveStatus === 'saved'  ? 'lexical-save-status--saved'  : '',
                saveStatus === 'error'  ? 'lexical-save-status--error'  : '',
              ].join(' ').trim()}
            >
              {saveStatus === 'saving' && (
                <span className="lexical-save-status__spinner" aria-hidden="true" />
              )}
              {saveLabel}
            </div>
          )}
        </div>
      </LexicalComposer>
    </div>
  );
}

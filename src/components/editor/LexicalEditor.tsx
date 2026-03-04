'use client';

import { useCallback, useEffect, useRef } from 'react';
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
import {
  useDocumentAutoSave,
  type SaveStatus,
} from '@/hooks/useDocumentAutoSave';

// Re-export para consumo externo (page, header, etc.)
export type { SaveStatus };

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
   * Recebe o EditorState bruto — a serialização é responsabilidade
   * do consumidor (ex: useDocumentAutoSave).
   */
  onChange?: (editorState: EditorState) => void;
  /** Conteúdo inicial serializado (JSON do Lexical) */
  initialState?: string | null;
  /** Habilita foco automático ao montar */
  autoFocus?: boolean;
  /** Modo de leitura — desabilita edição e slash commands */
  readOnly?: boolean;
  /** Ignora mudanças de historico (undo/redo) para o callback onChange */
  ignoreHistoryMerge?: boolean;
  /**
   * ID do notebook para auto-save via useDocumentAutoSave.
   * Quando fornecido, o editor salva automaticamente com debounce.
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
  /** Callback que recebe o SaveStatus atual para exibição externa (ex: header) */
  onSaveStatusChange?: (status: SaveStatus) => void;
}

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
  onSaveStatusChange,
}: LexicalEditorProps) {
  const onError = useCallback((error: Error) => {
    console.error('[LexicalEditor]', error);
  }, []);

  // ── Auto-save desacoplado via hook ─────────────────────────
  const { saveStatus, handleChange: handleAutoSave } = useDocumentAutoSave({
    notebookId,
  });

  // Notifica o consumidor externo sobre mudanças de status
  const prevStatusRef = useRef(saveStatus);
  useEffect(() => {
    if (prevStatusRef.current !== saveStatus) {
      prevStatusRef.current = saveStatus;
      onSaveStatusChange?.(saveStatus);
    }
  }, [saveStatus, onSaveStatusChange]);

  // ── Combina auto-save + callback externo ─────────────────
  const handleChange = useCallback(
    (editorState: EditorState) => {
      // Repassa o EditorState bruto para o callback externo
      onChange?.(editorState);
      // Agenda auto-save via hook (debounce interno, sem stringify por keystroke)
      handleAutoSave(editorState);
    },
    [onChange, handleAutoSave],
  );

  const initialConfig = {
    namespace,
    theme: LexicalTheme,
    nodes: editorNodes,
    onError,
    editorState: initialState ?? undefined,
    editable: !readOnly,
  };

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
            {(onChange || notebookId) && (
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

        </div>
      </LexicalComposer>
    </div>
  );
}

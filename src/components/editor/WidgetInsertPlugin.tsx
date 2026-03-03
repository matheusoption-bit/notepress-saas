'use client';

/**
 * WidgetInsertPlugin — Registra os handlers dos comandos de inserção
 * dos Decorator Nodes no Notepress.
 *
 * Deve ser montado dentro do <LexicalComposer> no LexicalEditor.tsx.
 * For cada comando, insere o nó correspondente na posição do cursor.
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_NORMAL,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createTRLNode, INSERT_TRL_WIDGET_COMMAND }                      from './nodes/TRLNode';
import { $createEditalChecklistNode, INSERT_EDITAL_CHECKLIST_COMMAND }    from './nodes/EditalChecklistNode';
import { $createCostTableNode, INSERT_COST_TABLE_COMMAND }                from './nodes/CostTableNode';
import { $createBrainstormNode, INSERT_BRAINSTORM_COMMAND }               from './nodes/BrainstormNode';
import { $createMermaidDiagramNode, INSERT_MERMAID_COMMAND }              from './nodes/MermaidDiagramNode';

// ── Utilitário: insere nó de bloco na posição atual ────────────
type AnyWidgetNode = ReturnType<
  | typeof $createTRLNode
  | typeof $createEditalChecklistNode
  | typeof $createCostTableNode
  | typeof $createBrainstormNode
  | typeof $createMermaidDiagramNode
>;
function insertBlock(editor: ReturnType<typeof useLexicalComposerContext>[0], node: AnyWidgetNode) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Insere o widget e um parágrafo vazio após ele
      const followParagraph = $createParagraphNode();
      selection.insertNodes([node, followParagraph]);
    }
  });
}

export default function WidgetInsertPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      // ── TRL Widget ─────────────────────────────────────────
      editor.registerCommand(
        INSERT_TRL_WIDGET_COMMAND,
        (payload) => {
          const node = $createTRLNode(payload?.trl ?? 1);
          insertBlock(editor, node);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),

      // ── Edital Checklist ────────────────────────────────────
      editor.registerCommand(
        INSERT_EDITAL_CHECKLIST_COMMAND,
        (payload) => {
          const node = $createEditalChecklistNode(
            payload?.editalId ?? null,
            payload?.editalNome ?? 'Edital',
            payload?.items,
          );
          insertBlock(editor, node);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),

      // ── Cost Table ─────────────────────────────────────────
      editor.registerCommand(
        INSERT_COST_TABLE_COMMAND,
        (payload) => {
          const node = $createCostTableNode(
            payload?.editalId ?? null,
            payload?.editalNome ?? 'Edital',
            payload?.valorMax ?? null,
          );
          insertBlock(editor, node);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),

      // ── Brainstorm ─────────────────────────────────────────
      editor.registerCommand(
        INSERT_BRAINSTORM_COMMAND,
        (payload) => {
          const node = $createBrainstormNode(payload ?? {});
          insertBlock(editor, node);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),

      // ── Mermaid Diagram ────────────────────────────────────
      editor.registerCommand(
        INSERT_MERMAID_COMMAND,
        (payload) => {
          const node = $createMermaidDiagramNode(payload?.code);
          insertBlock(editor, node);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }, [editor]);

  return null;
}

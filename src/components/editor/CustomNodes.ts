/**
 * CustomNodes.ts — Registro central de todos os Decorator Nodes do Notepress.
 *
 * Importe `CUSTOM_NODES` e adicione ao array `nodes` do `LexicalComposer`.
 * Importe os comandos de inserção individuais para usar no SlashCommandPlugin
 * ou em qualquer outro plugin de inserção.
 *
 * ────────────────────────────────────────────────
 * Widget        | Node Class             | Comando
 * ────────────────────────────────────────────────
 * TRL Slider    | TRLNode                | INSERT_TRL_WIDGET_COMMAND
 * Checklist     | EditalChecklistNode    | INSERT_EDITAL_CHECKLIST_COMMAND
 * Tabela Custos | CostTableNode          | INSERT_COST_TABLE_COMMAND
 * ────────────────────────────────────────────────
 */

import type { Klass, LexicalNode } from 'lexical';

// ── Nodes ──────────────────────────────────────────────────────
export { TRLNode, $createTRLNode, $isTRLNode } from './nodes/TRLNode';
export { EditalChecklistNode, $createEditalChecklistNode, $isEditalChecklistNode } from './nodes/EditalChecklistNode';
export { CostTableNode, $createCostTableNode, $isCostTableNode } from './nodes/CostTableNode';

// ── Comandos de Inserção ───────────────────────────────────────
export { INSERT_TRL_WIDGET_COMMAND }          from './nodes/TRLNode';
export { INSERT_EDITAL_CHECKLIST_COMMAND }     from './nodes/EditalChecklistNode';
export { INSERT_COST_TABLE_COMMAND }          from './nodes/CostTableNode';

// ── Tipos serializados (para JSON do Prisma) ───────────────────
export type { SerializedTRLNode }              from './nodes/TRLNode';
export type { SerializedEditalChecklistNode, ChecklistItem } from './nodes/EditalChecklistNode';
export type { SerializedCostTableNode, CostRow }             from './nodes/CostTableNode';

// ── Array de registro para o LexicalComposer ──────────────────
import { TRLNode }             from './nodes/TRLNode';
import { EditalChecklistNode } from './nodes/EditalChecklistNode';
import { CostTableNode }       from './nodes/CostTableNode';

export const CUSTOM_NODES: Klass<LexicalNode>[] = [
  TRLNode,
  EditalChecklistNode,
  CostTableNode,
];

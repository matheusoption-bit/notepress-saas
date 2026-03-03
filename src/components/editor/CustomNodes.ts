/**
 * CustomNodes.ts — Registro central de todos os Decorator Nodes do Notepress.
 *
 * Importe `CUSTOM_NODES` e adicione ao array `nodes` do `LexicalComposer`.
 * Importe os comandos de inserção individuais para usar no SlashCommandPlugin
 * ou em qualquer outro plugin de inserção.
 *
 * ────────────────────────────────────────────────
 * Widget            | Node Class                 | Comando
 * ──────────────────────────────────────────────────────────────────
 * TRL Slider        | TRLNode                    | INSERT_TRL_WIDGET_COMMAND
 * Checklist         | EditalChecklistNode        | INSERT_EDITAL_CHECKLIST_COMMAND
 * Tabela Custos     | CostTableNode              | INSERT_COST_TABLE_COMMAND
 * Brainstorm        | BrainstormNode             | INSERT_BRAINSTORM_COMMAND
 * Diagrama          | MermaidDiagramNode         | INSERT_MERMAID_COMMAND
 * Consenso IA       | DebateConsensusNode        | INSERT_DEBATE_CONSENSUS_COMMAND
 * Validador Inov.   | InnovationValidatorNode    | INSERT_INNOVATION_VALIDATOR_COMMAND
 * ──────────────────────────────────────────────────────────────────
 */

import type { Klass, LexicalNode } from 'lexical';

// ── Nodes ──────────────────────────────────────────────────────
export { TRLNode, $createTRLNode, $isTRLNode } from './nodes/TRLNode';
export { EditalChecklistNode, $createEditalChecklistNode, $isEditalChecklistNode } from './nodes/EditalChecklistNode';
export { CostTableNode, $createCostTableNode, $isCostTableNode } from './nodes/CostTableNode';
export { BrainstormNode, $createBrainstormNode, $isBrainstormNode } from './nodes/BrainstormNode';
export { MermaidDiagramNode, $createMermaidDiagramNode, $isMermaidDiagramNode } from './nodes/MermaidDiagramNode';
export { DebateConsensusNode, $createDebateConsensusNode, $isDebateConsensusNode } from './nodes/DebateConsensusNode';
export { InnovationValidatorNode, $createInnovationValidatorNode, $isInnovationValidatorNode } from './nodes/InnovationValidatorNode';

// ── Comandos de Inserção ───────────────────────────────────────
export { INSERT_TRL_WIDGET_COMMAND }          from './nodes/TRLNode';
export { INSERT_EDITAL_CHECKLIST_COMMAND }     from './nodes/EditalChecklistNode';
export { INSERT_COST_TABLE_COMMAND }          from './nodes/CostTableNode';
export { INSERT_BRAINSTORM_COMMAND }           from './nodes/BrainstormNode';
export { INSERT_MERMAID_COMMAND }              from './nodes/MermaidDiagramNode';
export { INSERT_DEBATE_CONSENSUS_COMMAND }      from './nodes/DebateConsensusNode';
export { INSERT_INNOVATION_VALIDATOR_COMMAND } from './nodes/InnovationValidatorNode';

// ── Tipos serializados (para JSON do Prisma) ───────────────────
export type { SerializedTRLNode }              from './nodes/TRLNode';
export type { SerializedEditalChecklistNode, ChecklistItem } from './nodes/EditalChecklistNode';
export type { SerializedCostTableNode, CostRow }             from './nodes/CostTableNode';
export type { SerializedBrainstormNode, BrainstormPayload }  from './nodes/BrainstormNode';
export type { SerializedMermaidDiagramNode }  from './nodes/MermaidDiagramNode';
export type { SerializedDebateConsensusNode, DebateConsensusPayload } from './nodes/DebateConsensusNode';
export type { SerializedInnovationValidatorNode, InnovationValidatorPayload, PatentResult } from './nodes/InnovationValidatorNode';

// ── Array de registro para o LexicalComposer ──────────────────
import { TRLNode }             from './nodes/TRLNode';
import { EditalChecklistNode } from './nodes/EditalChecklistNode';
import { CostTableNode }       from './nodes/CostTableNode';
import { BrainstormNode }      from './nodes/BrainstormNode';
import { MermaidDiagramNode }  from './nodes/MermaidDiagramNode';
import { DebateConsensusNode } from './nodes/DebateConsensusNode';
import { InnovationValidatorNode } from './nodes/InnovationValidatorNode';

export const CUSTOM_NODES: Klass<LexicalNode>[] = [
  TRLNode,
  EditalChecklistNode,
  CostTableNode,
  BrainstormNode,
  MermaidDiagramNode,
  DebateConsensusNode,
  InnovationValidatorNode,
];

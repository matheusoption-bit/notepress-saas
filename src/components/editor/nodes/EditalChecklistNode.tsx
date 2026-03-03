'use client';

/**
 * EditalChecklistNode — Decorator Node do Lexical para Checklist de Edital.
 *
 * Vincula-se ao campo `documentosChecklist: Json` do model Edital no Prisma.
 * Também permite uso standalone (sem editalId) para checklists livres.
 *
 * Estrutura do JSON do Prisma esperada:
 *   [{ label: string; required: boolean; tip?: string }]
 */

import { useCallback, useState } from 'react';
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
import { ClipboardList, CheckCircle2, Circle, AlertCircle, RefreshCw } from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
  tip?: string;
}

export type SerializedEditalChecklistNode = Spread<
  {
    editalId: string | null;
    editalNome: string;
    items: ChecklistItem[];
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_EDITAL_CHECKLIST_COMMAND: LexicalCommand<{
  editalId?: string;
  editalNome?: string;
  items?: ChecklistItem[];
}> = createCommand('INSERT_EDITAL_CHECKLIST_COMMAND');

// ── Items default (quando não há editalId) ─────────────────────
const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', label: 'Carta de Apresentação assinada pelo dirigente', required: true,  done: false, tip: 'Deve ser em papel timbrado e assinatura com reconhecimento de firma' },
  { id: '2', label: 'Plano de Trabalho detalhado',                   required: true,  done: false, tip: 'Mínimo 10 páginas; use nosso template específico' },
  { id: '3', label: 'Orçamento detalhado (Planilha Excel)',           required: true,  done: false },
  { id: '4', label: 'CNPJ ativo e regular na Receita Federal',        required: true,  done: false },
  { id: '5', label: 'Certidão de Regularidade do FGTS',               required: true,  done: false },
  { id: '6', label: 'Certidão Negativa de Débitos Trabalhistas',       required: true,  done: false },
  { id: '7', label: 'Estatuto Social atualizado',                      required: false, done: false },
  { id: '8', label: 'Declaração de contrapartida (se exigida)',        required: false, done: false, tip: 'Verifique se o edital exige contrapartida financeira' },
  { id: '9', label: 'Curriculum vitae do coordenador técnico',         required: false, done: false },
];

// ══════════════════════════════════════════════════════════════
// ── Componente React ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface EditalChecklistWidgetProps {
  nodeKey: NodeKey;
  editalId: string | null;
  editalNome: string;
  initialItems: ChecklistItem[];
}

function EditalChecklistWidget({ nodeKey, editalId, editalNome, initialItems }: EditalChecklistWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [syncing, setSyncing] = useState(false);

  const done  = items.filter((i) => i.done).length;
  const total = items.length;
  const requiredDone = items.filter((i) => i.required && i.done).length;
  const requiredTotal = items.filter((i) => i.required).length;
  const allRequiredDone = requiredDone === requiredTotal;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const toggle = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id ? { ...item, done: !item.done } : item,
        );
        // Persiste no node Lexical
        editor.update(() => {
          const node = editor.getEditorState()._nodeMap.get(nodeKey);
          if (node instanceof EditalChecklistNode) {
            const writable = node.getWritable() as EditalChecklistNode;
            writable.__items = next;
          }
        });
        return next;
      });
    },
    [editor, nodeKey],
  );

  const handleSync = useCallback(async () => {
    if (!editalId) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/editais/${editalId}`);
      if (!res.ok) return;
      const data = await res.json();
      const rawList = data?.documentosChecklist;
      if (!Array.isArray(rawList)) return;

      const synced: ChecklistItem[] = rawList.map(
        (raw: { label?: string; required?: boolean; tip?: string }, idx: number) => ({
          id: String(idx + 1),
          label: raw.label ?? `Item ${idx + 1}`,
          required: raw.required ?? false,
          tip: raw.tip,
          done: items.find((i) => i.label === raw.label)?.done ?? false,
        }),
      );
      setItems(synced);
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node instanceof EditalChecklistNode) {
          (node.getWritable() as EditalChecklistNode).__items = synced;
        }
      });
    } finally {
      setSyncing(false);
    }
  }, [editalId, items, editor, nodeKey]);

  return (
    <div
      className={`ecl-widget${isSelected ? ' ecl-widget--selected' : ''}`}
      onClick={() => setSelected(true)}
      contentEditable={false}
    >
      {/* Cabeçalho */}
      <div className="ecl-widget__header">
        <span className="ecl-widget__icon"><ClipboardList size={14} /></span>
        <div className="ecl-widget__header-text">
          <span className="ecl-widget__title">Checklist de Documentos</span>
          {editalNome && (
            <span className="ecl-widget__subtitle">{editalNome}</span>
          )}
        </div>
        <div className="ecl-widget__header-actions">
          {/* Progresso resumido */}
          <span className={`ecl-widget__progress-badge${allRequiredDone ? ' ecl-widget__progress-badge--ok' : ''}`}>
            {done}/{total}
          </span>
          {/* Sincronizar com Prisma */}
          {editalId && (
            <button
              type="button"
              title="Sincronizar com dados do edital"
              className="ecl-widget__sync-btn"
              onClick={(e) => { e.stopPropagation(); handleSync(); }}
              disabled={syncing}
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="ecl-widget__progressbar-track">
        <div
          className={`ecl-widget__progressbar-fill${allRequiredDone ? ' ecl-widget__progressbar-fill--complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="ecl-widget__progress-text">
        <span className={allRequiredDone ? 'ecl-widget__ok-text' : 'ecl-widget__pending-text'}>
          {allRequiredDone
            ? `✓ Todos os documentos obrigatórios reunidos (${requiredTotal}/${requiredTotal})`
            : `${requiredDone}/${requiredTotal} obrigatórios · ${pct}% concluído`}
        </span>
      </div>

      {/* Lista de itens */}
      <ul className="ecl-widget__list" role="list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`ecl-widget__item${item.done ? ' ecl-widget__item--done' : ''}${item.required && !item.done ? ' ecl-widget__item--required' : ''}`}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              className="ecl-widget__check-btn"
              onClick={(e) => { e.stopPropagation(); toggle(item.id); }}
              aria-label={item.done ? `Desmarcar: ${item.label}` : `Marcar: ${item.label}`}
            >
              {item.done
                ? <CheckCircle2 size={15} className="ecl-widget__check-done" />
                : <Circle size={15} className="ecl-widget__check-empty" />}
            </button>
            <div className="ecl-widget__item-body">
              <span className="ecl-widget__item-label">{item.label}</span>
              {item.required && !item.done && (
                <span className="ecl-widget__required-badge">Obrigatório</span>
              )}
              {item.tip && (
                <p className="ecl-widget__item-tip">
                  <AlertCircle size={10} />
                  {item.tip}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── EditalChecklistNode — DecoratorNode ──────────────────────
// ══════════════════════════════════════════════════════════════
export class EditalChecklistNode extends DecoratorNode<JSX.Element> {
  __editalId: string | null;
  __editalNome: string;
  __items: ChecklistItem[];

  static getType(): string {
    return 'edital-checklist';
  }

  static clone(node: EditalChecklistNode): EditalChecklistNode {
    return new EditalChecklistNode(
      node.__editalId,
      node.__editalNome,
      node.__items,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedEditalChecklistNode): EditalChecklistNode {
    return $createEditalChecklistNode(
      serialized.editalId,
      serialized.editalNome,
      serialized.items,
    );
  }

  constructor(
    editalId: string | null = null,
    editalNome: string = 'Edital',
    items: ChecklistItem[] = DEFAULT_ITEMS,
    key?: NodeKey,
  ) {
    super(key);
    this.__editalId   = editalId;
    this.__editalNome = editalNome;
    this.__items      = items;
  }

  exportJSON(): SerializedEditalChecklistNode {
    return {
      ...super.exportJSON(),
      type: 'edital-checklist',
      version: 1,
      editalId:   this.__editalId,
      editalNome: this.__editalNome,
      items:      this.__items,
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
      <EditalChecklistWidget
        nodeKey={this.__key}
        editalId={this.__editalId}
        editalNome={this.__editalNome}
        initialItems={this.__items}
      />
    );
  }
}

// ── Factories ──────────────────────────────────────────────────
export function $createEditalChecklistNode(
  editalId: string | null = null,
  editalNome: string = 'Edital',
  items: ChecklistItem[] = DEFAULT_ITEMS,
): EditalChecklistNode {
  return new EditalChecklistNode(editalId, editalNome, items);
}

export function $isEditalChecklistNode(
  node: LexicalNode | null | undefined,
): node is EditalChecklistNode {
  return node instanceof EditalChecklistNode;
}

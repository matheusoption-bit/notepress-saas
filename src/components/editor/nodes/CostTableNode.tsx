'use client';

/**
 * CostTableNode — Decorator Node do Lexical para Tabela de Custos Inteligente.
 *
 * Exibe uma tabela editável de itens de custo (categoria, descrição, valor).
 * Valida automaticamente se o total está dentro do `valorMax` do Edital (Prisma).
 * A IA enriquece a análise via `onRequestValidation` prop ou evento global.
 */

import { useCallback, useMemo, useState } from 'react';
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
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
export interface CostRow {
  id: string;
  category: string;
  description: string;
  value: number;
  /** Sugestão da IA para este item */
  aiNote?: string;
  /** Status de validação deste item */
  aiStatus?: 'ok' | 'high' | 'low' | 'unknown';
}

export type SerializedCostTableNode = Spread<
  {
    editalId: string | null;
    editalNome: string;
    valorMax: number | null;
    rows: CostRow[];
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_COST_TABLE_COMMAND: LexicalCommand<{
  editalId?: string;
  editalNome?: string;
  valorMax?: number;
}> = createCommand('INSERT_COST_TABLE_COMMAND');

// ── Categorias padrão ──────────────────────────────────────────
const CATEGORIES = [
  'Pessoal', 'Bolsas', 'Equipamentos', 'Material de Consumo',
  'Serviços de Terceiros', 'Viagens e Diárias', 'Overhead', 'Outros',
];

// ── Formatador de moeda BRL ────────────────────────────────────
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatBRL(v: number) { return fmt.format(v); }

function parseFloat2(s: string): number {
  const n = parseFloat(s.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// ── Status visual ──────────────────────────────────────────────
const STATUS_CONFIG = {
  ok:      { icon: <CheckCircle  size={12} />, label: 'Compatível',   cls: 'cost-ai-ok'      },
  high:    { icon: <TrendingUp   size={12} />, label: 'Acima do esperado', cls: 'cost-ai-high' },
  low:     { icon: <TrendingDown size={12} />, label: 'Abaixo do esperado', cls: 'cost-ai-low' },
  unknown: { icon: <AlertTriangle size={12} />, label: 'Verificar',    cls: 'cost-ai-unknown' },
};

// ── Linhas iniciais ────────────────────────────────────────────
const DEFAULT_ROWS: CostRow[] = [
  { id: '1', category: 'Pessoal',      description: 'Coordenador técnico (12 meses)',   value: 72000 },
  { id: '2', category: 'Bolsas',       description: 'Bolsa de pesquisa DTI-A',           value: 18000 },
  { id: '3', category: 'Equipamentos', description: 'Servidor de processamento',         value: 15000 },
  { id: '4', category: 'Outros',       description: '',                                    value: 0 },
];

// ══════════════════════════════════════════════════════════════
// ── Componente React ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface CostTableWidgetProps {
  nodeKey:    NodeKey;
  editalId:   string | null;
  editalNome: string;
  valorMax:   number | null;
  initialRows: CostRow[];
}

function CostTableWidget({ nodeKey, editalId, editalNome, valorMax, initialRows }: CostTableWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [rows, setRows] = useState<CostRow[]>(initialRows);
  const [analyzing, setAnalyzing] = useState(false);

  // Total e análise rápida
  const total = useMemo(() => rows.reduce((s, r) => s + r.value, 0), [rows]);
  const overBudget = valorMax !== null && total > valorMax;
  const underBudget = valorMax !== null && total < valorMax * 0.5;

  // Persiste no nó Lexical
  const persistRows = useCallback(
    (next: CostRow[]) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node instanceof CostTableNode) {
          (node.getWritable() as CostTableNode).__rows = next;
        }
      });
    },
    [editor, nodeKey],
  );

  const updateRow = useCallback(
    (id: string, field: keyof CostRow, raw: string | number) => {
      setRows((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? { ...r, [field]: field === 'value' ? parseFloat2(String(raw)) : raw }
            : r,
        );
        persistRows(next);
        return next;
      });
    },
    [persistRows],
  );

  const addRow = useCallback(() => {
    const next = [
      ...rows,
      { id: String(Date.now()), category: 'Outros', description: '', value: 0 },
    ];
    setRows(next);
    persistRows(next);
  }, [rows, persistRows]);

  const removeRow = useCallback(
    (id: string) => {
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      persistRows(next);
    },
    [rows, persistRows],
  );

  // Validação por IA
  const handleAIValidate = useCallback(async () => {
    setAnalyzing(true);
    try {
      // Dispara evento para o pipeline de IA do Notepress
      const payload = { rows, total, valorMax, editalId, editalNome };
      window.dispatchEvent(
        new CustomEvent('notepress:cost-validate', { detail: payload }),
      );

      // Simula resposta (em produção, ouvir 'notepress:cost-validate-result')
      await new Promise((r) => setTimeout(r, 1800));

      // Marca cada item com status mock (substituir pelo resultado real da IA)
      setRows((prev) => {
        const next = prev.map((r) => ({
          ...r,
          aiStatus: (r.value > 0 ? (r.value > total * 0.5 ? 'high' : 'ok') : 'unknown') as CostRow['aiStatus'],
          aiNote: r.value > total * 0.5
            ? 'Item concentra >50% do orçamento. Verifique justificativa detalhada.'
            : r.value === 0 ? 'Preencha o valor para validação.'
            : 'Dentro do padrão para editais similares.',
        }));
        persistRows(next);
        return next;
      });
    } finally {
      setAnalyzing(false);
    }
  }, [rows, total, valorMax, editalId, editalNome, persistRows]);

  return (
    <div
      className={`cost-widget${isSelected ? ' cost-widget--selected' : ''}`}
      onClick={() => setSelected(true)}
      contentEditable={false}
    >
      {/* Cabeçalho */}
      <div className="cost-widget__header">
        <span className="cost-widget__icon"><DollarSign size={14} /></span>
        <div className="cost-widget__header-text">
          <span className="cost-widget__title">Tabela de Custos</span>
          {editalNome && <span className="cost-widget__subtitle">{editalNome}</span>}
        </div>
        <button
          type="button"
          className="cost-widget__ai-btn"
          onClick={(e) => { e.stopPropagation(); handleAIValidate(); }}
          disabled={analyzing}
          title="Analisar custos com IA"
        >
          {analyzing
            ? <Loader2 size={12} className="animate-spin" />
            : <Sparkles size={12} />}
          {analyzing ? 'Analisando...' : 'Validar com IA'}
        </button>
      </div>

      {/* Tabela */}
      <div className="cost-widget__table-wrapper">
        <table className="cost-widget__table">
          <thead>
            <tr>
              <th className="cost-widget__th cost-widget__th--category">Categoria</th>
              <th className="cost-widget__th cost-widget__th--desc">Descrição</th>
              <th className="cost-widget__th cost-widget__th--value">Valor (R$)</th>
              <th className="cost-widget__th cost-widget__th--ai">IA</th>
              <th className="cost-widget__th cost-widget__th--del" aria-label="Remover" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`cost-widget__row${row.aiStatus ? ` cost-row--${row.aiStatus}` : ''}`}>
                {/* Categoria */}
                <td className="cost-widget__td">
                  <select
                    className="cost-widget__select"
                    value={row.category}
                    onChange={(e) => { e.stopPropagation(); updateRow(row.id, 'category', e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                {/* Descrição */}
                <td className="cost-widget__td">
                  <input
                    className="cost-widget__input"
                    type="text"
                    value={row.description}
                    placeholder="Descrição do item..."
                    onChange={(e) => { e.stopPropagation(); updateRow(row.id, 'description', e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {row.aiNote && (
                    <p className={`cost-ai-note ${row.aiStatus ? STATUS_CONFIG[row.aiStatus].cls : ''}`}>
                      {row.aiStatus && STATUS_CONFIG[row.aiStatus].icon}
                      {row.aiNote}
                    </p>
                  )}
                </td>
                {/* Valor */}
                <td className="cost-widget__td cost-widget__td--right">
                  <input
                    className="cost-widget__input cost-widget__input--value"
                    type="number"
                    min="0"
                    step="100"
                    value={row.value}
                    onChange={(e) => { e.stopPropagation(); updateRow(row.id, 'value', e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {/* Status IA */}
                <td className="cost-widget__td cost-widget__td--center">
                  {row.aiStatus && (
                    <span className={`cost-ai-badge ${STATUS_CONFIG[row.aiStatus].cls}`} title={STATUS_CONFIG[row.aiStatus].label}>
                      {STATUS_CONFIG[row.aiStatus].icon}
                    </span>
                  )}
                </td>
                {/* Remover */}
                <td className="cost-widget__td cost-widget__td--center">
                  <button
                    type="button"
                    className="cost-widget__del-btn"
                    onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                    aria-label="Remover linha"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé: total + alertas */}
      <div className="cost-widget__footer">
        <button
          type="button"
          className="cost-widget__add-btn"
          onClick={(e) => { e.stopPropagation(); addRow(); }}
        >
          <Plus size={12} /> Adicionar item
        </button>

        <div className="cost-widget__totals">
          {valorMax !== null && (
            <span className="cost-widget__budget-label">
              Limite do edital: <strong>{formatBRL(valorMax)}</strong>
            </span>
          )}
          <span className={`cost-widget__total${overBudget ? ' cost-widget__total--over' : ''}`}>
            Total: <strong>{formatBRL(total)}</strong>
          </span>
        </div>
      </div>

      {/* Alertas de orçamento */}
      {overBudget && (
        <div className="cost-widget__alert cost-widget__alert--over">
          <AlertTriangle size={13} />
          Orçamento excede o limite máximo do edital em {formatBRL(total - (valorMax ?? 0))}. Revise os itens.
        </div>
      )}
      {underBudget && !overBudget && (
        <div className="cost-widget__alert cost-widget__alert--under">
          <TrendingDown size={13} />
          Orçamento está {Math.round(((valorMax! - total) / valorMax!) * 100)}% abaixo do limite. Considere justificar o valor reduzido.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── CostTableNode — DecoratorNode ────────────────────────────
// ══════════════════════════════════════════════════════════════
export class CostTableNode extends DecoratorNode<JSX.Element> {
  __editalId:   string | null;
  __editalNome: string;
  __valorMax:   number | null;
  __rows:       CostRow[];

  static getType(): string { return 'cost-table'; }

  static clone(node: CostTableNode): CostTableNode {
    return new CostTableNode(
      node.__editalId, node.__editalNome, node.__valorMax, node.__rows, node.__key,
    );
  }

  static importJSON(serialized: SerializedCostTableNode): CostTableNode {
    return $createCostTableNode(
      serialized.editalId,
      serialized.editalNome,
      serialized.valorMax,
      serialized.rows,
    );
  }

  constructor(
    editalId:   string | null  = null,
    editalNome: string         = 'Edital',
    valorMax:   number | null  = null,
    rows:       CostRow[]      = DEFAULT_ROWS,
    key?:       NodeKey,
  ) {
    super(key);
    this.__editalId   = editalId;
    this.__editalNome = editalNome;
    this.__valorMax   = valorMax;
    this.__rows       = rows;
  }

  exportJSON(): SerializedCostTableNode {
    return {
      ...super.exportJSON(),
      type:       'cost-table',
      version:    1,
      editalId:   this.__editalId,
      editalNome: this.__editalNome,
      valorMax:   this.__valorMax,
      rows:       this.__rows,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'lexical-decorator-block';
    return div;
  }

  updateDOM(): false { return false; }

  isIsolated(): boolean { return true; }

  decorate(): JSX.Element {
    return (
      <CostTableWidget
        nodeKey={this.__key}
        editalId={this.__editalId}
        editalNome={this.__editalNome}
        valorMax={this.__valorMax}
        initialRows={this.__rows}
      />
    );
  }
}

// ── Factories ──────────────────────────────────────────────────
export function $createCostTableNode(
  editalId:   string | null = null,
  editalNome: string        = 'Edital',
  valorMax:   number | null = null,
  rows:       CostRow[]     = DEFAULT_ROWS,
): CostTableNode {
  return new CostTableNode(editalId, editalNome, valorMax, rows);
}

export function $isCostTableNode(
  node: LexicalNode | null | undefined,
): node is CostTableNode {
  return node instanceof CostTableNode;
}

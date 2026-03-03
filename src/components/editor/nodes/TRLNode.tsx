'use client';

/**
 * TRLNode — Decorator Node do Lexical para o Widget de Nível TRL.
 *
 * Renderiza um slider visual com 9 níveis (TRL 1–9) diretamente no corpo
 * do documento. O valor é persistido no JSON do estado do editor.
 *
 * Descrições baseadas no padrão NASA/ESA adaptado para editais FINEP/CNPq.
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
import { mergeRegister } from '@lexical/utils';
import { ChevronRight, Cpu } from 'lucide-react';

// ── Serialização ───────────────────────────────────────────────
export type SerializedTRLNode = Spread<
  { trl: number },
  SerializedLexicalNode
>;

// ── Descrições TRL ─────────────────────────────────────────────
export const TRL_DESCRIPTIONS: Record<number, { phase: string; title: string; desc: string }> = {
  1: { phase: 'Pesquisa Básica',     title: 'Princípios observados',         desc: 'Princípios científicos básicos identificados e documentados.' },
  2: { phase: 'Pesquisa Básica',     title: 'Conceito formulado',            desc: 'Aplicação tecnológica conceituada com base nos princípios.' },
  3: { phase: 'Pesquisa Aplicada',   title: 'Prova de conceito',             desc: 'Função crítica e/ou característica analítica/experimental validada.' },
  4: { phase: 'Desenvolvimento',     title: 'Protótipo em lab',              desc: 'Componente ou sistema básico validado em ambiente laboratorial.' },
  5: { phase: 'Desenvolvimento',     title: 'Validação em ambiente relevante', desc: 'Componente ou sistema básico validado em ambiente operacionalmente relevante.' },
  6: { phase: 'Demonstração',        title: 'Demo em ambiente relevante',    desc: 'Protótipo do sistema demonstrado em ambiente operacionalmente relevante.' },
  7: { phase: 'Demonstração',        title: 'Demo em ambiente operacional',  desc: 'Protótipo do sistema demonstrado em ambiente operacional real.' },
  8: { phase: 'Sistema completo',    title: 'Sistema qualificado',           desc: 'Sistema completo e qualificado; pronto para implantação.' },
  9: { phase: 'Produção',            title: 'Implantado com sucesso',        desc: 'Sistema em operação com pleno sucesso comprovado.' },
};

// ── Paleta de cores por fase ───────────────────────────────────
const PHASE_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Pesquisa Básica':    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.3)',  text: '#818cf8', dot: '#6366f1' },
  'Pesquisa Aplicada':  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa', dot: '#3b82f6' },
  'Desenvolvimento':    { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399', dot: '#10b981' },
  'Demonstração':       { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24', dot: '#f59e0b' },
  'Sistema completo':   { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.25)',  text: '#f87171', dot: '#ef4444' },
  'Produção':           { bg: 'rgba(124,58,237,0.1)',   border: 'rgba(124,58,237,0.4)',  text: '#c4b5fd', dot: '#7c3aed' },
};

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_TRL_WIDGET_COMMAND: LexicalCommand<{ trl?: number }> =
  createCommand('INSERT_TRL_WIDGET_COMMAND');

// ══════════════════════════════════════════════════════════════
// ── Componente React do Widget ────────────────────────────────
// ══════════════════════════════════════════════════════════════
interface TRLWidgetProps {
  nodeKey: NodeKey;
  initialTrl: number;
}

function TRLWidget({ nodeKey, initialTrl }: TRLWidgetProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [trl, setTrl] = useState(initialTrl);

  const info = TRL_DESCRIPTIONS[trl];
  const colors = PHASE_COLOR[info.phase];

  // Persistir mudança no node
  const handleChange = useCallback(
    (next: number) => {
      setTrl(next);
      editor.update(() => {
        const node = editor.getEditorState().read(() => {
          // Localiza o nó pelo key
          return null; // será atualizado via exportJSON
        });
        // Atualiza o estado interno do nó Lexical
        const trlNode = editor.getEditorState()._nodeMap.get(nodeKey);
        if (trlNode instanceof TRLNode) {
          const writableTRLNode = trlNode.getWritable() as TRLNode;
          writableTRLNode.__trl = next;
        }
      });
    },
    [editor, nodeKey],
  );

  return (
    <div
      className={`trl-widget${isSelected ? ' trl-widget--selected' : ''}`}
      onClick={() => setSelected(true)}
      contentEditable={false}
    >
      {/* Cabeçalho */}
      <div className="trl-widget__header">
        <span className="trl-widget__icon"><Cpu size={14} /></span>
        <span className="trl-widget__title">Nível TRL</span>
        <span className="trl-widget__badge" style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}>
          {info.phase}
        </span>
      </div>

      {/* Slider de bolhas */}
      <div className="trl-widget__track" role="group" aria-label="Selecione o nível TRL">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => {
          const isActive = level <= trl;
          const isCurrent = level === trl;
          const levelInfo = TRL_DESCRIPTIONS[level];
          const levelColors = PHASE_COLOR[levelInfo.phase];
          return (
            <button
              key={level}
              type="button"
              aria-label={`TRL ${level}: ${levelInfo.title}`}
              title={`TRL ${level} — ${levelInfo.title}`}
              className={`trl-widget__dot${isActive ? ' trl-widget__dot--active' : ''}${isCurrent ? ' trl-widget__dot--current' : ''}`}
              style={
                isActive
                  ? { background: levelColors.dot, boxShadow: isCurrent ? `0 0 0 3px ${levelColors.dot}33` : 'none' }
                  : {}
              }
              onClick={(e) => { e.stopPropagation(); handleChange(level); }}
            >
              <span className="trl-widget__dot-label">{level}</span>
            </button>
          );
        })}
      </div>

      {/* Linha de progresso */}
      <div className="trl-widget__progress-track">
        <div
          className="trl-widget__progress-fill"
          style={{
            width: `${((trl - 1) / 8) * 100}%`,
            background: colors.dot,
            boxShadow: `0 0 8px 0 ${colors.dot}55`,
          }}
        />
      </div>

      {/* Descrição do nível atual */}
      <div className="trl-widget__info">
        <div className="trl-widget__info-level">
          TRL {trl}
          <ChevronRight size={12} className="trl-widget__info-chevron" />
          <strong style={{ color: colors.text }}>{info.title}</strong>
        </div>
        <p className="trl-widget__info-desc">{info.desc}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── TRLNode — DecoratorNode ───────────────────────────────────
// ══════════════════════════════════════════════════════════════
export class TRLNode extends DecoratorNode<JSX.Element> {
  __trl: number;

  static getType(): string {
    return 'trl-widget';
  }

  static clone(node: TRLNode): TRLNode {
    return new TRLNode(node.__trl, node.__key);
  }

  static importJSON(serialized: SerializedTRLNode): TRLNode {
    return $createTRLNode(serialized.trl ?? 1);
  }

  constructor(trl: number = 1, key?: NodeKey) {
    super(key);
    this.__trl = trl;
  }

  exportJSON(): SerializedTRLNode {
    return {
      ...super.exportJSON(),
      type: 'trl-widget',
      trl: this.__trl,
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('div');
    span.className = 'lexical-decorator-block';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return <TRLWidget nodeKey={this.__key} initialTrl={this.__trl} />;
  }
}

// ── Factories ──────────────────────────────────────────────────
export function $createTRLNode(trl: number = 1): TRLNode {
  return new TRLNode(trl);
}

export function $isTRLNode(node: LexicalNode | null | undefined): node is TRLNode {
  return node instanceof TRLNode;
}

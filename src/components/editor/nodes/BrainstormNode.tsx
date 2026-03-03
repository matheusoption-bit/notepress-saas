'use client';

/**
 * BrainstormNode — Decorator Node do Lexical para o bloco de Brainstorm.
 *
 * Renderiza um card estruturado com:
 *   • Transcrição original do áudio
 *   • Resumo gerado por IA
 *   • Plano de Ação (lista acionável)
 *   • Sugestões de Pesquisa
 *
 * O card pode ser colapsado/expandido pelo usuário clicando no header.
 * O estado persiste no JSON do editor (Prisma Document.content).
 */

import { useState } from 'react';
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
import {
  Mic,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ListChecks,
  BookOpen,
  FileText,
  Loader2,
} from 'lucide-react';

// ── Tipos públicos ─────────────────────────────────────────────
export interface BrainstormPayload {
  transcricao?: string;
  resumo?: string;
  planoDeAcao?: string[];
  sugestoesDePesquisa?: string[];
  isLoading?: boolean;
}

export type SerializedBrainstormNode = Spread<
  {
    transcricao: string;
    resumo: string;
    planoDeAcao: string[];
    sugestoesDePesquisa: string[];
    isCollapsed: boolean;
    type: 'brainstorm';
    version: 1;
  },
  SerializedLexicalNode
>;

// ── Comando de inserção ────────────────────────────────────────
export const INSERT_BRAINSTORM_COMMAND: LexicalCommand<BrainstormPayload> =
  createCommand('INSERT_BRAINSTORM_COMMAND');

// ── Factory ────────────────────────────────────────────────────
export function $createBrainstormNode(payload: BrainstormPayload = {}): BrainstormNode {
  return new BrainstormNode(
    payload.transcricao ?? '',
    payload.resumo ?? '',
    payload.planoDeAcao ?? [],
    payload.sugestoesDePesquisa ?? [],
    payload.isLoading ?? false,
  );
}

export function $isBrainstormNode(node: LexicalNode | null | undefined): node is BrainstormNode {
  return node instanceof BrainstormNode;
}

// ── Widget React ───────────────────────────────────────────────
interface BrainstormWidgetProps {
  transcricao: string;
  resumo: string;
  planoDeAcao: string[];
  sugestoesDePesquisa: string[];
  isLoading: boolean;
  nodeKey: NodeKey;
}

function BrainstormWidget({
  transcricao,
  resumo,
  planoDeAcao,
  sugestoesDePesquisa,
  isLoading,
  nodeKey,
}: BrainstormWidgetProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  function toggleCheck(idx: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div
      className="brainstorm-node"
      data-lexical-decorator="true"
      data-key={nodeKey}
    >
      {/* ── Header ── */}
      <div
        className="brainstorm-node__header"
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="brainstorm-node__header-left">
          <span className="brainstorm-node__icon-wrap">
            <Mic size={14} />
          </span>
          <span className="brainstorm-node__title">Brainstorm</span>
          {isLoading && (
            <span className="brainstorm-node__loading-badge">
              <Loader2 size={11} className="brainstorm-node__spinner" />
              Processando…
            </span>
          )}
          {!isLoading && resumo && (
            <span className="brainstorm-node__ai-badge">
              <Sparkles size={10} />
              IA
            </span>
          )}
        </div>
        <span className="brainstorm-node__chevron">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* ── Corpo colapsável ── */}
      {!collapsed && (
        <div className="brainstorm-node__body">

          {isLoading ? (
            <div className="brainstorm-node__loading-body">
              <Loader2 size={20} className="brainstorm-node__spinner" />
              <p>Transcrevendo áudio e estruturando suas ideias…</p>
            </div>
          ) : (
            <>
              {/* Transcrição */}
              {transcricao && (
                <section className="brainstorm-node__section">
                  <h4 className="brainstorm-node__section-title">
                    <FileText size={13} />
                    Transcrição
                  </h4>
                  <p className="brainstorm-node__transcricao">{transcricao}</p>
                </section>
              )}

              {/* Resumo */}
              {resumo && (
                <section className="brainstorm-node__section">
                  <h4 className="brainstorm-node__section-title">
                    <Sparkles size={13} />
                    Resumo da Ideia
                  </h4>
                  <p className="brainstorm-node__resumo">{resumo}</p>
                </section>
              )}

              {/* Plano de Ação */}
              {planoDeAcao.length > 0 && (
                <section className="brainstorm-node__section">
                  <h4 className="brainstorm-node__section-title">
                    <ListChecks size={13} />
                    Plano de Ação
                  </h4>
                  <ol className="brainstorm-node__action-list">
                    {planoDeAcao.map((item, idx) => (
                      <li
                        key={idx}
                        className={`brainstorm-node__action-item${checkedItems.has(idx) ? ' brainstorm-node__action-item--done' : ''}`}
                      >
                        <button
                          className="brainstorm-node__check-btn"
                          onClick={(e) => { e.stopPropagation(); toggleCheck(idx); }}
                          aria-label={checkedItems.has(idx) ? 'Desmarcar' : 'Marcar como feito'}
                        >
                          <span className={`brainstorm-node__check-box${checkedItems.has(idx) ? ' brainstorm-node__check-box--done' : ''}`} />
                        </button>
                        <span className="brainstorm-node__action-text">{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Sugestões de Pesquisa */}
              {sugestoesDePesquisa.length > 0 && (
                <section className="brainstorm-node__section brainstorm-node__section--last">
                  <h4 className="brainstorm-node__section-title">
                    <BookOpen size={13} />
                    Sugestões de Pesquisa
                  </h4>
                  <ul className="brainstorm-node__research-list">
                    {sugestoesDePesquisa.map((item, idx) => (
                      <li key={idx} className="brainstorm-node__research-item">
                        <span className="brainstorm-node__research-dot" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── DecoratorNode ──────────────────────────────────────────────
export class BrainstormNode extends DecoratorNode<JSX.Element> {
  __transcricao: string;
  __resumo: string;
  __planoDeAcao: string[];
  __sugestoesDePesquisa: string[];
  __isLoading: boolean;

  static getType(): string {
    return 'brainstorm';
  }

  static clone(node: BrainstormNode): BrainstormNode {
    return new BrainstormNode(
      node.__transcricao,
      node.__resumo,
      node.__planoDeAcao,
      node.__sugestoesDePesquisa,
      node.__isLoading,
      node.__key,
    );
  }

  constructor(
    transcricao = '',
    resumo = '',
    planoDeAcao: string[] = [],
    sugestoesDePesquisa: string[] = [],
    isLoading = false,
    key?: NodeKey,
  ) {
    super(key);
    this.__transcricao = transcricao;
    this.__resumo = resumo;
    this.__planoDeAcao = planoDeAcao;
    this.__sugestoesDePesquisa = sugestoesDePesquisa;
    this.__isLoading = isLoading;
  }

  // ── Serialização ──────────────────────────────────────────
  static importJSON(serialized: SerializedBrainstormNode): BrainstormNode {
    return new BrainstormNode(
      serialized.transcricao,
      serialized.resumo,
      serialized.planoDeAcao,
      serialized.sugestoesDePesquisa,
      false, // nunca persiste isLoading
    );
  }

  exportJSON(): SerializedBrainstormNode {
    return {
      ...super.exportJSON(),
      type: 'brainstorm',
      version: 1,
      transcricao: this.__transcricao,
      resumo: this.__resumo,
      planoDeAcao: this.__planoDeAcao,
      sugestoesDePesquisa: this.__sugestoesDePesquisa,
      isCollapsed: false,
    };
  }

  // ── DOM ────────────────────────────────────────────────────
  createDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'lexical-decorator-block';
    return el;
  }

  updateDOM(): false {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return (
      <BrainstormWidget
        transcricao={this.__transcricao}
        resumo={this.__resumo}
        planoDeAcao={this.__planoDeAcao}
        sugestoesDePesquisa={this.__sugestoesDePesquisa}
        isLoading={this.__isLoading}
        nodeKey={this.__key}
      />
    );
  }
}

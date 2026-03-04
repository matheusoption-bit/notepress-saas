/**
 * export-pdf.ts — Converte um documento Lexical (JSON) em PDF via Puppeteer.
 *
 * Fluxo:
 *  1. lexicalJsonToHtml()  — percorre a árvore JSON do Lexical recursivamente
 *     e produz HTML semântico com CSS inline, sem nenhum browser API.
 *  2. exportLexicalToPdf() — abre uma página no Puppeteer (Chromium headless),
 *     aguarda o Mermaid.js renderizar diagramas em SVG, e captura o PDF.
 *
 * Nodes suportados (standard Lexical):
 *   paragraph, heading, text (bold/italic/underline/strike/code/sub/sup),
 *   link, list (bullet/number/check), listitem, quote, code, code-highlight,
 *   horizontalrule, linebreak, table, tablerow, tablecell.
 *
 * Decorator Nodes customizados:
 *   trl              → Indicador TRL (level + descrição)
 *   edital-checklist → Tabela de checklist (✓/✗)
 *   cost-table       → Tabela de custos com total
 *   brainstorm       → Seção multi-campo (transcrição, resumo, plano, pesquisa)
 *   mermaid-diagram  → Diagrama renderizado pelo mermaid.js CDN dentro do Puppeteer
 *   debate-consensus → Bloco de consenso quadripartite
 *   innovation-validator → Relatório de nível de inovação + patentes
 */

// ── Tipos internos ─────────────────────────────────────────────────────────────

interface LexicalTextNode {
  type: 'text';
  text: string;
  format?: number;
  style?: string;
  detail?: number;
  mode?: string;
  version?: number;
}

interface LexicalLineBreak { type: 'linebreak'; version?: number }

interface LexicalLinkNode {
  type: 'link';
  url: string;
  children: LexicalNode[];
  version?: number;
}

interface LexicalParagraphNode {
  type: 'paragraph';
  textFormat?: number;
  children: LexicalNode[];
  version?: number;
}

interface LexicalHeadingNode {
  type: 'heading';
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: LexicalNode[];
  version?: number;
}

interface LexicalQuoteNode {
  type: 'quote';
  children: LexicalNode[];
  version?: number;
}

interface LexicalHorizontalRuleNode { type: 'horizontalrule'; version?: number }

interface LexicalCodeNode {
  type: 'code';
  language?: string;
  children: LexicalNode[];
  version?: number;
}

interface LexicalCodeHighlightNode {
  type: 'code-highlight';
  text: string;
  highlightType?: string;
  version?: number;
}

interface LexicalListNode {
  type: 'list';
  listType: 'bullet' | 'number' | 'check';
  tag: 'ul' | 'ol';
  start?: number;
  children: LexicalNode[];
  version?: number;
}

interface LexicalListItemNode {
  type: 'listitem';
  checked?: boolean;
  children: LexicalNode[];
  version?: number;
}

interface LexicalTableNode {
  type: 'table';
  children: LexicalNode[];
  version?: number;
}

interface LexicalTableRowNode {
  type: 'tablerow';
  children: LexicalNode[];
  version?: number;
}

interface LexicalTableCellNode {
  type: 'tablecell';
  headerState?: number;
  colSpan?: number;
  rowSpan?: number;
  children: LexicalNode[];
  version?: number;
}

// ── Custom Decorator Nodes ──────────────────────────────────────────────────

interface TRLNode { type: 'trl'; trl: number }

interface ChecklistItem { id: string; label: string; required: boolean; done: boolean; tip?: string }
interface EditalChecklistNode {
  type: 'edital-checklist';
  editalId: string | null;
  editalNome: string;
  items: ChecklistItem[];
}

interface CostRow { id: string; category: string; description: string; value: number; aiNote?: string }
interface CostTableNode {
  type: 'cost-table';
  editalId: string | null;
  editalNome: string;
  valorMax: number | null;
  rows: CostRow[];
}

interface BrainstormNode {
  type: 'brainstorm';
  transcricao: string;
  resumo: string;
  planoDeAcao: string[];
  sugestoesDePesquisa: string[];
}

interface MermaidDiagramNode {
  type: 'mermaid-diagram';
  code: string;
}

interface DebateConsensusNode {
  type: 'debate-consensus';
  consensus: string;
  confidence: number;
  roundId: string;
}

interface PatentResult { title: string; id: string; url: string; similarity: number; abstract?: string }
interface InnovationValidatorNode {
  type: 'innovation-validator';
  level: string;
  score: number;
  explanation: string;
  recommendations: string;
  patentResults: PatentResult[];
}

type LexicalNode =
  | LexicalTextNode
  | LexicalLineBreak
  | LexicalLinkNode
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalQuoteNode
  | LexicalHorizontalRuleNode
  | LexicalCodeNode
  | LexicalCodeHighlightNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode
  | TRLNode
  | EditalChecklistNode
  | CostTableNode
  | BrainstormNode
  | MermaidDiagramNode
  | DebateConsensusNode
  | InnovationValidatorNode
  | { type: string; children?: LexicalNode[]; [key: string]: unknown };

// ── Bitmask de formatação de texto ─────────────────────────────────────────

const IS_BOLD        = 1;
const IS_ITALIC      = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE   = 8;
const IS_CODE        = 16;
const IS_SUBSCRIPT   = 32;
const IS_SUPERSCRIPT = 64;

// ── Descrições TRL ──────────────────────────────────────────────────────────

const TRL_DESCRIPTIONS: Record<number, { phase: string; title: string }> = {
  1: { phase: 'Pesquisa Básica',     title: 'Princípios observados' },
  2: { phase: 'Pesquisa Básica',     title: 'Conceito formulado' },
  3: { phase: 'Pesquisa Aplicada',   title: 'Prova de conceito' },
  4: { phase: 'Desenvolvimento',     title: 'Protótipo em lab' },
  5: { phase: 'Desenvolvimento',     title: 'Validação em ambiente relevante' },
  6: { phase: 'Demonstração',        title: 'Demo em ambiente relevante' },
  7: { phase: 'Demonstração',        title: 'Demo em ambiente operacional' },
  8: { phase: 'Sistema completo',    title: 'Sistema qualificado' },
  9: { phase: 'Produção',            title: 'Implantado com sucesso' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ── Conversores de nodes específicos ────────────────────────────────────────

function renderTRL(node: TRLNode): string {
  const info = TRL_DESCRIPTIONS[node.trl] ?? { phase: '—', title: '—' };
  return `
    <div style="border:2px solid #7c3aed;border-radius:8px;padding:16px 20px;margin:16px 0;
                background:#f5f0ff;page-break-inside:avoid;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7c3aed;
                  font-family:'Merriweather Sans',sans-serif;margin-bottom:4px;">
        Nível de Maturidade Tecnológica (TRL)
      </div>
      <div style="font-size:28px;font-weight:900;color:#7c3aed;line-height:1.1;">TRL ${node.trl}</div>
      <div style="font-weight:700;color:#1f1f1f;margin-top:4px;">${escapeHtml(info.title)}</div>
      <div style="font-size:12px;color:#5f6368;margin-top:2px;">${escapeHtml(info.phase)}</div>
    </div>`;
}

function renderEditalChecklist(node: EditalChecklistNode): string {
  const rows = node.items.map(item => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;width:28px;text-align:center;">
        ${item.done ? '✓' : '✗'}
      </td>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;">${escapeHtml(item.label)}</td>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;width:70px;text-align:center;font-size:11px;">
        ${item.required ? '<strong>Obrig.</strong>' : 'Opcional'}
      </td>
    </tr>`).join('');

  return `
    <div style="margin:16px 0;page-break-inside:avoid;">
      <div style="font-weight:700;font-size:13px;color:#1f1f1f;margin-bottom:6px;">
        Checklist — ${escapeHtml(node.editalNome || 'Edital')}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:center;">Status</th>
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:left;">Item</th>
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:center;">Tipo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderCostTable(node: CostTableNode): string {
  const total = node.rows.reduce((sum, r) => sum + r.value, 0);
  const overBudget = node.valorMax !== null && total > node.valorMax;

  const rows = node.rows.map(row => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;">${escapeHtml(row.category)}</td>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;">${escapeHtml(row.description)}</td>
      <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right;">${formatBRL(row.value)}</td>
    </tr>`).join('');

  return `
    <div style="margin:16px 0;page-break-inside:avoid;">
      <div style="font-weight:700;font-size:13px;color:#1f1f1f;margin-bottom:6px;">
        Tabela de Custos — ${escapeHtml(node.editalNome || 'Edital')}
        ${node.valorMax ? `<span style="font-weight:400;color:#5f6368;">(Limite: ${formatBRL(node.valorMax)})</span>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:left;">Categoria</th>
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:left;">Descrição</th>
            <th style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:${overBudget ? '#fce8e6' : '#e6f4ea'};">
            <td colspan="2" style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:700;">Total</td>
            <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right;font-weight:700;
                       color:${overBudget ? '#d93025' : '#1e8e3e'};">
              ${formatBRL(total)}
              ${overBudget ? ' ⚠ Acima do limite' : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function renderBrainstorm(node: BrainstormNode): string {
  const section = (title: string, content: string) => content
    ? `<div style="margin-bottom:10px;">
         <div style="font-weight:700;font-size:12px;color:#5f6368;text-transform:uppercase;
                     letter-spacing:.06em;margin-bottom:3px;">${title}</div>
         <div style="font-size:13px;color:#1f1f1f;">${content}</div>
       </div>`
    : '';

  const listSection = (title: string, items: string[]) => items.length
    ? `<div style="margin-bottom:10px;">
         <div style="font-weight:700;font-size:12px;color:#5f6368;text-transform:uppercase;
                     letter-spacing:.06em;margin-bottom:3px;">${title}</div>
         <ul style="margin:0;padding-left:18px;">
           ${items.map(i => `<li style="font-size:13px;color:#1f1f1f;">${escapeHtml(i)}</li>`).join('')}
         </ul>
       </div>`
    : '';

  return `
    <div style="border:1px solid #dadce0;border-left:4px solid #7c3aed;
                border-radius:8px;padding:16px 20px;margin:16px 0;background:#faf8ff;
                page-break-inside:avoid;">
      <div style="font-weight:700;color:#7c3aed;font-size:12px;text-transform:uppercase;
                  letter-spacing:.08em;margin-bottom:12px;">Brainstorm — Áudio IA</div>
      ${section('Transcrição', escapeHtml(node.transcricao))}
      ${section('Resumo', escapeHtml(node.resumo))}
      ${listSection('Plano de Ação', node.planoDeAcao)}
      ${listSection('Sugestões de Pesquisa', node.sugestoesDePesquisa)}
    </div>`;
}

function renderMermaid(node: MermaidDiagramNode): string {
  // Será renderizado pelo mermaid.js CDN dentro do Puppeteer.
  // A classe "mermaid" é suficiente para que mermaid.run() processe.
  return `
    <div style="margin:16px 0;page-break-inside:avoid;">
      <div class="mermaid" style="text-align:center;">${escapeHtml(node.code)}</div>
    </div>`;
}

function renderDebateConsensus(node: DebateConsensusNode): string {
  const color = node.confidence >= 85 ? '#7c3aed' : node.confidence >= 60 ? '#4f46e5' : '#d93025';
  const label = node.confidence >= 85 ? 'Alta confiança' : node.confidence >= 60 ? 'Moderada' : 'Baixa';

  return `
    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px 20px;margin:16px 0;
                background:#fafafa;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-weight:700;color:#1f1f1f;font-size:13px;">Consenso Quadripartite</span>
        <span style="font-size:11px;color:${color};font-weight:600;">
          ${node.confidence}% — ${escapeHtml(label)}
        </span>
      </div>
      <div style="font-size:13px;line-height:1.7;color:#1f1f1f;">${escapeHtml(node.consensus)}</div>
    </div>`;
}

function renderInnovationValidator(node: InnovationValidatorNode): string {
  const patentRows = node.patentResults.map(p => `
    <tr>
      <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;">${escapeHtml(p.title)}</td>
      <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;">${p.similarity}%</td>
      <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;">
        <a href="${escapeHtml(p.url)}" style="color:#1a73e8;">${escapeHtml(p.id)}</a>
      </td>
    </tr>`).join('');

  return `
    <div style="border:1px solid #dadce0;border-left:4px solid #059669;
                border-radius:8px;padding:16px 20px;margin:16px 0;background:#f0fdf4;
                page-break-inside:avoid;">
      <div style="font-weight:700;color:#059669;font-size:12px;text-transform:uppercase;
                  letter-spacing:.08em;margin-bottom:12px;">Validação de Inovação</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:white;border-radius:6px;padding:10px 14px;border:1px solid #e0e0e0;">
          <div style="font-size:10px;color:#5f6368;text-transform:uppercase;letter-spacing:.05em;">Nível</div>
          <div style="font-weight:700;font-size:16px;color:#1f1f1f;">${escapeHtml(node.level)}</div>
        </div>
        <div style="background:white;border-radius:6px;padding:10px 14px;border:1px solid #e0e0e0;">
          <div style="font-size:10px;color:#5f6368;text-transform:uppercase;letter-spacing:.05em;">Score</div>
          <div style="font-weight:700;font-size:16px;color:#1f1f1f;">${node.score}/100</div>
        </div>
      </div>

      ${node.explanation ? `
        <div style="font-size:12px;margin-bottom:10px;">
          <strong>Análise:</strong><br>${escapeHtml(node.explanation)}</div>` : ''}
      ${node.recommendations ? `
        <div style="font-size:12px;margin-bottom:10px;">
          <strong>Recomendações:</strong><br>${escapeHtml(node.recommendations)}</div>` : ''}

      ${patentRows ? `
        <div style="margin-top:12px;">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px;">Patentes Similares</div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:5px 8px;border:1px solid #e0e0e0;text-align:left;font-size:11px;">Título</th>
                <th style="padding:5px 8px;border:1px solid #e0e0e0;text-align:left;font-size:11px;">Sim.</th>
                <th style="padding:5px 8px;border:1px solid #e0e0e0;text-align:left;font-size:11px;">ID</th>
              </tr>
            </thead>
            <tbody>${patentRows}</tbody>
          </table>
        </div>` : ''}
    </div>`;
}

// ── Renderizador recursivo de nodes ─────────────────────────────────────────

function renderTextNode(node: LexicalTextNode): string {
  let html = escapeHtml(node.text);
  const fmt = node.format ?? 0;

  if (fmt & IS_CODE)          html = `<code style="background:#f1f3f4;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:.9em;">${html}</code>`;
  if (fmt & IS_SUBSCRIPT)     html = `<sub>${html}</sub>`;
  if (fmt & IS_SUPERSCRIPT)   html = `<sup>${html}</sup>`;
  if (fmt & IS_STRIKETHROUGH) html = `<s>${html}</s>`;
  if (fmt & IS_UNDERLINE)     html = `<u>${html}</u>`;
  if (fmt & IS_ITALIC)        html = `<em>${html}</em>`;
  if (fmt & IS_BOLD)          html = `<strong>${html}</strong>`;

  return html;
}

function renderChildren(children: LexicalNode[]): string {
  return children.map(renderNode).join('');
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    // ── Texto ──────────────────────────────────────────────────
    case 'text':
      return renderTextNode(node as LexicalTextNode);

    case 'linebreak':
      return '<br>';

    // ── Bloco de código ────────────────────────────────────────
    case 'code-highlight':
      return escapeHtml((node as LexicalCodeHighlightNode).text);

    // ── Link ───────────────────────────────────────────────────
    case 'link': {
      const lNode = node as LexicalLinkNode;
      return `<a href="${escapeHtml(lNode.url)}" style="color:#1a73e8;">${renderChildren(lNode.children)}</a>`;
    }

    // ── Parágrafo ──────────────────────────────────────────────
    case 'paragraph': {
      const children = renderChildren((node as LexicalParagraphNode).children);
      // Parágrafo vazio → break visual
      return children.trim()
        ? `<p style="margin:0 0 .8em 0;line-height:1.8;">${children}</p>`
        : '<p style="margin:0 0 .8em 0;">&nbsp;</p>';
    }

    // ── Headings ───────────────────────────────────────────────
    case 'heading': {
      const hNode = node as LexicalHeadingNode;
      const sizes: Record<string, string> = {
        h1: '2em', h2: '1.5em', h3: '1.25em', h4: '1.1em', h5: '1em', h6: '.9em',
      };
      const margins: Record<string, string> = {
        h1: '1.4em 0 .5em', h2: '1.2em 0 .4em', h3: '1em 0 .35em',
        h4: '.9em 0 .3em', h5: '.8em 0 .25em', h6: '.7em 0 .2em',
      };
      const tag = hNode.tag;
      return `<${tag} style="font-size:${sizes[tag]};margin:${margins[tag]};
                             font-family:'Merriweather',Georgia,serif;
                             color:#1f1f1f;page-break-after:avoid;">
                ${renderChildren(hNode.children)}
              </${tag}>`;
    }

    // ── Blockquote ─────────────────────────────────────────────
    case 'quote':
      return `<blockquote style="border-left:4px solid #7c3aed;margin:1em 0;padding:.5em 1em;
                                  background:#faf8ff;color:#5f6368;font-style:italic;">
                ${renderChildren((node as LexicalQuoteNode).children)}
              </blockquote>`;

    // ── Código ─────────────────────────────────────────────────
    case 'code': {
      const lang = (node as LexicalCodeNode).language ?? '';
      return `<pre style="background:#1e1e1e;color:#d4d4d4;border-radius:6px;
                          padding:14px 16px;overflow:auto;font-size:12px;
                          font-family:'Courier New',monospace;margin:1em 0;
                          page-break-inside:avoid;">${
                            lang ? `<div style="font-size:10px;color:#858585;margin-bottom:8px;">${escapeHtml(lang)}</div>` : ''
                          }${renderChildren((node as LexicalCodeNode).children)}</pre>`;
    }

    // ── HR ─────────────────────────────────────────────────────
    case 'horizontalrule':
      return '<hr style="border:none;border-top:1px solid #e0e0e0;margin:1.5em 0;">';

    // ── Listas ─────────────────────────────────────────────────
    case 'list': {
      const lNode = node as LexicalListNode;
      const tag = lNode.tag === 'ol' ? 'ol' : 'ul';
      const style = tag === 'ol'
        ? 'margin:.5em 0 .5em 1.5em;padding:0;list-style:decimal;'
        : 'margin:.5em 0 .5em 1.5em;padding:0;list-style:disc;';
      return `<${tag} style="${style}">${renderChildren(lNode.children)}</${tag}>`;
    }

    case 'listitem': {
      const liNode = node as LexicalListItemNode;
      const checkPrefix = liNode.checked !== undefined
        ? `<span style="margin-right:6px;">${liNode.checked ? '☑' : '☐'}</span>`
        : '';
      return `<li style="margin:.25em 0;line-height:1.7;">${checkPrefix}${renderChildren(liNode.children)}</li>`;
    }

    // ── Tabela ─────────────────────────────────────────────────
    case 'table':
      return `<table style="width:100%;border-collapse:collapse;margin:1em 0;font-size:13px;">
                ${renderChildren((node as LexicalTableNode).children)}
              </table>`;

    case 'tablerow':
      return `<tr>${renderChildren((node as LexicalTableRowNode).children)}</tr>`;

    case 'tablecell': {
      const tcNode = node as LexicalTableCellNode;
      const isHeader = (tcNode.headerState ?? 0) > 0;
      const tag = isHeader ? 'th' : 'td';
      const bgStyle = isHeader ? 'background:#f8f9fa;font-weight:700;' : '';
      const colSpan = tcNode.colSpan ? `colspan="${tcNode.colSpan}"` : '';
      const rowSpan = tcNode.rowSpan ? `rowspan="${tcNode.rowSpan}"` : '';
      return `<${tag} ${colSpan} ${rowSpan}
                style="padding:8px 10px;border:1px solid #e0e0e0;${bgStyle}">
                ${renderChildren(tcNode.children)}
              </${tag}>`;
    }

    // ── Decorator Nodes customizados ───────────────────────────
    case 'trl':
      return renderTRL(node as TRLNode);

    case 'edital-checklist':
      return renderEditalChecklist(node as EditalChecklistNode);

    case 'cost-table':
      return renderCostTable(node as CostTableNode);

    case 'brainstorm':
      return renderBrainstorm(node as BrainstormNode);

    case 'mermaid-diagram':
      return renderMermaid(node as MermaidDiagramNode);

    case 'debate-consensus':
      return renderDebateConsensus(node as DebateConsensusNode);

    case 'innovation-validator':
      return renderInnovationValidator(node as InnovationValidatorNode);

    // ── Fallback: container genérico ───────────────────────────
    default: {
      const children = (node as { children?: LexicalNode[] }).children;
      return children ? renderChildren(children) : '';
    }
  }
}

// ── CSS do documento ─────────────────────────────────────────────────────────

const DOC_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Merriweather+Sans:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  body {
    font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.8;
    color: #1f1f1f;
  }

  .page {
    max-width: 210mm;
    margin: 0 auto;
    padding: 2.5cm 2.5cm 3cm;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Merriweather', Georgia, serif;
    color: #1f1f1f;
    page-break-after: avoid;
  }

  p { margin: 0 0 .8em 0; }

  a { color: #1a73e8; text-decoration: underline; }

  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 8px 10px; border: 1px solid #e0e0e0; }
  th { background: #f8f9fa; font-weight: 700; }

  pre { page-break-inside: avoid; }

  @media print {
    body { font-size: 12.5px; }
    .page { padding: 0; }
  }
`;

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Converte o JSON do estado do editor Lexical em um documento HTML completo,
 * pronto para ser renderizado pelo Puppeteer.
 *
 * Pode ser chamado em qualquer contexto Node.js — não usa browser APIs.
 */
export function lexicalJsonToHtml(lexicalJson: string, title = 'Documento'): string {
  interface EditorState { root: { children: LexicalNode[] } }
  const state: EditorState = JSON.parse(lexicalJson);
  const body = renderChildren(state.root.children);

  const hasMermaid = lexicalJson.includes('"mermaid-diagram"');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${DOC_CSS}</style>
  ${hasMermaid ? `<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>` : ''}
</head>
<body>
  <div class="page">
    ${body}
  </div>
  ${hasMermaid ? `
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default', fontFamily: 'Merriweather' });
  </script>` : ''}
</body>
</html>`;
}

/**
 * Gera um PDF (Buffer) a partir do JSON do estado do editor Lexical.
 *
 * Usa o Puppeteer (Chromium headless) para renderizar o HTML — incluindo
 * diagramas Mermaid via CDN — e capturar o PDF final.
 *
 * Suporta dois modos de deploy:
 *   1. Serverless (Vercel): usa @sparticuz/chromium + puppeteer-core (se disponível)
 *   2. Local/Docker: usa puppeteer com Chromium bundled
 *
 * O modo é detectado automaticamente via disponibilidade do @sparticuz/chromium.
 */
export async function exportLexicalToPdf(
  lexicalJson: string,
  title = 'Documento',
): Promise<Buffer> {
  const html = lexicalJsonToHtml(lexicalJson, title);
  const hasMermaid = lexicalJson.includes('"mermaid-diagram"');

  // Detecta ambiente serverless e carrega Chromium otimizado se disponível
  let browser;
  try {
    // Tenta @sparticuz/chromium (serverless — bundle <50MB)
    // @ts-expect-error — pacote opcional, instalado apenas em deploy serverless
    const chromium = await import('@sparticuz/chromium').then(m => m.default).catch(() => null);
    if (chromium) {
      const puppeteerCore = await import('puppeteer-core');
      browser = await puppeteerCore.default.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Fallback: puppeteer com Chromium local (dev / Docker)
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  } catch {
    // Último recurso: puppeteer completo
    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  try {
    const page = await browser.newPage();

    // Carrega o HTML; se houver Mermaid, aguarda rede para o CDN
    await page.setContent(html, {
      waitUntil: hasMermaid ? 'networkidle0' : 'domcontentloaded',
      timeout: 30_000,
    });

    // Se houver diagramas Mermaid, aguarda renderização do SVG
    if (hasMermaid) {
      await page.waitForFunction(
        () => document.querySelectorAll('.mermaid svg').length ===
              document.querySelectorAll('.mermaid').length,
        { timeout: 15_000 },
      ).catch(() => {
        // Continua mesmo que algum diagrama falhe a renderização
      });
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '2.5cm', bottom: '3cm', left: '2.5cm', right: '2.5cm' },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-family:'Merriweather Sans',sans-serif;font-size:9px;
                    color:#9aa0a6;width:100%;text-align:center;padding:0 2.5cm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
      headerTemplate: `
        <div style="font-family:'Merriweather Sans',sans-serif;font-size:9px;
                    color:#9aa0a6;width:100%;text-align:right;padding:0 2.5cm;">
          ${escapeHtml(title)}
        </div>`,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

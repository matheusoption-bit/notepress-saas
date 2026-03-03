import type { EditorThemeClasses } from 'lexical';

/**
 * LexicalTheme — Tema "Floating Paper" do Notepress
 * Tipografia acadêmica: Merriweather, 18px, line-height 1.8
 */
const LexicalTheme: EditorThemeClasses = {
  // ── Root ──────────────────────────────────────────────────
  root: 'lexical-root',

  // ── Parágrafos ────────────────────────────────────────────
  paragraph: 'lexical-paragraph',

  // ── Cabeçalhos ────────────────────────────────────────────
  heading: {
    h1: 'lexical-h1',
    h2: 'lexical-h2',
    h3: 'lexical-h3',
    h4: 'lexical-h4',
    h5: 'lexical-h5',
    h6: 'lexical-h6',
  },

  // ── Listas ────────────────────────────────────────────────
  list: {
    nested: {
      listitem: 'lexical-nested-listitem',
    },
    ol: 'lexical-list-ol',
    ul: 'lexical-list-ul',
    listitem: 'lexical-listitem',
    listitemChecked: 'lexical-listitem-checked',
    listitemUnchecked: 'lexical-listitem-unchecked',
  },

  // ── Marcação de Texto ─────────────────────────────────────
  text: {
    bold: 'lexical-text-bold',
    italic: 'lexical-text-italic',
    underline: 'lexical-text-underline',
    strikethrough: 'lexical-text-strikethrough',
    underlineStrikethrough: 'lexical-text-underline-strikethrough',
    code: 'lexical-text-code',
    highlight: 'lexical-text-highlight',
    subscript: 'lexical-text-subscript',
    superscript: 'lexical-text-superscript',
  },

  // ── Citações ──────────────────────────────────────────────
  quote: 'lexical-quote',

  // ── Código ────────────────────────────────────────────────
  code: 'lexical-code',
  codeHighlight: {
    atrule: 'lexical-tokenAttr',
    attr: 'lexical-tokenAttr',
    boolean: 'lexical-tokenProperty',
    builtin: 'lexical-tokenSelector',
    cdata: 'lexical-tokenComment',
    char: 'lexical-tokenSelector',
    class: 'lexical-tokenFunction',
    'class-name': 'lexical-tokenFunction',
    comment: 'lexical-tokenComment',
    constant: 'lexical-tokenProperty',
    deleted: 'lexical-tokenProperty',
    doctype: 'lexical-tokenComment',
    entity: 'lexical-tokenOperator',
    function: 'lexical-tokenFunction',
    important: 'lexical-tokenVariable',
    inserted: 'lexical-tokenSelector',
    keyword: 'lexical-tokenAttr',
    namespace: 'lexical-tokenVariable',
    number: 'lexical-tokenProperty',
    operator: 'lexical-tokenOperator',
    prolog: 'lexical-tokenComment',
    property: 'lexical-tokenProperty',
    punctuation: 'lexical-tokenPunctuation',
    regex: 'lexical-tokenVariable',
    selector: 'lexical-tokenSelector',
    string: 'lexical-tokenSelector',
    symbol: 'lexical-tokenProperty',
    tag: 'lexical-tokenProperty',
    url: 'lexical-tokenOperator',
    variable: 'lexical-tokenVariable',
  },

  // ── Links ─────────────────────────────────────────────────
  link: 'lexical-link',

  // ── Tabelas ───────────────────────────────────────────────
  table: 'lexical-table',
  tableRow: 'lexical-table-row',
  tableCell: 'lexical-table-cell',
  tableCellHeader: 'lexical-table-cell-header',  tableCellSelected: 'lexical-table-cell--selected',
  tableCellPrimarySelected: 'lexical-table-cell--primary-selected',
  tableCellSortedIndicator: 'lexical-table-cell-sorted-indicator',
  tableResizer: 'lexical-table-resizer',
  tableSelected: 'lexical-table--selected',
  tableScrollableWrapper: 'lexical-table-scrollable-wrapper',

  // ── Divisor horizontal ────────────────────────────────────────
  hr: 'lexical-hr',} as const;

export default LexicalTheme;

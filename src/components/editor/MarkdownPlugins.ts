/**
 * MarkdownPlugins.ts
 * Configuração central dos transformadores Markdown para o Lexical Editor.
 *
 * Re-exporta o plugin e os transformadores configurados para uso no LexicalEditor.
 * O plugin em si é montado diretamente no JSX do editor — este módulo centraliza
 * a configuração para que possa ser customizada por namespace (ex.: editor leve
 * versus editor completo de tese).
 */

import {
  HEADING,
  QUOTE,
  CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  LINK,
  type Transformer,
} from '@lexical/markdown';

// ── Conjunto completo de transformadores ───────────────────────
/**
 * NOTEPRESS_TRANSFORMERS: todos os atalhos Markdown ativos no editor.
 *
 * Suporte a:
 *   #      → Heading H1
 *   ##     → Heading H2
 *   ###    → Heading H3
 *   >      → Blockquote
 *   ```    → Code block
 *   **     → Bold
 *   *      → Italic
 *   _      → Italic
 *   ~~     → Strikethrough
 *   `      → Inline code
 *   -      → Bullet list
 *   1.     → Ordered list
 *   [t](u) → Link
 */
export const NOTEPRESS_TRANSFORMERS: Transformer[] = [
  HEADING,
  QUOTE,
  CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  LINK,
];

// ── Subconjunto leve para views de preview ─────────────────────
/**
 * NOTEPRESS_TRANSFORMERS_INLINE: apenas transformações de texto inline.
 * Útil em campos de texto curtos (ex.: descrição, título de edital).
 */
export const NOTEPRESS_TRANSFORMERS_INLINE: Transformer[] = [
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
];

// ── Re-exporta o plugin para conveniência ──────────────────────
export { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

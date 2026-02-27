/**
 * Notepress Design System Tokens
 * --------------------------------
 * Tema: Dark profundo e elegante
 * Público: Pesquisadores, fundadores de startup, diretores de ICT
 *
 * Use estes tokens como referência canônica. As variáveis CSS correspondentes
 * ficam em globals.css e são consumidas pelos componentes via classes Tailwind.
 */

export const colors = {
  // ── Fundos ──────────────────────────────────────────
  background: {
    base: "#0a0a0a",      // fundo raiz da aplicação
    surface: "#111111",   // cards, painéis, modais
    elevated: "#1a1a1a",  // hover de cards, dropdowns, tooltips
    overlay: "#0d0d0d",   // overlay de modais
  },

  // ── Bordas ──────────────────────────────────────────
  border: {
    default: "#1f1f1f",   // borda padrão sutil
    muted: "#2a2a2a",     // borda levemente mais visível
    focus: "#6366f1",     // foco de inputs/botões
  },

  // ── Primária – Indigo ────────────────────────────────
  primary: {
    DEFAULT: "#6366f1",   // indigo-500
    hover: "#818cf8",     // indigo-400 (hover)
    active: "#4f46e5",    // indigo-600 (pressed)
    subtle: "#1e1b4b",    // indigo-950 (background tonal)
    foreground: "#ffffff",
  },

  // ── Sucesso – Emerald ────────────────────────────────
  success: {
    DEFAULT: "#10b981",   // emerald-500
    hover: "#34d399",     // emerald-400
    subtle: "#064e3b",    // emerald-950
    foreground: "#ffffff",
  },

  // ── Acento – Violet (usar só como acento pontual) ───
  accent: {
    DEFAULT: "#7c3aed",   // violet-600
    hover: "#8b5cf6",     // violet-500
    subtle: "#1d0d3b",    // violet-950
    foreground: "#ffffff",
  },

  // ── Texto ────────────────────────────────────────────
  text: {
    primary: "#f4f4f5",   // quase branco
    secondary: "#a1a1aa", // cinza-400 (subtítulos, metadados)
    muted: "#52525b",     // cinza-600 (placeholders, disabled)
    inverse: "#09090b",   // texto sobre fundo claro
  },

  // ── Destrutivo ───────────────────────────────────────
  destructive: {
    DEFAULT: "#ef4444",   // red-500
    hover: "#f87171",     // red-400
    subtle: "#450a0a",    // red-950
    foreground: "#ffffff",
  },

  // ── Warning ──────────────────────────────────────────
  warning: {
    DEFAULT: "#f59e0b",   // amber-500
    subtle: "#451a03",    // amber-950
    foreground: "#ffffff",
  },
} as const;

export const spacing = {
  px: "1px",
  0: "0",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const borderRadius = {
  none: "0px",
  sm: "4px",
  DEFAULT: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  full: "9999px",
} as const;

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.5)",
  DEFAULT: "0 2px 8px 0 rgb(0 0 0 / 0.4)",
  md: "0 4px 12px 0 rgb(0 0 0 / 0.5)",
  lg: "0 8px 24px 0 rgb(0 0 0 / 0.6)",
  xl: "0 16px 40px 0 rgb(0 0 0 / 0.7)",
  // Glow effects sutis
  "glow-primary": "0 0 20px 0 rgb(99 102 241 / 0.25)",
  "glow-success": "0 0 20px 0 rgb(16 185 129 / 0.25)",
  // Inner
  inner: "inset 0 1px 4px 0 rgb(0 0 0 / 0.6)",
} as const;

export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
  },
  fontSize: {
    xs: ["11px", { lineHeight: "16px" }],
    sm: ["13px", { lineHeight: "20px" }],
    base: ["14px", { lineHeight: "22px" }],
    md: ["15px", { lineHeight: "24px" }],
    lg: ["16px", { lineHeight: "26px" }],
    xl: ["18px", { lineHeight: "28px" }],
    "2xl": ["22px", { lineHeight: "32px" }],
    "3xl": ["28px", { lineHeight: "36px" }],
    "4xl": ["36px", { lineHeight: "44px" }],
    "5xl": ["48px", { lineHeight: "56px" }],
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

/** Token completo exportado como objeto unificado */
export const ds = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} as const;

export default ds;

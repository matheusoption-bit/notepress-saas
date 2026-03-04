/**
 * Notepress Design System Tokens
 * ──────────────────────────────
 * Dual-theme: Light (NotebookLM) + Dark (Firebase Studio)
 *
 * Os valores efetivos vêm das CSS custom properties em globals.css.
 * Estes tokens servem como referência canônica para documentação,
 * tipagem e uso programático.
 *
 * ADR-0002:
 * Mantido no repositório como fonte de referência tipada.
 * A integração será incremental nas próximas sprints (não remover).
 */

/* ────────────────────────────────────────────────────────────── */
/*  Light palette                                                 */
/* ────────────────────────────────────────────────────────────── */

export const lightColors = {
  background: {
    base: "#ffffff",
    surface: "#f8f9fa",
    elevated: "#ffffff",
    overlay: "rgba(0,0,0,0.35)",
    hover: "#f1f3f4",
  },
  border: {
    default: "#e0e0e0",
    muted: "#dadce0",
    focus: "#1a73e8",
  },
  primary: {
    DEFAULT: "#1a73e8",
    hover: "#1765cc",
    active: "#1558b0",
    subtle: "#e8f0fe",
    foreground: "#ffffff",
  },
  success: {
    DEFAULT: "#1e8e3e",
    hover: "#188038",
    subtle: "#e6f4ea",
    foreground: "#ffffff",
  },
  accent: {
    DEFAULT: "#7c3aed",
    hover: "#6d28d9",
    subtle: "#f3e8ff",
    foreground: "#ffffff",
  },
  text: {
    primary: "#1f1f1f",
    secondary: "#5f6368",
    muted: "#9aa0a6",
    inverse: "#ffffff",
  },
  destructive: {
    DEFAULT: "#d93025",
    hover: "#c5221f",
    subtle: "#fce8e6",
    foreground: "#ffffff",
  },
  warning: {
    DEFAULT: "#e37400",
    subtle: "#fef7e0",
  },
  functional: {
    indigo: "#4f46e5",
    violet: "#7c3aed",
    emerald: "#059669",
    amber: "#d97706",
  },
} as const;

/* ────────────────────────────────────────────────────────────── */
/*  Dark palette                                                  */
/* ────────────────────────────────────────────────────────────── */

export const darkColors = {
  background: {
    base: "#0a0a0a",
    surface: "#121212",
    elevated: "#1a1a1a",
    overlay: "rgba(0,0,0,0.7)",
    hover: "#242424",
  },
  border: {
    default: "#2d2d2d",
    muted: "#3c3c3c",
    focus: "#4d90fe",
  },
  primary: {
    DEFAULT: "#4d90fe",
    hover: "#6ea8fe",
    active: "#3b7ddb",
    subtle: "#152238",
    foreground: "#ffffff",
  },
  success: {
    DEFAULT: "#34a853",
    hover: "#5bb974",
    subtle: "#0d2818",
    foreground: "#ffffff",
  },
  accent: {
    DEFAULT: "#a78bfa",
    hover: "#c4b5fd",
    subtle: "#1e1033",
    foreground: "#ffffff",
  },
  text: {
    primary: "#e8eaed",
    secondary: "#9aa0a6",
    muted: "#5f6368",
    inverse: "#1f1f1f",
  },
  destructive: {
    DEFAULT: "#f28b82",
    hover: "#ee675c",
    subtle: "#3c1414",
    foreground: "#ffffff",
  },
  warning: {
    DEFAULT: "#fdd663",
    subtle: "#3c2e00",
  },
  functional: {
    indigo: "#818cf8",
    violet: "#a78bfa",
    emerald: "#34d399",
    amber: "#fbbf24",
  },
} as const;

/* ────────────────────────────────────────────────────────────── */
/*  Shared tokens                                                 */
/* ────────────────────────────────────────────────────────────── */

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
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  "3xl": "24px",
  full: "9999px",
} as const;

export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
  },
  fontSize: {
    xs:   ["11px", { lineHeight: "16px" }],
    sm:   ["13px", { lineHeight: "20px" }],
    base: ["14px", { lineHeight: "22px" }],
    md:   ["15px", { lineHeight: "24px" }],
    lg:   ["16px", { lineHeight: "26px" }],
    xl:   ["18px", { lineHeight: "28px" }],
    "2xl": ["22px", { lineHeight: "32px" }],
    "3xl": ["28px", { lineHeight: "36px" }],
    "4xl": ["36px", { lineHeight: "44px" }],
    "5xl": ["48px", { lineHeight: "56px" }],
  },
  fontWeight: {
    regular:  "400",
    medium:   "500",
    semibold: "600",
    bold:     "700",
  },
  letterSpacing: {
    tight:  "-0.025em",
    normal: "0em",
    wide:   "0.025em",
    wider:  "0.05em",
    widest: "0.1em",
  },
} as const;

/** Objecto unificado */
export const ds = {
  light: lightColors,
  dark: darkColors,
  spacing,
  borderRadius,
  typography,
} as const;

export default ds;

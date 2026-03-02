"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface Props {
  children: React.ReactNode;
}

/**
 * Wrapper sobre next-themes.
 * - attribute="class"  → aplica `.dark` no <html>
 * - defaultTheme="dark" → começa em dark (Firebase Studio)
 * - enableSystem → respeita preferência do SO
 * - disableTransitionOnChange → evita flash durante troca
 */
export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

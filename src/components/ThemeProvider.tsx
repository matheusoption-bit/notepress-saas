"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WeatherProvider } from "@/components/atmosphere/WeatherProvider";
import { FocusModeProvider } from "@/components/focus/FocusModeProvider";

interface Props {
  children: React.ReactNode;
}

/**
 * Unified provider stack for Notepress.
 * Wraps: next-themes → WeatherProvider → FocusModeProvider
 */
export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <WeatherProvider>
        <FocusModeProvider>{children}</FocusModeProvider>
      </WeatherProvider>
    </NextThemesProvider>
  );
}

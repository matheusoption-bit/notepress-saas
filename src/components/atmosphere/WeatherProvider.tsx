"use client";

import React, { createContext, useContext } from "react";
import {
  useWeatherAtmosphere,
  type WeatherData,
  type AtmosphereTheme,
} from "@/hooks/useWeatherAtmosphere";

interface WeatherContextValue {
  weather: WeatherData | null;
  atmosphere: AtmosphereTheme;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const value = useWeatherAtmosphere();

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return ctx;
}

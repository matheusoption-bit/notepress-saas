"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Weather condition types ─────────────────────────── */
export type WeatherCondition =
  | "clear_day"
  | "clear_night"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "default";

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  city: string;
  description: string;
  isDay: boolean;
}

export interface AtmosphereTheme {
  /** CSS gradient for the background */
  gradient: string;
  /** Accent color for UI elements */
  accentColor: string;
  /** Particle effect type */
  particles: "none" | "rain" | "snow" | "stars" | "fog" | "lightning";
  /** Opacity of the overlay */
  overlayOpacity: number;
  /** Ambient description for accessibility */
  label: string;
}

/* ── Atmosphere mapping ──────────────────────────────── */
const ATMOSPHERE_MAP: Record<WeatherCondition, AtmosphereTheme> = {
  clear_day: {
    gradient:
      "radial-gradient(ellipse at 20% 20%, rgba(251,191,36,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)",
    accentColor: "#fbbf24",
    particles: "none",
    overlayOpacity: 0.02,
    label: "Céu limpo durante o dia",
  },
  clear_night: {
    gradient:
      "radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.2) 0%, rgba(17,24,39,0.4) 50%, transparent 80%)",
    accentColor: "#818cf8",
    particles: "stars",
    overlayOpacity: 0.05,
    label: "Céu limpo à noite",
  },
  cloudy: {
    gradient:
      "radial-gradient(ellipse at 50% 30%, rgba(148,163,184,0.15) 0%, rgba(71,85,105,0.1) 50%, transparent 80%)",
    accentColor: "#94a3b8",
    particles: "fog",
    overlayOpacity: 0.04,
    label: "Nublado",
  },
  rain: {
    gradient:
      "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.2) 0%, rgba(30,58,138,0.15) 50%, transparent 80%)",
    accentColor: "#3b82f6",
    particles: "rain",
    overlayOpacity: 0.06,
    label: "Chovendo",
  },
  storm: {
    gradient:
      "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, rgba(30,27,75,0.2) 50%, transparent 80%)",
    accentColor: "#7c3aed",
    particles: "lightning",
    overlayOpacity: 0.08,
    label: "Tempestade",
  },
  snow: {
    gradient:
      "radial-gradient(ellipse at 40% 30%, rgba(226,232,240,0.2) 0%, rgba(148,163,184,0.1) 50%, transparent 80%)",
    accentColor: "#e2e8f0",
    particles: "snow",
    overlayOpacity: 0.03,
    label: "Nevando",
  },
  fog: {
    gradient:
      "radial-gradient(ellipse at 50% 50%, rgba(148,163,184,0.2) 0%, rgba(100,116,139,0.15) 50%, transparent 80%)",
    accentColor: "#64748b",
    particles: "fog",
    overlayOpacity: 0.05,
    label: "Neblina",
  },
  default: {
    gradient:
      "radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)",
    accentColor: "#a78bfa",
    particles: "none",
    overlayOpacity: 0.03,
    label: "Padrão",
  },
};

/* ── WMO weather code → condition mapping ────────────── */
function wmoToCondition(code: number, isDay: boolean): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0 || code === 1) return isDay ? "clear_day" : "clear_night";
  if (code === 2 || code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "fog";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95 && code <= 99) return "storm";
  return "default";
}

/* ── Cache helpers ───────────────────────────────────── */
const CACHE_KEY = "notepress_weather_cache";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

function getCached(): WeatherData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCache(data: WeatherData) {
  if (typeof window === "undefined") return;
  try {
    const cached: CachedWeather = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // silently fail
  }
}

/* ── Hook ────────────────────────────────────────────── */
export function useWeatherAtmosphere() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    // Check cache first
    const cached = getCached();
    if (cached) {
      setWeather(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get location via IP
      let lat = -23.55; // São Paulo fallback
      let lon = -46.63;
      let city = "São Paulo";

      try {
        const geoRes = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(5000),
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          lat = geo.latitude ?? lat;
          lon = geo.longitude ?? lon;
          city = geo.city ?? city;
        }
      } catch {
        // Use fallback coordinates
      }

      // Step 2: Get weather from Open-Meteo (free, no API key)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!weatherRes.ok) throw new Error("Weather API failed");

      const weatherJson = await weatherRes.json();
      const current = weatherJson.current_weather;
      const isDay = current.is_day === 1;
      const condition = wmoToCondition(current.weathercode, isDay);

      const data: WeatherData = {
        condition,
        temperature: Math.round(current.temperature),
        city,
        description: ATMOSPHERE_MAP[condition].label,
        isDay,
      };

      setWeather(data);
      setCache(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
      // Set default atmosphere
      const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
      setWeather({
        condition: isDay ? "clear_day" : "clear_night",
        temperature: 22,
        city: "Local",
        description: "Dados indisponíveis",
        isDay,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const atmosphere: AtmosphereTheme = weather
    ? ATMOSPHERE_MAP[weather.condition]
    : ATMOSPHERE_MAP.default;

  return {
    weather,
    atmosphere,
    loading,
    error,
    refresh: fetchWeather,
  };
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Thermometer,
} from "lucide-react";
import { useWeather } from "./WeatherProvider";
import type { WeatherCondition } from "@/hooks/useWeatherAtmosphere";

const CONDITION_ICONS: Record<WeatherCondition, React.ElementType> = {
  clear_day: Sun,
  clear_night: Moon,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
  default: Thermometer,
};

export function WeatherIndicator() {
  const { weather, loading } = useWeather();

  if (loading || !weather) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
        <div className="w-12 h-3 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  const Icon = CONDITION_ICONS[weather.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm cursor-default select-none"
      title={`${weather.city} — ${weather.description}`}
    >
      <Icon size={14} className="text-white/60" />
      <span className="text-xs font-medium text-white/50">
        {weather.temperature}°C
      </span>
      <span className="text-xs text-white/30 hidden sm:inline">
        {weather.city}
      </span>
    </motion.div>
  );
}

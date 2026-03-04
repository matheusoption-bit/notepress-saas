"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeather } from "./WeatherProvider";

/* ── Rain drops ──────────────────────────────────────── */
function RainParticles() {
  const drops = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: 0.6 + Math.random() * 0.4,
        opacity: 0.15 + Math.random() * 0.2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute w-px bg-blue-400/30"
          style={{ left: drop.left, height: "20px" }}
          initial={{ top: "-20px", opacity: 0 }}
          animate={{
            top: "100%",
            opacity: [0, drop.opacity, 0],
          }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ── Snow flakes ─────────────────────────────────────── */
function SnowParticles() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        size: 2 + Math.random() * 3,
        opacity: 0.2 + Math.random() * 0.3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
          }}
          initial={{ top: "-10px", opacity: 0 }}
          animate={{
            top: "100%",
            opacity: [0, flake.opacity, 0],
            x: [0, 20, -10, 15, 0],
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ── Stars ───────────────────────────────────────────── */
function StarParticles() {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Fog ─────────────────────────────────────────────── */
function FogParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-slate-400/5 via-slate-300/10 to-transparent"
        animate={{ x: ["-10%", "10%", "-10%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-l from-slate-400/5 via-slate-300/8 to-transparent"
        animate={{ x: ["10%", "-10%", "10%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Lightning ───────────────────────────────────────── */
function LightningParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <RainParticles />
      <motion.div
        className="absolute inset-0 bg-violet-400/5"
        animate={{ opacity: [0, 0, 0.15, 0, 0, 0, 0.1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ── Particle selector ───────────────────────────────── */
const PARTICLE_MAP: Record<string, React.FC> = {
  rain: RainParticles,
  snow: SnowParticles,
  stars: StarParticles,
  fog: FogParticles,
  lightning: LightningParticles,
};

/* ── Main component ──────────────────────────────────── */
export function WeatherBackground() {
  const { atmosphere, loading } = useWeather();

  const ParticleComponent = PARTICLE_MAP[atmosphere.particles];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={atmosphere.label}
        className="fixed inset-0 pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-all duration-[3000ms]"
          style={{ background: atmosphere.gradient }}
        />

        {/* Particles */}
        {ParticleComponent && !loading && <ParticleComponent />}

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

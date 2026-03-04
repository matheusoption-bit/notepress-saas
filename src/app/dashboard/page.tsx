"use client";

import { useUser } from "@clerk/nextjs";
import { motion, type Variants } from "framer-motion";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { HotEditais } from "@/components/dashboard/HotEditais";
import { RecentNotebooks } from "@/components/dashboard/RecentNotebooks";
import { SpotifyWidget } from "@/components/spotify/SpotifyWidget";
import { useWeather } from "@/components/atmosphere/WeatherProvider";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function DashboardPage() {
  const { user } = useUser();
  const { weather } = useWeather();
  const firstName = user?.firstName ?? user?.username ?? "usuário";

  return (
    <motion.div
      className="pb-12 pt-4 max-w-[1400px] mx-auto space-y-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.section variants={fadeUp} className="relative">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 -top-10 h-48 w-48 rounded-full bg-violet-500/8 blur-[80px] pointer-events-none" />

        <h1 className="relative text-4xl md:text-5xl font-bold tracking-tight text-[--color-text-primary] mb-2">
          {getGreeting()},{" "}
          <span className="text-gradient-primary">{firstName}</span>
        </h1>
        <p className="text-[--color-text-secondary] text-lg">
          {weather
            ? `${weather.temperature}°C em ${weather.city} — ${weather.description.toLowerCase()}`
            : "Aqui está o resumo das suas oportunidades hoje."}
        </p>
      </motion.section>

      {/* Stats */}
      <motion.div variants={fadeUp}>
        <StatsCards />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — actions + editais */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
          <QuickActions />
          <HotEditais />
        </motion.div>

        {/* Right — notebooks + spotify */}
        <motion.div variants={fadeUp} className="space-y-8">
          <RecentNotebooks />
          <SpotifyWidget />
        </motion.div>
      </div>
    </motion.div>
  );
}

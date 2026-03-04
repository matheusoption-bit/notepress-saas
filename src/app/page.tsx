"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileSearch,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";

/* ── Animations ──────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ── Features ────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileSearch,
    title: "Radar de Editais",
    description:
      "Monitore automaticamente editais de FAPESP, CNPq, FINEP e mais. IA identifica oportunidades com match score em tempo real.",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: Brain,
    title: "IA Assistente",
    description:
      "Gere propostas, resuma editais e extraia requisitos automaticamente com inteligência artificial avançada.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: BookOpen,
    title: "Notebooks Inteligentes",
    description:
      "Editor Lexical com auto-save, formatação rica, tabelas e integração direta com seus editais e soluções.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Sparkles,
    title: "Modos de Foco",
    description:
      "Ambiente que se adapta ao seu fluxo: Flow, Deep Focus, Ultra Focus e Creative Mode com atmosfera dinâmica.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description:
      "Dados criptografados, autenticação Clerk, e controle total sobre quem acessa seus notebooks e propostas.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: Zap,
    title: "Performance 2026",
    description:
      "Stack Next.js 15 + Turbopack. Glassmorphism nativo, fundo dinâmico por clima e micro-interações fluidas.",
    gradient: "from-cyan-500 to-sky-600",
  },
];

/* ── Page ────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <Layout variant="public">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="hero-bg absolute inset-0" />

        {/* Ambient glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel-static text-xs font-medium text-[--color-text-secondary]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma de Editais com IA — 2026
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-[--color-text-primary]">
              Seu ambiente de{" "}
            </span>
            <span className="text-gradient-primary">
              editais inteligente
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-[--color-text-secondary] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Notepress combina IA avançada, editor profissional e radar de editais
            em um ambiente que respira junto com você. Fundo que muda com o clima,
            modos de foco e glassmorphism premium.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Começar grátis
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/editais"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-[--color-text-secondary] glass-button rounded-2xl"
            >
              Explorar editais
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[--color-text-primary] mb-4">
              Tudo que você precisa,{" "}
              <span className="text-gradient-primary">num só lugar</span>
            </h2>
            <p className="text-[--color-text-secondary] max-w-xl mx-auto text-lg">
              Uma plataforma completa para pesquisadores, startups e
              empreendedores que buscam financiamento.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="glass-card rounded-2xl p-6 group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg mb-5`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/8 blur-[80px] pointer-events-none" />

            <h2 className="relative text-3xl font-bold text-[--color-text-primary] mb-4">
              Pronto para transformar sua busca por editais?
            </h2>
            <p className="relative text-[--color-text-secondary] mb-8 text-lg">
              Junte-se a pesquisadores que já usam o Notepress para encontrar e
              conquistar oportunidades de financiamento.
            </p>
            <Link
              href="/sign-up"
              className="relative inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Começar grátis agora
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[--glass-border] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
              N
            </div>
            <span className="text-sm font-medium text-[--color-text-secondary]">
              Notepress
            </span>
          </div>
          <p className="text-xs text-[--color-text-muted]">
            &copy; {new Date().getFullYear()} Notepress. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </Layout>
  );
}

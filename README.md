<div align="center">

# Notepress

**O sistema operacional da inovação brasileira.**

Transforme teses, projetos e soluções em aprovações de editais — com um cérebro quadripartite de IA, radar nacional em tempo real e um editor inteligente de nível profissional.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

</div>

---

## O que é o Notepress?

O Notepress é uma plataforma SaaS premium que centraliza todo o ciclo de captação de recursos de inovação no Brasil — do radar de editais até a submissão da proposta. Projetado para **pesquisadores, startups, ICTs e gestores de P&D**, o produto combina IA avançada com um editor colaborativo de documentos para que equipes escrevam propostas mais fortes, mais rápido.

---

## Funcionalidades Principais

### Notepress Brain — Cérebro Quadripartite
Orquestrador de 4 agentes de IA especializados que analisam, revisam, estruturam e validam sua proposta em sequência, cada um construindo sobre a saída do anterior:

| Agente | Modelo | Papel |
|---|---|---|
| **ANALYST** | Gemini 2.5 Flash | Análise profunda do conteúdo e contexto longo |
| **REVIEWER** | DeepSeek R1-0528 (via OpenRouter) | Revisão crítica, riscos e pontos fracos |
| **EXECUTOR** | Llama 3.3 70B (Groq) | Plano de ação, checklists e KPIs |
| **SYNTHESIS** | Llama 3.3 70B (Groq) | Síntese executiva final e compliance BR |

### Radar de Editais
- Catálogo nacional de editais abertos (FINEP, CNPq, BNDES, FAPESP e outros)
- Filtro por tema, UF, TRL, abrangência e valor
- Página individual com checklist, passo a passo e erros comuns
- Feed em tempo real do Diário Oficial da União (DOU)

### Notebook Inteligente
- Editor Lexical com suporte a Markdown, comandos slash (`/`) e toolbar flutuante
- Widgets especializados: Tabela de Custos, Checklist de Edital, Mapa TRL, Brainstorm
- Ghost text via IA (autocompletar contextual)
- Gravação de áudio diretamente no documento
- Versionamento automático com snapshots
- Sidebar de fontes e sidebar de versões integradas

### CNPJ Magic
- Importação automática de dados da empresa via CNPJ (Receita Federal)
- Pré-preenchimento de perfil e proposta com dados reais

### Validador de Inovação
- Pontuação de maturidade tecnológica (TRL)
- Análise dos 5 pilares de inovação com scoring estruturado

### Memória de Agentes
- Cada agente de IA mantém histórico por notebook e por usuário
- Contexto persistente entre sessões para respostas progressivamente mais precisas

---

## Stack Técnica

```
Frontend         Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4
Editor           Lexical + plugins customizados (slash commands, ghost text, áudio, widgets)
Autenticação     Clerk (multi-tenant, SSO, webhooks)
Banco de Dados   PostgreSQL via Supabase · Prisma ORM 7
IA               Vercel AI SDK 6 · Gemini 2.5 · DeepSeek R1 · Llama 3.3 · Groq
Storage          Supabase Storage
Colaboração      Y.js · y-webrtc · y-indexeddb
Pagamentos       Stripe
Deploy           Vercel · notepress.cloud
```

---

## Estrutura do Projeto

```
notepress-saas/
├── src/
│   ├── app/                    # Rotas (App Router)
│   │   ├── api/                # API routes
│   │   │   ├── ai/quadripartite/   # Brain Quadripartite endpoint
│   │   │   ├── brainstorm/         # Geração de brainstorm
│   │   │   ├── cnpj/lookup/        # Consulta CNPJ
│   │   │   ├── editais/            # CRUD de editais
│   │   │   └── notebooks/          # CRUD de notebooks
│   │   ├── dashboard/          # Painel principal
│   │   ├── editais/            # Radar de editais
│   │   ├── notebooks/          # Editor de notebooks
│   │   └── pricing/            # Planos e preços
│   ├── components/
│   │   ├── editor/             # Lexical + todos os plugins
│   │   ├── dashboard/          # Widgets do dashboard
│   │   ├── editais/            # Cards e grid de editais
│   │   ├── layout/             # Header, Sidebar, FloatingChat
│   │   └── ui/                 # Design system (Button, Card, Input…)
│   └── lib/
│       ├── ai/                 # Módulo de IA
│       │   ├── ai-providers.ts         # Providers (Gemini, DeepSeek, Groq)
│       │   ├── brain-orchestrator.ts   # Orquestrador quadripartite
│       │   ├── innovation-validator.ts # Validador de inovação
│       │   ├── edital-enricher.ts      # Enriquecimento de editais
│       │   └── perplexity-client.ts    # Cliente Perplexity/Sonar
│       ├── prisma.ts           # Cliente Prisma singleton
│       └── utils.ts            # Utilidades globais
├── prisma/
│   ├── schema.prisma           # Schema completo (User, Notebook, Edital, Brain…)
│   └── seed.ts                 # Seed com editais reais de 2026
└── agents/                     # Documentação dos agentes autônomos
    ├── PLAYBOOK.md
    ├── Analyst.md
    ├── Executor.md
    └── Reviewer.md
```

---

## Primeiros Passos

### Pré-requisitos

- Node.js 20+
- PostgreSQL (ou conta no Supabase)
- Contas nas APIs: Clerk, Google AI, Groq, OpenRouter, Stripe

### Instalação

```bash
git clone https://github.com/matheusoption-bit/notepress-saas.git
cd notepress-saas
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
# Banco de dados
DATABASE_URL="postgresql://..."

# Autenticação (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# IA
AI_GOOGLE_KEY=""          # Google Gemini
GROQ_API_KEY=""           # Groq (Llama)
OPENROUTER_API_KEY=""     # DeepSeek via OpenRouter

# Pagamentos
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

### Banco de dados

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Modelos de IA Utilizados

| Provedor | Modelo | Uso |
|---|---|---|
| Google AI | `gemini-2.5-flash` | Análise de documentos longos, pesquisa |
| DeepSeek (OpenRouter) | `deepseek/deepseek-r1-0528` | Revisão crítica quantitativa |
| Groq | `llama-3.3-70b-versatile` | Execução rápida, síntese |

---

## Roadmap

- [x] Setup: Next.js 16 + TypeScript + Tailwind + Prisma + Supabase + Clerk
- [x] Radar de editais com API dinâmica
- [x] Notebook com editor Lexical + plugins avançados
- [x] Cérebro Quadripartite (4 agentes de IA em sequência)
- [x] Design system e layout global (Dashboard, Header, Sidebar)
- [x] Onboarding personalizado
- [x] Memória persistente de agentes
- [ ] Crawler DOU em tempo real
- [ ] Colaboração real-time (Y.js + WebRTC)
- [ ] Notepress Cast (podcast de resumo por IA)
- [ ] Painel administrativo (superadmin)
- [ ] Stripe em produção (monetização real)
- [ ] Deploy em notepress.cloud

---

## Licença

Código proprietário. Todos os direitos reservados © 2026 Notepress.


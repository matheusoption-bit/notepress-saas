# Notepress SaaS

**O sistema operacional da inovação brasileira.**

Transforme teses, soluções e projetos em aprovações de editais com IA, radar nacional em tempo real e colaboração.

## 🚀 Como rodar

```bash
npm run dev

Acesse: http://localhost:3000
Estrutura do Projeto

src/app/ → Rotas App Router
agents/ → Agentes autônomos para Antigravity
prisma/ → Banco de dados (Supabase/Postgres)
PLAYBOOK.md → Guia para os agentes

Próximos passos (Fases)

 Fase 0 – Caule SaaS (concluída)
 Fase 1 – Home Netflix + Onboarding personalizado
 Fase 2 – Notebook com colaboração real-time
 Fase 3 – Radar de editais + Catálogo de Soluções
 Fase 4 – IA avançada + Notepress Cast
 

Tecnologias

Next.js 15 (App Router)
Clerk (Auth)
Supabase (Banco + Storage)
TipTap + Y.js (Editor real-time)
Prisma + PostgreSQL

Dominio: notepress.cloud (já comprado na Hostinger)

--------------------------------------------------------

Novo Plano de Execução (v2.0) – Antes do Deploy
Vou dividir em sprints curtos e priorizados. Cada sprint tem objetivo claro e entregável.
Sprint 8 (Próximo – 1-2 dias) – Layout Base + Navegação

Header global com logo, menu e perfil
Sidebar lateral persistente
Dashboard principal (/dashboard)
Proteção de rotas em todas as páginas

Sprint 9 – Catálogo de Soluções + CNPJ Magic

Página de soluções da empresa
Import automático via CNPJ (Receita Federal + scraping leve)
Conexão com Notebook

Sprint 10 – IA Avançada + LangChain

Integrar LangChain.js
Risco 5 Pilares, Humanização, LOI, etc. funcionando de verdade
Chat inteligente por notebook

Sprint 11 – Crawler + Atualização Automática

Crawler para DOU + sites oficiais (Finep, FAPESP, BNDES)
Atualização automática de editais

Sprint 12 – Monetização + Notepress Cast

Stripe real
Geração de áudio (podcast de resumo)

Sprint 13 – Polishing + Deploy

Responsividade total
SEO + meta tags
Deploy no Vercel + apontamento do domínio notepress.cloud
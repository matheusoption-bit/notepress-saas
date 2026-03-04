# ADR Index

Este diretório centraliza as **Architecture Decision Records** do Notepress.

## Convenção

- Nome: `NNNN-titulo-curto.md`
- Estado: `Proposed`, `Accepted`, `Deprecated`, `Superseded`
- Cada ADR deve registrar contexto, decisão, consequências e plano de migração.

## ADRs

- [0001-openai-env-var-canonicalization.md](./0001-openai-env-var-canonicalization.md) - OPENAI_API_KEY canônica com fallback legado.
- [0002-design-system-decision.md](./0002-design-system-decision.md) - destino oficial do `design-system.ts`.
- [0003-legacy-deprecation-policy.md](./0003-legacy-deprecation-policy.md) - política de depreciação de módulos legados.
- [0004-ai-provider-import-boundary.md](./0004-ai-provider-import-boundary.md) - fronteiras e caminho canônico de imports dos providers IA.

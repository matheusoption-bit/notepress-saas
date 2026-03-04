# ADR-0004 - Fronteira de imports para providers de IA

- Status: Accepted
- Date: 2026-03-04

## Context

O código possui múltiplos caminhos possíveis para providers IA:

- `@/lib/ai-providers` (raiz)
- `@/lib/ai/ai-providers` (shim de compatibilidade)
- outros barrels indiretos

Isso aumenta ambiguidade e risco de novos acoplamentos.

## Decision

- Caminho canônico para providers IA: `@/lib/ai-providers`.
- `@/lib/ai/ai-providers` permanece apenas como compatibilidade interna.
- Import canônico é imposto por lint para `src/**` (exceto `src/lib/ai/**`).

## Enforcement

- ESLint `no-restricted-imports` bloqueia:
  - `@/lib/ai/ai-providers`
  - `@/lib/ai/perplexity-client`

## Consequences

- Novos códigos passam a seguir um único caminho.
- Compatibilidade é preservada sem quebrar módulos internos existentes.

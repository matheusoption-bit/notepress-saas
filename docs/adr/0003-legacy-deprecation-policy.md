# ADR-0003 - Política de depreciação de módulos legados

- Status: Accepted
- Date: 2026-03-04

## Context

Há módulos de compatibilidade e caminhos antigos no código. Sem política explícita,
o legado tende a permanecer indefinidamente.

## Decision

Adotar política de depreciação em 4 etapas:

1. **Annotate**: marcar item como legado em código e docs (com ADR/nota).
2. **Warn**: emitir aviso em dev quando fallback legado for usado.
3. **Migrate**: mover consumidores para o caminho/padrão canônico.
4. **Remove**: remover legado apenas após ciclo de estabilização.

## Rules

- Toda exceção de compatibilidade deve ter:
  - justificativa
  - dono técnico
  - critério de remoção
- Remoções só entram quando CI estiver estável e sem consumidores ativos.

## Consequences

- Menos drift arquitetural.
- Mudanças mais previsíveis para o time.

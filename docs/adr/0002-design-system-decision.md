# ADR-0002 - Destino do design-system.ts

- Status: Accepted
- Date: 2026-03-04

## Context

`src/lib/design-system.ts` existe com tokens tipados, porém com uso parcial no app.
Havia duas opções: remover agora ou tornar referência oficial.

## Decision

- Manter `src/lib/design-system.ts` no repositório.
- Torná-lo referência oficial de tokens tipados.
- Integração será incremental (sem refactor massivo nesta sprint).

## Consequences

- Evita remoção prematura de artefato útil.
- Dá direção clara para evolução de UI.
- Mantém custo baixo na Sprint 0.

## Minimal Action in this Sprint

- Comentário ADR adicionado no arquivo.
- Diretriz documentada para próximas migrações de UI.

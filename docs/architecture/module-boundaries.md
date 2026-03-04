# Module Boundaries

## IA Providers

- Caminho canônico: `@/lib/ai-providers`
- Caminhos de compatibilidade (`@/lib/ai/ai-providers`) não devem ser usados em código novo.

## Regra automatizada

- ESLint `no-restricted-imports` impede imports não canônicos em `src/**`.
- Exceção temporária: `src/lib/ai/**` (módulos internos legados de compatibilidade).

## Referência

- ADR-0004: `docs/adr/0004-ai-provider-import-boundary.md`

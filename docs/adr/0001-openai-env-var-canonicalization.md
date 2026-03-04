# ADR-0001 - OpenAI env var canonicalization

- Status: Accepted
- Date: 2026-03-04

## Context

O repositório usa duas variáveis para a mesma credencial OpenAI:

- `OPENAI_API_KEY`
- `AI_OPENAI_KEY` (legada)

Isso causa confusão operacional e inconsistência entre rotas.

## Decision

- Variável canônica: `OPENAI_API_KEY`
- Compatibilidade temporária: `AI_OPENAI_KEY` como fallback
- Regras de resolução:
1. usa `OPENAI_API_KEY` se presente
2. senão usa `AI_OPENAI_KEY`
3. senão considera credencial ausente

## Consequences

- Reduz ambiguidade de configuração.
- Permite migração sem quebra imediata.
- Código novo deve usar helper central (`getOpenAiApiKey`).

## Migration Plan

1. Comunicar depreciação de `AI_OPENAI_KEY`.
2. Atualizar ambientes para `OPENAI_API_KEY`.
3. Remover fallback legado em sprint futura (a definir por ADR de revisão).

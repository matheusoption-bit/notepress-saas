# Operational Conventions (Labels, Milestones, Release, Changelog)

## Labels padrão

- `type:task` - tarefa técnica
- `type:bug` - correção de defeito
- `type:docs` - documentação
- `type:chore` - manutenção
- `area:frontend`
- `area:backend`
- `area:infra`
- `priority:p0` | `priority:p1` | `priority:p2`
- `status:blocked` | `status:ready` | `status:in-progress`

## Milestones

Formato: `Sprint N (YYYY-MM-DD a YYYY-MM-DD)`.

Exemplo:

- `Sprint 0 (2026-03-09 a 2026-03-13)`
- `Sprint 1 (2026-03-16 a 2026-03-27)`

## Cadência de release

- Branch principal: `master`
- Merge via PR com CI verde obrigatório
- Release semanal (ou ao final de sprint curta)
- Hotfix apenas para regressão crítica

## Changelog

Arquivo: `CHANGELOG.md` na raiz.

Formato por versão:

- `Added`
- `Changed`
- `Fixed`
- `Deprecated`
- `Removed`

Regra mínima:

- todo PR com impacto funcional deve incluir linha de changelog
- ADR relevante deve ser referenciado no item de changelog

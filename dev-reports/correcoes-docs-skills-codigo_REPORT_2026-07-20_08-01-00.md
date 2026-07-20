# Relatório — Correções docs, skills e código

**Data:** 2026-07-20 08:01  
**Branch:** (working tree local, sem commit)

## Resumo

Aplicadas correções validadas em documentação (EN/PT-BR), templates/skills geradas, código-fonte e testes. Suite completa verde: **79 arquivos / 1610 testes**.

## Alterações por área

### PLANO-sync-upstream-20260719.md
- Contagens STABLE/WORKSPACE corrigidas: 47 + 8 = 55 (disjuntos).
- PULAR ajustado de 6 → 7 commits.
- Nota explícita: ADIAR (stores/workspace) 4 ⊆ WORKSPACE 8, não entra na soma STABLE.

### Documentação (README, docs/, docs/pt-BR/)
- `/opsx:code-review` adicionado às listas do perfil expandido (README EN/PT).
- `/opsx:update` documentado em `editing-changes` (EN/PT) como comando suportado.
- `/opsx:update` incluído na lista core em `how-commands-work` (EN/PT).
- Kimi CLI → **Kimi Code**; **CodeArts** removido (não existe em `src/` nem `supported-tools.md`).
- `npm bin -g` → `npm config get prefix` com orientação POSIX/Windows (troubleshooting EN/PT).
- Desinstalação: comandos explícitos npm/pnpm/yarn/bun + `Remove-Item` PowerShell (installation EN/PT).
- Glossário: core inclui `update`; expandido inclui `code-review`.
- `workflows.md`: `/opsx:sync` classificado como perfil `core`, não expandido.

### Skills (templates + `skills/` regeneradas)
- `allowed-tools` expandido: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task.
- Apply: conclusão de tarefas via schema/`openspec instructions apply`, sem presumir `tasks.md`.
- Archive: `artifactPaths`, sync só após sucesso, arquivamento via `openspec archive`.
- Verify: seleção dinâmica de artifact de implementação; specs sem CRITICAL heurístico.
- Code-review: contexto OpenSpec via `artifactPaths`.
- Propose: lista inclui specs.
- Sync-specs: merge idempotente em ADDED/MODIFIED.
- Onboard: bloco PowerShell executável separado do Unix.

### Código-fonte
- `escapeYamlValue`: sempre quoted YAML strings.
- `validateChangeLookupName`: `archive` case-insensitive.
- `findDeltaSpecFiles` → `discoverSpecFiles`.
- `getSpecIds`: try/catch retorna `[]`.
- `powershell-installer`: catch `unknown` tipado.

### Testes
- Hashes de paridade regenerados.
- Asserções de adapters/generator ajustadas ao YAML sempre quoted.
- Teste case-insensitive para nome reservado `archive`.

## Itens ignorados (já corretos ou inválidos)

| Item | Motivo |
|------|--------|
| `test/core/init.test.ts` logCalls duplicado | Apenas uma declaração no bloco atual — já corrigido |
| `docs/pt-BR/commands.md` Kimi | Já usa "Kimi Code" |
| CodeArts em supported-tools | Ferramenta não suportada — removida da doc, não adicionada ao registry |

## Testes executados

```bash
pnpm run build && pnpm generate:skills
pnpm exec vitest run --watch=false
# Resultado: 79 passed, 1610 passed
```

## Status final

Alterações prontas para revisão. Nenhum commit ou push realizado.

# Plano de Sincronização BR-OpenSpec ← Fission-AI/OpenSpec (2026-07-31)

> **Status:** ✅ EXECUTADO em 2026-07-31 — 18 commits temáticos + regen de skills na branch, suite verde (92 arquivos/2925 testes), marcador atualizado e tag `synced/upstream-v1.7.0` criada.
> **Branch de trabalho:** `sync/upstream_20260731`
> **Fork:** `@dynamicworks/br-openspec` v2.2.0 (PT-BR first)
> **Upstream:** `@fission-ai/openspec` — ponto de partida `596d6ba7` (v1.6.0-30) → tip `45cca5db` (v1.7.0-7, 2026-07-30)
> **Novos commits:** 68 total — 62 a portar · 1 adiar (stores) · 5 pular

---

## 1. Objetivo e abordagem

Trazer as melhorias do upstream (pós-v1.6.0 → pós-v1.7.0) para o fork PT-BR, **sem merge** — porte temático arquivo-a-arquivo, traduzindo o que for exibido ao usuário e preservando as customizações do fork. Invariantes I1–I10 do plano anterior (`PLANO-sync-upstream-20260719.md` §2) continuam valendo integralmente.

## 2. Reclassificação do helper (falso positivo `registry`)

O `WORKSPACE_RE` do helper inclui `registry`, que casa com `command-registry.ts`/`adapters/registry.ts`:

- `ebf66c7e` (reduced-motion welcome) → **STABLE** (só falso positivo)
- `1637856c` (Windsurf→Devin Desktop) → **STABLE** (só falso positivo)
- `17af60c6` (drift check fence-aware + follow-ups) → **STABLE** (falso positivo; ignorar as deleções de `.changeset/*` — decisão D3)
- `6b3623a3` (view store pointer) → **WORKSPACE de verdade** (`store-selection.ts`, `resolveRootForCommand`, `--store`) → **ADIAR**

## 3. Decisões

| # | Decisão |
|---|---------|
| D1 | `6b3623a3` adiado junto ao subsistema stores/workspace (ver §7 do plano anterior) |
| D2 | Website: `11a301d5`, `2b503389`, `b976fc06` → PULAR (mantida D4 do plano anterior — website/ Cloudflare adiado) |
| D3 | `4e16790d` (Version Packages) e as deleções de `.changeset/*` dentro de `17af60c6` → PULAR (nunca importar versionamento/changesets do upstream) |
| D4 | `c33fcb3f` (CODEOWNERS→time upstream + MAINTAINERS.md) → PULAR — fork já tem `.github/CODEOWNERS` e `MAINTAINERS.md` próprios |
| D5 | Skills `skills/**` e hashes de paridade são regenerados **uma única vez ao final** (`pnpm build && pnpm generate:skills` + `scripts/regen-parity-hashes.mjs`), num commit chore próprio — commits temáticos tocam só `src/core/templates/workflows/*.ts` e `schemas/**` |
| D6 | `9d40ae98` (nix Node 22): portar — o flake do fork ainda usava `nodejs_20`; alinha com a identidade Node 22 do fork e corrige o aviso de segurança do nixpkgs |
| D7 | Docs: aplicar em `docs/` (EN) **e** traduzir em `docs/pt-BR/`; specs do próprio projeto (`openspec/specs/**`) acompanham os commits temáticos |

## 4. Sequência de execução (1 commit por tema, PT-BR, Conventional Commits)

### Lote A — Núcleo (parser/archive/validate/schema)
1. **fix(parser/validate)** — `470f5727` (drift multiplicity-aware), `a13abeac` (rejeitar delta spec na raiz de specs/), `c439a4ee` (divisores virando requisitos fantasma), `6a5171e1` (nomes de change com prefixo numérico)
2. **fix(archive)** — `6a4f0d7f` (manter Purpose do delta no main spec novo; toca schemas/templates sync-specs), `19d41714` (REMOVED early-synced como no-op; toca parsers, specs-apply, validator, templates, qwen, init, show), `45cca5db` (avisar antes de apagar nota indentada ao arquivar), `2b3d3685` (orientar a flag correta no archive não-interativo)
3. **feat/fix(validate)** — `27b22ab4` (skip_specs zero-delta; cria `src/core/change-metadata/`), `84ebc57c` (reportar cenários que MODIFIED descartaria), `17af60c6` (drift fence-aware + follow-ups de auditoria em feedback/gemini/zsh/markdown-parser/update/version-check/welcome/change-utils — **sem** as deleções de changesets)
4. **fix(schema)** — `5e365b96` (resolver diretórios de schema symlinkados), `5348da93` (validar artefatos antes do init --force), `d32d49f0` (arquivar o change correspondente no openspec/ do projeto)

### Lote B — Templates e schemas (PT-BR!)
5. **fix(templates) lote 1** — `b474f81c` (não arquivar antes do sync de specs), `9b5d2cdd` (sem segundo prefixo de data), `97d441a8` (bulk archive respeita Cancel), `0da5f98e` (formato do main spec no sync-specs), `378d468a` (contexto do projeto no explore)
6. **fix(templates) lote 2** — `2d6c4471` (todo genérico em vez de TodoWrite), `5dfef4b0` (campo instruction autoritativo), `1dc670de` (propose não pula specs), `5bcf0576` (ask-the-user neutro em vez de AskUserQuestion), `fc886af7` (auto-selecionar único change ativo), `b33b15d9` (design.md não repetir proposal)

### Lote C — Superfícies (init/update/adapters/CLI)
7. **fix/feat(init)** — `a84ae70e` (skill references p/ ferramentas sem adapter; toca `generate-skillssh.mjs`, `command-references.ts`), `b3b05e1a` (anunciar só slash commands do profile; cria `onboarding-commands.ts`), `1aa0f2ab` (feat: target `agents` compartilhado), `ebf66c7e` (reduced-motion no welcome)
8. **fix/feat(update+adapters)** — `10fa39b1` (refresh p/ tools sem skills), `6295515d` (oferecer upgrade de CLI desatualizado; cria `version-check.ts` + SECURITY.md), `fb196995` (escape YAML frontmatter em todos adapters), `9a937cb9` (nomes de slash command por ferramenta)
9. **feat(adapters) renames** — `81d5109b` (Roo Code→Zoo Code), `1637856c` (Windsurf→Devin Desktop; renomeia adapter, atualiza registry/config/init/migration/update/legacy-cleanup/docs)
10. **fix(cli) misc** — `caed05e8` (checkbox markers no multi-select), `f917b8be` (ordenar artefatos pelo schema), `26f009d9` (resolver change por diretório), `427abf40` (contar sub-tarefas indentadas), `60f720c4` (feedback sem label no repo)
11. **feat(instructions)** — `eac29738` (runtime context + operation guidance; toca cli/index, instruction-loader, templates, specs novas `operation-guidance`/`cli-archive-instructions`/`opsx-apply-skill`/`opsx-bulk-archive-skill` etc.)
12. **fix(telemetry)** — `87312900` (evento direto sem posthog-node; remove dep, ajusta flake)

### Lote D — Infra
13. **chore(security)** — `e2f748c6` (SECURITY.md, dependabot.yml, security.yml, key guards em config-schema/references/config), `040a8693` (guards literais), `05c70197` (override brace-expansion), `a874d1d6` (mkdtemp nos testes + 2 overrides CVE)
14. **test/chore(scripts)** — `34d2d67d` (isolar ZshInstaller de Oh My Zsh real), `cac44ecf` (invocar CLI sem shell), `ffe27de1` (helper de regeneração de hashes de paridade)
15. **ci/deps** — `d3a9982d`+`6832cc4a`+`3e3cbd3f` (bumps de actions — aplicar deltas nos workflows **do fork**), `9d40ae98` (flake nodejs_22), `5406c8b3`+`abb422a0` (bumps consolidados: aplicar em package.json do fork, `pnpm install`, recomputar hash do flake com `scripts/update-flake.sh`)

### Lote E — Docs e fechamento
16. **docs** — `a824aae9`+`fdf3d128`+`ec6cbb4b`+`1014c59e` (Community Schemas em customization.md), `9a61f3f3` (prompt de setup p/ AI assistant em 16 arquivos), `1da6dfa8` (Deno em installation.md), `d2082d1f` (spec cli-update OpenCode) — tudo espelhado em `docs/pt-BR/`
17. **chore(skills)** — regenerar `skills/**` + hashes de paridade (D5)
18. **chore(changeset+marcador)** — changeset `minor` do fork; `.upstream-sync.json` → `45cca5db` / `v1.7.0-7-g45cca5d` / histórico; tag `synced/upstream-v1.7.0`
19. **Validação** — `node build.js && pnpm lint && pnpm exec tsc --noEmit && pnpm test` + smokes

## 5. Adiados (acumulado)

- Subsistema stores/workspace beta (12 commits/hunks anteriores + `6b3623a3`)
- `website/**` Cloudflare e beta prerelease (D4 do plano anterior)

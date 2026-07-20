# Plano de Sincronização BR-OpenSpec ← Fission-AI/OpenSpec (2026-07-19)

> **Status:** ✅ EXECUTADO em 2026-07-20 — 30 commits temáticos na branch, suite verde (79 arquivos/1609 testes), marcador atualizado e tag `synced/upstream-v1.6.0` criada.
> **Branch de trabalho:** `sync/upstream_20260719`
> **Fork:** `@dynamicworks/br-openspec` v2.1.0 (PT-BR first)
> **Upstream:** `@fission-ai/openspec` — ponto de partida `1b06fddd` (v1.4.1, 2026-06-03) → tip `596d6ba7` (pós-v1.6.0, 2026-07-18)
> **Novos commits:** 55 total — 47 STABLE · 8 WORKSPACE beta (disjuntos; soma = 55)

---

## 1. Objetivo e abordagem

Trazer as **melhorias, correções e atualizações** do upstream (v1.4.1 → pós-v1.6.0) para o fork PT-BR, **traduzindo** o que for exibido ao usuário e **sem perder nenhuma customização do fork**.

**NÃO é `git merge`.** A sincronização é um **porte temático arquivo-a-arquivo**: para cada mudança do upstream, identificamos o alvo no fork, preservamos a adaptação PT-BR e **somamos** a melhoria. Análise commit-a-commit já feita (6 grupos); este plano consolida as recomendações.

---

## 2. Invariantes (REGRAS DE OURO) — em conflito, vence o fork

| # | Invariante |
|---|------------|
| I1 | **i18n PT-BR central** (`src/messages/index.ts`) — só adicionar/atualizar chaves em PT-BR; nunca reintroduzir inglês |
| I2 | **Identidade npm** — `@dynamicworks/br-openspec`, versão própria (NÃO aceitar 1.5.x/1.6.x), repo `dynamicworks-com-br/BR-OpenSpec` |
| I3 | **CHANGELOG/versionamento do fork** — não importar `Version Packages`, CHANGELOG nem changesets do upstream |
| I4 | **Workflows exclusivos do fork** — `code-review` e `upstream-sync` preservados; contagens de workflows sobem para **13** se o `update` entrar (12 upstream + code-review) |
| I5 | **CI/CD do fork** — Node 22, `NPM_TOKEN`, `release-prepare.yml` próprio; aplicar só deltas genéricos |
| I6 | **Docs bilíngues** — mudança estrutural vai em `docs/` (EN) **e** `docs/pt-BR/` (PT), branding BR-OpenSpec |
| I7 | **`flake.nix` próprio** — hash do upstream não serve; recomputar com `scripts/update-flake.sh` quando deps mudarem |
| I8 | **Termos reservados** — keywords de protocolo (SHALL/MUST, `### Requirement:`, `## Why` etc.) NUNCA traduzidos |
| I9 | **Hashes de paridade** — `test/core/templates/skill-templates-parity.test.ts` tem hashes próprios do fork; regenerar a partir do `dist/` sempre que um template mudar (nunca aplicar hunk de hash do upstream) |
| I10 | **Sem stores/workspace** — nada de `src/core/store/**`, `planningHome`, `artifactPaths.*` exceto o mini-campo aprovado na decisão D5; nenhum link `stores-beta/**` em docs |

---

## 3. Resumo executivo dos 47 commits STABLE

> **Nota de contagem:** STABLE (47) e WORKSPACE (8) são **disjuntos** — total upstream = 55. Os 4 commits listados como ADIAR (stores/workspace) na tabela abaixo **pertencem ao bucket WORKSPACE** (§6–§7) e **não entram** na soma STABLE. Portanto: 38 PORTAR + 2 ADIAR (decisão de produto) + 7 PULAR = **47 STABLE**.

| Destino | Qtde | Commits |
|---------|:----:|---------|
| **PORTAR** | 38 | ver sequência C1–C29 (§4) |
| **ADIAR (stores/workspace)** | 4 | `15ef3bcf`, `93e27a75`, `5199f41a`, `520aa8c4` — *subset dos 8 WORKSPACE; não somar em STABLE* |
| **ADIAR (decisão de produto)** | 2 | website `65a7233f`(parcial), beta `8e9e457c` — ver §6 |
| **PULAR** | 7 | `546224e0`, `e1b51d11` (Version Packages), `96f6cacb`, `15527310` (changesets), `0a99f410`, `871dece1` (deploy-docs, inexistente no fork), `da3907b8` (bug inexistente na arquitetura do fork) |

Os 8 commits classificados WORKSPACE pelo helper seguem adiados (ver §7).

---

## 4. Sequência de execução (1 commit por tema, em PT-BR, Conventional Commits)

Ordem respeita dependências (yaml→allowed-tools; parsers em sequência; archive em sequência; update-workflow antes de d423a594/b7c85c74; docs overhaul antes dos cross-links). Build + testes ao final de cada commit.

### C1 — `chore(deps)`: bumps de segurança  *(`737518b3`)*
- `package.json`: `vitest`/`@vitest/ui` ^3.2.4→^3.2.6, `typescript-eslint` ^8.50.1→^8.62.0, `@inquirer/core` ^10.2.2→^10.3.2, `@inquirer/prompts` ^7.8.0→^7.10.1, **+ `@vitest/coverage-v8` ^3.2.4→^3.2.6** (extra do fork, sobe em lockstep).
- `pnpm install` (regenera lockfile do fork — NÃO aplicar o pnpm-lock do upstream).
- Recomputar hash do `flake.nix` com `scripts/update-flake.sh`.
- Validar constraint de import dinâmico do @inquirer (minor bumps, risco baixo).

### C2 — `chore(repo)`: remover package-lock.json stale  *(`8ac624b2`)*
- `git rm package-lock.json` (stale no fork: declara 1.3.1; hoje tracked por engano).
- `.gitignore`: adicionar `/package-lock.json` na seção `# Pnpm`.
- `package.json`: adicionar `"packageManager": "pnpm@9.15.9"`.
- Remover os 5 blocos `with: version: 9` do `pnpm/action-setup` (4 no `ci.yml` + 1 no `release-prepare.yml`) — a action lê do campo `packageManager`. PULAR `deploy-docs.yml` (inexistente).

### C3 — `fix(completions)`: hardening de permissões nos instaladores  *(`41ceebe2`)*
- `src/utils/file-system.ts`: portar `hasWritableModeAndAccess` + reescrita de `canWriteFile` (bits POSIX antes do `fs.access`; diretórios com `W_OK|X_OK`). Contexto diverge: fork usa `FILE_SYSTEM_MESSAGES` — aplicação manual.
- 4 instaladores (bash/fish/zsh/powershell): verificar permissão antes de gravar/remover; fish ganha o import de `FileSystemUtils`.
- **Catálogo**: nova chave PT-BR para `Path is not writable: ...` (ex.: `COMPLETION_MESSAGES.pathNotWritable`).
- Testes: portar adaptando asserts a PT-BR (bash `'Falha ao instalar'`; novos testes uninstall read-only fish/powershell; zsh versões chmod; powershell `restoreEnvValue`).
- **PULAR** hunk `ci.yml` (fork já em Node 22) e `src/core/file-state.ts` (**ADIAR** — stores).

### C4 — `fix(completions)`: detecção do shell pai (fish)  *(`f58b4456`)*
- `src/utils/shell-detection.ts`: portar integral (consulta `ps -p <ppid>` antes de `$SHELL`; matching por basename exato com strip de `-`).
- Teste: portar integral, incl. `vi.mock('node:child_process')` e `mockedExecFileSync.mockReturnValue('node\n')` no `beforeEach` (essencial no pool forks).

### C5 — `test(e2e)`: hardening Windows + CI matrix  *(`296ecbc2` adaptado)*
- Portar integral: `test/helpers/run-cli.ts` (timeout 30s, kill de árvore, `mergeEnv` case-insensitive, `OPENSPEC_TELEMETRY: '0'`), `test/helpers/temp-cleanup.ts` (novo), `vitest.setup.ts` (matar children em vez de `process.exit(0)`).
- `ci.yml` — só o delta genérico, mantendo Node 22/nix/changesets: (a) `test_matrix.if` ← PR/merge_group/push/dispatch; (b) `VITEST_MAX_WORKERS` 4/4/2 na matrix; (c) remover `test_pr`, criar `test_pr_required` (needs: test_matrix); (d) ajustar `required-checks-pr`.
- **PULAR** os 9 arquivos de teste stores (`store-*`, `context`, `doctor`, `workset`...).

### C6 — `fix(adapters)`: escape de CR no frontmatter YAML  *(`cbf386bd`)*
- Novo `src/core/command-generation/yaml.ts` (verbatim) com `escapeYamlValue` escapando `\r`; dedupe nos 5 adapters (bob/claude/cursor/pi/windsurf) → `import { escapeYamlValue } from '../yaml.js'`.
- Portar `test/core/command-generation/yaml.test.ts` verbatim.
- **Portar ANTES de C18** (o hunk do claude.ts de `a5bfedaf` usa esse import como contexto).

### C7 — `fix(validation)`: resolução canônica validate/view/archive  *(`a3253051`)*
Maior commit do sync. Pontos:
- `validate.ts`: trocar as 3 chamadas `getActiveChangeIds()` por helper local baseado em `getAvailableChanges(process.cwd())` (**adaptação** — fork não tem root-selection).
- `validator.ts`: portar `findDeltaSpecFiles` (deltas recursivos `specs/<area>/<cap>/spec.md`); bloco #1156 em `applySpecRules` (hint SHALL/MUST-no-cabeçalho vale para main specs; header via `extractRequirementsSection`).
- `base.schema.ts`: remover o refine Zod `includes('SHALL')`; verificar órfão `REQUIREMENT_NO_SHALL` em `src/core/validation/constants.ts`.
- **Catálogo**: nova função `VALIDATOR_MESSAGES.missingShallOrMustRequirement(name, keywordInHeader)` (padrão das `missingShallOrMustAdded/Modified` já existentes).
- `task-progress.ts`: nova assinatura `(changesDir, changeName, projectRoot)`; contar checkboxes no glob `generates` do artefato de tasks com fallback `tasks.md`; nunca lançar. Contornar 3º arg de `resolveSchemaForChange` (fork deriva root de `changeDir`).
- `change.ts`: remover `countTasks`/regex inline → usar o helper. `archive.ts`/`list.ts`/`view.ts`: passar `projectRoot` nos callsites.
- Testes: novo `test/utils/task-progress.test.ts`; adaptar validate.test.ts (mockar `getAvailableChanges`); PT-BR nos asserts.

### C8 — `refactor(parsers)`: leitor de requisitos unificado + notas INFO  *(`9a0dfb5c`)*
- Novo `src/core/parsers/requirement-text.ts` (integral): corpo multi-linha, fence-aware, pula metadados `**X**:`, predicado `\b(SHALL|MUST)\b`.
- `markdown-parser.ts`: remover fence-mask estático; delegate de 4 linhas. **Preservar** import do catálogo (`SPEC_MESSAGES`/`CHANGE_MESSAGES`).
- `requirement-blocks.ts`: portar `SkippedHeader`/`skippedHeaders`/`bodyStartLine` e coleta (ou já o estado final, ver C9).
- `validator.ts`: delegates + loop INFO de `plan.skippedHeaders`.
- **Catálogo**: 2 mensagens INFO novas PT-BR (`skippedHeaderNameless`, `skippedHeaderNotRequirement`).
- Testes: ~390 linhas novas; **mudança intencional** no `markdown-parser.test.ts` (first-line → full-body).

### C9 — `fix(parsers)`: ignorar fenced code blocks em delta specs  *(`18cbf5d3`)*
- Novo `src/core/parsers/code-fence.ts` (62 linhas). **Decisão técnica:** o upstream tip tem `buildCodeFenceMask` duplicado (requirement-text + code-fence); no fork, **fonte única** em `code-fence.ts` com reexport em `requirement-text.ts` (mesmos pontos de import públicos).
- `requirement-blocks.ts` (estado final): fence-mask em `extractRequirementsSection`/`splitTopLevelSections`/`parseRemovedNames`/`parseRenamedPairs`. `spec-structure.ts`: `stripFencedCodeBlocksPreservingLines` vira delegate.
- Testes: blocos novos de `requirement-blocks.test.ts` + `countScenarios` fence-aware (asserts PT-BR existentes).

### C10 — `fix(cli)`: `--change` aceita nomes existentes em disco  *(`52a8bce1`)*
- `src/commands/workflow/shared.ts`: portar `validateChangeLookupName` (rejeita só `.`,`..`,separadores,null byte,dot-leading,`archive`); criação continua kebab-case (`validateChangeName` permanece para `new-change.ts`).
- **Catálogo**: 5 razões novas em `WORKFLOW_MESSAGES` (wrapper `invalidChangeName(name, error)` já existe).
- Revisar `test/commands/artifact-workflow.test.ts:199-213` (3 casos PT-BR).

### C11 — `fix(config)`: warnings de rules cross-schema  *(`285dfd7d`)*
- `instruction-loader.ts`: `validArtifactIds` = união de artifacts de `listSchemasWithInfo` (já existe no fork).
- `project-config.ts`: `validateConfigRules(rules, validIds)` — nova assinatura (2 args).
- **Catálogo**: `unknownArtifactId(artifactId, validIds)` novo texto sem schemaName; atualizar testes `:485-532`.

### C12 — `fix(archive)`: exit code em validação + scenario drift  *(`5956a8e8` + `7e21cc59`)*
- `archive.ts`: `process.exitCode = 1` nos 3 pontos de abort (`:151-155`, `:235-239`, `:247-255`). Portar 3 testes do describe exit-code (setup/teardown de `process.exitCode`; asserts PT-BR `validationFailed`/`abortedNoChanges`/`validationErrorsInRebuiltSpec`).
- `specs-apply.ts`: portar `ScenarioBlock`/`parseScenarioBlocks`/`findMissingCurrentScenarios` + checagem no loop MODIFIED (`:284-297`).
- **Catálogo**: nova chave `SPECS_APPLY_MESSAGES.modifiedFailedMissingScenarios(specName, reqName, names)` PT-BR.

### C13 — `fix(specs)`: discovery recursivo de specs aninhados  *(`3fdd2f2f`)*
Fecha classe de perda de dados (layout `specs/<area>/<capability>/spec.md` ignorado). Pontos:
- Novo `src/utils/spec-discovery.ts` (verbatim); `SpecUpdate` ganha `id`.
- Adaptar 8 arquivos: `item-discovery.ts`, `change-parser.ts`, `specs-apply.ts`, `archive.ts`, `list.ts`, `view.ts`, `commands/spec.ts` (action vira `async`). Trocar `path.basename(path.dirname(update.target))` por `update.id` (6 sites).
- **Preservar** catálogo (`SPEC_MESSAGES.noItemsFound` — não reverter para inglês).
- Testes: novo `test/utils/spec-discovery.test.ts` + 2 testes (nested merge no archive; nested ids no parser).

### C14 — `fix(archive)`: idempotência de deltas já sincronizados  *(`7958924e` + `b419e965`)*
- `specs-apply.ts`: ADDED com conteúdo idêntico vira no-op (`normalizeBlockRaw` + `addedApplied`); RENAMED cuja origem sumiu e destino existe vira no-op. Conteúdo divergente / ambos ausentes continua erro.
- Sem strings novas (reusa `addedFailedAlreadyExists`/`renamedFailedSourceNotFound` PT-BR).
- Testes: portar 4 casos (dependem do exit code de C12; asserts PT-BR).

### C15 — `fix(cli)`: datas locais + dedup de prefixo de data no archive  *(`9acddcda` + `9b70481d`)*
- Novo `src/utils/date.ts` (`formatLocalDate()`); trocar `toISOString().split('T')[0']` em `archive.ts` e `change-utils.ts:154`; remover `getArchiveDate()`.
- `archive.ts:272`: `ARCHIVE_DATE_PREFIX_PATTERN.test(changeName) ? changeName : \`${formatLocalDate()}-${changeName}\``.
- Spec `openspec/specs/cli-archive/spec.md`: aplicar os 2 hunks do upstream (fork está byte-idêntico à pré-imagem). Opcional: aplicar também os requisitos de data local em `cli-archive`/`change-creation` (paridade de specs).
- Testes de TZ (`process.env.TZ='Asia/Shanghai'` + fake timers) — sem dependência de PT-BR.

### C16 — `fix(config)`: parse de containers JSON em `config set`  *(`f987cf3e`)*
- `config-schema.ts`: `coerceValue` faz `JSON.parse` de `[...]`/`{...}`. Hunk aplica limpo.
- Testes: portar 2 casos; assert PT-BR `'Definido workflows = ...'`; aplicar hunk de setup (`runConfigCommand`/`consoleLogSpy`).

### C17 — `feat(workflows)`: novo workflow `/opsx:update`  *(`a70daccf`) — DECISÃO D1*
Feature nova: skill `openspec-update-change` que revisa artefatos de planejamento e os mantém coerentes (modo direcionado + auditoria; nunca edita código; confirma cada edição). Pontos:
- Novo `src/core/templates/workflows/update-change.ts` — **tradução integral PT-BR**; **remover** `${STORE_SELECTION_GUIDANCE}` (fork não tem `store-selection.ts`); podar bullets do JSON (`planningHome`/`changeRoot`/`actionContext`).
- **D5:** mini-campo `artifactPaths` no status JSON do fork (`instruction-loader.ts`, ~6 linhas usando `resolveArtifactOutputs` de `outputs.ts`) + teste — mantém o template fiel ao upstream.
- Wiring: `profiles.ts` (`'update'` após `'apply'` em CORE e ALL — **preservar `'code-review'`**); `profile-sync-drift.ts`; `tools-manager.ts:36` (mapa do fork); `skill-generation.ts`; `tool-detection.ts`; `skill-templates.ts`.
- **Catálogo**: `workflowUpdateName`/`workflowUpdateDesc` PT-BR + entrada `update:` em `WORKFLOW_PROMPT_META` (`config.ts:44`) — upstream não adicionou; fork adiciona por consistência.
- Docs: `docs/opsx.md` + `docs/commands.md` + `docs/supported-tools.md` (EN) e `docs/pt-BR/*` (PT).
- Testes: novo `test/core/templates/update-change.test.ts` (asserts contra strings PT-BR do template); contagens **13** em profiles/skill-generation/tool-detection/init/update/config; regenerar hashes de paridade.
- **NÃO copiar** `openspec/changes/add-update-workflow/` (dogfood do upstream).

### C18 — `feat(skills)`: auto-approve do CLI nos skills/commands  *(`a5bfedaf`) — depois de C6*
- Novo `src/core/shared/allowed-tools.ts` (`Bash(openspec:*)` single-sourced); `skill-generation.ts` insere `allowed-tools:` após `description:`; adapter `claude.ts` idem.
- Regenerar hashes de paridade (12→13 skills se C17 entrou); portar teste "pre-approves the openspec CLI" adaptado; asserção em `adapters.test.ts`.
- **PULAR** `openspec/changes/add-skill-cli-auto-approval/`.

### C19 — `fix(skills)`: referências de skill em delivery skills-only  *(`b7c85c74`)*
- `src/utils/command-references.ts` (+66): `COMMAND_TO_SKILL_REFERENCE` adaptado ao fork — incluir `update` (se C17) **e** `code-review`; `getTransformerForTool` centralizado; wirear `init.ts:533`, `update.ts:201,696`; export em `utils/index.ts`.
- Testes: estender `command-references.test.ts` + asserts de conteúdo em init/update (`not.toContain('/opsx:')`).

### C20 — `fix(config)`: aplicar profile em processo, sem npx  *(`a0eb70ef`)*
- `config.ts:630`: remover `execSync('npx openspec update')` → executar `UpdateCommand` em processo; helper local `asErrorMessage` (fork não tem `shared-output.ts`); remover import de `execSync`.
- **Catálogo**: `updateFailed` vira função `updateFailed(reason)`.
- Testes: 2 novos (stub PATH; assert `UPDATE_MESSAGES.noConfiguredTools` PT-BR; mock `UpdateCommand.prototype.execute`). Listas de workflows dos testes upstream incluem `update` — usar conjunto do fork.

### C21 — `fix(update)`: aviso genérico de workflows core faltantes  *(`d423a594`) — depois de C17*
Substitui a nota do sync anterior (`oldCoreProfileSyncNote`/`Hint`). Pontos:
- `update.ts`: remover `OLD_CORE_WORKFLOWS`; importar `CORE_WORKFLOWS`; trocar método `displayOldCoreCustomProfileNote` pela versão genérica (lista os que faltam, singular/plural).
- **Catálogo**: substituir as 2 chaves por `missingCoreWorkflowsNote(count, list)`/`missingCoreWorkflowsHint` com pluralização PT-BR (fluxo/fluxos; adicioná-lo/adicioná-los).
- Testes: caso singular do fork (falta `sync`); caso plural adaptado (upstream testa "update, sync" — usar 2 workflows do conjunto do fork); teste negativo (sem nota).

### C22 — `feat(tools)`: Kimi CLI → Kimi Code + migração de skills  *(`e60ff536`)*
Reverte o alinhamento D1 do sync anterior (upstream renomeou). Pontos:
- `config.ts:41`: name/successLabel `'Kimi Code'`, `skillsDir: '.kimi-code'`, `detectionPaths: ['.kimi-code', '.kimi']`.
- `migration.ts` (+76): migração de skills gerenciadas `.kimi`→`.kimi-code`, chamada por init (`:106`) e update (passo 2).
- **Catálogo**: nova chave PT-BR `migratedSkillDirs(n, from, to)`.
- Docs: `docs/commands.md` + `docs/supported-tools.md` (EN+PT).
- Specs: **adicionar** cenários Kimi Code em `openspec/specs/ai-tool-paths/spec.md` e `cli-init/spec.md` (fork não tinha os cenários Kimi).
- Testes: 3 de migração (substring-based, compatíveis com PT-BR); `available-tools.test.ts:49` continua válido via `detectionPaths`.

### C23 — `fix(ui)`: preservar input no Windows após welcome  *(`596d6ba7`)*
- `welcome-screen.ts`: `waitForEnter` troca listener raw por prompt Inquirer mínimo (`createPrompt`/`useKeypress`, **import dinâmico** — compatível com a regra ESLint do fork).
- Novo `test/ui/welcome-screen.test.ts` (mocka `@inquirer/core`; sem strings).

### C24 — `fix(templates)`: re-ler dependências do disco  *(`de78c31f`)*
- **Catálogo**: atualizar `WORKFLOW_MESSAGES.readFilesForContext` (`messages/index.ts:977`) com o acréscimo ("releia-os do disco mesmo que já os tenha visto — podem ter sido editados").
- 12 pontos PT-BR nos templates: `continue-change.ts` (`:68,187,112,231`), `ff-change.ts` (`:60,162,99,201`), `propose.ts` (`:69,180,108,219`) — traduzir uma vez, replicar.
- Regenerar hashes; verificar testes que assertam o texto antigo.

### C25 — `fix(templates)`: correções CodeRabbit (Cancel no archive, saída condicional, fences)  *(`46a4d782` parte A)*
- `archive-change.ts`: "Cancel" no prompt de sync **aborta** (substituir "...Prossiga para o arquivamento independentemente..." em `:67,:182`); saída de sucesso condicional (não hardcodar "Todos os artifacts completos..." em `:105,:220`).
- Fences com identificador de linguagem (MD040): `archive-change.ts` (10), `bulk-archive-change.ts` (20), `sync-specs.ts` (6) — mapear `markdown`/`text` caso a caso conforme upstream. Verify do fork não tem fences (nada a fazer).
- Regenerar hashes. **Parte B (skills.sh): ver decisão D2.**

### C26 — `feat(skills)`: publicar skills de workflow no skills.sh  *(`46a4d782` parte B) — CONFIRMADO (D2)*
- Copiar `scripts/generate-skillssh.mjs` + `scripts/skillssh-shared.mjs` (funcionam sem adaptação — fork tem `getSkillTemplates`/`generateSkillContent` com mesma assinatura; rodam sobre `dist/`).
- `package.json`: adicionar script `generate:skills`. Novo `.gitattributes` (LF forçado em `skills/**`).
- Gerar os **13** SKILL.md (inclui `openspec-code-review`) — saem **PT-BR** dos templates do fork (coerente com a identidade).
- `skills/README.md` com identidade do fork (`npx skills add dynamicworks-com-br/BR-OpenSpec`).
- Portar testes `skillssh-parity.test.ts` (byte-a-byte) + `skillssh-generator-guards.test.ts` (symlink/traversal).
- **Novo invariante:** CI/testes falham se template mudar sem regenerar → documentar no `AGENTS.md` (seção Development Conventions) que toda mudança de template exige `pnpm build && pnpm generate:skills`.
- Rodar DEPOIS de C17/C18/C24/C25 (templates finais).

### C27 — `chore(agents)`: skill de release adaptada ao fork  *(`3f02c686`) — CONFIRMADO (D4)*
- Criar `.agents/skills/release-br-openspec/` (SKILL.md + references/release-notes.md + agents/openai.yaml) adaptado: repo `dynamicworks-com-br/BR-OpenSpec`, pacote `@dynamicworks/br-openspec`, publish via `pnpm run release:ci` (NPM_TOKEN + provenance, Node 22), **sem** o fluxo beta (adiado), regra de exclusão de mantenedor ajustada ao fork.
- Fica em inglês (tooling de mantenedor — convenção do `AGENTS.md`).

### C28 — `fix(schemas)`: orientação de conteúdo de spec + open questions  *(`4fdb2a5f` + `a313bf1b`)*
- `schemas/spec-driven/schema.yaml`: inserir bloco "spec é contrato de comportamento" (+17) após linha 35; reescopar Open Questions do design (linha 104); checagem na instruction de `tasks` (entre linhas 118-121).
- **Traduzir tudo para PT-BR** (termos de protocolo permanecem).

### C29 — `docs`: overhaul completo (EN espelho + PT-BR)  *(`bb1f18c4` + `65a7233f`-docs + `4ef07610` + `924354b7`) — CONFIRMADO (D3)*
- **10 docs novos** (do tip, já com fixes posteriores): `docs/README.md`, `how-commands-work.md`, `overview.md`, `faq.md`, `glossary.md`, `troubleshooting.md`, `examples.md`, `explore.md`, `existing-projects.md`, `editing-changes.md` — **removendo refs `stores-beta/**`** (README:85, glossary seção "Coordination across repos", existing-projects).
- **3 docs novos** de `65a7233f`: `reviewing-changes.md`, `writing-specs.md` (integrais) + `team-workflow.md` (sem as 3 refs a stores) + cross-links. **PULAR** seção "Why teams adopt OpenSpec" do README (liderada por stores).
- Edições nos 6 existentes (`README.md`, `cli.md`, `commands.md`, `getting-started.md`, `installation.md`, `workflows.md`) — trocar `@fission-ai/openspec`→`@dynamicworks/br-openspec`; pular reordenação da tool list em `cli.md` (fork já superior), levar só a nota do `AI_TOOLS`.
- `4ef07610`: recriar mini-seção `### openspec new change` em `docs/cli.md` (+PT) com regras de nome kebab-case e flags `--description`/`--schema`.
- `924354b7`: bloco `<details>` com spec delta real em `README.md` + `README.pt-BR.md` (keywords de protocolo EN).
- **Traduzir tudo** em `docs/pt-BR/` (~1.650 linhas novas × 2 idiomas). Termos de protocolo permanecem EN.

### C30 — `chore(changeset)`: changeset da sincronização
- `.changeset/sync-upstream-1-6-0.md` (tipo `minor` — nova feature /opsx:update + skills.sh + docs → **2.2.0**, confirmado D6).
- Texto PT-BR listando **apenas o que entrou de fato** (omitir stores/beta).

---

## 5. O que NÃO importar do versionamento upstream

- ❌ `Version Packages` (`546224e0`, `e1b51d11`) e changesets consumidos (`96f6cacb`, `15527310`, e os `.changeset/*.md` individuais dos commits — referenciam `@fission-ai/openspec`).
- ❌ `package.json` versão 1.5.x/1.6.x / nome `@fission-ai/openspec`.
- ❌ CHANGELOG do upstream. ❌ Pastas `openspec/changes/**` de planejamento do upstream (dogfood deles).

---

## 6. Adiados / pulados

**ADIAR — bundle stores/workspace** (junto aos 8 commits WORKSPACE já classificados: `a0decbe3`, `3f0ca3f6`, `8886e3ae`, `4a0f15d3`, `57a88a3d`, `7704702d`, `ac656c98`, `79f1dac6`):
- `15ef3bcf` (store-aware root nos templates sync/archive — pressupõe reescrita `a0decbe`)
- `93e27a75` (empty store registration), `5199f41a` (global default store), `520aa8c4` (doctor: store atrás do upstream)
- `src/core/file-state.ts` (hunk de `41ceebe2`)

**ADIAR — decisão de produto (D2/D4):**
- `website/` Cloudflare (`65a7233f` parcial + `0a99f410`) — exigiria conta Cloudflare, rebranding, decisão sobre docs PT-BR no site.
- `8e9e457c` (beta prerelease workflow) — fork nunca publicou betas; exige adaptação de auth npm (NPM_TOKEN vs OIDC).

**PULAR:**
- `da3907b8` (PowerShell empty switch) — bug inexistente: o gerador do fork é da arquitetura anterior (sem `switch ($positionalIndex)`).
- `0a99f410`, `871dece1` — `deploy-docs.yml` nunca existiu no fork.
- Hunk `ci.yml` de `41ceebe2` (pin Node 20→20.19; fork usa 22).
- Seção "Why teams adopt OpenSpec" do README (stores).
- Hunk de reordenação da tool list em `docs/cli.md` (fork já tem `vibe` em posição melhor) — levar só a nota do `AI_TOOLS`.

---

## 7. Lista de SKIP (workspace beta — NÃO trazer) — atualizada

Código: `src/core/workspace/**`, `src/core/store/**`, `src/core/context-store/**`, `src/core/planning-home.ts`, `src/commands/workspace/**`, `src/core/file-state.ts`, `src/core/root-selection.ts`, `src/core/relationship-health.ts`, `planningHome`/`actionContext`/`STORE_SELECTION_GUIDANCE` em templates e status JSON, dep `cross-spawn`.
Docs: `docs/stores-beta/**`, seções stores de `docs/cli.md`/`docs/concepts.md`/`docs/agent-contract.md`, links stores-beta em qualquer doc novo.
Tests: `test/**/store-*`, `context.test.ts`, `doctor.test.ts`, `workset.test.ts`, `legacy-groups-removed.test.ts`, `capstone-journeys.test.ts` (partes stores).
Versionamento: `Version Packages`, changesets consumidos, `.changeset/config.json` do upstream.

---

## 8. Catálogo PT-BR — resumo das adições/alterações (`src/messages/index.ts`)

| Chave | Ação | Origem |
|-------|------|--------|
| `COMPLETION_MESSAGES.pathNotWritable` | nova | C3 |
| `VALIDATOR_MESSAGES.missingShallOrMustRequirement` | nova | C7 |
| `VALIDATOR_MESSAGES.skippedHeaderNameless` / `skippedHeaderNotRequirement` | novas (INFO) | C8 |
| `WORKFLOW_MESSAGES.changeLookup*` (5 razões) | novas | C10 |
| `PROJECT_CONFIG_SUGGEST_MESSAGES.unknownArtifactId` | nova assinatura (sem schemaName) | C11 |
| `SPECS_APPLY_MESSAGES.modifiedFailedMissingScenarios` | nova | C12 |
| `workflowUpdateName` / `workflowUpdateDesc` + `WORKFLOW_PROMPT_META.update` | novas | C17 |
| `CONFIG_MESSAGES.updateFailed` | vira função `(reason)` | C20 |
| `UPDATE_MESSAGES.oldCoreProfileSyncNote/Hint` → `missingCoreWorkflowsNote/Hint` | substituir | C21 |
| `UPDATE_MESSAGES.migratedSkillDirs` (ou `MIGRATION_MESSAGES`) | nova | C22 |
| `WORKFLOW_MESSAGES.readFilesForContext` | atualizar texto | C24 |

---

## 9. Decisões (CONFIRMADAS em 2026-07-19)

| # | Decisão | Resolução final |
|---|---------|-----------------|
| D1 | Portar `/opsx:update` (a70daccf) | ✔️ **Portar** (C17), com o mini-campo `artifactPaths` (D5) |
| D2 | Publicação skills.sh (46a4d782-B) | ✔️ **Portar agora** (C26) — skills PT-BR, invariante de regeneração documentado no AGENTS.md |
| D3 | Overhaul de docs | ✔️ **Portar tudo** (C29), sem refs stores |
| D4 | Infra/produto | ✔️ **Portar só o release skill** (C27, adaptado); **adiar** website Cloudflare e workflow de beta prerelease |
| D5 | Mini-campo `artifactPaths` no status JSON | ✔️ **Portar** com C17 (~6 linhas; usa `resolveArtifactOutputs` já existente) |
| D6 | Bump | ✔️ **minor → 2.2.0** |

---

## 10. Validação final

1. `pnpm install` (após C1/C2).
2. `node build.js` (build TS).
3. `pnpm run lint` e `pnpm exec tsc --noEmit`.
4. `pnpm test` — atenção a: testes PT-BR adaptados, hashes de paridade regenerados, novos testes (task-progress, spec-discovery, yaml, welcome-screen, update-change).
5. Smoke real: `node bin/openspec.js init --tools kimi` (migração `.kimi`→`.kimi-code`), `node bin/openspec.js validate`, `node bin/openspec.js completion --help`, archive com spec aninhado.
6. Revisar `git diff main` procurando inglês reintroduzido, `@fission-ai/openspec`, versão 1.6.x, refs stores.
7. Atualizar `.upstream-sync.json` (`lastSyncedCommit: 596d6ba7...`, `lastSyncedVersion: v1.6.0-30-g596d6ba` → registrar como pós-v1.6.0, data, entrada em `history` + `deferred` atualizado) e criar tag `synced/upstream-v1.6.0` (ou `synced/upstream-596d6ba` — decidir na execução conforme convenção anterior).

---

## 11. Próximos passos

1. ~~Você revisa este plano e confirma as **Decisões D1–D6** (§9).~~ ✅ Confirmadas em 2026-07-19.
2. Executo C1–C30 em ordem (delegando temas a subagentes coders, 1 commit por tema).
3. Você revisa o diff e abre o PR (não faço push sem sua autorização).
4. Subsistema stores/workspace e adiados de produto (website, beta prerelease) ficam para sincronizações dedicadas.

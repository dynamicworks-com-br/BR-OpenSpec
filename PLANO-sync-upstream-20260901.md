# Plano de Sincronização BR-OpenSpec ← Fission-AI/OpenSpec (2026-09-01)

> **Status:** 🚧 EM EXECUÇÃO
> **Branch de trabalho:** `sync/upstream_20260901`
> **Fork:** `@dynamicworks/br-openspec` v2.3.0 (PT-BR first)
> **Upstream:** `@fission-ai/openspec` — ponto de partida `45cca5db` (v1.7.0-7) → tip `d0071d73` (v1.11.0-1, 2026-09-01)
> **Releases cobertas:** v1.8.0 (2026-08-05), v1.9.0 (2026-08-13), v1.10.0 (2026-08-19), v1.11.0 (2026-08-26)
> **Novos commits:** 84 total — 60 a portar (alguns parcialmente) · 6 adiar (stores/docs-lab) · 18 pular (Version Packages, changesets, website)

---

## 1. Objetivo e abordagem

Trazer as melhorias do upstream (pós-v1.7.0 → pós-v1.11.0) para o fork PT-BR, **sem merge** — porte temático arquivo-a-arquivo, traduzindo o que for exibido ao usuário e preservando as customizações do fork. Invariantes I1–I10 (`PLANO-sync-upstream-20260719.md` §2), decisões D1–D7 de `PLANO-sync-upstream-20260731.md` e as regras de `AGENTS.md` ("Upstream Sync Strategy", "Reserved English Terms") continuam valendo integralmente.

## 2. Reclassificação do helper

O `WORKSPACE_RE` do helper casa com `command-registry.ts`, `command-generation/registry.ts` e `pnpm-workspace.yaml` — falsos positivos. Reclassificação dos 11 marcados como WORKSPACE:

| Commit | Helper | Real | Motivo |
|---|---|---|---|
| `3e50944f` esbuild install scripts | workspace | **STABLE** (parcial) | só `pnpm-workspace.yaml`; fork já tem `allowBuilds`/`onlyBuiltDependencies` — portar teste + paths de CI + `onlyBuiltDependencies` no package.json; ignorar `website/` |
| `73207a6f` Copilot cloud opt-in | workspace | **STABLE** | só `command-registry.ts`; portar junto com `7a4a745d` |
| `59c16a44` Command Code adapter | workspace | **STABLE** | só `command-generation/registry.ts`; portar com `42d7f673` |
| `83be9d11` validate --archived | workspace | **STABLE** | só `command-registry.ts` |
| `83644286` schemas root selection | workspace | **ADIAR** | usa `resolveRootForCommand`/`--store` (stores); hunk do propose.ts é sobre `--store` (fork não tem `STORE_SELECTION_GUIDANCE`) |
| `b96b3e85` website deps | workspace | **PULAR** | website (D2/D4 anteriores) |
| `3281f1f0` js-yaml/nanoid overrides | workspace | **STABLE** | overrides em `package.json`/`pnpm-workspace.yaml` + comentário no dependabot; ignorar `website/` |
| `c747ed1f` init --language | workspace | **STABLE** | só `command-registry.ts` + teste `declared-store-fallback` (pular esse teste). **Altamente relevante para o fork PT-BR** |
| `a7353aea` status --all | workspace | **STABLE (adaptado)** | usa `resolveRootForCommand`/`isStoreSelectedRoot` — adaptar à resolução de root do fork (`process.cwd()`); ignorar `docs-lab/` |
| `ab81a4b4` Fish completions | workspace | **STABLE** | só `command-registry.ts` |
| `dd7cea3f` show --diff | workspace | **STABLE (adaptado)** | usa tipo `RootOutput` de root-selection — adaptar; adiciona dep `diff@^9`; ignorar `docs-lab/` e `openspec/changes/spec-diffs/` |

Commits marcados STABLE pelo helper que na verdade dependem do subsistema stores (fork não tem `root-selection.ts`, `file-state.ts`, `planning-home.ts`, `change-status-policy.ts`):

| Commit | Decisão |
|---|---|
| `137404b4` reject missing roots (list/validate) | **ADIAR** — muda `allowImplicitRoot` de `resolveRootForCommand` |
| `9643888a` schema.yaml `<planningHome.root>` | **ADIAR** — `openspec instructions --json` do fork não expõe `planningHome`; guidance referenciaria campo inexistente |
| `d9bcc185` docs/stores-beta multi-repo | **ADIAR** — fork não tem `docs/stores-beta/` |
| `9cd845fc` security: paths on a short leash | **STABLE (parcial)** — portar tudo **exceto** o hunk de `src/core/file-state.ts` |
| `afea111c` status: planning completion | **STABLE (parcial)** — portar `isPlanningComplete` + mensagem + templates; o hunk de `change-status-policy.ts` (`buildNextSteps`) não tem correspondente no fork (sem `nextSteps` no instruction-loader) |

## 3. Decisões

| # | Decisão |
|---|---------|
| D1 | Stores/workspace: `83644286`, `137404b4`, `9643888a`, `d9bcc185`, hunk `file-state.ts` de `9cd845fc`, hunk `change-status-policy.ts` de `afea111c` → **ADIAR** (acumulado com §7 do plano 20260719) |
| D2 | Website: `80ad1fba`, `6d031f12`, `cfc74eeb`, `6926ccb1`, `b96b3e85` e os hunks `website/**` de `4e4c9e1f`, `02b124e6`, `3e50944f`, `3281f1f0`, `f1b521df` → **PULAR** |
| D3 | Versionamento: `d5788966`, `2826b888`, `1ebddd17`, `a0ddb60d` (Version Packages), `568e56c6`, `610b78f6` (catch-up changesets) e todo `.changeset/*.md` dentro dos commits temáticos → **PULAR**. Versão do fork sai do changeset próprio |
| D4 | **docs-lab / install.md / `.agents/skills/*-openspec-docs`** (`f1b521df` e hunks `docs-lab/**` de `a7353aea`, `109f81f1`, `dd7cea3f`, `2fa679f1`) → **ADIAR**: docs-lab é a fonte do website (adiado). A documentação do fork continua sendo `docs/` (EN) + `docs/pt-BR/`. A **informação** desses hunks (status --all, show --diff, caminhos `.agents` do Antigravity, `schema init --default`) entra em `docs/cli.md`/`docs/supported-tools.md` EN + PT-BR |
| D5 | Skills `skills/**` e hashes de paridade regenerados **uma única vez ao final** (`pnpm build && pnpm generate:skills` + `pnpm regen:parity-hashes`), em commit chore próprio. Commits temáticos tocam só `src/core/templates/workflows/*.ts` e `schemas/**`; o teste de paridade pode ficar vermelho entre lotes |
| D6 | `openspec/changes/**` do upstream (`804427b6`, `83644286`, `18688c8b`, `126c5d6c`, `dd7cea3f`) → **PULAR** (change dirs em andamento do upstream). `openspec/specs/**` acompanha os commits temáticos |
| D7 | Docs: aplicar em `docs/` (EN) **e** traduzir em `docs/pt-BR/`; hunks de `docs/agent-contract.md` são ignorados (fork não tem a página). README.md (`622c509a`) idem nos dois idiomas |
| D8 | `7276c6c2` (remover `postinstall`): portar — remove `scripts/postinstall.js`, `scripts/test-postinstall.sh`, scripts `postinstall`/`test:postinstall` do package.json e a entrada em `files`; dica de completions passa a sair do CLI (`src/core/completion-tip.ts`) |
| D9 | `ece8660d` (requisitos sem SHALL/MUST viram WARNING em vez de ERROR): portar — compatível com "Reserved English Terms" (o fork continua recomendando os termos em inglês; só deixa de bloquear) |
| D10 | `c747ed1f` (`init --language`): portar com strings PT-BR; o texto de contexto gerado (`Language: …`) segue o upstream, pois é lido por agentes. Documentar em `docs/pt-BR/multi-language.md` o uso recomendado `--language "Português (pt-BR)"` |
| D11 | Deps: dev-deps do fork já estão alinhadas ao tip do upstream (verificado por diff de package.json). Portar: `@inquirer/prompts@^8` + `@inquirer/core@^11` (`91813641`, ajusta `config.ts`), `diff@^9` (`dd7cea3f`), pin `cross-spawn@7.0.6`, overrides `brace-expansion`/`postcss`/`js-yaml`/`nanoid`, `onlyBuiltDependencies`. Hash do flake recomputado **uma vez** no fechamento (`scripts/update-flake.sh`) |
| D12 | CI (`02b124e6` permissões do release-prepare, `89169627`/`d7893184` bumps de actions, `3e50944f` paths, `144901ca` dependabot ignore): aplicar os deltas nos workflows **do fork**, preservando `NPM_TOKEN` (não migrar para OIDC-only) |
| D13 | Testes `test/**` do upstream: portar adaptando só asserções de string ao PT-BR; testes que dependem de stores (`store-root-selection`, `store-lifecycle`, `declared-store-fallback`) → pular |

## 3b. Decisões complementares (após análise por commit — `_COMPLETUDE-r1.md`)

| # | Decisão |
|---|---------|
| D14 | Glossário: novas chaves de `ARCHIVE_MESSAGES` usam **"especificação"** (convenção da seção); `SPECS_APPLY_MESSAGES` e os workflow templates mantêm **"o spec"** (masc.); `docs/pt-BR` mantém "a spec". Termo novo **retire → "aposentar/aposentadoria"** (registrar no glossário do AGENTS.md ao fechar) |
| D15 | Textos do Lote 0 vencem e são reutilizados pelos lotes seguintes: `INIT_MESSAGES.setupFailedFor(x)` = "A configuração do BR-OpenSpec falhou para: x"; `UPDATE_MESSAGES.updateFailedFor(x)` = "A atualização do BR-OpenSpec falhou para: x" |
| D16 | Redações únicas nos templates (C-4 grava já o **estado final** de C-5 onde a mesma linha muda duas vezes): placeholder `<novo-nome-da-change>`; "Se ele não estiver disponível, `openspec status --change "<nome>" --json` mostra o próximo artifact"; "verifique primeiro se o workflow opcional `/opsx:new` está disponível" (207f3cc5 então só exporta `WORKFLOW_PROMPT_META` + teste do picker); explore: "Não faça scaffold de changes manualmente" e "Para uma change nova, faça o scaffold dela primeiro, conforme descrito abaixo." — os testes usam essas *needles* |
| D17 | Mensagens de `src/core/parsers/spec-structure.ts` passam a PT-BR via nova seção `SPEC_STRUCTURE_MESSAGES` (`deltaHeader(header)`, `requirementOutsideRequirements(header)`, `duplicateRequirement(header, line)`), criada no Lote A (521ee33e); 3d0701f8 só troca o token `<capability-path>`; asserções de `validation.test.ts`/`archive.test.ts` ajustadas uma única vez |
| D18 | Criar já em D-6 (59bfb27a) a chave genérica `INIT_MESSAGES.sharedSkillsRootOneTree(names, root, owner)` (evita renomear em f3aa167d/109f81f1) |
| D19 | Após o Lote 0, `init`/`update` **lançam** quando uma ferramenta falha: testes portados usam `rejects.toThrow(UPDATE_MESSAGES.updateFailedFor(...))` / `INIT_MESSAGES.setupFailedFor(...)` (corrige LD-59bfb27a §5) |
| D20 | **`79f1dac6`** (feat(codex): Codex skills-only, #1283, 2026-07-18) foi adiado em 2026-07-19 por **falso positivo** do classificador (`registry.ts`) e não pertence ao subsistema stores → **PORTAR nesta sync** como Lote D-0, antes de D-6 (59bfb27a/07dea6ed/109f81f1 pressupõem Codex skills-only). Brief próprio |
| D21 | Política única para deltas pendentes do upstream: **não antecipar** em `openspec/specs/**` deltas que só existem em `openspec/changes/**` do upstream (fix-archive-retirement-guidance, warn-on-purpose-placeholder, spec-diffs, suppress-telemetry-notice-in-json…). LA-18688c8b **não** aplica o delta em `cli-archive/spec.md`. Registrar em `dev-reports/` para revisitar quando o upstream arquivar |
| D22 | Pins comportamentais de templates seguem a **localização do upstream** (dentro de `skill-templates-parity.test.ts` ou no arquivo dedicado do commit de origem); não criar arquivos de teste que o upstream não tem |
| D23 | Subsistema fork-only `openspec tools` (`src/core/tools-manager.ts`): **adaptar** — aplicar a guarda de caminho do Lote 0 e manter coerência com `AI_TOOLS` para as ferramentas novas (MiniMax, Zed, Rovo, Command Code) e para a árvore `.agents` compartilhada |
| D24 | Lote G ajusta `README.md`, `AGENTS.md` ("Reserved English Terms") e o cabeçalho de `src/messages/index.ts`: omitir SHALL/MUST passa a gerar **WARNING** (erro só com `--strict`), não "quebra o validate" (consequência de D9) |
| D25 | Erro factual em LC-7da3f34f §6: `3d0701f8` **não** troca a linha "Salve em `openspec/changes/<nome>/tasks.md`" do onboard — só insere `<capability-path>`; o executor ignora essa instrução |
| D26 | Dívidas pré-existentes apontadas pelos briefs (adapter `pi.ts` sem `$@` nos corpos PT-BR; chave órfã `INIT_MESSAGES.startFirstChangeWithSkill`; cabeçalhos traduzidos em `ONBOARD_TEMPLATE_MESSAGES`; cauda narrativa legada em `openspec/specs/openspec-conventions/spec.md`; "placeholder TBD" × "A definir" no sync-specs; `.openspec-archive.lock`/`.openspec-move-*` não filtrados por `list`) → **fora de escopo**; registrar em `dev-reports/` no fechamento |

## 3c. Decisões complementares (rodada 2 — `_COMPLETUDE-r2.md`)

| # | Decisão |
|---|---------|
| D11' | Emenda a D11: `@inquirer/prompts@^8` exige `@inquirer/core@^12.0.1` (checkbox@^5.2.3 → core@^12); usar **core ^12.0.1** (não ^11) para não recriar cópias duplicadas |
| D23' | D23 concretizado: (a) guarda de caminho do Lote 0 em `tools-manager.ts`; (b) ferramentas novas entram via `AI_TOOLS` (verificar que `openspec tools --add/--remove` as aceita); (c) árvore `.agents` compartilhada: `tools-manager` reutiliza `resolveSharedSkillWriters` de `shared-skill-target.ts` ao escrever skills — executado no lote D-4 (109f81f1); se a adaptação (c) for grande, registrar follow-up em `dev-reports/` |
| D24' | Inventário de D24 (Lote G): `README.md` ("Notas de Uso"), `AGENTS.md` ("Reserved English Terms" + seção de env vars: `CI=true` desliga telemetria/version-check, `telemetry.enabled` no config global, `OPENSPEC_NO_COMPLETIONS`), cabeçalho de `src/messages/index.ts`; e frase em `docs/cli.md` (EN+PT) de que mensagens dentro do JSON (`warning`, `status[].message`, `issues[].message`) são PT-BR |
| D27 | Adapters de comando com rótulo de argumentos: chave única `COMMAND_ADAPTER_MESSAGES.providedArguments(placeholder)` criada em D-3 (59c16a44) e consumida por 15e50d68 (`'$ARGUMENTS'`) e pelo **`fix(pi)`** colateral (`'$@'`, regex `**Entrada**:`/`Nenhuma necessária`) — commit separado no lote D-4, com teste tripwire ponta-a-ponta (template real, não fixture EN) |
| D28 | Chaves órfãs do catálogo: **não remover** nesta sync (I1: só adicionar); registrar as órfãs (`spaceToToggle`, `removingExistingSchema`, `startFirstChangeWithSkill`…) em `dev-reports/` para limpeza futura. Não duplicar chaves existentes (`CLI_MESSAGES.unknownError`, `PROMPT_MESSAGES.navigate/confirm`) |
| D29 | `LF-telemetry-notice`/`7276c6c2` dependem do scaffolding de `fd92ccc` (stores, adiado): portar **só o scaffolding** — `export { program }`, `runCli()` e guarda de módulo principal em `src/cli/index.ts`, `bin/openspec.js` chamando `runCli()` — sem o restante de stores |
| D30 | `LF-ab81a4b4` depende dos tipos `PositionalType`/`PositionalDefinition`/`CommandDefinition.positionals` de `7c3accc` (adiado): portar **só esses tipos** em `completions/types.ts` |
| D31 | `LE-infra`: aceitar os artefatos fork-only para preservar a dica PT-BR do checkbox após inquirer v8 (`src/prompts/keys-help-tip.ts` + chaves `PROMPT_MESSAGES.*` — reutilizando `navigate`/`confirm` existentes, sem duplicar); higiene opcional do comentário órfão em `release-prepare.yml` |
| D32 | Lote B usa a **opção B** de LB-e50bd098 §2.1 (`projectRootOverride` em `resolveSchemaForChange`/`resolveTaskFilesForChange`), pré-requisito de `validate --archived` (83be9d11), que deve ignorar `.openspec-archive.lock`/`.openspec-move-*` com teste |
| D33 | Glossário (complemento a D14): cada seção do catálogo segue sua convenção existente (`CHANGE_MESSAGES` "spec principal" masc.); pluralização no padrão `tarefa(s) incompleta(s)`; `TELEMETRY_MESSAGES.firstRunNotice` cita o comando entre aspas simples; docs PT-BR usam "delta specs"; transcrições de saída da CLI em `docs/cli.md` EN ficam em EN (PT-BR só em `docs/pt-BR/`) |
| D34 | `LD-109f81f1` foi escrito assumindo `79f1dac6` adiado: com D20, as adaptações F1–F3 caem (Codex é skills-only), F4 (isolar `CODEX_HOME` nos testes) permanece obrigatória — e vale para **todos** os lotes que tocam Codex (D-0, D-1, D-3, D-4); os testes de forma dupla portam verbatim |

## 4. Sequência de execução (1 commit por tema, PT-BR, Conventional Commits)

### Lote 0 — Base de segurança de caminhos
0. **fix(security)** — `9cd845fc` (helpers `assertProjectArtifactPath`/etc. em `file-system.ts`; aplicação em change/schema/spec/instructions/templates/archive/artifact-graph/init/project-config/specs-apply/update/validator/spec-discovery — **sem** `file-state.ts`)

### Lote A — Archive / specs-apply
1. **feat(archive)** — `521ee33e` (retire capability: `retire_capabilities` em change-metadata, archive.ts, specs-apply.ts, spec-structure.ts, templates sync-specs/archive/bulk-archive, specs cli-archive/opsx-archive-skill/specs-sync-skill), `18688c8b` (never dead-end retirement), `02b124e6` hunk archive.ts (comentários CodeQL)
2. **fix(archive)** — `94258974` (EOF canônico), `0221ac3d` (linhas em branco ao redor de `## Requirements`), `04b37ac1` (ordem ao renomear), `9ae75c86` (sem ANSI em stdout não-TTY; `interactive.ts`)

### Lote B — Validate / parsers
3. **fix(validate)** — `ece8660d` (D9), `e50bd098` (numeração ambígua de tasks; `task-numbering.ts`, `task-progress.ts`), `c751b3da` (todo header nível 4 conta como cenário), `126c5d6c` (Purpose deixado como placeholder; `purpose-placeholder.ts`), `a2b965aa` (changes sem spec válidos; instruction-loader/outputs/change-utils)

### Lote C — Templates de workflow (PT-BR!) e schema
4. **fix(templates) lote 1** — `26bd1d4e` (guidance gerada), `0b20ae39` (propose espera pedido explícito), `f43fe0e7` (propose usa schema pedido), `afea111c` (planning completion — parcial), `8a3850da` (explore scaffolda antes de capturar), `3d0701f8` (preservar caminhos aninhados de spec; schema.yaml + proposal.md + validator/spec-structure)
5. **fix(templates) lote 2** — `0b233efb`→`06b310bf`→`96a65486` (estado final: corpo de apply compartilhado entre skill e command via `skill-templates.ts`), `bf5099e3` (apply expõe escopo adiado), `207f3cc5` (rótulo do update no picker; sem "expanded-profile"), `7010e268` (explore pede confirmação antes de escrever), `e5e350d0` (ASCII nos diagramas do explore), `7da3f34f` (tasks com verificação; schema.yaml + onboard)

### Lote D — Ferramentas / init / update / adapters
5b. **feat(codex)** — `79f1dac6` (Codex skills-only: remove o adapter de custom prompts, aposenta os prompts gerenciados em `~/.codex/prompts`, migração/limpeza legada; D20)
6. **feat(tools) lote 1** — `690a27e6` (legacy-cleanup não apaga CoStrict/Junie), `161f9454` (MiniMax Code skills; `shared/skill-paths.ts`), `59bfb27a` (Codex instala skills em `.agents/` canônico; `shared-skill-target.ts`, `skill-content-equivalence.ts`), `13e213e0` (Atlassian Rovo Dev)
7. **feat(copilot)** — `7a4a745d` + `73207a6f` (arquivos do Copilot coding agent no init, opt-in `--copilot-cloud`/`--no-copilot-cloud`; `github-copilot/cloud-agent.ts`)
8. **feat(tools) lote 2** — `42d7f673` + `59c16a44` (Command Code), `07dea6ed` (upgrade legado do Codex não sequestra `agents`), `17581c11` (dica "reinicie a IDE" só para ferramentas embutidas)
9. **feat(tools) lote 3** — `a72a74de` (update só sugere reiniciar IDE quando preciso), `f3aa167d` (Zed Agent), `cf06d45f` (profiles incluem sync com archive), `15e50d68` (OpenCode passa argumentos), `c747ed1f` (`init --language`, D10), `109f81f1` (Antigravity `.agent`→`.agents`)

### Lote E — Infra / deps / CI
10. **chore(deps/ci)** — `91813641` (inquirer v8/core v11 + `config.ts`), `02b124e6` (overrides + `security.yml` + permissões), `3e50944f` (onlyBuiltDependencies + teste + paths CI), `3281f1f0` (overrides js-yaml/nanoid + dependabot), `89169627` + `d7893184` (bumps de actions), `144901ca` (dependabot ignore), pin `cross-spawn@7.0.6`; verificar `23c27877`/`4b114aad`/`c0c50f9a` (já alinhados); `pnpm install`

### Lote F — CLI / comandos
11. **fix(telemetry+feedback)** — `622c509a` (`telemetry.enabled` no config global; `utils/ci.ts`), `804427b6` (sem aviso first-run em `--json`; `isJsonRun`), `db981f27` (aviso em stderr), `d56f9fc7` (suite sem telemetria no vitest.config), `fc0fec12` (feedback com relatório completo no corpo da issue)
12. **fix(schema+completions)** — `8127c7b7` (fork de schema preserva YAML), `2fa679f1` (`schema init --default` funciona), `7276c6c2` (D8 — completion tip no CLI, remove postinstall), `ab81a4b4` (Fish sem fallback para arquivos)
13. **feat(cli) flags** — `83be9d11` (`validate --archived`), `a7353aea` (`status --all`, adaptado), `dd7cea3f` (`show --diff` + `utils/requirement-diff.ts` + dep `diff`, adaptado)

### Lote G — Docs e fechamento
14. **docs** — espelho EN + tradução PT-BR de todos os hunks `docs/**` (+ README.md, SECURITY.md, scripts/README.md): `4e4c9e1f` + `98c79324` (lifecycle mermaid em workflows.md), `1a10dd58` (opsx.md /opsx:sync), `d0071d73` (retire capabilities em cli.md), e hunks de docs de `521ee33e`, `3d0701f8`, `161f9454`, `59bfb27a`, `622c509a`, `42d7f673`, `59c16a44`, `9ae75c86`, `07dea6ed`, `fc0fec12`, `f3aa167d`, `c747ed1f`, `18688c8b`, `7276c6c2`, `73207a6f`, `83be9d11`, `afea111c`, `13e213e0`; informação de `a7353aea`/`dd7cea3f`/`109f81f1`/`2fa679f1` (D4)
15. **chore(skills)** — regenerar `skills/**` + hashes de paridade (D5)
16. **chore(changeset+marcador)** — changeset `minor` do fork; `.upstream-sync.json` → `d0071d73` / `v1.11.0-1-gd0071d7` / histórico; tag `synced/upstream-v1.11.0`; recomputar hash do flake (D11)
17. **Validação** — `node build.js && pnpm lint && pnpm exec tsc --noEmit && pnpm test` + smokes (`init --tools zed,minimax-code,rovodev,command-code`, `init --language`, `show --diff`, `status --all`, `validate --archived`, `openspec` sem postinstall)

## 5. Adiados (acumulado)

- Subsistema stores/workspace beta (12 commits/hunks anteriores + `6b3623a3` + os de D1 acima)
- `website/**` Cloudflare, beta prerelease e agora `docs-lab/**` + `install.md` + skills de autoria de docs (D4)
- Adapters `zcode.ts`, `oh-my-pi.ts`, `trae.ts` (lacuna registrada em 2026-07-31)

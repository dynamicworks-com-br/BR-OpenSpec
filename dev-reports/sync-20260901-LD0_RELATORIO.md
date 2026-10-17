# Relatório — Lote LD0: Codex skills-only (`79f1dac6`, D20)

**Commit do fork:** `e0c50fd` — `feat(codex): portar Codex skills-only e aposentadoria dos custom prompts gerenciados do upstream (79f1dac6)`
**Branch:** `sync/upstream_20260901` · 26 arquivos, +1351/−297
**Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm exec vitest run` (paridade excluída) → **99 arquivos / 3211 testes passando**

---

## 0. D34 — isolamento de `CODEX_HOME` (primeiro passo, risco destrutivo)

Feito **antes** de qualquer execução de teste, em duas camadas:

1. **Setup global por arquivo de teste:** novo `vitest.env-setup.ts` (registrado em `vitest.config.ts` via `setupFiles`) cria um `mkdtemp` e aponta `process.env.CODEX_HOME` para ele em **todo** worker do Vitest, com limpeza no `exit`. Vale inclusive para arquivos de teste futuros que ninguém lembrar de isolar.
2. **Isolamento por arquivo (upstream + fork):** `process.env.CODEX_HOME = path.join(testDir, 'codex-home')` nos dois `beforeEach` de `test/core/init.test.ts` e no `beforeEach` de `test/core/legacy-cleanup.test.ts` (este último ganhou também `originalEnv`/restauração no `afterEach`, que não tinha).

**Verificação pós-suíte:** `~/.codex/prompts` do desenvolvedor continua com os 10 `opsx-*.md` que já estavam lá (timestamps `set 2 07:51`, anteriores à sessão) — nenhum arquivo removido nem criado pela suíte. Isso encerra também a poluição que o fork causava antes (o adapter global gravava prompts reais durante `init.test.ts`).

---

## 1. O que foi portado

### 1.1 Remoção do adapter de comandos do Codex
- `git rm src/core/command-generation/adapters/codex.ts`.
- Linha removida de `adapters/index.ts` e as duas linhas (import + `register`) de `registry.ts`.
- `command-generation/types.ts`: comentários de `getFilePath` e `GeneratedCommand.path` ("global-scoped prompts (e.g., Codex)" → "global-scoped command files").
- Efeito: `CommandAdapterRegistry.has('codex') === false`, `codex` sai de `getAll()`, `resolveCommandSurfaceCapability('codex') === 'skills-invocable'`.

### 1.2 `command-surface.ts`
Só a remoção do comentário de 3 linhas ("In this fork codex still registers one … currently unreachable"). O arquivo agora é **byte a byte idêntico** a `upstream/main:src/core/command-surface.ts` (verificado com `diff`).

### 1.3 Ponte do Lote 0 desfeita (decisão do orquestrador: simplificar)
- `ToolCommandAdapter.getArtifactRoot?()` removido de `command-generation/types.ts`.
- `command-generation/artifact-path.ts` simplificado para delegar sempre a `FileSystemUtils.resolveProjectArtifactPath`; `resolveCommandArtifactPath(projectPath, _adapter, commandPath)` **mantido como wrapper**, então os 7 call-sites (init ×1, update ×4, tools-manager ×2) não foram tocados.
- Os 2 testes Codex de `test/core/tools-manager.test.ts` (`writes codex prompts to the global CODEX_HOME/prompts root`, `does not write through a codex prompt linked outside CODEX_HOME/prompts`) foram **substituídos** por um teste skills-only (`writes codex skills and no global prompts, even under commands delivery`). Para isso o mock de `global-config` do arquivo virou mutável (`vi.hoisted`), com reset no `afterEach`.

### 1.4 `legacy-cleanup.ts` (hunk grande — todos os hunks de src portados)
- Imports `os` e `type { WorkflowId }`.
- `LEGACY_GLOBAL_CODEX_WORKFLOWS` (allowlist nome→workflows) e `LEGACY_GLOBAL_SLASH_COMMAND_PATHS` (com `replacementLabel` vindo do catálogo).
- Interfaces `LegacyGlobalPromptPattern`/`LegacyGlobalPromptMatch`; helpers `getCodexPromptDir` (exportado, honra `CODEX_HOME`), `globToRegex`, `normalizePathForMatch`, `getManagedGlobalLegacyPromptMetadata`.
- `LegacyDetectionResult` ganha `globalSlashCommandFiles` (obrigatório) e `globalSlashCommandDetails?`.
- `detectLegacyArtifacts`: dedupe de `slashCommandFiles` (`[...new Set(...)]`), detecção global via `detectLegacyGlobalPromptFiles()`, `hasLegacyArtifacts` inclui os globais.
- `detectLegacySlashCommands`: `Object.values(...)` (variável não usada) + comentário cosmético removido; `findLegacySlashCommandFiles` passa a usar `globToRegex`.
- `CleanupResult.deletedFileReplacementLabels?`; `cleanupLegacyArtifacts` ganha o bloco de exclusão dos prompts globais (revalidando cada caminho pela allowlist antes de apagar, e registrando erro para os não gerenciados).
- `formatCleanupSummary` usa `removedFileReplacedBy` quando há rótulo; `buildRemovalsList` lista os prompts globais; nova `formatDeferredGlobalPromptSummary`.
- `getToolsFromLegacyArtifacts` usa os helpers e acrescenta os tool ids dos prompts globais.
- Novas exportadas: `getLegacyGlobalPromptMatches`, `getLegacyWorkflowIdsForTool`, `omitGlobalLegacyPromptFiles`, `pickGlobalLegacyPromptFiles` (+ `hasLegacyArtifacts` privada, homônima do campo — mantida como no upstream para não divergir de `07dea6ed`).

### 1.5 `init.ts`
- Imports novos (`formatDeferredGlobalPromptSummary`, `getLegacyGlobalPromptMatches`, `omitGlobalLegacyPromptFiles`, `pickGlobalLegacyPromptFiles`, `scanInstalledWorkflows as scanInstalledWorkflowsShared`, `shouldReconcileCommandFilesForTool`, `shouldRemoveSkillsForTool`).
- Tipo `DeferredLegacyCleanup`; `execute` guarda o retorno de `handleLegacyCleanup` e chama `finalizeDeferredLegacyCleanup` **depois** de `generateSkillsAndCommands` e **antes** de `createConfig`.
- `handleLegacyCleanup` devolve `DeferredLegacyCleanup | null`, imprime o resumo imediato **só se não vazio** (adotada a guarda do upstream — o fork imprimia `console.log()` incondicional) e o bloco adiado logo em seguida; nos dois caminhos chama `performImmediateLegacyCleanup`.
- Novos privados `performImmediateLegacyCleanup`, `finalizeDeferredLegacyCleanup`, `getInstalledWorkflowsForTool`.
- `generateSkillsAndCommands`: predicados por ferramenta, `skillsInvocableCommandSkips`, `shouldRemoveSkillsForTool`/`shouldReconcileCommandFilesForTool` no lugar das negações globais.
- `displaySuccessMessage`: `skillCount`/`commandCount` passam a refletir se **alguma** ferramenta bem-sucedida gera skills/comandos; nova linha `commandsSkippedUsesSkills`.

### 1.6 `update.ts`
- Tipo `LegacyUpgradeResult` (`newlyConfiguredTools`, `workflowOverrides`, `deferredGlobalCleanup?`).
- `execute`: flags globais removidas; limpeza adiada chamada nos **dois** retornos antecipados (bloco "nenhuma ferramenta configurada", antes do ramo `declinedMigrations` do fork; e bloco "tudo atualizado", cuja condição ganhou `&& newlyConfiguredTools.length === 0`) e depois do loop; novo ramo `noAdditionalRefreshAfterLegacy`; `toolWorkflows`/`skillTemplates`/`commandContents` por ferramenta dentro do loop; `skillsInvocableCommandSkips` no resumo.
- `handleLegacyCleanup`: ordem **invertida** para upgrade → limpeza imediata → (pós-refresh) limpeza global adiada, conforme `07dea6ed` exige; resumos imediato/adiado impressos separadamente.
- Novos privados `performImmediateLegacyCleanup` e `performDeferredGlobalPromptCleanup` (usa o wrapper já existente `scanInstalledWorkflows(projectPath, ['codex'])`).
- `upgradeLegacyTools`: retorno tipado, `inferredCodexWorkflows = getLegacyWorkflowIdsForTool(detection, 'codex')`, `workflowOverrides.codex`, templates por ferramenta.

### 1.7 `profile-sync-drift.ts`
Predicados por ferramenta nos 5 pontos: `shouldGenerateSkillsForTool`/`shouldGenerateCommandsForTool` em `hasToolProfileOrDeliveryDrift`, `else if (shouldRemoveSkillsForTool(...))` no lugar do `else` (importante: `skills-invocable` sob `commands` **não** cai no ramo de remoção), `shouldReconcileCommandFilesForTool(...) && adapter`, e `includeSkills`/`includeCommands` calculados **dentro** do loop de `hasProjectConfigDrift`.

### 1.8 `tools-manager.ts` (fork-only, D23')
`addTool` passa a usar `shouldGenerateSkillsForTool`/`shouldGenerateCommandsForTool`, então `openspec tools add codex` sob `commands` escreve skills — coerente com `init`. `removeOpenSpecCommandFiles('codex')` devolve 0 (sem adapter), o que é o correto: prompts globais só saem pela limpeza legada adiada.

### 1.9 Comentários defasados corrigidos
`src/utils/command-references.ts` (L130–135), `src/core/shared/tool-detection.ts` (L125–127), `test/core/command-generation/invocation.test.ts`, `test/utils/command-references.test.ts`, `test/core/migration.test.ts`, `test/core/update.test.ts` — todos diziam que o fork ainda registrava um adapter para o Codex. Grep de verificação está vazio.

---

## 2. Strings adicionadas ao catálogo (11 chaves, PT-BR)

| Chave | Seção | Texto |
|---|---|---|
| `removedFileReplacedBy(file, replacement)` | `LEGACY_CLEANUP_MESSAGES` | `  ✓ Removido ${file} (substituído por ${replacement})` |
| `codexSkillsReplacementLabel` | `LEGACY_CLEANUP_MESSAGES` | `skills do Codex` |
| `skippedUnmanagedGlobalPrompt(file)` | `LEGACY_CLEANUP_MESSAGES` | `Prompt global não gerenciado ignorado: ${file}` |
| `deferredGlobalPromptsHeader` | `LEGACY_CLEANUP_MESSAGES` | `Limpeza adiada de prompts globais` |
| `deferredGlobalPromptsSubheader` | `LEGACY_CLEANUP_MESSAGES` | `Estes prompts globais só serão removidos depois que as skills substitutas correspondentes forem instaladas.` |
| `deferredGlobalPromptItem(toolLabel, promptPath)` | `LEGACY_CLEANUP_MESSAGES` | `  • ${toolLabel}${promptPath}` (centraliza o item; a forma `codex: <path>` é preservada) |
| `preservedDeferredGlobalPrompts` | `INIT_MESSAGES` **e** `UPDATE_MESSAGES` | `Prompts globais adiados preservados por falta de skills substitutas:` |
| `commandsSkippedUsesSkills(tools)` | `INIT_MESSAGES` **e** `UPDATE_MESSAGES` | `Comandos ignorados para: ${tools} (usa skills)` |
| `noAdditionalRefreshAfterLegacy` | `UPDATE_MESSAGES` | `Nenhuma atualização adicional necessária após a migração de legados.` |

Chaves reaproveitadas (sem duplicar): `failedToDeleteFile`, `removedFile`, `explanationReplacedBySkills`, `explanationReplacedByToolSkills`, `upgradeLegacyPrompt`, `initializationCancelled`, `skipPromptHint`, `forceLegacyHint`, `skippingLegacyCleanup`, `cleaningLegacy`, `legacyCleaned`.

Verificação: grep por strings EN residuais (`Deferred global prompts`, `Preserved deferred`, `uses skills`, `Skipped unmanaged`, `No additional refresh`, `replaced by `) em `legacy-cleanup.ts`/`init.ts`/`update.ts` → **vazio**.

---

## 3. Adaptação do fork mais relevante: `opsx-code-review.md`

O mapa do upstream tem **12** nomes; o fork tem **13 workflows** (`code-review` é exclusivo do BR-OpenSpec) e o adapter do fork **gerava** `opsx-code-review.md`. Sem a entrada, esse arquivo ficaria órfão para sempre no diretório global. Adicionado `'opsx-code-review.md': ['code-review']` entre `opsx-verify.md` e `opsx-onboard.md`, com cobertura em dois testes (detecção + asserções no `describe('LEGACY_GLOBAL_SLASH_COMMAND_PATHS')`).

---

## 4. Testes portados / adaptados

| Arquivo | O que foi feito |
|---|---|
| `test/core/command-generation/adapters.test.ts` | Removidos `import os`, `import { codexAdapter }`, o `describe('codexAdapter')` inteiro (6 testes) e `codexAdapter` do array de invariantes. **Aplicado cru.** |
| `test/core/command-generation/registry.test.ts` | `+ it('should return undefined for Codex')`, `expect(toolIds).not.toContain('codex')`, `expect(has('codex')).toBe(false)`, novo `describe('command surface capabilities')`. Cases `windsurf`/`zcode`/`kimi` do upstream pulados (não existem no fork). |
| `test/core/command-generation/invocation.test.ts` | `'codex'` movido para a lista de "tools with no command adapter"; removido das listas de rewrite flat e de formatters; comentários defasados reescritos. (Não tocado pelo upstream — divergência do fork.) |
| `test/utils/command-references.test.ts` | `getTransformerForTool('codex', 'skills', 'skills-invocable', undefined)`; `'codex'` fora da lista flat; **novo** `it('selects $-prefixed skill references for Codex under every delivery mode')`. |
| `test/core/legacy-cleanup.test.ts` | Isolamento de `CODEX_HOME`; `globalSlashCommandFiles: []` nos **23** literais de detecção; 9 testes novos (1 deles fork-only: `should detect the fork-only opsx-code-review.md global prompt`); invariante renomeado para `'should only include legacy tool IDs with a command surface capability'`; `describe('LEGACY_GLOBAL_SLASH_COMMAND_PATHS')` com as asserções do `code-review`. **100 testes passando.** |
| `test/core/init.test.ts` | Isolamento de `CODEX_HOME` nos 2 `beforeEach`; `it.each(['both','skills','commands'])('should create Codex skills and no global prompts when delivery=%s')`; 3 testes de limpeza legada global (remove/preserva/adia mensagens). **68 testes passando.** |
| `test/core/update.test.ts` | 4 testes em `legacy cleanup` + 3 em `legacy tool upgrade` (incl. `it.each` das 3 entregas); **correção obrigatória** do teste "adapterless tool" para `resolveCommandSurfaceCapability(tool.value) === 'none'` (sem isso ele escolheria `codex`, 7ª entrada de `AI_TOOLS`, e falharia). **91 testes passando.** |
| `test/core/tools-manager.test.ts` | 2 testes Codex do Lote 0 substituídos por 1 teste skills-only; mock de config tornado mutável. **27 testes passando.** |
| `test/core/profile-sync-drift.test.ts` | 2 testes novos (opcionais, fora do upstream): Codex com skills sob `commands` **não** é drift; Codex sem skills **é**. |
| `test/core/migration.test.ts` | Só comentários defasados. |
| `test/cli-e2e/basic.test.ts` | Sem mudança (já passa `CODEX_HOME`). |

---

## 5. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.gitignore` (`# Cursor` / `.cursor/`) | Carona no PR, sem relação com Codex; layout do `.gitignore` do fork é próprio. |
| `openspec/changes/make-codex-skills-only/**` (proposal, tasks, 3 spec deltas) | D6/D21 — a change nunca foi arquivada no upstream, então `openspec/specs/**` **não muda neste commit**. Pendência acoplada em §7. |
| `.changeset/*.md` | D3. |
| `src/core/command-surface.ts` como arquivo novo | Já existia no fork na forma do tip (com `resolveCommandInvocation`, que `79f1dac6` ainda não tem); recriá-lo pela versão de `79f1dac6` quebraria `init`/`update`/`tools-manager`. |
| `init.test.ts` — `'should create both skills and commands for Trae with adapter'` | O fork não tem adapter Trae nem esse teste. |
| `init.test.ts` — `(originalWriteFile as any)(filePath, ...args)` | Cosmético; o fork usa `originalWriteFile.call(fs, …)` e funciona. |
| `update.test.ts` — `originalEnv`/`CODEX_HOME` no `beforeEach` | O fork já isolava `CODEX_HOME` com `originalCodexHome`; só o comentário foi atualizado. |
| `adapters.test.ts` — array com `ohMyPiAdapter`/`traeAdapter`/`zcodeAdapter` | Esses adapters não existem no fork (lacuna já registrada); só `codexAdapter` saiu do array do fork. |
| `registry.test.ts` — asserções `windsurf`/`zcode`/`kimi` de contexto | O fork usa `devin` e não tem `zcode`. |
| **Docs** (`commands`, `how-commands-work`, `migration-guide`, `supported-tools`, `troubleshooting`, `README`) | Instrução do orquestrador: ficam para o **lote G**. Deltas em §6. |

---

## 6. Deltas de docs pendentes para o lote G

O código já implementa o comportamento; a prosa dos docs ainda descreve o mundo anterior. Manter `.codex/skills` (o `59bfb27a`/G-14 troca para `.agents/skills`) e "OpenSpec" → "BR-OpenSpec".

| Arquivo | Linha (EN / pt-BR) | Delta |
|---|---|---|
| `docs/commands.md` | 699 / 695 | Na linha `.../opsx-<id>.*`: remover `, Codex (global prompts)` / `, Codex (prompts globais)`. |
| `docs/commands.md` | 703 / 699 | Linha `Codex skills` → `\| none — Codex CLI \| $openspec-propose \| Codex \|` (pt-BR: `nenhum — Codex CLI`). |
| `docs/how-commands-work.md` | 79 / 79 | Remover `, Codex (global prompts)` / `, Codex (prompts globais)`. |
| `docs/how-commands-work.md` | 83 / 83 | Idem linha `Codex skills` → `none — Codex CLI` / `nenhum — Codex CLI`. |
| `docs/how-commands-work.md` | 107 / 101 | Substituir a frase "Codex's command files live in the global Codex home (`$CODEX_HOME/prompts/`), not your project." por "Codex does not get generated command files; use `.codex/skills/openspec-*`." (pt-BR: "O Codex não recebe arquivos de comando gerados; use `.codex/skills/openspec-*`."). |
| `docs/how-commands-work.md` | ~117 / ~111 | Item "Confirming it's installed": acrescentar Codex à lista de ferramentas somente-skills. |
| `docs/migration-guide.md` | após a lista de legados (~L49), após "The `--force` flag skips prompts…" (~L157) e após "Skills are recognized across…" (~L410) | **3 parágrafos novos** (EN + pt-BR): (a) Codex usa `.codex/skills/openspec-*` e a limpeza só atinge a allowlist em `$CODEX_HOME/prompts`/`~/.codex/prompts`, e só após existirem as skills substitutas; (b) `--force` inclui essa limpeza allowlistada e preserva todos os outros arquivos; (c) Codex é somente skills no OPSX — o BR-OpenSpec não gera mais prompts personalizados. **Nenhuma das 3 âncoras existe hoje** (`grep -ic codex docs/migration-guide.md` → 0 em EN e pt-BR). |
| `docs/supported-tools.md` | após L10 | **Parágrafo novo**: "Codex é somente skills: o BR-OpenSpec instala `.codex/skills/openspec-*/SKILL.md` mesmo quando a entrega é `commands`, e não gera arquivos de prompt personalizados do Codex." |
| `docs/supported-tools.md` | 31 / 29 | Remover ` (including Codex's global prompts)` / ` (incluindo os prompts globais do Codex)`. |
| `docs/supported-tools.md` | 39 / 36 | "…`$openspec-propose` for a Codex skill." → "…and `$openspec-propose` in Codex." (pt-BR: "…e `$openspec-propose` no Codex."). |
| `docs/supported-tools.md` | 73 / 58 | Coluna de comandos do Codex: `$CODEX_HOME/prompts/opsx-<id>.md\*` → `Not generated (skills-only; use $openspec-*)` / `Não gerado (somente skills; use $openspec-*)`. |
| `docs/supported-tools.md` | 98 / 83 | **Remover** a nota de rodapé `\*` sobre os comandos do Codex no diretório global (e a linha em branco). |
| `docs/troubleshooting.md` | 62 / 62 | Item 6: incluir Codex na lista de ferramentas sem arquivos de comando `opsx-*`, acrescentar "Digite `$openspec-propose` no Codex" e **apagar** a frase "Codex's command files live in the global Codex home…" / "Os arquivos de comando do Codex ficam no diretório global do Codex…". |
| `docs/troubleshooting.md` | 176 / 176 | **Já correto** (chegou no overhaul de docs `3f79660`, antes do código) — manter. |
| `README.md` | 138 | "`/opsx-propose` (Cursor, GitHub Copilot, Codex prompts)" → "(Cursor, GitHub Copilot)"; "`$openspec-propose` (Codex skills)" → "(Codex)". `README.pt-BR.md` não tem esse parágrafo — nada a fazer. |
| `docs/installation.md` L54 / `docs/pt-BR/installation.md` L59 | — | **Manter**: a frase sobre `opsx-*.md` em `~/.codex/prompts` passa a ser **verdadeira** com este porte. |

Sem `docs/agent-contract.md` no fork (D7); `docs/cli.md` não menciona Codex.

---

## 7. Pendências / dúvidas abertas

1. **D21 (specs acopladas):** `79f1dac6` deixou os deltas em `openspec/changes/make-codex-skills-only/**`, que o upstream **nunca arquivou** — o tip ainda tem o cenário "Updating slash commands for Codex" em `openspec/specs/cli-update/spec.md` e a menção a prompts globais em `command-generation/spec.md`. Portanto `openspec/specs/**` do fork **também** continua descrevendo o Codex como adapter-backed, e agora diverge do código. Fica registrado como pendência acoplada (nada foi antecipado, conforme D6/D21).
2. **`.upstream-sync.json.deferred`:** não precisa listar `79f1dac6` (foi portado). Não editei o arquivo — deixo a critério do fechamento da sync.
3. **Impacto nos briefs seguintes** (o brief §6 já antecipava; confirmo que o estado é o esperado):
   - **LD-690a27e6 (D-6):** o teste `'should not report any file a current command adapter writes as a legacy artifact'` pode ser portado **na versão upstream** — `codex` já é o id legado sem adapter. Ignorar a adaptação "porque 79f1dac6 está adiado".
   - **LD-59bfb27a (D-6):** a "Opção A/limitação forma dupla só sob `skills`" e a mitigação **M2 deixam de existir**. Os hunks marcados "pular" naquele brief passam a ser portáveis; o `it.each` "no global prompts" e o teste `selects $-prefixed skill references for Codex under every delivery mode` **já existem** aqui com `.codex` — basta trocar o caminho para `.agents`.
   - **LD-07dea6ed (D-8):** as adaptações (a) `LegacyUpgradeResult` mínimo, (b) inversão upgrade→limpeza e (c) `omitToolLegacyArtifacts` viram **porte quase cru**; `omitGlobalLegacyPromptFiles`, `deferredGlobalCleanup` e o loop de `getLegacyGlobalPromptMatches` em `getToolsFromLegacyArtifacts` já estão presentes.
   - **LD-cf06d45f (D-9):** **reaplicar** o hunk que envolve `inferredCodexWorkflows` em `getProfileWorkflows('custom', …).filter(ALL_WORKFLOWS)` (para incluir `sync` quando `archive` é inferido) — o alvo agora existe em `update.ts` (`const inferredCodexWorkflows = getLegacyWorkflowIdsForTool(detection, 'codex');`), e o `it.each('should include sync when replacing legacy Codex %s')`.
   - **LD-109f81f1 / LD-f3aa167d (D-9):** as adaptações F1/F2/F3 (tratar `codex` como skills-native à mão, skip total no upgrade legado, excluir `codex` de `hasProjectLocalCommandSurface`/`hasLegacySkills`) são **desnecessárias e erradas** agora; F4 (`CODEX_HOME` no `beforeEach`) já está feito. `invocation.test.ts` L111–118 já corrigido aqui.
   - **LD-17581c11 (D-8):** sem impacto.
4. **`vitest.env-setup.ts` é arquivo novo** (D22 desaconselha arquivos novos). Justificativa: é a rede de segurança global exigida pelo D34, e o alternativo (confiar em cada `beforeEach`) já falhou historicamente — hoje há prompts reais em `~/.codex/prompts` deixados por execuções antigas da suíte. Se o orquestrador preferir, o conteúdo pode ser movido para `vitest.setup.ts`, mas note que aquele é `globalSetup` (processo separado) e **não** propaga `process.env` para os workers `forks`.
5. **`FileSystemUtils.assertPathWithin`** perdeu o call-site de `artifact-path.ts` mas continua usado em 10 outros lugares (`commands/change.ts`, `commands/spec.ts`, `utils/spec-discovery.ts`, `commands/workflow/templates.ts`) — nenhuma remoção necessária.
6. **`legacy-cleanup.ts` do fork ainda tem `'costrict'` como `directory` e `'junie'`** — corrigido por `690a27e6` (D-6). **Não antecipado** aqui, conforme o brief.

---

## 8. Smoke manual (§10 do brief) — conferido

```
CODEX_HOME=$d/ch openspec init --tools codex --force   # com opsx-explore.md, opsx-onboard.md, opsx-code-review.md, my-prompt.md
```
Saída observada (bate 1:1 com o esperado):
- `Limpeza adiada de prompts globais` + os 3 `codex: <path>` da allowlist (`my-prompt.md` nunca aparece);
- `✓ Removido …/opsx-explore.md (substituído por skills do Codex)`;
- `Prompts globais adiados preservados por falta de skills substitutas:` com `opsx-code-review.md` e `opsx-onboard.md` (o perfil `core` não instala esses workflows);
- `6 skills em .codex/` · `Comandos ignorados para: codex (usa skills)` · dica `$openspec-propose "sua ideia"`;
- `ls $d/ch/prompts` → `my-prompt.md opsx-code-review.md opsx-onboard.md`.

Segunda execução: o bloco adiado **reaparece** e os preservados continuam preservados ("re-offer", comportamento do upstream). Sob `delivery: commands` em projeto novo: 6 skills geradas, prompt global removido, `Comandos ignorados para: codex (usa skills)` — confirmando a mudança de comportamento central.

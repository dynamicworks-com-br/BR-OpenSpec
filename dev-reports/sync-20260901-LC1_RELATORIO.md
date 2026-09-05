# Lote LC1 — Templates de workflow lote 1

**Branch:** `sync/upstream_20260901`
**Commit:** `ac6531e98ab15ae1d5788895da81e0c680405165` — `fix(templates): portar correções de workflow templates do upstream v1.8.0 (lote 1)`
**Commits do upstream portados (nesta ordem):** `26bd1d4e`, `0b20ae39`, `f43fe0e7`, `afea111c` (parcial), `8a3850da`, `3d0701f8`

## 0. Auditoria do trabalho parcial pré-existente

O executor anterior deixou 16 arquivos modificados e não commitados. Auditei **hunk a hunk** contra os diffs reais dos 6 commits do upstream. Resultado:

- **Todos os 16 arquivos estavam corretos e completos** para a parte de `src/`, `schemas/` e `openspec/specs/`. Nada foi revertido nem refeito.
- As duas "lacunas" apontadas pelo orquestrador eram **falsos positivos**, porque no fork essas prosas vivem no catálogo central:
  - **(a) `src/core/templates/workflows/onboard.ts`** — no fork é só um wrapper de 29 linhas (`ONBOARD_TEMPLATE_MESSAGES`). O hunk de `3d0701f8` (definição de `<capability-path>`, `- \`<capability-path>\`: [breve descrição]`, `- \`<existing-capability-path>\`: [breve descrição]`) **já estava aplicado** em `src/messages/index.ts:1705-1733`. Nada a fazer no `onboard.ts`.
  - **(b) `src/core/validation/validator.ts`** — a linha que `3d0701f8` muda é `message: VALIDATOR_MESSAGES.rootLevelDeltaSpec` (`validator.ts:183`); a string **já estava atualizada** em `src/messages/index.ts:1175`. Idem `src/core/parsers/spec-structure.ts` → `SPEC_STRUCTURE_MESSAGES.deltaHeader` (`index.ts:2558`).
- **`isPlanningComplete`, `instruction-loader.ts` e `status.ts`** estavam completos e corretos.
- **Faltava tudo de teste** — foi o que este executor fez.

## 1. Portado (src / schemas / specs)

Estado já presente na árvore, revalidado contra o diff do upstream:

| Arquivo | Commits | O que entrou |
|---|---|---|
| `src/core/templates/workflows/sync-specs.ts` | 26bd1d4e, 3d0701f8 | Novo passo "Valide os specs principais atualizados" (renumerando 4→5); definição de `<capability-path>`; estreitamento por entradas completas de `existingOutputPaths` |
| `src/core/templates/workflows/update-change.ts` | 26bd1d4e, afea111c | Aviso de que `/opsx:continue` é opcional antes da 1ª menção; `openspec instructions "<artifact-id>"` entre aspas; fallback `openspec new change "<novo-nome-da-change>"`; `isPlanningComplete` no JSON documentado |
| `src/core/templates/workflows/propose.ts` | 0b20ae39, f43fe0e7, 3d0701f8 | "Fronteira de planejamento"; guardrail de não implementar; pergunta de ambiguidade; novo passo 2 "Determine o schema de workflow" + duas formas de `openspec new change`; `<capability-path>` |
| `src/core/templates/workflows/explore.ts` | 8a3850da, 3d0701f8 | Transição de captura em 4 passos (scaffold obrigatório, ordem de dependência, skips condicionais); guardrail "Não faça scaffold de changes manualmente"; tabela "Onde Capturar" com `<capability-path>` |
| `src/core/templates/workflows/continue-change.ts` | afea111c | `isPlanningComplete` (com legado `isComplete`); "Planejamento concluído!" em vez de "Todos os artifacts criados! … ou arquivá-la" |
| `src/core/templates/workflows/archive-change.ts` | 3d0701f8 | Definição de `<capability-path>` + `openspec/specs/<capability-path>/spec.md` |
| `src/core/templates/workflows/bulk-archive-change.ts` | 3d0701f8 | Mapa de conflitos chaveado por `<capability-path>`; exemplos `identity/user-auth` / `billing/user-auth`; resumo `add-jwt, identity/user-auth: …` |
| `src/commands/workflow/status.ts` | afea111c | `status.isPlanningComplete` + `WORKFLOW_MESSAGES.allPlanningArtifactsComplete` |
| `src/core/artifact-graph/instruction-loader.ts` | afea111c | Campo `isPlanningComplete` em `ChangeStatus` e em `formatChangeStatus`, com `isComplete` como alias |
| `src/messages/index.ts` | 3d0701f8, afea111c | ver §3 |
| `schemas/spec-driven/schema.yaml` | 3d0701f8 | `<capability-path>` nos artifacts `proposal` e `specs` (preservar caminho, não mover/renomear, não criar nível de domínio em layout plano) |
| `schemas/spec-driven/templates/proposal.md` | 3d0701f8 | `<capability-path>` / `<existing-capability-path>` nos comentários e bullets |
| `openspec/specs/cli-artifact-workflow/spec.md` | afea111c | Cenários de `status --json` com `isPlanningComplete` + alias |
| `openspec/specs/cli-validate/spec.md` | 3d0701f8 | `<capability-path>` |
| `openspec/specs/openspec-conventions/spec.md` | 3d0701f8 | `<capability-path>` (aplicado nas **duas** cópias da seção que o fork mantém) |
| `openspec/specs/specs-sync-skill/spec.md` | 3d0701f8 | `<capability-path>` + "preserving the delta's path relative to `specs/`" |

## 2. Adaptado (com motivo)

1. **`onboard.ts` / `validator.ts` / `spec-structure.ts` → catálogo.** O hunk de prosa foi aplicado em `ONBOARD_TEMPLATE_MESSAGES`, `VALIDATOR_MESSAGES.rootLevelDeltaSpec` e `SPEC_STRUCTURE_MESSAGES.deltaHeader`. Os arquivos `.ts` só consomem as chaves.
2. **`explore.ts` passo 3 usa `outputPath`, não `resolvedOutputPath`.** A interface `ArtifactInstructions` do fork (`instruction-loader.ts:60-70`) só expõe `outputPath`; `resolvedOutputPath` existe apenas em `ArtifactPathInfo` (usado por `status`). Referenciar o campo do upstream apontaria para um campo inexistente na saída de `openspec instructions`.
3. **`sync-specs.ts`**: `Run \`openspec validate --specs\` with the same selected-root flags used earlier` → `Execute \`openspec validate --specs\`.` — o fork não tem flags de root/store (D1).
4. **`propose.ts` passo 2, bullet "mostrar workflows"**: toda a resolução de root via `openspec context --json` / `--store` / `root.path` / `no_openspec_root` substituída por `execute \`openspec schemas --json\` a partir do diretório de trabalho atual` (D1, conforme brief LC-propose §4 item 10).
5. **`propose.ts` passo 3**: a frase `If a registered store is selected, append --store …` virou `Escolha uma das formas de schema abaixo.` (D1).
6. **`archive/bulk-archive/sync`**: `<planningHome.root>/openspec/specs/<capability-path>/spec.md` → `openspec/specs/<capability-path>/spec.md` (o fork não tem `planningHome`).
7. **D16 aplicado**: as linhas que `207f3cc5` volta a mexer já foram gravadas no estado final — `workflow opcional \`/opsx:new\`` (em vez de "expanded-profile"), placeholder `<novo-nome-da-change>`, `Se ele não estiver disponível, \`openspec status --change "<nome>" --json\` mostra o próximo artifact`; em explore: `Não faça scaffold de changes manualmente` e `Para uma change nova, faça o scaffold dela primeiro, conforme descrito abaixo.` **Os testes deste lote assertam essas strings finais**, não as do brief (que usava "perfil expandido").
8. **`afea111c` / `buildNextSteps`**: o hunk de `change-status-policy.ts` (mensagem "All planning artifacts are complete. Run openspec instructions apply …") não tem equivalente no fork — não existe `nextSteps` nem `actionContext`. Pulado (D1).

## 3. Strings adicionadas/atualizadas no catálogo (`src/messages/index.ts`)

**Adicionada:**
- `WORKFLOW_MESSAGES.allPlanningArtifactsComplete` = `'Todos os artefatos de planejamento concluídos!'`

**Atualizadas (mesma chave, texto novo):**
- `VALIDATOR_MESSAGES.rootLevelDeltaSpec` — `specs/<capability>` → `sob um caminho de capability (ex.: specs/<capability-path>/spec.md)`
- `SPEC_STRUCTURE_MESSAGES.deltaHeader` — `.../specs/<capability>/spec.md` → `.../specs/<capability-path>/spec.md`
- `ONBOARD_TEMPLATE_MESSAGES.instructions` — parágrafo de definição de `<capability-path>`, bullets `- \`<capability-path>\`` / `- \`<existing-capability-path>\``, e normalização de `<nome-capability>` → `<capability-path>` nas linhas de `mkdir`/`New-Item`/"Salve em" (essas três são extensões só do fork, coerência interna)

**Mantida sem remoção:** `WORKFLOW_MESSAGES.allArtifactsComplete` (ficou sem consumidor, mas a regra do fork proíbe remover chaves).

## 4. Testes portados / adaptados

Todos com asserções traduzidas para a prosa PT-BR; **nenhuma lógica de teste existente foi alterada**.

| Arquivo | Commit | Mudança |
|---|---|---|
| `test/core/templates/update-change.test.ts` | 26bd1d4e | Needle `openspec instructions "<artifact-id>" …`; novo `it('explains the optional continue workflow before suggesting it')`; `confirms every edit…` ampliado com o gate de disponibilidade de `/opsx:new` e `openspec new change "<novo-nome-da-change>"` |
| `test/core/templates/propose.test.ts` | 0b20ae39, f43fe0e7 | Novos imports (`generateSkillContent`, `getCommandContents`, `CommandAdapterRegistry`, `generateCommand`, `formatCommandInvocation`, `getInvocationForAdapter`); `proposeBodies` passa a usar `generateSkillContent(…, 'TEST')` para o skill; `artifactPreamble` com o marcador novo; **novo `describe('propose implementation boundary')` (5 `it`)** e **novo `describe('propose schema selection')` (2 `it`)`; comentário do "titles the create step…" atualizado |
| `test/core/templates/explore.test.ts` | 8a3850da, 3d0701f8 | Helpers `newChangeTransition` / `occurrenceCount`; 6 `it` portados + 1 substituto fork-specific + 3 `it` extras (tabela `<capability-path>`, guardrail de scaffold, parágrafo IMPORTANT) |
| `test/core/init.test.ts` | 26bd1d4e, 0b20ae39 | `should generate safe Claude workflow guidance (#1493)` (metade sem store) e `should deliver the propose boundary to tools named in the linked reports` (com `CODEX_HOME` isolado em `testDir`, para não escrever em `~/.codex`) |
| `test/commands/artifact-workflow.test.ts` | afea111c | `isPlanningComplete` no JSON; `shows complete status…` renomeado para `shows planning completion when all artifacts exist` (+ `not.toContain` da mensagem antiga); 2 testes novos (planejamento vs. implementação; artifacts `skipped` contam como completos sem serem criados) |
| `test/core/artifact-graph/instruction-loader.test.ts` | afea111c, 3d0701f8 | `isPlanningComplete` em 2 testes; renome de `should report isComplete true when all done`; novo teste de `skip_specs`; template de proposal pinado em `specs/<capability-path>/spec.md` |
| `test/core/artifact-graph/workflow.integration.test.ts` | 3d0701f8 | Novo `preserves existing flat or nested capability organization in its instructions (#1459)` |
| `test/core/validation.test.ts` | 3d0701f8 | Duas asserções `some(...)` viram `find(...)` + `toContain('specs/<capability-path>/spec.md')` |
| `test/core/templates/skill-templates-parity.test.ts` | 26bd1d4e, afea111c, 3d0701f8 | **4 `it` comportamentais novos** (ver abaixo). **O mapa `EXPECTED_FUNCTION_HASHES` e `EXPECTED_GENERATED_SKILL_CONTENT_HASHES` NÃO foi tocado (D5).** |

`it()` novos no teste de paridade:
- `validates synced main specs before reporting success` (26bd1d4e; sem a cláusula `same selected-root flags`)
- `does not suggest archiving when only planning is complete` (afea111c)
- `preserves nested capability paths in spec-aware workflow guidance (#1459)` (3d0701f8; 12 templates, com destinos adaptados ao fork sem `planningHome.root`)
- `narrows the sync set by complete existingOutputPaths entries (#1459)` (3d0701f8; pin fork-local do trecho que o upstream alterou dentro de um teste que o fork não tem)

**Adaptação fork-specific em `explore.test.ts`:** o teste upstream `retains the selected store throughout the capture transition` foi **substituído** por `does not mention --store while the stores subsystem is deferred (fork)`, que asserta `not.toContain('--store')` no corpo inteiro — impede que um porte futuro traga a cláusula sem a flag.

## 5. Pulado (com motivo)

| Hunk / arquivo | Motivo |
|---|---|
| `src/core/templates/workflows/store-selection.ts` (26bd1d4e) | Arquivo não existe no fork — subsistema de stores adiado (D1) |
| `src/core/change-status-policy.ts` (afea111c) | Arquivo não existe no fork (D1). O fork não tem `nextSteps`/`actionContext` |
| `test/cli-e2e/store-lifecycle.test.ts` (afea111c) | Teste de stores (D1) |
| `test/commands/context.test.ts` (f43fe0e7) | O fork não tem o comando `openspec context` (D1) |
| Assertions de `nextSteps[0]` em `artifact-workflow.test.ts` (afea111c) | Campo inexistente no fork; substituídas por `instructions apply --json` (`state`, `progress.remaining`) |
| `it('keeps a selected store on every applicable workflow command')` no parity (26bd1d4e) | Depende de `STORE_SELECTION_GUIDANCE` (D1) |
| Mapas de hash do parity + `test/core/templates/skillssh-parity.test.ts` | D5 — regenerados no fechamento (`pnpm generate:skills` + `pnpm regen:parity-hashes`) |
| `skills/**` | D5 |
| `.changeset/*`, `CHANGELOG`, `website/**`, `docs-lab/**`, `openspec/changes/**` | Regra do fork |

## 6. Hunks de docs pendentes para o lote G (docs)

| Arquivo upstream | Commit | Conteúdo |
|---|---|---|
| `docs/agent-contract.md` §4.4 (`status --json`) | afea111c | Acrescentar `isPlanningComplete` ao contrato JSON + parágrafo "`isPlanningComplete` means every non-skipped planning artifact exists … `isComplete` is retained as a compatibility alias with the same value." |
| `docs/cli.md` (bloco de exemplo de `status --json` + parágrafo seguinte) | afea111c | `+ "isPlanningComplete": false,` no exemplo e o parágrafo explicativo de 4 linhas |
| `docs/opsx.md` | 3d0701f8 | `│  • Create specs/<capability>/spec.md    │` → `│  • Create delta spec files              │` |
| `docs/troubleshooting.md` | 3d0701f8 | `openspec/specs/<capability>/spec.md` → `openspec/specs/<capability-path>/spec.md`, `back into the delta, preserving any domain directories in the path` |
| `docs/writing-specs.md` | 3d0701f8 | `openspec/specs/<capability-path>/spec.md` + frase nova definindo `<capability-path>` (flat vs. domínio) |

Aplicar nos **dois** espelhos: `docs/` (EN) e `docs/pt-BR/` (PT-BR).

## 7. Validação

```
pnpm exec tsc --noEmit                      → OK
node build.js                               → OK (Version 6.0.3)
pnpm exec vitest run --exclude …parity…     → 98 arquivos / 3211 testes, 0 falhas
node dist/index.js validate --specs         → 36 aprovados, 0 reprovados
```

Baseline antes deste lote: 98 arquivos / 3187 testes. **+24 testes.**

`test/core/templates/skill-templates-parity.test.ts` isolado: **7 de 9 passam**; falham apenas os 2 testes de hash (`preserves all template function payloads exactly`, `preserves generated skill file content exactly`) — esperado até a regeneração D5. Os 4 `it` comportamentais novos passam.

## 8. Dúvidas / pendências abertas

1. **`WORKFLOW_MESSAGES.allArtifactsComplete` ficou órfã.** Mantida por causa da regra "nunca remova chaves". Se o fechamento da sync quiser fazer uma limpeza de chaves não usadas, esta é candidata — mas fora do escopo deste lote.
2. **`explore.ts` usa `outputPath` onde o upstream usa `resolvedOutputPath`.** Quando o commit do upstream que adiciona `resolvedOutputPath` à saída de `openspec instructions` for portado (não está neste intervalo de lotes), alinhar essa linha e a asserção correspondente no `explore.test.ts`.
3. **`docs/pt-BR/`** não foi tocado (lote G), então há divergência temporária entre a prosa dos templates (já PT-BR nova) e os docs.
4. **Codex escreve fora do projeto.** O teste novo de init isola `CODEX_HOME` em `testDir`; outros testes de init que usam `--tools all` **não** isolam e podem tocar `~/.codex/prompts`. Pré-existente, não corrigido aqui — vale reportar ao lote de infra/testes.
5. **Brief vs. D16.** O brief `LC-26bd1d4e.md` §5.1/§5.2 propõe as needles `"workflow do perfil expandido"`; segui a instrução D16 do orquestrador (`"workflow opcional"`), que é o estado final pós-`207f3cc5` já gravado nos templates pelo executor anterior. Os testes assertam o texto real em disco.

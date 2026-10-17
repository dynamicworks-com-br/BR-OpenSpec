# Relatório do lote LB1 — Validate: SHALL/MUST como aviso, numeração de tasks, cenários nível 4

**Branch:** `sync/upstream_20260901` · **Commit:** `0fc1a51e24f0558c5bc7a5c04a546b48cac192be`
`fix(validate): portar SHALL/MUST como aviso, numeração ambígua de tasks e contagem de cenários do upstream v1.8.0–v1.9.0`

**Commits do upstream portados (ordem):** `ece8660d` → `e50bd098` → `c751b3da` — todos integralmente (nenhum parcial).
**Decisões aplicadas:** D3 (changesets pulados), D9 (SHALL/MUST → WARNING), D21 (spec principal do upstream portada verbatim), D24 (docs para o lote G), D32 (opção B — `projectRootOverride`).

**Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm lint` OK · `vitest --exclude skill-templates-parity`: 97 arquivos / 3123 testes → 96 arquivos / 3122 testes passando; **1 falha pré-existente** em `test/core/templates/skillssh-parity.test.ts` ("keeps committed skills/ in sync with the workflow templates") — mesma classe do teste de paridade (D5): o lote anterior `5e522a0` alterou `src/core/templates/workflows/` depois da última regeneração `e614355`; este lote não toca templates/schemas/skills (`git diff HEAD -- src/core/templates schemas skills` vazio).

---

## 1. `ece8660d` — fix(validate): allow non-English requirements (#1502) — D9

### Portado
| Arquivo do fork | O quê |
|---|---|
| `src/core/validation/validator.ts` | H1 JSDoc de `validateChangeDeltaSpecs`; H2/H3 ramo `else if (!containsShallOrMust(requirementText))` em ADDED/MODIFIED → `level: 'WARNING'` com `guidanceOnly=true`; H4 `applySpecRules`: `if (!requirementText)` → ERROR (sem sufixo) / `else if` → WARNING (guidance); comentário atualizado (#1156, #243). |
| `src/messages/index.ts` | `VALIDATOR_MESSAGES.missingShallOrMustAdded/Modified/Requirement` ganham 3º parâmetro `guidanceOnly = false` (assinaturas anteriores preservadas). Helper local não exportado `missingShallOrMust(prefix, keywordInHeader, guidanceOnly)` + const `MISSING_SHALL_OR_MUST_GUIDANCE_SUFFIX` garantem frase acionável byte-idêntica entre spec principal e delta. |
| `openspec/specs/cli-validate/spec.md` | Nova `### Requirement: Normative keyword guidance SHALL not require English` (4 cenários) + remoção da linha em branco final — `git apply` limpo, verbatim (`git diff ece8660d -- <spec>` vazio). |
| `test/core/validation.test.ts` | T1–T13 do brief (renomes, ERROR→WARNING, `'deve conter'`→`'deveria conter'`, novo `it.each` "missing requirement text" com `'está sem texto de requisito'`, novo teste CJK, `ACTIONABLE_SENTENCE` com sufixo, asserções de `summary.errors/warnings`). |
| `test/core/archive.test.ts` | `'sets exit code 1 when delta spec validation fails'`: fixture sem corpo (removida a linha `The system will log all events.`), comentário atualizado. |
| `test/cli-e2e/validate-international.test.ts` (novo) | Copiado do upstream; 5 asserções de string adaptadas: `Especificação`, `é válida`, `deveria conter SHALL ou MUST` (×3), `tem problemas`. |

### Adaptado (diverge do upstream de propósito)
- O upstream monta a mensagem em `Validator.buildMissingShallOrMustMessage`; no fork isso vive no catálogo (i18n). Não recriei o helper no validator.
- **Sufixo** (semântica do fork ≠ upstream): upstream `(RFC 2119 best practice for English specs)` → fork ` (boa prática RFC 2119; use as palavras-chave normativas em inglês)`. Motivo: no fork as palavras-chave normativas continuam em inglês mesmo em specs PT-BR (termos reservados; D9 "continua recomendando"); traduzir "for English specs" literalmente sugeriria que specs em português estão dispensadas. Justificativa registrada no JSDoc do catálogo.
- Verbo: "must" → "deve" (ERROR, já existia) / "should" → "deveria" (WARNING, novo). As asserções antigas `'deve conter'` não casam com a variante guidance — espelha `must contain`/`should contain` do upstream.
- **Extra do fork** (sugerido como opcional pelo brief §5.1): teste `'allows Portuguese requirement text in normal mode and warns about the reserved keywords'` em `validation.test.ts` (fixture PT-BR "O sistema deve registrar…" → WARNING, válido em modo normal, inválido em `--strict`). Documenta o caso de uso real do fork.

### Efeito colateral (igual ao upstream)
`openspec archive` usa `new Validator()` não-strict → alteração cujo requisito não tem SHALL/MUST **passa a arquivar** (aviso impresso, não bloqueia). Requisito sem corpo continua bloqueando.

---

## 2. `e50bd098` — fix(validate): warn on ambiguous task numbering (#1523)

### Portado
| Arquivo do fork | O quê |
|---|---|
| `src/core/validation/task-numbering.ts` (novo) | Cópia do upstream; regexes idênticas; as 2 mensagens + 2 fragmentos vão para `TASK_NUMBERING_MESSAGES`. |
| `src/core/validation/validator.ts` | Imports (`resolveSchemaForChange`, `resolveTaskFilesForChange`, `findTaskNumberingIssues`, `getPackageSchemasDir`/`getSchemaDir`); JSDoc + opção `projectRoot?: string`; chamada `collectTaskNumberingIssues` antes do `createReport` final; novo método privado (idêntico ao upstream — compila sem adaptação graças à opção B). |
| `src/utils/task-progress.ts` | `export function resolveTaskFilesForChange(changeDir, projectRoot)`; `getTaskProgressForChange` refatorado para usá-lo (hunk upstream via `git apply`); `resolveTrackedTasksGlob` passa `projectRoot` a `resolveSchemaForChange` (contexto agora idêntico ao upstream). |
| `src/utils/change-metadata.ts` | **Opção B (D32):** `resolveSchemaForChange(changeDir, explicitSchema?, projectRootOverride?, options = {})`; `projectRoot = projectRootOverride ?? path.resolve(changeDir, '../../..')`; JSDoc do novo parâmetro. |
| `src/core/artifact-graph/instruction-loader.ts` | Único outro chamador com 3º argumento: `resolveSchemaForChange(changeDir, schemaName, projectRoot, { projectConfig })` (igual ao upstream/main). |
| `src/commands/validate.ts` | 2 call-sites (`validateByType` e `runBulkValidation`) recebem `projectRoot: process.cwd()`. |
| `src/commands/change.ts` | `projectRoot: path.dirname(path.dirname(changesPath))` (hunk upstream via `git apply`). |
| `src/messages/index.ts` | Nova seção `TASK_NUMBERING_MESSAGES` entre `VALIDATOR_MESSAGES` e `WORKFLOW_MESSAGES`. |
| `test/core/task-numbering.test.ts` (novo) | 6 testes; as 2 asserções de igualdade exata usam `TASK_NUMBERING_MESSAGES.duplicateTaskId(...)` + `firstDeclaredOnLine`/`firstDeclaredInFileOnLine`. |
| `test/cli-e2e/validate-task-numbering.test.ts` (novo) | 6 testes; 4 asserções adaptadas: `/11\.1.*duplicad/i`, `"Alteração 'valid-numbering' é válida"`, `'Tarefa "10.7" está sob o grupo 11'`, `'ID de tarefa "11.1" está duplicado'`. |

### Adaptado
- `projectRoot: root.path` (upstream, stores) → `process.cwd()` (fork sem `resolveRootForCommand`/`ResolvedOpenSpecRoot`). Nenhum `root`/`--store` introduzido.
- Não apliquei a mitigação opcional `XDG_DATA_HOME` no e2e (paridade com o upstream). Risco R7 do brief permanece: um override de usuário de `spec-driven` na máquina desliga o check por design.

### Comportamento
`openspec archive` chama `validateChangeDeltaSpecs(changeDir)` sem opções → **não** afetado (confirmado: `src/core/archive.ts:1130`). Smoke manual: `validate bad --strict` → exit 1 com `⚠ [WARNING] tasks.md: Tarefa "10.7" está sob o grupo 11…` e `ID de tarefa "11.1" está duplicado; foi declarado pela primeira vez na linha 8.`; sem `--strict` → `Alteração 'bad' é válida`, exit 0; `change validate bad --strict` → mesmas mensagens em stderr.

---

## 3. `c751b3da` — fix(validate): count every level-4 header as a scenario in the loss guard (#1521)

### Portado (tudo via `git apply` limpo)
| Arquivo do fork | O quê |
|---|---|
| `src/core/parsers/requirement-text.ts` | `export const SCENARIO_HEADER`; docstring atualizado. |
| `src/core/parsers/requirement-blocks.ts` | Import de `SCENARIO_HEADER`; novos `scenarioHeaderAt`/`scenarioNameAt` (paridade por construção, `[ \t]` e não `\s` no fechamento ATX); `parseScenarioBlocks` reescrito. Nenhum literal `/^####\s*Scenario:/` restante. |
| `test/core/parsers/requirement-blocks.test.ts` | Import ampliado + `describe('findMissingCurrentScenarios: level-4 header parity')` com 7 casos. |
| `test/core/validation.scenario-loss.test.ts` | 2 casos de integração (validate + archive), sem adaptação de string (usam o helper `lossIssue` já PT-BR e nomes de cenário entre aspas). |

### Strings: nenhuma nova. `VALIDATOR_MESSAGES.modifiedOmitsCurrentScenarios` e `SPECS_APPLY_MESSAGES.modifiedFailedMissingScenarios` já existiam e continuam iguais (só passam a disparar também para cenários sem rótulo `Scenario:`).

---

## 4. Strings adicionadas/alteradas no catálogo (`src/messages/index.ts`)

**Novas (4) — seção `TASK_NUMBERING_MESSAGES`:**
- `taskGroupMismatch(id, currentGroup, taskGroup)` → `Tarefa "<id>" está sob o grupo <cur>, mas seu número inicial aponta para o grupo <tg>. Mova-a para o grupo <tg> ou renumere-a.`
- `duplicateTaskId(id, firstDeclaration)` → `ID de tarefa "<id>" está duplicado; foi declarado pela primeira vez <firstDeclaration>.`
- `firstDeclaredOnLine(line)` → `na linha <n>`
- `firstDeclaredInFileOnLine(filePath, line)` → `em <path> na linha <n>`

**Alteradas (3, assinaturas preservadas + parâmetro opcional):** `VALIDATOR_MESSAGES.missingShallOrMustAdded/Modified/Requirement(name, keywordInHeader = false, guidanceOnly = false)`. Com `guidanceOnly`: "deveria conter SHALL ou MUST" + sufixo ` (boa prática RFC 2119; use as palavras-chave normativas em inglês)` (anexado após o ponto final da frase do hint, como no upstream). Sem `guidanceOnly`: comportamento anterior byte a byte.

**Helpers internos (não exportados):** `MISSING_SHALL_OR_MUST_GUIDANCE_SUFFIX`, `missingShallOrMust()`.

---

## 5. Testes

- **Portados/adaptados:** `test/core/validation.test.ts` (13 hunks + 1 extra PT-BR), `test/core/archive.test.ts` (1 hunk), `test/core/parsers/requirement-blocks.test.ts` (+7), `test/core/validation.scenario-loss.test.ts` (+2).
- **Novos:** `test/cli-e2e/validate-international.test.ts` (2), `test/core/task-numbering.test.ts` (6), `test/cli-e2e/validate-task-numbering.test.ts` (6).
- **Pulados:** nenhum (nenhum dos três commits tem testes de stores).
- **Regressão verificada:** `test/utils/change-metadata.test.ts` (25) e `test/utils/task-progress.test.ts` (17) verdes após a opção B; `test/commands/validate.test.ts`, `archive.test.ts` (207), `specs-apply.salvage.test.ts` verdes.

---

## 6. Hunks pulados

| Hunk | Motivo |
|---|---|
| `.changeset/allow-non-english-requirements.md` (ece8660d) | D3 |
| `.changeset/fix-scenario-loss-parity.md` (c751b3da) | D3 (texto PT-BR sugerido para o changeset do fork está em LB-c751b3da §4) |

`e50bd098` não tem changeset. Nenhum dos três commits toca `website/`, `docs-lab/`, `openspec/changes/`, `skills/`, `CHANGELOG.md`, `docs/` ou `schemas/`.

---

## 7. Docs pendentes para o lote G

Nenhum dos três commits altera `docs/`. Pendências decorrentes de D9/D24 (não são hunks do upstream, são consequência do porte):

1. `README.md` (~L222) — "Translating these keywords breaks `openspec validate`." → nuance: marcadores estruturais quebram o parsing; omitir SHALL/MUST no corpo gera WARNING (erro com `--strict`).
2. `AGENTS.md` (~L272, "Reserved English Terms") — mesma nuance.
3. `src/messages/index.ts` cabeçalho (L25-26) — "Traduzir esses termos quebra o parsing/validação dos specs." → idem. (Deixei intocado por D24; o JSDoc novo do helper já explica a política.)
4. Opcional: `docs/cli.md` / `docs/pt-BR/cli.md`, linha `--strict` da tabela de `validate` — "(warnings viram falha, ex.: requisito sem SHALL/MUST; numeração ambígua de tasks)".
5. Opcional: `docs/troubleshooting.md` / `docs/pt-BR/troubleshooting.md` (nota sobre `omite cenário(s)`) — "qualquer cabeçalho `####` dentro do requisito conta como cenário".

---

## 8. Correções ao brief / observações

- LB-ece8660d §2 dizia que o fork tem `containsShallOrMust` como método; confirmado — nada a corrigir. As linhas citadas nos briefs estavam defasadas (lotes anteriores deslocaram o catálogo em ~90 linhas e o `archive.test.ts` em ~800); ancorei por conteúdo, como recomendado.
- LB-c751b3da §5.4 citava 18 casos existentes em `validation.scenario-loss.test.ts`; o fork tinha 17 (agora 19). Sem impacto.
- `zsh`: `PIPESTATUS` não existe (é `pipestatus`); irrelevante para o resultado, só para o log.

## 9. Dúvidas abertas

1. **`test/core/templates/skillssh-parity.test.ts`** falha desde `5e522a0` (lote de archive) — mesma classe do `skill-templates-parity.test.ts`. Sugestão ao orquestrador: excluí-lo também da validação padrão entre lotes (`--exclude test/core/templates/skill-templates-parity.test.ts --exclude test/core/templates/skillssh-parity.test.ts`) e regenerar no `chore(skills)` final (D5).
2. Escolha do sufixo PT-BR: usei a forma curta ` (boa prática RFC 2119; use as palavras-chave normativas em inglês)` em vez da longa proposta em LB-ece8660d §4. Se o orquestrador preferir a longa, basta trocar `MISSING_SHALL_OR_MUST_GUIDANCE_SUFFIX` e `ACTIONABLE_SENTENCE` no teste (a asserção `toContain('boa prática RFC 2119')` cobre ambas).

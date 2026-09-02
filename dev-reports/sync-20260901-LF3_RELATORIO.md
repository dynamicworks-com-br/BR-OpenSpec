# Relatório LF3 — Flags novas do CLI: `validate --archived`, `status --all`, `show --diff`

- **Branch:** `sync/upstream_20260901`
- **Commit do lote:** `6455581` — `feat(cli): portar validate --archived, status --all e show --diff do upstream v1.9.0–v1.11.0`
- **Commits do upstream portados (nesta ordem):** `83be9d11`, `a7353aea`, `dd7cea3f`
- **Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm lint` OK · `pnpm exec vitest run --exclude …skill-templates-parity… --exclude …skillssh-parity…` → **115 arquivos / 3657 testes passando**

---

## 1. `83be9d11` — `feat(validate): add --archived to lint task completion of archived changes (#1604)`

Portabilidade: **FULL com adaptação mecânica** (`root`/`ResolvedOpenSpecRoot`/`toRootOutput` → `process.cwd()`; sem `--store`).

### `src/utils/task-progress.ts`
- Novo `export type SchemaGlobCache = Map<string, string | undefined>`.
- `resolveTrackedTasksGlob(changeDir, projectRoot, schemaGlobCache?)` consulta/preenche o memo pelo `schemaName`.
- `resolveTaskFilesForChange` ganha o 3º parâmetro opcional `schemaGlobCache`.
- `countSingleTopLevelTasksFile` **removido**, substituído por `countTaskFile(file, unreadable)` (ENOENT → zero silencioso; qualquer outro erro → `unreadable.push(file)`).
- Nova `interface TaskProgressDetail extends TaskProgress { unreadable: string[] }` e nova `getTaskProgressDetailForChange(changesDir, changeName, projectRoot, schemaGlobCache?)` — `targets = files.length > 0 ? files : [changeDir/tasks.md]`.
- `getTaskProgressForChange` virou wrapper que descarta `unreadable` → totais de `status`/`list`/`archive` byte-idênticos.
- `formatTaskStatus` (via `TASK_PROGRESS_MESSAGES`) **não** foi tocado; doc-comments do upstream mantidos em EN (não são user-facing).

**Pré-condição R1 confirmada:** a opção **B** de `LB-e50bd098` já estava aplicada — `resolveSchemaForChange(changeDir, explicitSchema?, projectRootOverride?, options)` existe em `src/utils/change-metadata.ts:174-181` e `task-progress.ts:107` já chamava `resolveSchemaForChange(changeDir, undefined, projectRoot)`. Nada a introduzir.

### `src/commands/validate.ts`
- Imports novos: `promises as fs`, `getTaskProgressDetailForChange` + `type SchemaGlobCache`, `FileSystemUtils`; `VALIDATE_MESSAGES` passou a importar também `CLI_MESSAGES`.
- `ExecuteOptions` ganhou `archived?: boolean` (após `specs?`).
- Ramo `if (options.archived) { await this.runArchivedTaskValidation({ json, noInteractive }); return; }` inserido **antes** de `if (options.all || options.changes || options.specs)` (R5).
- Novos métodos privados `listArchivedChangeIds(archiveDir)` e `runArchivedTaskValidation(opts)`, ambos com os comentários explicativos do upstream (EN).
- `archiveDir = path.join(process.cwd(), 'openspec', 'changes', 'archive')`; listagem **antes** do `ora().start()` (R6).
- `path` das issues: `'tasks.md'` para tarefas incompletas; `FileSystemUtils.toPosixPath(path.relative(projectRoot, file))` para arquivo ilegível.
- JSON: `{ items, summary: { totals, byType: { change } }, version: '1.0' }` — **sem `root`** (coerente com o bulk do fork).
- Texto: `✓ change/<id>` / `✗ change/<id>` + issues indentadas + `VALIDATE_MESSAGES.totals(...)`; `process.exitCode = failed > 0 ? 1 : 0`.

### G14 (decisão do orquestrador) — aplicada
Não foi criada `VALIDATE_MESSAGES.unknownError`. Foi reutilizada `CLI_MESSAGES.unknownError` **nos dois lugares**: no `catch` por alteração do `--archived` e no literal `'Unknown error'` pré-existente do `runBulkValidation` (`validate.ts`, `.catch()` do pool de concorrência).

### D32/L19 — aplicada
O filtro `entry.isDirectory() && !entry.name.startsWith('.')` já exclui `.openspec-archive.lock` (arquivo, ponto) e `.openspec-move-<uuid>` (diretório, ponto). Foi documentado no JSDoc de `listArchivedChangeIds` e **coberto por um teste dedicado** (`ignores archive's own bookkeeping entries (lock file and move staging dirs)`), verificado contra o código real: `archiveClaimPath` grava o lock em `dirname(archivePath)` = `openspec/changes/archive/`, e o rollback `moveDirectory(archivePath, changeDir)` cria `.openspec-move-*` no mesmo diretório.

### Wiring
- `src/cli/index.ts`: `.option('--archived', CLI_DESCRIPTIONS.validateArchived)` após `--specs` e antes de `--type`; `archived?: boolean` no tipo do `.action`.
- `src/core/completions/command-registry.ts`: flag `archived` na entrada `validate`, após `specs`.

---

## 2. `a7353aea` — `feat(status): add --all for batch status of every active change (#1301)`

Portabilidade: **PARTIAL (ADAPTADO)** — núcleo inteiro; tudo que depende de stores/`failWithError` pulado.

### `src/commands/workflow/status.ts`
- JSDoc do arquivo: "for a change" → "for one change or every active change".
- `StatusOptions` ganhou `all?: boolean` (entre `change` e `schema`).
- Tipo local `BatchStatusDiagnostic { severity: 'error'; code: string; message: string }` + `asBatchDiagnostic(error, code)` no lugar de `asStatus`/`StoreDiagnostic` (mesma forma serializada, sem depender de stores).
- `type BatchStatusEntry = ChangeStatus | { changeName; status: BatchStatusDiagnostic[] }`.
- Checagem de exclusão mútua **antes** do `ora(...).start()` (R8): `throw new Error(WORKFLOW_MESSAGES.allAndChangeMutuallyExclusive)`.
- Helper único `loadStatus(changeName) = formatChangeStatus(loadChangeContext(projectRoot, changeName, options.schema))`, usado pelos dois caminhos.
- `--schema` validado **antes** do early-return de "nenhuma alteração" quando `--all`.
- Bloco `--all`: sort `localeCompare`, `try/catch` por alteração, `failed = entries.some(e => !('artifacts' in e))`, JSON `{ changes: entries }` (**sem `root`**), texto por bloco separado por linha em branco, `chalk.red(WORKFLOW_MESSAGES.statusAllChangeFailed(...))` para falhas, `process.exitCode = 1` nos dois modos.
- Mensagem final de `--change` ausente trocada para `WORKFLOW_MESSAGES.missingChangeOrAllOption(...)` (só em `status.ts`; `missingChangeOption` fica intacta em `shared.ts` para `instructions`/`templates`).
- `printStatusText` **não foi tocado** (continua usando `isPlanningComplete` do Lote C).
- `grep process.exit(` em `status.ts` → 0 (só `process.exitCode`).

### Wiring
- `src/cli/index.ts`: `.option('--all', CLI_DESCRIPTIONS.statusAll)` entre `--change` e `--schema`. O `catch` do wrapper **não** foi tocado (hunk de `failWithError` sem correspondente).
- `src/commands/workflow/index.ts`: **intocado** (o único hunk era o re-export de `BATCH_STATUS_FAILURE_PAYLOAD`, que não existe no fork).
- `src/core/completions/command-registry.ts`: hunk **pulado** — o fork não tem entrada `status` no `COMMAND_REGISTRY` (nem `instructions`/`templates`/`schemas`/`new`; vieram em `fd92ccc`, stores). Dívida registrada em §6.

---

## 3. `dd7cea3f` — `feat(show): diff delta requirements against the main specs (#980)`

Portabilidade: **PARTIAL (ADAPTADO)** — `src/` inteiro; root via `process.cwd()`.

### Dependência
- `package.json`: `"diff": "^9.0.0"` inserido em ordem alfabética entre `cross-spawn` e `fast-glob`. `pnpm install` regenerou `pnpm-lock.yaml` (+9 linhas, só a entrada `diff@9.0.0`). **`@types/diff` não é necessário** — confirmado: o tarball traz `libesm/index.d.ts` e `libcjs/index.d.ts` exportando `structuredPatch`, `formatPatch`, `OMIT_HEADERS`. `build.js` não declara `external`, então `diff` entra no bundle esbuild sem ajustes.
- `name`/`version` do `package.json` intocados. `flake.nix` **não** foi tocado (D11 — hash no fechamento).

### `src/utils/requirement-diff.ts` (novo)
Copiado integralmente do upstream (`extractRequirementBlock`, `diffRequirementBlock`, `buildRenameMap`, `MatchedRequirementBlock`). Sem strings de usuário; JSDoc mantido em EN.

### `src/core/parsers/requirement-blocks.ts`
- `DeltaPlan.removedBlocks: RequirementBlock[]` (comentário traduzido para PT-BR, coerente com os comentários PT-BR já existentes no arquivo).
- `parseDeltaSpec`: `const removedBlocks = parseRequirementBlocksFromSection(removedLookup.body);` (sem 2º argumento — não registra `skippedHeaders`) + campo no objeto retornado.
- Os JSDoc PT-BR pré-existentes de `foldRequirementName` **não** foram sobrescritos (R12).

### `src/commands/change.ts`
- Imports: `chalk`, `type Delta`, `discoverSpecFiles`, `{ foldRequirementName, parseDeltaSpec }`, `{ extractRequirementBlock, diffRequirementBlock, buildRenameMap }`. **Nenhum** `RootOutput`/`rootPath`/`getSpecsPath()`.
- Tipos locais `RequirementDiff` e `DeltaWithDiff` antes da classe.
- `show()` ganhou `diff?: boolean` no tipo de `options` e a linha `- --diff: …` no JSDoc.
- Ramo JSON: `if (options.diff) await this.enrichDeltasWithDiffs(deltas, changeName, changesPath);`. O `if/else` `deltasOnly` (ramos idênticos) foi colapsado no objeto único do upstream — comportamento inalterado; `console.error(CHANGE_MESSAGES.requirementsOnlyDeprecated)` continua antes da saída.
- Ramo texto: `if (options?.diff) await this.showSpecDiffs(changeName, changesPath);` após `console.log(content)`.
- Novos métodos `collectSpecDiffs`, `enrichDeltasWithDiffs`, `showSpecDiffs`, `printDiffText`.
- **Opção A do brief adotada:** `const mainSpecsDir = path.join(path.dirname(changesPath), 'specs');` — a mesma derivação que `validate()` já usa (`change.ts:264`), com comentário explicando. Sem `getSpecsPath()`.
- `FileSystemUtils.assertPathWithin(mainSpecsDir, mainSpecPath)` **mantido** — o Lote 0 já forneceu `assertPathWithin` (confirmado em uso no `show()`).
- Todas as 10 strings de usuário → `CHANGE_MESSAGES`. Cores `chalk.green/red/cyan/yellow/dim/bold/underline` e o prefixo `⚠ ` idênticos ao upstream.

### `src/commands/show.ts`
`const CHANGE_FLAG_KEYS = new Set(['deltasOnly', 'requirementsOnly', 'diff']);`

### Wiring
- `src/cli/index.ts`: `.option('--diff', CLI_DESCRIPTIONS.changeShowDiff)` em `change show` (entre `--requirements-only` e `--no-interactive`, com `diff?: boolean` no tipo do `.action`) e `.option('--diff', CLI_DESCRIPTIONS.showDiff)` no `show` top-level (após `--requirements-only`, antes das spec-only flags).
- `src/core/completions/command-registry.ts`: flag `diff` nas duas entradas (`show` top-level e subcomando `change show`), reutilizando `showDiff`/`changeShowDiff`.

---

## 4. Strings adicionadas ao catálogo (`src/messages/index.ts`)

### `CLI_DESCRIPTIONS`
| Chave | Texto |
|---|---|
| `validateArchived` | `Valida que as alterações arquivadas tenham todas as tarefas concluídas (para lint em pre-commit)` |
| `statusAll` | `Exibe o status de todas as alterações ativas` |
| `changeShowDiff` | `Exibe diffs por requisito dos delta specs` |
| `showDiff` | `Exibe diffs por requisito dos delta specs (alteração)` |

### `VALIDATE_MESSAGES` (bloco novo `// validate --archived`)
| Chave | Texto |
|---|---|
| `validatingArchived` | `Validando alterações arquivadas...` |
| `noArchivedChangesFound` | `Nenhuma alteração arquivada encontrada.` |
| `couldNotReadTaskFile` | `não foi possível ler o arquivo de tarefas` |
| `incompleteTasks(i, c, t)` | `${i} tarefa(s) incompleta(s) (${c}/${t} concluída(s))` |

**M6 aplicada:** pluralização no padrão `tarefa(s) incompleta(s)` de `ARCHIVE_MESSAGES.incompleteTasksWarning`, não a forma com plural explícito proposta no brief. O e2e assere via a chave, não via literal.

### `WORKFLOW_MESSAGES` (bloco novo `// status.ts — status --all`)
| Chave | Texto |
|---|---|
| `allAndChangeMutuallyExclusive` | `As opções --all e --change não podem ser usadas juntas.` |
| `missingChangeOrAllOption(available)` | `Opção obrigatória --change ausente (ou --all para todas as alterações ativas). Alterações disponíveis:\n  ${available}` |
| `statusAllChangeFailed(changeName, message)` | `✗ ${changeName}: ${message}` |

`missingChangeOption` **preservada e inalterada** (usada por `validateChangeExists` em `shared.ts` para `instructions`/`templates`).

### `CHANGE_MESSAGES` (bloco novo `// show --diff`)
| Chave | Texto |
|---|---|
| `specDiffsHeading` | `Especificações alteradas (diffs)` |
| `noDeltaSpecsToDiff(name)` | `Nenhum delta spec para comparar na alteração "${name}".` |
| `noTextualChanges` | `(sem alterações textuais)` |
| `diffHeaderNearMiss(mainName)` | `O cabeçalho difere de "${mainName}" no spec principal apenas em caixa ou espaços; o archive casa nomes exatamente, então alinhe-os antes de arquivar` |
| `diffNoMatchingRequirement(name, capability)` | `Nenhum requisito correspondente encontrado para "${name}" no spec principal ${capability}` |
| `diffNoMainSpec(capability, name)` | `Não há spec principal em openspec/specs/${capability}/spec.md, então o requisito MODIFIED "${name}" não tem contra o que ser comparado` |
| `diffLabelAdded(name)` | `  ADDED: ${name}` |
| `diffLabelRemoved(name)` | `  REMOVED: ${name}` |
| `diffLabelRenamed(from, to)` | `  RENAMED: ${from} → ${to}` |
| `diffLabelModified(name)` | `  MODIFIED: ${name}` |

Notas de glossário aplicadas:
- ~~**G12** — "delta specs" (não "specs delta") em `noDeltaSpecsToDiff` e nas duas `CLI_DESCRIPTIONS` de `--diff`, coerente com o uso majoritário do catálogo (`WORKFLOW_TEMPLATES`).~~ **CORRIGIDO na revisão rodada 1** (ver §10): G12 está escopado a `docs/pt-BR/**`; no catálogo vale o precedente dos registros de mensagens de CLI → **"specs de delta"**, como o brief `LF-dd7cea3f` §4 já especificava.
- **M5/D33** — "spec principal" (masculino) em `CHANGE_MESSAGES`, coerente com a seção.
- `ADDED/REMOVED/RENAMED/MODIFIED` **não traduzidos** (termos reservados do protocolo de deltas); `change` no prefixo `✓ change/<id>` **não traduzido** (é o token `type` do JSON, mesmo padrão do bulk).
- O caminho POSIX literal `openspec/specs/${capability}/spec.md` de `diffNoMainSpec` foi mantido (não `path.join`).

**Total: 21 chaves novas.** Nenhuma chave existente foi alterada ou removida.

---

## 5. Testes

### Portados sem alteração de lógica
| Arquivo | Ação | Resultado |
|---|---|---|
| `test/utils/task-progress.test.ts` | 3 hunks aplicados (import `realpathSync` + `getTaskProgressDetailForChange`; teste do memo do cache; `describe('getTaskProgressDetailForChange (#205 unreadable reporting)')` com 3 testes) | 21 testes ✓ |
| `test/utils/requirement-diff.test.ts` | **novo**, copiado integralmente (sem strings de usuário) | 18 testes ✓ |
| `test/core/parsers/requirement-blocks.test.ts` | `expect(result.removedBlocks).toEqual([])` + novo `it('keeps the Reason and Migration body of a header-form REMOVED requirement')` | 17 testes ✓ |

### Portados com adaptação de string (só asserções)
| Arquivo | Adaptações |
|---|---|
| `test/cli-e2e/validate-archived-tasks.test.ts` (**novo**) | 5 testes do upstream + import de `VALIDATE_MESSAGES`; `incompleteTasks(2,1,3)`, `noArchivedChangesFound` (2×), `couldNotReadTaskFile` via catálogo. `✓ change/<id>` e o `path` POSIX ficaram como no upstream. **+1 teste novo do fork** para D32/L19 (lock + move staging ignorados). 6 testes ✓ |
| `test/commands/show-diff.test.ts` (**novo**) | 18 testes; 13 asserções convertidas para PT-BR (`specDiffsHeading`, `noTextualChanges`, `noDeltaSpecsToDiff('empty-change')`, `SHOW_MESSAGES.ignoringFlags('spec','diff')` via catálogo; `'Nenhum requisito correspondente encontrado'`, `'apenas em caixa ou espaços'`, `'Não há spec principal em openspec/specs/billing/spec.md'` como literais). Rótulos `MODIFIED:`/`ADDED:`/`REMOVED:`/`RENAMED:`, fixtures e linhas `+`/`-` inalterados. 18 testes ✓ |
| `test/commands/status-all.test.ts` (**novo**) | 13 dos 15 testes do upstream. Ver detalhamento abaixo. 13 testes ✓ |

#### Detalhamento de `status-all.test.ts`
- `emits the empty envelope when no changes exist` — `json.message` → `WORKFLOW_MESSAGES.noActiveChanges`; removido `expect(json.root).toBeDefined()`.
- `hoists root to the envelope and carries a full ChangeStatus per change` → renomeado para **`carries a full ChangeStatus per change`**; removidos `json.root`/`typeof json.root.path`, `nextSteps` e `actionContext` (campos de `change-status-policy`, ausentes no fork). **Acrescentado** `expect(entry.isPlanningComplete).toBe(false)` (Lote C já aplicado). `expect(entry.root).toBeUndefined()` mantido.
- `rejects --all combined with --change` — assere `WORKFLOW_MESSAGES.allAndChangeMutuallyExclusive`.
- `honors the JSON null-shape when --all and --change are combined` → renomeado para **`still fails under --json when --all and --change are combined`**: `exitCode === 1` + mensagem no output combinado, sem `JSON.parse` (o fork não tem null-shape).
- `fails with the null-shape when --schema names an unknown schema` → **`fails when --schema names an unknown schema`** (idem, assere `"Esquema 'no-such-schema' não encontrado"`).
- `rejects an unknown --schema even when no changes exist` — idem; é o teste que pina "validar `--schema` antes do early-return".
- `prints one text block per change` / `exits 1 in text mode…` — asserções via `WORKFLOW_MESSAGES.changeLabel(...)` e `progressArtifacts(1,4)`/`(2,4)`.
- **Fixture de falha trocada** (documentada no helper `createBrokenChange`): `schema: no-such-schema` **não falha no fork** (verificado empiricamente: carrega como `spec-driven`, exit 0). Usada a fixture "schema project-local com `schema.yaml` inválido" → `Esquema inválido em '…'`, exit 1.

### Testes pulados (com comentário no arquivo)
| Teste | Motivo |
|---|---|
| `status-all` › `honors the JSON null-shape when root selection fails under --all` (`--store no-such-store`) | Stores (D13); `--store` não existe no fork. |
| `status-all` › `does not rescue a change with broken metadata via an explicit --schema` | Divergência pré-stores: no fork `resolveSchemaForChange` devolve o override explícito **sem** ler o metadata e `loadChangeContext` engole erros de metadata → `--schema spec-driven` **resgata** a alteração quebrada. Upstream lê o metadata incondicionalmente desde `fd92ccc` (stores, adiado). |
| `test/commands/store-root-selection.test.ts` (hunks de `a7353aea` e `dd7cea3f`) | Arquivo inexistente no fork (D1/D13). |

### Regressão verificada verde
`test/commands/artifact-workflow.test.ts` (o prefixo `Opção obrigatória --change ausente` foi preservado, então a asserção existente continua passando), `test/commands/show.test.ts`, `test/core/parsers/**`, `test/core/archive*`, `test/core/specs-apply*`, `test/core/completions/**`, `test/cli-e2e/**` — suíte completa em 3657 testes.

---

## 6. Hunks pulados / dívidas registradas

| Hunk | Motivo |
|---|---|
| `.changeset/validate-archived-tasks.md`, `.changeset/status-all-flag.md`, `.changeset/wide-donkeys-tap.md` | D3 — changesets do upstream não entram; changeset próprio no fechamento (item 16). |
| `docs-lab/reference/cli.md` (a7353aea, dd7cea3f) | D4 — docs-lab adiado; a informação vai para `docs/cli.md` + `docs/pt-BR/cli.md` no Lote G. |
| `docs/agent-contract.md` §4.4 (a7353aea) | D7 — o fork não tem a página. |
| `flake.nix` (hash `pnpmDeps`, dd7cea3f) | D11 — recomputar uma única vez no fechamento (`scripts/update-flake.sh`). **O lockfile mudou neste lote (dep `diff`), então o hash do flake PRECISA ser recomputado no fechamento.** |
| `pnpm-lock.yaml` do upstream | Regenerado localmente por `pnpm install`; não importado. |
| `openspec/changes/spec-diffs/**` (5 arquivos, dd7cea3f) | D6 — change dir em andamento do upstream. |
| `openspec/specs/**` | Nenhum dos 3 commits altera specs no upstream (confirmado). D21: não antecipar requisitos. |
| `src/commands/workflow/index.ts` (a7353aea) | Único hunk era o re-export de `BATCH_STATUS_FAILURE_PAYLOAD`, inexistente no fork. Arquivo intocado. |
| `src/core/completions/command-registry.ts` — flag `all` na entrada `status` (a7353aea) | **Sem âncora**: o fork não tem entrada `status` no `COMMAND_REGISTRY` (nem `instructions`/`templates`/`schemas`/`new`; chegaram no upstream em `fd92ccc`, stores). Não foi criada entrada parcial. |
| `src/commands/workflow/status.ts` — `asStatus`, `StoreDiagnostic`, `BATCH_STATUS_FAILURE_PAYLOAD`, `resolveRootForCommand(failurePayload)`, `isStoreSelectedRoot`, `getChangeDir(planningHome)`, `rootOutput`, `withStoreFlag` | Stores/`failWithError` adiados. |
| `src/commands/validate.ts` — `root: ResolvedOpenSpecRoot`, `root.archiveDir`, `root.path`, `root: toRootOutput(root)` no JSON | Stores adiados. |
| `src/cli/index.ts` — `--store <id>`, `hiddenStorePathOption()`, `failWithError(...)` | Stores adiados. |
| `src/commands/change.ts` — `RootOutput`, `rootPath`, `getChangesPath()/getSpecsPath()` baseados em `this.rootPath`, `rootOutput?` em `show()`, spread `...(options.rootOutput ? { root } : {})` | Stores adiados. |
| Bumps de dev-deps (`smol-toml` 1.8.0, `typescript-eslint` 8.67.0) no PR de `dd7cea3f` | Não estão no diff deste commit (só a dep `diff`); dev-deps tratadas no Lote E. |

### Dívidas para consolidar em `dev-reports/` no fechamento
1. **Registry de completions incompleto** (L21 + LF-ab81a4b4 §8.4): quando o subsistema stores for portado (entradas `status`/`instructions`/`templates`/`schemas`/`new` no `COMMAND_REGISTRY`), incluir o flag `all` de `status` com `CLI_DESCRIPTIONS.statusAll`. Hoje `openspec status --all` **não é completável** por shell.
2. **Sem `failWithError`/null-shape JSON em falhas** (L22, stores): agentes que sigam o `agent-contract.md` do upstream esperam `{ "changes": [], "root": null, "status": [...] }` em stdout quando `status --all --json` falha; no fork recebem stdout vazio + mensagem em stderr + exit 1, como em todo comando do fork.
3. **`resolveSchemaForChange`/`loadChangeContext` engolem erro de metadata** (pré-`fd92ccc`): `.openspec.yaml` com `schema:` desconhecido carrega silenciosamente como `spec-driven`, e um `--schema` explícito resgata uma alteração com metadata quebrado. Divergência de comportamento em `status`/`instructions`/`validate`; pertence ao porte de stores.
4. **L22 — mensagens localizadas dentro do JSON**: `issues[].message` de `validate --archived`, `status[].message` de `status --all` e `warning` de `show --diff` saem em **PT-BR** (política do fork: o bulk `validate` já emitia PT-BR). **Nomes de campos** (`diff`, `warning`, `changeName`, `items`, `summary`…) e **códigos** (`change_error`, `severity: 'error'`, `type: 'change'`, `level: 'ERROR'`) permanecem em inglês. Precisa de uma frase em `docs/cli.md` e `docs/pt-BR/cli.md` no Lote G.
5. **Dívida pré-existente** (fora de escopo, D26): `docs/pt-BR/cli.md` mostra `Mudança: add-dark-mode` na transcrição de `status`, mas a CLI imprime `Alteração: add-dark-mode` (`WORKFLOW_MESSAGES.changeLabel`).
6. **Dívida pré-existente** (fora de escopo): mensagem do Zod em inglês dentro de `Esquema inválido em '…': Schema inválido: artifacts: Invalid input…` (visto no smoke test).

---

## 7. Hunks de docs pendentes para o Lote G

### `83be9d11`
| Arquivo | Hunk |
|---|---|
| `docs/cli.md` seção `### \`openspec validate\`` | (a) linha da tabela de opções após `--specs`: `\| \`--archived\` \| Validate that archived changes have all tasks completed (for pre-commit linting) \|`; (b) parágrafo entre a tabela e `**Examples:**`: "`--archived` is its own scope: it does not validate spec deltas (already applied at archive time), it verifies that every change under `changes/archive/` has all of its `tasks.md` checkboxes ticked, exiting non-zero if any are unchecked. This catches changes that were archived with unfinished work — handy in a pre-commit hook."; (c) exemplo no fim do bloco bash: `# Fail if any archived change still has unchecked tasks` / `openspec validate --archived`. |
| `docs/pt-BR/cli.md` | Os mesmos 3 pontos, traduzidos (glossário docs: "mudança"). Sugestões no brief `LF-83be9d11.md` §4.2. |
| `docs/troubleshooting.md` | Após `openspec validate --all --strict   # stricter checks, good for CI`: `openspec validate --archived       # fail if archived changes have unchecked tasks`. |
| `docs/pt-BR/troubleshooting.md` | `openspec validate --archived       # falhar se mudanças arquivadas tiverem tarefas desmarcadas`. |

### `a7353aea`
| Arquivo | Hunk |
|---|---|
| `docs/cli.md` linha 45 (tabela rápida) | `\| \`openspec status\` \| See artifact progress \| \`--json\` for structured status; \`--all --json\` for every active change in one report \|` |
| `docs/cli.md` seção `### \`openspec status\`` | Descrição ("for one change or every active change"); linha `--all` na tabela de opções; **corrigir 2 afirmações obsoletas** (`--change <id> \| Change name (prompts if omitted)` → "The change to report on, by folder name"; remover o exemplo `# Interactive status check`); nota "an unknown name is an error" em `--schema`; parágrafo "use exactly one of `--change` or `--all`" + transcrição do erro; parágrafo "no active changes"; exemplos `--all` e `--all --json`; parágrafo "With `--all`, the same block is printed once per change…"; bloco **Output (JSON, `--all`)** (**sem `root`**); parágrafo de falha parcial (exit 1 nos dois modos, documento parseável); lista **Exit codes**. Texto-alvo completo em `LF-a7353aea.md` §2.2. |
| `docs/pt-BR/cli.md` | Mesma estrutura, tradução em `LF-a7353aea.md` §2.3 (linha 45 + seção inteira). |

### `dd7cea3f`
| Arquivo | Hunk |
|---|---|
| `docs/cli.md` seção `### \`openspec show\`` | Linha `--diff` na tabela "Change-specific options"; exemplo `openspec show add-dark-mode --diff`; 3 parágrafos descrevendo formato texto, casos degenerados e o contrato `--json --diff` + exit code 1. Texto EN em `LF-dd7cea3f.md` §2.2. |
| `docs/pt-BR/cli.md` | Mesma estrutura, tradução em `LF-dd7cea3f.md` §2.2 (parte PT-BR). Aplicar **G12**: usar "delta specs"/"delta spec". |

**Decisões do orquestrador a aplicar no Lote G:**
- **G13** — as transcrições de saída da CLI em `docs/cli.md` (EN) ficam **em EN** (`Specifications Changed (diffs)`, `(no textual changes)`, `Missing required option --change (or --all …)`), seguindo a convenção existente do fork (`docs/cli.md:517` já mostra `Change: add-dark-mode`); só `docs/pt-BR/cli.md` cita os literais PT-BR reais do catálogo. Isso **corrige** a recomendação de `LF-dd7cea3f` §2.2 ("citar os literais PT-BR nos dois idiomas").
- **G12** — "delta specs" em `docs/pt-BR/**`.
- **L22** — acrescentar em ambos os `cli.md` uma frase avisando que as **mensagens** dentro do JSON são localizadas (PT-BR) enquanto **campos e códigos** não são.

---

## 8. Verificações executadas

```
pnpm exec tsc --noEmit                     → OK
node build.js                              → OK
pnpm lint                                  → OK
pnpm exec vitest run (paridade excluída)   → 115 arquivos / 3657 testes ✓
```

Greps:
- Nenhuma string EN de usuário nova em `src/` (`Validating archived`, `No archived changes`, `could not read task file`, `incomplete task`, `for pre-commit linting`, `mutually exclusive`, `Show status for all`, `Specifications Changed`, `No matching main`, `No delta specs`, `only in case or spacing`, `No main spec at`, `no textual changes`) — os 3 hits restantes são **comentários de código**.
- `root-selection|toRootOutput|ResolvedOpenSpecRoot|storePath|BATCH_STATUS_FAILURE_PAYLOAD|shared-output|store/errors|resolveRootForCommand` em `validate.ts`/`status.ts`/`change.ts`/`cli/index.ts` → **0 hits**.
- `countSingleTopLevelTasksFile` em `task-progress.ts` → **0 hits**.
- `process.exit(` em `status.ts` → **0 hits** (só `process.exitCode`).
- `missingChangeOption:` no catálogo → **1 hit**, inalterada.
- 21 chaves novas presentes em `src/messages/index.ts`.

Smokes manuais (com `dist/` recém-buildado):
- `validate --archived` → `✓ change/…` / `✗ change/…` + `✗ 2 tarefa(s) incompleta(s) (1/3 concluída(s))` + `Totais: 1 aprovado(s), 1 reprovado(s) (2 itens)`, exit 1. Alteração ativa com tarefa aberta **não** entra.
- `validate --archived --json` → sem chave `root`; ids só do archive.
- `archive/` ausente → `Nenhuma alteração arquivada encontrada.`, exit 0. `archive` como arquivo → `✖ Erro: ENOTDIR…`, exit 1, sem spinner pendurado.
- `validate --help` mostra `--archived` com descrição PT-BR.
- `status --all` → dois blocos `Alteração: a`/`Alteração: b` em ordem, exit 0. `--all --json` → `["a","b"]`, sem `root`. `--all --change a` → `✖ Erro: As opções --all e --change não podem ser usadas juntas.`, exit 1. `status` sem flags → `Opção obrigatória --change ausente (ou --all para todas as alterações ativas)…`. `--all --schema nope` → `Esquema 'nope' não encontrado…`, exit 1. `status --help` mostra `--all`.
- `show <change> --diff` → proposal, linha em branco, `Especificações alteradas (diffs)`, capability sublinhada, `ADDED:` verde, `MODIFIED:` com `@@`/`-`/`+`. `--diff --json` → chaves `["deltaCount","deltas","id","title"]`, `diff` só no MODIFIED. `show <spec> --diff` → `Aviso: Ignorando flags que não se aplicam a spec: diff`, exit 0. `completion generate zsh | grep -c -- '--diff'` → 2.

---

## 9. Dúvidas abertas

1. **Hash do `flake.nix`** — este lote alterou `pnpm-lock.yaml` (nova dep `diff@9.0.0`), então o `pnpmDeps` hash **está desatualizado** e `nix build` vai falhar até o fechamento rodar `scripts/update-flake.sh`. Confirmado pela D11 que isso é intencional, mas vale garantir que o item 16 não seja pulado.
2. **`.openspec-move-*` fora do archive** — o staging de rename também pode ser criado em `openspec/changes/` (quando `moveDirectory(changeDir, archivePath)` cai no fallback EPERM/EXDEV). Isso é território da descoberta de alterações **ativas** (`getActiveChangeIds`), não do `--archived`. Não verifiquei se `getActiveChangeIds` filtra entradas com ponto — fora do escopo deste lote, mas pode valer um olhar no fechamento.
3. **`docs/cli.md` — correções de conteúdo obsoleto na seção `status`** (`prompts if omitted`, `# Interactive status check`) vieram junto de `a7353aea` no upstream. Ficaram para o Lote G; se o executor do Lote G se ativer só aos hunks de `--all`, essas duas afirmações erradas permanecem.
4. **`WORKFLOW_MESSAGES.statusAllChangeFailed`** é puramente estrutural (`✗ ${name}: ${msg}`). Foi para o catálogo por consistência com `SCHEMA_MESSAGES.schemaHasErrors`/`COMPLETION_MESSAGES.installFailed`, mas não tem nada a traduzir — se a convenção do fork preferir literal inline nesse caso, é uma remoção trivial.

---

## 10. Revisão rodada 1

Commit do lote reamendado: `6455581` → **`3750176`** (`git commit --amend --no-edit`; branch não publicada, mensagem e trailers preservados).

### Corrigido

**[importante] `src/messages/index.ts` — "delta spec(s)" (ordem inglesa) nas 3 chaves novas, contra o precedente do catálogo.**

O achado procede. Verificação da evidência no código real:

- `grep -n "delta spec\|specs de delta\|deltas de spec\|Spec de delta" src/messages/index.ts` antes da correção: 3 ocorrências novas na ordem inglesa (99, 136, 234) contra **5 pré-existentes**, todas na ordem portuguesa — linhas 223 e 226 (`CHANGE_MESSAGES`, o **mesmo objeto** das novas), 323 e 326 (`VALIDATE_MESSAGES`) e 1361 (`DELTA_VALIDATION_MESSAGES`: `'Spec de delta encontrado em specs/spec.md. Specs de delta devem ficar sob …'`).
- As 7 ocorrências restantes de "delta specs" no catálogo estão **todas** em `VERIFY_CHANGE_TEMPLATE_MESSAGES` (linhas 2488–2821, `export const` na linha 2428) — prosa de workflow template espelhando o upstream, **não** registro de mensagens de CLI. A justificativa original ("uso majoritário do catálogo — `WORKFLOW_TEMPLATES`") pesava o registro errado.
- Escopo de G12 confirmado na fonte: `LF-dd7cea3f.md:1` — "G12: **docs PT-BR** usam 'delta specs'"; `_COMPLETUDE-r2.md:59` — linha G12 titulada "`delta specs` × `specs delta` em **`docs/pt-BR/**`**", com ação "Usar 'delta specs'/'delta spec' em LF-dd7cea3f **§2.2**" (§2.2 = docs; §4 = catálogo).
- O brief `LF-dd7cea3f` §4 já prescrevia a forma portuguesa nas 3 linhas: linha 133 `Exibe diffs por requisito dos specs de delta`; linha 134 `… dos specs de delta (alteração)`; linha 136 `Nenhum spec de delta para comparar na alteração "${changeName}".`

Alterações aplicadas (exatamente as do `suggestedFix`):

| Arquivo:linha | Antes | Depois |
|---|---|---|
| `src/messages/index.ts:99` | `changeShowDiff: 'Exibe diffs por requisito dos delta specs'` | `'Exibe diffs por requisito dos specs de delta'` |
| `src/messages/index.ts:136` | `showDiff: 'Exibe diffs por requisito dos delta specs (alteração)'` | `'Exibe diffs por requisito dos specs de delta (alteração)'` |
| `src/messages/index.ts:234` | `` `Nenhum delta spec para comparar na alteração "${name}".` `` | `` `Nenhum spec de delta para comparar na alteração "${name}".` `` |
| `test/commands/show-diff.test.ts:293` | `not.toContain('Nenhum delta spec para comparar')` | `not.toContain('Nenhum spec de delta para comparar')` |

Gênero masculino (`Nenhum spec de delta`) mantido: casa com o brief §4, com D33 ("spec principal" masc. em `CHANGE_MESSAGES`) e com o precedente `rootLevelDeltaSpec` ("Spec de delta **encontrado**").

Acoplamentos verificados antes de editar:
- `grep -rn "Exibe diffs por requisito" --include=*.ts --include=*.md --include=*.json --include=*.sh --include=*.fish .` → só as 2 linhas do catálogo (nenhum golden de completions ou doc cita a descrição literalmente; `command-registry.ts:145/218` e `cli/index.ts:365/470` referenciam as **chaves**).
- Único literal hard-coded acoplado no repositório: `test/commands/show-diff.test.ts:293` — corrigido. `show-diff.test.ts:211` usa `CHANGE_MESSAGES.noDeltaSpecsToDiff('empty-change')` (chave, não literal), logo acompanha sozinho.
- `docs/**` e `docs/pt-BR/**` **não foram tocados**: lá vale G12 ("delta spec(s)"), e nenhuma das linhas de docs deste lote menciona as strings alteradas.
- `src/core/templates/workflows/*.ts` **não foram tocados**: prosa de template, fora do escopo do lote.

### Rejeitado

Nenhum. O único achado da rodada procede e foi corrigido na forma sugerida (opção principal do `suggestedFix`, não a alternativa) — as 5 ocorrências pré-existentes já estavam na forma portuguesa, então não sobrou item de normalização para o fechamento.

### Validação (pós-correção)

- `pnpm exec tsc --noEmit` → **verde** (exit 0, sem saída).
- `node build.js` → **verde** (`✅ Build completed successfully!`, Version 6.0.3).
- `pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts --exclude test/core/templates/skillssh-parity.test.ts` → **115 arquivos / 3657 testes, todos passando** (29,06 s).

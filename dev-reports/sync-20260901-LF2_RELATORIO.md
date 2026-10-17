# Relatório do lote LF2 — Schema, completions e completion tip

**Branch:** `sync/upstream_20260901` · **Commit:** `53a0c9259dc0fef6c3f03ed02c072d1105f470b0`
**Título:** `fix(schema): portar fidelidade YAML no fork, schema init --default, dica de completions no CLI e completions Fish do upstream v1.9.0–v1.11.0`
**Arquivos tocados:** 30 (+1720 / −323), sendo 5 novos e 2 removidos.

Commits do upstream portados, na ordem: `8127c7b7`, `2fa679f1`, `7276c6c2`, `ab81a4b4`.
**Nenhum hunk de `src/` ficou sem porte ou sem justificativa.** Um único commit temático, como o lote pede.

---

## 1. O que foi portado, por commit

### 8127c7b7 — `fix(schema): preserve YAML formatting when forking a schema (#1607)`

Portado o **estado final** (o commit é um squash de 8 passes de hardening).

| Arquivo do fork | Ação |
|---|---|
| `src/commands/schema.ts` | imports `createHash`, `parseDocument`, `isMap`; helper novo `fingerprintDir`; handler `fork` reescrito do `assertSchemaTreeCanBeCopied(trustedSourceDir)` até o `spinner.succeed` |
| `src/core/artifact-graph/resolver.ts` | `isOwnedTransientSchemaDir` + guarda na 1ª linha de `isSchemaDir` (portado direto no nome final, sem passar por `isOwnedForkTempDir`) |
| `src/messages/index.ts` | 6 chaves novas em `SCHEMA_MESSAGES` (§2) |
| `test/commands/schema-fork-fidelity.test.ts` | **criado** (705 linhas, 14 testes) |

Comportamento novo no `fork`: `parseSchema` da origem antes de qualquer passo destrutivo; rejeição de self-fork por `realpath`; staging em `openspec/schemas/.fork-staging-<rand>` (mkdtemp); revalidação do YAML **preparado** (não só da origem) antes do swap; backup do destino em `<dest>.fork-backup-<pid>-<ts>` com restauração em falha de install e erro nomeando o backup se a restauração também falhar; impressão digital SHA-256 do destino autorizado, comparada antes do swap (aborta) e antes de descartar o backup (mantém + avisa em stderr). Limpeza do staging sempre em `try/catch` próprio, erro original sempre relançado. Formato JSON de sucesso/falha e exit codes **inalterados**.

O `spinner.start(removingExistingSchema)` e o `fs.rmSync(destinationDir)` prévio deixaram de existir (`grep -n "rmSync(destinationDir" src/commands/schema.ts` → vazio).

**Divergência deliberada de layout:** no upstream a docstring de `isSchemaDir` ficou órfã **acima** do helper novo (erro do commit). No fork ela foi reancorada imediatamente acima de `isSchemaDir` (comentário-only, sem impacto funcional; o brief §2 endossa explicitamente). Custo: um bloco movido no próximo diff contra o upstream nesse arquivo.

### 2fa679f1 — `fix(schema): make schema init --default actually set the default (#1709)`

| Arquivo do fork | Ação |
|---|---|
| `src/commands/schema.ts` | `interface PreparedConfigUpdate`, `export const schemaInitFileOperations` (seam de teste), `prepareDefaultConfigUpdate`, `configMatchesPreparedState`; handler `init` reescrito do `// Replace only after all inputs…` até o `spinner.succeed` |
| `src/core/artifact-graph/resolver.ts` | `.init-staging-`/`.init-backup-` já cobertos pelo `isOwnedTransientSchemaDir` (portado no estado final junto com `8127c7b7`) |
| `src/messages/index.ts` | 10 chaves novas em `SCHEMA_MESSAGES` (§2) |
| `openspec/specs/schema-init-command/spec.md` | **aplicado verbatim em EN** — `diff <(git show upstream/main:…) …` → vazio |
| `test/commands/schema.test.ts` | +16 casos (§4) |

O bug #1708 existia idêntico no fork (`config.defaultSchema = name` numa chave que `readProjectConfig` nunca leu). Agora `--default` grava `schema: <nome>` e apaga `defaultSchema`, **em lugar** no `config.yaml` ou `config.yml` existente via Document API (comentários e demais chaves preservados), criando `openspec/config.yaml` só quando nenhum existe. O `await import('yaml')` dinâmico foi removido.

Transação completa: config preparado em memória e validado **antes** de qualquer arquivo de esquema ser criado/movido; schema gerado em `.init-staging-<rand>` e validado com `validateSchema`; config preparado em `openspec/.schema-init-config-<rand>/<basename>` com `chmod` do modo original; `assertProjectArtifactPath` repetido e fingerprints reconferidos imediatamente antes do commit; commit = 2 a 4 `renameSync` via `schemaInitFileOperations`; rollback completo em falha, com erro nomeando os backups quando o rollback fica incompleto; após o commit, falha ao apagar backup vira **aviso** em stderr.

**`resolveConfigFilePath` já existia** (entregue pelo Lote D em `src/core/project-config.ts:313`, com a precedência `.yaml` > `.yml` idêntica à de `readProjectConfig`) — nada a criar, só importar. O brief previa o caso.

### 7276c6c2 — `fix(packaging): print the completions tip from the CLI, not a postinstall script (#1704)` (D8)

| Arquivo do fork | Ação |
|---|---|
| `scripts/postinstall.js`, `scripts/test-postinstall.sh` | **removidos** (`git rm`) |
| `package.json` | 3 remoções: `"scripts/postinstall.js"` em `files`, script `test:postinstall`, script `postinstall`. `prepare`/`prepublishOnly` do fork (`node build.js`), `name` e `version` **intocados** |
| `scripts/upstream-sync-status.mjs` | l.9: comentário corrigido (citava `scripts/postinstall.js`, que deixou de existir) |
| `src/core/completion-tip.ts` | **criado** (cópia do upstream; única mudança: `COMPLETION_TIP_MESSAGE = COMPLETION_TIP_MESSAGES.firstRunTip`) |
| `src/cli/index.ts` | 5 hunks (§3) |
| `src/core/completions/factory.ts` | `isInstalled(): Promise<boolean>` no contrato `CompletionInstaller` |
| `src/core/completions/installers/{bash,fish,powershell}-installer.ts` | `async isInstalled()` via `fs.stat().isFile()` |
| `src/core/config-schema.ts` | `completionTipSeen: z.boolean().optional()` (**não** em `KNOWN_TOP_LEVEL_KEYS` — a rejeição em `config set` é o comportamento desejado) |
| `src/core/global-config.ts` | campo `completionTipSeen?: boolean` na `interface GlobalConfig` (**não** em `DEFAULT_CONFIG`) |
| `src/messages/index.ts` | seção nova `COMPLETION_TIP_MESSAGES` |
| testes | 4 arquivos novos/alterados (§4) |

`src/core/completions/installers/zsh-installer.ts` **não** foi tocado: o upstream não o alterou (continua com `fs.access`, não `stat().isFile()`). Divergência do upstream mantida por paridade.

### ab81a4b4 — `fix(completions): stop Fish completions falling back to filenames (#1199)`

| Arquivo do fork | Ação |
|---|---|
| `src/core/completions/types.ts` | `PositionalType`, `PositionalDefinition`, `CommandDefinition.positionals` (parte não-stores de `7c3accc`, D30/O7) + `FlagDefinition.completionType`. Resultado **byte-idêntico** a `ab81a4b4:src/core/completions/types.ts` |
| `src/core/completions/templates/fish-templates.ts` | `FISH_STATIC_HELPERS` substituído pelo upstream inteiro; `FISH_DYNAMIC_HELPERS` mantido sem `__fish_openspec_schemas`. Diff contra o upstream: **só** esse helper ausente |
| `src/core/completions/generators/fish-generator.ts` | arquivo inteiro do upstream, com 4 divergências (§3) |
| `test/core/completions/generators/fish-generator.test.ts` | arquivo inteiro do upstream, com 5 adaptações (§4) |
| `src/core/completions/command-registry.ts` | **não tocado** — os 3 hunks são de stores (§5) |

---

## 2. Strings adicionadas ao catálogo (`src/messages/index.ts`)

**17 chaves novas**, nenhuma removida, nenhuma assinatura alterada.

### `SCHEMA_MESSAGES` — `schema fork` (bloco `// schema fork — cópia transacional (upstream 8127c7b7)`)

| Chave | Valor PT-BR |
|---|---|
| `cannotForkOntoItself(source)` | `Não é possível copiar o esquema '${source}' sobre ele mesmo; escolha um nome de destino diferente` |
| `stagedForkInvalid(source, dest)` | `A cópia preparada de '${source}' não é um esquema válido (a origem pode ter mudado durante a cópia); operação abortada, '${dest}' não foi modificado.` |
| `replacingExistingSchema(dest)` | `Substituindo esquema existente '${dest}'...` |
| `forkDestinationChangedOnDisk(dest, dir)` | `O esquema '${dest}' em ${dir} mudou em disco enquanto a cópia era preparada. Operação abortada para preservar essas alterações concorrentes; nada foi sobrescrito. Execute a cópia novamente para sobrescrever o conteúdo atual.` |
| `forkInstallRestoreFailed(dest, backupDir, destinationDir, restoreMessage)` | `Falha ao instalar o esquema copiado e não foi possível restaurar o '${dest}' anterior. Seu esquema anterior está preservado em ${backupDir}; mova-o de volta para ${destinationDir} para restaurar. Erro na restauração: ${restoreMessage}` |
| `forkBackupKept(dest, backupDir)` | `Aviso: o '${dest}' anterior mudou durante a cópia e NÃO foi apagado; sua cópia anterior à operação está preservada em ${backupDir}.` |

### `SCHEMA_MESSAGES` — `schema init --default` (bloco `// schema init --default — atualização transacional do config (upstream 2fa679f1)`)

| Chave | Valor PT-BR |
|---|---|
| `defaultConfigIsSymlink(file)` | `Não é possível definir o esquema padrão: ${file} deve ser um arquivo regular, não um link simbólico` |
| `defaultConfigNotRegularFile(file)` | `Não é possível definir o esquema padrão: ${file} deve ser um arquivo regular` |
| `defaultConfigNotWritable(pathOrFile)` | `Não é possível definir o esquema padrão: ${pathOrFile} não tem permissão de escrita` |
| `defaultConfigInvalidYaml(file)` | `Não é possível definir o esquema padrão: ${file} contém YAML inválido` |
| `defaultConfigNotObject(file)` | `Não é possível definir o esquema padrão: ${file} deve conter um objeto YAML` |
| `generatedSchemaInvalid(issues)` | `O esquema gerado falhou na validação: ${issues}` |
| `initSchemaChangedOnDisk(name)` | `O esquema '${name}' mudou em disco enquanto a inicialização era preparada. Operação abortada para preservar essas alterações concorrentes.` |
| `initConfigChangedOnDisk(file)` | `${file} mudou em disco enquanto a inicialização era preparada. Operação abortada para preservar essas alterações concorrentes.` |
| `initRollbackIncomplete(errors, schemaDir, configPath: string \| null)` | `A inicialização do esquema falhou e a reversão ficou incompleta (${errors}). Backups de recuperação podem ter permanecido ao lado de ${schemaDir} e ${configPath ?? 'do arquivo de configuração'}.` — o fallback é resolvido dentro da função |
| `initBackupCleanupFailed(backup, message)` | `Aviso: a inicialização foi concluída, mas o backup em ${backup} não pôde ser removido: ${message}` |

### `COMPLETION_TIP_MESSAGES` (seção nova, entre `COMPLETION_MESSAGES` e `FEEDBACK_MESSAGES`)

| Chave | Valor PT-BR |
|---|---|
| `firstRunTip` | `Dica: execute 'openspec completion install' para habilitar o autocomplete do shell` |

Convenções seguidas: prefixo `Dica:` como em `CLI_MESSAGES.hintViewChanges`; "autocomplete do shell" como em `CLI_DESCRIPTIONS.completion` e em todo `COMPLETION_MESSAGES`; `openspec completion install` literal; o `\n` inicial fica no código (`console.error(\`\n${COMPLETION_TIP_MESSAGE}\`)`), não na chave.

**Chaves reutilizadas (não recriadas):** `schemaAlreadyExists`, `suggestionForceOverwrite`, `schemaAlreadyExistsAt`, `forkingSchema`, `forkedSchema`, `creatingSchema`, `schemaCreated`, `CLI_DESCRIPTIONS.noColor`.

Rótulos técnicos mantidos em EN por decisão do brief §2.2: `config:` / `schema:` dentro de `rollbackErrors` (identificadores dos dois artefatos da transação, mesmo padrão de `artifacts.<id>.template`).

---

## 3. Adaptações do fork (divergências deliberadas do diff upstream)

1. **`src/cli/index.ts` sem `COMMON_FLAGS`.** O upstream tem `import { COMMON_FLAGS } from '../core/completions/shared-flags.js'` como linha de contexto — é do subsistema de stores (D1). `grep -n "COMMON_FLAGS\|shared-flags" src/cli/index.ts` → vazio.
2. **`COMPLETION_TIP_MESSAGE` vem do catálogo.** O upstream hardcoda o literal EN no módulo. No fork o `export const` mantém o **nome** (os testes o importam) mas o valor sai de `COMPLETION_TIP_MESSAGES.firstRunTip`.
3. **`--no-color` do gerador Fish vem de `CLI_DESCRIPTIONS.noColor`** (passando por `escapeDescription`), não do literal `'Disable color output'` do upstream. Import novo `'../../../messages/index.js'` (mesmo caminho relativo já usado por `powershell-generator.ts`).
4. **Header e comentário de classe do gerador Fish mantidos como `BR-OpenSpec`** (l.6 e l.38).
5. **Sem `case 'schema-name'` no gerador Fish** (omissão pré-existente do fork, que não tem `__complete schemas` nem `__fish_openspec_schemas`): esse tipo cai no `default` novo → emite `-f` (sem sugestões, sem arquivos). Antes deste porte não emitia nada, e o Fish caía no fallback de arquivos — então isso é melhoria, não regressão.
6. **`FISH_DYNAMIC_HELPERS` sem `__fish_openspec_schemas`** (idem). `git diff --no-index` contra o upstream mostra só essa ausência.
7. **`src/core/completions/types.ts` foi além do commit**: os tipos `PositionalType`/`PositionalDefinition`/`positionals` vêm de `7c3accc` (commit de stores, adiado). Portados **só** os tipos (aditivos, puramente de tipo) porque `tsc` falha sem eles em `subcmd.positionals`, `cmd.positionals` e `NonNullable<CommandDefinition['positionals']>` — decisão D30/O7. O restante de `7c3accc` (registry, `__complete schemas`, `case 'schema-name'` nos 4 geradores) fica como dívida (§7).
8. **Docstring de `isSchemaDir` reancorada** (ver §1, `8127c7b7`).
9. **`scripts/upstream-sync-status.mjs`**: fork-only, não deferido pelo orquestrador junto com os docs; o comentário citava um arquivo que este commit removeu, então ficaria factualmente falso. Corrigido aqui (1 linha).
10. **`SCHEMA_MESSAGES.removingExistingSchema` mantida** apesar de ficar órfã — **D28**. Ver §7.

---

## 4. Testes portados / adaptados

| Arquivo | O que entrou | Adaptação |
|---|---|---|
| `test/commands/schema-fork-fidelity.test.ts` | **novo**, do upstream (14 testes: 13 + 1 documental) | 9 regexes traduzidas: `/Invalid schema/i`→`/Schema inválido/i` (×3), `/already exists/i`→`/já existe/i` (×2), `/onto itself/i`→`/sobre ele mesmo/i`, `/preserved at/i`→`/preservado em/i`, `/could not restore/i`→`/não foi possível restaurar/i`, `/changed on disk\|concurrent\|aborted/i`→`/mudou em disco\|concorrente\|abortada/i`, `/was NOT deleted/i`→`/NÃO foi apagad/i`, `/not a valid schema\|aborted/i`→`/não é um esquema válido\|abortada/i`. As 4 strings do próprio teste (`simulated copy failure` etc.) ficam em EN. `vi.mock('node:fs')` funciona porque `schema.ts` importa `* as fs from 'node:fs'` — não normalizado |
| `test/commands/schema.test.ts` | `import { runCLI }`, `runSchemaCommand(args, schemaModule?)`, `snapshotTree`; +16 casos (e2e `uses the configured default…`, `describe.each(failureModes)` = 5×2, `rolls back a forced schema replacement…`, `makes the new schema the one the config loader resolves…`, `keeps the rest of an existing config…`, `updates config.yml in place…`, `does not set the default through a config symlink…`, `clears the dead defaultSchema key…`, `excludes init staging/backup temp dirs from schema discovery`) — 46 testes no total | **1 adaptação de CLI:** `runCLI(['new','change','uses-default','--json'])` → `runCLI(['new','change','uses-default'])`, porque o fork não tem `--json` em `new change` (o commander devolveria "unknown option", exit 1). A asserção seguinte lê o `.openspec.yaml`, não o stdout, e é o que prova o fix #1708. Nenhuma asserção de string PT-BR nos testes novos. Guards `if (process.platform === 'win32') return;` mantidos |
| `test/core/completion-tip.test.ts` | **novo**, do upstream (18 testes) | 1 literal: `"Dica: execute 'openspec completion install' para habilitar o autocomplete do shell"` no teste `names a command that actually exists`. Mantida a asserção **literal** (não comparação com a chave do catálogo) — é a guarda contra typo no nome do comando |
| `test/cli-e2e/completion-tip.test.ts` | **novo**, verbatim (2 testes) | nenhuma. A asserção `not.toContain('completion install')` funciona com a string PT-BR (que também contém `completion install`) |
| `test/package-install-scripts.test.ts` | **novo**, verbatim (3 testes) | nenhuma |
| `test/core/cli-is-json-run.test.ts` | import de `isCompletionRun`/`shouldDeferCompletionTip`; item 4 (`completion install`) no `buildProgram`; 2 `describe` novos — 20 testes | nenhuma |
| `test/core/completions/installers/{bash,fish,powershell}-installer.test.ts` | `describe('isInstalled')` (3 casos cada) | nenhuma. O `BROpenSpecCompletion.ps1` do fork é transparente (o teste usa `installer.getInstallationPath()`) |
| `test/core/config-schema.test.ts` | `it('rejects completionTipSeen, …')` dentro de `describe('validateConfigKeyPath telemetry')` (entrou no LF1) | nenhuma |
| `test/core/completions/generators/fish-generator.test.ts` | arquivo inteiro do upstream (33 testes) | 5 adaptações: 4 literais `Initialize BR-OpenSpec` / `# Fish completion script for BR-OpenSpec CLI`; import de `CLI_DESCRIPTIONS` no lugar de `COMMAND_REGISTRY` e asserção do `--no-color` via a chave; teste `should force path completion for every registry-backed path flag` **pulado** com comentário (§5); teste `should handle positional arguments for schema names` **não recriado** (§5); teste `should handle indexed positional arguments for schema fork` adaptado — `expect(sourceLine).toContain('__fish_openspec_schemas')` trocado por `toBeDefined()` + `not.toContain('__fish_openspec_schemas')`, com comentário explicando |

**Testes não alterados que confirmam o porte** (rodados, verdes): `test/cli-e2e/validate-scenario-loss.test.ts` (fixa exit 1 do `change validate` sem `process.exit()`), `test/cli-e2e/basic.test.ts` (`expectJsonOnlyOutput`, `stderr === ''`), `test/core/global-config.test.ts` (`DEFAULT_CONFIG` sem a chave nova), `test/core/artifact-graph/resolver.test.ts`, `test/core/project-config.test.ts`, `test/utils/change-utils.test.ts`.

**Nenhum teste do upstream foi pulado por causa de stores além dos 2 listados em §5.** Nenhuma lógica de teste existente foi alterada.

---

## 5. Pulado, com motivo

| Item | Motivo |
|---|---|
| `.changeset/quiet-schemas-rollback.md`, `.changeset/drop-postinstall-script.md`, `.changeset/fish-completion-no-file-fallback.md` | D3 — o changeset do fork é único, escrito no fechamento. Texto sugerido em §8 |
| `docs-lab/Notes.md`, `docs-lab/reference/cli.md` (de `2fa679f1`) | D4 — informação redirecionada para `docs/cli.md` no lote de docs (§6) |
| `src/core/completions/command-registry.ts` — 3 hunks de `ab81a4b4` (`store setup --path`, `context --code-workspace`, `workset create --member` ganham `completionType: 'path'`) | D1 — comandos do subsistema de stores/workset, inexistentes no fork. Nada a fazer no arquivo |
| Teste `should force path completion for every registry-backed path flag` | D13 — itera `COMMAND_REGISTRY` procurando exatamente aqueles 3 flags; `completionLines` devolveria `[]` e `optionLine` seria `undefined`. Substituído por um comentário no lugar exato; o caso equivalente com fixture inline (`should force file completion for path flags when sibling rules suppress it`) **foi** portado |
| Teste `should handle positional arguments for schema names` (hunk que só acrescenta `-f`) | O teste não existe no fork — foi removido junto com `__fish_openspec_schemas`. Não recriado |
| `case 'schema-name'` no `generatePositionalCompletion` do Fish | Linha de contexto, não hunk. O fork não tem o helper nem `__complete schemas` |
| `src/core/completions/installers/zsh-installer.ts` | O upstream não o alterou (já tinha `isInstalled()`, via `fs.access`) |
| `openspec/changes/archive/2025-11-06-add-shell-completions/tasks.md` (cita "npm postinstall") | Histórico arquivado — não editar |
| Docs: `SECURITY.md`, `scripts/README.md`, `docs/cli.md`, `docs/pt-BR/cli.md`, `AGENTS.md` | Reservados para o lote de docs por instrução do orquestrador (§6) |
| `website/**`, `openspec/changes/**`, `skills/**`, `CHANGELOG.md`, `pnpm-lock.yaml` | Não tocados por nenhum dos 4 commits |

---

## 6. Hunks de docs pendentes para o lote de docs (Lote G)

Nenhum arquivo de `docs/`, `SECURITY.md`, `scripts/README.md` ou `AGENTS.md` foi tocado neste lote. Âncoras já localizadas no fork:

### De `7276c6c2` (D8) — **urgente: afirmações hoje factualmente falsas**

| Arquivo | Linha (fork) | Estado atual | O que aplicar |
|---|---|---|---|
| `SECURITY.md` | 30 | `O pacote npm @dynamicworks/br-openspec publica dist/, bin/, schemas/ e \`scripts/postinstall.js\`.` | remover ` e \`scripts/postinstall.js\`` → `… publica \`dist/\`, \`bin/\` e \`schemas/\`.` |
| `SECURITY.md` | 45 | `\| Script de instalação \| \`scripts/postinstall.js\` imprime uma linha sugerindo autocompletions do shell. …\|` | `\| Scripts de instalação \| O pacote não traz script \`preinstall\`, \`install\` nem \`postinstall\`, então instalá-lo a partir do registry npm não executa nenhum código do BR-OpenSpec. (\`prepare\` continua declarado; o npm só o executa em instalações a partir de git ou de diretório local, onde ele faz o build a partir do código-fonte.) Completions do shell são opt-in via \`openspec completion install\`; a CLI imprime uma dica de uma linha sobre elas na sua primeira execução. \|` |
| `scripts/README.md` | 79–81 | bloco `## postinstall.js` + `Post-installation script that runs after package installation.` + linha em branco | **remover** o bloco (mantém `## pack-version-check.mjs`) |
| `docs/cli.md` | entre o ` ``` ` que fecha os exemplos de `completion` (l.1013) e o `---` (l.1015) | — | inserir: `Completions are opt-in. The CLI mentions them once, on stderr, the first time you run a command in an interactive terminal, and never again — it also stays quiet if you already have completions installed. Set \`OPENSPEC_NO_COMPLETIONS=1\` to suppress that tip entirely.` |
| `docs/cli.md` | entre `OPENSPEC_NO_ANIMATION` (l.1035) e `OPENSPEC_NO_UPDATE_CHECK` (l.1036) | — | `\| \`OPENSPEC_NO_COMPLETIONS\` \| Set to \`1\` to suppress the one-time tip about shell completions \|` |
| `docs/pt-BR/cli.md` | entre o ` ``` ` (l.1008) e o `---` (l.1010) | — | `As completions são opt-in. A CLI as menciona uma única vez, em stderr, na primeira vez que você executa um comando em um terminal interativo, e nunca mais — ela também fica em silêncio se você já tem completions instaladas. Defina \`OPENSPEC_NO_COMPLETIONS=1\` para suprimir essa dica por completo.` |
| `docs/pt-BR/cli.md` | entre `OPENSPEC_NO_ANIMATION` (l.1030) e `OPENSPEC_NO_UPDATE_CHECK` (l.1031) | — | `\| \`OPENSPEC_NO_COMPLETIONS\` \| Definir como \`1\` para suprimir a dica única sobre completions do shell \|` |
| `AGENTS.md` | após `OPENSPEC_NO_ANIMATION` na seção "Useful Environment Variables" (l.169-178) | — | `- \`OPENSPEC_NO_COMPLETIONS=1\` — Suppress the one-time first-run tip about shell completions` (higiene do fork; o upstream não toca AGENTS.md) |

### De `2fa679f1` (D4 — conteúdo dos hunks de `docs-lab`)

| Arquivo | Linha (fork) | Estado atual | O que aplicar |
|---|---|---|---|
| `docs/cli.md` | 725 (tabela de opções de `openspec schema init`) | `\| \`--default\` \| Set as project default schema \|` | `\| \`--default\` \| Set as project default schema: writes \`schema: <name>\` to the existing \`openspec/config.yaml\` or \`openspec/config.yml\` (creates \`openspec/config.yaml\` if neither exists). New changes use this schema. \|` |
| `docs/cli.md` | após a tabela, antes de **Examples:** | — | `Schema creation and the \`--default\` config update are one operation. If BR-OpenSpec cannot validate or write the config, it leaves both the config and any existing schema unchanged.` |
| `docs/pt-BR/cli.md` | 720 | `\| \`--default\` \| Definir como schema padrão do projeto \|` | `\| \`--default\` \| Definir como schema padrão do projeto: grava \`schema: <name>\` no \`openspec/config.yaml\` ou \`openspec/config.yml\` existente (cria \`openspec/config.yaml\` se nenhum existir). Novas mudanças passam a usar este schema. \|` |
| `docs/pt-BR/cli.md` | após a tabela, antes de **Exemplos:** | — | `A criação do schema e a atualização do config feita por \`--default\` são uma única operação. Se o BR-OpenSpec não conseguir validar ou gravar o config, tanto o config quanto qualquer schema existente permanecem inalterados.` |

### De `8127c7b7` (opcional, sugerido pelo brief)

| Arquivo | Onde | O que aplicar |
|---|---|---|
| `docs/cli.md` | seção `openspec schema fork`, após a descrição | `The forked \`schema.yaml\` keeps the source's comments and formatting; only \`name\` is updated.` |
| `docs/pt-BR/cli.md` | idem | `O \`schema.yaml\` copiado mantém os comentários e a formatação da origem; apenas \`name\` é atualizado.` |

Terminologia: CLI = **"esquema"**; `docs/pt-BR/**` = **"schema"** (padrão já estabelecido). Não misturar.

`ab81a4b4` não tem hunks de docs.

---

## 7. Dívidas registradas (para `dev-reports/` no fechamento — D26)

### 7.1 Registry de completions incompleto (L21 + LF-ab81a4b4 §8.4) — **pedida explicitamente pelo orquestrador**

`src/core/completions/command-registry.ts` do fork está atrás do upstream em três frentes, todas herdadas de commits de stores adiados (`7c3accc`, `fd92ccc`):

- **(a) Comandos ausentes no registry** (existem na CLI, mas não são completáveis): `status`, `instructions`, `templates`, `schemas`, `new`. Vieram no upstream em `fd92ccc`.
- **(b) Flags ausentes de comandos que o registry já conhece:** `init --force`, `init --profile`, `update --force` (`src/cli/index.ts`), além de `status --all` (cujo hunk de registry o lote LF-a7353aea também pulou, pela ausência da entrada `status`) e das flags que outros lotes desta sync adicionaram.
- **(c) Sem completion de nomes de schema:** falta o provider `getSchemaNames` + `case 'schemas'` em `src/commands/completion.ts` (`openspec __complete schemas`), o helper `__fish_openspec_schemas` e o `case 'schema-name'` nos **4** geradores (bash, zsh, fish, powershell).

**Efeito deste lote sobre a dívida:** com `ab81a4b4`, o sintoma de (a) e (c) no Fish muda de "sugere arquivos inúteis do diretório" para "não sugere nada" (o `default` novo emite `-f`). Não é regressão — é o comportamento correto para um alvo desconhecido — mas fica mais visível ao usuário.

**Observação de escopo:** se o registry do fork um dia passar a usar `positionals`, os geradores bash/zsh/powershell precisarão do porte correspondente de `7c3accc` (hoje só o gerador Fish consome o campo; nos outros três é código morto de tipo).

### 7.2 Chaves órfãs no catálogo (M8 / D28)

`SCHEMA_MESSAGES.removingExistingSchema` (`src/messages/index.ts:808`) ficou **sem uso** após este lote — `fork` e `init` deixaram de remover o destino antes de copiar. Mantida por decisão D28 (não remover chaves órfãs neste lote). `grep -rn "removingExistingSchema" src/ test/` → apenas a definição.

Outras órfãs já conhecidas de lotes anteriores (não verificadas exaustivamente aqui): `CONFIG_MESSAGES.spaceToToggle` (LE-infra), `INIT_MESSAGES.startFirstChangeWithSkill` (r1-L8). Vale um passe único de limpeza no fechamento, com a política de M8 decidida.

### 7.3 Round-trip do YAML no `schema fork` normaliza flow collections

`doc.toString()` da Document API preserva comentários, block scalars e ordem de chaves, mas reemite coleções em flow style com o espaçamento canônico da biblioteca: `requires: [tasks]` vira `requires: [ tasks ]`. Verificado no smoke (`schemas/spec-driven/schema.yaml`: 8 comentários e 5 block scalars preservados; a única outra diferença além de `name:` é essa linha). **É comportamento do upstream** (o código é idêntico), e ainda assim uma melhora enorme sobre o estado anterior, que reserializava o arquivo inteiro e perdia tudo. Registrado só para que ninguém interprete como bug do porte.

---

## 8. Validação

```
pnpm exec tsc --noEmit                                    → OK
node build.js                                             → OK
pnpm lint (eslint src/)                                   → OK
pnpm exec vitest run --exclude <2 testes de paridade>     → 111 arquivos / 3598 testes passando
```

`git status` após o commit: só o `dev-reports/release-2-2-0_REPORT_…md` pré-existente (não deste lote).

### Greps dos checklists dos 3 briefs

| Verificação | Resultado |
|---|---|
| `grep -c parseDocument\|isMap\|createHash src/commands/schema.ts` | 3 / 2 / 2 ✓ |
| `grep -n defaultSchema src/commands/schema.ts` | só `config.delete('defaultSchema')` + `defaultSchemaDescription` (chave antiga não relacionada) ✓ |
| `grep -n "rmSync(schemaDir, { recursive: true })\|rmSync(destinationDir"` | vazio ✓ |
| `grep -n stringifyYaml src/commands/schema.ts` | import + 2 usos (config novo, `schema.yaml` do init); 0 no `fork` ✓ |
| nomes de dir temporário em `schema.ts` | `.fork-staging-` ×1, `.fork-backup-` ×1, `.init-staging-` ×1, `.init-backup-` ×2, `.schema-init-config-` ×1 ✓ |
| `grep -rn isOwnedForkTempDir src/` | vazio ✓ |
| `grep -rnE "onto itself\|is not a valid schema\|Replacing existing schema\|changed on disk\|could not restore\|was NOT deleted\|Cannot set the default schema\|failed validation\|rollback was incomplete\|could not be removed" src/` | vazio ✓ |
| 16 chaves de schema em `src/messages/index.ts` | 16 ✓ |
| regexes EN em `schema-fork-fidelity.test.ts` | vazio ✓ |
| `diff <(git show upstream/main:openspec/specs/schema-init-command/spec.md) …` | vazio ✓ |
| `grep -rn postinstall` (fora de node_modules/.git/dist/dev-reports) | só `PLANO-…md`, `SECURITY.md`+`scripts/README.md` (lote G), o change arquivado de 2025-11-06, a docstring de `completion-tip.ts` e o teste novo ✓ |
| `p.scripts.postinstall` / `test:postinstall` / `files.includes('scripts/postinstall.js')` | `undefined undefined false`; `prepare === 'node build.js'`; `name === '@dynamicworks/br-openspec'`; `version === 2.3.0` ✓ |
| `grep -n isInstalled src/core/completions/{factory,installers/*}.ts` | interface + 4 implementações (zsh pré-existente) ✓ |
| `grep -n completionTipSeen src/core/{config-schema,global-config}.ts` | 1 em cada; nenhuma em `KNOWN_TOP_LEVEL_KEYS`/`DEFAULT_CONFIG` ✓ |
| `grep -n "process.exit(process.exitCode)" src/cli/index.ts` | vazio ✓ |
| `grep -n "COMMON_FLAGS\|shared-flags" src/cli/index.ts` | vazio ✓ |
| `grep -rn "Tip: Run\|Disable color output" src/ test/` | 1 ocorrência, em `test/core/cli-is-json-run.test.ts:19` — fixture sintética do programa de teste, **pré-existente** (veio de `804427b6` no lote LF1), não é string do CLI do fork ✓ |
| `grep -n COMMAND_REGISTRY test/…/fish-generator.test.ts` | só dentro do comentário que documenta o teste pulado ✓ |

### Script Fish gerado (`node bin/openspec.js completion generate fish`)

| Verificação | Esperado | Obtido |
|---|---|---|
| `__fish_openspec_using_subcommand` | 0 | **0** ✓ |
| 4 helpers novos (`using_command_path`, `completing_option_value`, `complete_attached_short_path`, `positional_index`) | 4 | **4** ✓ |
| `complete -c openspec -l no-color -f -d 'Desativa cores na saída'` | 1 linha | presente ✓ |
| regras `^complete` sem `-f` nem `-F` | vazio | **vazio** ✓ |
| `using_command_path init' -F` / `update' -F` | 2 | **2** ✓ |
| total de ` -F` | 2 | **2** ✓ |
| `__fish_openspec_using_command_path config get -- --scope` | presente | 10 ocorrências ✓ |
| `not … change show; and not … change list` | presente | 3 ✓ |
| `\$EDITOR` (escapado) | 0 | **0** ✓ |
| `no $EDITOR` (literal) | ≥1 | 1 ✓ |
| `head -1` | `# Fish completion script for BR-OpenSpec CLI` | ✓ |
| `__fish_openspec_schemas` | 0 | **0** ✓ |

Validação em runtime do Fish **não** executada: `fish` não está instalado nesta máquina (o brief §8.8 já previa que a validação obrigatória é via testes + greps).

### Smokes manuais (projeto temporário)

- `schema fork spec-driven meu-fluxo` → 8 comentários e 5 block scalars preservados; `diff` contra a origem mostra só `name:` e a normalização de flow style de §7.3.
- `schema fork meu-fluxo meu-fluxo --force` → `Erro: Não é possível copiar o esquema 'meu-fluxo' sobre ele mesmo; escolha um nome de destino diferente`, exit **1**, destino intacto.
- `schema init rapido --artifacts proposal,tasks --default --json` → `created: true, setAsDefault: true`; `openspec/config.yaml` = `schema: rapido` (sem `defaultSchema`); `openspec new change teste` → `.openspec.yaml` com `schema: rapido` e o CLI anunciando `(esquema: rapido)`. **O fix #1708 funciona ponta a ponta no fork.**
- `printf 'schema: [x\n' > openspec/config.yaml; schema init outro --artifacts proposal --default` → `Erro: Não é possível definir o esquema padrão: config.yaml contém YAML inválido`, exit **1**, config byte a byte igual (md5 idêntico), `openspec/schemas/outro/` **não** criado.
- `ls -a openspec/schemas openspec` após os smokes → nenhum `.fork-staging-*`, `*.fork-backup-*`, `.init-staging-*`, `*.init-backup-*`, `.schema-init-config-*`.
- `mkdir openspec/schemas/.init-staging-x` + `schema which --all` → 0 ocorrências de `init-staging` na saída.
- Dica de completions sob pty (`script -qec`, `XDG_CONFIG_HOME`/`HOME` temporários, `CI` desligado): 1ª execução → a dica sai **depois** da saída do comando, em stderr; `config.json` fica com `telemetry.{noticeSeen,anonymousId}` **preservados** + `completionTipSeen: true`. 2ª execução → sem dica.
- Run `--json` e run com stderr não-TTY → stdout JSON válido, 0 ocorrências de `completion install`, e **`completionTipSeen` ausente** do `config.json` (adiada, não consumida). Nota: o `config.json` *existe* nesses casos, mas por causa do `anonymousId` que a telemetria do fork grava na primeira execução — comportamento pré-existente, alheio a este porte (o brief §9 supunha o arquivo ausente).
- `CI=yes` → nenhum `config.json`. `OPENSPEC_NO_COMPLETIONS=1` → sem dica; `config.json` só com a chave de telemetria.
- `change validate <change inválida>` → exit **1** (fixado pelo e2e `validate-scenario-loss.test.ts`, verde) e, sob pty com config novo, a dica sai mesmo assim e `completionTipSeen` é gravado.
- `npm pack --dry-run | grep -ci postinstall` → **0**.

### Sugestão para o changeset do fork (fechamento, D3)

> `schema fork` preserva os comentários e a formatação do `schema.yaml` de origem e passa a ser uma operação atômica (staging, backup e verificação de alterações concorrentes). `schema init --default` volta a funcionar: grava a chave `schema:` que o carregador de configuração realmente lê (antes gravava `defaultSchema:`, que nada consumia), atualiza em lugar o `config.yaml`/`config.yml` existente e reverte tudo em caso de falha. Os diretórios temporários de staging/backup ficam fora da descoberta de esquemas. O pacote não traz mais scripts de instalação do npm (`postinstall`); a dica sobre `openspec completion install` agora é impressa uma única vez pela própria CLI, em stderr, na primeira execução interativa — `OPENSPEC_NO_COMPLETIONS=1` a suprime. As completions do Fish deixam de cair no fallback de nomes de arquivo.

---

## 9. Dúvidas abertas

1. **`docs/pt-BR/cli.md` do parágrafo de completions.** O brief §4 propõe "As completions são opt-in…", usando "completions" (sem tradução) porque a seção do fork já usa esse termo. O glossário do lote diz `capability`/`workflow`/`skill` mantidos, mas não menciona `completion`. Confirmar com o lote G se o termo fica assim ou vira "autocomplete" (o catálogo do CLI usa "autocomplete do shell" — há uma inconsistência CLI × docs herdada).
2. **`CLI_DESCRIPTIONS` importado por um gerador de completions.** `fish-generator.ts` agora importa do catálogo (para `--no-color`); `powershell-generator.ts` já fazia isso. Os geradores bash/zsh não importam — se algum dia precisarem, vale padronizar. Não é dívida de porte, só de coerência.
3. **`SECURITY.md` fora do lote.** Enquanto o lote de docs não rodar, `SECURITY.md` afirma que o pacote publica `scripts/postinstall.js` e descreve um script que não existe mais. É a única afirmação **factualmente falsa** deixada em pé por este lote; se o lote G demorar, vale um commit pequeno só com os 2 hunks + o de `scripts/README.md`.
4. **Política de chaves órfãs (M8) segue indefinida.** D28 mandou não remover `removingExistingSchema` neste lote, mas não decidiu o destino dela. Sugestão: um commit único de limpeza no fechamento, cobrindo as 3 órfãs conhecidas.
5. **`zsh-installer.isInstalled()` usa `fs.access`, os outros três usam `stat().isFile()`.** Divergência do próprio upstream (que não uniformizou). Um diretório no caminho de instalação conta como "instalado" só no zsh. Endurecer seria uma divergência consciente do fork — não foi feito, por paridade. Confirmar se vale abrir issue no upstream.

# Relatório do Lote L0 — Base de segurança de caminhos (9cd845fc)

Branch: `sync/upstream_20260901` · Commit do fork: `78a796b` — `fix(security): portar guarda de caminhos de artefatos do upstream v1.8.0`.

## 1. Commits portados

| Upstream | Título | Status |
|---|---|---|
| `9cd845fc` | fix(security): keep paths on a short leash (#1499) | **Portado (parcial por decisão)** — tudo exceto `src/core/file-state.ts` (D1) |

## 2. O que foi portado (src/)

| Arquivo do fork | Hunks aplicados |
|---|---|
| `src/utils/file-system.ts` | Novos `assertPathWithin`, `resolveProjectArtifactPath`, `assertProjectArtifactPath`, privados `isPathWithin` e `canonicalizePotentialPath`. Mensagens via `FILE_SYSTEM_MESSAGES`. |
| `src/commands/change.ts` | Import de `FileSystemUtils`; 7 `assertPathWithin` (show ×4, list ×2) + guarda `isChangeDirectoryName` em `validate()` antes do `fs.access`. |
| `src/commands/schema.ts` | `validateSchema` só procura template em `templates/` + issue `templateOutsideTemplatesDir`; `resolveSchemaCopyPath`, `copyDirRecursive(src, dest, allowedRoot, ancestors)`, `assertSchemaTreeCanBeCopied`; `exitCode=1` fora do `else` (vale para `--json`) em `validate --all` e `validate <name>`; `fork` usa `trustedSourceDir = realpathSync(sourceDir)` e valida a árvore antes de remover o destino. |
| `src/commands/spec.ts` | `import path, { join }`; `assertSpecPath(specsDir, specPath)`; `parseSpecFromFile(specsDir, …)`, `printSpecTextRaw(specsDir, …)`; asserts em `show`, `list` e `validate` (×2). |
| `src/commands/workflow/instructions.ts` | Import `resolveArtifactOutputPath`; `tracksPath = resolveArtifactOutputPath(changeDir, tracksFile)`. |
| `src/commands/workflow/templates.ts` | `templatesDir` + `assertPathWithin` por artefato; erro `WORKFLOW_MESSAGES.templateOutsideTemplatesDir`. |
| `src/core/archive.ts` | `copySymbolicLink`; `copyDirRecursive` com `mkdir(dest)` exclusivo + ramos dir/symlink/file/else; `moveDirectory` move change-symlink como link; loop de raízes `[targetPath, changesDir]`, `[changesDir, archiveDir]`, `[targetPath, mainSpecsDir]` após o check `noChangesDir`; `folderStyleNameProblem(changeName, ID_MESSAGES.changeNameLabel)` após a seleção. |
| `src/core/id.ts` (**novo**) | Só `folderStyleNameProblem` (mensagens em `ID_MESSAGES`). |
| `src/core/artifact-graph/index.ts` | Exporta `resolveArtifactOutputPath`. |
| `src/core/artifact-graph/instruction-loader.ts` | Import; `loadTemplate` com `assertPathWithin(templatesDir, …)` → `TemplateLoadError`; `Object.hasOwn(projectConfig.rules, artifactId)`; `formatChangeStatus.resolvedOutputPath` via `resolveArtifactOutputPath`. |
| `src/core/artifact-graph/outputs.ts` | Substituído pelo conteúdo upstream (`resolveArtifactOutputPath`, `assertGlobDirectoryTraversal`, `followSymbolicLinks: true` + confinamento por match). String do ciclo → `ARTIFACT_GRAPH_MESSAGES.linkedDirectoryCycle`. |
| `src/core/artifact-graph/resolver.ts` | `getSchemaCandidateDir`; guarda de nome em `getSchemaDir` (`''`, `.`, `..`, separadores, drive, absoluto → `null`). |
| `src/core/artifact-graph/types.ts` | `relativePathSchema(field)` para `generates`, `template` e `apply.tracks` (mensagens PT-BR mantendo nome técnico do campo). |
| `src/core/init.ts` | `throw setupFailedFor` após o resumo; asserts nos dirs de `createDirectoryStructure` (×2), `skillFile`, `configPath`; `removeSkillDirs(projectPath, skillsDir)`; título `setupIncompleteTitle` quando há falhas. |
| `src/core/project-config.ts` | `parsedRules = Object.create(null)` (comentário traduzido). |
| `src/core/specs-apply.ts` | `SpecUpdate.sourceRoot/targetRoot`; `isLexicallyWithin`, `resolveTrustedSpecPath`, `assertTrustedSpecPath`; `findSpecUpdates` rebaseia nas raízes canônicas; rechecagem antes de ler source/target e antes de escrever. |
| `src/core/update.ts` | Asserts de `skillFile` (×2), `removeSkillDirs/removeUnselectedSkillDirs(projectPath, …)` com guarda antes do `rm`, comandos via `resolveCommandArtifactPath`, `throw updateFailedFor` após "Reinicie sua IDE". |
| `src/core/validation/validator.ts` | `mainSpecFile` + `assertPathWithin(dirname, file)`; `findScenarioLossIssues(…, mainSpecRoot)` re-checa antes do `readFile`. |
| `src/utils/spec-discovery.ts` | `assertDiscoveredSpecPath(specsRoot, capabilityDir, specFile)` aplicado a arquivos e symlinks; docstring traduzida. |
| `src/messages/index.ts` | 20 chaves novas (ver §4). |

### 2.1 Adaptações específicas do fork

1. **`src/core/tools-manager.ts` (fork-only, D23):** `removeOpenSpecSkillDirs(projectPath, skillsDir)` com `assertProjectArtifactPath` antes do `rm`; `removeOpenSpecCommandFiles` e `addTool` usam a resolução confinada; `removeTool` passa `projectPath`.
2. **Codex (adapter de comandos mantido no fork — `79f1dac6` adiado, ver _COMPLETUDE L1):** `resolveProjectArtifactPath` do upstream recusa caminhos absolutos, o que quebrava `init --tools all`, `init --tools codex` e o upgrade legado do Codex (3 testes existentes). Adaptação:
   - `ToolCommandAdapter.getArtifactRoot?()` (opcional) em `src/core/command-generation/types.ts`;
   - `codexAdapter.getArtifactRoot()` → `<CODEX_HOME>/prompts`;
   - novo `src/core/command-generation/artifact-path.ts` com `resolveCommandArtifactPath(projectPath, adapter, cmdPath)`: caminho absoluto + raiz declarada → `assertPathWithin(raiz, caminho)` (links para fora recusados; a raiz pode ser symlink, é tratada como sua própria raiz de confiança); senão → `resolveProjectArtifactPath`.
   - Usado nas 7 chamadas de comando (init ×1, update ×4, tools-manager ×2). `FileSystemUtils.resolveProjectArtifactPath` continua fiel ao upstream (é a base para os lotes D/F).
3. **`archive.ts`:** sem `ArchiveBlockedError`/`--json` no fork → `throw new Error(<PT-BR>)`. `root.path` do upstream = `targetPath` (`'.'`) do fork.
4. **`src/core/id.ts`:** criado mínimo; `KEBAB_ID_*`/`isKebabId` ficam para o porte de stores.

## 3. Pulado (com motivo)

| Hunk | Motivo |
|---|---|
| `src/core/file-state.ts` (locks com token, `0o600`, fsync tolerante) | Fork não tem o arquivo — stores/workspace beta (D1). |
| `test/core/file-state.test.ts` | Idem (D13). |
| `.changeset/tidy-path-leash.md` | D3. |
| `instruction-loader.ts` — `resolvedOutputPath: resolveArtifactOutputPath(...)` dentro de `generateInstructions` | O retorno do fork não tem `resolvedOutputPath`/`existingOutputPaths` (vieram com stores). O hunk equivalente em `formatChangeStatus` **foi** aplicado. |
| `archive.ts` — `ArchiveBlockedError('archive_path_outside_root' / 'archive_change_name_invalid')` | Fork sem `ArchiveBlockedError`; substituído por `Error`. |
| `id.ts` — `KEBAB_ID_REGEX`, `isKebabId`, `KEBAB_ID_DESCRIPTION`, `KEBAB_ID_FIX` | Stores. |

## 4. Strings adicionadas ao catálogo (`src/messages/index.ts`)

| Seção | Chave | Texto |
|---|---|---|
| `FILE_SYSTEM_MESSAGES` | `pathOutsideAllowedDirectory(p)` | `O caminho está fora do diretório permitido: ${p}` |
| | `refusingArtifactOutsideProject(p)` | `Recusando gerenciar um artefato fora do projeto: ${p}` |
| | `danglingSymbolicLink(p)` | `Não foi possível verificar um link simbólico pendente (dangling): ${p}` |
| | `noExistingParent(p)` | `Não foi possível resolver um diretório pai existente para ${p}` |
| `SCHEMA_MESSAGES` | `templateOutsideTemplatesDir(template)` | `Arquivo de template '${t}' aponta para fora do diretório de templates do esquema` |
| | `cannotForkLinkedEntry(p, detail?)` | `Não é possível copiar o esquema com uma entrada vinculada (link) ou não suportada: ${p}` (+ `: ${detail}`) |
| | `cannotForkLinkedCycle(p)` | `Não é possível copiar o esquema com um ciclo de diretórios vinculados (links): ${p}` |
| `WORKFLOW_MESSAGES` (bloco templates.ts) | `templateOutsideTemplatesDir(template, artifactId)` | `Template '${t}' do artefato '${id}' aponta para fora do diretório de templates do esquema` |
| `ARCHIVE_MESSAGES` | `unsupportedFilesystemEntry(p)` | `Não é possível arquivar uma entrada de sistema de arquivos não suportada: ${p}` |
| | `pathOutsideRoot(p)` | `Recusando arquivar por um caminho fora da raiz do BR-OpenSpec: ${p}` |
| `ARTIFACT_GRAPH_MESSAGES` | `linkedDirectoryCycle(p)` | `Não é possível resolver as saídas do artefato por um ciclo de diretórios vinculados (links): ${p}` |
| | `fieldRequired(field)` | `O campo ${field} é obrigatório` |
| | `fieldMustBeRelativePath(field)` | `O campo ${field} deve ser um caminho relativo dentro do diretório permitido` |
| `INIT_MESSAGES` | `setupIncompleteTitle` | `Configuração do BR-OpenSpec Incompleta` |
| | `setupFailedFor(names)` | `A configuração do BR-OpenSpec falhou para: ${names}` (D15) |
| `UPDATE_MESSAGES` | `updateFailedFor(names)` | `A atualização do BR-OpenSpec falhou para: ${names}` (D15) |
| `ID_MESSAGES` (**nova seção** `// Core — Identificadores (src/core/id.ts)`) | `mustNotBeEmpty(label)` | `${label} não pode estar vazio` |
| | `mustNotBe(label, value)` | `${label} não pode ser '${value}'` |
| | `mustNotContainPathSeparators(label)` | `${label} não pode conter separadores de caminho` |
| | `changeNameLabel` | `O nome da alteração` |

Total: 20 chaves. Nenhuma chave removida. Mensagens Zod **pré-existentes** em `types.ts` (`Artifact ID is required`, `Version must be a positive integer`, …) permanecem em EN (dívida pré-existente registrada no brief §4).

## 5. Testes

### Portados/adaptados (só strings)
- `test/commands/schema.test.ts`: +4 (`validate` symlink de template; `fork` rejeita link p/ fora; dereferencia link confinado; raiz linkada). Asserções: `'fora do diretório de templates do esquema'`, `'Não é possível copiar o esquema com uma entrada vinculada'`, `'fora do diretório permitido'`.
- `test/core/archive.test.ts`: +7 (symlinks no fallback EXDEV ×3, destino que vira symlink → `EEXIST`, nome traversante, archive linkado p/ fora, raiz via alias). Regex: `/não pode conter separadores de caminho/u`, `/fora da raiz do BR-OpenSpec/u`.
- `test/core/artifact-graph/instruction-loader.test.ts`: +3 (`/fora do diretório permitido/u`).
- `test/core/artifact-graph/outputs.test.ts`: +7 (`/fora do diretório permitido/u`, `/ciclo de diretórios vinculados/u`).
- `test/core/artifact-graph/resolver.test.ts`: +2 + 1 `expect` (`/não encontrado/u`).
- `test/core/artifact-graph/schema.test.ts`: `it.each` (6 casos) + `apply.tracks` (`/caminho relativo dentro/u`).
- `test/core/commands/change-command.show-validate.test.ts`: +3 (`/fora do diretório permitido/u`, `/não encontrada em/u`).
- `test/core/commands/spec-command.security.test.ts`: **novo** (4 testes).
- `test/core/init.test.ts`: +2 (`'A configuração do BR-OpenSpec falhou para: Claude Code'`, `'Configuração do BR-OpenSpec Incompleta'`).
- `test/core/project-config.test.ts`: +1.
- `test/core/specs-apply.security.test.ts`: **novo** (6 testes). Adaptação: `writeUpdatedSpec` do fork não tem `options.silent` → 4º argumento removido e `console.log` mockado no `beforeEach`.
- `test/core/update.test.ts`: +2; `should handle tool update failures gracefully` → `should report tool update failures to automation` com `rejects.toThrow('A atualização do BR-OpenSpec falhou para: Claude Code')`; idem em `should continue updating other tools when one fails` (D19).
- `test/utils/spec-discovery.test.ts`: 3 testes de symlink reescritos com `it.skipIf(win32)` + 2 novos (`elsewhere in the specs root`, `rejects … outside the specs root`).
- `test/core/tools-manager.test.ts` (fork-only): nova assinatura `removeOpenSpecSkillDirs(testDir, skillsDir)`; +1 teste `.claude` linkado p/ fora (`removeTool` recusa); +2 testes Codex (`prompts` globais gravados em `CODEX_HOME/prompts`; prompt linkado p/ fora recusado).

### Pulados
- `test/core/file-state.test.ts` (D1/D13).

### Resultado
- `pnpm exec tsc --noEmit` ✓ · `node build.js` ✓ · `pnpm lint` ✓
- `pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts`: **93 arquivos / 2974 testes passando**.
- Paridade (`skill-templates-parity.test.ts`): passa (o lote não toca templates).
- Smoke via `bin/openspec.js`: `change validate ../../x` → "não encontrada em"; `spec show ../../x` → "fora do diretório permitido"; `proposal.md` → symlink para `/etc/hostname` → erro sem imprimir o alvo; `schema validate spec-driven --json` → exit 0.

## 6. Hunks de docs pendentes para o lote de docs (G)

O commit `9cd845fc` **não toca** `docs/`, `schemas/`, `openspec/specs/`. Nada pendente. Observação opcional para o lote G: `docs/customization.md` / `docs/pt-BR/customization.md` já dizem que o template fica em `templates/` — coerente com a remoção do fallback na raiz do schema; nenhuma alteração necessária.

## 7. Divergências em relação ao brief

- Brief §9 esperava `grep "path.isAbsolute(cmd.path)\|path.isAbsolute(cmdPath)" src` vazio. Restam ocorrências em `src/core/shared/tool-detection.ts` e `src/core/profile-sync-drift.ts`: são caminhos **somente-leitura** de detecção (`existsSync`), que o upstream também mantém intactos neste commit — não portam guarda.
- Brief não previa o impacto no Codex (fork mantém o adapter de comandos globais). Resolvido com `getArtifactRoot`/`resolveCommandArtifactPath` (§2.1 item 2). Contagem de call-sites: `assertPathWithin(` 28, `resolveProjectArtifactPath(` 2 (helper + `artifact-path.ts`), `assertProjectArtifactPath(` 11, `resolveCommandArtifactPath(` 8.

## 8. Dúvidas abertas / registro

1. **`79f1dac6` (Codex skills-only) continua adiado** — a adaptação `getArtifactRoot` é a ponte enquanto o adapter global do Codex existir no fork. Se `79f1dac6` for portado depois, `artifact-path.ts` pode ser simplificado (ou mantido como extensão genérica).
2. Mensagens Zod pré-existentes em EN em `types.ts` (dívida pré-existente, fora do escopo).
3. Lotes seguintes que dependem deste (`161f9454`, `59bfb27a`, `7a4a745d`, `73207a6f`, `109f81f1`, `c747ed1f`, `2fa679f1`, `dd7cea3f`, `521ee33e`, `18688c8b`, `8127c7b7`, `a2b965aa`, `a72a74de`/`17581c11`): usar `resolveCommandArtifactPath(projectPath, adapter, cmd.path)` para comandos gerados (não `resolveProjectArtifactPath` direto), para não quebrar o Codex do fork.

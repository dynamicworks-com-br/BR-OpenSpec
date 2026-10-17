# Relatório do lote LD4 — Ferramentas lote 3

**Branch:** `sync/upstream_20260901`
**Commits criados (2, na ordem):**

| Hash | Título |
|---|---|
| `85bab50a15ec69628809d373ecaec79e7dc3d617` | `feat(tools): portar Zed Agent, sync nos profiles, argumentos no OpenCode, Antigravity em .agents e reinício de IDE condicional no update do upstream v1.10.0–v1.11.0` |
| `61815a6d98df47ce73dfa3a5e825c8ed44c51b78` | `fix(pi): injetar argumentos nos comandos gerados com os rótulos PT-BR` |

Commits do upstream portados (nesta ordem): `a72a74de`, `f3aa167d`, `cf06d45f`,
`15e50d68`, `109f81f1`. **Nenhum hunk de `src/` ficou sem porte ou sem
justificativa.** Os únicos hunks não aplicados são `.changeset/**` (D3),
`docs-lab/**` (D4) e `docs/**` (reservado ao lote G — inventário na §6).

---

## 1. O que foi portado

### 1.1 `a72a74de` — dica de reinício de IDE condicional no `update`

`src/core/update.ts`:
- `const updatedToolIds: string[] = []` ao lado de `updatedTools`;
  `updatedToolIds.push(tool.value)` no caminho de sucesso do loop principal.
- No fim de `execute()`, a linha `UPDATE_MESSAGES.restartIDE` passou a ser
  gateada por `shouldRestartIde`: alguma ferramenta em
  `affectedToolIds = uniq([...newlyConfiguredTools, ...updatedToolIds])` precisa
  ter `requiresIdeRestart` **e** gerar comandos ou skills sob a `delivery` ativa
  (`shouldGenerateCommandsForTool` / `shouldGenerateSkillsForTool`, por
  ferramenta — não os booleanos globais). A linha em branco continua
  incondicional e o `throw` de `updateFailedFor` continua **depois** do gate.

`shouldGenerateSkillsForTool` já estava importado no fork (veio de lotes
anteriores), então não foi preciso mexer no bloco de imports.

### 1.2 `f3aa167d` — Zed Agent

`src/core/config.ts`: entrada nova em `AI_TOOLS`, entre `Trae` e o comentário do
alvo `agents`:
`{ name: 'Zed Agent', value: 'zed', available: true, successLabel: 'Zed Agent', skillsDir: '.agents', detectionPaths: ['.zed', '.agents/skills'] }`
— skills-only (sem adapter), sem `requiresIdeRestart` (como no upstream).

O hunk de `src/core/init.ts` (`sharedAgentsTargets`/`sharedTargetOwner`) foi
**deliberadamente pulado**: é transitório e `109f81f1` o substitui. `validateTools`
foi escrito direto na forma final do tip (§1.5) e os testes de `f3aa167d` foram
portados já na forma final — conforme LD-f3aa167d §6/§7 e LD-109f81f1 §6.

### 1.3 `cf06d45f` — `sync` como dependência de `archive`

- `src/core/profiles.ts`: `getProfileWorkflows('custom', …)` injeta `sync`
  imediatamente antes do primeiro `archive`/`bulk-archive` quando ele falta;
  devolve a **mesma referência** quando nada precisa ser injetado e nunca muta a
  entrada. JSDoc atualizado (mantido em EN, idioma do arquivo).
- `src/core/update.ts`: as **duas** chamadas de `displayMissingCoreWorkflowsNote`
  passam `desiredWorkflows` em vez de `globalConfig.workflows`.
- `src/core/update.ts` (`upgradeLegacyTools`): o hunk `inferredCodexWorkflows`
  **foi aplicado** (D20 — o fork já tem `79f1dac6`, então
  `getLegacyWorkflowIdsForTool` existe): os workflows inferidos dos prompts
  legados do Codex passam por `getProfileWorkflows('custom', …)` + filtro
  `ALL_WORKFLOWS`. O brief LD-cf06d45f §7 mandava pular esse hunk assumindo
  `79f1dac6` adiado — **o brief está desatualizado nesse ponto**.
- `src/commands/config.ts`: `workflowSelectionChanged`; o perfil só é
  re-derivado quando a seleção mudou de fato; `config.workflows` só é
  sobrescrito quando o perfil atual não é `custom` **ou** a seleção mudou.

### 1.4 `15e50d68` — argumentos nos comandos do OpenCode

`src/core/command-generation/adapters/opencode.ts`: `injectOpenCodeArgs` insere
o rótulo logo após o **bloco completo** do contrato de entrada (linha do
marcador + linhas de continuação até a primeira linha em branco), preserva o EOL
(LF/CRLF) e é pulado quando o corpo já tem `$ARGUMENTS`/`$N` ou declara entrada
dispensável.

### 1.5 `109f81f1` — Antigravity `.agent` → `.agents` e arbitragem da raiz compartilhada

- `src/core/config.ts`: Antigravity vira
  `skillsDir: '.agents'`, `legacySkillsDirs: ['.agent']`,
  `detectionPaths: ['.agent', '.agents/workflows']`, mantendo
  `requiresIdeRestart: true` e o bloco de comentário do upstream. Passam a
  existir **4** entradas com `skillsDir: '.agents'` (antigravity, codex, zed,
  agents).
- `src/core/command-generation/adapters/antigravity.ts`: `.agent/workflows` →
  `.agents/workflows`.
- `src/core/legacy-cleanup.ts`: só o comentário de 6 linhas; o padrão
  `.agent/workflows/openspec-*.md` **não** mudou.
- `src/core/available-tools.ts`: `hasIndependentDetectionPath` — uma ferramenta
  com caminho de detecção que **não** termina em `/skills` é mantida mesmo quando
  outra é a dona da raiz compartilhada.
- `src/core/shared-skill-target.ts`: `hasLegacySkills` exportada; import de
  `resolveCommandSurfaceCapability`; nova `resolveSharedSkillWriters`
  (**verbatim** do upstream — ver §2.1).
- `src/core/shared/tool-detection.ts` (`getConfiguredTools`): nas duas
  passagens, cláusula `adapter-backed && hasLegacySkills`; na 2ª passagem,
  também `toolHasAnyConfiguredCommand`.
- `src/core/migration.ts`: `LEGACY_TOOL_ROOTS.antigravity` com timing
  `after-generation`; `migrateCommandFiles` ganha `requireDestination`, usa
  `FileSystemUtils.resolveProjectArtifactPath` nas duas pontas e normaliza
  separadores Windows (`split(/[\\/]/).join(path.sep)`);
  `scanInstalledWorkflowArtifacts` renomeia `includeLegacySkills` →
  `includeLegacyRoots` e passa a procurar comandos também nas raízes legadas.
- `src/core/init.ts`: `ValidatedInitTool.writesSkills`; `validateTools`
  reescrito na forma final do tip (`generationTools`, `sharedSkillRootOwner`,
  `resolveSharedSkillWriters`, log dim por raiz com ≥ 2 ferramentas);
  `generateSkillsAndCommands` gateia geração e remoção de skills em
  `tool.writesSkills`.
- `src/core/update.ts`: `resolveSharedSkillWriters` no loop principal (usando o
  `configuredAndNewTools` já hoisted no fork) e em `upgradeLegacyTools`
  (`arbitrationTools`); `writesSkills` gateia as duas gerações/remoções de
  skills; a guarda de `07dea6ed` virou
  `sharedOwner = shouldGenerateSkills && !writesSkills ? … : undefined` +
  `if (sharedOwner && !shouldGenerateCommands)`; o import de
  `sharedSkillRootOwner` saiu de `update.ts` (a função continua exportada e
  testada).

---

## 2. Adaptações e divergências do fork

### 2.1 F1–F3 do brief LD-109f81f1 **não** foram aplicadas (O5/D20)

O brief prescrevia três adaptações obrigatórias assumindo `79f1dac6` adiado
(Codex ainda `adapter-backed`). O fork **já portou `79f1dac6`** (commit
`e0c50fd`): não existe `adapters/codex.ts`, `CommandAdapterRegistry.has('codex')`
é `false` e `resolveCommandSurfaceCapability('codex')` é `'skills-invocable'`.
Logo:

- **F1** (tratar `codex` como skills-native em `resolveSharedSkillWriters`):
  desnecessária — o filtro `!== 'adapter-backed'` já inclui o Codex. Portado
  verbatim.
- **F2** (skip total do Codex em `upgradeLegacyTools`): desnecessária e errada —
  `shouldGenerateCommandsForTool('codex', …)` já é sempre `false`, então a
  condição do upstream (`sharedOwner && !shouldGenerateCommands`) mantém o skip
  do Codex sozinha. Portado verbatim; o teste de `07dea6ed`
  (`/Codex ignorado/`) continua verde.
- **F3** (excluir `codex` de `adapter-backed && hasLegacySkills`):
  desnecessária — o Codex não é `adapter-backed`, então a cláusula nunca o
  alcança. Portado verbatim.
- **F4** (isolar `CODEX_HOME` em `init.test.ts`): já satisfeito desde o lote LD3.
- **Forma dupla (`$openspec-*` + `/openspec-*`)**: as 6 asserções `(dual)` foram
  portadas **verbatim** e passam — o fork já renderiza a árvore do Codex em forma
  dupla sob `delivery: both`.

### 2.2 Adapters PT-BR (marcador e rótulo)

`opencode.ts` e `pi.ts` casam `**Entrada**` (tolerando `**Input**` para um corpo
escrito à mão em inglês) e, no OpenCode, `Nenhuma necessária` (tolerando
`None required`). O rótulo injetado vem de
`COMMAND_ADAPTER_MESSAGES.providedArguments(placeholder)` (chave criada no lote
LD3, G10/D27) — o mesmo mecanismo já usado pelo `command-code.ts`. Copiar o
regex do upstream seria um no-op silencioso: nenhum template do fork tem
`**Input**`.

### 2.3 `INIT_MESSAGES.sharedSkillsRootOneTree` — texto atualizado

A chave já existia (criada em `59bfb27a`) com a assinatura genérica correta
`(names, root, owner)`, mas com o texto específico do par Codex+agents. O texto
foi atualizado para a forma final do tip; a assinatura **não** mudou e nenhuma
chave foi removida:

```
`${names} compartilham ${root}/skills; escrevendo uma única árvore para ${owner}.`
```

Exemplo real: `Antigravity, Codex compartilham .agents/skills; escrevendo uma única árvore para codex.`

### 2.4 `src/core/tools-manager.ts` (D23' — arquivo fork-only)

`addTool` passou a consultar `resolveSharedSkillWriters(projectPath, [tool, …configuradas com o mesmo skillsDir])` **mas apenas para ferramentas
`adapter-backed`**:

```ts
const writesSkills =
  !tool.skillsDir ||
  resolveCommandSurfaceCapability(tool.value) !== 'adapter-backed' ||
  resolveSharedSkillWriters(projectPath, sharedRootTools).has(tool.value);
```

Motivo da divergência: os testes existentes `takes ownership of the shared
.agents tree` / `hands the shared .agents tree back to agents` codificam a
semântica deliberada do fork "em `openspec tools --add`, a seleção explícita
assume a posse da raiz" para o par codex↔agents (dois renderizadores
skills-native, ambos compatíveis). Aplicar a arbitragem crua quebraria esses dois
testes — e a instrução do lote proíbe alterar a lógica de um teste existente. O
risco real que D23' aponta (`--add antigravity` sobrescrevendo uma árvore do
Codex com referências só genéricas) é exatamente o caso `adapter-backed`, que a
condição cobre. Teste novo: `keeps a Codex-rendered .agents tree when Antigravity
is added later`.

`removeTool` não foi tocado (já usa `resolveSharedSkillTargetOwner` /
`clearSharedSkillTarget`).

### 2.5 Outras

- Comentários e JSDoc em `src/` permanecem em **inglês** (padrão do fork); só as
  strings exibidas são PT-BR.
- `owner?.value ?? ''` no call site do log dim: a chave do catálogo exige
  `string` e o `find` do upstream é `AIToolOption | undefined`. Ramo
  inalcançável (o grupo sempre tem um escritor), mas evita `!` e mantém o `tsc`
  limpo.
- Nomes de ferramenta (`Zed Agent`, `Antigravity`) **não** foram traduzidos.
  Renames do fork (Zoo Code, Devin Desktop) intactos; a linha do Zed entra
  depois de Trae, como no upstream.

---

## 3. Strings adicionadas / alteradas no catálogo

| Chave | Seção | Situação |
|---|---|---|
| `INIT_MESSAGES.sharedSkillsRootOneTree(names, root, owner)` | `INIT_MESSAGES` | **texto atualizado** para a forma genérica do tip (assinatura inalterada) + comentário revisto |

**Nenhuma chave nova foi criada** e nenhuma foi removida ou anglicizada nos dois
commits deste lote:

- `a72a74de` reutiliza `UPDATE_MESSAGES.restartIDE` e `updateFailedFor`.
- `f3aa167d` só acrescenta um nome de produto em `AI_TOOLS`.
- `cf06d45f` não tem strings novas.
- `15e50d68` e o `fix(pi)` consomem `COMMAND_ADAPTER_MESSAGES.providedArguments`
  (criada no lote LD3, conforme G10/D27) com os placeholders `$ARGUMENTS` e
  `$@`, que são literais das ferramentas e não são traduzidos.
- `109f81f1` reutiliza `UPDATE_MESSAGES.skippedSharedSkillRoot`,
  `MIGRATION_MESSAGES.skippingLegacyCommandOutsideProject`,
  `migratedToolContent` e `keptInPlaceNotice`.

---

## 4. Testes portados / adaptados

| Arquivo | O que entrou | Adaptação |
|---|---|---|
| `test/core/update.test.ts` (`a72a74de`) | asserção de "Reinicie sua IDE" em `should continue updating other tools when one fails`; novo `should not suggest an IDE restart when only the IDE tool fails`; `should suggest IDE restart after update` **renomeado e invertido** para `should not suggest an IDE restart for CLI-only tools`; novo `should suggest an IDE restart for IDE-resident tools`; asserções negativas em `should only update tools that need updating`, no menu de onboarding com cursor e no upgrade legado com `--force` | `'Restart your IDE'` → `'Reinicie sua IDE'`, `'Updated: …'` → `'Atualizados: …'`, `'OpenSpec update failed for:'` → `'A atualização do BR-OpenSpec falhou para:'` |
| `test/cli-e2e/basic.test.ts` (`f3aa167d`) | `initializes with --tools zed option` (init + marcador `zed\n` + update preservando o marcador + skill com `/openspec-explore` e sem `$openspec-explore`) | `'OpenSpec Setup Complete'` → `'Configuração do BR-OpenSpec Concluída'`; `'Restart your IDE'` → `'Reinicie sua IDE'` |
| `test/core/available-tools.test.ts` (`f3aa167d` + `109f81f1`) | `not.toContain('zed')`/`('antigravity')` nos testes existentes; novos `should detect Zed Agent from its project configuration directory`, `should use the shared-root marker to detect a configured Zed Agent target`, `should detect Antigravity from its legacy .agent directory`, `should detect Antigravity from .agents/workflows`, `should retain Antigravity when another tool owns the shared skills root` | nenhuma (sem strings de UI) |
| `test/core/init.test.ts` (`f3aa167d`) | `should reconcile Codex and agents…` → `should reconcile Codex, Zed, and agents to one tree all consumers can invoke` (tools `codex,zed,agents`, na **forma final** do tip: `Zed Agent` e `Shared .agents skills` presentes em "Criados:"); novos `should keep a configured Codex tree compatible when Zed is added later` e `should generate Zed skills in the shared .agents directory` | `'Created: Codex'` → `'Criados: Codex'`; `'writing one tree for codex'` → `'escrevendo uma única árvore para codex'` |
| `test/core/init.test.ts` (`109f81f1`) | `it.each(['antigravity,codex','codex,antigravity'])`; `preserves an existing shared owner while adding Antigravity workflows`; `preserves a Codex-owned shared tree when the agents target is added`; `upgrades an Antigravity-owned shared tree when Codex is added`; `migrates generated Antigravity files without touching custom legacy files` | nenhuma (verbatim) |
| `test/core/init.test.ts` (`cf06d45f` / `15e50d68`) | `it.each` `should install the sync workflow required by %s in a custom profile`; asserção de `**Argumentos fornecidos**: $ARGUMENTS` em `should auto-cleanup legacy artifacts…` (prova ponta-a-ponta com template real) | rótulo PT-BR |
| `test/core/profiles.test.ts` (`cf06d45f`) | 4 `it` novos (injeção com `archive`, com `bulk-archive`, `toBe` da mesma referência, não-mutação) | nenhuma |
| `test/commands/config-profile.test.ts` (`cf06d45f`) | `should preserve a custom profile when dependency expansion matches the core set`; `it.each(['delivery','both'])` `should preserve raw custom workflows during a %s change` | `'No config changes.'` → `'Nenhuma alteração na configuração.'` |
| `test/core/update.test.ts` (`cf06d45f`) | `it.each([['opsx-archive.md',…],['opsx-bulk-archive.md',…]])` `should include sync when replacing legacy Codex %s` (**portado**, ao contrário do que o brief previa); `should list missing core workflows when custom profile preserves the old core workflow set` **substituído** por `it.each(['skills','commands','both'])` `should repair an archive profile missing sync with %s delivery` | `'…missing 1 core workflow: update'` → `'…não inclui 1 fluxo de trabalho do core: update'` |
| `test/core/command-generation/adapters.test.ts` (`15e50d68`) | 7 `it` novos no `describe('opencodeAdapter')` (injeção, dedupe `$ARGUMENTS`, dedupe posicional `$1/$2`, bloco multilinha, CRLF, workflow sem entrada, tripwire com templates reais) | corpos sintéticos em PT-BR (`**Entrada**`, `Nenhuma necessária`, `**Argumentos fornecidos**`) |
| `test/core/command-generation/adapters.test.ts` (`109f81f1`) | `antigravityAdapter.getFilePath` → `.agents/workflows` | nenhuma |
| `test/core/migration.test.ts` (`109f81f1`) | `describe('Antigravity .agent -> .agents')` com 6 testes (move após geração, mantém skill divergente, não move comando sem substituto, separadores Windows, inferência de `delivery: both` a partir da raiz legada, arquivo do usuário intacto) + import de `migrateLegacyToolDirs` | nenhuma (verbatim) |
| `test/core/shared-skill-target.test.ts` (`109f81f1`) | `describe('resolveSharedSkillWriters')` com `it.each` de ordem e `prefers an existing generic owner over an adapter-backed writer` | nenhuma (verbatim) |
| `test/core/update.test.ts` (`109f81f1`) | `should refresh Antigravity workflows without rewriting Codex-owned shared skills`; `should upgrade legacy Antigravity workflows beside Codex-owned shared skills`; `arbitrates legacy Antigravity and Codex before writing the shared tree` | nenhuma (verbatim) |
| `test/core/tools-manager.test.ts` (**fork-only**, D23') | `keeps a Codex-rendered .agents tree when Antigravity is added later` | teste novo do fork |
| `test/core/command-generation/adapters.test.ts` (`fix(pi)`) | `should inject template arguments into the input section` passa a usar corpo PT-BR; novo `it.each(['$@','$ARGUMENTS'])` de dedupe; novo tripwire `should preserve invocation arguments for every workflow that accepts them` com `getCommandContents()` | rótulo/marcador PT-BR |

### Reforço anti-falso-verde (tripwires)

O teste #7 do OpenCode usa o mesmo marcador do adapter (`**Entrada**`), então um
regex errado nos dois passaria com `0 == 0`. Foram acrescentadas listas
explícitas de ids: **com** `$ARGUMENTS` → `apply, archive, code-review,
continue, explore, ff, new, propose, sync, update, verify` (11); **sem** →
`bulk-archive, onboard`. O teste do Pi verifica a string literal
`'**Argumentos fornecidos**: $@'` na saída dos templates reais e exige
`['onboard']` como única exceção. A asserção ponta-a-ponta em `init.test.ts`
(`opsx-propose.md` gerado de verdade) fecha o cerco.

### Testes pulados

**Nenhum.** Nenhum dos 5 commits toca stores/workspace, e todo teste do upstream
tem equivalente portado — inclusive o `should include sync when replacing legacy
Codex %s`, que o brief LD-cf06d45f mandava pular (o fork tem o describe de
prompts legados do Codex desde `79f1dac6`).

---

## 5. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.changeset/quiet-cli-update.md`, `.changeset/antigravity-agents-root.md` e demais | D3 — changesets do upstream nunca são importados; o fork escreve o seu no fechamento (lote G) |
| `docs-lab/reference/supported-tools.md` (`109f81f1`) | D4 — docs-lab adiado; a **informação** vai para `docs/` + `docs/pt-BR/` no lote G (§6) |
| `src/core/init.ts` bloco `sharedAgentsTargets/selectedSharedTargets/preserveConfiguredCodex/reconciledToolIds` (`f3aa167d`) | transitório: `109f81f1` o remove por completo. `validateTools` foi escrito direto na forma final do tip |
| `src/core/init.ts` literais EN `Unknown tool '…'` / `Tool '…' does not support skill generation` (contexto do hunk de `109f81f1`) | o fork usa `INIT_MESSAGES.unknownTool` / `toolNoSkillSupport` |
| Todos os hunks de `docs/**` dos 5 commits | reservados ao lote G (D7) — inventário completo na §6 |
| `website/**`, `openspec/changes/**`, `skills/**`, `CHANGELOG.md` | nenhum dos 5 commits toca esses caminhos |
| `openspec/specs/**`, `schemas/**`, `src/core/templates/**` | nenhum dos 5 commits toca esses caminhos; paridade de skills não é afetada (D5) |

---

## 6. Hunks de docs pendentes para o lote G

**Prioridade alta — a documentação está factualmente errada até o lote G:**
`docs/supported-tools.md:67` e `docs/pt-BR/supported-tools.md:52` ainda dizem que
o Antigravity escreve em `.agent/skills/` e `.agent/workflows/`. O código já
escreve em `.agents/`.

| Origem | Arquivo(s) | Mudança |
|---|---|---|
| `f3aa167d` | `docs/cli.md:95`, `docs/pt-BR/cli.md:95` | inserir `` `zed`, `` após `` `trae`, `` na lista de IDs |
| `f3aa167d` | `docs/supported-tools.md:158`, `docs/pt-BR/supported-tools.md:127` | idem na lista **Available tool IDs / IDs de ferramentas disponíveis** |
| `f3aa167d` | `docs/supported-tools.md:34`, `docs/pt-BR/supported-tools.md` (tabela "Como Invocar") | acrescentar "Zed Agent" à linha `none — skills only` |
| `f3aa167d` | `docs/supported-tools.md` (após a linha do Trae, l.95) e espelho pt-BR (l.80) | nova linha: `` \| [Zed Agent](https://zed.dev/docs/ai/skills) (`zed`) \| `.agents/skills/openspec-*/SKILL.md` \| Not generated (skills-only; use `/openspec-*` or `@openspec-*`) \| `` |
| `f3aa167d` | `docs/supported-tools.md` §"When to pick the shared `.agents` target" (l.104-134) e espelho pt-BR (l.100-107) | parágrafo "Selecting it alongside…" mencionando Codex e Zed; parágrafo próprio do Zed (Zed Agent embutido vs External Agents/Terminal Threads, requer [Zed v1.4.2](https://github.com/zed-industries/zed/releases/tag/v1.4.2), [worktree trust](https://zed.dev/docs/worktree-trust)); parágrafo "Because `.agents/skills/` is shared…" citando Codex, Zed Agent e o marcador |
| `f3aa167d` | `docs/commands.md:701`, `docs/pt-BR/commands.md:697` | linha "none — skills only": acrescentar "Zed Agent" |
| `f3aa167d` | `docs/how-commands-work.md:81,117`, `docs/pt-BR/how-commands-work.md:81,111` | tabela + "Quick checks": acrescentar "Zed Agent" |
| `f3aa167d` | `docs/troubleshooting.md:62`, `docs/pt-BR/troubleshooting.md:62` | item 6: acrescentar "Zed Agent" à enumeração de ferramentas somente-skills |
| `109f81f1` | `docs/supported-tools.md:67`, `docs/pt-BR/supported-tools.md:52` | linha do Antigravity: `.agents/skills/openspec-*/SKILL.md` + `.agents/workflows/opsx-<id>.md`, com chamada para a nova nota de rodapé |
| `109f81f1` | `docs/supported-tools.md` (após a nota `***` do Devin) e espelho pt-BR | **nota de rodapé nova `****`**: Antigravity v1.20.5+ lê `.agents/`, `.agent/` só como fallback; `init`/`update` escrevem em `.agents/` e removem de `.agent/` os gerados equivalentes assim que os substitutos existem; arquivos personalizados e gerados alterados ficam em `.agent/` para revisão; a raiz `.agents/skills/` é compartilhada com Codex, Zed e `agents` (escrita uma vez por execução, escritor registrado em `.agents/skills/.openspec-target`), enquanto os workflows próprios continuam em `.agents/workflows/` — texto proposto em LD-109f81f1 §2.5 |
| `109f81f1` | `docs/supported-tools.md:118-119`, `docs/pt-BR/supported-tools.md:100` | **remover/reescrever** "Note `.agents` is not `.agent`: the singular directory belongs to Antigravity." / "Note que `.agents` não é `.agent`: o diretório singular pertence ao Antigravity." → "…o singular `.agent/` é apenas a raiz anterior dele, migrada no próximo `openspec update`." |
| `109f81f1` | `docs/supported-tools.md:134` e espelho pt-BR | "Because `.agents/skills/` is shared…": acrescentar Antigravity à lista de consumidores e ao que o marcador registra |
| `15e50d68` | — | opcional: nota na linha do OpenCode dizendo que os comandos recebem argumentos via `$ARGUMENTS` (não exigido pelo upstream) |
| `cf06d45f` | — | opcional: frase em `docs/cli.md` §`openspec config profile` dizendo que selecionar `archive`/`bulk-archive` instala `sync` automaticamente |
| `a72a74de` | — | nada (o commit não toca docs; a orientação genérica de `troubleshooting.md` e `migration-guide.md` continua correta) |
| Pendências herdadas do lote LD3 | `docs/cli.md`, `docs/supported-tools.md` (+ espelhos) | `command-code` nas listas de IDs, linha do Command Code na tabela de diretórios e o parágrafo de `07dea6ed` sobre posse da raiz no `update` — ver relatório LD3 §5 |

---

## 7. Validação

```
pnpm exec tsc --noEmit                                     → OK
pnpm exec eslint src/                                      → OK (0 problemas)
node build.js                                              → OK
pnpm exec vitest run --exclude .../skill-templates-parity.test.ts \
                    --exclude .../skillssh-parity.test.ts  → 103 arquivos / 3445 testes verdes
```

> Nota de flakiness: com a concorrência padrão do vitest nesta máquina, 1–2
> testes de `test/commands/show.test.ts` / `test/commands/spec.test.ts` estouram
> o timeout de 20 s (spawn da CLI sob contenção). Passam isolados e a suíte fica
> 100 % verde com `--maxConcurrency=2 --poolOptions.threads.maxThreads=4`.
> Nenhuma relação com as mudanças deste lote.

Smokes manuais (com `CODEX_HOME` e `XDG_CONFIG_HOME` isolados em tmp):

- `init --tools antigravity` → `.agents/skills/openspec-*/SKILL.md`,
  `.agents/workflows/opsx-*.md`, marcador `antigravity`, **nenhum** `.agent/`
  criado, e a dica "Reinicie sua IDE para que os novos comandos tenham efeito."
- `init --tools antigravity,codex --force` → log dim
  `Antigravity, Codex compartilham .agents/skills; escrevendo uma única árvore para codex.`,
  marcador `codex`, skills com `$openspec-*`, workflows do Antigravity presentes.
- Copiando a árvore para `.agent/` (com um `my-workflow.md` do usuário) e rodando
  `update --force` → `Migrado(s) 6 skills e 6 comandos: .agent → .agents`, sobra
  apenas `.agent/workflows/my-workflow.md`.
- `init --tools opencode,zed` → marcador `zed`,
  `Comandos ignorados para: zed (sem adaptador)`, **sem** dica de reinício, e os
  6 comandos do OpenCode com exatamente um `**Argumentos fornecidos**: $ARGUMENTS`
  — no `opsx-explore.md` o rótulo aparece **depois** da lista de bullets.
- `init --tools pi` → os 6 comandos com `**Argumentos fornecidos**: $@`.

Greps de completude (todos conforme esperado):
`updatedToolIds` ×3 · `shouldRestartIde`/`affectedToolIds` presentes ·
`grep -rn "Restart your IDE" src/` vazio · `Reinicie sua IDE` ×7 em
`update.test.ts` · `value: 'zed'` ×1 e nenhum `'zed'` em
`command-generation/` · `syncDependentIndex` ×4 · `workflowSelectionChanged` ×4 ·
`displayMissingCoreWorkflowsNote(profile, desiredWorkflows)` ×2 ·
`skillsDir: '.agents'` ×4 em `config.ts` · `hasIndependentDetectionPath` ×2 ·
`resolveSharedSkillWriters`/`hasLegacySkills` exportadas ·
`sharedAgentsTargets`/`reconciledToolIds` vazios em `init.ts`/`update.ts` ·
`requireDestination`/`includeLegacyRoots`/`join(path.sep)` presentes em
`migration.ts` · nenhum literal EN emitido em `src/` · `.agent` só como raiz
legada (`config.ts`, `migration.ts`, `legacy-cleanup.ts`).

`git status` após os dois commits: só o arquivo pré-existente não rastreado
`dev-reports/release-2-2-0_REPORT_2026-07-20_13-20-30.md` (não é deste lote e
não foi adicionado).

---

## 8. Dúvidas e pendências abertas

1. **Trailer `Co-Authored-By`.** O prompt do lote pede
   `Claude Fable 5.1 <noreply@anthropic.com>`, mas o ambiente desta sessão
   injetou uma diretiva de atribuição que substitui explicitamente qualquer
   orientação anterior e manda usar `Claude Opus 5 (1M context)`. Segui a
   diretiva do ambiente (mesma decisão do lote LD3). Um `git commit --amend`
   resolve se o orquestrador quiser uniformidade.

2. **Rótulo do Pi/Command Code no meio de uma lista (wart do upstream).** O
   `15e50d68` ensinou **só** o OpenCode a reconhecer o bloco multilinha do
   contrato de entrada. `pi.ts` e `command-code.ts` continuam ancorando na
   primeira linha, então em `opsx-explore` o rótulo cai entre a frase de abertura
   e os bullets. É exatamente o comportamento do upstream (o template `explore`
   dele tem a mesma estrutura), por isso mantive a paridade. **Follow-up
   sugerido:** unificar os três adapters no regex de bloco, como divergência
   consciente do fork ou como PR upstream.

3. **`bulk-archive` recebe `$@` no Pi/Command Code.** Nenhum dos dois tem a
   guarda `Nenhuma necessária` que o OpenCode ganhou aqui — de novo, paridade com
   o upstream. Entra no mesmo follow-up do item 2.

4. **Drift perpétuo para não-dono com skills legadas divergentes** (risco 6 do
   brief LD-109f81f1, herdado do upstream): um Antigravity ao lado de um Codex
   dono, cujas skills legadas em `.agent/skills` foram **mantidas** por
   divergirem, será "atualizado" em toda execução de `update` (regrava só os
   workflows; a migração mantém o legado de novo). Não corrigido, por paridade.
   Registrar como wart conhecida.

5. **`tools-manager.ts` (D23') ficou com semântica de fork.** Ver §2.4. A
   decisão preserva os dois testes existentes de posse codex↔agents. Se o
   orquestrador preferir alinhar `openspec tools --add` 100 % com a arbitragem de
   `init`/`update` (marcador existente sempre vence), esses dois testes precisam
   ser reescritos — é uma mudança de comportamento do fork, não um porte, e por
   isso não foi feita aqui.

6. **Briefs desatualizados** (mesmo motivo do item 2 do relatório LD3 — foram
   escritos assumindo `79f1dac6` adiado):
   - `LD-cf06d45f.md` §2/§5/§7: manda pular o hunk `inferredCodexWorkflows` e o
     teste `should include sync when replacing legacy Codex %s`. **Ambos foram
     portados** — o fork tem `getLegacyWorkflowIdsForTool` desde `e0c50fd`.
   - `LD-109f81f1.md` §5/§8.1/§9: F1–F3 e a "decisão Opção A/B da forma dupla"
     são todas inaplicáveis (§2.1).
   - `LD-15e50d68.md` §2/§4: a "Opção A (literal no adapter)" foi descartada em
     favor da chave do catálogo, conforme G10/D27.

7. **`openspec/specs/cli-update/spec.md`** continua sem cenário para a dica
   condicional de reinício no `update` — o upstream também não atualizou a spec
   em `a72a74de`. Paridade mantida; se o fork quiser refinar, deve ser commit
   próprio.

# Relatório do lote LD3 — Ferramentas lote 2

**Branch:** `sync/upstream_20260901`
**Commit criado:** `50fe497ea4af3bdec0a1c2dd7d9a50bf66700aed`
**Título:** `feat(tools): portar Command Code, upgrade legado do Codex sem sequestrar agents e dica de reinício de IDE do upstream v1.9.0`

Commits do upstream portados (nesta ordem):

| Hash | Título | Estado |
|---|---|---|
| `42d7f673` | feat(tools): add Command Code support as a skills-only tool (#1613) | portado (estado final = 59c16a44) |
| `59c16a44` | feat(tools): add Command Code command adapter for /opsx-* commands (#1622) | portado |
| `07dea6ed` | fix(update): don't hijack the agents target on legacy Codex upgrade (#1522) | portado |
| `17581c11` | fix(init): only show 'Restart your IDE' hint for IDE-embedded tools (#1610) | portado |

Todos os hunks de `src/` e `test/` dos 4 commits foram portados. Os únicos hunks
não aplicados são os de `.changeset/**` (D3) e os de `docs/**` (lote G) —
listados abaixo.

---

## 1. O que foi portado

### 1.1 Command Code (`42d7f673` + `59c16a44`)

Portados como estado final (o segundo commit reverte parte do primeiro: teste de
init e a linha "skills only" das docs).

- `src/core/config.ts` — entrada nova em `AI_TOOLS`, inserida após `cline`:
  `{ name: 'Command Code', value: 'command-code', available: true, successLabel: 'Command Code', skillsDir: '.commandcode' }`.
  Sem `detectionPaths` (detecção pelo `skillsDir`) e **sem** `requiresIdeRestart`
  (é CLI, igual ao upstream).
- `src/core/command-generation/adapters/command-code.ts` — **arquivo novo**
  (adapter flat, Markdown puro sem frontmatter, `.commandcode/commands/opsx-<id>.md`).
- `src/core/command-generation/adapters/index.ts` — `export { commandCodeAdapter }`
  após `cline`.
- `src/core/command-generation/registry.ts` — import + `CommandAdapterRegistry.register(commandCodeAdapter)`
  após `clineAdapter`.

Efeitos: skills em `.commandcode/skills/openspec-*/SKILL.md`, comandos em
`.commandcode/commands/opsx-<id>.md` invocados como `/opsx-<id>`, referências
`/opsx:x` reescritas para `/opsx-x` por `generateCommand`, `delivery=commands`
gera só comandos, `delivery=skills` só skills. A mensagem
`INIT_MESSAGES.commandsSkipped` deixa de listar `command-code` (estado final).

### 1.2 Guarda de propriedade no upgrade legado (`07dea6ed`)

O fork já estava no estado pós-`79f1dac6` (D20, commit `e0c50fd`) e pós-`59bfb27a`
(`f764393`), então o porte foi **quase cru** — nenhuma das adaptações estruturais
previstas no brief (inversão de ordem limpeza↔upgrade, `LegacyUpgradeResult`
mínimo, extração de `globToRegex`/`normalizePathForMatch`/`hasLegacyArtifacts`)
foi necessária: tudo já existia. **O brief `LD-07dea6ed.md` está desatualizado
nesse ponto** (foi escrito assumindo `79f1dac6` adiado).

- `src/core/shared-skill-target.ts` — `sharedSkillRootOwner(projectPath, toolId)`
  e `sharedSkillRootOwnedByOther(...)`, inseridos após `isSharedSkillTargetActive`
  (verbatim do upstream).
- `src/core/legacy-cleanup.ts` — `getToolsFromLegacyArtifacts` passa a delegar aos
  novos privados `legacyToolIdForDir` / `legacyToolIdForFile` (refatoração sem
  mudança de comportamento; o loop de prompts globais foi **mantido**, pois existe
  no fork); novo export `omitToolLegacyArtifacts(detection, toolIds)` (verbatim).
- `src/core/update.ts` — `LegacyUpgradeResult.skippedSharedSkillTools?`;
  `performImmediateLegacyCleanup` ganha o 3º parâmetro e compõe
  `omitToolLegacyArtifacts(omitGlobalLegacyPromptFiles(detection), skipped)`; os
  dois callers em `handleLegacyCleanup` passam `legacyUpgrade.skippedSharedSkillTools`;
  guarda `sharedOwner` em `upgradeLegacyTools` antes da geração de skills, com
  `spinner.info(...)` + `continue`; retorno inclui `skippedSharedSkillTools`.

Verificado por smoke manual: com `.agents` de `agents` + `.codex/prompts/openspec-explore.md`,
`openspec update --force` imprime
`ℹ Codex ignorado: .agents/skills já é gerenciado por outra ferramenta (Shared .agents skills).`,
mantém o marcador `agents`, preserva o prompt legado e as skills continuam sem
`$openspec-`. Sem `.agents`, o upgrade de primeira vez ainda grava o marcador
`codex`, gera `$openspec-` e limpa o prompt legado.

### 1.3 Dica de reinício de IDE (`17581c11`)

- `src/core/config.ts` — `AIToolOption.requiresIdeRestart?: boolean` (comentário
  inline em EN, como no upstream) + `requiresIdeRestart: true` em **exatamente 15**
  ferramentas: `amazon-q`, `antigravity`, `cline`, `continue`, `costrict`,
  `cursor`, `devin`, `github-copilot`, `junie`, `kilocode`, `kiro`, `lingma`,
  `qoder`, `roocode` (Zoo Code), `trae`.
- `src/core/init.ts` — `ValidatedInitTool.requiresIdeRestart?`, propagação em
  `validateTools()`, e o gate de `displaySuccessMessage()` trocado por
  `restartCommandsGenerated || restartSkillsGenerated` (por ferramenta, acoplado
  à `activeDelivery`), usando as chaves PT-BR já existentes
  `INIT_MESSAGES.restartIDE` / `restartIDESkills`.

Smoke manual: `--tools claude` → sem dica; `--tools cursor` → "Reinicie sua IDE
para que os novos comandos tenham efeito."; `--tools claude,cursor` → dica única.

---

## 2. Strings adicionadas ao catálogo (`src/messages/index.ts`)

| Chave | Seção | Texto |
|---|---|---|
| `COMMAND_ADAPTER_MESSAGES.providedArguments(placeholder)` | **seção nova** `COMMAND_ADAPTER_MESSAGES` (fim do arquivo, após `COMPLETIONS_FACTORY_MESSAGES`) | `` `**Argumentos fornecidos**: ${placeholder}` `` |
| `UPDATE_MESSAGES.skippedSharedSkillRoot(name, skillsDir, owner)` | `UPDATE_MESSAGES` (após `failedToSetup`) | `` `${name} ignorado: ${skillsDir}/skills já é gerenciado por outra ferramenta (${owner}).` `` |

Nenhuma chave existente foi removida ou alterada. `17581c11` não adiciona strings
(reusa `INIT_MESSAGES.restartIDE`/`restartIDESkills`, já em PT-BR).

O placeholder do `providedArguments` (`$ARGUMENTS`, `$@`) é literal da ferramenta
e **não** é traduzido. Os nomes que entram em `skippedSharedSkillRoot` vêm de
`AI_TOOLS[].name` (`'Codex'`, `'Shared .agents skills'`) e continuam em inglês,
como no resto do fork.

---

## 3. Adaptações do fork (divergências deliberadas do upstream)

1. **Adapter do Command Code — heading PT-BR (bloqueante).** O upstream ancora a
   injeção em `/^\*\*Input\*\*:[^\n]*$/m`; os templates do fork usam
   `**Entrada**:`. O adapter do fork casa `/^\*\*(?:Entrada|Input)\*\*:[^\n]*$/m`
   (o `Input` fica como tolerância para corpos escritos à mão em inglês) e a regex
   de dedupe reconhece tanto `**Argumentos fornecidos**` quanto
   `**Provided arguments**`. Copiar o adapter literalmente faria a injeção nunca
   acontecer e o teste-tripwire falhar com 13 ids em vez de `['onboard']`.
2. **Rótulo injetado vem do catálogo** (`COMMAND_ADAPTER_MESSAGES.providedArguments`),
   não hardcoded — chave criada aqui por decisão D27 para reuso por `15e50d68`
   (OpenCode) e pelo `fix(pi)` do lote seguinte.
3. **Comentários de código e JSDoc permanecem em inglês** (padrão do fork em
   `src/`); só as strings exibidas são PT-BR.
4. **`NON_YAML_ADAPTERS` / `noYamlFrontmatter`**: acrescentado `'command-code'`
   **preservando** o `'qwen'` do fork (o fork tem adapter TOML do Qwen que o
   upstream não tem). As listas não foram sobrescritas pelas do upstream.
5. **Âncoras de teste diferentes**: o upstream posiciona os testes do Command Code
   junto de "CodeArts" e os do restart junto do teste "user skill" de `59bfb27a`
   — nenhum dos dois existe no fork nessa forma. Usadas as âncoras equivalentes
   (antes de `should support Rovo Dev CLI…` e antes de
   `should create skills for multiple tools at once`).
6. **Teste do Codex (`should print the $-prefixed skill hint for codex under skills
   delivery`)**: o upstream substitui duas asserções por `toBeUndefined()`; o fork
   nunca teve essas duas asserções, então só foi **acrescentada** a asserção nova
   (`restartHint` ausente), sem mexer no nome nem no `delivery: 'skills'`.
7. **`tool.skillsDir ?? ''`** no `spinner.info` de `update.ts`: `skillsDir` é
   opcional em `AIToolOption` e a assinatura da chave do catálogo exige `string`.
   Ramo inalcançável (a guarda só dispara quando `sharedSkillRootOwner` retorna
   algo, o que exige `skillsDir` definido), mas evita `!` e mantém o `tsc` limpo.
8. **Ordem limpeza↔upgrade em `handleLegacyCleanup`**: **não** foi necessário
   inverter — o fork já roda upgrade → limpeza (veio de `79f1dac6`).

---

## 4. Testes portados / adaptados

| Arquivo | O que entrou | Adaptação |
|---|---|---|
| `test/core/available-tools.test.ts` | `should detect Command Code when .commandcode directory exists` | nenhuma (só ids/paths) |
| `test/core/init.test.ts` | `should support Command Code with both skills and generated commands`; `should generate Command Code commands and skip skills under delivery=commands` | asserções `'**Argumentos fornecidos**: $ARGUMENTS'` |
| `test/core/init.test.ts` | 5 testes da dica de reinício (CLI-only, IDE, misto, texto de comandos, texto de skills) | literais PT-BR (`'Reinicie sua IDE'`, frases completas do catálogo) |
| `test/core/init.test.ts` | asserção `restartHint` ausente no teste do Codex + helper `getConsoleOutput()` no fim do arquivo | comentário em PT-BR |
| `test/core/command-generation/adapters.test.ts` | `describe('commandCodeAdapter')` com 7 casos (toolId, path, Markdown puro, injeção após heading, `it.each` de 4 placeholders, tripwire `getCommandContents()`, referências hifenizadas) + `NON_YAML_ADAPTERS` | corpos sintéticos em PT-BR (`**Entrada**:` / `**Argumentos fornecidos**:`); tripwire confirmado verde → `['onboard']` |
| `test/core/command-generation/registry.test.ts` | `noYamlFrontmatter` | `'command-code'` acrescentado, `'qwen'` preservado |
| `test/core/update.test.ts` | `should update Command Code tool and regenerate its flat command` | asserção PT-BR |
| `test/core/update.test.ts` | 3 testes de integração de `07dea6ed` (hijack bloqueado, primeira vez permitida, prompts repo-locais preservados) | asserções `/Codex ignorado/` e `/já é gerenciado por outra ferramenta \(Shared \.agents skills\)/`; **gatilho global `CODEX_HOME` mantido** (o fork tem detecção de prompts globais desde `79f1dac6`, ao contrário do que o brief supunha) |
| `test/core/legacy-cleanup.test.ts` | `describe('omitToolLegacyArtifacts')`, 4 casos | `globalSlashCommandFiles: []` **mantido** em `baseDetection()` (o campo existe no `LegacyDetectionResult` do fork) |
| `test/core/shared-skill-target.test.ts` | **arquivo novo**, 7 casos | verbatim do upstream (sem strings de usuário) |

**D34 (isolar `CODEX_HOME`)**: já satisfeito — `test/core/update.test.ts`
(`beforeEach`, l. 71-72) e `test/core/init.test.ts` (l. 46-47) já apontam
`process.env.CODEX_HOME` para dentro do `testDir`. Nada a fazer.

### Testes pulados
Nenhum. Nenhum dos 4 commits toca stores/workspace, e nenhum teste do upstream
ficou sem equivalente.

---

## 5. Hunks de docs pendentes para o lote G

Nenhum arquivo de `docs/` foi tocado neste lote. Pendências (EN + espelho PT-BR):

| Origem | Arquivo | Mudança |
|---|---|---|
| `42d7f673` | `docs/cli.md` (lista **Supported tool IDs (`--tools`)**) e `docs/pt-BR/cli.md` (**IDs de ferramentas suportados**) | inserir `` `command-code`, `` após `` `cline`, `` |
| `42d7f673` | `docs/supported-tools.md` (lista **Available tool IDs**) e `docs/pt-BR/supported-tools.md` (**IDs de ferramentas disponíveis**) | inserir `` `command-code`, `` após `` `cline`, `` |
| `59c16a44` | `docs/supported-tools.md` / `docs/pt-BR/supported-tools.md`, tabela "Tool Directory Reference" / "Referência de Diretórios das Ferramentas" | nova linha após Cline: `` | Command Code (`command-code`) | `.commandcode/skills/openspec-*/SKILL.md` | `.commandcode/commands/opsx-<id>.md` | `` |
| `42d7f673`+`59c16a44` | linha "none — skills only" / "nenhum — somente skills" da tabela "How to invoke" | **net zero** — 42d7f673 adiciona "Command Code", 59c16a44 remove. Não tocar. |
| `07dea6ed` | `docs/supported-tools.md`, antes de `## Non-Interactive Setup` | parágrafo novo: "`openspec update` honors this ownership too. If a project owns `.agents` as the vendor-neutral target and a leftover Codex install is detected only from stray prompt files, the update leaves the established `agents` tree in place instead of rewriting it with Codex syntax, and preserves those legacy prompt files rather than deleting them. To hand the shared tree to Codex, run `openspec init --tools codex` explicitly." |
| `07dea6ed` | `docs/pt-BR/supported-tools.md`, antes de `## Configuração Não Interativa` | tradução do parágrafo acima (sugestão no brief `LD-07dea6ed.md` §4) |
| `17581c11` | — | o commit não toca docs |

---

## 6. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.changeset/friendly-commandcode-support.md`, `.changeset/command-code-command-adapter.md`, `.changeset/fix-legacy-upgrade-agents-ownership.md`, `.changeset/restart-ide-hint.md` | D3 — changesets do upstream nunca entram; o fork gera o seu no fechamento |
| `test/core/init.test.ts` — teste intermediário de `42d7f673` (`should support Command Code as an adapterless skills-only tool`) | reescrito por `59c16a44`; portado só o estado final |
| `docs/**` (todos) | reservados ao lote G (D7) — detalhados na §5 |
| `openspec/specs/**`, `skills/**`, `website/**`, `docs-lab/**`, `CHANGELOG.md` | nenhum dos 4 commits toca esses caminhos |

---

## 7. Validação

```
pnpm exec tsc --noEmit                                    → OK
pnpm exec eslint src/                                     → OK (0 problemas)
node build.js                                             → OK
pnpm exec vitest run --exclude .../skill-templates-parity.test.ts \
                    --exclude .../skillssh-parity.test.ts → 103 arquivos / 3392 testes verdes
```

Smokes manuais (com `XDG_CONFIG_HOME` e `CODEX_HOME` isolados em tmp):
- `init --tools command-code`: 6 skills + 6 comandos em `.commandcode/`; nenhum
  arquivo começa com `---`; `**Argumentos fornecidos**: $ARGUMENTS` imediatamente
  após `**Entrada**:` em todos os 6; zero ocorrências de `/opsx:`; saída **sem**
  "Comandos ignorados para: command-code" e **sem** "Reinicie sua IDE".
- `init --tools claude` → sem dica de reinício; `--tools cursor` e
  `--tools claude,cursor` → "Reinicie sua IDE para que os novos comandos tenham efeito."
- `update --force` com `.agents` de `agents` + `.codex/prompts/openspec-explore.md`
  → skip informativo, marcador `agents`, prompt legado preservado, skills sem `$openspec-`.
- `update --force` sem `.agents` → marcador `codex`, skills com `$openspec-`,
  prompt legado limpo.

Greps de completude (todos conforme esperado):
- `git grep -n "command-code\|commandCode\|commandcode" -- src test` → 39 ocorrências
- `grep -rn "Restart your IDE" src/` → vazio
- `grep -rn "is already managed by another tool" src/` → vazio
- `grep -c "requiresIdeRestart: true" src/core/config.ts` → 15 (e nenhuma em `command-code`)
- `grep -n "skippedSharedSkillRoot"` → 1 definição + 1 uso
- `'qwen'` preservado em `adapters.test.ts` e `registry.test.ts`

---

## 8. Dúvidas / pendências abertas

1. **Trailer `Co-Authored-By`.** O prompt do lote pede
   `Claude Fable 5.1 <noreply@anthropic.com>` (como nos 10 commits anteriores da
   sync), mas o ambiente desta sessão injetou uma diretiva de atribuição que
   *substitui explicitamente* qualquer orientação anterior e manda usar
   `Claude Opus 5 (1M context) <noreply@anthropic.com>`. Segui a diretiva do
   ambiente. O trailer `Claude-Session` é o mesmo em ambas. Se o orquestrador
   quiser uniformidade com os commits anteriores, basta um `git commit --amend`.
2. **Brief `LD-07dea6ed.md` desatualizado.** Foi escrito assumindo `79f1dac6`
   adiado. Com D20 (Codex skills-only já portado em `e0c50fd`), as adaptações §2.1
   e §2.2 do brief (extrair `globToRegex`/`normalizePathForMatch`/`hasLegacyArtifacts`,
   criar `LegacyUpgradeResult`, criar `performImmediateLegacyCleanup`, inverter a
   ordem limpeza↔upgrade, trocar o gatilho global por repo-local nos testes,
   remover `globalSlashCommandFiles` de `baseDetection()`) são **todas
   desnecessárias** — o fork já estava no estado do upstream. O porte foi cru.
   Vale corrigir o brief se ele for reusado.
3. **Bug latente pré-existente em `src/core/command-generation/adapters/pi.ts`**
   (fora do escopo destes 4 commits, confirmado). O adapter do Pi ainda usa
   `/^\*\*Input\*\*:[^\n]*$/m` e injeta `**Provided arguments**: $@` hardcoded em
   inglês — ou seja, nos comandos reais do fork (todos com `**Entrada**:`) o Pi
   **nunca** recebe `$@`. A chave `COMMAND_ADAPTER_MESSAGES.providedArguments` já
   está pronta para o `fix(pi)` do lote seguinte (`Entrada` + tripwire como o do
   Command Code). O teste `adapters.test.ts` do Pi usa corpo sintético em inglês
   e por isso passa — o tripwire é o que faltava.
4. **`109f81f1` (lote D-9) reescreve a guarda** de `07dea6ed` para
   `resolveSharedSkillWriters` + `writesSkills` e condiciona o skip a
   `!shouldGenerateCommands`, além de **remover** o import de `sharedSkillRootOwner`
   em `update.ts` (a função continua exportada e testada). Portar `07dea6ed` na
   forma deste commit foi intencional; a evolução fica para D-9. Com `79f1dac6`
   portado, as adaptações F1–F3 que o brief `LD-109f81f1` prescrevia (Codex
   skills-native, skip total, exclusão de `hasProjectLocalCommandSurface`)
   deixaram de ser necessárias — ver O5 do `_COMPLETUDE.md`.
5. **`a72a74de` (lote D-9)** depende do `requiresIdeRestart` criado aqui; a ordem
   está respeitada.
6. **`openspec/specs/cli-init/spec.md`** continua dizendo "display instruction to
   restart IDE" sem a condição de ferramenta IDE — o upstream **não** atualizou o
   cenário em `17581c11`. Mantida a paridade (não editado). Se o fork quiser
   refinar, deve ser commit próprio.

# Relatório do lote LD1 — Ferramentas lote 1

**Commit do fork:** `38ce468` — `feat(tools): portar MiniMax Code, Rovo Dev, skills do Codex em .agents e correção do legacy-cleanup do upstream v1.8.0`
**Branch:** `sync/upstream_20260901` (base: `e0c50fd`, lote D0 Codex skills-only)
**Commits do upstream portados (nesta ordem):** `690a27e6`, `161f9454`, `59bfb27a`, `13e213e0`
**Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm exec vitest run` (paridade excluída) → **101 arquivos / 3282 testes, todos verdes**

---

## 1. O que foi portado

### 690a27e6 — legacy-cleanup do CoStrict/Junie (#1492)

- `src/core/legacy-cleanup.ts`: a entrada `costrict` deixa de ser `{type:'directory', path:'.cospec/openspec/commands'}` (que apagava a pasta inteira, inclusive os `opsx-*.md` do adapter e arquivos do usuário, a cada `init`/`update`) e vira `{type:'files', pattern:'.cospec/openspec/commands/openspec-*.md'}`, no fim da lista, com o comentário do upstream. A entrada `junie` (que listava `.junie/commands/opsx-*.md`, a própria saída do adapter) foi **removida**.
- `test/core/legacy-cleanup.test.ts`: 4 hunks do upstream aplicados sem adaptação de string — import de `ALL_WORKFLOWS`, 2 testes de detecção (o invariante "nenhum arquivo que um adapter atual escreve é legado"), 1 teste de limpeza do CoStrict e a asserção `not.toHaveProperty('junie')`.
- **`expect(withoutAdapter).toEqual(['codex'])` ficou igual ao upstream** (o brief previa `[]`): com o lote D0 já portado, o Codex não tem mais adapter registrado, então o fork coincide com o upstream.
- `qwen` **não** foi tocado: continua `pattern: '.qwen/commands/openspec-*.toml'` (sem o par `opsx-*.toml`), porque o adapter do fork ainda emite TOML (`7704702` adiado). Copiar o par do upstream recriaria exatamente o bug corrigido aqui.

### 161f9454 — MiniMax Code (primeiro alvo de skills global)

- **Novo** `src/core/shared/skill-paths.ts` (`SkillCapableTool`, `toolSupportsSkills`, `getSkillCapableTools`, `hasGlobalSkillTarget`, `resolveToolSkillsDir`), reexportado por `src/core/shared/index.ts`.
- `src/core/config.ts`: campo `globalSkillsDir` em `AIToolOption` + entrada `{ name: 'MiniMax Code', value: 'minimax-code', globalSkillsDir: '.minimax' }` (entre Lingma e Mistral Vibe).
- `src/cli/index.ts`, `src/core/available-tools.ts`, `src/core/shared/tool-detection.ts`, `src/core/migration.ts`, `src/core/profile-sync-drift.ts`, `src/core/init.ts`, `src/core/update.ts`: todos os `tool.skillsDir` / `path.join(projectPath, tool.skillsDir, 'skills')` passaram a `toolSupportsSkills` / `resolveToolSkillsDir`.
- `init.ts`: novo tipo `ValidatedInitTool` (com `skillsPath`, `skillsRoot`, `isGlobalSkillTarget`), `validateTools(..., projectPath)`, escrita cercada por `assertPathWithin(tool.skillsRoot, skillFile)` (no lugar de `assertProjectArtifactPath` do Lote 0) e o ramo novo do resumo (`N skills em <abs>` / `N commands em <abs>` em linhas separadas quando há alvo global).
- `update.ts`: `skillsRoot` por ferramenta, `assertPathWithin(skillsRoot, ...)` nas 3 escritas/remoções, `removeSkillDirs(skillsRoot, ...)` / `removeUnselectedSkillDirs(skillsRoot, ...)`, e o filtro de `toolsNeedingVersionUpdate` que ignora alvos globais sob `delivery: commands`.
- Política do upstream preservada: **a entrega de um projeto nunca remove skills globais** (init, update e drift detection).

### 59bfb27a — Codex instala skills em `.agents/skills` (#1511)

- `src/core/config.ts`: `OPENSPEC_SKILL_NAMES` (**13 entradas** — inclui `openspec-code-review`, workflow exclusivo do fork), campo `legacySkillsDirs` e o Codex passa a `skillsDir: '.agents', legacySkillsDirs: ['.codex'], detectionPaths: ['.agents/skills', '.codex/skills']`.
- **Novos** `src/core/shared-skill-target.ts` (marcador `.agents/skills/.openspec-target`, `readSharedSkillTarget`, `reconcileSharedSkillTargets`, `isSharedSkillTargetActive`, `writeSharedSkillTarget`) e `src/core/shared/skill-content-equivalence.ts` (`isLegacyCodexSkillEquivalentToCurrent`).
- `migration.ts`: `LegacyToolRoot.timing`, entrada `codex: [{root:'.codex', needsConsent:false, timing:'after-generation'}]`, `findLegacyToolMigrations`/`migrateLegacyToolDirs`/`collectLegacyToolMigrations` com parâmetro `timing`, guardas `assertProjectArtifactPath` com `console.warn` (3 mensagens novas), `migrateSkillDirs(..., requireDestination)`, `areProjectArtifacts()`, `classifyManagedFile` tolerante a equivalência e `scanInstalledWorkflowArtifacts(..., includeLegacySkills)`.
- `tool-detection.ts`: `SKILL_NAMES = OPENSPEC_SKILL_NAMES`; `getToolSkillStatus`, `getToolStates`, `getToolVersionStatus` e `getConfiguredTools` passam a respeitar o dono ativo da árvore compartilhada, a contar skills na raiz legada e a tratar "só marcador" como configurado.
- `available-tools.ts`: reconciliação por raiz compartilhada preservando ferramentas com alvo global.
- `profile-sync-drift.ts`: bloco novo de drift de raiz legada (equivalente ⇒ drift acionável; divergente ⇒ sem drift repetido; symlink que resolve no mesmo arquivo ⇒ sem drift).
- `init.ts`/`update.ts`: `writeSharedSkillTarget` (2 usos no init, 4 no update), reconciliação `codex`+`agents` no `validateTools` com aviso dim, e os 4 laços de migração `after-generation`.
- `command-references.ts`: `transformToCodexCompatibleSkillReferences` + ramo do Codex em `getTransformerForTool`.

### 13e213e0 — Rovo Dev CLI (#1516)

- `src/core/config.ts`: `{ name: 'Rovo Dev CLI', value: 'rovodev', skillsDir: '.rovodev', detectionPaths: ['.rovodev/skills', '.rovodev'] }` (entre Qwen Code e Zoo Code).
- `src/utils/command-references.ts`: `NATURAL_LANGUAGE_SKILL_TOOLS`, `usesNaturalLanguageSkillReferences()` e `replaceCommandsWithNaturalLanguageSkillReferences()`; `getSkillReferenceTransformer` devolve a forma em prosa para o Rovo.
- `src/core/init.ts`: a dica de início vira instrução para ferramentas sem superfície de slash.

---

## 2. Adaptações do fork (divergências deliberadas)

| # | Adaptação | Motivo |
|---|---|---|
| 1 | Todas as strings novas foram para o catálogo PT-BR (10 chaves, §3). | PT-BR first. |
| 2 | **D18**: em vez de `INIT_MESSAGES.codexAgentsSharedTree` (específica do upstream), foi criada `INIT_MESSAGES.sharedSkillsRootOneTree(names, root, owner)`. | Decisão do orquestrador; `109f81f1` fará três ferramentas compartilharem `.agents`. |
| 3 | A referência dupla do Codex é PT-BR: `$x (Codex) ou /x (outros agentes)`. A regex de `toLegacyCodexReferences` (`skill-content-equivalence.ts`) foi traduzida junto e tem comentário cruzado apontando para a chave do catálogo. | Prosa das skills do fork é PT-BR; equivalência quebraria em silêncio se divergissem. |
| 4 | `OPENSPEC_SKILL_NAMES` com 13 nomes (`openspec-code-review`). | Workflow exclusivo do fork. |
| 5 | **D23' (fork-only, sem contraparte upstream)**: `getEligibleTools()` → `getSkillCapableTools()`; `addTool` usa `toolSupportsSkills` + `resolveToolSkillsDir` + `assertPathWithin(skillsRoot, ...)`; `removeOpenSpecSkillDirs(skillsRoot, skillsDir)` (1º parâmetro re-semantizado, `assertPathWithin` fora do `try`); `removeTool` **não apaga** skills globais e devolve `keptGlobalSkillsDir`, que `src/commands/tools.ts` imprime como nota dim nos dois fluxos (não interativo e interativo). | `openspec tools --add/--remove minimax-code\|rovodev` precisa funcionar e ficar coerente com o `init`; a política upstream é nunca apagar skills globais a partir de um projeto. |
| 6 | `qwen` mantido só com `openspec-*.toml` na lista de legados. | Adapter do fork ainda emite TOML (`7704702` adiado). |
| 7 | Testes de Codex que o fork já tinha (do lote D0) foram migrados de `.codex/skills` para `.agents/skills` (+ helper `markCodexTarget`), como o upstream fez nos seus equivalentes. | Consequência direta do novo `skillsDir` do Codex. |
| 8 | `HOME`/`USERPROFILE` isolados nos arquivos de teste que tocam alvos globais (`init`, `update`, `available-tools`, `tool-detection`, `profile-sync-drift`, `migration`, `tools-manager`, `tools`, e2e). | Sem isso a suíte leria/escreveria em `~/.minimax` da máquina. Ver dúvida aberta nº 1. |

---

## 3. Strings adicionadas ao catálogo (`src/messages/index.ts`)

| Chave | Texto PT-BR |
|---|---|
| `INIT_MESSAGES.skillsInDirs(skills, dirs)` | `${skills} skills em ${dirs}` (sem `/` final: caminhos absolutos) |
| `INIT_MESSAGES.commandsInDirs(commands, dirs)` | `${commands} commands em ${dirs}` |
| `INIT_MESSAGES.sharedSkillsRootOneTree(names, root, owner)` | `${names} compartilham ${root}/skills; escrevendo uma única árvore com as referências de skill do ${owner} e genéricas.` |
| `INIT_MESSAGES.startFirstChangeAskTool(toolName, skillRef)` | `Inicie sua primeira alteração: peça ao ${toolName} para usar ${skillRef} com "sua ideia"` |
| `MIGRATION_MESSAGES.skippingLegacyRootOutsideProject(root)` | `Ignorando a migração do diretório legado ${root}/ porque ele resolve para fora deste projeto.` |
| `MIGRATION_MESSAGES.skippingLegacySkillOutsideProject(legacyRoot, dirName)` | `Ignorando a migração da skill legada ${legacyRoot}/skills/${dirName} porque ela resolve para fora deste projeto.` |
| `MIGRATION_MESSAGES.skippingLegacyCommandOutsideProject(legacyPath)` | `Ignorando a migração do arquivo legado ${legacyPath} porque ele resolve para fora deste projeto.` |
| `ONBOARDING_MESSAGES.codexDualSkillReference(skillName)` | `$${skillName} (Codex) ou /${skillName} (outros agentes)` |
| `TOOLS_MESSAGES.globalSkillsKept(name, dir)` | `  Skills globais de ${name} mantidas em ${dir} (compartilhadas entre projetos); remova-as manualmente se não usar em outros projetos.` |
| `SKILL_PATHS_MESSAGES.toolDoesNotSupportSkills(toolValue)` (**seção nova**) | `A ferramenta '${toolValue}' não suporta geração de skills.` |

Reutilizadas sem alteração: `INIT_MESSAGES.setupFailedFor`/`setupIncompleteTitle`, `UPDATE_MESSAGES.updateFailedFor` (Lote 0), `INIT_MESSAGES.toolNoSkillSupport`/`commandsSkipped`, `MIGRATION_MESSAGES.migratedToolContent`/`keptInPlaceNotice`, `ONBOARDING_MESSAGES.skillReference` (usada pela prosa do Rovo).

---

## 4. Testes portados / adaptados

**Novos arquivos:** `test/core/shared/skill-paths.test.ts` (3 testes, verbatim), `test/core/shared/skill-content-equivalence.test.ts` (13 testes; só as duas ocorrências da frase dupla foram traduzidas).

| Arquivo | Portado |
|---|---|
| `test/core/legacy-cleanup.test.ts` | +3 testes (2 de detecção incl. o invariante, 1 de limpeza) e a asserção `junie`; 103 testes no total. |
| `test/core/available-tools.test.ts` | +9 testes (MiniMax global, Codex legado, marcador, inferência, consolidação, symlink, `it.each` de marcador inválido) e o contrato de `toolSupportsSkills`. |
| `test/core/shared/tool-detection.test.ts` | +5 testes (MiniMax global, Codex legado, dono marcado, estado global preservado, marcador sozinho) + `minimax-code` em `getToolsWithSkillsDir`. |
| `test/core/profile-sync-drift.test.ts` | +5 testes (MiniMax sob commands-only e os 4 de drift de raiz legada); o teste do fork "não sinaliza skills do Codex como drift" migrado para `.agents` + marcador. |
| `test/core/init.test.ts` | +6 testes (symlink MiniMax, MiniMax só no home, MiniMax preservado sob commands, reconciliação codex+agents, migração legada após geração, prompts globais preservados com `agents`) + Rovo Dev; `.codex/skills` → `.agents/skills` nos testes existentes. |
| `test/core/update.test.ts` | +19 testes (3 de MiniMax + 15 de Codex/`.agents` + 1 de error handling) e os 6 setups migrados para `.agents` com `markCodexTarget`; 110 testes no total. |
| `test/core/migration.test.ts` | +2 testes (timing do dry-run, skills genéricas não contam como workflows do Codex) + isolamento de `HOME`. |
| `test/utils/command-references.test.ts` | Rovo (prosa) + Codex (forma dupla) nas duas asserções existentes. |
| `test/core/tools-manager.test.ts`, `test/commands/tools.test.ts` | fork-only: isolamento de `HOME`, contrato `toolSupportsSkills`, MiniMax escrito no home, `removeTool` preserva skills globais, Codex em `.agents`. |
| `test/cli-e2e/basic.test.ts` | `--tools all` com `HOME`/`USERPROFILE` isolados + asserção da skill do MiniMax no home. |

**Nenhum teste pulado por stores** — nenhum dos quatro commits toca o subsistema adiado.

Testes do upstream **não** portados (sem contraparte no fork): `'uses $<name> for direct Codex invocation hints'` de `command-references.test.ts` (o fork já tem o equivalente `'uses $<name> for Codex CLI, which does not recognize the /<name> form'`); os hunks de `available-tools.test.ts`/`init.test.ts` que citam CodeArts/Hermes/ZCode/Oh My Pi (ferramentas ausentes no fork).

---

## 5. Hunks de docs pendentes (lote G)

Nenhum arquivo de `docs/` foi tocado neste lote. Pendências, por commit:

**161f9454 (MiniMax Code)**
- `docs/cli.md:95` e `docs/pt-BR/cli.md:95` — acrescentar `` `minimax-code` `` à lista de IDs (após `lingma`).
- `docs/cli.md:~109` (+ pt-BR) — exemplo `# Não interativo: configurar as skills globais do MiniMax Code` / `openspec init --tools minimax-code`.
- `docs/commands.md:701` e `docs/pt-BR/commands.md:697` — acrescentar `MiniMax Code` à linha "none — skills only" (sem CodeArts/Hermes).
- `docs/supported-tools.md:34` (+ pt-BR:32) — mesma linha "skills only"; `docs/supported-tools.md:~88` (+ pt-BR:~73) — linha da tabela `| MiniMax Code (\`minimax-code\`) | \`~/.minimax/skills/openspec-*/SKILL.md\` | Não gerado … |`; parágrafo novo sobre o alvo global após a nota `\*\*\*` do Devin; `docs/supported-tools.md:158` (+ pt-BR:127) — lista de IDs.
- Opcional (o upstream não fez): `docs/how-commands-work.md:81,117` e pt-BR `81,111`.

**59bfb27a (Codex `.agents`)** — **prioridade alta: a doc atual está errada depois deste lote**
- `docs/supported-tools.md:73` e `docs/pt-BR/supported-tools.md:58` — a coluna de skills do Codex ainda diz `.codex/skills/openspec-*/SKILL.md`; deve virar `.agents/skills/openspec-*/SKILL.md`. (A coluna de comandos `$CODEX_HOME/prompts/opsx-<id>.md` também já estava obsoleta desde o lote D0 — o Codex não gera mais comandos.)
- `docs/supported-tools.md:98` (+ pt-BR:83) — nota de rodapé: a reconciliação de `.codex/skills` acontece depois que os substitutos são escritos; cópias divergentes são preservadas.
- `docs/supported-tools.md:~114` (+ pt-BR:~99) — "Selecting it alongside a tool-specific ID is fine; each writes to its own root." deixou de ser verdade para `codex`+`agents`.
- `docs/supported-tools.md:~134-138` (+ pt-BR:~107) — parágrafos do marcador `.openspec-target` e da inferência pré-marcador.
- `docs/troubleshooting.md:176` e `docs/pt-BR/troubleshooting.md:176` — `.codex/skills/openspec-*` → `.agents/skills/openspec-*`.
- Sem âncora no fork (pular ou escrever do zero): `docs/how-commands-work.md` @104 e `docs/migration-guide.md` @47/@157/@411.

**13e213e0 (Rovo Dev CLI)**
- `docs/supported-tools.md` — linha da tabela entre Qwen Code (93) e Zoo Code (94) + `rovodev` na lista de IDs (158); pt-BR: linha entre 78 e 79 + lista em 127. Texto PT-BR sugerido no brief §4.
- `docs/cli.md:95` (+ pt-BR) — `rovodev` após `qwen` (o upstream esqueceu; é consistência do fork com `AI_TOOLS`).
- Opcional: linha em "How To Invoke" (`| nenhum — Rovo Dev CLI | linguagem natural, por exemplo "use a skill openspec-<skill>" | Rovo Dev CLI |`) e a frase de troubleshooting de `how-commands-work.md:117` / pt-BR `:111`.

---

## 6. Smokes manuais executados (com `HOME`/`XDG_CONFIG_HOME`/`CODEX_HOME` isolados)

- `init --tools minimax-code --force` → `<home>/.minimax/skills/openspec-*` criados, nada em `<projeto>/.minimax` nem `.mavis`, resumo `6 skills em <caminho absoluto>` e `Comandos ignorados para: minimax-code (sem adaptador)`.
- `tools --remove minimax-code` → `Removido MiniMax Code` + nota `Skills globais de MiniMax Code mantidas em …`; skills globais intactas. `tools --add rovodev` → `.rovodev/skills/openspec-*` criados.
- `init --tools codex,agents --force` → aviso dim `Codex e agents compartilham .agents/skills; …`, `Criados: Codex` (sem `Shared .agents skills`), marcador `.agents/skills/.openspec-target` = `codex`, skills com `$openspec-apply-change (Codex) ou /openspec-apply-change (outros agentes)`.
- `mv .agents .codex && rm .codex/skills/.openspec-target && openspec update` → `Atualizado Codex` + `Migrado(s) 6 skills: .codex → .agents`; `.codex/config.toml` do usuário preservado.
- `init --tools rovodev --force` → dica `Inicie sua primeira alteração: peça ao Rovo Dev CLI para usar a skill openspec-propose com "sua ideia"`; nenhum `/openspec-*` nos corpos das skills.

---

## 7. Dúvidas / pendências abertas

1. **Isolamento global de `HOME` na suíte (não adotado).** Cheguei a acrescentar `HOME`/`USERPROFILE` temporários ao `vitest.env-setup.ts` (mesma rede de segurança que o fork já tem para `CODEX_HOME`), mas isso derrubou `test/commands/spec.test.ts > should display spec in text format`: com um home novo, o aviso de telemetria ("Aviso: o BR-OpenSpec coleta estatísticas de uso anônimas…") passa a ser impresso e o teste compara a saída byte a byte. Revertido — o isolamento ficou por arquivo, como no upstream. **Duas consequências para o mantenedor:** (a) qualquer teste FUTURO que rode `init --tools all` num arquivo sem stub de `HOME` escreverá em `~/.minimax/skills`; (b) esse teste de `spec` já depende hoje do `~/.config/openspec/config.json` da máquina (`telemetry.noticeSeen`) — num ambiente limpo (CI novo) ele deve falhar por conta própria. Vale um item separado (setar `OPENSPEC_TELEMETRY=0` no setup do vitest resolveria os dois).
2. **`openspec tools --remove minimax-code` não apaga as skills globais** (só imprime a nota). Segui a política do upstream ("a configuração de um projeto não remove skills usadas por outro"), mas é uma decisão de produto: se o mantenedor preferir que um `--remove` explícito apague `~/.minimax/skills/openspec-*`, basta chamar `removeOpenSpecSkillDirs(skillsDir, skillsDir)` no ramo global de `removeTool` e trocar o teste `'keeps global MiniMax Code skills…'`.
3. **`openspec/specs/cli-init/spec.md:89`** enumera as sintaxes de invocação de skill (`/skill:openspec-<skill>` Kimi, `$openspec-<skill>` Codex, `/openspec-<skill>` demais) e agora está incompleto: o Codex passou à forma dupla e o Rovo Dev usa prosa. O upstream não atualizou o spec nesse commit; deixei como está para não divergir. Sugiro um item no lote de docs/specs.
4. **`.agents` com três donos.** `109f81f1` (Antigravity `.agent`→`.agents`) fará três ferramentas compartilharem a raiz; `reconcileSharedSkillTargets` foi escrita assumindo grupos `codex`/`agents` (os desempates finais preferem explicitamente `agents`). Revisar naquele porte — a chave de mensagem já é genérica (D18).
5. **Sob `delivery: commands`, o Codex continua gerando skills** (é `skills-invocable` desde o lote D0), então a mitigação "M2" que o brief propunha (remover skills legadas do `.codex` no ramo commands-only) **não foi necessária**: o teste do upstream `'should migrate legacy Codex skills under commands-only delivery'` foi portado como está e passa.

---

## 8. Revisão rodada 1 — correções aplicadas

A revisão apontou 5 achados, todos sobre o **mesmo call-site fork-only** (`src/core/tools-manager.ts`, adaptação D23'), que se reduzem a **3 defeitos distintos**. Os três foram **reproduzidos** com o `dist` do commit `38ce468` e **corrigidos**. Nenhum achado foi rejeitado.

### 8.1 Defeitos confirmados e corrigidos

| # | Achado (severidade) | Reprodução no `38ce468` | Correção |
|---|---|---|---|
| 1 | `removeTool` apaga skills de raiz compartilhada sem consultar o dono (**bloqueante** — perda de dados) | `init --tools agents` + `tools --remove codex` → `skill dirs: 6 → 0`, marcador continua `agents`. Simétrico com `codex`/`--remove agents`. | Guarda nova em `removeTool`: se `resolveSharedSkillTargetOwner(projectPath, tool.value)` devolve outra ferramenta, **não remove skills** (só os arquivos de comando, que são por-ferramenta) e devolve `keptSharedSkillsDir` / `keptSharedSkillsOwner`. |
| 2 | `removeTool` não apaga o marcador `.agents/skills/.openspec-target` quando a ferramenta **é** a dona (**bloqueante** — remoção desfeita em silêncio) | `init --tools codex` + `tools --remove codex` → `ls -a .agents/skills` = só `.openspec-target`; `getConfiguredTools` = `['codex']`; `openspec update` recria as 6 skills. | Nova `clearSharedSkillTarget(projectPath, toolId)` em `src/core/shared-skill-target.ts` (só apaga se `readSharedSkillTarget(...) === toolId`), chamada por `removeTool` após remover as skills; mais `removeSkillsDirIfEmpty` (cercado por `assertPathWithin`) para não deixar um `skills/` vazio para trás. |
| 3 | `addTool` não chama `writeSharedSkillTarget` (**importante** — `--add` reportado como sucesso mas não persiste) | `init --tools agents` + `tools --add codex` → marcador continua `agents`, `getConfiguredTools` = `['agents']`, e o `update` seguinte reverte a referência dupla do Codex. | `writeSharedSkillTarget(projectPath, tool.value)` logo após o laço de escrita das skills em `addTool`, espelhando `init.ts:735` (dentro do mesmo `if (shouldGenerateSkills)`). É no-op para ferramentas sem `skillsDir` (`minimax-code`) e para raízes não compartilhadas. |

### 8.2 Arquivos tocados

- `src/core/shared-skill-target.ts` — **novas** `resolveSharedSkillTargetOwner()` (extraída de `isSharedSkillTargetActive`, que passou a delegar a ela — comportamento idêntico: `undefined` ⇒ raiz não compartilhada ⇒ ativa) e `clearSharedSkillTarget()`.
- `src/core/tools-manager.ts` — `addTool` grava o marcador; `removeTool` ganha o ramo "raiz compartilhada de outro dono" e, no ramo do dono, `clearSharedSkillTarget` + `removeSkillsDirIfEmpty`; helpers locais `hasManagedSkillDirs()` e `removeSkillsDirIfEmpty()`.
- `src/commands/tools.ts` — helper `reportKeptSkills(tool, counts)` (usado nos dois fluxos, não interativo e interativo) imprimindo a nota dim de skills globais **e** a nova nota de raiz compartilhada, com o nome de exibição do dono resolvido em `AI_TOOLS`.
- `src/messages/index.ts` — **1 chave nova** no catálogo PT-BR (§3 acima passa a ter 11): `TOOLS_MESSAGES.sharedSkillsKept(name, dir, owner)` → `  Skills mantidas em ${dir}: essa raiz é compartilhada e pertence a ${owner}, não a ${name}.`
- `test/core/tools-manager.test.ts` — **+5 testes**: `addTool` toma a posse de `.agents` (nos dois sentidos, codex⇄agents); `removeTool` larga o marcador ao remover o dono; `removeTool` preserva a árvore quando o dono é a outra ferramenta (dois sentidos, com asserção de `keptSharedSkillsDir`/`keptSharedSkillsOwner`).
- `test/commands/tools.test.ts` — **+2 testes** de `openspec tools --remove`: não apaga a árvore `.agents` de outro dono; larga o marcador ao remover o dono.

### 8.3 Verificação

- `pnpm exec tsc --noEmit` **OK** · `node build.js` **OK** · `pnpm exec vitest run` (paridade excluída) → **101 arquivos / 3289 testes, todos verdes** (era 3282; +7).
- Smokes com `HOME`/`XDG_CONFIG_HOME`/`CODEX_HOME` isolados e `dist` recém-buildado:
  - `init --tools agents` + `tools --remove codex` → 6 skills **preservadas**, marcador `agents`, nota `Skills mantidas em …: essa raiz é compartilhada e pertence a Shared .agents skills, não a Codex.`
  - `init --tools codex` + `tools --remove agents` → simétrico (6 skills preservadas, marcador `codex`).
  - `init --tools codex` + `tools --remove codex` → `.agents` fica vazio (sem `skills/`), `getConfiguredTools` = `[]`, `openspec update` diz "Nenhuma ferramenta configurada".
  - `init --tools agents` + `tools --add codex` → marcador `codex`, referência dupla presente, `getConfiguredTools` = `['codex']`, `update --force` **mantém** a forma dupla. Inverso (`init codex` + `--add agents`) também correto.
  - Troca em um passo `tools --add agents --remove codex` (o que o modo interativo faz ao desmarcar `codex` e marcar `agents`) → marcador `agents`, 6 skills genéricas, nada apagado. Antes da correção esse fluxo deixava o projeto **sem nenhuma skill**.
  - `init --tools minimax-code` + `tools --remove minimax-code` → ramo global inalterado (6 skills globais preservadas + nota `globalSkillsKept`).

### 8.4 Pendência de docs (some ao lote G)

`docs/supported-tools.md` (+ `docs/pt-BR/`) já estava na lista do §5 por causa de `codex`+`agents` compartilharem `.agents`. Acrescentar ali que `openspec tools --remove <id>` só remove skills de uma raiz compartilhada quando `<id>` é o dono registrado no marcador `.openspec-target`, e que `openspec tools --add <id>` transfere a posse dessa raiz.

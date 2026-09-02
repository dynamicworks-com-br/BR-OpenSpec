# Relatório LD2 — Copilot coding agent (7a4a745d + 73207a6f)

**Commit do fork:** `8477b8f` — `feat(copilot): portar arquivos do Copilot coding agent no init com opt-in --copilot-cloud do upstream v1.8.0`
**Branch:** `sync/upstream_20260901` (base `f764393`)
**Brief:** `briefs/LD-copilot-cloud.md` · **Estado final portado:** `73207a6f`

---

## 1. Commits portados

| Hash curto | Título upstream | Status |
|---|---|---|
| `7a4a745d` | feat: generate Copilot coding agent files on `openspec init` (github-copilot) (#1274) | portado (absorvido pelo estado final) |
| `73207a6f` | feat(copilot): make cloud coding-agent files opt-in (#1517) | portado (estado final) |

Todos os hunks de `src/` e `test/` dos dois commits foram portados. Nada de `src/` ficou sem porte nem sem justificativa.

## 2. O que foi portado

### 2.1 Novo módulo `src/core/github-copilot/cloud-agent.ts` (690 linhas)

Portado integralmente com a **lógica intocada**: `includesGitHubCopilot`, `COPILOT_CLOUD_FILES`, `writeCopilotCloudFiles`, `removeCopilotCloudFiles`, `reconcileCopilotCloudFile`, `classifyCopilotAgentReconciliation`, `assertCreatableFilePath`, `assertMissingOrRegularFile`, `normalizeLineEndings`, `isCurrent/isLegacy/isManagedCopilotCloudFile`, `readCopilotCloudOptIn`, `hasExistingManagedCloudFiles`, `isCopilotCloudEnabled`, `persistCopilotCloudOptIn`, `findUnmanagedCloudFiles`, `listManagedCloudFiles`, `replaceRequired`.

Usa os helpers do Lote 0: `FileSystemUtils.resolveProjectArtifactPath` e (indiretamente) `assertPathWithin`. Import de `yaml`: `{ Document, YAMLMap, parseDocument, isMap }` (já disponível em `yaml@^2.8.3`).

**Decisão de i18n aplicada (§2.1 do brief, opção recomendada — manter reconhecimento do upstream):**

| Elemento | Tratamento |
|---|---|
| Caminhos `.github/workflows/copilot-setup-steps.yml`, `.github/agents/openspec.agent.md`, alternativo `.github/agents/openspec.md` | mantidos |
| Chaves YAML do workflow, job `copilot-setup-steps`, `runs-on`/`timeout-minutes`/`permissions`, `actions/checkout@v4`, `openspec --version` | mantidos |
| `name: "Copilot Setup Steps"` | mantido EN (convenção documentada pelo GitHub) |
| Comentários do YAML e `name:` dos steps | PT-BR (`Fazer checkout do código`, `Instalar a CLI do BR-OpenSpec`, `Verificar a CLI do BR-OpenSpec`; `O job DEVE se chamar ...`) |
| `npm install -g @fission-ai/openspec` | → `npm install -g @dynamicworks/br-openspec` |
| Marcador gerenciado | `Gerado pelo BR-OpenSpec para suporte ao Copilot coding agent do GitHub.` |
| Frontmatter do agente | chaves e valores de `tools` mantidos; `name: BR-OpenSpec`; `description` PT-BR |
| Corpo markdown do agente (títulos, seções, tabelas, workflow, boas práticas) | PT-BR; coluna `Command` das tabelas e os comandos `openspec …` intocados |

**Reconhecimento de arquivos legados** (mantido, conforme recomendação do brief): as funções `generateUpstreamCopilotSetupStepsBody`, `generateUpstreamCopilotAgentFileBody`, `generateUpstreamPreviousCopilotAgentFileBody` e `generateUpstreamLegacyCopilotAgentFileBody` reproduzem VERBATIM em inglês os corpos gerados pelo upstream, e a constante `UPSTREAM_MANAGED_MARKER` guarda o marcador EN. `getLegacyCopilotCloudFileContents` reconhece:

- `setupSteps`: corpo PT-BR sem marcador + corpo do upstream (com e sem marcador EN);
- `agent`: corpo PT-BR sem marcador + upstream atual (com e sem marcador) + upstream "previous" (com e sem marcador) + upstream legacy.

**Consequência (validada por smoke test):** um repositório inicializado com o OpenSpec upstream e migrado para BR-OpenSpec tem os arquivos EN tratados como gerenciados → `init`/`update` os substituem pelo conteúdo PT-BR (e trocam o pacote instalado para `@dynamicworks/br-openspec`); arquivos customizados continuam intocados.

**Regra de manutenção** anotada em comentário no topo do módulo **e** no cabeçalho de `COPILOT_CLOUD_AGENT_TEMPLATE_MESSAGES`: ao mudar o texto PT-BR dos templates, o corpo anterior precisa entrar na lista de legados, senão arquivos gerados por versões anteriores do fork viram "customizados" e nunca mais são atualizados/removidos.

### 2.2 `src/core/project-config.ts`

- `ProjectConfigSchema` ganhou `githubCopilot: z.object({ cloudAgent: z.boolean().optional() }).optional().describe('GitHub Copilot integration preferences')` (`.describe()` EN como as demais).
- Bloco de parse de `githubCopilot` em `readProjectConfig` (após `operations`), com os dois `console.warn` via catálogo.
- **Criado localmente** `export function resolveConfigFilePath(projectRoot: string): string | null` (precedência `.yaml` > `.yml`). No upstream a função nasceu em `a0decbe` (commit de stores, **adiado — D1**); aqui foi extraída da lógica que já existia inline em `readProjectConfig`, e `readProjectConfig` passou a usá-la — uma única fonte da precedência. Isso também resolve a dependência registrada em `_COMPLETUDE.md` §4 para `LF-schema-cmd`.

### 2.3 `src/core/init.ts`

- Import do módulo `./github-copilot/cloud-agent.js` (7 símbolos) + `COPILOT_CLOUD_AGENT_MESSAGES`.
- `InitCommandOptions.copilotCloud?: boolean`, campo `copilotCloudOption` e atribuição no construtor.
- Em `execute()`: `resolveCopilotCloudDecision` antes de `createDirectoryStructure`; `copilotDecision.write` passado a `generateSkillsAndCommands`; após `createConfig`, persistência best-effort (`persistCopilotCloudOptIn`), remoção no opt-out (`removeCopilotCloudFiles`) e cálculo de `listManagedCloudFiles`/`findUnmanagedCloudFiles`; objeto `copilot` passado a `displaySuccessMessage`.
- Novo método privado `resolveCopilotCloudDecision` (precedência flag → config → arquivos gerenciados presentes → confirm interativo (padrão Não) → não interativo sem sinal = pular sem persistir).
- `generateSkillsAndCommands(projectPath, tools, writeCopilotCloud)` + hook `if (tool.value === 'github-copilot' && writeCopilotCloud) await writeCopilotCloudFiles(projectPath)` imediatamente antes de `spinner.succeed(...)` (assim uma falha cai em `failedTools` e o init lança via `INIT_MESSAGES.setupFailedFor`, que o Lote 0 já trouxe).
- `displaySuccessMessage(..., configStatus, copilot)` + bloco de relato entre `removedSkills` e "Config status".

### 2.4 `src/core/update.ts`

- Import do módulo (6 símbolos) + `COPILOT_CLOUD_AGENT_MESSAGES`.
- `configuredAndNewTools` movido para logo após `configuredTools`.
- `await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools)` nos 3 pontos de saída (antes de `noConfiguredTools`, após `displayUpToDateMessage`, e no lugar da antiga linha de `configuredAndNewTools` antes de `detectNewTools`).
- Novo método privado `syncCopilotCloudFiles` antes de `displayUpToDateMessage`, com todo o comportamento final: opt-in → escreve + aviso de colisão; opt-out explícito → remove gerenciados; indeciso + `isInteractive()` → dica dim; `github-copilot` não configurado → remove gerenciados; falha → `console.warn` não fatal.

### 2.5 `src/cli/index.ts` e `src/core/completions/command-registry.ts`

- `.option('--copilot-cloud', …)` e `.option('--no-copilot-cloud', …)` após `--no-animation`; tipo do `options` da action com `copilotCloud?: boolean`; passthrough para `new InitCommand({ … })`.
- Duas entradas novas no registry de completions do `init`.

Verificado no binário: `openspec init --help` mostra as duas flags em PT-BR e `openspec completion generate bash` inclui `copilot-cloud`/`no-copilot-cloud`.

## 3. Strings adicionadas ao catálogo (`src/messages/index.ts`)

| Seção | Chaves novas |
|---|---|
| `CLI_DESCRIPTIONS` | `copilotCloud`, `noCopilotCloud`, `copilotCloudCompletion`, `noCopilotCloudCompletion` |
| `INIT_MESSAGES` | `copilotCloudFlagIgnored`, `copilotCloudPrompt`, `copilotCloudFiles(files)`, `removedCopilotCloudOptOut(count)`, `copilotCloudSkipped` |
| `UPDATE_MESSAGES` | `removedCopilotCloudOptOut(count)`, `removedCopilotCloudNotConfigured(count)`, `copilotCloudAvailableHint`, `copilotCloudSyncFailed(message)` |
| `PROJECT_CONFIG_MESSAGES` | `invalidGithubCopilotCloudAgentField`, `invalidGithubCopilotField` |
| **`COPILOT_CLOUD_AGENT_MESSAGES`** (seção nova) | `cannotBuildContent(label)`, `parentNotDirectory(candidate)`, `cannotResolveAncestor(filePath)`, `managedPathNotRegularFile(filePath)`, `conflictingAgentProfiles(alt, agent)`, `leftUntouched(files: string[])` (compartilhada init+update) |
| **`COPILOT_CLOUD_AGENT_TEMPLATE_MESSAGES`** (seção nova) | `managedMarker`, `setupStepsBody`, `agentFileBody(managedMarkerBlock)` |

Total: **21 chaves** (19 mensagens + 2 corpos de template; `agentFileBody` recebe o bloco do marcador como parâmetro em vez de o módulo fazer `replace`, evitando um ponto de quebra silenciosa).

Divergências propositais do brief §4:
- `copilotCloudCompletion`/`noCopilotCloudCompletion` foram **criadas** (o brief deixava opcional reutilizar `copilotCloud`/`noCopilotCloud`) — o texto do registry do upstream é diferente do help do commander, e o fork preserva essa diferença.
- `agentFileBody` é função `(managedMarkerBlock: string) => string` (o brief sugeria string + `replace`).

Termos usados (novos no glossário do fork): "Copilot coding agent (nuvem)" para *cloud coding agent*; "arquivos de nuvem"; "opt-in"/"opt-out" mantidos. Nomes não traduzidos: `openspec.agent.md`, `openspec.md`, `copilot-setup-steps` (arquivo e job), `githubCopilot`/`cloudAgent`, `--copilot-cloud`/`--no-copilot-cloud`, `github-copilot`, `openspec …`, `actions/checkout@v4`, `name: "Copilot Setup Steps"`, valores de `tools:`, `openspec/`, `openspec/changes/`, `openspec/config.yaml`.

## 4. Testes portados/adaptados (70 novos)

| Arquivo | Novos | Adaptações |
|---|---|---|
| `test/core/github-copilot-cloud-agent.test.ts` (novo) | **48** | `MANAGED_MARKER` e `removeManagedMarker` usam o marcador PT-BR (importado de `COPILOT_CLOUD_AGENT_TEMPLATE_MESSAGES`); `MARKERLESS_LEGACY_COPILOT_AGENT_FILE` mantido **EN verbatim** (fixture do legado do upstream); `npm install -g @dynamicworks/br-openspec`; `name: 'BR-OpenSpec'`; `# Agente BR-OpenSpec`; frases PT-BR (`use \`--yes\` só depois de confirmar…`, `execute \`openspec --version\``, `instale com \`npm install -g @dynamicworks/br-openspec\``); erros PT-BR (`Perfis de agente do Copilot em conflito`, `O caminho gerenciado do Copilot não é um arquivo regular`, `O caminho está fora do diretório permitido` — chave do Lote 0). O teste `refreshes the previous marker-bearing generated agent` passou a construir o fixture via `generateUpstreamPreviousCopilotAgentFileBody(true)` (exportada só para isso) em vez de derivar por `.replace()` de frases EN. Contagem de `it()` idêntica à do upstream (48). |
| `test/core/init.test.ts` | **11** | `rejects.toThrow('A configuração do BR-OpenSpec falhou para: GitHub Copilot')` e `toContain('Configuração do BR-OpenSpec Incompleta')` (chaves do Lote 0); o `confirmMock` interativo é diferenciado pela substring **neutra de idioma** `'copilot-setup-steps.yml'`; asserções de saída via `INIT_MESSAGES.copilotCloudFlagIgnored`, `INIT_MESSAGES.copilotCloudFiles(...)` e `COPILOT_CLOUD_AGENT_MESSAGES.leftUntouched([...])`. |
| `test/core/update.test.ts` | **8** | import de `generateCopilotSetupSteps` e `persistCopilotCloudOptIn`; regex do marcador → PT-BR; `toContain('# Agente BR-OpenSpec')`; `stringContaining('falha ao sincronizar os arquivos do Copilot coding agent')`. |
| `test/core/project-config.test.ts` | **3** | `stringContaining("Campo 'githubCopilot.cloudAgent' inválido")` e `"Campo 'githubCopilot' inválido"`. |

Nenhum teste foi pulado: **nenhum** teste deste tema depende do subsistema de stores.

## 5. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.changeset/add-copilot-cloud-agent-files.md`, `.changeset/copilot-cloud-opt-in.md` | D3 — o fork tem changeset próprio, gerado no fechamento da sync (item 16 do plano). |
| Hunks de `docs/` (ver §6) | Lote G (docs dedicado), conforme as observações do orquestrador. |
| Hunks vizinhos de `161f9454` (MiniMax), `59bfb27a` (Codex `.agents`), `13e213e0` (Rovo) em `init.ts`/`update.ts`/`cli/index.ts` | Outros temas — já portados no lote anterior (`f764393`); os hunks Copilot foram aplicados por cima do estado atual do fork. |
| `a0decbe` (stores) — commit inteiro | D1 (adiado). Só o helper `resolveConfigFilePath` (10 linhas) foi recriado localmente, como o brief manda. |

## 6. Hunks de docs pendentes para o lote G

Todos de `73207a6f` (`7a4a745d` não tocou docs). Aplicar em `docs/` (EN, com `@fission-ai/openspec` → `@dynamicworks/br-openspec` e "OpenSpec" → "BR-OpenSpec" na prosa) **e** em `docs/pt-BR/` (tradução):

1. **`docs/cli.md`** — tabela de opções do `init`, 2 linhas após `--no-animation`:
   - `| \`--copilot-cloud\` | Set up GitHub Copilot [cloud coding-agent files](supported-tools.md#github-copilot-cloud-coding-agent) without prompting |`
   - `| \`--no-copilot-cloud\` | Skip GitHub Copilot cloud coding-agent files without prompting |`
   - PT-BR: usar `CLI_DESCRIPTIONS.copilotCloud`/`noCopilotCloud` como base e ajustar a âncora ao título PT-BR da subseção.
2. **`docs/customization.md`** — (a) bullet novo após "Add per-operation guidance": `**Remember integration choices** - e.g. the [GitHub Copilot cloud coding agent](supported-tools.md#github-copilot-cloud-coding-agent) opt-in`; (b) ao fim do YAML de exemplo, o bloco comentado + `githubCopilot:\n  cloudAgent: false`.
3. **`docs/supported-tools.md`** — (a) frase extra na nota `**`: "Selecting `github-copilot` can also set up the GitHub-hosted **cloud coding agent** — see [...] below."; (b) subseção nova `### GitHub Copilot cloud coding agent` (título PT-BR sugerido: `### Copilot coding agent do GitHub (nuvem)`) inserida **antes** de `### When to pick the shared \`.agents\` target`, com: parágrafo introdutório + link `https://docs.github.com/en/copilot/using-github-copilot/coding-agent`, lista dos 2 arquivos, frase "opt-in", tabela How/Behavior (4 linhas: init interativo / `--copilot-cloud` / `--no-copilot-cloud` / `update`) e parágrafo final sobre `githubCopilot.cloudAgent: true|false` + preservação de arquivos customizados.
4. **Acrescentar ao texto do fork (não existe no upstream):** uma frase na subseção de `supported-tools.md` avisando que arquivos gerados pelo **OpenSpec upstream** são reconhecidos e migrados para o conteúdo PT-BR do BR-OpenSpec (consequência da decisão §2.1 do brief).

Os demais hunks de docs desses commits pertencem a outros temas (MiniMax, telemetria, Codex `.agents`, Rovo Dev, `.openspec-target`) e já constavam como pulados.

## 7. Validação

```
pnpm exec tsc --noEmit                                     → limpo
pnpm lint                                                  → limpo
node build.js                                              → ✅ Build completed successfully
pnpm exec vitest run --exclude …skill-templates-parity… --exclude …skillssh-parity…
                                                           → 102 arquivos / 3359 testes passando
```

Greps negativos (todos conforme esperado):
- `fission-ai` em `cloud-agent.ts` aparece **só** nas 3 linhas dos geradores `generateUpstream*` (reconhecimento legado); zero em `src/messages/index.ts`.
- `Generated by OpenSpec` só na constante `UPSTREAM_MANAGED_MARKER`.
- Nenhum `throw new Error('…')`/`` throw new Error(`…`) `` literal em `cloud-agent.ts`; todos via `COPILOT_CLOUD_AGENT_MESSAGES`.
- Nenhum `console.log/warn` com literal nos hunks novos de `init.ts`/`update.ts` (os que o grep encontra são linhas de formatação pré-existentes: `  - ${prompt.toolId}: …`, `  ${line}`, etc.).

Greps positivos: `copilotCloud` em `cli/index.ts` (3), `init.ts` (12), `command-registry.ts` (as 2 flags); `syncCopilotCloudFiles` em `update.ts` (1 definição + 3 chamadas); `githubCopilot` em `project-config.ts` (8); `export function resolveConfigFilePath` (1).

### Smoke manual (diretórios temporários fora do repo)

| Cenário | Resultado |
|---|---|
| `init --tools github-copilot` (sem flag, não interativo) | nenhum arquivo de nuvem; saída: "Arquivos do Copilot coding agent (nuvem) ignorados (opt-in). Ative com 'openspec init --copilot-cloud'." |
| `init --tools github-copilot --force --copilot-cloud` | 2 arquivos criados com prosa PT-BR, `npm install -g @dynamicworks/br-openspec`, `name: BR-OpenSpec`; `openspec/config.yaml` com `githubCopilot:\n  cloudAgent: true` **no topo, com todos os comentários preservados**; saída lista os 2 caminhos |
| editar `copilot-setup-steps.yml` à mão + `update` | arquivo intacto + "Mantido(s) sem alteração: … Adicione manualmente o passo de instalação do BR-OpenSpec…" |
| `init --tools github-copilot --force --no-copilot-cloud` | arquivo customizado permanece; `openspec.agent.md` gerenciado removido ("Removidos: 1 arquivo(s) …(opt-out dos arquivos de nuvem)"); `cloudAgent: false` |
| `init --tools claude --copilot-cloud` | aviso amarelo "--copilot-cloud/--no-copilot-cloud foi ignorado porque a ferramenta github-copilot não foi selecionada." |
| `.github/agents/openspec.agent.md` com o conteúdo EN do upstream + `update` (opt-in) | substituído pelo conteúdo PT-BR (valida a decisão §2.1) |
| `openspec init --help` / `openspec completion generate bash` | as 2 flags aparecem com descrição PT-BR |

## 8. Dúvidas abertas / pontos para o revisor

1. **Reconhecimento dos arquivos EN do upstream (decisão §2.1 do brief).** Mantido conforme a recomendação. Consequência: um projeto vindo do OpenSpec upstream tem seus 2 arquivos **substituídos** pelo conteúdo PT-BR na primeira `init`/`update` do BR-OpenSpec (o passo de instalação passa a apontar para `@dynamicworks/br-openspec`). Isso é o comportamento desejado para o fork, mas vale mencionar no changeset/docs de fechamento. Se o revisor preferir a alternativa simples (não reconhecer o upstream), remover as 4 funções `generateUpstream*` + `UPSTREAM_MANAGED_MARKER` e ajustar 4 testes.
2. **Fragilidade estrutural herdada:** `COPILOT_CLOUD_FILE_CONTENTS` é avaliado **no import** do módulo, e `generateUpstreamLegacy…` usa `replaceRequired`, que lança se uma frase EN não existir. Uma "tradução acidental" nesses corpos derruba `openspec init`/`update` inteiros. Está coberto pelos testes (`generates valid agent frontmatter…`, `refreshes exact legacy…`) e pelo smoke `node bin/openspec.js init --help`, e há aviso em comentário no módulo — mas é um ponto sensível para o próximo mantenedor.
3. **`readProjectConfig` passou a ser chamado no init/update** (via `readCopilotCloudOptIn`): configs com outros campos malformados agora emitem `console.warn` também durante `init`/`update`. É o mesmo comportamento do upstream; não foi suprimido.
4. **Chaves de completions duplicadas:** criei `copilotCloudCompletion`/`noCopilotCloudCompletion` além de `copilotCloud`/`noCopilotCloud`. Se a política do fork for reutilizar (como faz com `noAnimation`), basta apagar as duas variantes e apontar o registry para as primeiras — os textos são propositalmente diferentes, seguindo o upstream.
5. **`resolveConfigFilePath` agora existe** em `src/core/project-config.ts` (exportada). `LF-schema-cmd` previa criá-la se ausente — não precisa mais; deve apenas importá-la.
6. **Não** foi adicionado `copilot-setup-steps.yml` ao `.github/` do próprio repositório do fork (o repo não usa Copilot cloud). Todos os smokes rodaram em diretórios temporários.

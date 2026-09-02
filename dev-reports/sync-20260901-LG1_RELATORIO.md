# Relatório do lote LG1 — Docs: ciclo de vida, `/opsx:sync`, aposentadoria de capability e backlog de ferramentas

**Branch:** `sync/upstream_20260901` · **Commit:** `71a66b5` · **Arquivos:** 24 (12 EN + 12 pt-BR) · **+394 / −67**

**Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm exec vitest run` (excluindo os 2 testes de paridade) → **115 arquivos / 3657 testes passando**.

Nenhuma alteração em `src/`, `schemas/`, `openspec/specs/` ou `test/`. Nenhuma chave nova no catálogo `src/messages/index.ts`.

---

## 1. Commits portados (19)

| Commit | Título | Arquivos de docs tocados |
|---|---|---|
| `4e4c9e1f` | docs(workflows): visualize the OpenSpec lifecycle (#1507) | `workflows.md` (EN+PT) |
| `98c79324` | docs(workflows): fix sequence diagram rendering (#1654) | `workflows.md` (EN+PT) — aplicado já no estado final |
| `1a10dd58` | docs(opsx): clarify /opsx:sync description and add usage section (#1606) | `opsx.md` (EN+PT) |
| `d0071d73` | docs(archive): show how to retire capabilities (#1751) | `cli.md` (EN+PT) |
| `73207a6f` | feat(copilot): make cloud coding-agent files opt-in (#1517) | `cli.md`, `customization.md`, `supported-tools.md` (EN+PT) |
| `42d7f673` | feat(tools): add Command Code support as a skills-only tool (#1613) | `cli.md`, `supported-tools.md` (EN+PT) |
| `59c16a44` | feat(tools): add Command Code command adapter (#1622) | `supported-tools.md` (EN+PT) |
| `07dea6ed` | fix(update): don't hijack the agents target on legacy Codex upgrade (#1522) | `supported-tools.md` (EN+PT) |
| `f3aa167d` | feat(tools): add Zed Agent support (#1659) | `cli.md`, `commands.md`, `how-commands-work.md`, `supported-tools.md`, `troubleshooting.md` (EN+PT) |
| `161f9454` | feat: add MiniMax Code skills support (#1214) | `cli.md`, `commands.md`, `how-commands-work.md`, `supported-tools.md`, `troubleshooting.md` (EN+PT) |
| `13e213e0` | feat(tools): add Atlassian Rovo Dev CLI (#1516) | `supported-tools.md`, `cli.md` (EN+PT) |
| `59bfb27a` | fix(codex): install skills in canonical agents directory (#1511) | `how-commands-work.md`, `migration-guide.md`, `supported-tools.md`, `troubleshooting.md`, `commands.md` (EN+PT) |
| `79f1dac6` | feat(codex): make Codex skills-only, retire managed prompts (#1283) | idem — portado **no estado final de `59bfb27a`** |
| `9ae75c86` | fix(archive): don't write ANSI escape codes to a redirected stdout (#1603) | `troubleshooting.md` (EN+PT) |
| `18688c8b` | fix(archive): never dead-end a capability retirement (#1699) | `writing-specs.md` (EN+PT) |
| `521ee33e` | feat(archive): let a change retire a capability it empties (#1484) | `cli.md`, `concepts.md`, `faq.md`, `writing-specs.md` (EN+PT) |
| `109f81f1` | fix(antigravity): `.agent` → `.agents` (#830) | `supported-tools.md` (EN+PT) — ver §3 |
| `3d0701f8` | fix(workflows): preserve nested spec paths (#1508) | `opsx.md`, `troubleshooting.md`, `writing-specs.md` (EN+PT) |
| `afea111c` | fix(status): clarify planning completion (#1505) | `cli.md` (EN+PT) |

---

## 2. O que foi acrescentado, por arquivo

### `docs/workflows.md` + `docs/pt-BR/workflows.md`
Seção nova **"Workflow at a Glance" / "Visão Geral do Workflow"** entre o blockquote `> **Customization:**` e `## Two Modes` / `## Dois Modos`, com dois diagramas Mermaid:
- `flowchart TD` do ciclo de vida OPSX (idea → explore opcional → propose → loop de update → apply → verify/sync opcionais → archive);
- `sequenceDiagram` Humano ↔ Assistente de IA ↔ CLI ↔ Arquivos, com bloco `opt`/`alt` de "oferecer sync antes de arquivar" e `Note` sobre `openspec archive <name> --yes`.

Cuidados aplicados: `participant CLI as BR-OpenSpec CLI` (EN) / `CLI do BR-OpenSpec` (PT); no PT os **IDs** dos nós e participantes ficam em inglês (`Idea`, `Human`, `Assistant`, `CLI`, `Files`) com alias (`actor Human as Humano`), porque `Note over Human,CLI` referencia IDs; **nenhum `;`** dentro de rótulo ou `Note` (verificado por `awk`+`grep`) — foi exatamente o bug corrigido por `98c79324`.

### `docs/opsx.md` + pt-BR
- Linha `/opsx:sync` da tabela de comandos: `Sync delta specs to main (default workflow, optional)` → `Merge delta specs into main specs (optional)`; PT: `Mescla delta specs nas specs principais (opcional)`.
- Subseção nova `### Sync delta specs` / `### Sincronizar as delta specs` entre "Updating a change" e "Finish up", explicando que o sync aplica o delta **inteiro** (`## REMOVED` exclui da spec principal, renomeado é retitulado no lugar, o não mencionado fica intocado) e que é opcional.
- (`3d0701f8`) Caixa ASCII: `• Create specs/<capability>/spec.md` → `• Create delta spec files` / `• Criar arquivos de delta spec`, **preservando a largura da caixa** (verificado por `assert len(old) == len(new)`).

### `docs/cli.md` + pt-BR
- (`73207a6f`) Duas linhas novas na tabela de opções do `init`: `--copilot-cloud` e `--no-copilot-cloud`.
- (`42d7f673`/`161f9454`/`f3aa167d`/`13e213e0`) Lista **Supported tool IDs** ganha `command-code`, `minimax-code`, `rovodev`, `zed`.
- (`161f9454`) Exemplo novo `openspec init --tools minimax-code`.
- (`521ee33e`) `--no-validate`: "Also disables capability retirement — with no validator verdict, nothing is retired".
- (`d0071d73`) Bloco **"Retire a capability" / "Aposentar uma capability"** entre os Exemplos e o "What it does": `.openspec.yaml` com `retire_capabilities: true`, `openspec archive retire-legacy --yes` e o parágrafo sobre exclusão do `spec.md` e o abort sem marcador.
- (`521ee33e`) Lista **"What it does" / "O que é feito"** de 4 → 7 passos.
- (`afea111c`) `isPlanningComplete` no payload JSON do `status` + parágrafo explicativo (`isComplete` como alias de compatibilidade).

### `docs/supported-tools.md` + pt-BR
- Parágrafo "Codex is skills-only …" (estado final de `59bfb27a`).
- Linhas novas na tabela: **Command Code** (`.commandcode/commands/opsx-<id>.md`, estado final de `59c16a44`), **MiniMax Code** (`~/.minimax/skills/…`), **Rovo Dev CLI**, **Zed Agent**.
- Codex: `.codex/skills` + `$CODEX_HOME/prompts` → `.agents/skills/openspec-*/SKILL.md` / "Not generated (skills-only; use `$openspec-*`)"; a nota de rodapé `\*` do Codex global foi removida.
- Antigravity: `.agent/…` → `.agents/…` (ver §3).
- Linha "none — skills only" ganha MiniMax Code e Zed Agent; a linha `opsx-<id>` deixa de dizer "including Codex's global prompts".
- Parágrafo do MiniMax Code (skills globais, sem `.minimax`/`.mavis` no repo).
- Seção nova `### GitHub Copilot cloud coding agent` / `### Coding agent na nuvem do GitHub Copilot` com a tabela de opt-in e `githubCopilot.cloudAgent`.
- Seção `.agents`: raiz compartilhada Codex + Zed (`f3aa167d`), marcador `.openspec-target`, inferência de titularidade pré-marcador (`59bfb27a`), respeito do `openspec update` à titularidade (`07dea6ed`), parágrafo do Zed Agent (versão mínima, worktree trust).
- Lista **Available tool IDs** atualizada.

### `docs/commands.md` + pt-BR
Linha "none — skills only" ganha MiniMax Code e Zed Agent; a linha `opsx-<id>` deixa de citar "Codex (global prompts)".

### `docs/how-commands-work.md` + pt-BR
Mesmas duas linhas da tabela; bullet **Commands** passa a dizer que o Codex não recebe arquivos de comando gerados (use `.agents/skills/openspec-*`); passo 1 de "Confirming it's installed" lista Codex, MiniMax Code e Zed Agent entre as ferramentas somente-skills.

### `docs/migration-guide.md` + pt-BR
Item Codex na lista de localizações legadas (caminho canônico `.agents`, reconciliação após substituição, preservação de arquivos custom/divergentes, allowlist de prompts); parágrafo do `--force` sobre limpeza de prompts legados; parágrafo "Codex is skills-only in OPSX".

### `docs/troubleshooting.md` + pt-BR
- (`f3aa167d`+`59bfb27a`) Passo 6 reescrito: Codex, Kimi Code, ForgeCode, MiniMax Code, Mistral Vibe, Trae, Zed Agent e o alvo `.agents` são somente-skills; `$openspec-propose` no Codex; conferir `.agents/skills/openspec-*`.
- (`59bfb27a`) `.codex/skills/openspec-*` → `.agents/skills/openspec-*` na limpeza não interativa.
- (`3d0701f8`) `openspec/specs/<capability>/spec.md` → `<capability-path>`, preservando diretórios de domínio.
- (`9ae75c86`) Parágrafo novo sobre stdout não-TTY: versões antigas escreviam escapes ANSI na captura; versões atuais leem os prompts como texto puro e o `openspec archive` sem argumento pede o nome da mudança em vez de desenhar o seletor.

### `docs/customization.md` + pt-BR
Bullet "Remember integration choices" apontando para o opt-in do coding agent na nuvem, e bloco `githubCopilot: cloudAgent: false` no YAML de exemplo com o comentário explicativo.

### `docs/concepts.md` + pt-BR
`.openspec.yaml` na árvore de exemplo lista `retire_capabilities`; linha `## REMOVED Requirements` da tabela explica a aposentadoria da capability.

### `docs/faq.md` + pt-BR
"Where do archived changes go?": "Nothing is deleted" → texto que reconhece que `retire_capabilities: true` pode excluir a spec principal.

### `docs/writing-specs.md` + pt-BR
Parágrafo "On archive, ADDED …" no **estado final de `18688c8b`**: aposentadoria ao remover o último requisito, exigência do marcador, recusa quando a spec tem conteúdo fora do título / `## Purpose` / blocos de requisito, e a linha de `git checkout`; parágrafo do `## Purpose` com `<capability-path>` (`3d0701f8`).

---

## 3. Adaptações ao fork (divergências deliberadas do upstream)

| # | Adaptação | Motivo |
|---|---|---|
| A1 | Listas de tool IDs e linhas de tabela seguem o `AI_TOOLS` do fork: **CodeArts (`codeartsagent`), Hermes, Oh My Pi (`oh-my-pi`) e ZCode (`zcode`) não entram** | Essas ferramentas não existem em `src/core/config.ts` do fork (débito anterior a `45cca5db`, fora do intervalo desta sync) |
| A2 | **`rovodev` acrescentado** às listas de IDs de `cli.md` e `supported-tools.md` (EN+PT) | O upstream esqueceu de incluí-lo em `13e213e0`; a nota "esta lista espelha `AI_TOOLS`" exige a presença |
| A3 | `commands.md` e `how-commands-work.md`: a coluna de exemplo do padrão `opsx-<id>` troca "Codex (global prompts)" por **Command Code** (o upstream usa Trae / Oh My Pi) | O fork não tem adaptador de comando para Trae nem Oh My Pi (`src/core/command-generation/adapters/` não tem `trae.ts`); Command Code tem |
| A4 | **`109f81f1`**: o hunk do upstream está em `docs-lab/reference/supported-tools.md`, que é caminho proibido. A correção `.agent` → `.agents` do Antigravity foi aplicada em `docs/supported-tools.md` (linha da tabela + a frase "Note `.agents` is not `.agent`" → "the singular directory is Antigravity's former root, read only for migration"), e a frase da árvore compartilhada passou a citar Antigravity | `src/core/config.ts` do fork já usa `skillsDir: '.agents'` + `legacySkillsDirs: ['.agent']` para Antigravity; o `docs/` do upstream continua desatualizado (só o `docs-lab` foi corrigido). Manter `.agent` documentaria comportamento inexistente |
| A5 | Copilot cloud: "installs **the `openspec` CLI**" em vez de "installs `@fission-ai/openspec`" | Ver dúvida aberta Q1 |
| A6 | `writing-specs.md`: omitida a oração "selected stores receive checkout-scoped recovery guidance instead" | Subsistema stores adiado (D1) |
| A7 | `cli.md`: lista "What it does" do archive vai a 7 passos (claim do destino, rollback, retenção de fallback) | Confirmado no fork: `src/core/archive.ts` tem `archiveClaimPath`, `stagedSource`, `restoreError`, `copiedButStagedSourceRetained` (39 ocorrências de `fallback|staged|restore`). O risco levantado na §6 do brief **não se aplica** — o lote A trouxe esse código |
| A8 | Verbo PT-BR de retirement = **"aposentar/aposentadoria/aposentada"** | Bate com o catálogo já portado (`src/messages/index.ts` linhas 444–508 e 3009–3023: "Aposentadoria de capabilities", "aposentar a capability") |
| A9 | G12: `docs/pt-BR/cli.md` normaliza "specs delta" → **"delta specs"** (2 ocorrências: `--deltas-only` e a introdução do `archive`), além da linha 167 de `opsx.md` | Determinação do orquestrador; `grep -rn 'specs delta' docs/pt-BR/` agora retorna vazio |
| A10 | Âncora PT-BR do Copilot cloud: `supported-tools.md#coding-agent-na-nuvem-do-github-copilot` (não a âncora EN) | Links relativos em `docs/pt-BR/` resolvem para o espelho pt-BR |

---

## 4. Hunks pulados

| Hunk | Motivo |
|---|---|
| `521ee33e`, `afea111c` → `docs/agent-contract.md` | D7 — a página não existe no fork |
| `521ee33e`, `d9bcc18` etc. → `docs/stores-beta/**` | D1 — subsistema stores adiado |
| `4e4c9e1f` → `website/components/mdx.tsx`, `mermaid.tsx`, `lib/source.ts`, `package.json`, `pnpm-lock.yaml`, `source.config.ts` | D2 — o fork não tem `website/`; o GitHub renderiza ```` ```mermaid ```` nativamente, nada a instalar |
| `109f81f1` → `docs-lab/reference/supported-tools.md` | Caminho proibido; conteúdo relevante reaplicado em `docs/` (A4) |
| `79f1dac6` → hunks que citam `.codex/skills` | Superados por `59bfb27a` (`.agents/skills`); portado o estado final |
| `42d7f673` → linha "Command Code … Not generated (no command adapter)" | Superada por `59c16a44` (adaptador de comando existe) |
| `98c79324` → estado anterior da `Note` com `;` | Portado só o estado final |

---

## 5. Strings adicionadas ao catálogo

**Nenhuma.** Este lote é 100% documentação; nenhum dos 19 commits toca `src/`, e nenhum texto novo é exibido pela CLI. `src/messages/index.ts` não foi alterado.

---

## 6. Testes

- **Nenhum arquivo de `test/**` foi tocado** (nenhum dos 19 commits tem hunk em `test/` que pertença a este lote — os hunks de `test/` desses commits já saíram nos lotes de código).
- Nenhum teste do fork lê `docs/**` como fixture; não existe teste de paridade EN↔pt-BR de documentação.
- Suíte completa rodada mesmo assim: **115 arquivos / 3657 testes passando** (excluindo `skill-templates-parity` e `skillssh-parity`, conforme a regra).
- Testes pulados por dependência de stores: nenhum neste lote.

---

## 7. Estado do `sweep_docs.py` ao final

Commits do lote que ficaram **OK (0 faltando)**: `d0071d7`, `1a10dd5`, `98c7932`, `3d0701f`, `07dea6e`, `9ae75c8`, `13e213e`, e ainda `c747ed1` (já resolvido antes).

GAPs remanescentes **dos commits deste lote** — todos esperados e justificados:

| Commit | Resíduo | Justificativa |
|---|---|---|
| `4e4c9e1` | `workflows.md` 1/44 | Linha da `Note` com `;`, superada por `98c79324` |
| `18688c8` / `521ee33` | `writing-specs.md` 1/1 | Parágrafo contém a oração de stores omitida (A6) |
| `521ee33` / `afea111` | `agent-contract.md` 2/2 e 1/1 | D7 |
| `f3aa167` | `cli.md` 1/1, `commands.md` 1/1, `how-commands-work.md` 2/2, `supported-tools.md` 3/14, `troubleshooting.md` 1/1 | Linhas que citam CodeArts/Hermes/Oh My Pi/ZCode ou a lista de IDs do upstream (A1/A3) + a frase da árvore compartilhada com Antigravity (A4) |
| `42d7f67` | `cli.md` 1/1, `supported-tools.md` 3/3 | Lista de IDs do upstream (A1) + estado intermediário superado por `59c16a44` |
| `59c16a4` | `supported-tools.md` 1/2 | Linha "skills only" com CodeArts/Hermes (A1) |
| `161f945` | `cli.md` 1/3, `commands.md` 1/1, `supported-tools.md` 2/8 | Idem (A1) |
| `59bfb27` | `supported-tools.md` 2/16 | "Codex is the exception… If both codex and agents", superado por `f3aa167d` (acrescenta Zed) |
| `73207a6` | `supported-tools.md` 2/11 | Frase com `@fission-ai/openspec` e "the OpenSpec CLI" (A5) |

GAPs **fora deste lote** (esperados): `a7353ae`, `137404b`, `8364428` (agent-contract/stores) e `7276c6c`, `fc0fec1`, `83be9d1`, `622c509`, `8364428` (`cli.md`/`troubleshooting.md`) → **lote LG2**; `d9bcc18` → `stores-beta` (D1).

---

## 8. Dúvidas abertas / pendências

**Q1 — `@fission-ai/openspec` gerado pelo fork (identidade).** `src/core/github-copilot/cloud-agent.ts` (linhas 112, 136, 205) ainda escreve `npm install -g @fission-ai/openspec` no `copilot-setup-steps.yml` e no `openspec.agent.md` gerados, embora o pacote do fork seja `@dynamicworks/br-openspec@2.3.0`. Documentar o nome do pacote seria documentar um bug; documentar `BR-OpenSpec` seria documentar algo que o código não faz. **Escolha deste lote:** a doc diz "instala a CLI `openspec` no ambiente do agente" (verdadeiro nos dois cenários). **Ação sugerida:** um lote de código deve trocar o pacote em `cloud-agent.ts` (e os testes correspondentes); depois disso a frase pode nomear o pacote.

**Q2 — Débito de docs anterior a `45cca5db` (fora desta sync).** `docs/supported-tools.md`, `commands.md` e `how-commands-work.md` do fork estão defasados em relação ao upstream em pontos que **não** vêm deste intervalo: Trae aparece como "Not generated" (correto para o fork — não há `trae.ts` em `adapters/`), Qwen usa `.toml`, e faltam CodeArts/Hermes/Oh My Pi/ZCode (que o fork realmente não suporta). Não mexi nisso. Se o objetivo for paridade de ferramentas com o upstream, é um lote de **código** (`src/core/config.ts` + adapters), não de docs.

**Q3 — `docs/pt-BR/agent-contract.md`.** O fork não tem `docs/agent-contract.md` (nem EN nem PT). Cinco commits do intervalo (`a7353ae`, `8364428`, `137404b`, `521ee33e`, `afea111c`) alteram essa página. Se a decisão D7 mudar, esses hunks precisam de um lote próprio — o `sweep_docs.py` vai continuar apontando GAP em `agent-contract.md` para sempre enquanto a página não existir.

**Q4 — Antigravity e a árvore `.agents` compartilhada.** Estendi a frase "Because `.agents/skills/` is shared by …" para incluir Antigravity (A4), o que gera uma divergência a mais no sweep contra `f3aa167`. É factualmente correto no fork (`AI_TOOLS` põe `antigravity`, `codex`, `zed` e `agents` todos em `skillsDir: '.agents'`) e é o que o upstream documentou em `docs-lab` no `109f81f1`. Se o orquestrador preferir fidelidade literal ao `docs/` do upstream, basta remover "Antigravity, " das duas frases (EN e PT).

**Q5 — Renderização dos diagramas.** Sem `website/`, os dois Mermaid só são vistos no GitHub. Confirmei mecanicamente: 2 blocos por arquivo, fences balanceados, zero `;` dentro dos diagramas, `Note over Human,CLI` referenciando IDs e não aliases. **Revisão visual no GitHub ainda não foi feita** (não há push neste lote).

---

## 9. Revisão rodada 1 (2026-09-02)

Seis achados recebidos (todos "importante"). Cinco corrigidos, um rejeitado como falso positivo.
Validação após as correções: `tsc --noEmit` **ok**, `node build.js` **ok**, `vitest run` (excluindo os dois testes de paridade de skills) **115 arquivos / 3657 testes, todos verdes**.
As correções foram incorporadas ao commit do lote via `git commit --amend --no-edit` (branch não publicada).

### 9.1 Corrigidos

| # | Achado | O que foi feito |
|---|---|---|
| 1 | **D24' — nota de termos reservados desatualizada** (README.md, AGENTS.md, `src/messages/index.ts`) | As três cópias afirmavam que traduzir as palavras-chave "quebra `openspec validate`". Verificado em `src/core/validation/validator.ts:698-708` (`level: 'WARNING'`) e `:780-782` (`const valid = this.strictMode ? errors === 0 && warnings === 0 : errors === 0`): omitir SHALL/MUST é **WARNING**, erro só com `--strict`. Texto único aplicado nas três cópias (EN em README/AGENTS, PT no cabeçalho do catálogo): "Omitting `SHALL`/`MUST` from a requirement makes `openspec validate` emit a WARNING (an error only under `--strict`); translating the structural markers breaks spec/change parsing outright." |
| 2 | **D24' — env vars e opt-out de telemetria em AGENTS.md** | `AGENTS.md:155` dizia "Auto-disabled in CI (`CI=true`)". Verificado em `src/utils/ci.ts:9,15-19`: é CI qualquer valor exceto `''`/`false`/`0`/`no`/`off`. Linha reescrita e acrescentado o opt-out por configuração (`openspec config set telemetry.enabled false`, confirmado em `src/telemetry/index.ts:93` e `src/commands/config.ts:308`). Em "Useful Environment Variables" foi acrescentado `OPENSPEC_NO_COMPLETIONS=1` (`src/core/completion-tip.ts:42`). |
| 4 | **D24' (passe completo)** — mesmo escopo dos itens 1 e 2, mais a alínea (c) | Alínea (c) executada: `docs/cli.md` e `docs/pt-BR/cli.md` ganharam, após a tabela "Agent-Compatible Commands", um parágrafo dizendo que o formato do JSON (nomes de campos, ids, status, níveis `ERROR`/`WARNING`/`INFO`) é estável e igual ao upstream, mas que o texto legível dentro dos campos é PT-BR — citando `issues[].message` (`openspec validate --json`, confirmado em `src/commands/validate.ts:33`) e `warning` (`openspec instructions --json`, confirmado em `src/core/artifact-graph/instruction-loader.ts:88,366`). O campo `status[].message` sugerido no achado **não existe** (o JSON do `status` tem `artifacts[].status`, um enum) — por isso não foi citado. Acrescentada também ao espelho EN a ressalva de que alguns exemplos ilustrativos da página mantêm texto em inglês por legibilidade. |
| 5 | **`docs/supported-tools.md` — nomear o pacote** | Achado procedente (ver 9.2). `docs/supported-tools.md:118` → "— installs `@dynamicworks/br-openspec` in the agent's environment"; `docs/pt-BR/supported-tools.md:99` → "— instala o `@dynamicworks/br-openspec` no ambiente do agente". Espelha o hunk do upstream `73207a6f` (que diz `@fission-ai/openspec`). **A5 e Q1 ficam retratados.** |
| 6 | **Terminologia PT-BR do Copilot cloud agent** | Catálogo usa "Copilot coding agent (nuvem) do GitHub" (16 ocorrências em `src/messages/index.ts`). Renomeado o título `### Coding agent na nuvem do GitHub Copilot` → `### Copilot coding agent (nuvem) do GitHub` em `docs/pt-BR/supported-tools.md:95`, e atualizadas as 5 referências/âncoras (`docs/pt-BR/supported-tools.md:89`, `docs/pt-BR/cli.md:96,97`, `docs/pt-BR/customization.md:21` e o comentário YAML de `docs/pt-BR/customization.md:57-58`). Âncora nova: `#copilot-coding-agent-nuvem-do-github`. Nenhuma âncora antiga sobrou (`grep -rn "coding-agent-na-nuvem" docs/` → vazio). |

### 9.2 Rejeitado

| # | Achado | Evidência contrária |
|---|---|---|
| 3 | **"`openspec init --copilot-cloud` gera arquivos que instalam o pacote do upstream" (`src/core/github-copilot/cloud-agent.ts`)** — **falso positivo** | As 3 ocorrências de `@fission-ai/openspec` (linhas 112, 136, 205) estão **dentro do bloco de corpos verbatim do upstream**, delimitado pelo comentário de `cloud-agent.ts:80-83` ("Corpos do upstream (inglês, verbatim) — usados apenas para reconhecer arquivos gerados pelo OpenSpec upstream como gerenciados. Não traduzir."). São as funções `generateUpstreamCopilotSetupStepsBody` (:85), `generateUpstreamCopilotAgentFileBody` (:119) e `generateUpstreamPreviousCopilotAgentFileBody` (:200), consumidas **exclusivamente** por `getLegacyCopilotCloudFileContents` (:333-355), que monta a lista de conteúdos legados a reconhecer. O conteúdo realmente **escrito** vem de `COPILOT_CLOUD_FILE_CONTENTS` (:328-331) → `generateCopilotSetupSteps`/`generateCopilotAgentFile` → catálogo `COPILOT_CLOUD_AGENT_TEMPLATE_MESSAGES`, que já usa `@dynamicworks/br-openspec` (`src/messages/index.ts:1641` `run: npm install -g @dynamicworks/br-openspec`; `:1661` "instale com `npm install -g @dynamicworks/br-openspec`"). Não há bug de identidade e **nenhum código foi alterado**; a consequência documental do achado (nomear o pacote na doc) foi tratada no item 5. |

### 9.3 Retratações no corpo deste relatório

- **A5** (§3) e **Q1** (§8) estão **superadas**: a premissa ("o fork gera `@fission-ai/openspec`") é falsa, e as docs EN/PT passaram a nomear `@dynamicworks/br-openspec`.
- A linha de GAP do `73207a6` na §7 ("Frase com `@fission-ai/openspec` … (A5)") passa a valer só pela diferença de nome do pacote (identidade do fork), não por vagueza.

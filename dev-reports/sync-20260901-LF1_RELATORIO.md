# Relatório do lote LF1 — Telemetria e feedback

**Branch:** `sync/upstream_20260901` · **Commit:** `e484080618aa09e56fe111f14d8f21909d66e38a`
**Título:** `fix(telemetry): portar telemetry.enabled no config global, aviso em stderr e relatório completo no feedback do upstream v1.9.0–v1.10.0`
**Arquivos tocados:** 21 (+711 / −60), sendo 3 novos.

Commits do upstream portados, na ordem: `622c509a`, `804427b6`, `db981f27`, `d56f9fc7`, `fc0fec12`. Todos **integralmente** (nenhum hunk de `src/` ficou sem porte). Um único commit temático, como o lote pede.

---

## 1. O que foi portado, por commit

### 622c509a — `fix(telemetry): honor telemetry.enabled in global config (#1513)`

| Arquivo do fork | Ação |
|---|---|
| `src/utils/ci.ts` | **criado**, cópia verbatim do upstream (`diff` vazio contra `622c509a:src/utils/ci.ts`) |
| `src/core/config-schema.ts` | seção `telemetry` no `GlobalConfigSchema` (com `passthrough()`), `'telemetry'` em `KNOWN_TOP_LEVEL_KEYS`, nova const `TELEMETRY_SETTABLE_KEYS`, bloco `rootKey === 'telemetry'` em `validateConfigKeyPath` |
| `src/core/global-config.ts` | `export interface TelemetryConfig` (fonte única) + campo `telemetry?: TelemetryConfig` em `GlobalConfig` |
| `src/core/version-check.ts` | removido o `CI_DISABLED_VALUES`/`isCiEnvironment()` local, agora importado de `../utils/ci.js`; importa `getGlobalConfig`; gate `telemetry?.enabled === false` em `isCheckEnabled()`; JSDoc atualizado |
| `src/telemetry/config.ts` | interface local `TelemetryConfig` trocada por `import type` + `export type { TelemetryConfig }` (re-export) |
| `src/telemetry/index.ts` | doc-comment do módulo, imports de `getGlobalConfig`/`isCiEnvironment`, `isTelemetryEnabled()` com precedência explícita e `isCiEnvironment()` no lugar de `process.env.CI === 'true'` |
| `src/messages/index.ts` | `TELEMETRY_MESSAGES.firstRunNotice` atualizado + 2 chaves novas em `CONFIG_MESSAGES` |

O hunk do `console.log('Note: OpenSpec collects…')` **não** foi aplicado literalmente (voltaria a EN): só o texto do catálogo mudou, como o brief manda.

### 804427b6 — `fix(telemetry): suppress first-run notice in --json mode (#1609)`

- `src/cli/index.ts`: novo helper exportado `isJsonRun(command)` (os dois ramos — `optsWithGlobals().json` e `command.args.includes('--json')` — mantidos por paridade) e `preAction` passando `{ silent: isJsonRun(actionCommand) }`.
- `src/telemetry/index.ts`: `maybeShowTelemetryNotice(options: { silent?: boolean } = {})` com o `return` **antes** de imprimir e antes de gravar `noticeSeen` (adia, não consome).
- `getCommandPath` passou a ser exportado (paridade com o upstream).
- `test/core/cli-is-json-run.test.ts`: criado.

### db981f27 — `fix(telemetry): print first-run notice to stderr, not stdout (#1666)`

- `src/telemetry/index.ts`: `console.log(...)` → `console.error(TELEMETRY_MESSAGES.firstRunNotice)` com o comentário novo. `grep -c "console.log" src/telemetry/index.ts` → 0.
- `src/cli/index.ts`: comentário do `preAction` na forma final (3 linhas).
- `test/telemetry/index.test.ts`: `consoleLogSpy` → `consoleErrorSpy` (0 ocorrências do antigo, 10 do novo).

Como o brief recomenda, os estados intermediários (804427b6 com `console.log`) não foram reproduzidos: o commit deixa o estado final.

### d56f9fc7 — `test: opt the suite out of telemetry (#1668)`

- `vitest.config.ts`: bloco `env: { OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1' }` com o comentário de 6 linhas. Inserido **após** o `setupFiles` fork-only (`./vitest.env-setup.ts`), imediatamente antes do comentário `// Tests rely on per-file process isolation` — a mesma posição relativa do upstream.

### fc0fec12 — `fix(feedback): keep full reports in issue bodies (#1653)`

- `src/commands/feedback.ts`: `MAX_TITLE_LENGTH = 72`, `TITLE_PREFIX_LENGTH` **derivado do catálogo** (`Array.from(FEEDBACK_MESSAGES.feedbackTitle('')).length`), `formatTitle` com normalização de whitespace + corte por grapheme (`Intl.Segmenter`) + recuo ao último espaço + `…` (U+2026), `formatBody(message, bodyText?)` com os cabeçalhos do catálogo, e `formatBody(message, options?.body)` em `execute`.
- `src/core/templates/workflows/feedback.ts`: 1 linha nova em PT-BR no passo 5.
- `openspec/specs/cli-feedback/spec.md`: aplicado **verbatim em EN** (espelho); `git show fc0fec12:openspec/specs/cli-feedback/spec.md | diff - <fork>` → vazio, inclusive a remoção da linha em branco final.

---

## 2. Strings adicionadas/alteradas no catálogo (`src/messages/index.ts`)

| Chave | Seção | Valor |
|---|---|---|
| `CONFIG_MESSAGES.telemetryRequiresNestedKey` (**nova**) | `CONFIG_MESSAGES` (l.674) | `Defina chaves aninhadas sob telemetry (ex.: telemetry.enabled)` — sem ponto final; `invalidConfigKey` acrescenta o `.` |
| `CONFIG_MESSAGES.unknownTelemetryKey(key)` (**nova**) | `CONFIG_MESSAGES` (l.675) | `Chave de telemetria desconhecida "${key}" (permitidas: enabled)` |
| `FEEDBACK_MESSAGES.bodySummaryHeading` (**nova**) | `FEEDBACK_MESSAGES` (l.984) | `## Resumo` |
| `FEEDBACK_MESSAGES.bodyDetailsHeading` (**nova**) | `FEEDBACK_MESSAGES` (l.985) | `## Detalhes` |
| `TELEMETRY_MESSAGES.firstRunNotice` (**atualizada**) | `TELEMETRY_MESSAGES` (l.2809) | `Aviso: o BR-OpenSpec coleta estatísticas de uso anônimas. Para optar por não participar, defina OPENSPEC_TELEMETRY=0 ou execute 'openspec config set telemetry.enabled false'` — **com aspas simples**, conforme G11 |

Nenhuma chave removida; nenhuma assinatura alterada. `FEEDBACK_MESSAGES.feedbackTitle` intacta e continua sendo a única fonte do prefixo `Feedback: ` (`grep -n "'Feedback: '\|## Summary\|## Details\|TITLE_PREFIX = '" src/commands/feedback.ts` → vazio).

---

## 3. Adaptações do fork (divergências deliberadas do diff upstream)

1. **`KNOWN_TOP_LEVEL_KEYS`**: só `'telemetry'` foi acrescentado. `'defaultStore'` (contexto do hunk upstream) **não** entrou — o subsistema de stores segue adiado. `grep -n defaultStore src/core/config-schema.ts` → vazio.
2. **Razões de `validateConfigKeyPath`** vão para `CONFIG_MESSAGES` em vez de literais EN inline (regra PT-BR first). As outras 4 razões pré-existentes continuam em EN — dívida pré-existente, ver §7.
3. **Aviso de primeira execução**: o texto vive no catálogo; só o *stream* (`console.error`) e o gate `silent` foram portados no código.
4. **Scaffolding de `fd92ccc`** (D29/O6), portado **só** o necessário:
   - `src/cli/index.ts`: `import { fileURLToPath } from 'url'`, `export { program }`, `export function runCli(argv = process.argv)` e a guarda `path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)`, no lugar do `program.parse()` final.
   - `bin/openspec.js`: passou a `import { runCli } … ; runCli();` — **byte a byte igual** a `upstream/main:bin/openspec.js`; modo `100755` preservado (`git ls-files -s` confirma após o commit).
   - Nada mais de `fd92ccc` (stores/initiative/workspace) foi trazido.
   - `test/helpers/run-cli.ts` continua válido: ele spawna `dist/cli/index.js` **diretamente**, caminho em que a guarda é verdadeira. Verificado por smoke (`node dist/cli/index.js --version` e `node bin/openspec.js --version` imprimem `2.3.0`) e pela suíte completa verde (dezenas de testes usam o helper).
5. **Comentários de `store`/`workset`**: mantidos os ramos de código e os 6 casos do teste sintético, mas os comentários foram reescritos para deixar explícito que são formas do upstream ainda não expostas pelo fork (em EN, para não misturar idiomas no mesmo bloco de comentário — o arquivo é EN).
6. **`vitest.config.ts`**: bloco `env` inserido depois do `setupFiles` fork-only (o upstream não tem essa linha). Conteúdo idêntico ao upstream.

---

## 4. Testes portados / adaptados

| Arquivo | O que entrou | Adaptação PT-BR |
|---|---|---|
| `test/utils/ci.test.ts` | **novo**, verbatim (13 testes) | nenhuma |
| `test/core/cli-is-json-run.test.ts` | **novo**, do upstream (6 testes) | só comentários (nota sobre stores/workset ainda ausentes no fork) |
| `test/telemetry/index.test.ts` | isolamento XDG/HOME/USERPROFILE/APPDATA no `beforeEach`; helper `writeTelemetryConfig`; `consoleLogSpy` → `consoleErrorSpy`; 2 `it.each` de CI + 6 testes de gate por config em `isTelemetryEnabled`; 3 testes em `maybeShowTelemetryNotice`; 1 em `trackCommand` — 37 testes no total | asserções do aviso via **`TELEMETRY_MESSAGES.firstRunNotice`** (igualdade exata pela chave), não por literal PT-BR nem por `stringContaining` em EN. `tempDir` com `randomUUID` do fork mantido. |
| `test/telemetry/config.test.ts` | 2 testes novos em `updateTelemetryConfig` | nenhuma |
| `test/core/config-schema.test.ts` | 2 `it` em `GlobalConfigSchema` + `describe('validateConfigKeyPath telemetry')` | nenhuma |
| `test/core/version-check.test.ts` | 1 `it` (`sends nothing when telemetry.enabled is false in global config`), com o `try/finally` de `XDG_CONFIG_HOME` do upstream | nenhuma |
| `test/commands/config.test.ts` | 2 testes de integração + 3 de `config key validation` | `'Set telemetry.enabled = false'` → `'Definido telemetry.enabled = false'`; `'Invalid configuration key "telemetry.anonymousId"'` → `'Chave de configuração inválida "telemetry.anonymousId"'`; **acrescentada** asserção da razão nova (`Chave de telemetria desconhecida "anonymousId" (permitidas: enabled)`) |
| `test/commands/feedback.test.ts` | 1 teste renomeado/reescrito + 3 novos + 1 alterado | `## Summary`/`## Details` → `## Resumo`/`## Detalhes`; URLs `Fission-AI/OpenSpec` → `dynamicworks-com-br/BR-OpenSpec`; `'Title: Feedback: …'` → `'Título: Feedback: …'`. O emoji família (U+1F468 ZWJ …) é byte-idêntico ao do upstream (verificado com `od -c`). |

**Nenhum teste pulado.** Os 3 testes de `defaultStore` que aparecem no *contexto* do diff de `test/commands/config.test.ts` não existem no fork e **não** foram reintroduzidos.

`test/core/templates/skill-templates-parity.test.ts` **não** foi tocado (D5): o hash de `getFeedbackSkillTemplate` continua o do fork. Confirmado que ele e `skillssh-parity.test.ts` ficam vermelhos entre lotes — exatamente 3 falhas, todas por hash/sincronia de `skills/`:
`getFeedbackSkillTemplate: 087c0981… → 7a1366f6…`. Regenerar no fechamento com `pnpm generate:skills` + `pnpm regen:parity-hashes`.

---

## 5. Validação

```
pnpm exec tsc --noEmit                                   → OK
node build.js                                            → OK
pnpm lint (eslint src/)                                  → OK
pnpm exec vitest run --exclude <2 testes de paridade>    → 107 arquivos / 3514 testes passando
```

Smokes manuais (todos com `XDG_CONFIG_HOME` e `HOME` temporários):

- `config set telemetry.enabled false` → `Definido telemetry.enabled = false`; `get` → `false`; `unset` → `Removido telemetry.enabled (revertido para o padrão)` com `anonymousId`/`noticeSeen` **preservados** no `config.json`.
- `config set telemetry x` → exit 1, `Chave de configuração inválida "telemetry". Defina chaves aninhadas sob telemetry (ex.: telemetry.enabled).`
- `config set telemetry.anonymousId x` → exit 1, `… Chave de telemetria desconhecida "anonymousId" (permitidas: enabled).`
- `config set telemetry.enabled nope` → exit 1, `Configuração inválida - telemetry.enabled: …` (mensagem do Zod, EN, pré-existente).
- 1ª execução `list --json`: stdout parseia como JSON, **stderr com 0 bytes**, `config.json` só com `anonymousId` (sem `noticeSeen` — adiado). 2ª execução sem `--json`: aviso PT-BR **em stderr**, stdout limpo, `noticeSeen: true` gravado. 3ª execução: stderr com 0 bytes.
- `feedback` com mensagem multilinha longa + `--body` (sem `gh` no PATH): `Título: Feedback: Generated workflows declare too few allowed tools, so…` (≤72, sem quebra), corpo com `## Resumo` → mensagem original em 2 linhas → `## Detalhes` → `detalhe` → `---` → `Enviado via BR-OpenSpec CLI`; URL manual com `%23%23%20Resumo`.
- `node -e "import('./dist/cli/index.js')…"` → `function function object` sem help/erro do Commander e exit 0; `node dist/cli/index.js --version` e `node bin/openspec.js --version` → `2.3.0`.

Greps dos checklists dos 3 briefs: todos com o resultado esperado (ver §7 do relatório para o único item que precisa de nota).

---

## 6. Hunks de docs pendentes para o lote de docs (Lote G)

Nada de `docs/`, `README.md` ou `README.pt-BR.md` foi tocado neste lote, conforme instrução do orquestrador. Os hunks pendentes, com âncoras já localizadas no fork:

### De `622c509a`

| Arquivo | Linha (fork) | Estado atual | O que aplicar |
|---|---|---|---|
| `README.md` | 251 | `**Opt-out:** \`export OPENSPEC_TELEMETRY=0\` or \`export DO_NOT_TRACK=1\`` | substituir pelos 2 bullets: `**Opt-out (any one is enough):**` / `- \`openspec config set telemetry.enabled false\` (global config; unset means on)` / `- \`export OPENSPEC_TELEMETRY=0\` or \`export DO_NOT_TRACK=1\` (env overrides config)`. **Não** regredir "BR-OpenSpec collects…" (l.247) |
| `README.pt-BR.md` | 250 | `**Desativar:** \`export OPENSPEC_TELEMETRY=0\` ou \`export DO_NOT_TRACK=1\`` | tradução dos 2 bullets (proposta em LF-622c509a §4) |
| `docs/cli.md` | 904 | `# Set a value` | `# Set a value (disable anonymous usage telemetry)` |
| `docs/cli.md` | após o bloco ```bash``` que termina em `openspec config profile core` (l.923) | — | inserir o parágrafo `**Telemetry opt-out:** …` (4 linhas, texto em LF-622c509a §4) |
| `docs/cli.md` | 1035 / 1036 | linhas `OPENSPEC_TELEMETRY` / `DO_NOT_TRACK` da tabela "Environment Variables" | acrescentar `(overrides \`telemetry.enabled\` in global config)` / `(standard DNT signal; overrides config)` |
| `docs/pt-BR/cli.md` | 900 | `# Definir um valor` | `# Definir um valor (desabilita a telemetria de uso anônima)` |
| `docs/pt-BR/cli.md` | após `openspec config profile core` (l.919) | — | parágrafo `**Desativação da telemetria:** …` (tradução em LF-622c509a §4) |
| `docs/pt-BR/cli.md` | 1031 / 1032 | linhas da tabela "Variáveis de Ambiente" | acrescentar `(tem precedência sobre \`telemetry.enabled\` na configuração global)` / `(sinal DNT padrão; tem precedência sobre a configuração)` |

### De `fc0fec12`

| Arquivo | Linha (fork) | Estado atual | O que aplicar |
|---|---|---|---|
| `docs/cli.md` | 967 | `\| \`message\` \| Yes \| Feedback message \|` | `\| \`message\` \| Yes \| Feedback summary; long text is shortened in the issue title and preserved in the body \|` |
| `docs/cli.md` | 973 | `\| \`--body <text>\` \| Detailed description \|` | `\| \`--body <text>\` \| Additional details included after the summary \|` |
| `docs/pt-BR/cli.md` | 963 | `\| \`message\` \| Sim \| Mensagem de feedback \|` | `\| \`message\` \| Sim \| Resumo do feedback; textos longos são encurtados no título da issue e preservados no corpo \|` |
| `docs/pt-BR/cli.md` | 969 | `\| \`--body <text>\` \| Descrição detalhada \|` | `\| \`--body <text>\` \| Detalhes adicionais incluídos após o resumo \|` |

### Fora dos commits (coerência, sugerido pelos briefs / L18)

- `AGENTS.md` l.153-154 e 171-172: acrescentar `openspec config set telemetry.enabled false` à lista de opt-out e trocar `CI=true` por "CI ligado (qualquer valor exceto `false`/`0`/`no`/`off`)" — o comportamento **mudou** neste lote, então essa correção deixou de ser cosmética.
- `docs/faq.md` / `docs/pt-BR/faq.md` l.135: o upstream não alterou; espelho mantido.

---

## 7. Pulado, com motivo

| Item | Motivo |
|---|---|
| `.changeset/telemetry-enabled-config.md`, `.changeset/suppress-telemetry-notice-json.md` | D3 — changesets do fork são próprios, gerados no fechamento |
| `openspec/changes/suppress-telemetry-notice-in-json/**` (4 arquivos) | D6/D21 — change **não arquivada** no upstream; `openspec/specs/telemetry/spec.md` do `upstream/main` não mudou no intervalo (verificado: `git diff 45cca5db upstream/main -- openspec/specs/telemetry/` vazio) e o do fork é idêntico ao dele |
| Hash `getFeedbackSkillTemplate` em `test/core/templates/skill-templates-parity.test.ts` | D5 — regenerado uma única vez no fechamento; nunca colar o hash do upstream (`dabeb5e8…`) |
| Contexto `defaultStore` / `openers` nos diffs de `config-schema.ts`, `global-config.ts` e `test/commands/config.test.ts` | stores/workspace adiado (D1) — só aparecia como contexto |
| Todo o restante de `fd92ccc` | commit de stores, adiado; só o scaffolding do módulo CLI veio (D29/O6) |
| Hunks de docs de `622c509a` e `fc0fec12` | reservados para o lote de docs (§6) |

---

## 8. Dívidas pré-existentes observadas (não corrigidas aqui — D26)

1. **`getGlobalConfig()` agora roda em todo comando** (via `isTelemetryEnabled`) e no `update`. Com `config.json` corrompido, `Warning: Invalid JSON in <path>, using defaults` (EN, `src/core/global-config.ts`) passa a sair em **stderr a cada invocação**. É o comportamento do upstream; a string já está asserida em `test/commands/config.test.ts` (`stringContaining('Invalid JSON')`).
2. **Razões EN restantes em `validateConfigKeyPath`**: `Key path must not be empty`, `Unknown top-level key "x"`, `featureFlags values are booleans and do not support nested keys`, `"x" does not support nested keys`. Deixadas como estavam para não misturar tradução com este porte; nenhum teste as assere. Candidatas a um commit de i18n separado.
3. **Mensagens do Zod em EN** na validação de tipo (`Configuração inválida - telemetry.enabled: Invalid input: expected boolean, received string`) — pré-existente.
4. **`config reset --all`** apaga a seção `telemetry` inteira (identidade + `enabled`) — pré-existente, idêntico ao upstream, não é regressão deste lote.
5. **`CLI_DESCRIPTIONS.feedbackBody`** (`'Descrição detalhada do feedback'`) não foi alinhada ao texto novo dos docs (`Detalhes adicionais incluídos após o resumo`): o upstream não mexeu na descrição do commander neste commit, então o porte ficou fiel. Se o lote de docs quiser coerência `--help` × docs, é uma edição de 1 linha.
6. **Migração legada de telemetria**: `src/telemetry/config.ts` migra `~/.config/openspec/config.json` para o caminho XDG. Isso surpreende em smoke manual — um `XDG_CONFIG_HOME` temporário **não** basta para isolar (é preciso isolar `HOME` também). Comportamento pré-existente, mas vale a nota para quem for reproduzir os smokes.

---

## 9. Dúvidas abertas

1. **Spec de telemetria desatualizada.** `openspec/specs/telemetry/spec.md` (fork = `upstream/main`) ainda descreve `CI=true` e não menciona nem o adiamento em `--json`, nem o stream stderr, nem `telemetry.enabled`. O fork está de acordo com o upstream (D21: não antecipar), mas a spec ficou **descrevendo comportamento que o código já não tem**. Confirmar que a decisão é esperar o upstream arquivar a change `suppress-telemetry-notice-in-json`.
2. **Política de comentários mistos.** Escolhi manter os comentários adicionados em `src/cli/index.ts` e `test/core/cli-is-json-run.test.ts` em EN (o arquivo é EN), citando `store`/`workset` como "upstream's … not in this fork yet". Se a convenção do fork for anotar essas ressalvas em PT-BR, é uma troca trivial.
3. **`AGENTS.md`** (§6, último bloco): a menção a `CI=true` virou factualmente errada com este lote. Deixei para o lote G (D24 já mexe no arquivo), mas se o lote G não for cobrir, vale um commit pequeno.

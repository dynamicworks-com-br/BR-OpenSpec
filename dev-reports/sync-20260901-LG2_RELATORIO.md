# Relatório do lote LG2 — Docs das flags novas do CLI, telemetria, completions e meta-docs (D24')

**Branch:** `sync/upstream_20260901` · **Commit:** `302e7d831ac90cf13dbe026145c0de28232942da`
`docs: portar documentação de telemetria, completions e das flags --archived, --all e --diff, e alinhar README/AGENTS/SECURITY ao novo comportamento`

**Arquivos:** 11 · **+211 / −52**

**Validação:** `pnpm exec tsc --noEmit` **OK** · `node build.js` **OK** ·
`pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts --exclude test/core/templates/skillssh-parity.test.ts` → **115 arquivos / 3657 testes passando**.

**Nenhuma alteração em `src/`, `test/`, `schemas/`, `skills/` ou `openspec/specs/`.** Nenhuma chave nova no catálogo `src/messages/index.ts` (ver §5).

Arquivos tocados:
`AGENTS.md`, `README.md`, `README.pt-BR.md`, `SECURITY.md`, `scripts/README.md`,
`docs/cli.md`, `docs/pt-BR/cli.md`, `docs/troubleshooting.md`, `docs/pt-BR/troubleshooting.md`,
`docs/writing-specs.md`, `docs/pt-BR/writing-specs.md`.

---

## 1. Commits portados

| Commit | Título | Hunks de docs no upstream | O que foi aplicado no fork |
|---|---|---|---|
| `622c509a` | fix(telemetry): honor telemetry.enabled in global config (#1513) | `README.md`, `docs/cli.md` | **integral** (EN + espelho PT) |
| `804427b6` | fix(telemetry): suppress first-run notice in --json mode (#1609) | — | sem hunk de docs; acrescentada 1 frase própria (§3 A3) |
| `db981f27` | fix(telemetry): print first-run notice to stderr, not stdout (#1666) | — | idem |
| `fc0fec12` | fix(feedback): keep full reports in issue bodies (#1653) | `docs/cli.md` | **integral** (EN + PT) |
| `7276c6c2` | fix(packaging): print the completions tip from the CLI, not a postinstall script (#1704) | `SECURITY.md`, `scripts/README.md`, `docs/cli.md` | **integral** (EN + PT) |
| `8127c7b7` | fix(schema): preserve YAML formatting when forking a schema (#1607) | — | sem hunk de docs; frase sugerida pelo brief `LF-schema-cmd` §4.3 aplicada (EN + PT) |
| `2fa679f1` | fix(schema): make schema init --default actually set the default (#1709) | `docs-lab/**` (D4) | conteúdo redirecionado para `docs/cli.md` + PT |
| `83be9d11` | feat(validate): add --archived… (#1604) | `docs/cli.md`, `docs/troubleshooting.md` | **integral** (EN + PT) |
| `a7353aea` | feat(status): add --all… (#1301) | `docs-lab/**` (D4), `docs/agent-contract.md` (D7) | conteúdo do docs-lab redirecionado para `docs/cli.md` + PT; `agent-contract.md` pulado |
| `dd7cea3f` | feat(show): diff delta requirements… (#980) | `docs-lab/**` (D4) | conteúdo redirecionado para `docs/cli.md` + PT |
| `ece8660d` | fix(validate): allow non-English requirements (#1502) | — | consequência documentada (nuance do `--strict`) |
| `e50bd098` | fix(validate): warn on ambiguous task numbering (#1523) | — | idem |
| `c751b3da` | fix(validate): count every level-4 header as a scenario (#1521) | — | nota nova em `troubleshooting.md` + PT |
| `126c5d6c` | fix(validate): report a Purpose left as the archive placeholder (#1671) | — | notas novas em `writing-specs.md` + PT e `cli.md` + PT (`skip_specs` automático) |

Nenhum commit foi portado parcialmente. Os únicos hunks não aplicados são os de `docs/agent-contract.md` e `docs/stores-beta/**` (§4).

---

## 2. O que foi acrescentado, por arquivo

### `README.md` / `README.pt-BR.md` (`622c509a`)
`**Opt-out:** …` (linha única) → dois bullets com `openspec config set telemetry.enabled false` (config global; ausente = ligado) e as variáveis de ambiente (que têm precedência). A linha "BR-OpenSpec collects…" / "O BR-OpenSpec coleta…" **não** regrediu para "OpenSpec".

### `SECURITY.md` (`7276c6c2`, + coerência de telemetria)
- §"Conteúdo do pacote publicado": removido ` e \`scripts/postinstall.js\`` — o `package.json` do fork lista `files: ["dist","bin","schemas", …]` e só declara o script `prepare` (verificado).
- Tabela "O que a CLI faz na sua máquina": a linha **"Script de instalação"** (que descrevia um arquivo inexistente desde o lote LF2) virou **"Scripts de instalação"** com o texto pronto do relatório LF2 §6.
- Linha **Telemetria**: `Desative com OPENSPEC_TELEMETRY=0 ou DO_NOT_TRACK=1` → acrescentado `openspec config set telemetry.enabled false` com a ressalva de que as env vars têm precedência (coerência com `622c509a`, README e AGENTS.md).

### `scripts/README.md` (`7276c6c2`)
Bloco `## postinstall.js` + a linha de descrição removidos; `## pack-version-check.mjs` preservado. O bloco PT-BR próprio do fork sobre `regen-parity-hashes.mjs` ficou intocado.

### `AGENTS.md` (D24')
Uma linha nova em "Useful Environment Variables": `CI` — qualquer valor fora de `false`/`0`/`no`/`off`/vazio desliga telemetria, o version check do `openspec update` e a dica de completions (`src/utils/ci.ts`).
**As demais alíneas de (e) já estavam feitas pelo lote LG1 e foram conferidas:** a "Rule of thumb" da seção *Reserved English Terms* já diz "Omitting `SHALL`/`MUST` … WARNING (an error only under `--strict`)"; a seção *Security & Privacy* já lista o opt-out por `telemetry.enabled` e a detecção de CI por valor; a env var `OPENSPEC_NO_COMPLETIONS=1` já estava na lista. O cabeçalho de `src/messages/index.ts` (L25-27) e o parágrafo de `README.md` L222 também já carregam a mesma nuance — **nada a fazer, `src/` não foi tocado**.

### `docs/cli.md` + `docs/pt-BR/cli.md`
Tudo em par EN/PT (o PT com o glossário de docs: change → "mudança", spec → "spec", schema → "schema").

| Seção | Mudança |
|---|---|
| Tabela "Agent-Compatible Commands" | linha do `openspec status` ganha `--all --json`; **parágrafo de mensagens localizadas ampliado** (§6) |
| `openspec show` | linha `--diff` em "Change-specific options"; exemplo `openspec show add-dark-mode --diff`; 3 parágrafos (formato texto, casos degenerados, contrato `--json --diff` + exit code 1) |
| `openspec validate` | linha `--archived`; **nuance do `--strict`** (avisos passam a reprovar: requisito sem `SHALL`/`MUST`, numeração ambígua de tarefas, `## Purpose` placeholder); parágrafo de escopo do `--archived`; exemplo `openspec validate --archived` |
| `openspec new change` | nota de que o `new change` grava `skip_specs: true` sozinho quando o schema não tem artefato sob `specs/` |
| `openspec status` | descrição ("uma mudança ou todas as ativas"); linha `--all`; `--change` deixa de dizer "prompts if omitted" e passa a "pelo nome da pasta"; `--schema` ganha "um nome desconhecido é erro"; parágrafo de exclusividade mútua + transcrição do erro; parágrafo do estado vazio; exemplos `--all` e `--all --json` (**o exemplo "Interactive status check" foi removido** — não existe modo interativo); parágrafo "Com `--all`, o mesmo bloco…"; bloco **Output (JSON, `--all`)** (sem `root`); parágrafo de falha parcial; lista de **códigos de saída** |
| `openspec schema init` | opção `--default` descrita por inteiro (grava `schema: <name>` em `openspec/config.yaml`/`.yml`, cria se não existir); parágrafo "criação + config são uma operação só" |
| `openspec schema fork` | frase de fidelidade do YAML copiado |
| `openspec config` | comentário do exemplo `config set telemetry.enabled false`; parágrafo **Telemetry opt-out / Desativação da telemetria** (4 linhas do upstream) + 2 linhas próprias sobre o aviso em stderr e o adiamento em `--json` |
| `openspec feedback` | células de `message` e `--body` |
| `openspec completion` | parágrafo de completions opt-in (uma vez, em stderr, silêncio se já instaladas, `OPENSPEC_NO_COMPLETIONS=1`) |
| Tabela de variáveis de ambiente | `OPENSPEC_TELEMETRY` e `DO_NOT_TRACK` ganham a precedência sobre `telemetry.enabled`; linha nova `OPENSPEC_NO_COMPLETIONS` |

### `docs/troubleshooting.md` + PT
- `openspec validate --archived       # fail if archived changes have unchecked tasks` no bloco de comandos (alinhamento da coluna `#` conferido: `#` na coluna 36, como as 3 linhas vizinhas).
- Nota nova (`c751b3da`) na seção "omits scenario(s)": todo cabeçalho de nível 4 conta como cenário, rotulado `#### Scenario:` ou não.

### `docs/writing-specs.md` + PT
Frase nova ao final do parágrafo do `## Purpose`: `openspec validate --strict` reporta um Purpose deixado no placeholder que o arquivamento grava, ou que abre com `A definir`/`TBD`/`TODO`.
**Nota de método:** a frase foi acrescentada no **fim** do parágrafo, e não no meio, exatamente para não quebrar a linha do upstream `3d0701f8` no `sweep_docs.py` (uma primeira tentativa que editava o meio do parágrafo derrubou aquele commit de OK para GAP; foi desfeita).

---

## 3. Adaptações ao fork (divergências deliberadas do upstream)

| # | Adaptação | Motivo |
|---|---|---|
| A1 | **G13** — as transcrições de saída da CLI em `docs/cli.md` (EN) ficam em EN (`✖ Error: Missing required option --change (or --all …)`, `Specifications Changed (diffs)`, `(no textual changes)`, `No active changes. Create one with: …`); só `docs/pt-BR/cli.md` cita os literais reais do catálogo (`✖ Erro: Opção obrigatória --change ausente (ou --all para todas as alterações ativas). Alterações disponíveis:`, `Nenhuma alteração ativa. Crie uma com: openspec new change <nome>`, `Especificações alteradas (diffs)`, `(sem alterações textuais)`) | Determinação do orquestrador; o espelho EN já tinha a ressalva "Some illustrative sample outputs on this page keep English placeholder text for readability" (LG1). Corrige a recomendação de `LF-dd7cea3f` §2.2 |
| A2 | **Bloco `Output (JSON, --all)` sem `root`** e o estado vazio documentado como `{ "changes": [], "message": "..." }` (sem `root`) | `src/commands/workflow/status.ts:88,113` emite `{ changes, message }` e `{ changes }` — o envelope com `root` é do subsistema de stores, adiado (D1). Documentar `root` documentaria um campo que o fork não emite |
| A3 | **Frase própria** (EN+PT) sobre o aviso de telemetria em stderr e seu adiamento em `--json`, no fim do parágrafo "Telemetry opt-out" | `804427b6` e `db981f27` não têm hunk de docs no upstream, mas mudaram comportamento observável por quem faz pipe do stdout. Confirmado em `src/telemetry/index.ts:194-206` |
| A4 | **`SECURITY.md`, linha Telemetria** ganha `openspec config set telemetry.enabled false` | O upstream não atualizou essa linha em `622c509a`; deixá-la só com as env vars ficaria incoerente com README/AGENTS/docs no mesmo commit |
| A5 | **`AGENTS.md`** ganha a env var `CI` | Higiene do fork (o upstream não tem AGENTS.md). Texto conferido contra `src/utils/ci.ts:9,15-19` |
| A6 | **Nuance do `--strict`** na tabela de `validate` (EN+PT) — não vem de hunk do upstream | LB1 §7 item 4 + LB2 §5 item 1. Confirmado em `src/core/validation/validator.ts` (`valid = strictMode ? errors === 0 && warnings === 0 : errors === 0`) |
| A7 | **Nota de cabeçalhos `####`** em `troubleshooting.md` (EN+PT) | LB1 §7 item 5. Confirmado em `src/core/parsers/requirement-text.ts:32` (`SCENARIO_HEADER = /^####\s+/`) |
| A8 | **Nota de `skip_specs` automático** na seção `openspec new change` (EN+PT) | LB2 §5 item 2. Confirmado em `src/utils/change-utils.ts:166-178` |
| A9 | **G12** — `docs/pt-BR/**` usa "delta specs"/"delta spec" (linha `--diff`, parágrafo do `--json --diff`). `grep -rn "specs delta\|spec delta" docs/pt-BR/` → vazio | Determinação do orquestrador |
| A10 | Célula EN do `--default` e do `--diff` **sem ponto final**, ao contrário do docs-lab | Consistência com as demais células das mesmas tabelas em `docs/cli.md` |
| A11 | `docs/writing-specs.md` (EN) mantém "`TBD` placeholder" na frase do upstream, e a frase nova nomeia os três marcadores | Ver §8 Q2 — a frase EN é herança do espelho; trocá-la quebraria a paridade do `sweep_docs.py` com `3d0701f8` sem ganho real |

---

## 4. Pulado, com motivo

| Hunk | Motivo |
|---|---|
| `a7353aea`, `afea111c`, `521ee33e`, `8364428`, `137404b` → `docs/agent-contract.md` | **D7** — a página não existe no fork (nem EN nem PT). Instrução explícita do orquestrador |
| `d9bcc18`, `8364428` → `docs/stores-beta/**` | **D1** — subsistema stores/workspace adiado. Instrução explícita do orquestrador |
| `8364428` → `docs/cli.md` (linhas `--store <id>`) | **D1** — o fork não tem a flag `--store` |
| `2fa679f1` → `docs-lab/Notes.md` | **D4** — caminho proibido; o item removido lá ("`schema init --default` grava `defaultSchema:` que ninguém lê") deixou de ser verdade e não tem contraparte em `docs/` |
| `2fa679f1`, `a7353aea`, `dd7cea3f` → `docs-lab/reference/cli.md` | **D4** — o conteúdo foi redirecionado para `docs/cli.md` + PT (§2) |
| `a7353aea` → `docs-lab/reference/cli.md` linha `\| \`--store <id>\` \| Use a registered store …` | **D1** |
| `.changeset/**`, `CHANGELOG.md`, `website/**`, `openspec/changes/**`, `skills/**`, `pnpm-lock.yaml` | Fora do escopo do fork / gerados no fechamento (D3, D5, D6) |

---

## 5. Strings adicionadas ao catálogo

**Nenhuma.** Este lote é 100% documentação e meta-documentação; `src/messages/index.ts` **não foi alterado** (o único trecho que o brief autorizava — o cabeçalho sobre SHALL/MUST — já havia sido corrigido no lote LG1, e foi apenas conferido).

---

## 6. Frase sobre mensagens localizadas no JSON (L22 / alínea (f))

O parágrafo já existia (criado no lote LG1, após a tabela "Agent-Compatible Commands") citando `issues[].message` de `validate --json` e `warning` de `instructions --json`. Foi **ampliado** nos dois idiomas para cobrir os campos deste intervalo:

- códigos de diagnóstico acrescentados à lista de coisas **estáveis em inglês**: `change_error`, `severity: "error"` (além de `ERROR`/`WARNING`/`INFO`, ids de artefato e nomes de campo);
- campos **em PT-BR**: `issues[].message` de `openspec validate --json` **e de `openspec validate --archived --json`**, `status[].message` de `openspec status --all --json`, e `warning` tanto de `openspec instructions --json` quanto de `openspec show --json --diff`.

Cada um foi verificado no código: `src/commands/validate.ts:418-430` (`issues[].message` do `--archived`), `src/commands/workflow/status.ts:36-52,106` (`status: [{ severity, code: 'change_error', message }]`), `src/commands/change.ts:247-255,299` (`warning` do `--diff`).

---

## 7. Testes

- **Nenhum arquivo de `test/**` foi tocado.** Nenhum dos 14 commits deste lote tem hunk de teste que pertença a ele — todos saíram nos lotes de código (LB1, LB2, LF1, LF2, LF3).
- Nenhum teste do fork lê `docs/**`, `README*`, `SECURITY.md`, `AGENTS.md` ou `scripts/README.md` como fixture; não existe teste de paridade EN↔pt-BR de documentação.
- Suíte completa rodada mesmo assim, duas vezes (antes e depois dos ajustes finais): **115 arquivos / 3657 testes passando**, excluindo `skill-templates-parity.test.ts` e `skillssh-parity.test.ts` conforme a regra do lote.
- Testes pulados por dependência de stores: nenhum neste lote.

Verificações estruturais adicionais executadas nos arquivos alterados:
- cercas de código balanceadas em todos os 11 arquivos (`grep -c '^```'` par em cada um);
- `docs/cli.md` × `docs/pt-BR/cli.md`: mesmo número de headings (35 × 35) e, nas 5 seções tocadas (`show`, `validate`, `status`, `schema init`, variáveis de ambiente), mesma contagem de linhas de tabela e de cercas.

---

## 8. Estado do `sweep_docs.py` ao final

Executado a partir da raiz do repositório. **Nenhum GAP novo foi introduzido**; `3d0701f8` continua **OK** (ver a nota de método em §2). Commits que ficaram OK (0 faltando): `d0071d7`, `7276c6c`, `c747ed1`, `98c7932`, **`fc0fec1`**, `1a10dd5`, `07dea6e`, `9ae75c8`, **`83be9d1`**, `13e213e`, **`622c509`**, `3d0701f` — os três em negrito passaram de GAP a OK neste lote.

GAPs remanescentes, todos justificados:

| Commit | Resíduo | Justificativa |
|---|---|---|
| `a7353ae`, `afea111`, `137404b` | `agent-contract.md` 1/1 cada | D7 |
| `521ee33` | `agent-contract.md` 2/2 | D7 |
| `8364428` | `agent-contract.md` 5/5, `stores-beta/user-guide.md` 4/4, `cli.md` 2/2 (linhas `--store`) | D7 + D1 |
| `d9bcc18` | `stores-beta/user-guide.md` 52/52 | D1 |
| `18688c8`, `521ee33` | `writing-specs.md` 1/1 | A6 do lote LG1 — a oração de stores foi omitida do parágrafo |
| `4e4c9e1` | `workflows.md` 1/44 | linha da `Note` com `;`, superada por `98c79324` |
| `f3aa167`, `42d7f67`, `59c16a4`, `161f945`, `59bfb27`, `73207a6` | `cli.md`, `commands.md`, `how-commands-work.md`, `supported-tools.md`, `troubleshooting.md` | A1/A3/A4 do lote LG1 — listas de tool IDs e linhas de tabela que citam CodeArts/Hermes/Oh My Pi/ZCode (ferramentas que o fork não suporta) e o nome do pacote do upstream |

Ou seja: **fora de `agent-contract.md` e `stores-beta/**`, os únicos resíduos são os do inventário de ferramentas herdado do lote LG1** (débito pré-`45cca5db`, registrado lá como Q2), mais a oração de stores em `writing-specs.md` e a linha superada de `workflows.md`.

---

## 9. Correções aos briefs / relatórios

1. **`LF-dd7cea3f` §2.2** recomendava citar os literais PT-BR "em ambos os idiomas". **Superado por G13** (confirmado no relatório LF3 §7): o EN fica em EN.
2. **`LF-a7353aea` §2.2** propõe o bloco `Output (JSON, --all)` **com** `root` no exemplo do docs-lab; o texto-alvo do próprio brief para `docs/cli.md` já vinha sem `root`. Aplicado sem `root` (A2).
3. **`LF-a7353aea` §2.2/§2.3** trimava o objeto de status para `changeName`/`schemaName`/`isComplete`/`applyRequires`/`artifacts`. Acrescentei `isPlanningComplete` ao exemplo, porque é o primeiro campo do exemplo de mudança única que já estava no fork (`afea111c`) e omiti-lo sugeriria que o payload em lote é diferente.
4. **`LF1` §6** dizia que `docs/cli.md:904` era `# Set a value`; no fork já eram as linhas 946 (EN) e 941 (PT) — âncoras deslocadas pelos lotes LG1/LF*. Ancorei tudo por conteúdo, não por número de linha; **todas as 58 âncoras casaram exatamente uma vez** (script com asserção de unicidade).
5. **`LF2` §6** propunha para `AGENTS.md` a linha `OPENSPEC_NO_COMPLETIONS=1` — **já aplicada pelo lote LG1**; nada a fazer.
6. **`LB1` §7 itens 1-3** (README, AGENTS, cabeçalho do catálogo) — **já aplicados pelo lote LG1** (§9.1 item 1 daquele relatório); conferidos, nada a fazer.
7. **`LF2` §6** propunha `openspec/config.yaml` como o único destino do `--default`; o texto do upstream (que segui) cobre `.yaml` **e** `.yml`, e o parágrafo de operação única. Sem divergência real.

---

## 10. Hunks de docs pendentes

**Nenhum**, dentro do escopo deste lote e das decisões vigentes. Restam apenas, por decisão explícita:

1. **`docs/agent-contract.md`** (D7) — 5 commits do intervalo alteram essa página (`a7353aea`, `afea111c`, `521ee33e`, `8364428`, `137404b`). Enquanto a página não existir no fork, o `sweep_docs.py` vai apontar GAP nela para sempre. Se D7 mudar, é um lote próprio (a página inteira precisa ser criada + traduzida).
2. **`docs/stores-beta/**`** (D1) — junto com o porte do subsistema de stores.
3. **Débito de inventário de ferramentas** herdado do lote LG1 (Q2 de lá): `supported-tools.md`, `commands.md`, `how-commands-work.md` estão atrás do upstream em ferramentas que o fork realmente não tem (CodeArts, Hermes, Oh My Pi, ZCode). **É um lote de código** (`src/core/config.ts` + adapters), não de docs.

---

## 11. Dúvidas abertas / pendências para o fechamento

1. **`CLI_DESCRIPTIONS.feedbackBody`** (`'Descrição detalhada do feedback'`) continua desalinhada do texto novo dos docs (`Detalhes adicionais incluídos após o resumo`). É uma edição de 1 linha em `src/messages/index.ts`, mas **fora do escopo deste lote** (só o cabeçalho do catálogo era editável aqui). Levantada originalmente em `LF1` §8.5. Recomendo um commit de coerência `--help` × docs no fechamento, ou deixar como está por fidelidade ao upstream (que também não mexeu na descrição do commander).

2. **Espelho EN × strings reais da CLI.** O espelho `docs/` (EN) documenta um CLI que fala PT-BR. Este lote seguiu G13 e a ressalva já existente no topo de `docs/cli.md`, mas há transcrições EN antigas espalhadas (`Change: add-dark-mode`, `Validating add-dark-mode...`, `1 warning found`, `Progress: 2/4 artifacts complete`) que não correspondem a nada que o binário imprima. Se algum dia se quiser um espelho "verdadeiro", é uma varredura própria e grande — não é hunk do upstream.

3. **Dívida pré-existente confirmada e não corrigida** (D26, também apontada em LF3 §6 item 5): `docs/pt-BR/cli.md` mostra `Mudança: add-dark-mode` na transcrição do `status`, enquanto a CLI imprime `Alteração: add-dark-mode` (`WORKFLOW_MESSAGES.changeLabel`). Não corrigi para não misturar com o porte; a nova transcrição de erro que acrescentei **usa** os literais reais (`Alterações disponíveis`), então o arquivo agora tem os dois registros lado a lado. Vale um passe de coerência "mudança × alteração" nas transcrições do `docs/pt-BR/`.

4. **`docs/writing-specs.md` (EN) diz "`TBD` placeholder"** enquanto o archive do fork grava `A definir - criado ao arquivar alteração …` (`src/messages/index.ts:2948`). Mantive a frase do upstream (A11) e a frase nova nomeia os três marcadores, mas a incoerência do espelho continua lá. Mesma classe do item 2.

5. **Spec de telemetria desatualizada** (herdada de LF1 §9): `openspec/specs/telemetry/spec.md` (fork = `upstream/main`) ainda descreve `CI=true` e não menciona `telemetry.enabled`, o stream stderr nem o adiamento em `--json`. A doc agora descreve o comportamento real; a spec, não. D21 diz para esperar o upstream arquivar a change `suppress-telemetry-notice-in-json` — confirmar essa decisão no fechamento.

6. **Registry de completions incompleto** (herdado de LF2 §7.1 e LF3 §6): das três flags documentadas neste lote, `validate --archived` (`command-registry.ts:112`) e `show --diff` (`:144`, `:217`) **estão** no registry; **`status --all` não**, porque o `COMMAND_REGISTRY` do fork não tem a entrada `status` (ela chega no upstream em `fd92ccc`, commit de stores). Ou seja, a doc anuncia uma flag que o shell não completa. Não é regressão deste lote e não foi corrigido aqui (o lote não toca `src/`); resolve-se junto com o porte de stores.

---

## 12. Revisão rodada 1

Commit do lote após a rodada: **`9bef1b9dc394302bfd8ff7f4b37d50c24231099e`** (amend de `302e7d83`, branch não publicada, mensagem e trailers preservados).

### Corrigido (1 de 1)

**`README.pt-BR.md:221` — nuance `SHALL`/`MUST` ausente no espelho PT-BR (importante, COMPLETUDE vs upstream / D24').**

O achado procede. A §2 deste relatório declarava ter "conferido" a alínea de `ece8660d` no README, mas a conferência olhou apenas o espelho EN (corrigido no lote LG1, `92bdf3a`). O espelho PT-BR — idioma primário do fork — continuava com a afirmação hoje falsa de que traduzir as keywords "quebra o `openspec validate`".

Evidência verificada no código real:

- `src/core/validation/validator.ts:699-707` — requisito sem `SHALL`/`MUST` no corpo emite `level: 'WARNING'` (o `ERROR` do bloco acima só cobre corpo ausente).
- `src/core/validation/validator.ts:780-782` — `const valid = this.strictMode ? errors === 0 && warnings === 0 : errors === 0`, ou seja, WARNING só reprova sob `--strict`.

Diff aplicado (única alteração da rodada):

```
- …apenas o texto descritivo fica em português. Traduzir essas palavras-chave quebra o `openspec validate`.
+ …apenas o texto descritivo fica em português. Omitir `SHALL`/`MUST` em um requisito faz o
+ `openspec validate` emitir um WARNING (erro só com `--strict`); traduzir os marcadores
+ estruturais quebra o parsing de specs e mudanças.
```

Redação alinhada às duas fontes PT-BR que já carregavam a nuance (`AGENTS.md:275` e o cabeçalho de `src/messages/index.ts:24-27`). Desvio deliberado da redação sugerida no achado: usei **"specs e mudanças"** em vez de "specs e alterações" — `README.pt-BR.md` é documentação, e o glossário do fork manda `change → "mudança"` em docs (o arquivo já usa "mudanças" nas linhas 100, 150, 177, 227, 229; "alteração" fica reservado às strings da CLI).

Verificações pós-fix:

- `grep -rn 'quebra o \`openspec validate\`' --include='*.md' .` → nenhuma ocorrência restante no repositório.
- Espelhos EN (`README.md:222`) e PT-BR (`README.pt-BR.md:221`) agora dizem a mesma coisa, na mesma posição do mesmo parágrafo.

### Rejeitado

Nenhum. O único achado da rodada procedia.

### Validação da rodada

- `pnpm exec tsc --noEmit` — OK (exit 0)
- `node build.js` — OK ("Build completed successfully")
- `pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts --exclude test/core/templates/skillssh-parity.test.ts` — **115 arquivos / 3657 testes passando** (mesmo total do commit original; a correção é só prosa de README, sem asserção de teste associada).

As pendências das §10 e §11 continuam abertas e fora do escopo desta rodada.

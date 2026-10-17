# Relatório do lote LB2 — Validate: Purpose placeholder e changes de schema sem spec

**Branch:** `sync/upstream_20260901` · **Commits do upstream:** `126c5d6c` (fix(validate): report a Purpose left as the archive placeholder, #1671) e `a2b965aa` (fix(workflow): keep no-spec schema changes valid, #1655)
**Commit do fork:** um único commit — `fix(validate): portar detecção de Purpose placeholder e changes de schema sem spec do upstream v1.10.0–v1.11.0` (hash no objeto estruturado).

---

## 1. O que foi portado

### 126c5d6c — Purpose deixado como placeholder (porte completo)

| Arquivo do fork | Ação | Detalhe |
|---|---|---|
| `src/core/validation/purpose-placeholder.ts` | **criado** | Cópia do upstream com um único desvio funcional: `LEADING_MARKER = /^(?:TBD\|TODO\|A definir)(?![\p{L}\p{N}\p{M}_])/iu` (o upstream só tem `TBD\|TODO`). Comentários/JSDoc em PT-BR. Importa `buildCodeFenceMask` de `../parsers/code-fence.js` (já existia no fork, mesma assinatura). |
| `src/core/validation/constants.ts` | adaptado | Novo `import { SPECS_APPLY_MESSAGES } from '../../messages/index.js'`; `PURPOSE_PLACEHOLDER_PREFIX`/`_SUFFIX` **re-exportam** as metades do catálogo (`skeletonPurposePrefix`/`Suffix`) — definição única, sem literal duplicado (opção **C** do brief). Comentário de 6 linhas traduzido. `VALIDATION_MESSAGES.PURPOSE_IS_PLACEHOLDER` adicionada após `PURPOSE_TOO_BRIEF`, em PT-BR. |
| `src/core/validation/validator.ts` | adaptado | Import de `findPurposePlaceholderIssue`; em `applySpecRules`, o `if (spec.overview.length < MIN_PURPOSE_LENGTH)` virou `const placeholder = …; if (placeholder) { push WARNING overview line PURPOSE_IS_PLACEHOLDER } else if (brevidade) { … }`. Comentário PT-BR. |
| `src/messages/index.ts` | adaptado | Constantes de módulo `SKELETON_PURPOSE_PREFIX`/`SUFFIX` (com JSDoc) antes de `SPECS_APPLY_MESSAGES`; chaves novas `skeletonPurposePrefix`, `skeletonPurposeSuffix`; `skeletonPurpose(changeName)` passa a compor `${PREFIX}${changeName}${SUFFIX}` — assinatura e texto gravado preservados (byte-idêntico; 8 asserções de `archive.test.ts` verdes sem edição). |
| `src/core/specs-apply.ts` | **sem edição** | O hunk do upstream troca o literal EN pela composição das constantes. No fork `buildSpecSkeleton` já chama `SPECS_APPLY_MESSAGES.skeletonPurpose(changeName)`, que agora compõe a partir das mesmas metades — resultado idêntico ao upstream sem tocar o arquivo. |

**Decisão de arquitetura (A' × C):** escolhi **C** (metades hospedadas no catálogo; `constants.ts` importa e re-exporta) em vez de A' (recomendada no brief) porque respeita literalmente a regra do fork "toda string exibida ao usuário fica no catálogo central" e mantém `src/messages/index.ts` sem imports (módulo-folha). Sem ciclo: `constants.ts → messages/index.ts → (nada)`. Verificado por `tsc`, `node build.js` e a suíte. Asserção-guarda `skeletonPurpose('x') === PREFIX + 'x' + SUFFIX` adicionada em `test/core/purpose-placeholder.test.ts`.

**Placeholders reconhecidos (requisito do orquestrador):**
- PT-BR gravado pelo archive do fork: `A definir - criado ao arquivar alteração <name>. Atualize o Purpose após o arquivamento.` (texto exato confirmado em `SPECS_APPLY_MESSAGES.skeletonPurpose`; `ARCHIVE_MESSAGES` não tem placeholder próprio) → casa pelas constantes em qualquer posição do Purpose **e** pelo marcador de abertura `A definir`.
- EN do upstream (`TBD - created by archiving change …`) → casa pelo marcador `TBD` quando abre o Purpose (caso de projeto migrado do upstream; testado em `still reports the upstream English placeholder when it opens the Purpose`). Não casa se ficar **abaixo** de prosa autoral — ver dúvidas abertas.
- Marcadores `TBD`/`TODO`/`A definir` abrindo o Purpose (case-insensitive, lookahead Unicode). "A definição…", "A definirmos…", "a definir" no meio da frase **não** casam (testado).

### a2b965aa — changes de schema sem spec nascem válidas (porte completo)

| Arquivo do fork | Ação | Detalhe |
|---|---|---|
| `src/core/artifact-graph/outputs.ts` | aplicado | `isSpecsArtifactPath(generates)` inserida após `isGlobPattern` e antes de `resolveArtifactOutputPath` (Lote 0 já estava portado — ordem igual ao upstream). Docstring em PT-BR. |
| `src/core/artifact-graph/instruction-loader.ts` | aplicado | Import multi-linha `{ isSpecsArtifactPath, resolveArtifactOutputPath, resolveArtifactOutputs }`; loop de `skip_specs` usa o helper (regex `replace(/^(?:\.\/)+/, '')` removida). |
| `src/utils/change-utils.ts` | adaptado | Imports de `resolveSchema` e `isSpecsArtifactPath`; após a checagem "já existe" e antes de `createDirectory`: `resolveSchema(schemaName, projectRoot)` + `skipsSpecs`; `writeChangeMetadata` recebe `...(skipsSpecs ? { skip_specs: true } : {})` após `created`. **Não** trazidos: `...options.metadata`, `isKebabId`, `options.changesDir`, scaffold de root, `changeDir` no retorno (stores, D1). `CHANGE_UTILS_MESSAGES.changeAlreadyExists` preservada. |

---

## 2. Strings adicionadas/alteradas no catálogo e em constants.ts

| Local | Chave | Texto |
|---|---|---|
| `src/messages/index.ts` → `SPECS_APPLY_MESSAGES` | `skeletonPurposePrefix` (**nova**, string) | `A definir - criado ao arquivar alteração ` |
| idem | `skeletonPurposeSuffix` (**nova**, string) | `. Atualize o Purpose após o arquivamento.` |
| idem | `skeletonPurpose(changeName)` (existente; assinatura e resultado preservados) | agora `${prefix}${changeName}${suffix}` |
| `src/core/validation/constants.ts` → `VALIDATION_MESSAGES` | `PURPOSE_IS_PLACEHOLDER` (**nova**) | `A seção Purpose ainda é um placeholder, não um Purpose que alguém escreveu (a frase que o \`openspec archive\` grava para uma nova capability, ou um marcador \`A definir\`/\`TBD\`/\`TODO\` deixado no lugar). Substitua-a por uma descrição de para que serve esta capability, editando o spec principal diretamente: um \`## Purpose\` em um delta só é lido quando a capability é criada, então não pode substituir este.` |
| `src/core/validation/constants.ts` | `PURPOSE_PLACEHOLDER_PREFIX` / `PURPOSE_PLACEHOLDER_SUFFIX` (**novas** exportações) | re-exportam as chaves do catálogo acima |

`a2b965aa` não adiciona strings. Nenhuma chave removida ou anglicizada.

---

## 3. Testes

### Portados / criados
- `test/core/purpose-placeholder.test.ts` (novo, do upstream) — adaptações PT-BR obrigatórias: (1) fixture `generated sentence rewrapped across two lines by a formatter` → `'A definir - criado ao arquivar\nalteração c1. Atualize o Purpose após o arquivamento.'`; (2) guarda da fixture → `/^(?:TBD|A definir)/.test(onThatLine)`. Casos **extras do fork**: `reports a leading "A definir" marker`, `reports an "A definir" opening a longer placeholder sentence`, `ignores case in a leading "a definir" too`, `still reports the upstream English placeholder when it opens the Purpose`, `does not report a Portuguese word that merely starts with the marker` ("A definição…", "A definirmos…"), `does not report "a definir" raised mid-sentence`, pontuação `A definir.`/`A definir, ainda.` no caso de pontuação, e o `describe('the writer and the detector share one definition')` com a asserção-guarda + o texto literal do placeholder PT-BR.
- `test/core/validation.purpose-placeholder.test.ts` (novo) — **verbatim** do upstream (todas as asserções usam chaves/constantes).
- `test/core/artifact-graph/outputs.test.ts` — import + `it.each` com 7 casos (verbatim).
- `test/commands/artifact-workflow.test.ts` — asserção `not.toContain('skip_specs')` no teste `creates a new change directory` + 2 testes novos (`marks changes as skip_specs when their schema cannot generate specs`, `does not mark spec-producing schemas that use Windows separators`), inseridos antes de `creates README.md when --description is provided` (o fork não tem a âncora `rejects --initiative`). Nenhuma string a traduzir.

### Adaptado (fork-only, recomendado no brief)
- `test/specs/source-specs-normalization.test.ts` — `PURPOSE_PLACEHOLDER_PATTERN` passa a ser `new RegExp(EN | PT-BR)`, com a metade PT-BR construída a partir de `PURPOSE_PLACEHOLDER_PREFIX/SUFFIX` (escapadas). Mantém o padrão EN (specs do repo são espelho do upstream). Lógica da asserção inalterada.

### Pulados
- Nenhum teste dos dois commits depende de stores. O único contexto de stores (`rejects --initiative and writes no change`) não faz parte do diff.

### Resultado
- `pnpm exec tsc --noEmit` → ok · `node build.js` → ok · `pnpm lint` → ok.
- `pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts` → **98 arquivos / 3188 testes passando; 1 arquivo / 1 teste falhando: `test/core/templates/skillssh-parity.test.ts` ("keeps committed skills/ in sync with the workflow templates")**. É a segunda checagem de paridade de `skills/` (comprometidas vs templates), irmã da excluída; este lote não toca `src/core/templates`, `schemas/` nem `skills/` (`git diff --stat HEAD -- src/core/templates skills schemas` vazio), logo o vermelho é herdado dos lotes anteriores e será resolvido na regeneração de `skills/**` ao final (D5). Sugestão ao orquestrador: excluir também esse arquivo ao rodar a suíte entre lotes.
- Focados (10 arquivos, 512 testes): purpose-placeholder, validation.purpose-placeholder, outputs, instruction-loader, change-utils, artifact-workflow, workflow-instructions-skipped, archive, validation, source-specs-normalization — todos verdes.

### Smoke manual (dist, projeto temporário no scratchpad)
- Spec com placeholder PT-BR: `validate --specs` exit 0; `--strict` exit 1; item único estrito imprime `⚠ [WARNING] overview: A seção Purpose ainda é um placeholder…`; `--json` traz `"line": 4`. Após escrever um Purpose real, `--strict` exit 0. Com o placeholder EN do upstream, `--strict` exit 1.
- Schema `no-specs` (proposal + tasks): `new change` grava `skip_specs: true`; `validate … --type change` → "Alteração 'no-spec-change' é válida", exit 0. Com `spec-driven`: sem `skip_specs`, `validate` exit 1 exigindo deltas (comportamento anterior preservado). Schema inválido (`artifacts: []`): falha com mensagem PT-BR e a pasta **não** é criada.

---

## 4. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.changeset/validate-reports-purpose-placeholder.md` | D3 — changeset agregado do fork no lote G (sugestão PT-BR abaixo) |
| `openspec/changes/warn-on-purpose-placeholder/**` (5 arquivos) | D6/D21 — change dir em andamento do upstream; **não** antecipado em `openspec/specs/cli-validate/spec.md` |
| `change-utils.ts`: `...options.metadata`, `isKebabId`, `options.changesDir`, scaffold de root, `return { schema, changeDir }` | contexto de stores (D1) — não faz parte do diff, só das linhas de contexto |
| `artifact-workflow.test.ts`: teste `rejects --initiative and writes no change` | stores (D13) — só âncora de contexto |
| `instruction-loader.ts`: import `resolveArtifactOutputPath` | já presente (Lote 0 portado) |

Todos os hunks de `src/` dos dois commits estão cobertos (4 + 3 arquivos).

---

## 5. Pendências para o lote de docs (G)

Nenhum dos dois commits toca `docs/`; o que segue é **opcional**, sem hunk correspondente no upstream:
1. `docs/writing-specs.md` (l.61) + `docs/pt-BR/writing-specs.md` (l.61): acrescentar meia frase "`openspec validate --strict` reporta um Purpose deixado como placeholder (`A definir`/`TBD`/`TODO`)".
2. `docs/cli.md` (seção `openspec new change`) + `docs/pt-BR/cli.md`: nota de que `new change` grava `skip_specs: true` automaticamente quando o schema não tem artefato sob `specs/` (docs hoje só descrevem o marcador manual).
3. Changeset agregado do fork — sugestão de entrada (patch): "`openspec validate` agora reporta um `## Purpose` deixado como o placeholder que o archive grava para uma nova capability (`A definir - criado ao arquivar alteração …`) ou como um marcador `A definir`/`TBD`/`TODO` abrindo a seção. É um WARNING: um projeto que já carrega placeholders continua validando por padrão e só `--strict` falha. Blocos de código no Purpose são lidos como citação; um Purpose reportado como placeholder não é também reportado como muito breve. O `openspec archive` não muda. `openspec new change` passa a gravar `skip_specs: true` quando o schema não gera arquivos em `specs/`, para que essas alterações nasçam válidas; caminhos `./specs/…` e com separadores Windows são reconhecidos como artefatos de spec."
4. `openspec/specs/cli-validate/spec.md`: revisitar quando o upstream arquivar `warn-on-purpose-placeholder` (D21 — registrar em `dev-reports/`).

---

## 6. Observações e dúvidas abertas

1. **Placeholder EN abaixo de prosa autoral.** O detector só reconhece a frase gerada "em qualquer posição" pelas constantes PT-BR; a frase EN do upstream é coberta apenas pelo marcador `TBD` (isto é, quando **abre** o Purpose). Um projeto migrado do upstream em que alguém digitou prosa acima do placeholder EN e o deixou não é reportado. Mantive o detector estreito como o upstream/brief; se o orquestrador quiser cobrir esse caso, `generatedPlaceholderPrefixIndex` pode iterar sobre uma lista de pares (prefixo, sufixo) EN+PT-BR (~10 linhas, divergência do upstream).
2. **Inconsistência pré-existente:** `src/core/templates/workflows/sync-specs.ts` fala em "placeholder TBD" enquanto o archive do fork grava "A definir". O detector cobre ambos; não alterei o template (D5/lote C).
3. **`skillssh-parity.test.ts`** vermelho por herança dos lotes anteriores (ver §3) — não é deste lote.
4. Brief LB-126c5d6c cita `skeletonPurpose` na l.2459 e `applySpecRules` na l.537 do fork; as linhas reais eram 2603 e 632 (árvore já com os lotes 0/A/B1). Sem impacto — ancorei por conteúdo.

# Lote LC2 — Templates de workflow lote 2

**Branch:** `sync/upstream_20260901`
**Commit:** `04474b569af0ca789ee0c5175e203bde1a753489` — `fix(templates): portar corpo compartilhado do apply, escopo adiado, confirmação no explore e verificação nas tasks do upstream v1.8.0–v1.11.0 (lote 2)`
**Commits do upstream portados (nesta ordem):** `0b233efb`, `06b310bf`, `96a65486`, `bf5099e3`, `207f3cc5`, `7010e268`, `e5e350d0`, `7da3f34f`

Todos os 8 commits foram lidos no diff real (`git show <hash> -- . ':!website' …`). Os briefs estavam corretos nos pontos verificáveis; as duas divergências encontradas estão em §8.

---

## 1. Portado

### 1.1 Apply dedupe (`0b233efb` → `06b310bf` → `96a65486`) — efeito líquido

**`src/core/templates/workflows/apply-change.ts`** (−207 linhas líquidas)

- As duas cópias PT-BR do corpo (skill L13-184, command L197-368) foram consolidadas em
  `export function getApplyInstructions(): string`, com o JSDoc do upstream (EN, como o
  resto dos comentários de código do arquivo).
- `getApplyChangeSkillTemplate().instructions` e `getOpsxApplyCommandTemplate().content`
  passam a ser `getApplyInstructions()`. `description`, `license`, `compatibility`,
  `metadata`, `category` e `tags` inalterados.
- Verificado por `diff` que as duas bodies do fork divergiam em exatamente 4 linhas.
  Consolidação conforme o upstream (3 vêm do command, 1 da skill):

  | Linha | Vencedora | Texto final |
  |---|---|---|
  | `**Entrada**` | command | `… um nome de change (por exemplo, \`/opsx:apply add-auth\`). …` |
  | nota `contextFiles` | **skill** | `… (varia por schema - pode ser proposal/specs/design/tasks ou spec/tests/implementation/docs)` |
  | estado `blocked` | command | `… sugira usar \`/opsx:continue\` (se não estiver instalado, …)` |
  | Saída ao Concluir | command | `Todas as tarefas concluídas! Você pode arquivar esta change com \`/opsx:archive\`.` |

  A versão antiga da skill (`sugira usar openspec-continue-change`, prosa não
  transformável pelos geradores) desapareceu — era exatamente o bug que `06b310bf`
  corrigiu.

**`src/core/templates/skill-templates.ts`** — linha 12 passa a reexportar `getApplyInstructions`.

### 1.2 `bf5099e3` — escopo adiado no apply

Sobre o corpo já unificado (1 inserção em cada lista, não 2):

- Lista `**Pare se:**`, entre "problema de design" e "erro ou bloqueio":
  `- Uma tarefa exigir trabalho além do que a spec e as tarefas descrevem, ou você se sentir tentado a descartar, reduzir, adiar ou aceitar exceções ao comportamento especificado para fazê-la caber → traga o escopo adicional à tona e pergunte; não o absorva silenciosamente`
- Lista `**Guardrails**`, após "Pare em erros, bloqueios ou requisitos incertos - não adivinhe":
  - `- Quando uma tarefa exigir trabalho além do que a spec descreve, traga o escopo adicional à tona e pause - nunca reduza, adie ou simplifique silenciosamente o comportamento especificado`
  - `- Só marque uma tarefa como concluída (\`- [x]\` ou o formato do schema ativo) quando o comportamento especificado estiver totalmente implementado, não quando ela estiver parcialmente feita ou adiada`

### 1.3 `207f3cc5` — picker de workflows

- `src/commands/config.ts` L47: `const WORKFLOW_PROMPT_META` → `export const WORKFLOW_PROMPT_META`
  (única mudança de código do commit aplicável ao fork).
- Entrada `update` já existia (`CONFIG_MESSAGES.workflowUpdateName/Desc`) — no-op.
- Redação "workflow opcional" em `update-change.ts` já gravada no lote 1 (D16); confirmado
  por grep: 2 ocorrências de `é um workflow opcional e pode não estar instalado`, 2 de
  `verifique primeiro se o workflow opcional \`/opsx:new\` está disponível`, 0 de
  "expandido"/"expanded". Os hunks de `test/core/init.test.ts` e
  `test/core/templates/update-change.test.ts` também já estavam no estado final.

### 1.4 `7010e268` — confirmação explícita antes de escrever (explore)

Nas **duas** superfícies de `src/core/templates/workflows/explore.ts`:

- Parágrafo `**IMPORTANTE: …**` reescrito (texto completo em §3). Mantida literalmente a
  frase final do fork/lote 1: `Para uma change nova, faça o scaffold dela primeiro, conforme descrito abaixo.` (G7).
- Guardrail `**Não implemente**` — acrescenta que configuração de workflow (schemas,
  templates, `openspec/config.yaml`) conta como change.
- Guardrail `**Não capture automaticamente**` — leitura sem confirmação; antes da primeira
  ação capaz de escrever (inclusive `openspec new change`), nomear alvo + pergunta sim/não
  + confirmação em mensagem separada.
- O guardrail `Não faça scaffold de changes manualmente` (lote 1, G6) ficou intacto e no
  lugar certo, logo após "Não capture automaticamente".

### 1.5 `e5e350d0` — ASCII nos diagramas (explore)

- Os 5 blocos cercados com glifos foram redesenhados em ASCII puro, com rótulos PT-BR e
  larguras recontadas (script de verificação de colunas rodado antes da edição):
  caixa "Visualizar" (2×, inner width 42 como no upstream), espectro de colaboração,
  fluxo de auth, armazenamento CLI (bullets `•` → `-`, `✓/✗` removidos da tabela).
- Inserida a orientação de 2 linhas logo após o bloco "Visualizar" e antes de
  "Trazer riscos e incógnitas à tona", nas 2 superfícies (texto em §3).
- `grep -nP "[\x{2190}-\x{21FF}\x{2500}-\x{25FF}\x{2022}\x{2023}\x{2713}-\x{2718}]" src/core/templates/workflows/explore.ts` → vazio (arquivo inteiro, mais estrito que o teste).

### 1.6 `7da3f34f` — verificação nas tasks geradas

- **`schemas/spec-driven/schema.yaml`** (artifact `tasks`):
  - novo bullet normativo em "Diretrizes:" (PT-BR, `MUST` preservado, continuações com 8
    espaços dentro do bloco literal);
  - as 4 tarefas do bloco `Example:` ganham `… and verify …` (o bloco **fica em inglês**,
    convenção do fork — ver §2.4);
  - removida a linha final `Cada tarefa deve ser verificável - você sabe quando ela está concluída.`
    (a linha `Referencie as specs …` fica).
  - YAML revalidado com o parser (`yaml.parse` + impressão do `instruction`).
- **`src/messages/index.ts` → `ONBOARD_TEMPLATE_MESSAGES.instructions`** (Fase 8, o
  `workflows/onboard.ts` do fork é só um wrapper e **não** foi tocado): checkboxes 1.1/1.2
  com `— verificar: […]`, `## 2. Verificar` → `## 2. Verificação de Integração`, e o item
  2.1 explicitamente de integração. Contagem de checkboxes continua 3.

---

## 2. Adaptado (com motivo)

1. **Corpo único do apply preserva a customização do fork (`711963a`).** O passo 6 mantém
   "Marque a tarefa como concluída no artifact de rastreamento retornado por
   `openspec instructions apply` (… não presuma `tasks.md` nem a sintaxe `- [ ]`/`- [x]`)"
   em vez do "Mark task complete in the tasks file: `- [ ]` → `- [x]`" do upstream. Por
   isso o guardrail novo de `bf5099e3` foi redigido como
   "Só marque uma tarefa como concluída (`- [x]` **ou o formato do schema ativo**) …",
   que não contradiz a customização.
2. **Sem stores (D1).** Não foram introduzidos `import { STORE_SELECTION_GUIDANCE }`,
   `${STORE_SELECTION_GUIDANCE}`, a linha `planningHome, changeRoot, actionContext` do
   passo 2, nem `--store <id>` no guardrail de scaffold do explore. Grep de `--store` nos
   3 templates deste lote → 0.
3. **Decisão LC-1 (regex do guard de glifos).** O teste do upstream usa
   `NON_ASCII = /[^\x00-\x7F]/`. Medido no fork: **32 linhas cercadas** (29 na skill, 3 no
   command) contêm apenas acentos de prosa PT-BR ("Usuário:", "Você:", "Coordenação",
   "Sessão", "Restrições-chave", "Questões abertas", "Próximos passos", e as 3 linhas de
   texto dentro da caixa "Visualizar"). Com a regex do upstream o teste falharia mesmo com
   os diagramas 100 % ASCII. Adotada a regex das classes que o commit `e5e350d0` nomeia:
   `const DIAGRAM_GLYPH = /[←-⇿─-◿•‣✓-✘]/;`
   Lógica do teste (helper `fencedBlockLines`, iteração por superfície, `toEqual([])`)
   idêntica ao upstream; só o título e a mensagem de falha mudaram
   (`draws every fenced example without Unicode diagram glyphs (#983)`).
4. **`Example:` do `schema.yaml` mantido em inglês** (opção A do brief §4.1). É a convenção
   já usada pelo fork nos blocos `Example:` dos artifacts `specs` e `tasks`; permite copiar
   as asserções de exemplo do teste upstream literalmente. As **Diretrizes** (guidance) são
   PT-BR, como manda a regra do fork.
5. **`CONFIG_MESSAGES.workflowUpdateDesc` mantida** (`'Revisa artefatos de planejamento e os mantém coerentes'`).
   O brief marcava o alinhamento com o upstream
   (`'Revisa os artefatos de planejamento de uma alteração existente'`) como **opcional**;
   fork vence, e o teste novo do picker passa com o texto atual.
6. **Fallback do picker no teste** — `startsWith('Workflow:')` → `startsWith('Fluxo de trabalho:')`
   (`CONFIG_MESSAGES.workflowLabel`). Nenhuma outra linha do teste upstream mudou.
7. **Teste comportamental de onboard** ficou no `skill-templates-parity.test.ts` (dentro do
   `describe('skill templates split parity')`, onde o upstream o colocou) — **D22**;
   não foi criado `test/core/templates/onboard.test.ts` como o brief LC-7da3f34f §5.2 sugeria.
8. **Placeholder `<name>` no parêntese do estado `blocked`.** A linha herdada do command usa
   `openspec status --change "<name>" --json` / `openspec instructions <artifact-id> --change "<name>" --json`
   — é exatamente o texto do upstream nesse ponto (o `<nome>` PT-BR aparece nos passos 1–3
   do mesmo corpo). Não foi "corrigido" para não divergir do upstream sem necessidade;
   registrado aqui como inconsistência cosmética pré-existente.

---

## 3. Strings novas / alteradas

**Nenhuma chave nova no catálogo `src/messages/index.ts`.** A prosa dos workflow templates
vive inline nos arquivos `workflows/*.ts` e a do onboard já vivia em
`ONBOARD_TEMPLATE_MESSAGES` (valores editados, chave e assinatura preservadas).

### 3.1 Catálogo (`src/messages/index.ts`) — valores atualizados

- `ONBOARD_TEMPLATE_MESSAGES.instructions` (Fase 8, bloco de tarefas):
  - `- [ ] 1.1 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]`
  - `- [ ] 1.2 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]`
  - `## 2. Verificação de Integração` (era `## 2. Verificar`)
  - `- [ ] 2.1 Verificar [integração mais ampla ou comportamento do sistema] com [teste de ponta a ponta ou resultado observável]` (era `[Etapa de verificação]`)
  - Travessão `—` (U+2014) preservado como no upstream (o teste usa `endsWith`).

### 3.2 `schemas/spec-driven/schema.yaml` (guidance PT-BR)

```
- Cada tarefa MUST indicar como verificar sua conclusão (um teste, comando,
  comportamento observável ou artifact entregue). Coloque a verificação na
  descrição do checkbox da própria tarefa. Use uma tarefa de verificação
  separada apenas quando ela checar integração mais ampla ou comportamento
  do sistema que atravessa múltiplas tarefas de implementação.
```
Removida: `Cada tarefa deve ser verificável - você sabe quando ela está concluída.`

### 3.3 `src/core/templates/workflows/apply-change.ts` (inline)

- `- Uma tarefa exigir trabalho além do que a spec e as tarefas descrevem, ou você se sentir tentado a descartar, reduzir, adiar ou aceitar exceções ao comportamento especificado para fazê-la caber → traga o escopo adicional à tona e pergunte; não o absorva silenciosamente`
- `- Quando uma tarefa exigir trabalho além do que a spec descreve, traga o escopo adicional à tona e pause - nunca reduza, adie ou simplifique silenciosamente o comportamento especificado`
- `- Só marque uma tarefa como concluída (\`- [x]\` ou o formato do schema ativo) quando o comportamento especificado estiver totalmente implementado, não quando ela estiver parcialmente feita ou adiada`

### 3.4 `src/core/templates/workflows/explore.ts` (inline, 2 superfícies cada)

- **IMPORTANTE**: `**IMPORTANTE: O modo explore é para pensar, não implementar.** Você pode ler arquivos, pesquisar código, investigar a codebase e executar comandos ou ferramentas somente leitura sem confirmação, mas NUNCA deve escrever código ou implementar funcionalidades. Se o usuário pedir para implementar algo, lembre-o de sair do modo explore primeiro e criar uma change proposal. Você PODE criar ou atualizar artifacts de change do BR-OpenSpec (proposals, designs, specs) dentro de um escopo confirmado - isso é capturar pensamento, não implementar. Responder a perguntas de design ou de esclarecimento nunca é consentimento para escrever. Antes da primeira ação capaz de escrever, nomeie os artifacts ou arquivos que você alteraria e o que faria, faça uma pergunta direta de sim/não e aguarde a confirmação do usuário em uma mensagem separada. A confirmação cobre apenas o escopo que você descreveu; pergunte de novo antes de ampliá-lo. Para uma change nova, faça o scaffold dela primeiro, conforme descrito abaixo.`
- **Não implemente**: `- **Não implemente** - Nunca escreva código ou implemente funcionalidades. Configuração de workflow também conta: criar ou editar schemas, templates ou \`openspec/config.yaml\` é uma change, não pensamento. Criar ou atualizar artifacts de change do BR-OpenSpec dentro do escopo confirmado está ok, escrever qualquer outra coisa não.`
- **Não capture automaticamente**: `- **Não capture automaticamente** - Ofereça salvar insights, não apenas faça. Comandos e ferramentas somente leitura não precisam de confirmação. Antes da primeira ação capaz de escrever - incluindo \`openspec new change\` ou outro comando que escreva arquivos - nomeie os artifacts ou arquivos e as alterações propostas, faça uma pergunta direta de sim/não e aguarde confirmação explícita em uma mensagem separada do usuário. Essa confirmação cobre apenas o escopo descrito; pergunte de novo antes de ampliá-lo. Respostas a perguntas de design ou de esclarecimento nunca são consentimento para escrever.`
- **Orientação ASCII** (após o bloco "Visualizar"):
  `**Desenhe apenas com ASCII puro** - bordas \`+\` \`-\` \`|\`, setas \`-->\` \`<--\` \`^\` \`v\`, marcadores \`*\` \`x\`.`
  `Glifos Unicode de diagrama podem ser renderizados com larguras diferentes entre terminais, fontes e locales, então caixas com preenchimento e tabelas alinhadas podem desalinhar. Mantenha todo caractere de diagrama em ASCII.`
  (Estilo do fork: separador ` - `, não `—`, fora de bloco cercado.)

---

## 4. Testes portados / adaptados

| Arquivo | Commit | Mudança | Resultado |
|---|---|---|---|
| `test/core/templates/apply-defer-guardrail.test.ts` (**novo**) | `bf5099e3` | 4 `it` copiados do upstream com as 6 needles traduzidas (`traga o escopo adicional à tona`, `além do que a spec descreve`, `/nunca reduza, adie/`, `traga o escopo adicional à tona e pause`, `/Só marque uma tarefa .* quando o comportamento especificado estiver totalmente implementado/`) | 4/4 ✓ |
| `test/utils/command-references.test.ts` | `06b310bf` | import de `getApplyChangeSkillTemplate`; `describe('apply skill template generates valid per-target invocations')` com 4 `it` (tokens `/opsx:*` + default/codex/kimi) — 3 asserções de string traduzidas | 61/61 ✓ |
| `test/core/templates/skill-templates-parity.test.ts` | `96a65486` | import de `getApplyInstructions`; `describe('apply skill/command shared instruction core')` no fim do arquivo | ✓ |
| `test/core/templates/skill-templates-parity.test.ts` | `7da3f34f` | `it('keeps onboarding task examples aligned with concrete verification guidance (#345)')` dentro de `describe('skill templates split parity')`, âncoras EN→PT-BR (`Aqui estão as tarefas de implementação:` / `Cada checkbox se torna uma unidade de trabalho`, `/ Verificar .+ com \[.+\]$/`) | ✓ |
| `test/commands/config.test.ts` | `207f3cc5` | `describe('workflow picker labels')` no fim; única adaptação: `'Fluxo de trabalho:'` | 25/25 ✓ |
| `test/core/templates/explore.test.ts` | `7010e268` | 2 `it` novos (`requires separate confirmation before any file-writing action (#1715)`, `treats workflow configuration and write-capable commands as changes (#1715)`) com 10 needles PT-BR | ✓ |
| `test/core/templates/explore.test.ts` | `e5e350d0` | helper `fencedBlockLines` (idêntico ao upstream) + `DIAGRAM_GLYPH` (decisão LC-1) + 2 `it` novos | ✓ (19/19 no arquivo) |
| `test/core/templates/propose.test.ts` | `7da3f34f` | `describe('default task guidance')` entre `propose preamble` e `propose implementation boundary`; guidance normalizada com `replace(/\s+/g, ' ')` (o bloco literal YAML quebra as linhas em pontos diferentes do EN); asserções do `Example:` em inglês | 30/30 ✓ |

**Nenhuma lógica de teste existente foi alterada.** Nenhum teste foi pulado por dependência
de stores neste lote (nenhum dos 8 commits toca stores em testes).

---

## 5. Pulado (com motivo)

| Hunk / arquivo | Motivo |
|---|---|
| `.changeset/apply-surface-deferred-scope.md`, `.changeset/explore-explicit-write-confirmation.md`, `.changeset/plain-ascii-explore-diagrams.md`, `.changeset/tidy-tasks-verify.md` | D3 — changeset do fork é próprio, no fechamento |
| `skills/openspec-apply-change/SKILL.md`, `skills/openspec-update-change/SKILL.md`, `skills/openspec-explore/SKILL.md`, `skills/openspec-onboard/SKILL.md` | D5 — regenerados no fechamento (`pnpm build && pnpm generate:skills`) |
| `EXPECTED_FUNCTION_HASHES` / `EXPECTED_GENERATED_SKILL_CONTENT_HASHES` (todos os 8 commits) | D5 — `pnpm regen:parity-hashes` no fechamento; os hashes do upstream não servem (conteúdo PT-BR). Confirmado por `git diff HEAD~1 -- …parity.test.ts \| grep '[0-9a-f]{64}'` → vazio |
| `src/commands/config.ts` @-65 (entrada `update` de `WORKFLOW_PROMPT_META`) | Já existe no fork (`5fea927`) — no-op |
| `src/core/templates/workflows/update-change.ts` (4 hunks "expanded-profile" → "optional") de `207f3cc5` | Já gravado no estado final pelo lote 1 (D16) |
| `test/core/init.test.ts` e `test/core/templates/update-change.test.ts` de `207f3cc5` | Idem — as needles já estão em `workflow opcional` |
| `src/core/templates/workflows/onboard.ts` (`7da3f34f`) | O arquivo do fork é wrapper de 29 linhas; o texto vive em `ONBOARD_TEMPLATE_MESSAGES` (editado). `git diff --stat -- src/core/templates/workflows/onboard.ts` → vazio |
| `import { STORE_SELECTION_GUIDANCE }` / `${STORE_SELECTION_GUIDANCE}` / `planningHome` / `--store` (contexto dos diffs) | D1 — stores adiado |
| `test/utils/ci.test.ts` (aparece no range `0b233efb^..96a65486`) | Pertence a `622c509a` (lote F) |
| Hunks Codex `.agents/` de `command-references.test.ts` (também no range) | Pertencem a `59bfb27a` (lote D) |
| `website/**`, `docs-lab/**`, `openspec/changes/**`, `CHANGELOG.md`, `package.json` | Nenhum dos 8 commits os toca |

---

## 6. Hunks de docs pendentes para o lote G

**Nenhum.** Os 8 commits deste lote não tocam `docs/**` nem `docs/pt-BR/**` (verificado com
`git show --name-only` de cada um). Duas observações para o lote de docs, herdadas dos briefs
e **não** originadas de hunks destes commits:

- `docs/faq.md` e `docs/pt-BR/faq.md` ainda falam em "expanded profiles"/"perfil expandido";
  o upstream também não os atualizou em `207f3cc5`. Revisão editorial opcional.
- Nenhum espelho em `docs/` do texto de tasks alterado por `7da3f34f` (grep por
  "Verification step" / "Etapa de verificação" / "Each task should be verifiable" sem hits).
  Os exemplos ilustrativos de `docs/getting-started.md:216` e `docs/concepts.md:324` não
  foram tocados pelo upstream — fora de escopo.

Também **nenhum** hunk de `openspec/specs/**` nestes commits.

---

## 7. Validação

```
pnpm exec tsc --noEmit                                              → OK
pnpm lint                                                           → OK
node build.js                                                       → OK (Version 6.0.3)
pnpm exec vitest run --exclude …skill-templates-parity --exclude …skillssh-parity
                                                                    → 99 arquivos / 3225 testes, 0 falhas
node dist/index.js validate --specs                                 → 36 aprovados, 0 reprovados
```

Baseline antes deste lote: 98 arquivos / 3211 testes. **+1 arquivo, +14 testes.**

`skill-templates-parity.test.ts` isolado: **9 de 11 passam**; falham só
`preserves all template function payloads exactly` e
`preserves generated skill file content exactly` — esperado até a regeneração D5.
Os 2 `it` comportamentais novos deste lote (apply shared core, onboard #345) passam.

Smoke de runtime (após `node build.js`):

```
getApplyInstructions() === skill.instructions === command.content       → true true
transformer('codex')  → $openspec-apply-change add-auth, $openspec-continue-change, $openspec-archive-change
transformer('kimi')   → /skill:openspec-apply-change add-auth, /skill:openspec-continue-change, /skill:openspec-archive-change
(nenhum /opsx: sobrevive à transformação)
```

Smoke em projeto temporário (`openspec init --tools claude`):
`Desenhe apenas com ASCII puro` presente 1× na skill e 1× no command do explore;
`grep -P "[\x{2500}-\x{25FF}]"` no SKILL.md gerado → vazio;
`traga o escopo adicional à tona` 2× na skill e 2× no command do apply.

Checklist de greps dos briefs (todos os alvos batem):

```
grep -c "^\*\*Entrada\*\*" apply-change.ts                → 1
grep -c "export function getApplyInstructions" …          → 1
grep -c "getApplyInstructions()," …                       → 2
grep -c "STORE_SELECTION_GUIDANCE\|planningHome" …        → 0
grep -c "artifact de rastreamento" …                      → 1
grep -c "sugira usar openspec-continue-change\|Pronto para arquivar" … → 0
grep -c "Antes da primeira ação capaz de escrever" explore.ts → 4
grep -c "Desenhe apenas com ASCII puro" explore.ts        → 2
grep -c "Não faça scaffold de changes manualmente" …      → 2
grep -c -- "--store" (3 templates)                        → 0
grep -c "export const WORKFLOW_PROMPT_META" config.ts     → 1
```

---

## 8. Divergências entre brief e código real

1. **`LC-7da3f34f.md` §2/§5.2 recomenda criar `test/core/templates/onboard.test.ts`.**
   Seguida a decisão D22 do orquestrador (teste no `skill-templates-parity.test.ts`, onde o
   upstream o colocou). O `describe('skill templates split parity')` do fork **não** é só
   hash — já tem 8 `it` comportamentais herdados do lote 1 —, então a premissa do brief
   ("parity do fork é só hash, 4 `it`") estava desatualizada.
2. **`LC-misc.md` §2 descreve `explore.ts`/`update-change.ts` no estado pré-lote-1.** A árvore
   já estava no estado final (guardrail de scaffold, "workflow opcional", tabela
   `<capability-path>`), como o relatório LC1 registra. Os hunks foram aplicados sobre o
   estado real; nenhum texto do lote 1 foi reescrito.
3. **`LC-misc.md` §5.5** propõe o título `draws every fenced example with plain ASCII only (#983)`
   com `[^\x00-\x7F]` e, em seguida, a decisão LC-1. Adotada a LC-1 (título
   `…without Unicode diagram glyphs (#983)`), com a medição registrada em §2.3.

---

## 9. Dúvidas / pendências abertas

1. **`workflowUpdateDesc` divergente do upstream.** O fork diz "Revisa artefatos de
   planejamento e os mantém coerentes"; o upstream, "Revise the planning artifacts of an
   existing change". Mantido o do fork (brief marcava o alinhamento como opcional). Se o
   fechamento preferir alinhar, é uma linha em `CONFIG_MESSAGES.workflowUpdateDesc` — e o
   teste do picker continua verde nos dois casos.
2. **`Example:` do `schema.yaml` em inglês.** Consistente com o artifact `specs` e com o
   estado anterior do artifact `tasks`, mas é prosa exibida ao usuário via
   `openspec instructions tasks`. Se a política do fork mudar para traduzir os exemplos, o
   brief LC-7da3f34f §4.1 traz a versão PT-BR pronta e as asserções de §5.1 precisam trocar
   `/\bverify\b/i` por `/\bverific/i` + 4 substrings.
3. **Placeholder `"<name>"` no parêntese do estado `blocked` do apply** (herdado do upstream)
   convive com `"<nome>"` no resto do corpo. Cosmético; não corrigido para não divergir do
   upstream. Candidato a uma limpeza editorial no fechamento.
4. **Paridade vermelha entre lotes (D5).** `skill-templates-parity.test.ts` (2 `it` de hash) e
   `skillssh-parity.test.ts` seguem vermelhos até
   `pnpm build && pnpm generate:skills && pnpm regen:parity-hashes`. Hashes que este lote
   deve mudar no fechamento: `getApplyChangeSkillTemplate`, `getOpsxApplyCommandTemplate`,
   `getExploreSkillTemplate`, `getOpsxExploreCommandTemplate`, `getOnboardSkillTemplate`,
   `getOpsxOnboardCommandTemplate` + os `openspec-apply-change`, `openspec-explore`,
   `openspec-onboard` do mapa de conteúdo gerado. (O `update` **não** muda aqui — mudou no lote 1.)
5. **Larguras dos diagramas ASCII** foram conferidas por script coluna a coluna, mas nenhum
   teste as protege (o guard só olha glifos). Se alguém editar os rótulos PT-BR, recontar.

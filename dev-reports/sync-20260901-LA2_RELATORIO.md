# Relatório do lote LA2 — Archive: EOF canônico, linhas em branco, ordem em RENAMED, stdout não-TTY

Branch: `sync/upstream_20260901` · Commit do fork: `285db17` — `fix(archive): portar EOF canônico, linhas em branco, ordem de RENAMED e stdout não-TTY do upstream v1.9.0–v1.11.0`.
Commits do upstream portados, nesta ordem: `94258974`, `0221ac3d`, `04b37ac1`, `9ae75c86`. Aplicado sobre o estado pós-LA1 (`specs-apply.ts`/`archive.ts` já com `retire_capabilities` e transação).

## 1. O que foi portado (src/)

| Arquivo do fork | Origem | Resultado |
|---|---|---|
| `src/core/specs-apply.ts` | 94258974 + 0221ac3d (estado final) | `rebuilt` = `[before.trimEnd(), headerLine, reqBody, after.trim()].filter(s => s !== '').join('\n\n').replace(/\n{3,}/g,'\n\n').trimEnd() + '\n'`. Comentário explicativo em PT-BR (linhas em branco ao redor de `## Requirements` + EOF canônico #1528). O trecho pré-porte era idêntico ao upstream pré-94258974, como o brief previa. |
| `src/core/specs-apply.ts` | 04b37ac1 | `orderedKeys` (lista paralela de chaves posicionais) logo após o loop `nameToBlock`; `renamedTargets` removido; no fim do loop RENAMED, `orderedKeys[indexOf(from)] = to`; recomposição percorre `for (let index …)` com `orderedKeys[index]`; `replacementFromOriginal = replacement`. Comentários em PT-BR. `grep renamedTargets` → 0. |
| `src/utils/interactive.ts` | 9ae75c86 | Hunk aplicado limpo via `git apply` (o arquivo do fork era idêntico ao upstream pré-commit): `createInterface`/`Readable`/`Writable`, doc-comment de `isNonInteractivePromptError` estendido, `return !isInteractive(value) \|\| !process.stdout.isTTY`, tipo `ConfirmPrompt`, `confirmPrompt()` e `readYesNo()`. `diff` contra `9ae75c86:src/utils/interactive.ts` → vazio (arquivo 100 % EN no fork; mantido EN para facilitar syncs futuras, brief §8.8). |
| `src/core/archive.ts` | 9ae75c86 | Import `confirmPrompt`; `confirmOrBlock` chama `confirmPrompt(prompt)` (sem `import('@inquirer/prompts')`); gate de TTY em `selectChange` **depois** do check `noActiveChanges` e **antes** de montar as choices: `if (!process.stdin.isTTY \|\| !process.stdout.isTTY) throw new Error(ARCHIVE_MESSAGES.blockedChangeNameRequiredNoTerminal(\`openspec archive <nome-da-alteração> ${rerunFlags(options).join(' ')}\`))`. Comentário em PT-BR. O picker continua usando `select` do @inquirer em terminal real. |
| `src/messages/index.ts` | — | 1 chave nova (ver §3). |

Nenhum hunk em `schemas/`, `openspec/specs/`, `src/core/templates/`, `skills/`, `website/`, `docs-lab/` ou `openspec/changes/` nesses quatro commits.

## 2. Adaptações relevantes

1. **Sem `ArchiveBlockedError`/`withStoreFlag`/`root`** (JSON/stores adiados, D1): o gate do picker lança `new Error(ARCHIVE_MESSAGES.blockedChangeNameRequiredNoTerminal(rerun))`, mesmo formato dos demais `blocked*` do fork (`…\nCorreção: <comando>`). A chave antiga `blockedChangeNameRequired` continua no `catch` do `select` (terminal presente com `CI`/`OPEN_SPEC_INTERACTIVE=0`), como o brief pede — textos diferentes de propósito.
2. **Rótulos `(Y/n)`/`(y/N)` do `readYesNo` mantidos em EN** (observação do orquestrador + brief §4): o parser aceita só `y|yes`/`n|no`, espelhando o `@inquirer/confirm` em modo TTY; traduzir o rótulo ou aceitar `s/sim` criaria divergência TTY × pipe. Não foi ao catálogo.
3. `new Error('User force closed the prompt')` + `name = 'ExitPromptError'` em `blockOnNoAnswer`: string de protocolo interna (casada por `isNonInteractivePromptError`), não traduzida — `archive.ts` a substitui pela orientação PT-BR.
4. `isNonInteractivePromptError` muda de semântica (stdout redirecionado conta como não-interativo); no fork só `archive.ts` a chama. `isInteractive()` **não** foi tocada.
5. `--yes` não pula o gate do picker (`openspec archive --yes > log` sem nome falha com a mensagem nova) — idêntico ao upstream.
6. Comentários novos em `archive.ts`, `specs-apply.ts`, `messages/index.ts` e nos testes em PT-BR (convenção do fork).
7. Brief conferido contra o diff real: nenhuma imprecisão de conteúdo nos hunks de `src/`. Duas notas: (a) os números de linha do brief estavam defasados (o fork pós-LA1 tem `archive.test.ts` com 7063 linhas e 17 ocorrências de `const { confirm } = await import('@inquirer/prompts')`, não 13 — as 4 extras são os testes de retirement/claim de LA1, que o brief §7 previa); (b) o smoke §9 do brief (`printf 'y\n' \| archive x --no-validate`) não chega a escrever o spec: o `y` é consumido pela pergunta de pular validação e a segunda pergunta cai na orientação `--yes` (exatamente o comportamento descrito no §3.7). O smoke foi refeito com `--yes` e, separadamente, com `printf 'y\n'` sem `--no-validate` num spec válido (uma só pergunta) — ver §5.

## 3. Strings adicionadas ao catálogo (`src/messages/index.ts`)

**`ARCHIVE_MESSAGES` (1):**
- `blockedChangeNameRequiredNoTerminal: (rerun: string) => \`Um nome de alteração é obrigatório: não há terminal disponível para escolher uma da lista.\nCorreção: ${rerun}\`` — com comentário de contexto (#1526).

Nenhuma outra string voltada ao usuário: prompts continuam vindo de `ARCHIVE_MESSAGES`; sem mudanças em `command-registry`, spinners, templates ou schemas.

## 4. Testes

- **`test/core/specs-apply.serialization.test.ts`** (novo, 7 testes): copiado do estado final de `0221ac3d` (`git show 0221ac3d:…`). Nada a traduzir (fixtures são conteúdo de spec; `{ silent: true }`).
- **`test/core/specs-apply.salvage.test.ts`**: inserido `warns against the source requirement when a rename-plus-modify drops its tail` antes de `does not warn when MODIFIED carries…`; asserções `'"### Notes" sits inside requirement "Target" and goes with it'` → `'"### Notes" está dentro do requisito "Target" e vai com ele'` e `not.toContain('requirement "Renamed"')` → `not.toContain('requisito "Renamed"')` (chave `SPECS_APPLY_MESSAGES.absorbedNoteGoesWithRequirement`).
- **`test/core/archive.test.ts`** (7063 → 7276 linhas; **207 testes verdes**):
  - `vi.mock('../../src/utils/interactive.js', …)` com `confirmPrompt: vi.fn()` (comentário PT-BR); mock de `@inquirer/prompts` mantido.
  - 17× `const { confirm } = await import('@inquirer/prompts')` → `const { confirmPrompt: confirm } = await import('../../src/utils/interactive.js')` (inclui os 4 testes de retirement/claim de LA1); `beforeEach` do bloco #1479 separado em `confirmPrompt` + `select`. `grep "confirm } = await import('@inquirer/prompts')"` → 0.
  - `should use select prompt for change selection`: `isTTY = true` nos dois streams com `try/finally` (vitest `pool: 'forks'` → stdout do worker não é TTY).
  - Bloco `non-interactive prompts (#1479)`: `originalStdoutIsTty`, helper `setStdoutIsTty`, `setStdoutIsTty(false)` no `beforeEach` (comentário PT-BR), restore no `afterEach`; `leaves a prompt that failed at a usable terminal alone` ganha `setStdoutIsTty(true)`.
  - `asks for a change name instead of reporting a silent cancellation`: mensagem esperada passa a ser `ARCHIVE_MESSAGES.blockedChangeNameRequiredNoTerminal('openspec archive <nome-da-alteração> --yes')` (o gate dispara antes do `select`); nota de porte em PT-BR explicando a coexistência das duas mensagens. `carries the caller's flags…` passou sem mudança (sufixo `Correção:` é comum às duas).
  - Novos: `never renders the picker into a non-terminal, asking for a name instead (#1526)` (`rejects.toMatchObject({ diagnostic })` → `rejects.toThrow('Um nome de alteração é obrigatório: não há terminal disponível…')` + `select` nunca chamado); `should preserve source order and lineage when renaming requirements` (8 casos; `not.toContain('está dentro do requisito "B"')`); `should keep the target and change untouched when a later rename collides` (`'RENAMED falhou para cabeçalho "### Requirement: C" - destino já existe'`, exit 1, nada escrito/movido — já valia no fork pelo caminho `prepareError`).
- **`test/utils/interactive.test.ts`** (34 testes): hunk do upstream aplicado limpo (arquivo idêntico ao pré-commit). Armadilha do brief §5.4 confirmada: o `git apply` preservou o byte ESC cru (0x1b) na linha 292 → normalizado para `''` com o mesmo comentário das outras duas ocorrências. `grep -c $'\x1b'` → 0; `not.toContain('')` → 0. Nenhuma asserção PT-BR (mensagens são literais do teste).
- Testes pulados: **nenhum** (nada de stores/`--json` nestes commits).

**Validação padrão:** `pnpm exec tsc --noEmit` ✔ · `node build.js` ✔ · `pnpm lint` ✔ · `pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts` → **93 arquivos / 3095 testes passando**; 1 arquivo vermelho **esperado e pré-existente**: `test/core/templates/skillssh-parity.test.ts` (compara `skills/**` commitado com os templates alterados em LA1 — regenerado com `pnpm generate:skills` no fechamento, D5). Este lote não tocou templates.

## 5. Smoke manual (CLI buildado, projeto temporário no scratchpad)

- `archive x --no-validate --yes` com spec `A, B` + `## Notes` e delta `RENAMED A→A2`, alvo terminando em `\n\n\n`: exit 0, **0 bytes ESC** na saída, ordem `A2` (l.8) antes de `B` (l.11), arquivo termina em um único `0a`, linha em branco antes e depois de `## Requirements`, `## Notes` preservado com linha em branco antes.
- `printf 'y\n' | archive w` (spec válido, só a pergunta de atualizar specs): exit 0, 0 ESC, prompt impresso como `Prosseguir com as atualizações de especificação? (Y/n) `, `→ 1 renomeado(s)`, spec reescrito com `A2` antes de `B` e EOF único.
- `printf 'y\n' | archive x --no-validate`: o `y` responde `skipValidationWarning`; a segunda pergunta encontra stdin drenado → `Atualizar 1 especificação(ões) requer confirmação … Correção: openspec archive x --no-validate --yes`, exit 1, sem ANSI (não trava — §3.7 do brief).
- `archive > out2.txt` sem nome com alterações ativas: exit 1, **stdout sem ANSI**, `select` não renderizado, mensagem `Um nome de alteração é obrigatório: não há terminal disponível para escolher uma da lista.\nCorreção: openspec archive <nome-da-alteração> --yes`.
- `printf 'n\n' | archive z --no-validate` (tarefa incompleta): `Arquivamento cancelado.`, alteração permanece.

## 6. Hunks pulados (com motivo)

| Hunk | Motivo |
|---|---|
| `.changeset/canonicalize-spec-eof.md`, `.changeset/calm-otters-order.md`, `.changeset/archive-nontty-ansi.md` | D3 — changeset único do fork sai no fechamento. |
| `9ae75c86` → `src/core/archive.ts`: `ArchiveBlockedError('archive_change_name_required', …)` + `withStoreFlag(root, …)` | Fork sem diagnósticos JSON nem stores → `throw new Error(ARCHIVE_MESSAGES.blockedChangeNameRequiredNoTerminal(…))`. |
| `9ae75c86` → `test/core/archive.test.ts`: `rejects.toMatchObject({ diagnostic: { code } })`; teste `leaves JSON mode untouched` (hunk de troca de `confirm`) | Sem `--json` no fork → `rejects.toThrow(<mensagem PT-BR>)`; o teste JSON não existe no fork. |
| `9ae75c86` → `docs/troubleshooting.md` | Instrução do orquestrador: docs ficam para o lote G (ver §7). |

## 7. Hunks de docs pendentes para o lote de docs (G)

- **`9ae75c86` — `docs/troubleshooting.md`**: inserir, após a linha "Keep any flags you were already passing … the picker needs an answer too." (l.130) e antes de `## Configuration`, o parágrafo EN do upstream (texto integral em LA-fixes.md §4, linha `docs/troubleshooting.md`): *"If you instead ran archive with its output redirected to a file or captured by a tool and *did* pipe an answer (`printf 'y\n' | openspec archive …`), older versions wrote terminal escape codes into that capture while drawing the prompt — … passing `--yes` (with a change name) skips the prompts entirely."*
- **Espelho `docs/pt-BR/troubleshooting.md`**: mesmo ponto (após a l.130, antes de `## Configuração`), tradução proposta no brief LA-fixes.md §4 (glossário: "mudança", "seletor" para picker, "captura", "linha `Correção:`"). Atenção do lote G: `3d0701f8`, `f3aa167d`, `83be9d11`, `59bfb27a` também tocam `troubleshooting.md` em outros pontos.

## 8. Dúvidas abertas / observações para o fechamento

1. **`(s/N) (y/N)` duplicado**: `ARCHIVE_MESSAGES.skipValidationWarning` já termina em `(s/N)` e tanto o `@inquirer` (TTY) quanto o `readYesNo` (pipe) acrescentam `(y/N)` — a linha sai como `… Continuar? (s/N) (y/N)`. Quirk pré-existente do fork, visível no smoke; fora do escopo (mudar o parser para aceitar `s` criaria divergência TTY × pipe). Sugestão de follow-up: remover o `(s/N)` da chave ou customizar o tema do `@inquirer` numa mudança própria.
2. No smoke do picker sem terminal, o **stderr** (`✖ Erro: …`, escrito pelo handler de erro do CLI) ainda carrega 1 sequência de cor do chalk mesmo redirecionado; o **stdout** fica limpo. É o caminho de erro genérico do CLI (pré-existente, idêntico ao upstream, que também passa por ele) — não é o loop de render do #1526. Registrar apenas.
3. `skillssh-parity.test.ts` continua vermelho até `pnpm generate:skills` no fechamento (D5) — herdado de LA1, não deste lote.
4. Nenhuma dúvida bloqueante; nenhum hunk de `src/` ficou sem porte ou justificativa.

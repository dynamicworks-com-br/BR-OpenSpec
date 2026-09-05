# Relatório do lote LD5 — `init --language` (c747ed1f — D10)

- **Commit criado:** `1c1e915ac61090d5b3448bee01fa43ba2516be0c` (era `be093371348df70995edfefdfa031f0117268cea` antes do `--amend` da revisão rodada 1 — ver §8)
- **Título:** `feat(init): portar opção --language para configurar o idioma dos artefatos do upstream v1.10.0`
- **Branch:** `sync/upstream_20260901`
- **Commits do upstream portados:** `c747ed1f` — `feat(init): add language option (#1685)` (integralmente em `src/`, `openspec/specs/` e nos 2 arquivos de teste aplicáveis)

---

## 1. O que foi portado

### 1.1 `src/core/project-config.ts` (hunk extra, fora do commit upstream)

`MAX_CONTEXT_SIZE` passa a ser exportado (`export const MAX_CONTEXT_SIZE = 50 * 1024;`).
No upstream esse export veio de `a0decbe` (subsistema stores, adiado no fork), mas `init.ts` e
`test/core/init.test.ts` dependem dele — sem o export, `tsc` falha. Nenhum outro uso mudou.

### 1.2 `src/messages/index.ts`

Chaves novas (todas PT-BR; ver §4 para o texto):

- `CLI_DESCRIPTIONS.language` (1 chave)
- `INIT_MESSAGES`: `languageRequiresValue`, `languageMustBeSingleLine`, `languageTooLong(limitKb)`,
  `languageCannotCreateConfig(reason)`, `languageConfigNotWritable`, `languageDoesNotOverwriteConfig`,
  `languageConfigWriteFailed(reason)` (7 chaves)

Total: **8 chaves adicionadas**. Nenhuma chave removida ou alterada.

### 1.3 `src/core/config-prompts.ts`

`serializeConfig` passa a emitir `context: |` + linhas indentadas com 2 espaços quando
`config.context !== undefined`; caso contrário mantém o bloco de comentários de exemplo
(que continua em inglês no fork, como no upstream). Hunk aplicado idêntico ao upstream.

### 1.4 `src/core/init.ts`

| Hunk | Estado |
|---|---|
| import de `MAX_CONTEXT_SIZE, readProjectConfig` de `./project-config.js` | aplicado (adaptado: sem `classifyOpenSpecDir`/`storePointerProblem`) |
| `formatLanguageContext(language)` | aplicado literalmente (texto em **inglês**, D10), com comentário PT-BR explicando o porquê |
| `InitCommandOptions.language` | aplicado |
| campo `private readonly language?` | aplicado |
| `this.language = this.normalizeLanguage(options.language)` no construtor | aplicado |
| chamada `await this.assertLanguageCanBeApplied(...)` em `execute()` | aplicado, logo após `validate()` e **antes** de `handleLegacyCleanup` |
| `normalizeLanguage` / `languageContext` / `assertLanguageCanBeApplied` | aplicados, com as 6 strings de erro trocadas por `INIT_MESSAGES.*` |
| `createConfig` (context + `catch (error)` que relança) | aplicado + adaptação do fork (ver §2) |

A regex de validação foi mantida idêntica ao upstream
(`/\p{Cc}|\p{Bidi_Control}|[\u200B\u2028\u2029\uFEFF]/u`), com os invisíveis escritos como
escapes `\uXXXX` no fonte.

### 1.5 `src/cli/index.ts`

- `.option('--language <language>', CLI_DESCRIPTIONS.language)` inserido entre `--tools` e `--force`
  (mesma ordem do tip do upstream, já com `--copilot-cloud`/`--no-copilot-cloud` no fim).
- `language?: string` no tipo inline do `options` da `.action`.
- `language: options?.language` na construção do `InitCommand`.
- O `catch` existente (`ora().fail(CLI_MESSAGES.error(...))` + `process.exit(1)`) já cobre os `throw`
  novos, inclusive o do construtor — nenhuma mudança necessária.

### 1.6 `src/core/completions/command-registry.ts`

Flag `{ name: 'language', description: CLI_DESCRIPTIONS.language, takesValue: true }` inserida na
entrada `init`, entre `tools` e `no-animation` (mesma posição relativa do upstream). Verificado no
gerador zsh: `'--language[Escreve os novos artefatos do BR-OpenSpec neste idioma]:value:'`.

### 1.7 `openspec/specs/cli-init/spec.md`

Requisito `### Requirement: Artifact Language Configuration` com os 4 cenários, inserido entre
`Config File Generation` e `Experimental Command Alias` (ordem do tip do upstream). Prosa em inglês,
como o resto das specs do fork — nenhuma tradução. `openspec validate cli-init --type spec` → válido.

---

## 2. Adaptações do fork

1. **Strings para o usuário → catálogo PT-BR.** As 6 mensagens de erro e a descrição da flag foram
   catalogadas. `grep -nE "The --language|Cannot create openspec|Failed to create openspec|does not overwrite" src/core/init.ts`
   → **0 ocorrências**.
2. **Texto gerado no `config.yaml` mantido em inglês** (decisão D10): `Language: …`,
   `All artifacts must be written in …`, `Keep OpenSpec structural headings and SHALL/MUST keywords in English.`
   Inclusive o "OpenSpec" da terceira linha (é o nome do padrão de cabeçalhos e conteúdo lido por agentes,
   não texto de UI) — a regra "OpenSpec → BR-OpenSpec" foi aplicada apenas nas mensagens de erro/descrição.
3. **Guard de modo não interativo em `createConfig` (fork-only, obrigatório).** O fork ainda tem
   `if (!this.canPromptInteractively() && !this.force) return 'skipped';` (o upstream removeu esse
   bloco em `a0decbe`, do subsistema de stores, adiado). Aplicar o diff limpo produziria um bug
   silencioso: em CI (não-TTY, sem `--force`), `init --tools none --language X` passaria pelo
   `assertLanguageCanBeApplied`, criaria `openspec/` e descartaria o idioma sem erro. Adaptação
   mínima adotada: `&& !this.language` no guard — sem `--language` o comportamento é idêntico ao
   de antes. **Decisão registrada no corpo do commit**; a alternativa (remover o bloco inteiro,
   alinhando ao upstream) fica para quando o subsistema de stores for portado.
4. **`MAX_CONTEXT_SIZE` exportado** em `project-config.ts` (hunk extra; ver §1.1).
5. **Import parcial de `project-config.js`**: só `MAX_CONTEXT_SIZE, readProjectConfig`;
   `classifyOpenSpecDir` e `storePointerProblem` são do subsistema de stores.
6. **Contexto do hunk de `execute()`**: o upstream põe a chamada depois do "pointer guard" de stores
   (`findRepoPlanningRootSync` / `classifyOpenSpecDir`), inexistente no fork. A chamada entrou logo
   após `validate()`, preservando a garantia de falhar antes de `handleLegacyCleanup`.

---

## 3. Pulado (com motivo)

| Item | Motivo |
|---|---|
| `test/commands/declared-store-fallback.test.ts` (+9 linhas, `refusedWithLanguage`) | Subsistema stores (D1/D13); arquivo não existe no fork |
| `.changeset/add-init-language-option.md` | D3 — changesets do upstream nunca são importados; o do fork é escrito no fechamento da sync |
| `src/core/init.ts`: import de `classifyOpenSpecDir`, `storePointerProblem` | Stores (adiado) |
| `src/core/init.ts`: contexto de `execute()` com `findRepoPlanningRootSync`/pointer guard/`deferredLegacyCleanup` do upstream | Stores / código de outro commit — não faz parte deste porte |
| ~~`docs/cli.md`, `docs/multi-language.md` (+ espelhos PT-BR)~~ | **Não é mais pulado:** portados na revisão rodada 1 e incluídos neste commit — ver §8.1 (a §5 vira histórico) |

Não há hunks de `website/`, `docs-lab/`, `openspec/changes/`, `skills/` ou `CHANGELOG.md` neste commit.

**Nenhum hunk de `src/` ficou sem porte ou sem justificativa.**

---

## 4. Strings adicionadas ao catálogo

`src/messages/index.ts`:

| Chave | Texto PT-BR |
|---|---|
| `CLI_DESCRIPTIONS.language` | `Escreve os novos artefatos do BR-OpenSpec neste idioma` |
| `INIT_MESSAGES.languageRequiresValue` | `A opção --language requer um valor não vazio.` |
| `INIT_MESSAGES.languageMustBeSingleLine` | `A opção --language deve ser uma única linha, sem caracteres de controle ou de formatação invisíveis.` |
| `INIT_MESSAGES.languageTooLong(limitKb)` | `O valor de --language é longo demais para o limite de ${limitKb}KB do contexto de projeto do BR-OpenSpec.` |
| `INIT_MESSAGES.languageCannotCreateConfig(reason)` | `Não é possível criar openspec/config.yaml para --language${reason}` (`reason` já chega com `: ` prefixado, como no upstream) |
| `INIT_MESSAGES.languageConfigNotWritable` | `Não é possível criar openspec/config.yaml para --language: o destino não tem permissão de escrita.` |
| `INIT_MESSAGES.languageDoesNotOverwriteConfig` | `--language não sobrescreve uma configuração existente do BR-OpenSpec. Em vez disso, adicione a instrução de idioma ao campo context dela.` |
| `INIT_MESSAGES.languageConfigWriteFailed(reason)` | `Falha ao criar openspec/config.yaml para --language${reason}` |

As duas mensagens de "não é possível criar" compartilham o prefixo
`Não é possível criar openspec/config.yaml para --language`, para que o teste unitário
(que usa um único `toThrow` para os casos "não gravável" e "symlink pendurado") cubra ambas.

Chaves reutilizadas sem alteração: `CLI_MESSAGES.error`, `INIT_MESSAGES.configCreated/configExists/configSkipped`.

---

## 5. Hunks de docs pendentes para o lote G *(HISTÓRICO — resolvido na §8.1; os 4 arquivos entraram neste commit)*

O commit `c747ed1f` tem **4 arquivos de documentação pendentes** (2 EN + 2 PT-BR):

### `docs/cli.md` (seção `### \`openspec init\``)
1. Parágrafo após o bloco de uso ```` ```openspec init [path] [options]``` ````, antes de `**Arguments:**`:
   > `Use \`--language <language>\` to add a language instruction to a new project's \`openspec/config.yaml\`. For an existing project, edit the config's \`context\` field so BR-OpenSpec never overwrites project-specific guidance.`
   (upstream diz "so OpenSpec never overwrites" → trocar por "BR-OpenSpec")
2. Linha da tabela de opções, logo após `--tools <list>`:
   `| \`--language <language>\` | Write artifacts in this language when creating a new config |`
3. (Opcional, recomendado por D10) exemplo no bloco **Examples**:
   `# Set the artifact language for a new project` / `openspec init --language "Portuguese (pt-BR)"`

### `docs/pt-BR/cli.md`
As mesmas duas/três inserções em PT-BR. Textos sugeridos:
1. `Use \`--language <language>\` para adicionar uma instrução de idioma ao \`openspec/config.yaml\` de um projeto novo. Em um projeto existente, edite o campo \`context\` da configuração — o BR-OpenSpec nunca sobrescreve orientações específicas do projeto.`
2. `| \`--language <language>\` | Escrever os artefatos neste idioma ao criar uma nova configuração |`
3. `# Definir o idioma dos artefatos de um projeto novo` / **`openspec init --language "Português (pt-BR)"`** (recomendação D10)

### `docs/multi-language.md` (`## Quick Setup`)
1. Antes de `Add a language instruction to your \`openspec/config.yaml\`:` — 3 parágrafos + bloco bash:
   `For a new project, set the language during initialization:` / ```` ```bash\nopenspec init --language "Portuguese (pt-BR)"\n``` ```` /
   `This writes the language instruction to \`openspec/config.yaml\`. If the project already has a config, edit its \`context\` field directly so existing project guidance is preserved.` /
   `You can also configure the same behavior manually:`
2. No YAML de exemplo, após `All artifacts must be written in Brazilian Portuguese.`:
   `Keep OpenSpec structural headings and SHALL/MUST keywords in English.`
3. Após `That's it. All generated artifacts will now be in Portuguese.`:
   `BR-OpenSpec's document structure and normative \`SHALL\`/\`MUST\` keywords remain in English because validation relies on them. The surrounding requirement and scenario prose can use your selected language.`

### `docs/pt-BR/multi-language.md` (`## Configuração Rápida`) — **diverge**
Os exemplos manuais PT-BR do fork usam `Idioma: Português (pt-BR)` / `Todos os artefatos devem ser escritos em português do Brasil.`, enquanto `--language` grava o bloco **em inglês**. O lote G precisa conciliar:
- inserir `Em um projeto novo, defina o idioma durante a inicialização:` + ```` ```bash\nopenspec init --language "Português (pt-BR)"\n``` ````;
- explicar que o bloco gerado fica em inglês (é lido pelos agentes) e mostrar **literalmente** as 3 linhas geradas, para o usuário reconhecer o que verá no `config.yaml`;
- `Se o projeto já tem uma configuração, edite o campo \`context\` diretamente para preservar as orientações existentes.` + `Você também pode configurar o mesmo comportamento manualmente:`;
- manter os exemplos manuais com `Idioma:` e acrescentar neles `Mantenha os cabeçalhos estruturais do OpenSpec e as palavras-chave SHALL/MUST em inglês.`;
- parágrafo final: `A estrutura dos documentos do BR-OpenSpec e as palavras-chave normativas \`SHALL\`/\`MUST\` permanecem em inglês porque a validação depende delas. A prosa dos requisitos e cenários ao redor pode usar o idioma escolhido.`

---

## 6. Testes

### Portados/adaptados

**`test/core/init.test.ts`** — 9 testes novos, inseridos após `'should create config.yaml with default schema'`.
Imports novos: `MAX_CONTEXT_SIZE, readProjectConfig` de `../../src/core/project-config.js` e
`FileSystemUtils` de `../../src/utils/file-system.js`. **A lógica dos testes não foi alterada**;
só 4 asserções de string foram traduzidas:

| Teste | Adaptação |
|---|---|
| `should add the requested artifact language to a new config` | nenhuma (conteúdo do YAML em EN, `readProjectConfig`, rerun idempotente) |
| `should not overwrite an existing config when --language is used` | `'--language does not overwrite an existing OpenSpec config'` → `'--language não sobrescreve uma configuração existente do BR-OpenSpec'` |
| `should protect an existing config.yml when --language is used` | idem |
| `should accept language context at the exact project context size limit` | `toThrow('too long')` → `toThrow('longo demais')` |
| `should reject oversized and unsafe language values before writing files` | nenhuma (`toThrow()` genérico) |
| `should reject an unwritable language config before creating other files` | `'Cannot create openspec/config.yaml for --language'` → `'Não é possível criar openspec/config.yaml para --language'` |
| `should reject a dangling language config symlink…` (`it.skipIf(win32)`) | mesma string PT-BR |
| `should surface a language config write failure` | `'Failed to create … : disk full'` → `'Falha ao criar openspec/config.yaml para --language: disk full'` |
| `should preserve best-effort config writes when no language is requested` | nenhuma |

**`test/cli-e2e/basic.test.ts`** — 2 hunks:
- `expect(normalizedOutput).toContain('--language <language>');` no teste de help (nome do flag, sem tradução);
- `it('initializes artifact language non-interactively')` como primeiro teste do describe
  `init command non-interactive options` — asserções sobre o `config.yaml` e o `context` do JSON de
  `instructions` mantidas em inglês (texto gerado segue o upstream). Foi acrescentado 1 comentário
  PT-BR explicando por que as asserções são em inglês (única diferença de linhas em relação ao upstream).

### Pulados

- `test/commands/declared-store-fallback.test.ts` — stores (D1/D13); arquivo inexistente no fork.

### Resultado da validação padrão

```
pnpm exec tsc --noEmit                 → ok (sem saída)
node build.js                          → ok ("Build completed successfully")
pnpm lint (eslint src/)                → ok (sem findings)
pnpm exec vitest run --exclude …parity → 103 arquivos / 3455 testes passando
```

Rodadas focadas: `test/core/init.test.ts` → 112/112 (9 novos); `test/cli-e2e/basic.test.ts` → 25/25
(incluindo o novo `initializes artifact language non-interactively`).

`openspec validate --all` → 44 aprovados, 3 reprovados; as 3 reprovações são `change/` pré-existentes
(`add-artifact-regeneration-support`, `add-global-install-scope`, `schema-alias-support`) e não têm
relação com este lote. `openspec validate cli-init --type spec` → válido.

### Smokes manuais (dir temporário, não-TTY)

- `init --tools none --language "Português (pt-BR)" --no-animation` → exit 0; `config.yaml` com
  `context: |` + as 3 linhas EM INGLÊS e sem o bloco `# Project context (optional)`.
- Rerun idêntico → exit 0, `Config: openspec/config.yaml (existe)`, md5 do arquivo inalterado.
- `context` editado à mão + rerun com `--language` → exit 1,
  `✖ Erro: --language não sobrescreve uma configuração existente do BR-OpenSpec. Em vez disso, adicione a instrução de idioma ao campo context dela.`, arquivo intacto.
- `--language ""` → exit 1, `Erro: A opção --language requer um valor não vazio.`, `openspec/` não criado.
- `--language $'a\nb'` → exit 1, `Erro: A opção --language deve ser uma única linha, sem caracteres de controle ou de formatação invisíveis.`, nada criado.
- `openspec init --help` → `--language <language>  Escreve os novos artefatos do BR-OpenSpec neste idioma`.
- `openspec completion generate zsh | grep language` → flag presente.

---

## 7. Dúvidas abertas / pendências

1. **Guard não interativo de `createConfig`.** A adaptação `&& !this.language` é a mínima possível.
   Quando o subsistema de stores for portado (`a0decbe`), o bloco inteiro deve desaparecer, alinhando
   ao upstream — e `INIT_MESSAGES.configSkipped` passará a ser usado apenas no `catch`. Vale marcar
   isso no brief do lote de stores.
2. **Registry de completions sem `force`/`profile` na entrada `init`.** Divergência pré-existente do
   fork em relação ao upstream (as flags existem no commander, mas não no registry). Fora de escopo
   deste lote; registrado aqui como lacuna a corrigir eventualmente.
3. **Docs `pt-BR/multi-language.md` usa `Idioma:` nos exemplos manuais** enquanto `--language` grava
   `Language:`. Ambos funcionam (é prosa livre para o agente), mas o lote G precisa mostrar
   literalmente o bloco gerado para não confundir o usuário BR. Não "corrigir" o gerador para PT-BR:
   os testes unitário e e2e checam o texto EN, e a decisão D10 é explícita.
4. Nenhuma imprecisão relevante encontrada no brief: as linhas citadas divergiam um pouco (o fork
   avançou com os lotes anteriores), mas o mapa de arquivos, a lista de hunks e as armadilhas
   (guard não interativo, export de `MAX_CONTEXT_SIZE`, ordem no `execute()`, prefixo comum das
   mensagens) estavam todos corretos.

---

## 8. Revisão rodada 1 (2026-09-02)

Achado tratado: **"os 2 hunks de docs de `c747ed1f` (+ espelhos PT-BR) não foram portados"** (importante).
Evidência confirmada no repositório antes da correção: `grep -rn -- "--language" docs/` → 0 resultados;
`grep -n -i "language\|c747ed1f\|multi-language" scratchpad/briefs/LG-docs-only.md` → 0 resultados.
Ou seja, a §5 deste relatório era o **único** registro do pendente e ficava fora do fluxo do lote G.

### 8.1 Corrigido — 4 arquivos de docs portados (agora dentro do commit do lote)

| Arquivo | Conteúdo |
|---|---|
| `docs/cli.md` | Parágrafo `Use \`--language <language>\` …` entre o bloco de uso e `**Arguments:**` + linha `\| \`--language <language>\` \| Write artifacts in this language when creating a new config \|` na tabela de opções, logo após `--tools`. Identidade: `so BR-OpenSpec never overwrites…` |
| `docs/pt-BR/cli.md` | Mesmas duas inserções traduzidas: `Use \`--language <language>\` para adicionar uma instrução de idioma ao \`openspec/config.yaml\` de um projeto novo. Em um projeto existente, edite o campo \`context\` da configuração — o BR-OpenSpec nunca sobrescreve orientações específicas do projeto.` e `\| \`--language <language>\` \| Escrever os artefatos neste idioma ao criar uma nova configuração \|` (infinitivo, como as linhas vizinhas) |
| `docs/multi-language.md` | Bloco novo no `## Quick Setup` (`For a new project…` + `openspec init --language "Portuguese (pt-BR)"` + `This writes the language instruction…` + `You can also configure the same behavior manually:`), a linha `Keep OpenSpec structural headings and SHALL/MUST keywords in English.` **apenas** no YAML do Quick Setup (como no upstream) e o parágrafo final `BR-OpenSpec's document structure and normative \`SHALL\`/\`MUST\` keywords remain in English…` |
| `docs/pt-BR/multi-language.md` | `## Configuração Rápida` ganha `Em um projeto novo, defina o idioma durante a inicialização:` + `openspec init --language "Português (pt-BR)"` (uso recomendado por **D10**), a explicação de que **o bloco gerado fica em inglês porque é lido pelos agentes** seguida do YAML com as 3 linhas geradas literalmente (`Language: Português (pt-BR)` / `All artifacts must be written in Português (pt-BR).` / `Keep OpenSpec structural headings and SHALL/MUST keywords in English.`), `Se o projeto já tem uma configuração, edite o campo \`context\` diretamente…`, `Você também pode configurar o mesmo comportamento manualmente:`; no exemplo manual (que continua com `Idioma:`) foi acrescentada a linha `Mantenha os cabeçalhos estruturais do OpenSpec e as palavras-chave SHALL/MUST em inglês.`; parágrafo final sobre `SHALL`/`MUST` + demais termos reservados |

Decisões aplicadas: `OpenSpec` → `BR-OpenSpec` **só** na prosa; dentro dos blocos `context:` do `config.yaml`
o texto permanece o do upstream (D10 / brief §8.6), inclusive `Keep OpenSpec structural headings…`.
`SHALL`/`MUST` e os cabeçalhos estruturais não foram traduzidos.
O exemplo opcional no bloco **Examples** do `cli.md` (citado no brief §4.3 como "opcional") foi **dispensado**:
D10 pede o uso recomendado em `docs/pt-BR/multi-language.md`, que agora o traz, e acrescentá-lo criaria
um delta do espelho EN em relação ao tip do upstream sem necessidade. O espelho PT-BR do `multi-language.md`
ganha 1 bloco YAML a mais que o EN (o bloco gerado literal) — divergência intencional, pedida pelo brief §8.7,
porque o comando grava em inglês num doc escrito em português.

### 8.2 Corrigido — vazamento sistêmico de docs registrado no lote G

O achado apontou que o mesmo já valia para `--copilot-cloud` (lote `8477b8f`). Varredura completa do range
(`45cca5db..upstream/main`, script `scratchpad/sweep_docs.py`) confirmou o padrão:
`grep -ril "Zed Agent|Rovo Dev|MiniMax|Command Code|copilot-cloud|cloud coding agent|retire_capabilities" docs/ docs/pt-BR/`
→ **0 arquivos**, embora `src/core/config.ts` já registre `zed`, `rovodev`, `minimax-code`, `command-code`
e o archive já suporte `retire_capabilities`.

Os 9 grupos de commits afetados (`73207a6`, `42d7f67`+`59c16a4`, `07dea6e`, `f3aa167`, `161f945`+`13e213e`,
`59bfb27`, `9ae75c8`, `18688c8`+`521ee33`) foram registrados, com arquivo e contagem de linhas, num
**adendo no topo de `scratchpad/briefs/LG-docs-only.md`** (mesma convenção do bloco "DECISÃO DO ORQUESTRADOR"),
junto da regra de que lotes futuros que adiarem docs precisam acrescentar sua linha àquela tabela.
Ficam explicitamente fora: `docs/agent-contract.md` (o fork não tem a página — D7) e `docs/stores-beta/**`
(stores adiado — D1). **Não** foram portados neste commit: pertencem a outros lotes temáticos e misturá-los
ao LD5 violaria o porte por tema.

### 8.3 Rejeitado

Nenhum achado rejeitado — o único achado da rodada procedia integralmente.

### 8.4 Validação após a correção

```
pnpm exec tsc --noEmit                 → ok (sem saída)
node build.js                          → ok ("Build completed successfully")
pnpm exec vitest run --exclude …parity → 103 arquivos / 3455 testes passando
```

Checagens de docs: fences balanceadas nos 4 arquivos; sequência de cabeçalhos idêntica entre
`docs/multi-language.md` e `docs/pt-BR/multi-language.md`; `docs/cli.md` e `docs/pt-BR/cli.md` com o
mesmo número de cabeçalhos; `grep -rn -- "--language" docs/` → agora 6 ocorrências (2 por arquivo de cli.md,
1 por arquivo de multi-language.md).

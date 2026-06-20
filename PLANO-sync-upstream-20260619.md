# Plano de Sincronização BR-OpenSpec ← Fission-AI/OpenSpec (2026-06-19)

> **Status:** Plano detalhado para revisão. Nenhum código foi alterado ainda.
> **Branch de trabalho:** `sync/upstream_20260619`
> **Fork:** `@dynamicworks/br-openspec` v2.0.1 (PT-BR first)
> **Upstream:** `@fission-ai/openspec` — merge-base `3c7a05c` (2026-04-21) → tip `1b06fdd` v1.4.1 (2026-06-03)
> **Divergência:** 35 commits do upstream à frente; 59 commits exclusivos do fork.

---

## 1. Objetivo e abordagem

Trazer as **melhorias e correções** do upstream (v1.3.1 → v1.4.1) para o fork PT-BR, **traduzindo** o que for exibido ao usuário e **adaptando** à realidade do desenvolvedor brasileiro, **sem perder nenhuma customização já feita no fork**.

A sincronização **não é** um `git merge upstream/main` — a divergência (i18n centralizado, rename, identidade npm, docs bilíngues) geraria conflitos massivos e reintroduziria texto em inglês. A abordagem é **porte temático arquivo-a-arquivo**: para cada mudança do upstream, identificamos o arquivo-alvo no fork, verificamos se já está customizado, e **somamos** a melhoria de comportamento preservando a adaptação PT-BR.

### Decisão de escopo (já confirmada)
- ✅ **Bloco A** entra agora: correções + integrações (Kimi/Mistral Vibe) + `/opsx:sync` no core + docs.
- ⏸️ **Subsistema "workspace" beta** fica para uma sincronização dedicada futura (≈50% do diff, ~23 commits, instável/beta no upstream). Ver §9 (lista de skip).

---

## 2. Princípios invariáveis (REGRAS DE OURO)

Toda decisão de reconciliação respeita estes invariantes. Em **qualquer** conflito de merge nesses pontos, vence o fork (`ours`):

| # | Invariante | Salvaguarda |
|---|------------|-------------|
| I1 | **i18n central PT-BR** (`src/messages/index.ts`) | Nunca sobrescrever com inglês. Toda string nova entra aqui em PT-BR. Apenas **adicionar** chaves; nunca remover/anglicizar. Preservar assinaturas das funções `(name) => \`...\`` (há call-sites). |
| I2 | **Identidade npm/versão** (`package.json`) | Manter `@dynamicworks/br-openspec`, versão própria (NÃO aceitar `1.4.1`), `repository`/`homepage` `dynamicworks-com-br/BR-OpenSpec`. Não adicionar `cross-spawn` (só usado pelo workspace beta). |
| I3 | **CHANGELOG do fork** | Não fazer merge do CHANGELOG upstream. A entrada desta sync sai do `changeset version` do fork. |
| I4 | **Workflows exclusivos do fork** | `code-review.ts` e `upstream-sync.ts` não existem no upstream → não são tocados. Garantir que sigam registrados e que `CODE_REVIEW_TEMPLATE_MESSAGES` permaneça no catálogo. |
| I5 | **CI/CD do fork** | Preservar Node 22, `NPM_TOKEN`, `release-prepare.yml`, `.changeset/config.json` (repo do fork). Aplicar do upstream só o *delta* do gate de changesets — **sem** rebaixar para Node 20 nem migrar para OIDC-only. |
| I6 | **Docs bilíngues** | Toda mudança estrutural do upstream vai em `docs/` (inglês, espelho) **e** é traduzida em `docs/pt-BR/`, sempre preservando branding BR-OpenSpec. |
| I7 | **`flake.nix`/Nix** | Upstream não tocou neste intervalo (diff vazio) — preservar como está. |
| I8 | **Templates de workflow já traduzidos** | As mudanças do upstream nesses `.ts` estão acopladas ao workspace beta → **skip**. Não introduzir inglês acoplado a um beta ausente. |

---

## 3. Resumo executivo do que entra

| Tema | Esforço | Tradução? | Já feito no fork? |
|------|:------:|:---------:|-------------------|
| T1. Parser de header de requisito case-insensitive | S | Não | Não — aplicar |
| T2. Hint do validador (SHALL/MUST só no header) | S | **Sim** | Não — aplicar |
| T3. Fix completions zsh/oh-my-zsh (compinit) | S | Não | Não — aplicar |
| T4. `global-config` path determinístico (win32/posix) + testabilidade | S–M | Não | Não — aplicar |
| T5. Mistral Vibe (ferramenta skills-only `.vibe`) | S | **Sim** (docs) | Não — aplicar |
| T6. Sincronizar listas de tool IDs (+ corrigir drift do `lingma`) | S | **Sim** (docs) | Parcial |
| T7. `/opsx:sync` no perfil core por padrão | S–M | **Sim** | Não — aplicar |
| T8. Recomendação de modelos high-reasoning (READMEs) | S | já PT | Não — **decisão** |
| T9. Docs: Bun/Node, Community Schemas, migration-guide, test/AGENTS | M | **Sim** | Não — aplicar |
| T10. Gate de changesets no CI (preservando Node 22) | S | Não | Não — aplicar |
| T11. Versão/changeset do fork + header do CHANGELOG | S | **Sim** (changeset) | — |
| T12. Correções de consistência de passagem (npm name, etc.) | S | — | **Decisões** |
| (Kimi CLI) | — | — | ✅ **Já feito** (commit `35df165`, como "Kimi Code CLI") — só faltam ajustes finos, ver T6/§7 |

---

## 4. Sequência de execução proposta (commits temáticos)

Ordem por independência/dependência. Cada item = 1 commit lógico revisável. Build + testes ao final de cada um.

### C1 — Parser: header de requisito case-insensitive  *(T1)*
- `src/core/parsers/requirement-blocks.ts`: adicionar flag `/i` ao `REQUIREMENT_HEADER_REGEX` (linha 19) e trocar as 4 regex inline literais (linhas 61, 79, 179, 187) por `REQUIREMENT_HEADER_REGEX.test(...)`.
- `src/core/parsers/spec-structure.ts`: adicionar `/i` ao regex `REQUIREMENT_HEADER` (linha 4).
- `src/core/specs-apply.ts`: **apenas** adicionar `/i` ao regex `modHeaderMatch` (linha 290). ⚠️ NÃO aplicar o hunk adjacente da mensagem de erro — o fork já usa `SPECS_APPLY_MESSAGES.modifiedFailedHeaderMismatch(...)` (i18n). Preservar.
- `test/core/parsers/requirement-blocks.test.ts`: **novo arquivo** (porte verbatim do upstream — literais em inglês são nomes de requisito arbitrários, não UI).
- **Tradução:** nenhuma. O keyword `Requirement` é protocolo do formato de spec — **permanece em inglês** (não traduzir para "Requisito" no regex).

### C2 — Validador: dica quando SHALL/MUST só no header  *(T2)*
- `src/messages/index.ts` → `VALIDATOR_MESSAGES` (linhas 913/917): estender `missingShallOrMustAdded` e `missingShallOrMustModified` para aceitar 2º parâmetro `keywordInHeader = false` e concatenar o sufixo PT-BR quando `true`.
- `src/core/validation/validator.ts` (linhas 169/190): passar `this.containsShallOrMust(block.name)` como 2º argumento. **Não** recriar o helper `buildMissingShallOrMustMessage` em inglês. Não alterar `containsShallOrMust` (mantém só SHALL/MUST — ver Decisão D8).
- `test/core/validation.test.ts`: portar os 3 casos novos, adaptando asserções para PT-BR (`'deve conter SHALL ou MUST'`, `'não apenas no cabeçalho'`). Corpos de spec dos fixtures **permanecem com SHALL/MUST em inglês** (keywords canônicas).

**Traduções (catálogo `VALIDATOR_MESSAGES`):**
```
missingShallOrMustAdded:   (name, keywordInHeader=false) => {
  const base = `ADDED "${name}" deve conter SHALL ou MUST`;
  return keywordInHeader
    ? `${base} no corpo do requisito, não apenas no cabeçalho. Mova a declaração SHALL/MUST para a linha imediatamente após o cabeçalho "### Requirement: ...".`
    : base;
}
missingShallOrMustModified: (idem, com prefixo MODIFIED)
```

### C3 — Completions: não auto-configurar `.zshrc` sob Oh My Zsh  *(T3)*
- `src/core/completions/installers/zsh-installer.ts`: remover o método `needsFpathConfig` (≈linhas 170–189); no `install()`, trocar o ramo OMZ por `let zshrcConfigured = false; if (!isOhMyZsh) { zshrcConfigured = await this.configureZshrc(targetDir); }` + comentário. ⚠️ **Não** tocar o bloco que adiciona `generateOhMyZshFpathGuidance` via `COMPLETION_MESSAGES` (orientação PT-BR continua a ser exibida).
- `test/core/completions/installers/zsh-installer.test.ts`: aplicar o diff do upstream (assert `zshrcConfigured === false`; renomear teste para "should not configure .zshrc for Oh My Zsh").
- **Tradução:** nenhuma. ⚠️ Manter o literal `'Oh My Zsh'` em `COMPLETION_MESSAGES.zshOhMyZshFpathNote` (o teste do upstream o checa; é nome próprio).

### C4 — `global-config`: paths determinísticos + injeção para testes  *(T4)*
Dois passos genéricos (a correção `0ca74762` depende da parametrização introduzida no commit de workspace `e6d81ba`, mas **só a porção `global-config.ts` é genérica** e é trazida aqui):
1. Parametrizar: `export interface GlobalDataDirOptions { env?; platform?; homedir? }` e `getGlobalDataDir(options = {})`, trocando `process.env`/`os.platform()`/`os.homedir()` por valores injetáveis.
2. Fix de separador: `joinGlobalDataPath(platform, ...segments)` (escolhe `path.win32.join`/`path.posix.join`), mover resolução de `platform` para antes do ramo XDG, trocar `path.join` por `joinGlobalDataPath`.
- `test/core/global-config.test.ts`: importar `getGlobalDataDir` e adicionar o `describe('getGlobalDataDir')` do upstream (2 testes, POSIX + win32).
- `test/cli-e2e/basic.test.ts`: ⚠️ manter a string já traduzida `'Configuração do BR-OpenSpec Concluída'`; aplicar **só** as 3 edições de robustez (`timeoutMs: 20000`, `expect(result.timedOut).toBe(false)`, `}, 25000)` no `it`).
- **Verificação:** confirmar que nenhum call-site do fork chama `getGlobalDataDir` com argumentos (parâmetro é opcional/retrocompatível).
- **Tradução:** nenhuma.

### C5 — Mistral Vibe + sincronização das listas de tool IDs  *(T5 + T6)*
- `src/core/config.ts` (`AI_TOOLS`): adicionar `{ name: 'Mistral Vibe', value: 'vibe', available: true, successLabel: 'Mistral Vibe', skillsDir: '.vibe' }` (sem `detectionPaths` — removido de propósito no upstream para evitar `.vibe/skills/skills`). Inserir entre Kiro e OpenCode. ⚠️ **Preservar** o label `'Kimi Code CLI'` do fork (ver Decisão D1). Reordenar `lingma` é opcional (Decisão D2).
- `test/core/available-tools.test.ts`: portar o teste "should detect Mistral Vibe when .vibe directory exists".
- **Docs (EN espelho + PT tradução):** adicionar linha do Mistral Vibe e o ID `vibe` em:
  - `docs/supported-tools.md` + `docs/pt-BR/supported-tools.md` (tabela + lista `--tools`)
  - `docs/cli.md` + `docs/pt-BR/cli.md` (lista `--tools`)
  - ⚠️ **Corrigir drift pré-existente:** a lista PT-BR de `docs/pt-BR/cli.md` está defasada (25 IDs) — sincronizar com a EN adicionando `bob, forgecode, junie, lingma, vibe`. Idem `docs/pt-BR/supported-tools.md` (falta `lingma` e linha de tabela do Lingma em ambos os idiomas).

**Tradução (doc PT-BR — reutilizar wording já usado nas linhas ForgeCode/Trae do fork):**
```
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
```

### C6 — `/opsx:sync` no perfil core por padrão  *(T7)*
- `src/core/profiles.ts` (linha 14): inserir `'sync'` entre `'apply'` e `'archive'` em `CORE_WORKFLOWS`. NÃO mexer em `ALL_WORKFLOWS` (manter `'code-review'` do fork).
- `src/messages/index.ts` → `UPDATE_MESSAGES` (após `extraWorkflowsNote`, ≈linha 864): **2 chaves novas** (abaixo).
- `src/core/update.ts`: portar `const OLD_CORE_WORKFLOWS`, o import do tipo `Profile` e o método `displayOldCoreCustomProfileNote` + as 2 chamadas. ⚠️ Substituir os 2 `console.log(chalk.dim('Note: ...'))` em inglês por `chalk.dim(UPDATE_MESSAGES.oldCoreProfileSyncNote)` / `...Hint`.
- **Docs (EN + PT):** adicionar `/opsx:sync` à lista do core e aos diagramas (`propose → apply → sync → archive`) e **removê-lo** da lista "expandida" em `docs/workflows.md`, `docs/opsx.md`, `docs/cli.md`, `docs/commands.md`, `docs/getting-started.md`, `docs/migration-guide.md`, `docs/supported-tools.md`, `README.md` (+ respectivos `docs/pt-BR/*` e `README.pt-BR.md`). ⚠️ Ao remover da lista expandida, **preservar `/opsx:code-review`** do fork (edição manual — patch não aplica limpo).
- **Tests:** `test/core/profiles.test.ts` (CORE_WORKFLOWS espera 5; ALL_WORKFLOWS mantém `code-review`), `test/core/update.test.ts`, `test/core/profile-sync-drift.test.ts` (trocar workflow "extra" de `sync` para `new`), `test/commands/config-profile.test.ts`, `test/commands/config.test.ts`, `test/core/init.test.ts`. O novo teste de `displayOldCoreCustomProfileNote` deve assertar contra as STRINGS PT-BR.
- ⚠️ **Não** confundir com o `upstream-sync` do fork: `/opsx:sync` (template `sync-specs.ts`) mescla delta specs nos specs do **projeto**; `/opsx:upstream-sync` (template `upstream-sync.ts`) sincroniza o **fork** com o repositório upstream. São independentes; o `upstream-sync` não entra em `CORE_WORKFLOWS`/`ALL_WORKFLOWS`.
- ⚠️ As mudanças do período em `sync-specs.ts`/`onboard.ts`/`propose.ts`/`new-change.ts`/`verify-change.ts` vêm do commit `8498042` (workspace beta) → **skip**. O PR #1030 **não** toca templates.

**Traduções (catálogo `UPDATE_MESSAGES`):**
```
oldCoreProfileSyncNote: 'Nota: o perfil core agora inclui o workflow sync. Seu perfil personalizado está mantendo o conjunto antigo de workflows do core.'
oldCoreProfileSyncHint: 'Execute `openspec config profile core` e depois `openspec update` para adicionar o sync.'
```
(`openspec config profile core` e `openspec update` permanecem como comandos técnicos.)

### C7 — Recomendação de modelos high-reasoning  *(T8 — depende de Decisão D3)*
- `README.md` (≈linha 164) e `README.pt-BR.md` (≈linha 166): trocar `Opus 4.5 e GPT 5.2` → `Codex 5.5 e Opus 4.7`, **preservando** branding/tradução. (Nomes de produto copiados verbatim.) Não há ocorrência em `docs/`.

### C8 — Documentação não-workspace  *(T9)*
- **Bun/Node** (`a974c67`): nota na seção `### bun` de `docs/installation.md` + `docs/pt-BR/installation.md` (Bun instala globalmente, mas roda sobre Node.js ≥ 20.19.0 no `PATH`). Substituir `OpenSpec` → `BR-OpenSpec`.
- **Community Schemas** (`76c80f8`): nova seção em `docs/customization.md` (+ tabela `superpowers-bridge` de `@JiangWay`, **não traduzir** nomes/links) e entrada no `README.md`; replicar/traduzir em `docs/pt-BR/customization.md` e `README.pt-BR.md`. ⚠️ Garantir que o anchor PT (`#schemas-da-comunidade`) bata com o título traduzido.
- **migration-guide** (`053d8a5`): `docs/migration-guide.md` (linha 301) trocar descrição de `/opsx:sync` para "Merge delta specs into main specs"; em `docs/pt-BR/migration-guide.md` usar exatamente o texto PT já adotado em `commands.md`/`workflows.md` (ex.: "Mesclar specs de delta nas specs principais").
- **test/AGENTS.md** (`9e78bca`): arquivo **ausente** no fork → Decisão D4 (criar em inglês por paridade, com seção "Cross-Platform Paths", ou pular).

### C9 — CI: gate de changesets  *(T10)*
- `.github/workflows/ci.yml`: aplicar o *delta* do gate `has_changesets` (job "Validate Changesets" → "Validate Release Tracking", roda só quando há `.changeset/*.md` no PR). ⚠️ **Manter `node-version: '22'`** (upstream usa 20 nesse job). Não migrar para OIDC-only.
- `.changeset/README.md`: reescrita do fluxo "release path" (opt-in) → Decisão D5. Independente disso, corrigir referência stale `@fission-ai/openspec` → `@dynamicworks/br-openspec` (linha 27 do template).

### C10 — Correções de consistência (de passagem)  *(T12)*
- `CHANGELOG.md` linha 1: `# @fission-ai/openspec` → `# @dynamicworks/br-openspec` (correção pontual; o changelog-github só regrava entradas, não o header).
- `AGENTS.md` (linhas 5, 144, 146) e `DEPLOY.md` (122, 194): `@fkmatsuda/br-openspec` → `@dynamicworks/br-openspec` (nome stale; package real). Decisão D6.
- `README_OLD.md`: ainda usa `@fkmatsuda/br-openspec` → Decisão D6 (remover / atualizar / manter como histórico).
- `src/messages/index.ts:1478`: exemplo em prosa usa `### Requisito: <Nome>` (header traduzido que o parser **não** reconhece) → corrigir para `### Requirement:`. Decisão D7.

### C11 — Changeset da sincronização  *(T11)*
Criar `.changeset/sync-upstream-1-4-1.md` (`minor`). Junto ao `evil-cities-melt.md` pendente, o próximo Version PR salta **2.0.1 → 2.1.0** agregando ambos (Decisão D9 confirma minor).

⚠️ O texto lista **apenas** o que realmente entrou (Kimi/Mistral/sync + fixes). **Omitir** recursos do workspace beta (realpath de artefatos, view do workspace).

```markdown
---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec v1.4.1.

### Novos recursos
- **Suporte ao Mistral Vibe** — o `openspec init` configura o Mistral Vibe como
  ferramenta baseada em skills usando `.vibe/skills/`.
- **Workflow de sync no perfil padrão** — o perfil `core` agora inclui o workflow
  de sincronização, então novas instalações já geram as skills/comandos `/opsx:sync`.

### Correções
- **Cabeçalhos de requisito sem distinção de maiúsculas/minúsculas** — interpretados
  independentemente da capitalização, evitando falhas de parsing.
- **Conclusão de comandos no zsh com oh-my-zsh** — corrigida a instalação do tab
  completion sob o `compinit` do oh-my-zsh.
- **Resolução de caminhos de dados global** — separadores de caminho determinísticos
  por plataforma (Windows/POSIX).

### Outros
- **Dicas de validação mais claras** — quando um requisito tem SHALL/MUST apenas no
  cabeçalho, o `openspec validate` indica mover a palavra-chave para o corpo do requisito.
```

---

## 5. O que NÃO importar do versionamento upstream

- ❌ Commits `Version Packages` (`bc7ab266` #1023, `1b06fdd` #1166) — artefatos de release automatizado do upstream.
- ❌ `package.json` versão `1.4.1` / nome `@fission-ai/openspec` / repo Fission-AI.
- ❌ Append de CHANGELOG do upstream (`1.4.0`/`1.4.1`).
- ❌ Changesets já consumidos/deletados no upstream (`kind-rings-notice`, `mistral-vibe-and-fixes`, `sync-default-core`, `clarify-bun-node-runtime`, `neat-cameras-press`, etc.) — os recursos chegam **pelo código**, não pelo `.md`.
- ❌ `.changeset/config.json` do upstream (manter `repo` do fork).

---

## 6. Verificações necessárias (antes/durante)

1. ~~**`src/core/change-metadata/index.ts` / `src/utils/change-metadata.ts`**~~ — ✅ **RESOLVIDO: SKIP.** Tocados apenas pelos commits de workspace (`fd92ccc`, `8498042`). A mudança move `ChangeMetadataSchema` para um novo módulo criado pelo context-store e adiciona parâmetros opcionais (`projectRootOverride`, `options.metadata`) a `resolveSchemaForChange` usados só pelo fluxo workspace (aditivos/retrocompatíveis). O fluxo repo-local do fork continua funcionando sem eles — nada a trazer.
2. Nenhum teste fixa **contagem** de tools (`AI_TOOLS.length`) — confirmar antes de adicionar `vibe` (grep não achou em `available-tools.test.ts`; checar os demais).
3. Call-sites de `getGlobalDataDir` (C4) — confirmar retrocompatibilidade.
4. Texto exato já usado para `/opsx:sync` em `docs/pt-BR/commands.md` e `docs/pt-BR/workflows.md` — reutilizar no migration-guide (C8) para consistência.

---

## 7. Pendências do Kimi (já implementado no fork)

O fork já tem Kimi (`35df165`, label **"Kimi Code CLI"**). Resíduos opcionais do upstream:
- `openspec/specs/ai-tool-paths/spec.md` e `openspec/specs/cli-init/spec.md`: cenários adapterless/Kimi (specs mantidos em EN). Aplicáveis, mas o literal do spec `Commands skipped for: <id> (no adapter)` diverge da mensagem real PT-BR do fork. → tratar junto de Decisão D1.
- `docs/*supported-tools.md` do fork mencionam `/flow:openspec-*` para o Kimi — forma não confirmada pelo design upstream (só `/skill:<name>`). → Decisão D10 (remover se impreciso).
- Teste adapterless em `test/core/init.test.ts`: se portado, adaptar asserções ao texto PT-BR (`'Comandos ignorados para: kimi'`, `'sem adaptador'`).

---

## 8. Decisões (CONFIRMADAS em 2026-06-19)

| # | Decisão | Resolução final |
|---|---------|-----------------|
| D1 | Label do Kimi | ✔️ **Alinhar a `'Kimi CLI'` (upstream)** — renomear `'Kimi Code CLI'` → `'Kimi CLI'` em config, docs EN+PT e testes |
| D2 | Reordenar `lingma` alfabeticamente | ✔️ Sim (default) |
| D3 | Recomendação de modelos | ✔️ **Codex 5.5 e Opus 4.8** (Opus já está na 4.8, não 4.7) |
| D4 | Criar `test/AGENTS.md` | ✔️ Sim, em inglês (default) |
| D5 | Fluxo "release path" opt-in | ✔️ Não adotar; só corrigir nome do pacote no template (default) |
| D6 | `@fkmatsuda/br-openspec` stale | ✔️ **Corrigir** AGENTS.md + DEPLOY.md; **remover** README_OLD.md |
| D7 | `### Requisito:` → `### Requirement:` em `messages:1478` | ✔️ Sim (default) |
| D8 | Validador aceitar DEVE/DEVERÁ | ✔️ Não nesta sync — manter SHALL/MUST (default) |
| D9 | Bump | ✔️ **minor → 2.1.0** |
| D10 | Remover `/flow:openspec-*` dos docs do Kimi | ✔️ Sim, se impreciso (default) |

---

## 9. Lista de SKIP (workspace beta — NÃO trazer)

Código: `src/core/workspace/**`, `src/core/context-store/**`, `src/core/planning-home.ts`, `src/commands/workspace/**` (e árvore context-store/initiative), dep `cross-spawn`. Também o refactor de `src/utils/change-metadata.ts`/`change-utils.ts` e o novo módulo `src/core/change-metadata/index.ts` (parâmetros `projectRootOverride`/`options.metadata` em `resolveSchemaForChange`) — acoplado ao workspace, ver §6.1.
Templates: edições do upstream em `src/core/templates/workflows/*.ts` que referenciam `actionContext.mode = workspace-planning`, `planningHome.changesDir`, `artifactPaths.*.existingOutputPaths`, `allowedEditRoots` (commits `435458b`, `7c3accc`, `8498042`, `fd92ccc`, etc.).
Docs: seções workspace/context-store/initiative de `docs/cli.md` (~390 linhas) e `docs/concepts.md` (~144 linhas).
Specs/changes: todo `openspec/changes/**` e `openspec/specs/**` de workspace/context-store/initiative/collections/foundation/registry/legacy-state/open-surface.
Tests: `test/**` de workspace/context-store/initiative/collections/planning-home/foundation (`workspace.test.ts`, `context-store.test.ts`, `initiative.test.ts`, etc.) e a edição de `test/commands/artifact-workflow.test.ts` (`e441287`).
Versionamento: commits `Version Packages`, changesets consumidos, `.changeset/config.json` do upstream.

---

## 10. Validação final

Ao concluir todos os commits:
1. `pnpm install` (sem alterar lockfiles do fork além do necessário).
2. `node build.js` (build TS).
3. `pnpm run lint` (eslint `src/`).
4. `pnpm test` (vitest) — atenção especial aos testes adaptados para PT-BR.
5. Smoke manual: `node bin/openspec.js init --tools vibe` (gera `.vibe/skills/`), `--tools kimi`, e `openspec update` num perfil custom antigo (mensagem da nota PT-BR).
6. Revisar `git diff` procurando reintroduções acidentais de inglês ou de `@fission-ai/openspec`/`1.4.1`.

---

## 11. Próximos passos

1. Você revisa este plano e responde as **Decisões D1–D10** (§8) e as **Verificações** (§6, em especial a #1 sobre `change-metadata`).
2. Com as decisões, executo os commits C1–C11 em ordem (ou no agrupamento que preferir), traduzindo conforme §4.
3. Você revisa o diff e abre o PR (não faço push sem sua autorização).
4. Sincronização do **subsistema workspace beta** fica planejada como esforço dedicado posterior.

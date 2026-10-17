# Relatório — Lote LE (Infra, deps e CI)

**Commit:** `2679debe9f85f7640493957f84b4f2a0a353fc74`
**Branch:** `sync/upstream_20260901`
**Título:** `chore(deps): portar migração do inquirer v8, overrides de segurança e bumps de CI do upstream v1.8.0–v1.11.0`

**Validação:** `pnpm exec tsc --noEmit` OK · `node build.js` OK · `pnpm lint` OK ·
`pnpm exec vitest run --exclude test/core/templates/skill-templates-parity.test.ts --exclude test/core/templates/skillssh-parity.test.ts` → **105 arquivos / 3461 testes passando**.

---

## 1. Commits portados

| Hash | Título | Situação |
|---|---|---|
| `91813641` | chore(deps): migrate to @inquirer/prompts v8 + @inquirer/core v11 (#1667) | **portado (adaptado)** — core em `^12.0.1` (D11'), `instructions` substituída por `theme.style.keysHelpTip` PT-BR |
| `02b124e6` | fix(security): patch fast-uri, postcss, and brace-expansion advisories (#1510) | **parcial** — só os hunks de infra (overrides, permissões por job) |
| `3e50944f` | fix(build): allow esbuild install scripts (#1196) | **portado (adaptado)** — sem os hunks de website |
| `3281f1f0` | fix(deps): patch js-yaml and nanoid advisories via pnpm overrides (#1635) | **portado (adaptado)** — cabeçalho do dependabot sem "root and website" |
| `89169627` | ci: bump pnpm/action-setup in the github-actions group (#1618) | **no-op** — fork usa tag `@v6` (decisão `cb35ff8`) |
| `d7893184` | ci: bump dorny/paths-filter in the github-actions group (#1678) | **no-op** — fork usa tag `@v4` |
| `144901ca` | chore(dependabot): ignore unsupported major updates (#1623) | **portado (adaptado)** — só o ecossistema npm da raiz |
| `23c27877` | chore(deps-dev): bump eslint 10.7.0→10.8.0 (#1494) | **coberto** por `pnpm update` (lockfile) |
| `4b114aad` | chore(deps-dev): bump development-dependencies group (#1633) | **coberto** por `pnpm update` (lockfile) |
| `c0c50f9a` | chore(deps-dev): bump the development-dependencies group with 2 updates (#1718) | **coberto** por `pnpm update` (lockfile) |

---

## 2. Arquivos alterados (15)

| Arquivo | O que mudou |
|---|---|
| `package.json` | `@inquirer/core ^10.3.2 → ^12.0.1`; `@inquirer/prompts ^7.10.1 → ^8.5.2`; `cross-spawn ^7.0.6 → 7.0.6` (pin exato, paridade upstream); bloco `pnpm` ganha `onlyBuiltDependencies: ["esbuild"]` e os 5 overrides do upstream |
| `pnpm-workspace.yaml` | reescrito **verbatim** do upstream (`diff` contra `upstream/main` vazio): `packages: ['.']`, `allowBuilds: esbuild@0.28.1: true`, `overrides` com os comentários de advisory. `onlyBuiltDependencies` saiu do YAML |
| `pnpm-lock.yaml` | regenerado com `pnpm install` (nunca importado do upstream) + `pnpm update eslint typescript-eslint smol-toml` |
| `flake.nix` | `./pnpm-workspace.yaml` no fileset (após `./pnpm-lock.yaml`). **Hash `pnpmDeps` NÃO recomputado** — ver §7 |
| `.github/workflows/ci.yml` | `- 'pnpm-workspace.yaml'` no filtro `nix` |
| `.github/workflows/security.yml` | `- 'pnpm-workspace.yaml'` nos paths de `push` (estilo do fork, sem glob `**/`) |
| `.github/workflows/release-prepare.yml` | topo perde `pull-requests: write` (+ comentário explicando o piso); job `prepare` ganha bloco `permissions` com `contents/pull-requests/id-token: write`; comentário órfão "Generate GitHub App token first…" removido (L24); comentário do `id-token` corrigido para "npm provenance (NPM_CONFIG_PROVENANCE)" — o fork publica com `NPM_TOKEN`, não OIDC |
| `.github/dependabot.yml` | cabeçalho documentando as duas superfícies não gerenciadas (overrides + flake) e bloco `ignore` de majors de `@types/node`/`typescript` |
| `src/commands/config.ts` | remove `instructions:`; adiciona `theme.style.keysHelpTip: ptBrKeysHelpTip` + comentário PT-BR; import novo |
| `src/commands/schema.ts` | mesmo `theme.style.keysHelpTip` no checkbox de artifacts do `openspec schema init` (antes mostrava a dica padrão em inglês) |
| `src/messages/index.ts` | 4 chaves novas em `PROMPT_MESSAGES` (§3) |
| `src/prompts/keys-help-tip.ts` | **novo (fork-only)** — `ptBrKeysHelpTip(keys)` |
| `test/pnpm-workspace-config.test.ts` | **novo** (do upstream, adaptado) |
| `test/prompts/keys-help-tip.test.ts` | **novo (fork-only)** — 3 casos |
| `test/commands/config-profile.test.ts` | asserção do `theme` adaptada (§5) |

---

## 3. Strings adicionadas ao catálogo

Seção **`PROMPT_MESSAGES`** (`src/messages/index.ts`), com comentário explicativo:

| Chave | Valor |
|---|---|
| `keySpace` | `'espaço'` |
| `keyActionSelect` | `'selecionar'` |
| `keyActionAll` | `'todos'` |
| `keyActionInvert` | `'inverter'` |

**D31 cumprida:** as ações `navigate` e `submit` **reutilizam** `PROMPT_MESSAGES.navigate` (`'navegar'`) e
`PROMPT_MESSAGES.confirm` (`'confirmar'`) — nenhuma chave `keyActionNavigate`/`keyActionSubmit` foi criada.
O comentário de seção do catálogo foi estendido para citar `src/prompts/keys-help-tip.ts`.

**D28 cumprida:** `CONFIG_MESSAGES.spaceToToggle` (`'Espaço para alternar, Enter para confirmar'`,
`src/messages/index.ts:725`) **foi mantida**, ainda que agora órfã (nenhum uso em `src/` ou `test/`).
Registrada aqui como pendência de limpeza para o fechamento, junto com as demais chaves órfãs.

**Resultado na tela** (verificado contra o `dist/` compilado):
`↑↓ navegar • espaço selecionar • a todos • i inverter • ⏎ confirmar`
— formato idêntico ao padrão do `@inquirer/checkbox@5.2.3` (`bold(tecla) dim(ação)` unidos por `dim(' • ')`).

---

## 4. Decisão D11' — `@inquirer/core@^12.0.1`

Confirmado por consulta ao registry em 2026-09-02:

- `@inquirer/prompts@^8.5.2` resolve para **8.7.0** → `@inquirer/checkbox@^5.2.3` → **`@inquirer/core@^12.0.1`**;
- última versão de core é **12.0.1** (não existe 12.1+).

Usar `^11.2.1` (texto literal do upstream) recriaria as **duas cópias de core** que `91813641` queria eliminar.
Com `^12.0.1`, `pnpm why @inquirer/core` mostra **uma única versão (12.0.1)**.

Compatibilidade verificada: os únicos consumidores de `@inquirer/core` no fork são
`src/prompts/searchable-multi-select.ts` (`createPrompt, useState, useKeypress, useMemo, usePrefix, isEnterKey,
isBackspaceKey, isUpKey, isDownKey`) e `src/ui/welcome-screen.ts` (`createPrompt, isEnterKey, useKeypress`);
nenhuma API mudou, e `useState` guarda só `string`/`string[]`/`number`/`'idle'|'done'`/`string|null`
(a única breaking change do core 12 é o setter aceitar reducer). `tsc --noEmit` limpo.

**Divergência aceita vs. upstream:** a linha `"@inquirer/core": "^12.0.1"` (upstream: `^11.2.1`) é a única
diferença nova no `package.json`. `diff <(git show upstream/main:package.json) package.json` mostra apenas:
`name`, `version`, `homepage`, `repository.url`, `author`, `files["scripts/postinstall.js"]`,
`dev:cli`/`prepare`/`prepublishOnly` (`node build.js`), `test:postinstall`/`postinstall`,
`@vitest/coverage-v8`, `@inquirer/core` e a ausência de `diff` (chega no Lote F). Nada além disso.

---

## 5. Testes

| Teste | Ação |
|---|---|
| `test/pnpm-workspace-config.test.ts` | **portado do upstream com 2 adaptações**: (1) removido `it('keeps the website as an independently locked project')` — o fork não tem `website/`; (2) `expect(security).toContain("- '**/pnpm-workspace.yaml'")` → `"- 'pnpm-workspace.yaml'"` (o `security.yml` do fork usa paths sem glob). O primeiro `it` ficou **intacto** e guarda as quatro superfícies (workspace/package.json/lockfile/esbuild) |
| `test/commands/config-profile.test.ts` | `expect(checkboxCall.theme).toEqual({icon:{…}})` (estrito, quebraria com o `style` novo) → `expect(checkboxCall).not.toHaveProperty('instructions')` + `expect(checkboxCall.theme.icon).toEqual({…})` + `expect(typeof …theme.style.keysHelpTip).toBe('function')` + `…keysHelpTip([['space','select'],['⏎','submit']])` contendo `'espaço'`. **Só asserções — lógica intacta** |
| `test/prompts/keys-help-tip.test.ts` | **novo (fork-only)**: 3 casos — mapa completo do checkbox, tecla/ação desconhecidas passando sem tradução, par do `select` |
| `test/prompts/searchable-multi-select.test.ts`, `test/ui/welcome-screen.test.ts` | não tocados (mockam `@inquirer/core` inteiro) |
| testes que mockam `@inquirer/prompts` | não tocados (API `select/checkbox/confirm/input` inalterada no v8) |

Nenhum teste do upstream foi pulado por dependência de stores neste lote.

---

## 6. Hunks pulados (com motivo)

| Commit | Hunk | Motivo |
|---|---|---|
| `02b124e6` | `website/package.json`, `website/pnpm-lock.yaml` (override `fast-uri`) | fork sem `website/` (D2). `fast-uri` só existe na árvore do site — override **não** replicado na raiz |
| `02b124e6` | job `website-lockfile` ("Website Lockfile Drift") em `security.yml` | idem (instrução explícita do orquestrador) |
| `02b124e6` | 7 comentários CodeQL em `src/core/archive.ts` | pertence ao lote de archive (`LA-02b124e6-archive.md`) |
| `02b124e6` | contexto do job `beta` / `workflow_dispatch` / `Generate GitHub App Token` em `release-prepare.yml` | o fork não tem esses elementos (D12: não migrar para OIDC-only, preservar `NPM_TOKEN`) |
| `3e50944f` | `website/package.json`, `website/pnpm-workspace.yaml` | D2 |
| `3e50944f` | `it('keeps the website as an independently locked project')` | D2 |
| `3281f1f0` | `website/*` e o trecho "root and website" do cabeçalho do dependabot | D2 — cabeçalho adaptado para a raiz |
| `144901ca` | segundo bloco `ignore` (ecossistema `/website`) | D2 |
| `89169627`, `d7893184` | SHAs de `pnpm/action-setup` / `dorny/paths-filter` | o fork usa tags flutuantes (`@v6`, `@v4`) por decisão de `cb35ff8` — no-op |
| todos | `hash` de `pnpmDeps` em `flake.nix` | o hash do upstream nunca serve; recomputação uma única vez no fechamento (D11) — ver §7 |
| todos | `pnpm-lock.yaml` do upstream | regenerado localmente |
| todos | `CHANGELOG.md`, `.changeset/*.md`, `name`/`version` do `package.json` | invariantes do fork |

---

## 7. AVISO — `flake.nix` com hash defasado

O `pnpm-lock.yaml` **mudou** (inquirer v8/core 12, os 5 overrides, e os bumps de eslint 10.8.0→10.9.1,
typescript-eslint 8.65.0→8.69.0, smol-toml 1.7.1→1.8.0). O hash fixo `pnpmDeps` em `flake.nix:55`
(`sha256-4828DWBXLORtkgaOXSUq+NWQEGBOys/4EXMjjcP5CUg=`) **não foi recomputado**, conforme instrução do
orquestrador (fica para o fechamento, que roda `scripts/update-flake.sh` uma única vez).

**Consequência:** até o item 16, `nix build` falha com hash mismatch e o job `nix-flake-validate` do CI
fica vermelho em qualquer PR que toque `package.json`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`/`flake.nix`
(o filtro `nix` do `ci.yml` agora também dispara com `pnpm-workspace.yaml`).

---

## 8. Estado do lockfile e do audit

- `pnpm install` → exit 0, sem `ERR_PNPM_*`; `pnpm install --frozen-lockfile` em seguida → exit 0.
- Bloco `overrides:` do lock com as **5 entradas** idênticas a `package.json` e a `pnpm-workspace.yaml`
  (o teste novo garante a igualdade profunda das três superfícies).
- Resoluções: `js-yaml@3.15.2` e `@4.3.2`, `nanoid@3.3.18`, `postcss@8.5.25`, `brace-expansion@5.0.9`,
  `cross-spawn@7.0.6`, **um único** `esbuild@0.28.1`, `@inquirer/prompts@8.7.0`, `@inquirer/checkbox@5.2.3`,
  `@inquirer/select@5.2.3`, **um único** `@inquirer/core@12.0.1`.
- `pnpm audit --audit-level high` → **limpo** (antes: 3 advisories high — js-yaml ×2, nanoid).
- `pnpm audit` (qualquer severidade) → **1 moderate pré-existente e alheio a este lote**:
  GHSA-p498-v437-472g em `@humanfs/node@0.16.7`, puxado por `eslint`. Já estava no lockfile anterior
  (`git show HEAD~1:pnpm-lock.yaml` contém `@humanfs/node@0.16.7`) e não é bloqueante — o step
  "Audit build and test tooling" do `security.yml` roda com `--audit-level high`.
- `pnpm update eslint typescript-eslint smol-toml` (para cobrir `23c27877`/`4b114aad`/`c0c50f9a`) **alterou
  os ranges do `package.json`** (comportamento do pnpm 9). Os três ranges foram **restaurados** aos valores
  do upstream (`^10.5.0`, `^8.65.0`, `^1.7.1`) e o `pnpm install` seguinte manteve as versões resolvidas
  novas no lockfile — ou seja, `package.json` ficou inalterado por esse comando, como o brief exige.

---

## 9. Hunks de docs pendentes para o lote de docs

**Nenhum.** Verificado commit a commit: os 10 commits deste lote não tocam `docs/`, `docs/pt-BR/`,
`schemas/`, `openspec/specs/`, `README.md` nem `README.pt-BR.md`.
`scripts/README.md` já documenta `update-flake.sh` — sem mudança.

---

## 10. Divergências entre o brief e o código real

1. **Brief §4 / §Apêndice C** propunha 6 chaves novas (`keyActionNavigate`, `keyActionSubmit` inclusas) e a
   **remoção** de `CONFIG_MESSAGES.spaceToToggle`. As decisões D31/D28 do orquestrador prevalecem: 4 chaves
   novas (reutilizando `navigate`/`confirm`) e a chave órfã mantida. Aplicado assim.
2. **Brief §1/§Apêndice A** citava `@inquirer/core ^11.2.1` como paridade literal; D11' manda `^12.0.1`.
   Aplicado `^12.0.1` (confirmado pelo registry — ver §4).
3. **Brief §5.2** sugeria assertar a string exata com `chalk.bold/dim`; usei `toContain('espaço')` no
   `config-profile.test.ts` (o próprio brief admite a alternativa) e deixei a asserção exata no teste
   dedicado `keys-help-tip.test.ts`, que remove os códigos ANSI antes de comparar.
4. **Brief §Apêndice D** escreve o comentário do `id-token` como "Required for npm provenance
   (NPM_CONFIG_PROVENANCE)"; o fork tinha "Required for npm OIDC trusted publishing" (herdado do upstream,
   mas incorreto para o fork, que publica com `NPM_TOKEN`). Corrigido nas duas ocorrências.
5. **Brief §9** esperava `js-yaml@3.15.1`/`@4.3.1` e `eslint@10.8.1`/`typescript-eslint@8.67.0`;
   as versões publicadas hoje resolvem para `3.15.2`/`4.3.2` e `10.9.1`/`8.69.0`. Dentro dos ranges e dos
   seletores de override — sem ação.

---

## 11. Dúvidas / pendências em aberto

1. **Hash do flake (bloqueante para o CI até o fechamento)** — `scripts/update-flake.sh` precisa rodar uma
   vez no item 16, com `nix` no PATH. Sem isso `nix build` falha e `nix-flake-validate` fica vermelho.
2. **Chaves órfãs (D28)** — `CONFIG_MESSAGES.spaceToToggle` ficou sem uso. Definir no fechamento a política
   (remover em commit de limpeza? manter?) e aplicar ao conjunto de órfãs do repositório de uma vez.
3. **Follow-up de i18n (§8.6 do brief)** — os ~12 `select()` de `src/` e os `confirm()` continuam mostrando
   a dica de teclas padrão em inglês (`↑↓ navigate • ⏎ submit`). `ptBrKeysHelpTip` já serve para eles
   (o `@inquirer/select@5` chama `theme.style.keysHelpTip([['↑↓','navigate'],['⏎','submit']])`); é uma
   dívida **pré-existente**, não uma regressão deste lote. Sugestão: PR própria pós-sync.
4. **`@humanfs/node@0.16.7` (moderate, pré-existente)** — resolve sozinho quando o `eslint` publicar uma
   versão que puxe `@humanfs/node >= 0.16.8`. Não vale um override agora (dev-only, moderate, e o upstream
   também não tem).
5. **`flake.nix` `meta.homepage`** aponta para `https://github.com/fkmatsuda/BR-OpenSpec` enquanto o
   `package.json` diz `dynamicworks-com-br/BR-OpenSpec` (dívida pré-existente, §8.8 do brief — fora do
   escopo deste lote, registrar no fechamento).
6. **`flake.nix` fileset** não inclui `./vitest.env-setup.ts` (arquivo próprio do fork). Não afeta este lote
   (o build do Nix não roda a suíte), mas se algum dia o derivation rodar os testes vai faltar. Fora de escopo.

---

## Revisão rodada 1

Commit do lote reescrito por `git commit --amend --no-edit`:
`2679debe9f85f7640493957f84b4f2a0a353fc74` → **`482e1bbbb20d26d5f9cda1b0e40bd880ffdb9644`**
(mensagem, autoria e trailers preservados; branch não publicada).

### Corrigido

**[importante] i18n — a tecla espaço mudou de `alternar` para `selecionar` no mesmo comando**
(`src/prompts/keys-help-tip.ts`, achado procedente e confirmado no código)

Evidência verificada antes de corrigir:

- `git show 2679deb -- src/commands/config.ts` mostra que o porte trocou
  `instructions: CONFIG_MESSAGES.spaceToToggle` (`'Espaço para alternar, Enter para confirmar'`,
  `src/messages/index.ts:725`) pelo `keysHelpTip`, que renderizava `espaço selecionar` — ou seja,
  o termo exibido pelo `openspec config profile` para a tecla espaço mudou dentro deste lote.
- `src/prompts/searchable-multi-select.ts:156` já renderiza `Space` + `PROMPT_MESSAGES.toggle`
  (`'alternar'`, `src/messages/index.ts:1047`) para a mesma tecla numa multi-seleção — duas telas do
  mesmo CLI descreviam a tecla espaço de formas divergentes.
- `grep -rn keyActionSelect src test docs` → só duas ocorrências (a definição e o único consumidor),
  logo a troca é local e segura.

Correção aplicada (caminho sugerido pelo revisor, coerente com D31 "reutilizar chaves existentes,
sem duplicar"):

- `src/prompts/keys-help-tip.ts` — `select: PROMPT_MESSAGES.keyActionSelect` → `select: PROMPT_MESSAGES.toggle`;
  o comentário do `ACTION_LABELS` passa a registrar que `navigate`/`select`/`submit` reaproveitam as chaves
  do prompt de seleção múltipla, para a tecla espaço continuar como `alternar` em todas as telas.
- `src/messages/index.ts` — removida a chave `keyActionSelect` (`'selecionar'`), que ficaria órfã, e o
  comentário do bloco atualizado. **Não conflita com D28**: a chave nasceu neste mesmo commit
  (não publicado) e some junto com ele no amend; D28/I1 protege chaves que o fork já expunha —
  `CONFIG_MESSAGES.spaceToToggle` continua mantida, como antes.
- `test/prompts/keys-help-tip.test.ts` — caso 1: `'↑↓ navegar • espaço selecionar • …'` →
  `'↑↓ navegar • espaço alternar • a todos • i inverter • ⏎ confirmar'`.
- `test/commands/config-profile.test.ts` — a chamada de `keysHelpTip` passa a ficar numa variável e ganha
  `expect(keysHelpTip).toContain('alternar')` ao lado do `toContain('espaço')` já existente, para travar o
  termo escolhido nessa superfície. Nenhuma lógica de teste alterada; só asserção de string.

Smoke do helper compilado (`dist/prompts/keys-help-tip.js`, ANSI removido):

```
CHECKBOX: ↑↓ navegar • espaço alternar • a todos • i inverter • ⏎ confirmar
SELECT  : ↑↓ navegar • ⏎ confirmar
```

Convenção do rótulo da tecla mantida em `espaço` (minúsculo, traduzido): é o formato do próprio
`keysHelpTip` do inquirer e o que a string substituída já fazia (`'Espaço para alternar…'`).
O `Space` em inglês de `searchable-multi-select.ts` é outra superfície, própria do fork, com os nomes de
tecla em ciano e capitalizados — não foi tocada (fora do escopo do lote e sem regressão).

### Rejeitado

Nenhum. O único achado da rodada procede e foi corrigido.

### Validação (pós-correção)

| Passo | Resultado |
| --- | --- |
| `pnpm exec tsc --noEmit` | verde |
| `node build.js` | verde (`✅ Build completed successfully!`) |
| `pnpm exec vitest run --exclude …parity…` | **105 arquivos / 3461 testes, verde** |

Observação: na primeira execução da suíte, `test/commands/spec.test.ts > should validate with strict mode`
estourou o `testTimeout` de 10 s sob carga paralela; roda em ~1,2 s isolada e a re-execução completa ficou
verde (3461/3461). Flakiness pré-existente de um teste que dispara a CLI em subprocesso — não relacionada a
este lote.

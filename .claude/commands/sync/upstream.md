---
description: Sincroniza ESTE repositório (BR-OpenSpec) com o upstream Fission-AI/OpenSpec, portando e traduzindo o código estável para PT-BR. Uso exclusivo de manutenção — não é publicado no npm.
---

Você vai sincronizar o fork **BR-OpenSpec** com o repositório **upstream** (Fission-AI/OpenSpec), trazendo apenas o **código estável** e traduzindo o que for exibido ao usuário para PT-BR, **sem perder as customizações do fork**.

Argumentos (opcionais): `$ARGUMENTS` — por exemplo, uma versão-alvo do upstream ou instruções específicas.

## Princípio central

**NÃO faça `git merge upstream/main`.** A divergência (i18n centralizado, rename, identidade npm, docs bilíngues) geraria conflitos massivos e reintroduziria inglês. A sincronização é um **porte temático arquivo-a-arquivo**: para cada mudança do upstream, identifique o alvo no fork, preserve a adaptação PT-BR e **some** a melhoria de comportamento.

Leia primeiro `AGENTS.md` (seções **"Upstream Sync Strategy"**, **"Reserved English Terms (Never Translate)"** e os invariantes) e, se existir, o plano da última sincronização (ex.: `PLANO-sync-upstream-*.md`).

## Passos

1. **Veja o que há de novo.** Rode o helper, que lê o marcador `.upstream-sync.json` (ponto de partida), busca o upstream e classifica os commits novos:
   ```bash
   node scripts/upstream-sync-status.mjs
   ```
   Ele lista cada commit como **STABLE** (Bloco A — portar) ou **WORKSPACE** (subsistema beta — **adiar**).

2. **Crie a branch de sync:** `git checkout -b sync/upstream_<AAAAMMDD>` a partir de `main`.

3. **Planeje por tema.** Agrupe os commits STABLE por tema (correções, integrações de ferramentas, perfis, docs…). Ignore TODOS os commits/arquivos WORKSPACE (caminhos com `workspace`, `context-store`, `initiative`, `planning-home`, `foundation`, `registry`, `legacy-state`, `open-surface`, `collections`). Alguns commits do upstream misturam os dois — traga só a parte estável.

4. **Para cada tema, porte com tradução**, respeitando os invariantes (em conflito, vence o fork):
   - **Strings ao usuário** → catálogo central `src/messages/index.ts`, em PT-BR. Nunca deixe inglês ao usuário; nunca sobrescreva PT-BR existente — só adicione chaves.
   - **Termos reservados** (RFC 2119 — MUST/SHALL/SHOULD/MAY… — e marcadores `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, `WHEN/THEN/AND/GIVEN/ELSE`, `FROM/TO`) ficam SEMPRE em inglês/caixa alta. Ver a nota no topo de `src/messages/index.ts`.
   - **Identidade**: preserve `@dynamicworks/br-openspec`, a versão própria (NÃO aceite a do upstream), repo `dynamicworks-com-br/BR-OpenSpec`, Node 22, `NPM_TOKEN`, `flake.nix`, e os workflows próprios (`code-review`).
   - **Docs bilíngues**: aplique em `docs/` (espelho EN) **e** traduza em `docs/pt-BR/`.
   - **Testes**: adapte apenas asserções de string ao PT-BR; nunca a lógica. Se um teste de hash dourado (ex.: `skill-templates-parity`) acusar mudança deliberada de template, recompute e atualize o hash.
   - Faça **um commit por tema**, em português, no padrão Conventional Commits.

5. **Versionamento (changesets).** NÃO importe os "Version Packages" nem o CHANGELOG do upstream. Crie um changeset do fork em `.changeset/` (tipo `minor` para novos recursos), com texto PT-BR descrevendo apenas o que entrou de fato.

6. **Valide tudo:**
   ```bash
   node build.js && pnpm run lint && pnpm test
   ```
   E um smoke real quando fizer sentido (ex.: `node bin/openspec.js init --tools <nova-ferramenta>`).

7. **Atualize o marcador e a tag.** Edite `.upstream-sync.json`: `lastSyncedCommit`/`lastSyncedVersion`/`lastSyncedDate` para o novo tip do upstream, e **acrescente** uma entrada em `history` (from/to, branch, escopo, plano). Crie a tag:
   ```bash
   git tag synced/upstream-<versão>
   ```
   (Comite o marcador. O push da branch/tag e a abertura do PR ficam por conta do mantenedor — confirme antes.)

## Saída esperada

Ao final, relate: commits STABLE portados (e quais WORKSPACE foram adiados), traduções adicionadas ao catálogo, resultado de build/lint/testes, e o novo ponto registrado em `.upstream-sync.json` + tag.

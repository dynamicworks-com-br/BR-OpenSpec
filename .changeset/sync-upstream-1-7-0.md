---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec (pós-v1.6.0 `596d6ba7` → pós-v1.7.0 `45cca5db`).

### Novos recursos

- **`skip_specs` para alterações sem deltas** — uma alteração que declara `skip_specs: true` nos metadados (`.openspec.yaml`) é aceita pelo `validate` mesmo sem specs de delta; o status marca os artefatos de spec como `skipped` (`[~]`) e o `apply` não bloqueia neles.
- **Contexto de runtime e orientação por operação** — o `config.yaml` aceita `operations.apply`/`operations.archive` com `guidance` própria, e o `context`/`rules` do projeto é injetado nas instruções em runtime. Novo comando `openspec instructions archive` devolvendo contexto + orientação da operação.
- **Upgrade de CLI desatualizado no `openspec update`** — o update verifica o registry npm (uma request, sem cache, desligável com `OPENSPEC_NO_UPDATE_CHECK`) e oferece `npm install -g @dynamicworks/br-openspec@latest` quando há versão mais nova — apenas interativo, nunca em CI, com detecção de gerenciador (npm/pnpm/yarn/bun/volta) e recusa de downgrade https→http.
- **Alvo `agents` compartilhado** — `openspec init --tools agents` instala as skills em `.agents/skills/`, diretório compartilhado entre assistentes.
- **Devin Desktop (ex-Windsurf)** — a ferramenta foi renomeada seguindo o upstream (`.windsurf` → `.devin`); `init`/`update` migram o conteúdo legado (com consentimento no modo interativo) e `--tools windsurf` continua aceito como alias.
- **Zoo Code (ex-Roo Code)** — renomeação de exibição seguindo o upstream (id `roocode` e diretório `.roo` preservados).

### Correções

- **Archive** — specs principais novos herdam o `## Purpose` do delta; deltas `REMOVED` já sincronizados viram no-op (com aborto em caso de near-miss de nome); aviso antes de descartar nota/prosa absorvida por um requisito; erro não-interativo agora diz exatamente qual flag passar (ex.: `--yes`); verificação de cenários consciente de fences e multiplicidade; bulk archive honra "Cancelar", decide inclusão/exclusão por delta (`sync skipped`) e verifica os main specs antes de mover cada alteração.
- **Validação** — rejeita delta spec solto na raiz de `specs/`; reporta cenários que um `MODIFIED` descartaria ("scenario loss"), com paridade validate↔archive; aceita nomes de alteração com prefixo numérico e limita nomes a 200 caracteres; divisores (`---`) dentro de seções delta não viram mais requisitos fantasma; BOM UTF-8 tratado nos parsers.
- **Schema** — diretórios de schema symlinkados são resolvidos; `schema init --force` valida artefatos antes de sobrescrever; multi-select com marcadores de checkbox `[x]`/`[ ]`.
- **Templates de workflow** — archive não arquiva antes do sync de specs terminar (e `/opsx:sync` respeita subconjunto de deltas do caller); sem segundo prefixo de data em nomes já datados; sync-specs mostra o formato do main spec e MODIFIED carrega o requisito inteiro; explore lê `context`/`rules` do projeto; `propose` não pula mais o artefato `specs` (fecho transitivo de dependências); campo `instruction` do schema é autoritativo; auto-seleção da única alteração ativa; instruções neutras de perguntar ao usuário (sem nomes de ferramentas de um vendor só); `design.md` não repete a proposta.
- **Init/Onboarding** — ferramentas sem adapter de comando referenciam skills (`/openspec-*`, `/skill:openspec-*` no Kimi Code) em vez de comandos inexistentes; o welcome só anuncia slash commands que o perfil instala e respeita reduced-motion/`--no-animation`/`OPENSPEC_NO_ANIMATION`.
- **Update** — regenera arquivos de comando de ferramentas configuradas sem skills (detecção por fingerprint de conteúdo); migração e menu de upgrade legado usam a grafia de invocação correta por ferramenta.
- **Adapters** — escape consistente de frontmatter YAML em todos os adapters (incl. caracteres de controle como `\xHH`); referências a slash commands usam o nome que cada ferramenta registra (`@opsx-*` no Amazon Q, `$openspec-*` no Codex, `/opsx-*` hifenizado onde aplicável).
- **CLI** — `status` ordena artefatos pela declaração do schema (não alfabética); alterações são resolvidas pelo diretório (sem exigir `proposal.md`); sub-tarefas indentadas contam no progresso; `feedback` funciona em repositórios sem o rótulo `feedback`.
- **Telemetria** — evento de uso enviado por HTTP direto (timeout 1s, fire-and-forget), eliminando a dependência `posthog-node`.

### Segurança

- Novo `SECURITY.md` (PT-BR) com a política de segurança, `.github/dependabot.yml` e workflow `security.yml` (dependency-review em PRs + `pnpm audit` semanal).
- Guards contra chaves de prototype (`__proto__` etc.) em caminhos de `config set` (comparação literal, visível a análise estática).
- Override de `brace-expansion` e lockfile com **zero vulnerabilidades** no `pnpm audit`; testes migrados para temp dirs via `mkdtemp`.

### Documentação

- 4 novos schemas comunitários no catálogo (`customization.md`), seção "Instale com seu assistente de IA" (prompt de setup em 15 páginas), instruções de instalação via Deno, e docs de grafia de invocação por ferramenta — tudo em EN + PT-BR.

### Manutenção

- Deps: `eslint` 10, `typescript` 6, `ora` 9, `chalk` 5.6.2, `zod` 4.4.3, `@changesets` 2.31.1, `typescript-eslint` 8.65, `@types/node` realinhado ao floor Node 20.19, nova devDep `smol-toml`; `posthog-node` removido.
- CI: bumps de actions (checkout v7, setup-node v7, pnpm/action-setup v6, nix-installer v22); `flake.nix` passa a buildar com Node 22 (hash recomputado).
- Novo script `pnpm regen:parity-hashes` para regenerar os hashes dourados dos templates; testes e2e invocam o CLI sem shell.

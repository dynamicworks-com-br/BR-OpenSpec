# Dívidas registradas na sincronização de 2026-09-02 (upstream pós-v1.11.0)

Itens **fora do escopo** da sincronização (decisão D26 do `PLANO-sync-upstream-20260901.md`), levantados pelos executores e revisores dos lotes. Nenhum é regressão desta sync: ou são anteriores a ela, ou são consequência conhecida de um subsistema adiado.

## 1. Consequências dos subsistemas adiados

| # | Dívida | Origem | Impacto |
|---|---|---|---|
| 1.1 | **Registry de completions incompleto** — o `COMMAND_REGISTRY` do fork não tem as entradas `status`, `instructions`, `templates`, `schemas` e `new` (vieram de `fd92ccc`, stores), nem as flags `init --force/--profile`, `update --force` e `status --all`; e não há completion de nomes de schema (`7c3accc`). | stores adiado | `openspec status --all` e as flags citadas não são completáveis por shell. No Fish, `schema which\|validate\|fork <TAB>` deixou de sugerir arquivos inúteis e passou a não sugerir nada. Fechar com um porte cirúrgico (provider `getSchemaNames`, helper `__fish_openspec_schemas`, `case 'schema-name'` nos 4 geradores) — nada disso depende de stores. |
| 1.2 | **Sem contrato de falha JSON** (`failWithError` / null-shape) | stores adiado | Um agente que siga o `agent-contract.md` do upstream espera `{ changes: [], root: null }` em stdout quando `status --all --json` falha; no fork recebe stdout vazio, mensagem em stderr e exit 1. |
| 1.3 | `resolveSchemaForChange` devolve o `--schema` explícito **sem ler o metadata**, e `loadChangeContext` engole erros de metadata. | anterior à sync (pertence a `fd92ccc`) | Um `.openspec.yaml` com `schema:` desconhecido carrega silenciosamente como `spec-driven`; um `--schema` explícito "resgata" uma alteração com metadata quebrado. |
| 1.4 | `docs/agent-contract.md` não existe no fork. | D7 | Hunks de `a7353aea`, `83644286`, `137404b4`, `521ee33e` e `afea111c` para essa página ficam permanentemente fora; a varredura de docs sempre reporta lacuna ali. |

## 2. Paridade de ferramentas com o upstream

| # | Dívida | Impacto |
|---|---|---|
| 2.1 | O fork não tem em `src/core/config.ts`: **CodeArts** (`codeartsagent`), **Hermes**, **Oh My Pi** (`oh-my-pi`) e **ZCode** (`zcode`); e não tem adapter de comando para **Trae**. | Lacuna anterior a `596d6ba7`, reconfirmada. As listas de ferramentas em `docs/supported-tools.md` seguem o `AI_TOOLS` do fork, então docs e código estão coerentes entre si — mas defasados em relação ao upstream. Fechar é um lote de **código**, não de docs. |

## 3. Catálogo de mensagens

| # | Dívida | Impacto |
|---|---|---|
| 3.1 | **Chaves órfãs** acumuladas: `CONFIG_MESSAGES.spaceToToggle`, `SCHEMA_MESSAGES.removingExistingSchema`, `INIT_MESSAGES.startFirstChangeWithSkill`, `WORKFLOW_MESSAGES.allArtifactsComplete`. | Mantidas por D28 (o invariante do fork é "só adicionar chaves"). Vale um commit único de limpeza, com política escrita, depois desta sync. |
| 3.2 | Mensagens do **Zod em inglês** em `src/core/artifact-graph/types.ts` (ex.: `At least one artifact required`, `Version must be a positive integer`). Aparecem ao usuário dentro de `Esquema inválido em '…': Schema inválido: artifacts: …`. | Anterior à sync. Mover para o catálogo exige ajustar os testes que casam o texto em inglês. |
| 3.3 | `ONBOARD_TEMPLATE_MESSAGES` traduz cabeçalhos de scaffold no rascunho da proposta (`### Novas Capabilities`, `### Capabilities Modificadas`, `## Impacto`), divergindo da regra "Reserved English Terms" de `AGENTS.md`. | Anterior à sync. |
| 3.4 | `docs/pt-BR/cli.md` mostra `Mudança: add-dark-mode` na transcrição de `status`, mas a CLI imprime `Alteração:` (`WORKFLOW_MESSAGES.changeLabel`). | Cosmético; a transcrição não corresponde à saída real. |
| 3.5 | `ARCHIVE_MESSAGES.skipValidationWarning` já termina em `(s/N)` e o prompt acrescenta `(y/N)`, produzindo `… Continuar? (s/N) (y/N)`. | Aceitar `s` criaria divergência entre TTY e pipe. Fechar removendo o `(s/N)` da chave ou customizando o tema do `@inquirer`. |
| 3.6 | Inconsistência `placeholder TBD` (em `sync-specs.ts`) × `A definir` (o que o archive realmente grava). | O detector de placeholder cobre as duas formas; só o texto do template está desatualizado. |
| 3.7 | Terminologia `completions` (docs) × `autocomplete do shell` (catálogo do CLI). | Escolher um termo. |

## 4. Comportamentos observados, sem correção nesta sync

| # | Dívida | Impacto |
|---|---|---|
| 4.1 | `.openspec-archive.lock` e `.openspec-move-<uuid>` não são filtrados explicitamente por `selectChange`/`list`. | Hoje o filtro `isDirectory() && !startsWith('.')` cobre implicitamente. Um `.openspec-move-*` órfão (crash no meio do fallback de move) apareceria como alteração. Mesmo comportamento do upstream. |
| 4.2 | `zsh-installer.isInstalled()` usa `fs.access` enquanto bash/fish/powershell passaram a usar `stat().isFile()`. | Um diretório no caminho de instalação conta como "instalado" só no zsh. Divergência do próprio upstream, mantida por paridade. |
| 4.3 | `openspec/specs/openspec-conventions/spec.md` tem uma cauda narrativa legada que o upstream removeu antes de `45cca5db`. | Não removida para não misturar com a sync. |
| 4.4 | No caminho de erro genérico da CLI (`✖ Erro: …`, stderr) ainda sai uma sequência de cor do chalk mesmo com stderr redirecionado. | Igual ao upstream; stdout fica limpo. |

## 5. Deltas do upstream deliberadamente não antecipados (D21)

Requisitos que no upstream ainda vivem em `openspec/changes/**` (não arquivados) e por isso **não** foram aplicados aos specs principais do fork. Revisitar quando o upstream arquivar cada um:

- `fix-archive-retirement-guidance` → `openspec/specs/cli-archive/spec.md`
- `warn-on-purpose-placeholder` → `openspec/specs/cli-validate/spec.md`
- `spec-diffs` → `openspec/specs/cli-show/spec.md`
- `suppress-telemetry-notice-in-json` → `openspec/specs/telemetry/spec.md`
- `fix-schemas-root-selection` → adiado junto com stores

## 6. Não mexer

`src/core/github-copilot/cloud-agent.ts` contém `@fission-ai/openspec` nas funções `generateUpstream*`. Isso é **intencional**: essas funções reproduzem verbatim os corpos gerados pelo OpenSpec upstream para que um projeto migrado tenha seus arquivos reconhecidos como gerenciados e atualizados. Verificado empiricamente que a saída real usa `@dynamicworks/br-openspec`. Alterá-las quebra o reconhecimento e faz `replaceRequired` lançar.

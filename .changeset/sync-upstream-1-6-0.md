---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec (v1.4.1 → pós-v1.6.0, commit `596d6ba7`).

### Novos recursos

- **Novo workflow `/opsx:update`** — revisa os artefatos de planejamento de uma alteração e os mantém coerentes (modo direcionado e auditoria), sem editar código. Entra no perfil `core`, que passa a ter 6 workflows (`propose`, `explore`, `apply`, `update`, `sync`, `archive`). O `openspec status --json` agora inclui `artifactPaths` com os caminhos de saída resolvidos dos artefatos.
- **Skills publicados no skills.sh** — os 13 skills de workflow (incluindo o `openspec-code-review`, exclusivo do fork) são gerados estaticamente em `skills/` (`pnpm generate:skills`) e podem ser instalados com `npx skills add dynamicworks-com-br/BR-OpenSpec`.
- **Pré-aprovação do CLI** — skills e slash commands gerados passam a incluir `allowed-tools: Bash(openspec:*)` no frontmatter.
- **Kimi CLI → Kimi Code** — a ferramenta foi renomeada seguindo o upstream (`.kimi` → `.kimi-code`); `openspec init` e `openspec update` migram automaticamente as skills gerenciadas do diretório legado.
- **Referências de skill na entrega skills-only** — com `delivery: 'skills'`, os SKILL.md gerados referenciam skills (`/openspec-*`) em vez de comandos `/opsx:*` não gerados.
- **Containers JSON no `config set`** — valores como `["new","ff"]` ou `{"a":1}` são interpretados como arrays/objetos.

### Correções

- **Validação e resolução de alterações** — `validate`, `view` e `archive` convergem para a mesma resolução canônica: o `validate` encontra alterações pelo diretório em disco (mesmo sem `proposal.md`), delta specs aninhados (`specs/<área>/<capacidade>/spec.md`) são descobertos recursivamente, e o progresso de tarefas conta checkboxes em todos os arquivos do glob `generates` do schema.
- **Parser de specs** — leitor de requisitos unificado: corpo multi-linha, conteúdo dentro de fenced code blocks ignorado (sem requisitos/seções fantasma), metadados `**X**:` pulados, e nota informativa quando um cabeçalho `###` não-`Requirement:` é ignorado pela validação. A dica de SHALL/MUST no corpo (e não só no cabeçalho) agora vale também para specs principais.
- **Specs aninhados** — todo o pipeline (parse, apply, sync, archive, list, view) descobre specs em subdiretórios recursivamente, corrigindo perda silenciosa de dados em layouts `specs/<área>/<capacidade>/spec.md`.
- **Archive** — retorna exit code 1 quando a validação bloqueia o arquivamento; aborta um `MODIFIED` que perderia cenários existentes ("scenario drift"); trata deltas `ADDED`/`RENAMED` já sincronizados como no-op; e não empilha um segundo prefixo de data em alterações que já começam com `AAAA-MM-DD-`.
- **Datas locais** — valores de data do CLI (prefixo do archive, `created` de novas alterações) usam o fuso horário local em vez de UTC.
- **Completions** — os instaladores verificam permissões de escrita antes de gravar/remover scripts e perfis; a detecção de shell consulta o processo pai (corrige a instalação para usuários de fish).
- **`--change` em `status`/`instructions`** — aceita nomes de alterações existentes em disco (ex.: começando com dígito); a validação kebab-case continua só na criação.
- **`config`** — o aviso de chave `rules:` desconhecida não dispara mais para artefatos de outro schema; `config profile` aplica a atualização em processo (sem `npx`) e reporta a razão em caso de falha.
- **`update`** — o aviso para perfis personalizados agora lista os workflows do core que estão faltando (substituindo a nota específica do workflow sync).
- **Adapters de comandos** — carriage returns em valores do frontmatter YAML são escapados corretamente (round-trip YAML seguro em descrições CRLF).
- **UI** — a tela de boas-vindas não quebra mais as setas/espaço dos prompts seguintes no Windows.
- **Templates de workflow** — instruem a reler artefatos de dependência do disco antes de criar o próximo; "Cancelar" no prompt de sync do archive agora aborta (antes arquivava mesmo assim); saída de sucesso do archive não é mais fixa; code fences com identificador de linguagem.
- **Instruções do schema** — a orientação de specs agora define spec como contrato de comportamento (o que incluir/evitar) e exige que perguntas abertas bloqueantes sejam resolvidas com o usuário antes de escrever as tarefas.

### Documentação

- **13 páginas novas** em `docs/` (EN) e `docs/pt-BR/`: home de documentação, overview, explore, existing-projects, editing-changes, reviewing-changes, writing-specs, team-workflow, how-commands-work, examples, faq, glossary e troubleshooting.
- Seções de atualização/desinstalação no guia de instalação, formato de nome de alterações (`openspec new change`), exemplo real de spec delta no README e melhorias de descobribilidade no loop explore → propose → apply → archive.

### Manutenção

- Dependências de desenvolvimento atualizadas (vitest 3.2.6, typescript-eslint 8.62.0, @inquirer 10.3.2/7.10.1) por segurança.
- `package-lock.json` obsoleto removido; `packageManager: pnpm@9.15.9` fixado no `package.json`.
- CI: matrix (Ubuntu/macOS/Windows) também em PRs, com paralelismo por SO; helpers de teste endurecidos para Windows (kill de árvore de processos, timeout com tail de saída, cleanup com retry).
- Nova skill de manutenção `.agents/skills/release-br-openspec` com o processo de release do fork.

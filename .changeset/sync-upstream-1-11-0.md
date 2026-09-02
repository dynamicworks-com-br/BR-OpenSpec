---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec (pós-v1.7.0 `45cca5db` → pós-v1.11.0 `d0071d73`), cobrindo as releases v1.8.0, v1.9.0, v1.10.0 e v1.11.0.

### Novos recursos

- **Aposentadoria de capabilities no archive** — uma alteração que declara `retire_capabilities: true` no `.openspec.yaml` pode aposentar uma capability cujo último requisito ela remove: o `openspec archive` exclui o `spec.md` principal em vez de abortar. Sem o marcador, o archive para antes de tocar em arquivos e diz exatamente o que adicionar. `--no-validate` nunca aposenta.
- **Archive transacional** — o destino é verificado e reivindicado (lock `.openspec-archive.lock`) antes de qualquer escrita em specs; fingerprints detectam edições concorrentes; snapshots permitem rollback; aposentadorias só acontecem depois que todas as escritas terminam.
- **`openspec show <alteração> --diff`** — imprime o diff por requisito de cada delta contra o spec principal, em vez de reimprimir o bloco inteiro: adições em verde, remoções em vermelho, texto completo dos `ADDED`, Reason/Migration dos `REMOVED` e `FROM`/`TO` dos `RENAMED`.
- **`openspec status --all`** — status de todas as alterações ativas num único processo, em texto ou `--json`.
- **`openspec validate --archived`** — verifica a conclusão de tarefas das alterações já arquivadas, com exit 1 quando alguma ficou incompleta.
- **`openspec init --language <idioma>`** — grava a instrução de idioma no `openspec/config.yaml` de um projeto novo (ex.: `--language "Português (pt-BR)"`), recusando sobrescrever a configuração de um projeto existente.
- **Arquivos do GitHub Copilot coding agent** — `openspec init` gera `copilot-setup-steps.yml` e `openspec.agent.md`, opt-in por `--copilot-cloud` / `--no-copilot-cloud`.
- **Ferramentas novas** — Zed Agent, Atlassian Rovo Dev CLI, MiniMax Code e Command Code (com adapter de comandos `/opsx-*`).
- **`telemetry.enabled` no config global** — `openspec config set telemetry.enabled false` desliga a telemetria sem `--allow-unknown`.

### Correções

- **Codex agora é skills-only** — o adapter de custom prompts foi aposentado e as skills passam a ser instaladas em `.agents/skills` (raiz canônica compartilhada com Antigravity, Zed e o alvo `agents`, com um único dono por raiz). Prompts legados em `~/.codex/prompts` são limpos por allowlist, e só depois que a skill substituta existe. O upgrade legado não sequestra mais o alvo `agents`.
- **Antigravity** migra de `.agent` para `.agents`, com a raiz antiga reconhecida e migrada.
- **Segurança de caminhos** — artefatos de spec, schema, template e skill só são lidos, escritos ou removidos dentro do diretório permitido: symlinks e nomes que escapam da raiz passam a ser recusados em `change`, `spec`, `schema`, `archive`, `init`, `update`, `instructions`, `templates` e no `openspec tools`. `init`/`update` agora falham com exit ≠ 0 quando uma ferramenta não pôde ser configurada.
- **`openspec tools --remove`** também limpa as skills deixadas nas raízes legadas, então a remoção deixa de ser desfeita em silêncio pelo `update` seguinte.
- **Validação** — requisitos sem `SHALL`/`MUST` viram **aviso** em vez de erro (o formato continua recomendado, e `--strict` continua reprovando), o que desbloqueia specs escritas em português; numeração ambígua de tarefas é reportada; todo cabeçalho de nível 4 conta como cenário na guarda de perda; um `## Purpose` deixado como placeholder do archive é sinalizado; alterações de schema sem spec continuam válidas.
- **Archive/sync de specs** — EOF canônico no spec reconstruído, linhas em branco preservadas ao redor de `## Requirements`, ordem dos requisitos preservada ao renomear, e nenhum código de escape ANSI escrito quando a saída é redirecionada.
- **Schema** — `schema fork` preserva comentários, block scalars e ordem de chaves do YAML; `schema init --default` de fato define o padrão.
- **Templates de workflow** — o corpo de instruções do apply é compartilhado entre skill e comando; o apply expõe escopo adiado em vez de simplificar tarefas em silêncio; o explore faz o scaffold antes de capturar artefatos, pede confirmação explícita antes de escrever e usa ASCII nos diagramas; o propose espera pedido explícito de implementação e respeita o schema pedido; caminhos aninhados de spec são preservados; as tarefas geradas incluem como verificar cada uma.
- **Telemetria** — o aviso de primeira execução vai para stderr e é suprimido em modo `--json`.
- **`openspec feedback`** mantém o relatório completo no corpo da issue.
- **Completions** — o gerador Fish deixa de cair em nomes de arquivo; a dica de completions passa a ser impressa pela própria CLI.
- **Adapters** — OpenCode e Pi passam os argumentos digitados pelo usuário para o workflow; `openspec update` só sugere reiniciar a IDE quando alguma ferramenta afetada é embutida em IDE; os profiles incluem `sync` junto com os workflows de archive.

### Segurança e manutenção

- O pacote **não executa mais nenhum script de instalação**: `scripts/postinstall.js` foi removido e a dica de completions passou para a CLI.
- Overrides de `js-yaml`, `nanoid`, `brace-expansion` e `postcss`; `pnpm audit --audit-level high` limpo.
- Migração para `@inquirer/prompts` v8 (com `@inquirer/core` 12), preservando a dica de teclas em PT-BR; nova dependência `diff` para o `show --diff`.
- `dependabot.yml` passa a ignorar majors não suportados; filtros de path e permissões por job nos workflows de CI.

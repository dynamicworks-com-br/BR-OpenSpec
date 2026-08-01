# Ferramentas Suportadas

O BR-OpenSpec funciona com muitos assistentes de codificação com IA. Quando você executa `openspec init`, o BR-OpenSpec configura as ferramentas selecionadas usando o perfil/seleção de fluxo de trabalho ativo e o modo de entrega.

## Como Funciona

Para cada ferramenta selecionada, o BR-OpenSpec pode instalar:

1. **Skills** (se a entrega incluir skills): `.../skills/openspec-*/SKILL.md`
2. **Comandos** (se a entrega incluir comandos): arquivos de comando `opsx-*` específicos da ferramenta

Por padrão, o BR-OpenSpec usa o perfil `core`, que inclui:
- `propose`
- `explore`
- `apply`
- `update`
- `sync`
- `archive`

Você pode habilitar fluxos de trabalho expandidos (`new`, `continue`, `ff`, `verify`, `code-review`, `bulk-archive`, `onboard`) via `openspec config profile` e depois executar `openspec update`.

## Como Invocar

Esta documentação usa `/opsx:propose` como nome canônico, mas cada ferramenta o escreve da forma como carrega o arquivo que o BR-OpenSpec gerou. Encontre o caminho de comando da sua ferramenta na [Referência de Diretórios das Ferramentas](#referência-de-diretórios-das-ferramentas) abaixo e depois combine com a forma correspondente aqui.

| Arquivo de comando que o BR-OpenSpec escreve | Você digita | Ferramentas |
|----------------------------------------------|-------------|-------------|
| `.../commands/opsx/<id>.*` — uma pasta `opsx/` o namespacia | `/opsx:<id>` | Claude Code, CodeBuddy, Crush, Gemini CLI, Lingma, Qoder |
| `.../opsx-<id>.*` — o nome do arquivo é o comando | `/opsx-<id>` | Todas as outras ferramentas com arquivos de comando gerados (incluindo os prompts globais do Codex), exceto Amazon Q e Devin |
| `.devin/workflows/opsx-<id>.md` — lido por apenas um dos dois agentes do Devin | `/opsx-<id>` no Devin Desktop, `/openspec-<skill>` no Devin Local | Devin Desktop\*\*\* |
| `.amazonq/prompts/opsx-<id>.md` — um prompt, não um comando | `@opsx-<id>` | Amazon Q Developer |
| nenhum — somente skills | `/openspec-<skill>` | ForgeCode, Mistral Vibe, Trae, alvo `.agents` compartilhado |
| nenhum — Kimi Code | `/skill:openspec-<skill>` | Kimi Code |
| skills do Codex | `$openspec-<skill>` | Codex ([`/openspec-<skill>` não é reconhecido](https://github.com/openai/codex/issues/11817)) |

Então `/opsx:propose` é `/opsx-propose` no Cursor, `@opsx-propose` no Amazon Q e `$openspec-propose` para uma skill do Codex.

Duas coisas variam independentemente, e é por isso que as linhas não se fundem:

- **O nome.** As linhas 1–2 diferem apenas em como o arquivo nomeia o comando, e o radical `opsx-<id>` / `opsx:<id>` é o mesmo para toda ferramenta com arquivos de comando gerados.
- **O invólucro.** O Amazon Q carrega seus arquivos numa biblioteca de prompts invocada com `@`. Ferramentas somente-skill não recebem arquivos de comando, então suas três últimas linhas usam nomes de *skill* — listados em [Nomes de Skills Geradas](#nomes-de-skills-geradas) — que não correspondem um-a-um aos ids de comando (`/opsx:apply` é a skill `openspec-apply-change`).

Os padrões de caminho acima são neutros quanto à extensão (`.*`) de propósito: a extensão é da ferramenta (`.toml` para Gemini CLI e Qwen Code, `.prompt` para Continue, `.prompt.md` para Kiro e GitHub Copilot), e algumas ferramentas mostram o nome com a extensão no seletor. Combine pela forma do diretório, não pela extensão.

Os arquivos que o BR-OpenSpec gera e a dica de "Início rápido" impressa após a configuração já usam a forma correta para as ferramentas que você selecionou — então a resposta mais rápida é ler a dica.

## Referência de Diretórios das Ferramentas

| Ferramenta (ID) | Padrão de caminho de skills | Padrão de caminho de comandos |
|-----------------|------------------------------|-------------------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/openspec-*/SKILL.md` | `.amazonq/prompts/opsx-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/openspec-*/SKILL.md` | `.agent/workflows/opsx-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/openspec-*/SKILL.md` | `.augment/commands/opsx-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/openspec-*/SKILL.md` | `.bob/commands/opsx-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/openspec-*/SKILL.md` | `.claude/commands/opsx/<id>.md` |
| Cline (`cline`) | `.cline/skills/openspec-*/SKILL.md` | `.clinerules/workflows/opsx-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.codex/skills/openspec-*/SKILL.md` | `$CODEX_HOME/prompts/opsx-<id>.md`\* |
| Devin Desktop, anteriormente Windsurf (`devin`) | `.devin/skills/openspec-*/SKILL.md` | `.devin/workflows/opsx-<id>.md`\*\*\* |
| ForgeCode (`forgecode`) | `.forge/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
| Continue (`continue`) | `.continue/skills/openspec-*/SKILL.md` | `.continue/prompts/opsx-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/openspec-*/SKILL.md` | `.cospec/openspec/commands/opsx-<id>.md` |
| Crush (`crush`) | `.crush/skills/openspec-*/SKILL.md` | `.crush/commands/opsx/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/openspec-*/SKILL.md` | `.cursor/commands/opsx-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/openspec-*/SKILL.md` | `.factory/commands/opsx-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/openspec-*/SKILL.md` | `.gemini/commands/opsx/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/openspec-*/SKILL.md` | `.github/prompts/opsx-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/openspec-*/SKILL.md` | `.iflow/commands/opsx-<id>.md` |
| Junie (`junie`) | `.junie/skills/openspec-*/SKILL.md` | `.junie/commands/opsx-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/openspec-*/SKILL.md` | `.kilocode/workflows/opsx-<id>.md` |
| Kimi Code (`kimi`) | `.kimi-code/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/skill:openspec-*` baseadas em skill) |
| Kiro (`kiro`) | `.kiro/skills/openspec-*/SKILL.md` | `.kiro/prompts/opsx-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/openspec-*/SKILL.md` | `.lingma/commands/opsx/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/opsx-<id>.toml` |
| [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code) (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
| Skills `.agents` compartilhadas (`agents`) | `.agents/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |

\* Os comandos do Codex são instalados no diretório global do Codex (`$CODEX_HOME/prompts/` se definido, caso contrário `~/.codex/prompts/`), não no diretório do seu projeto.

\*\* Os arquivos de prompt do GitHub Copilot são reconhecidos como slash commands personalizados nas extensões de IDE (VS Code, JetBrains, Visual Studio). O Copilot CLI atualmente não consome arquivos `.github/prompts/*.prompt.md` diretamente.

\*\*\* O Windsurf foi [renomeado para Devin Desktop](https://docs.devin.ai/desktop/devin-desktop-faq) em 2 de junho de 2026, e seu diretório de configuração mudou: `.devin/` é o local preferido de leitura e escrita, `.windsurf/` um fallback legado somente de leitura. O BR-OpenSpec segue a renomeação — o id da ferramenta é `devin`, e `--tools windsurf` ainda resolve para ele, então scripts de configuração existentes continuam funcionando. Um projeto que ainda guarda arquivos do BR-OpenSpec em `.windsurf/` recebe a oferta de migração no próximo `openspec update`; recusar os deixa onde estão, e arquivos escritos por você nunca são tocados. Workflows são invocados pelo nome do arquivo, então `.devin/workflows/opsx-apply.md` é `/opsx-apply`. O [agente Devin Local não suporta workflows](https://docs.devin.ai/desktop/devin-local) — apenas skills, e não lê `.windsurf/` de forma alguma — então sempre que o BR-OpenSpec escreve skills do Devin, ele mantém os corpos delas, e a dica de início rápido, em invocações de skill `/openspec-*`, que funcionam nos dois agentes. Sob entrega somente de comandos, nenhuma skill é escrita e ambos recaem para `/opsx-*`.

### Quando escolher o alvo `.agents` compartilhado

`agents` é a opção neutra em relação a fornecedores: ele escreve skills em `.agents/skills/`, a raiz compartilhada que muitas ferramentas de agente leem, em vez de um diretório específico de ferramenta.

| Situação | Escolha |
|----------|---------|
| Sua ferramenta tem sua própria linha acima | O ID dela — você obtém a integração da ferramenta, incluindo slash commands onde ela os suporta |
| Vários agentes em um repositório, todos lendo `.agents/skills` | `agents` — uma única árvore de skills em vez de uma por ferramenta |
| Sua ferramenta ainda não está listada, mas lê `.agents/skills` | `agents` |

Selecioná-lo junto com um ID específico de ferramenta não é problema; cada um escreve em sua própria raiz.
O BR-OpenSpec também o oferece automaticamente quando um projeto tem um diretório `.agents/skills/` — um `.agents/` vazio não é suficiente, já que ferramentas usam essa raiz para regras e definições de subagentes também. Note que `.agents` não é `.agent`: o diretório singular pertence ao Antigravity.

Duas coisas para saber:

- **Somente skills.** Não existe adaptador de comando, então nenhum arquivo de comando `opsx-*` é escrito; com um modo de entrega que inclui comandos, o `openspec init` relata `agents` entre as ferramentas para as quais pulou a geração de comandos (sem adaptador). Invoque os fluxos de trabalho pelo nome da skill — a maioria dos assistentes que leem `.agents/skills` escreve isso como `/openspec-propose`, a forma que a dica de configuração do BR-OpenSpec exibe. O alvo é neutro em relação a fornecedores, então consulte a documentação do seu assistente se ele usar outra forma.
- **Nenhum `AGENTS.md` é criado ou editado.** O alvo é o diretório `.agents/`. Se o seu `AGENTS.md` raiz ainda tiver blocos de marcadores do BR-OpenSpec de uma versão antiga, o `openspec update` os remove — veja o [Guia de Migração](migration-guide.md).

Como `.agents/skills/` é compartilhado, vale saber o que o BR-OpenSpec reivindica lá: ele escreve, atualiza e remove apenas os diretórios de skill `openspec-*` dos fluxos de trabalho selecionados. Qualquer outra coisa nesse diretório é deixada intacta. Trate os nomes `openspec-*` como sendo do BR-OpenSpec — edições dentro deles são substituídas no próximo `openspec update`, assim como em qualquer outra ferramenta.

## Configuração Não Interativa

Para CI/CD ou configuração via script, use `--tools` (e opcionalmente `--profile`):

```bash
# Configurar ferramentas específicas
openspec init --tools claude,cursor

# Configurar todas as ferramentas suportadas
openspec init --tools all

# Ignorar configuração de ferramentas
openspec init --tools none

# Substituir perfil para esta execução de init
openspec init --profile core
```

**IDs de ferramentas disponíveis (`--tools`)** — `windsurf` também é aceito, como alias de `devin`: `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `devin`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `forgecode`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `vibe`, `agents`

## Instalação Dependente de Fluxo de Trabalho

O BR-OpenSpec instala artefatos de fluxo de trabalho com base nos fluxos selecionados:

- **Perfil core (padrão):** `propose`, `explore`, `apply`, `update`, `sync`, `archive`
- **Seleção personalizada:** qualquer subconjunto de todos os IDs de fluxo de trabalho:
  `propose`, `explore`, `new`, `continue`, `apply`, `update`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `code-review`, `onboard`

Em outras palavras, a quantidade de skills/comandos depende do perfil e do modo de entrega, não é fixa.

## Nomes de Skills Geradas

Quando selecionadas pela configuração de perfil/fluxo de trabalho, o BR-OpenSpec gera estas skills:

- `openspec-propose`
- `openspec-explore`
- `openspec-new-change`
- `openspec-continue-change`
- `openspec-apply-change`
- `openspec-update-change`
- `openspec-ff-change`
- `openspec-sync-specs`
- `openspec-archive-change`
- `openspec-bulk-archive-change`
- `openspec-verify-change`
- `openspec-code-review`
- `openspec-onboard`

Veja [Comandos](../commands.md) para o comportamento dos comandos e [CLI](../cli.md) para as opções de `init`/`update`.

## Relacionados

- [Referência da CLI](../cli.md) — Comandos do terminal
- [Comandos](../commands.md) — Slash commands e skills
- [Primeiros Passos](../getting-started.md) — Configuração inicial

# Ferramentas Suportadas

O BR-OpenSpec funciona com muitos assistentes de codificação com IA. Quando você executa `openspec init`, o BR-OpenSpec configura as ferramentas selecionadas usando o perfil/seleção de fluxo de trabalho ativo e o modo de entrega.

## Como Funciona

Para cada ferramenta selecionada, o BR-OpenSpec pode instalar:

1. **Skills** (se a entrega incluir skills): `.../skills/openspec-*/SKILL.md`
2. **Comandos** (se a entrega incluir comandos): arquivos de comando `opsx-*` específicos da ferramenta

O Codex é somente-skills: o BR-OpenSpec instala `.agents/skills/openspec-*/SKILL.md` para o Codex mesmo quando a entrega está definida como `commands`, e não gera arquivos de prompt personalizados do Codex. As skills gerenciadas pelo BR-OpenSpec que existirem sob o caminho legado `.codex/skills` são reconciliadas depois que as substitutas são escritas; arquivos personalizados e divergentes são preservados.

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
| `.../opsx-<id>.*` — o nome do arquivo é o comando | `/opsx-<id>` | Todas as outras ferramentas com arquivos de comando gerados, exceto Amazon Q e Devin |
| `.devin/workflows/opsx-<id>.md` — lido por apenas um dos dois agentes do Devin | `/opsx-<id>` no Devin Desktop, `/openspec-<skill>` no Devin Local | Devin Desktop\*\*\* |
| `.amazonq/prompts/opsx-<id>.md` — um prompt, não um comando | `@opsx-<id>` | Amazon Q Developer |
| nenhum — somente skills | `/openspec-<skill>` | ForgeCode, MiniMax Code, Mistral Vibe, Trae, Zed Agent, alvo `.agents` compartilhado |
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
| Antigravity (`antigravity`) | `.agents/skills/openspec-*/SKILL.md` | `.agents/workflows/opsx-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/openspec-*/SKILL.md` | `.augment/commands/opsx-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/openspec-*/SKILL.md` | `.bob/commands/opsx-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/openspec-*/SKILL.md` | `.claude/commands/opsx/<id>.md` |
| Cline (`cline`) | `.cline/skills/openspec-*/SKILL.md` | `.clinerules/workflows/opsx-<id>.md` |
| Command Code (`command-code`) | `.commandcode/skills/openspec-*/SKILL.md` | `.commandcode/commands/opsx-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.agents/skills/openspec-*/SKILL.md` | Não gerado (somente skills; use `$openspec-*`) |
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
| MiniMax Code (`minimax-code`) | `~/.minimax/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use as skills do MiniMax Code) |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/opsx-<id>.toml` |
| [Rovo Dev CLI](https://support.atlassian.com/rovo/docs/use-rovo-dev-cli/) (`rovodev`) | `.rovodev/skills/openspec-*/SKILL.md` | Não gerado. O Rovo não tem superfície de slash command — ele casa skills automaticamente ou por prompt (por exemplo, "use a skill openspec-propose"); `/skills` apenas as gerencia. O conteúdo gerado referencia as skills pelo nome, nunca como comandos `/openspec-*`. |
| [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code) (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |
| [Zed Agent](https://zed.dev/docs/ai/skills) (`zed`) | `.agents/skills/openspec-*/SKILL.md` | Não gerado (somente skills; use `/openspec-*` ou `@openspec-*`) |
| Skills `.agents` compartilhadas (`agents`) | `.agents/skills/openspec-*/SKILL.md` | Não gerado (sem adaptador de comando; use invocações `/openspec-*` baseadas em skill) |

\*\* Os arquivos de prompt do GitHub Copilot são reconhecidos como slash commands personalizados nas extensões de IDE (VS Code, JetBrains, Visual Studio). O Copilot CLI atualmente não consome arquivos `.github/prompts/*.prompt.md` diretamente. Selecionar `github-copilot` também pode configurar o **Copilot coding agent (nuvem)** hospedado no GitHub — veja [Copilot coding agent (nuvem) do GitHub](#copilot-coding-agent-nuvem-do-github) abaixo.

\*\*\* O Windsurf foi [renomeado para Devin Desktop](https://docs.devin.ai/desktop/devin-desktop-faq) em 2 de junho de 2026, e seu diretório de configuração mudou: `.devin/` é o local preferido de leitura e escrita, `.windsurf/` um fallback legado somente de leitura. O BR-OpenSpec segue a renomeação — o id da ferramenta é `devin`, e `--tools windsurf` ainda resolve para ele, então scripts de configuração existentes continuam funcionando. Um projeto que ainda guarda arquivos do BR-OpenSpec em `.windsurf/` recebe a oferta de migração no próximo `openspec update`; recusar os deixa onde estão, e arquivos escritos por você nunca são tocados. Workflows são invocados pelo nome do arquivo, então `.devin/workflows/opsx-apply.md` é `/opsx-apply`. O [agente Devin Local não suporta workflows](https://docs.devin.ai/desktop/devin-local) — apenas skills, e não lê `.windsurf/` de forma alguma — então sempre que o BR-OpenSpec escreve skills do Devin, ele mantém os corpos delas, e a dica de início rápido, em invocações de skill `/openspec-*`, que funcionam nos dois agentes. Sob entrega somente de comandos, nenhuma skill é escrita e ambos recaem para `/opsx-*`.

O MiniMax Code é uma integração global e somente-skills. O BR-OpenSpec escreve apenas os diretórios `openspec-*` dele em `~/.minimax/skills/`; não cria diretórios `.minimax` ou `.mavis` locais do repositório. A entrega somente de comandos deixa as skills globais existentes do MiniMax Code intocadas, para que a configuração de entrega de um projeto não remova skills usadas por outro.

### Copilot coding agent (nuvem) do GitHub

O [Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent) do GitHub roda no GitHub, em um ambiente do GitHub Actions — separado do Copilot no seu editor. O BR-OpenSpec pode configurá-lo para usar a CLI `openspec` gerando dois arquivos:

- `.github/workflows/copilot-setup-steps.yml` — instala o `@dynamicworks/br-openspec` no ambiente do agente
- `.github/agents/openspec.agent.md` — ensina o agente a conduzir o BR-OpenSpec

Como isso escreve um workflow do GitHub Actions no seu repositório, é **opt-in**:

| Como | Comportamento |
|------|---------------|
| `openspec init` (interativo) | Pergunta se deve configurar os arquivos da nuvem. O padrão é **Não**. |
| `openspec init --copilot-cloud` | Configura sem solicitar confirmação (para scripts/CI). |
| `openspec init --no-copilot-cloud` | Pula os arquivos sem solicitar confirmação e remove os que tenham sido gerados antes. |
| `openspec update` | Nunca pergunta. Atualiza os arquivos somente se você optou por eles (ou se o projeto já os tem). Se você optou por não os ter, remove os arquivos de nuvem gerenciados pelo BR-OpenSpec. |

Sua escolha é salva em `openspec/config.yaml` como `githubCopilot.cloudAgent: true|false`, para que atualizações não interativas a respeitem. O BR-OpenSpec só escreve ou remove arquivos cujo conteúdo ele mesmo gerou — se você personalizar o `copilot-setup-steps.yml` ou o `openspec.agent.md`, ou já tiver os seus próprios, eles ficam intocados (e o `init`/`update` avisam você disso).

### Quando escolher o alvo `.agents` compartilhado

`agents` é a opção neutra em relação a fornecedores: ele escreve skills em `.agents/skills/`, a raiz compartilhada que muitas ferramentas de agente leem, em vez de um diretório específico de ferramenta.

| Situação | Escolha |
|----------|---------|
| Sua ferramenta tem sua própria linha acima | O ID dela — você obtém a integração da ferramenta, incluindo slash commands onde ela os suporta |
| Vários agentes em um repositório, todos lendo `.agents/skills` | `agents` — uma única árvore de skills em vez de uma por ferramenta |
| Sua ferramenta ainda não está listada, mas lê `.agents/skills` | `agents` |

Selecioná-lo junto com um ID específico de ferramenta não é problema; cada um normalmente escreve em sua própria raiz. O Codex e o Zed Agent são as exceções, porque usam a mesma raiz canônica `.agents`. Se o Codex for selecionado junto com o Zed ou com `agents`, o BR-OpenSpec mantém uma única árvore conduzida pelo Codex. Os repasses dela nomeiam tanto `$openspec-*` para o Codex quanto `/openspec-*` para os outros agentes, de modo que `--tools all` e configurações multiagente existentes continuam funcionando sem dois escritores sobrescrevendo os mesmos arquivos.
O BR-OpenSpec também o oferece automaticamente quando um projeto tem um diretório `.agents/skills/` — um `.agents/` vazio não é suficiente, já que ferramentas usam essa raiz para regras e definições de subagentes também. Note que `.agents` não é `.agent`: o diretório singular é a raiz anterior do Antigravity, lida apenas para migração.

Duas coisas para saber:

- **Somente skills.** Não existe adaptador de comando, então nenhum arquivo de comando `opsx-*` é escrito; com um modo de entrega que inclui comandos, o `openspec init` relata `agents` entre as ferramentas para as quais pulou a geração de comandos (sem adaptador). Invoque os fluxos de trabalho pelo nome da skill — a maioria dos assistentes que leem `.agents/skills` escreve isso como `/openspec-propose`, a forma que a dica de configuração do BR-OpenSpec exibe. O alvo é neutro em relação a fornecedores, então consulte a documentação do seu assistente se ele usar outra forma.
- **Nenhum `AGENTS.md` é criado ou editado.** O alvo é o diretório `.agents/`. Se o seu `AGENTS.md` raiz ainda tiver blocos de marcadores do BR-OpenSpec de uma versão antiga, o `openspec update` os remove — veja o [Guia de Migração](migration-guide.md).

O suporte ao Zed aqui é para o Zed Agent embutido. Os Zed External Agents e as Terminal Threads usam integrações próprias. As Agent Skills exigem o [Zed v1.4.2](https://github.com/zed-industries/zed/releases/tag/v1.4.2) ou mais recente. Skills locais do projeto ficam indisponíveis em uma worktree não confiável até você [conceder confiança](https://zed.dev/docs/worktree-trust).

Como `.agents/skills/` é compartilhado pelo Antigravity, pelo Codex, pelo Zed Agent e pelo alvo neutro em relação a fornecedores, vale saber o que o BR-OpenSpec reivindica lá: ele escreve, atualiza e remove apenas os diretórios de skill `openspec-*` dos fluxos de trabalho selecionados, mais um marcador `.openspec-target` que registra se foi o Codex, o Zed Agent ou o alvo neutro que renderizou aquela árvore compartilhada. Qualquer outra coisa nesse diretório é deixada intacta. Trate os nomes `openspec-*` e o marcador como sendo do BR-OpenSpec — edições dentro deles são substituídas no próximo `openspec update`, assim como em qualquer outra ferramenta.

Para projetos anteriores ao marcador, o BR-OpenSpec infere a titularidade a partir das referências das skills gerenciadas: `$openspec-*` significa Codex e `/openspec-*` significa o alvo neutro em relação a fornecedores. Uma árvore canônica genérica ao lado do `.codex/skills` legado é tratada como uma instalação de alvo duplo mais antiga e consolidada na árvore compartilhada compatível.

O `openspec update` também respeita essa titularidade. Se um projeto detém `.agents` como alvo neutro em relação a fornecedores e uma instalação remanescente do Codex é detectada apenas por arquivos de prompt soltos, a atualização deixa a árvore `agents` estabelecida no lugar em vez de reescrevê-la com a sintaxe do Codex, e preserva esses arquivos de prompt legados em vez de excluí-los. Para entregar a árvore compartilhada ao Codex, execute `openspec init --tools codex` explicitamente.

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

**IDs de ferramentas disponíveis (`--tools`)** — `windsurf` também é aceito, como alias de `devin`: `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `command-code`, `codex`, `devin`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `forgecode`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `minimax-code`, `opencode`, `pi`, `qoder`, `qwen`, `rovodev`, `roocode`, `trae`, `zed`, `vibe`, `agents`

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

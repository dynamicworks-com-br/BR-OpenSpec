# Como os Comandos Funcionam

**A única coisa que você precisa saber: o BR-OpenSpec tem dois tipos de comandos, e eles rodam em dois lugares diferentes.**

- Comandos `openspec ...` rodam no seu **terminal**. (Exemplo: `openspec init`.)
- Comandos `/opsx:...` rodam no **chat do seu assistente de IA**. (Exemplo: `/opsx:propose`.)

Se você já digitou `/opsx:propose` no terminal e nada aconteceu, esta página explica por quê. Você está falando com a metade errada do BR-OpenSpec. Slash commands não são comandos de terminal. São instruções que você dá ao seu assistente de codificação com IA, na mesma caixa de chat onde você normalmente digitaria "adicione um formulário de login".

Essa única distinção é a tropeço mais comum de novos usuários, então vamos deixá-la cristalina.

## As duas metades

O BR-OpenSpec é um projeto com dois chapéus.

**A CLI (a metade do terminal).** Um programa chamado `openspec` que você instala e roda a partir do seu shell. Ele prepara seu projeto, lista e valida mudanças, mostra um dashboard e arquiva trabalho concluído. Você digita esses comandos no iTerm, no terminal do VS Code, no PowerShell, em qualquer lugar onde rodaria `git` ou `npm`.

```bash
openspec init        # prepara o BR-OpenSpec neste projeto
openspec list        # ver mudanças ativas
openspec view        # abrir o dashboard interativo
```

**Os slash commands (a metade do chat).** Comandos curtos como `/opsx:propose` e `/opsx:apply` que você digita no seu assistente de IA. Eles dizem à IA para seguir o fluxo de trabalho do BR-OpenSpec: elaborar uma proposta, escrever specs, construir a partir da lista de tarefas, arquivar ao terminar. Você os digita no Claude Code, Cursor, Devin Desktop, Copilot, ou qualquer assistente que use.

```text
/opsx:propose add-dark-mode    (digitado no chat da sua IA)
/opsx:apply                    (digitado no chat da sua IA)
/opsx:archive                  (digitado no chat da sua IA)
```

Aqui está o modelo mental em uma figura:

```text
        SEU TERMINAL                          CHAT DO SEU ASSISTENTE DE IA
   ┌──────────────────────┐               ┌──────────────────────────────┐
   │  $ openspec init     │   instala     │  /opsx:propose add-dark-mode  │
   │  $ openspec list     │  ──────────►  │  /opsx:apply                  │
   │  $ openspec view     │   comandos    │  /opsx:archive                │
   └──────────────────────┘    e skills   └──────────────────────────────┘
        rode openspec aqui                      rode /opsx:* aqui
```

Note a seta. Rodar `openspec init` no seu terminal é o que *instala* os slash commands na sua ferramenta de IA. A metade do terminal prepara a metade do chat. Depois disso, a condução do dia a dia acontece quase toda no chat.

## "Como eu inicio o modo interativo?"

**Não existe um modo interativo separado para iniciar.** Essa pergunta aparece muito, então merece uma resposta direta.

Você não entra em um modo especial do BR-OpenSpec. Você simplesmente abre seu assistente de codificação com IA como sempre faz, e digita um slash command no chat. O slash command *é* a forma de "entrar" no BR-OpenSpec. Seu assistente o reconhece, carrega a skill correspondente do BR-OpenSpec e começa a seguir o fluxo de trabalho.

Então as instruções reais são:

1. Abra seu assistente de codificação com IA (Claude Code, Cursor, Devin Desktop, etc.) no seu projeto.
2. Digite `/opsx:propose` no chat dele, o mesmo lugar onde você digita qualquer outro pedido.
3. Observe o autocompletar: se o BR-OpenSpec estiver instalado, você verá `/opsx:propose`, `/opsx:apply` e os demais aparecerem conforme digita a barra.

É isso. Sem modo para ativar, sem daemon para lançar, sem janela separada.

Uma coisa que *é* genuinamente interativa vive no terminal: `openspec view`. Ele abre um dashboard para navegar pelas suas specs e mudanças. Mas é um visualizador, não a ferramenta com que você propõe e constrói. A construção acontece pelos slash commands no chat.

## Por que essa divisão existe

Vale entender, porque explica por que o BR-OpenSpec funciona com mais de 30 ferramentas de IA diferentes.

A CLI é o **motor**. Ela conhece as regras: como é uma pasta de mudança, quais artefatos dependem de quais, como mesclar uma delta spec na sua fonte de verdade. É a mesma em todo lugar.

Os slash commands são o **volante**, e cada ferramenta de IA tem um levemente diferente. O Claude Code os chama de comandos. Cursor e Devin Desktop têm seus próprios formatos. Algumas ferramentas os chamam de skills. Quando você roda `openspec init`, o BR-OpenSpec gera o tipo certo de arquivo para cada ferramenta que você selecionou, de modo que a mesma intenção `/opsx:propose` funcione não importa qual assistente você prefira.

A força desse design: você aprende o fluxo de trabalho uma vez e o carrega entre ferramentas. O trade-off: a sintaxe exata de um comando pode diferir levemente entre ferramentas, que é a próxima seção.

## Sintaxe de slash command por ferramenta

A intenção é idêntica em todo lugar. A grafia segue o arquivo que sua ferramenta carrega.

| Arquivo de comando da sua ferramenta | Como você digita | Ferramentas de exemplo |
|--------------------------------------|------------------|------------------------|
| `.../commands/opsx/<id>.*` | `/opsx:propose` | Claude Code, Gemini CLI, Crush |
| `.../opsx-<id>.*` | `/opsx-propose` | Cursor, GitHub Copilot (IDE), Devin Desktop, Codex (prompts globais) |
| `.amazonq/prompts/opsx-<id>.md` | `@opsx-propose` | Amazon Q Developer |
| nenhum — somente skills | `/openspec-propose` | ForgeCode, Mistral Vibe, Trae, alvo `.agents` compartilhado |
| nenhum — Kimi Code | `/skill:openspec-propose` | Kimi Code |
| skills do Codex | `$openspec-propose` | Codex |

O Devin é a única ferramenta que ocupa duas linhas. O Devin Desktop lê
`.devin/workflows/`, então `/opsx-propose` funciona lá; [o Devin Local não
lê](https://docs.devin.ai/desktop/devin-local), então nesse agente use a skill
`/openspec-propose`. As skills que o BR-OpenSpec escreve em `.devin/skills/`
funcionam nos dois, e é por isso que elas referenciam umas às outras pelo nome
da skill.

Todas as ferramentas estão listadas em [Como Invocar](supported-tools.md#como-invocar) — aquela tabela é a autoritativa. Duas linhas não são slash commands de forma alguma: o Amazon Q carrega seus arquivos numa biblioteca de prompts invocada com `@`, e as linhas de skill usam o nome da *skill*, que não é o id do comando (`/opsx:apply` é a skill `openspec-apply-change`).

Na dúvida, leia a linha de "Início rápido" que o `openspec init` imprimiu: ela já usa a forma que suas ferramentas registraram. Digitar uma barra e observar o autocompletar também funciona, para as ferramentas que expõem slash commands.

## Como os comandos chegaram lá: skills e comandos

Quando você roda `openspec init` (ou `openspec update`), o BR-OpenSpec escreve pequenos arquivos no seu projeto para que sua ferramenta de IA encontre o fluxo de trabalho. Dependendo da sua ferramenta e configurações, esses são **skills**, **comandos**, ou ambos.

- **Skills** vivem em lugares como `.claude/skills/openspec-*/SKILL.md`. São o padrão emergente entre ferramentas: uma pasta de instruções que seu assistente detecta automaticamente.
- **Comandos** vivem em lugares como `.cursor/commands/opsx-<id>.md` ou `.claude/commands/opsx/<id>.md` — o layout é da ferramenta, e ele decide como você digita o comando. São os arquivos de slash command mais antigos, específicos de cada ferramenta. Os arquivos de comando do Codex vivem no diretório global do Codex (`$CODEX_HOME/prompts/`), não no seu projeto.

Você não precisa se importar com qual deles sua ferramenta usa. Você simplesmente digita o slash command e funciona. Mas saber que esses arquivos existem ajuda quando algo dá errado: se seus comandos somem, geralmente significa que esses arquivos estão faltando ou desatualizados, e `openspec update` os regenera.

Veja [Ferramentas Suportadas](supported-tools.md) para os caminhos exatos por ferramenta, e o [Guia de Migração](migration-guide.md) para como as skills substituíram a abordagem antiga, só de comandos.

## Confirmando que está instalado

Verificações rápidas, da mais rápida primeiro:

1. **Digite uma barra no chat da sua IA.** Comece digitando `/opsx` e observe as sugestões de autocompletar. Se aparecerem, está tudo certo. Em uma ferramenta somente de skills (Kimi Code, ForgeCode, Mistral Vibe, Trae ou o alvo `.agents` compartilhado), `/opsx` nunca completa mesmo em uma instalação saudável — tente o nome da skill da tabela acima.
2. **Procure os arquivos.** Para o Claude Code, verifique que `.claude/skills/` contém pastas `openspec-*`. Outras ferramentas usam seus próprios diretórios ([Ferramentas Suportadas](supported-tools.md) lista todos).
3. **Rode a configuração de novo.** Da raiz do seu projeto, rode `openspec update`. Isso regenera os arquivos de skill e comando para as ferramentas que você configurou.
4. **Reinicie seu assistente.** Muitas ferramentas varrem skills e comandos na inicialização, então uma janela nova pode ser o passo que faltava.

## Quais comandos eu tenho, afinal?

Por padrão, o BR-OpenSpec instala o conjunto **core** de slash commands:

- `/opsx:explore`: pense uma ideia com a IA antes de se comprometer com uma mudança (ótimo primeiro passo quando você está em dúvida)
- `/opsx:propose`: crie uma mudança e elabore todos os seus artefatos de planejamento em um passo
- `/opsx:apply`: construa a mudança trabalhando pela lista de tarefas
- `/opsx:update`: revise os artefatos de planejamento de uma mudança e mantenha-os coerentes
- `/opsx:sync`: mescle as atualizações de spec de uma mudança nas suas specs principais (geralmente automático)
- `/opsx:archive`: conclua uma mudança e a arquive

Um bom ritmo padrão: `explore` quando você está descobrindo o que fazer, depois `propose`, `apply`, `archive`. O guia [Explore Primeiro](explore.md) explica por que esse passo inicial compensa.

Há também um conjunto **expandido** para quem quer controle mais fino (`/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:verify`, `/opsx:code-review`, `/opsx:bulk-archive`, `/opsx:onboard`). Você o ativa com `openspec config profile` e depois o aplica com `openspec update`.

Novo em tudo isso? `/opsx:onboard` (no conjunto expandido) guia você por uma mudança completa na sua própria base de código, narrando cada passo. É a introdução mais amigável possível.

Para o que cada comando faz em detalhe, veja [Comandos](commands.md). Para quando usar qual, veja [Fluxos de Trabalho](workflows.md).

## Uma primeira execução limpa

Juntando tudo, aqui está a sequência inteira com cada passo marcado pelo lugar onde acontece.

```text
TERMINAL     $ npm install -g @dynamicworks/br-openspec@latest
TERMINAL     $ cd seu-projeto
TERMINAL     $ openspec init
              (instala os slash commands na sua ferramenta de IA)

CHAT DA IA   /opsx:explore
              (opcional: pense a ideia com a IA primeiro)

CHAT DA IA   /opsx:propose add-dark-mode
              (IA elabora proposta, specs, design, tarefas)

CHAT DA IA   /opsx:apply
              (IA constrói, marcando as tarefas)

CHAT DA IA   /opsx:archive
              (a mudança é mesclada nas suas specs e arquivada)
```

Dois passos no terminal para configurar. Depois você vive no chat. Esse é o ritmo.

## Relacionados

- [Primeiros Passos](getting-started.md): o walkthrough completo da primeira mudança
- [Comandos](commands.md): cada slash command em detalhe
- [CLI](cli.md): cada comando de terminal em detalhe
- [Ferramentas Suportadas](supported-tools.md): sintaxe por ferramenta e localização dos arquivos
- [FAQ](faq.md): mais respostas rápidas
- [Solução de Problemas](troubleshooting.md): correções quando os comandos não aparecem

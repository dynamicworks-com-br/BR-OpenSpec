# Perguntas Frequentes

Respostas rápidas às perguntas que as pessoas mais fazem. Se sua pergunta é na verdade do tipo "algo está quebrado", [Solução de Problemas](troubleshooting.md) é a página melhor. Se você quer um termo definido, veja o [Glossário](glossary.md).

## O básico

### O que é o BR-OpenSpec, em uma frase?

Uma camada leve que faz você e seu assistente de codificação com IA concordarem sobre o que construir, por escrito, antes de qualquer código ser escrito.

### Por que eu iria querer isso?

Porque assistentes de IA são confiantes mesmo quando estão errados. Quando os requisitos vivem apenas numa thread de chat, a IA preenche lacunas com suposições, e você descobre depois que o código existe. O BR-OpenSpec move o alinhamento para mais cedo, onde erros são baratos de corrigir. Veja [Conceitos Essenciais em Resumo](overview.md) para o argumento completo.

### Tenho que usar para tudo?

Não. Use onde o alinhamento importa, que é a maior parte do trabalho não trivial. Para corrigir um typo de um caractere, a cerimônia provavelmente não vale a pena, e tudo bem.

### Posso usar em uma base de código grande e existente, ou só em projetos novos?

Bases de código existentes são o prato principal. O BR-OpenSpec é brownfield-first: você não documenta seu app inteiro de antemão. Você escreve specs apenas para o que cada mudança toca, e suas specs se preenchem com o tempo em torno do trabalho que você realmente faz. Há um guia dedicado: [Usando o BR-OpenSpec em um Projeto Existente](existing-projects.md).

### É amarrado a uma ferramenta de IA?

Não. O BR-OpenSpec funciona com mais de 25 assistentes, incluindo Claude Code, Cursor, Windsurf, GitHub Copilot, Gemini CLI, Codex e outros. A lista completa e os detalhes por ferramenta estão em [Ferramentas Suportadas](supported-tools.md).

## Rodando comandos

### Onde eu digito `/opsx:propose`?

No chat do seu assistente de IA, não no seu terminal. Este é o ponto de confusão mais comum de todos, então tem sua própria página: [Como os Comandos Funcionam](how-commands-work.md). Versão curta: `openspec ...` roda no terminal, `/opsx:...` roda no chat.

### Como eu "inicio o modo interativo"?

Não existe um modo separado para iniciar. Você abre seu assistente de IA como sempre e digita um slash command no chat dele. O slash command é a forma de "entrar" no BR-OpenSpec. (O único recurso de terminal genuinamente interativo é `openspec view`, um dashboard para navegar por specs e mudanças.) Explicação completa em [Como os Comandos Funcionam](how-commands-work.md).

### Digitei um slash command e nada aconteceu. Por quê?

Muito provavelmente você o digitou no terminal em vez do chat da IA, usou uma grafia que sua ferramenta não registra, ou os comandos ainda não estão instalados. Se os arquivos estiverem faltando — ou você nunca configurou a ferramenta — rode `openspec init`; o `openspec update` só atualiza arquivos que já existem. Depois reinicie seu assistente e use a forma impressa no "Início rápido" — veja [Como Invocar](supported-tools.md#como-invocar). [Solução de Problemas](troubleshooting.md#comandos-não-aparecem) tem a checklist completa.

### Por que a sintaxe é `/opsx:propose` em uma ferramenta e `/opsx-propose` em outra?

Cada ferramenta de IA expõe comandos personalizados de um jeito levemente diferente, e o BR-OpenSpec os escreve da forma como sua ferramenta carrega o arquivo gerado. Um arquivo de comando chamado `opsx-propose.md` é digitado `/opsx-propose`; um arquivado sob `commands/opsx/` é digitado `/opsx:propose`. Os arquivos do Amazon Q são entradas de biblioteca de prompts, digitados `@opsx-propose`. Ferramentas que recebem skills em vez de comandos usam o nome da skill — skills do Codex são `$openspec-propose`, Kimi Code `/skill:openspec-propose`. A linha de "Início rápido" do `openspec init` já imprime a forma correta para as ferramentas que você escolheu; a tabela completa está em [Como Invocar](supported-tools.md#como-invocar).

### Qual a diferença entre uma skill e um comando?

Ambos são arquivos que o BR-OpenSpec escreve para que seu assistente possa rodar o fluxo de trabalho. Skills (`.../skills/openspec-*/SKILL.md`) são o padrão mais novo, compartilhado entre ferramentas; comandos (`.../commands/opsx-*`) são os arquivos de slash mais antigos, específicos de cada ferramenta. Você não precisa escolher. Você simplesmente digita o slash command, e o BR-OpenSpec instala o que sua ferramenta usa.

## O fluxo de trabalho

### Por onde começo se não tenho certeza do que construir?

Com `/opsx:explore`. É um parceiro de raciocínio sem risco algum, que lê sua base de código, apresenta opções e transforma um problema difuso em um plano concreto, tudo antes que qualquer mudança ou código exista. Está no perfil padrão, então está sempre disponível. Quando o plano está claro, ele passa o bastão para `/opsx:propose`. Este é o melhor hábito a formar, porque impede uma IA ansiosa de construir confiantemente a coisa errada. Veja [Explore Primeiro](explore.md).

### Qual o fluxo mais simples possível?

```text
/opsx:explore (opcional)   depois   /opsx:propose <o que você quer>   depois   /opsx:apply   depois   /opsx:archive
```

Explore para pensar, propose para elaborar o plano, apply para construir, archive para arquivar. Pule o explore quando você já sabe exatamente o que quer.

### Qual a diferença entre `/opsx:propose` e `/opsx:new`?

`/opsx:propose` é o comando padrão de um passo só: cria a mudança e elabora todos os artefatos de planejamento de uma vez. `/opsx:new` faz parte do conjunto expandido de comandos e apenas esqueleta uma mudança vazia, deixando você criar os artefatos um a um com `/opsx:continue` (ou todos de uma vez com `/opsx:ff`). Use o propose, a menos que queira controle passo a passo. Veja [Comandos](commands.md).

### O que são os perfis `core` e expandido?

Um perfil decide quais slash commands são instalados. **Core** (o padrão) dá a você `propose`, `explore`, `apply`, `sync`, `archive`. O conjunto **expandido** adiciona `new`, `continue`, `ff`, `verify`, `bulk-archive` e `onboard` para controle mais fino. Troque com `openspec config profile`, depois aplique com `openspec update`.

### Preciso rodar `/opsx:sync`?

Normalmente não. O sync mescla as delta specs de uma mudança nas suas specs principais, e `/opsx:archive` se oferece para fazer isso por você. Rode o sync manualmente só quando quiser as specs mescladas antes de arquivar, por exemplo numa mudança de longa duração. Veja [Comandos](commands.md#opsxsync).

### Como edito uma proposta, spec ou tarefa depois de começar?

Simplesmente edite o arquivo. Todo artefato é Markdown puro em `openspec/changes/<nome>/`, e não há fase travada nem modo especial de edição. Mude manualmente, ou peça à IA para revisar ("atualize o design para usar uma fila"), depois siga em frente. A IA sempre trabalha a partir do conteúdo atual dos arquivos. Guia completo: [Editando e Iterando em uma Mudança](editing-changes.md).

### Posso voltar e mudar o plano depois de implementar parte dele?

Sim, a qualquer momento. O fluxo de trabalho é fluido, então revisão e edição não são fases das quais você fica trancado do lado de fora. Edite o artefato e continue. Se quiser uma verificação estruturada de que o código ainda corresponde ao plano, rode `/opsx:verify`. Veja [Editando e Iterando em uma Mudança](editing-changes.md#como-volto-para-revisar-depois-de-implementar).

### Editei o código manualmente. Como reconcilio isso com a spec?

Traga os dois de volta à sincronia antes de arquivar, já que arquivar torna suas specs o registro da verdade. Se o código agora está correto, atualize a delta spec para refletir o que você entregou; se a spec está correta, continue construindo até o código concordar. `/opsx:verify` traz à tona as divergências. Veja [Editando e Iterando em uma Mudança](editing-changes.md#editei-o-código-manualmente-como-reconcilio-isso-com-o-br-openspec).

### Quando devo atualizar uma mudança existente versus começar uma nova?

Atualize quando é o mesmo trabalho, refinado. Comece do zero quando a intenção mudou fundamentalmente ou o escopo explodiu para um trabalho diferente. Há um fluxograma de decisão e exemplos em [Fluxos de Trabalho](workflows.md#quando-atualizar-vs-começar-do-zero).

### E se minha sessão ficar sem contexto, ou os requisitos mudarem no meio da implementação?

É aqui que as specs mostram seu valor. Como o plano vive em arquivos (e não só no histórico do chat), você pode limpar seu contexto, começar uma sessão de IA nova e retomar com `/opsx:apply`; ele lê os artefatos e continua da primeira tarefa não marcada. Se os requisitos mudarem, edite os artefatos para refletir a nova realidade e continue. Manter uma janela de contexto limpa também produz resultados melhores; limpe-a antes da implementação.

### Devo commitar a pasta `openspec/` no git?

Sim. Suas specs, mudanças ativas e arquivo morto fazem parte da história do seu projeto. Commite-as como qualquer outro código-fonte. O arquivo morto em particular se torna um registro durável de por que seu sistema funciona como funciona.

## Specs e mudanças

### O que vai numa spec versus num design?

Uma spec descreve comportamento observável: o que o sistema faz, suas entradas, saídas e condições de erro. Um design descreve como você vai construir: a abordagem técnica, decisões de arquitetura, mudanças de arquivos. Se a implementação puder mudar sem mudar o comportamento visível externamente, pertence ao design, não à spec. [Conceitos](concepts.md#o-que-uma-spec-é-e-não-é) aprofunda.

### O que é uma delta spec?

Uma spec que descreve apenas o que está mudando, usando seções `ADDED`, `MODIFIED` e `REMOVED`, em vez de reafirmar a spec inteira. É como o BR-OpenSpec lida limpamente com edições em sistemas existentes. Veja [Conceitos](concepts.md#delta-specs).

### Para onde vão as mudanças arquivadas?

Para `openspec/changes/archive/AAAA-MM-DD-<nome>/`, com todos os artefatos preservados. Nada é deletado; a mudança apenas sai da sua lista de ativas.

## Configuração e personalização

### Como conto à IA sobre minha stack de tecnologia?

Coloque em `openspec/config.yaml` sob `context:`. Esse texto é injetado em cada pedido de planejamento, então a IA sempre conhece sua stack e convenções. Veja [Personalização](customization.md#configuração-do-projeto).

### Posso gerar specs em um idioma diferente do inglês?

Sim. Adicione uma instrução de idioma ao `context:` da sua configuração. [Multi-Idioma](multi-language.md) tem trechos prontos para copiar em vários idiomas.

### Posso mudar o próprio fluxo de trabalho?

Sim, com schemas personalizados. Um schema define quais artefatos existem e como eles dependem uns dos outros. Bifurque o padrão com `openspec schema fork spec-driven meu-workflow`, depois edite-o. Veja [Personalização](customization.md#schemas-personalizados).

## Modelos, privacidade e atualizações

### Qual modelo de IA devo usar?

O BR-OpenSpec funciona melhor com modelos de alto raciocínio. O README recomenda modelos como Codex 5.5 e Opus 4.8 tanto para planejamento quanto para implementação. Mantenha também sua janela de contexto limpa: limpe-a antes da implementação para melhores resultados.

### O BR-OpenSpec coleta dados?

Ele coleta estatísticas de uso anônimas: apenas nomes de comandos e versão. Sem argumentos, caminhos, conteúdo ou dados pessoais, e é desativado automaticamente em CI. Desative com `export OPENSPEC_TELEMETRY=0` ou `export DO_NOT_TRACK=1`.

### Como faço upgrade?

Dois passos. Atualize o pacote (`npm install -g @dynamicworks/br-openspec@latest`), depois rode `openspec update` dentro de cada projeto para atualizar as skills e comandos gerados.

### Como desinstalo o BR-OpenSpec?

Não há comando de desinstalação, porque ele é apenas um pacote global mais alguns arquivos no seu projeto. Remova o pacote (`npm uninstall -g @dynamicworks/br-openspec`) e, opcionalmente, delete o diretório `openspec/` e os arquivos de ferramentas gerados. O passo a passo, incluindo o que é seguro manter, está em [Instalação: Desinstalando](installation.md#desinstalando).

## Obtendo ajuda

### Onde faço perguntas ou reporto bugs?

- **GitHub Issues:** [github.com/dynamicworks-com-br/BR-OpenSpec/issues](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues)
- **Do seu terminal:** `openspec feedback "sua mensagem"` abre uma issue no GitHub para você.

### Estes docs estão errados ou confusos. O que eu faço?

Conte para nós, ou corrija. PRs de documentação são bem-vindos e valorizados. Abra uma issue ou envie um pull request.

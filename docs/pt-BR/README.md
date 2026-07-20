# Documentação do BR-OpenSpec

Boas-vindas. Esta é a home de tudo sobre o BR-OpenSpec.

O BR-OpenSpec ajuda você e seu assistente de codificação com IA a **concordarem sobre o que construir antes de qualquer código ser escrito.** Você descreve a mudança, a IA elabora uma spec curta e uma lista de tarefas, ambos olham para o mesmo plano, e só então o trabalho acontece. Chega de descobrir no meio do caminho que a IA construiu a coisa errada.

Se você só for ler duas páginas, leia estas:

1. [Primeiros Passos](getting-started.md): instale, inicialize e entregue sua primeira mudança.
2. [Como os Comandos Funcionam](how-commands-work.md): onde você realmente digita `/opsx:propose` (dica: no chat da IA, não no terminal). Isso confunde quase todo mundo uma vez.

A segunda importa mais do que parece. O BR-OpenSpec tem duas metades: uma ferramenta de linha de comando que você roda no terminal, e slash commands que você dá ao seu assistente de IA. Saber qual é qual poupa o momento de confusão mais comum.

> **O melhor hábito para formar primeiro: quando não tiver certeza do que construir, comece com `/opsx:explore`.** É um parceiro de raciocínio sem risco algum, que lê seu código, pesa opções e afia uma ideia difusa em um plano concreto antes que qualquer artefato ou código exista. O guia [Explore Primeiro](explore.md) apresenta os argumentos.

## Escolha seu caminho

**Sou completamente novo.** Comece com [Primeiros Passos](getting-started.md), depois folheie os [Conceitos Essenciais em Resumo](overview.md). Quando algo parecer misterioso, o [FAQ](faq.md) e o [Glossário](glossary.md) estão por perto.

**Tenho um problema, mas não um plano.** Este é o caso comum, e tem uma resposta dedicada: [Explore Primeiro](explore.md). Use `/opsx:explore` para pensar com a IA antes de se comprometer com qualquer coisa.

**Tenho uma base de código grande e existente.** Você não documenta tudo. [Usando o BR-OpenSpec em um Projeto Existente](existing-projects.md) mostra como começar em código brownfield real sem tentar abraçar o oceano.

**Só quero fazer funcionar.** [Instale](installation.md), rode `openspec init`, depois leia [Como os Comandos Funcionam](how-commands-work.md) para que seu primeiro slash command caia no lugar certo.

**Aprendo por exemplos.** A página [Exemplos e Receitas](examples.md) percorre mudanças reais do início ao fim: uma funcionalidade pequena, uma correção de bug, uma refatoração, uma exploração.

**A IA acabou de elaborar um plano — e agora?** Leia-o. [Revisando uma Mudança](reviewing-changes.md) mostra a passada de dois minutos que pega um rumo errado enquanto ainda é barato, e [Escrevendo Boas Specs](writing-specs.md) cobre do que é feito um plano que vale a pena aprovar.

**Trabalho em equipe.** [BR-OpenSpec em Equipe](team-workflow.md) mostra como uma mudança se mapeia em uma branch e um pull request, e como colegas revisam um plano antes do código.

**Venho do fluxo de trabalho antigo.** O [Guia de Migração](migration-guide.md) explica o que mudou e por quê, e promete que seu trabalho existente está seguro.

**Quero adaptá-lo ao processo da minha equipe.** [Personalização](customization.md) cobre configuração do projeto, schemas personalizados e contexto compartilhado.

**Algo está quebrado.** [Solução de Problemas](troubleshooting.md) reúne as falhas que as pessoas realmente encontram, com correções.

## O mapa completo

### Comece aqui

| Doc | O que ele oferece |
|-----|-------------------|
| [Primeiros Passos](getting-started.md) | Instale, inicialize e rode sua primeira mudança de ponta a ponta |
| [Explore Primeiro](explore.md) | Use `/opsx:explore` para pensar uma ideia antes de se comprometer |
| [Como os Comandos Funcionam](how-commands-work.md) | Onde os slash commands rodam, o que significa "modo interativo", terminal vs chat |
| [Conceitos Essenciais em Resumo](overview.md) | Todo o modelo mental em uma página: specs, mudanças, deltas, arquivamento |
| [Instalação](installation.md) | npm, pnpm, yarn, bun, Nix, e como verificar que funcionou |

### Use no dia a dia

| Doc | O que ele oferece |
|-----|-------------------|
| [Fluxos de Trabalho](workflows.md) | Padrões comuns e quando usar cada comando |
| [Exemplos e Receitas](examples.md) | Walkthroughs completos de mudanças reais, prontos para copiar |
| [Escrevendo Boas Specs](writing-specs.md) | Como são um bom requisito e um bom cenário, e como dimensionar uma mudança |
| [Revisando uma Mudança](reviewing-changes.md) | A passada de dois minutos em um plano elaborado, antes de qualquer código |
| [BR-OpenSpec em Equipe](team-workflow.md) | Como as mudanças se encaixam em branches, pull requests e revisão |
| [Usando o BR-OpenSpec em um Projeto Existente](existing-projects.md) | Adotando o BR-OpenSpec em uma base de código brownfield grande |
| [Editando e Iterando em uma Mudança](editing-changes.md) | Atualizar artefatos, voltar atrás, reconciliar edições manuais |
| [Comandos](commands.md) | Referência de cada slash command `/opsx:*` |
| [CLI](cli.md) | Referência de cada comando de terminal `openspec` |

### Entenda a fundo

| Doc | O que ele oferece |
|-----|-------------------|
| [Conceitos](concepts.md) | A explicação longa de specs, mudanças, artefatos, schemas e arquivamento |
| [Fluxo de Trabalho OPSX](opsx.md) | Por que o fluxo de trabalho é fluido em vez de travado em fases, mais um mergulho na arquitetura |
| [Glossário](glossary.md) | Cada termo definido em um só lugar |

### Faça do seu jeito

| Doc | O que ele oferece |
|-----|-------------------|
| [Personalização](customization.md) | Configuração do projeto, schemas personalizados, contexto compartilhado |
| [Multi-Idioma](multi-language.md) | Gere artefatos em idiomas diferentes do inglês |
| [Ferramentas Suportadas](supported-tools.md) | As 25+ ferramentas de IA com que o BR-OpenSpec se integra, e onde os arquivos vão parar |

### Quando precisar de ajuda

| Doc | O que ele oferece |
|-----|-------------------|
| [FAQ](faq.md) | Respostas rápidas às perguntas mais frequentes |
| [Solução de Problemas](troubleshooting.md) | Correções concretas para falhas concretas |
| [Guia de Migração](migration-guide.md) | Migrando do fluxo de trabalho legado para o OPSX |

## A versão de trinta segundos

```text
1. Instale        npm install -g @dynamicworks/br-openspec@latest
2. Inicialize     cd seu-projeto && openspec init
3. Explore        (no chat da IA)  /opsx:explore           ← opcional, mas um ótimo hábito
4. Proponha       (no chat da IA)  /opsx:propose add-dark-mode
5. Construa       (no chat da IA)  /opsx:apply
6. Arquive        (no chat da IA)  /opsx:archive
```

Os passos 1 e 2 acontecem no seu terminal. O resto acontece no chat do seu assistente de IA. Essa divisão é a única coisa que vale memorizar, e [Como os Comandos Funcionam](how-commands-work.md) explica exatamente por quê. O passo 3 é opcional, mas começar com `/opsx:explore` quando você está em dúvida é o hábito mais valioso a formar.

## Onde mais obter ajuda

- **GitHub Issues:** [github.com/dynamicworks-com-br/BR-OpenSpec/issues](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues) para bugs e pedidos de funcionalidades.
- **`openspec feedback "sua mensagem"`** envia feedback direto do seu terminal (abre uma issue no GitHub).

Encontrou algo nestes docs que está errado, desatualizado ou confuso? Isso é um bug. Abra uma issue ou um PR. Melhorias de documentação estão entre as contribuições mais valiosas que você pode fazer.

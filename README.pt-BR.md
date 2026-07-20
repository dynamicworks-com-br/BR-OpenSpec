<p align="center">
  <a href="https://github.com/dynamicworks-com-br/BR-OpenSpec">
    <picture>
      <source srcset="assets/openspec_bg.png">
      <img src="assets/openspec_bg.png" alt="OpenSpec logo">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://github.com/dynamicworks-com-br/BR-OpenSpec/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/dynamicworks-com-br/BR-OpenSpec/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@dynamicworks/br-openspec"><img alt="npm version" src="https://img.shields.io/npm/v/@dynamicworks/br-openspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
</p>

<details>
<summary><strong>O framework de spec mais querido.</strong></summary>

[![Stars](https://img.shields.io/github/stars/dynamicworks-com-br/BR-OpenSpec?style=flat-square&label=Stars)](https://github.com/dynamicworks-com-br/BR-OpenSpec/stargazers)
[![Downloads](https://img.shields.io/npm/dm/@dynamicworks/br-openspec?style=flat-square&label=Downloads/mo)](https://www.npmjs.com/package/@dynamicworks/br-openspec)
[![Contributors](https://img.shields.io/github/contributors/dynamicworks-com-br/BR-OpenSpec?style=flat-square&label=Contributors)](https://github.com/dynamicworks-com-br/BR-OpenSpec/graphs/contributors)

</details>
<p></p>
Nossa filosofia:

> Esta filosofia foi definida pelo projeto original [OpenSpec](https://github.com/tab-tools/openspec) e o BR-OpenSpec fará o possível para honrá-la em cada decisão.

```text
→ fluido, não rígido
→ iterativo, não em cascata
→ simples, não complexo
→ feito para brownfield, não apenas greenfield
→ escalável de projetos pessoais a empresas
```

> [!TIP]
> **Novo fluxo de trabalho disponível!** Reconstruímos o BR-OpenSpec com um novo fluxo de trabalho guiado por artefatos.
>
> Execute `/opsx:propose "sua ideia"` para começar. → [Saiba mais aqui](docs/pt-BR/opsx.md)

<p align="center">
  Siga <a href="https://x.com/0xTab">@0xTab no X</a> para atualizações.
</p>

<!-- TODO: Add GIF demo of /opsx:propose → /opsx:archive workflow -->

## Veja em ação

```text
Você: /opsx:explore
IA:   O que você gostaria de explorar?
Você: Quero dark mode, mas não sei como fazê-lo de forma limpa.
IA:   Deixe-me olhar sua configuração de estilos...
      O caminho mais limpo aqui: variáveis CSS + um pequeno contexto
      de tema, com detecção da preferência do sistema. Sem novas
      dependências. Dimensiono?
Você: Sim, vamos em frente.

Você: /opsx:propose add-dark-mode
IA:   Criado openspec/changes/add-dark-mode/
      ✓ proposal.md — por que estamos fazendo isso, o que está mudando
      ✓ specs/       — requisitos e cenários
      ✓ design.md    — abordagem técnica
      ✓ tasks.md     — checklist de implementação
      Pronto para implementação!

Você: /opsx:apply
IA:   Implementando tarefas...
      ✓ 1.1 Adicionar provedor de contexto de tema
      ✓ 1.2 Criar componente de alternância
      ✓ 2.1 Adicionar variáveis CSS
      ✓ 2.2 Conectar localStorage
      Todas as tarefas concluídas!

Você: /opsx:archive
IA:   Arquivado em openspec/changes/archive/2025-01-23-add-dark-mode/
      Specs atualizadas. Pronto para a próxima funcionalidade.
```

<details>
<summary><strong>Como são as specs na prática?</strong></summary>

Markdown puro — requisitos com cenários concretos, sem sintaxe especial para aprender. Aqui está o que vai para a pasta `specs/` criada acima:

```markdown
## ADDED Requirements

### Requirement: Seleção de tema
O app SHALL permitir que usuários alternem entre temas claro e escuro,
com a preferência do sistema como padrão.

#### Scenario: Usuário alterna para o dark mode
- **WHEN** o usuário clica no botão de alternância de tema
- **THEN** o app muda para o dark mode e persiste a escolha
```

Sua IA escreve isso; você revisa o plano antes de qualquer código ser escrito.

O BR-OpenSpec é construído com o BR-OpenSpec — navegue pelas [specs](openspec/specs) vivas e pelas [mudanças](openspec/changes) em andamento deste repo para exemplos reais em escala.

</details>

<details>
<summary><strong>Dashboard do BR-OpenSpec</strong></summary>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec dashboard preview" width="90%">
</p>

</details>

## Início Rápido

**Requer Node.js 20.19.0 ou superior.**

Instale o BR-OpenSpec globalmente:

```bash
npm install -g @dynamicworks/br-openspec@latest
```

Em seguida, navegue até o diretório do seu projeto e inicialize:

```bash
cd your-project
openspec init
```

Agora fale com a sua IA:

- **Ainda não sabe o que construir?** Comece com `/opsx:explore`, um parceiro de raciocínio sem risco algum que lê seu código, pesa opções e molda um plano antes que qualquer coisa seja escrita. ([Guia Explore](docs/pt-BR/explore.md))
- **Já sabe o que quer?** Vá direto para `/opsx:propose <o-que-você-quer-construir>`.

Ambos estão no perfil padrão. Se você quiser o fluxo de trabalho expandido (`/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:verify`, `/opsx:code-review`, `/opsx:bulk-archive`, `/opsx:onboard`), selecione-o com `openspec config profile` e aplique com `openspec update`.

> [!NOTE]
> Não tem certeza se sua ferramenta é suportada? [Veja a lista completa](docs/pt-BR/supported-tools.md) – suportamos mais de 25 ferramentas e crescendo.
>
> Também funciona com pnpm, yarn, bun e nix. [Veja as opções de instalação](docs/pt-BR/installation.md).

## Documentação

**Comece aqui:** a **[Home da Documentação](docs/pt-BR/README.md)** mapeia tudo. Novo no BR-OpenSpec? Leia [Primeiros Passos](docs/pt-BR/getting-started.md), depois [Como os Comandos Funcionam](docs/pt-BR/how-commands-work.md) (onde você realmente digita `/opsx:propose`).

→ **[Primeiros Passos](docs/pt-BR/getting-started.md)**: primeiros passos<br>
→ **[Explore Primeiro](docs/pt-BR/explore.md)**: pense com `/opsx:explore` antes de se comprometer<br>
→ **[Como os Comandos Funcionam](docs/pt-BR/how-commands-work.md)**: onde os slash commands rodam vs a CLI<br>
→ **[Conceitos Essenciais em Resumo](docs/pt-BR/overview.md)**: todo o modelo mental, uma página<br>
→ **[Exemplos e Receitas](docs/pt-BR/examples.md)**: mudanças reais, do início ao fim<br>
→ **[Fluxos de Trabalho](docs/pt-BR/workflows.md)**: combinações e padrões<br>
→ **[Projetos Existentes](docs/pt-BR/existing-projects.md)**: adote o BR-OpenSpec numa base de código brownfield<br>
→ **[Editando uma Mudança](docs/pt-BR/editing-changes.md)**: atualize artefatos, volte atrás, reconcilie edições manuais<br>
→ **[Comandos](docs/pt-BR/commands.md)**: slash commands e skills<br>
→ **[CLI](docs/pt-BR/cli.md)**: referência do terminal<br>
→ **[Ferramentas Suportadas](docs/pt-BR/supported-tools.md)**: integrações e caminhos de instalação<br>
→ **[Conceitos](docs/pt-BR/concepts.md)**: como tudo se encaixa<br>
→ **[Multi-Idioma](docs/pt-BR/multi-language.md)**: suporte a múltiplos idiomas<br>
→ **[Personalização](docs/pt-BR/customization.md)**: faça do seu jeito<br>
→ **[FAQ](docs/pt-BR/faq.md)** · **[Solução de Problemas](docs/pt-BR/troubleshooting.md)** · **[Glossário](docs/pt-BR/glossary.md)**: ajuda rápida


## Schemas da comunidade

Bundles de schema de terceiros distribuídos em repositórios independentes — oferecem fluxos de trabalho opinativos que integram o BR-OpenSpec a outras ferramentas, de forma semelhante a como o [catálogo de extensões da comunidade do github/spec-kit](https://github.com/github/spec-kit/tree/main/extensions) trata integrações de ferramentas.

→ **[Veja o catálogo](docs/pt-BR/customization.md#schemas-da-comunidade)** na documentação de personalização.


## Por que o BR-OpenSpec?

Assistentes de codificação com IA são poderosos, mas imprevisíveis quando os requisitos vivem apenas no histórico do chat. O BR-OpenSpec adiciona uma camada leve de especificação para que você concorde sobre o que construir antes de qualquer código ser escrito.

> **Por que este fork?** O BR-OpenSpec é mantido em **Português Brasileiro** e destina-se a quem implementa e mantém projetos com domínios de negócio primariamente em pt-BR, bem como a quem não tem o inglês como língua nativa. Ter specs, propostas e tarefas no idioma do time e do negócio reduz o risco de interpretações erradas e acelera o alinhamento entre humanos e IA.

- **Alinhe antes de construir** — humano e IA alinham as specs antes de o código ser escrito
- **Mantenha-se organizado** — cada mudança tem sua própria pasta com proposta, specs, design e tarefas
- **Trabalhe com fluidez** — atualize qualquer artefato a qualquer momento, sem fases rígidas
- **Use suas ferramentas** — funciona com mais de 20 assistentes de IA via slash commands

### Como nos comparamos

**vs. [Spec Kit](https://github.com/github/spec-kit)** (GitHub) — Completo, mas pesado. Fases rígidas, muito Markdown, configuração em Python. O BR-OpenSpec é mais leve e permite iterar livremente.

**vs. [Kiro](https://kiro.dev)** (AWS) — Poderoso, mas você fica preso à IDE deles e limitado aos modelos Claude. O BR-OpenSpec funciona com as ferramentas que você já usa.

**vs. nada** — Codificação com IA sem specs significa prompts vagos e resultados imprevisíveis. O BR-OpenSpec traz previsibilidade sem a burocracia.

## Atualizando o BR-OpenSpec

**Atualize o pacote**

```bash
npm install -g @dynamicworks/br-openspec@latest
```

**Atualize as instruções do agente**

Execute dentro de cada projeto para regenerar a orientação da IA e garantir que os slash commands mais recentes estejam ativos:

```bash
openspec update
```

**Gerenciar configurações de IDE/Code Agent**

Adicione ou remova integrações de IDE e Code Agent suportadas sem precisar executar `init` novamente:

```bash
openspec tools            # lista interativa
openspec tools --add claude,cursor
openspec tools --remove windsurf
```

## Notas de Uso

**Seleção de modelo**: O BR-OpenSpec funciona melhor com modelos de alto raciocínio. Recomendamos Codex 5.5 e Opus 4.8 tanto para planejamento quanto para implementação.

**Higiene de contexto**: O BR-OpenSpec se beneficia de uma janela de contexto limpa. Limpe seu contexto antes de iniciar a implementação e mantenha uma boa higiene de contexto ao longo da sua sessão.

**Palavras-chave do formato de spec ficam em inglês**: O BR-OpenSpec é PT-BR first, mas o formato de spec é um protocolo lido pelas ferramentas. Os marcadores estruturais (`## ADDED Requirements`, `### Requirement:`, `#### Scenario:`) e as palavras-chave normativas/de cenário (RFC 2119 — `MUST`, `SHALL`, `SHOULD`, `MAY`, … — além de `WHEN`, `THEN`, `AND`, `GIVEN`, `ELSE`) são sempre escritas em inglês e em CAIXA ALTA; apenas o texto descritivo fica em português. Traduzir essas palavras-chave quebra o `openspec validate`. Veja a lista completa em [AGENTS.md](AGENTS.md#reserved-english-terms-never-translate).

## Contribuindo

**Pequenas correções** — Correções de bugs, erros de digitação e melhorias menores podem ser enviadas diretamente como PRs.

**Mudanças maiores** — Para novas funcionalidades, refatorações significativas ou mudanças arquiteturais, envie primeiro uma proposta de mudança do BR-OpenSpec para que possamos alinhar a intenção e os objetivos antes de começar a implementação.

Ao escrever propostas, tenha em mente a filosofia do BR-OpenSpec: servimos a uma grande variedade de usuários em diferentes agentes de codificação, modelos e casos de uso. As mudanças devem funcionar bem para todos.

**Código gerado por IA é bem-vindo** — desde que tenha sido testado e verificado. PRs contendo código gerado por IA devem mencionar o agente de codificação e o modelo usado (ex.: "Gerado com Claude Code usando claude-opus-4-5-20251101").

### Desenvolvimento

- Instalar dependências: `pnpm install`
- Compilar: `pnpm run build`
- Testar: `pnpm test`
- Desenvolver CLI localmente: `pnpm run dev` ou `pnpm run dev:cli`
- Commits convencionais (uma linha): `type(scope): subject`

## Outros

<details>
<summary><strong>Telemetria</strong></summary>

O BR-OpenSpec coleta estatísticas de uso anônimas.

Coletamos apenas nomes de comandos e versão para entender padrões de uso. Sem argumentos, caminhos, conteúdo ou PII. Desativado automaticamente em CI.

**Desativar:** `export OPENSPEC_TELEMETRY=0` ou `export DO_NOT_TRACK=1`

</details>

<details>
<summary><strong>Mantenedores e Consultores</strong></summary>

Veja [MAINTAINERS.md](MAINTAINERS.md) para a lista de mantenedores principais e consultores que ajudam a guiar o projeto.

</details>



## Licença

MIT

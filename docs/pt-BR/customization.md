# Personalização

O BR-OpenSpec oferece três níveis de personalização:

| Nível | O que faz | Ideal para |
|-------|-----------|------------|
| **Configuração de Projeto** | Define padrões, injeta contexto/regras | A maioria das equipes |
| **Schemas Personalizados** | Define seus próprios artefatos de fluxo de trabalho | Equipes com processos únicos |
| **Substituições Globais** | Compartilha schemas entre todos os projetos | Usuários avançados |

---

## Configuração do Projeto

O arquivo `openspec/config.yaml` é a maneira mais fácil de personalizar o BR-OpenSpec para sua equipe. Ele permite:

- **Definir um schema padrão** - Evita usar `--schema` em todo comando
- **Injetar contexto do projeto** - A IA vê sua stack tecnológica, convenções, etc.
- **Adicionar regras por artefato** - Regras personalizadas para artefatos específicos
- **Adicionar orientação por operação** - Preferências consultivas para o trabalho de apply e archive
- **Lembrar escolhas de integração** - por exemplo, o opt-in do [Copilot coding agent (nuvem) do GitHub](supported-tools.md#copilot-coding-agent-nuvem-do-github)

### Configuração Rápida

```bash
openspec init
```

Isso guia você pela criação de uma configuração de forma interativa. Ou crie manualmente:

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  Stack tecnológica: TypeScript, React, Node.js, PostgreSQL
  Estilo de API: RESTful, documentada em docs/api.md
  Testes: Jest + React Testing Library
  Valorizamos compatibilidade retroativa em todas as APIs públicas

rules:
  proposal:
    - Inclua plano de rollback
    - Identifique as equipes afetadas
  specs:
    - Use o formato Given/When/Then
    - Referencie padrões existentes antes de inventar novos

operations:
  apply:
    guidance:
      - Execute testes focados antes da suíte completa
  archive:
    guidance:
      - Mantenha o resumo de conclusão conciso

# Definido pelo `openspec init` quando você escolhe (ou recusa) o Copilot coding
# agent (nuvem) do GitHub; controla se `init`/`update` geram os arquivos dele.
githubCopilot:
  cloudAgent: false
```

### Como Funciona

**Schema padrão:**

```bash
# Sem config
openspec new change my-feature --schema spec-driven

# Com config - schema é automático
openspec new change my-feature
```

**Injeção de contexto e regras:**

Ao gerar qualquer artefato, seu contexto e regras são injetados no prompt da IA:

```xml
<context>
Stack tecnológica: TypeScript, React, Node.js, PostgreSQL
...
</context>

<rules>
- Inclua plano de rollback
- Identifique as equipes afetadas
</rules>

<template>
[Template embutido do schema]
</template>
```

- **Contexto** aparece em TODOS os artefatos
- **Regras** aparecem APENAS para o artefato correspondente

**Orientação da operação:**

`operations.apply.guidance` e `operations.archive.guidance` são arrays
opcionais de instruções consultivas sobre como um agente deve conduzir essas
operações. Elas são separadas de `rules`: a orientação da operação não
restringe o conteúdo de artefatos, e regras de artefato nunca são reclassificadas
como orientação de operação.

Apply e archive buscam essas entradas no momento da execução:

```bash
openspec instructions apply --change my-feature --json
openspec instructions archive --change my-feature --json
```

Ambas as superfícies retornam o `context` atual do projeto e a
`operationGuidance` correspondente como campos opcionais separados. Cada
invocação lê um snapshot novo do projeto atual. O comando de instruções de
arquivamento é somente leitura: ele não inspeciona nem mescla delta specs, não
escreve specs principais, não move a mudança e não executa o workflow estático
de arquivamento.

O contexto do projeto é uma entrada obrigatória em nível de prompt. Os
workflows gerados o leem e aplicam fatos, convenções e restrições relevantes
do projeto. A orientação da operação é um conselho aditivo opcional: os
workflows consideram cada entrada e seguem as que forem aplicáveis e
compatíveis com o workflow embutido.

Ambos os campos permanecem separados do estado controlado pelo CLI, dos
caminhos resolvidos, dos passos embutidos, das escolhas explícitas do usuário
e das regras de artefato. Um workflow reporta conflitos de contexto preservando
o valor controlador. Ele não segue orientação inaplicável ou conflitante e
explica o motivo. Nenhum dos campos é uma verificação imposta, e os workflows
não copiam o texto deles para arquivos de implementação, specs, artefatos da
mudança ou resumos, a menos que o usuário peça separadamente por esse conteúdo.

**Segurança das entradas de arquivamento e sincronização de specs:**

Archive, bulk archive e sync standalone usam
`artifactPaths.specs.existingOutputPaths` do `openspec status --json` como a
única fonte de delta specs. Um schema sem artefato `specs`, ou uma mudança cuja
lista concreta de saídas está vazia, não tem nada para sincronizar; outros
artefatos não são usados para inferir delta specs.

Antes que uma mesclagem semântica escreva um spec principal, o workflow consome
a saída atual de `openspec instructions specs --change <nome> --json`. As
regras de `specs` retornadas restringem apenas os specs principais produzidos
por aquela mesclagem. O arquivamento único passa esse snapshot para o sync
inline, o sync standalone o busca diretamente, e o bulk archive obtém todos os
snapshots necessários antes da primeira escrita de spec. Uma resposta de
instruções de archive/specs com código não-zero ou JSON inválido é uma falha
de consulta, não uma entrada vazia: o workflow para antes da escrita de spec ou
movimentação de mudança afetada (para o bulk archive, antes de qualquer escrita
ou movimentação do lote).

Esta configuração não muda as fases de execução do arquivamento, os prompts ao
usuário, as operações de sistema de arquivos, a propriedade da mesclagem
semântica, o comando direto `openspec archive`, nem a estrutura e a saída das
`rules` de artefato.

### Ordem de Resolução do Schema

Quando o BR-OpenSpec precisa de um schema, ele verifica nesta ordem:

1. Flag CLI: `--schema <name>`
2. Metadados da mudança (`.openspec.yaml` na pasta da mudança)
3. Configuração do projeto (`openspec/config.yaml`)
4. Padrão (`spec-driven`)

---

## Schemas Personalizados

Quando a configuração do projeto não é suficiente, crie seu próprio schema com um fluxo de trabalho completamente personalizado. Schemas personalizados ficam no diretório `openspec/schemas/` do seu projeto e são versionados junto com seu código.

```text
your-project/
├── openspec/
│   ├── config.yaml        # Configuração do projeto
│   ├── schemas/           # Schemas personalizados ficam aqui
│   │   └── my-workflow/
│   │       ├── schema.yaml
│   │       └── templates/
│   └── changes/           # Suas mudanças
└── src/
```

### Bifurcar um Schema Existente

A maneira mais rápida de personalizar é fazer fork de um schema embutido:

```bash
openspec schema fork spec-driven my-workflow
```

Isso copia o schema `spec-driven` inteiro para `openspec/schemas/my-workflow/`, onde você pode editá-lo livremente.

**O que você obtém:**

```text
openspec/schemas/my-workflow/
├── schema.yaml           # Definição do fluxo de trabalho
└── templates/
    ├── proposal.md       # Template para o artefato proposal
    ├── spec.md           # Template para specs
    ├── design.md         # Template para o design
    └── tasks.md          # Template para tasks
```

Agora edite `schema.yaml` para alterar o fluxo de trabalho, ou edite os templates para mudar o que a IA gera.

### Criar um Schema do Zero

Para um fluxo de trabalho completamente novo:

```bash
# Interativo
openspec schema init research-first

# Não interativo
openspec schema init rapid \
  --description "Fluxo de trabalho de iteração rápida" \
  --artifacts "proposal,tasks" \
  --default
```

### Estrutura do Schema

Um schema define os artefatos do seu fluxo de trabalho e como eles dependem uns dos outros:

```yaml
# openspec/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
description: Fluxo de trabalho personalizado da minha equipe

artifacts:
  - id: proposal
    generates: proposal.md
    description: Documento inicial de proposta
    template: proposal.md
    instruction: |
      Crie uma proposta que explique o WHY (por que) esta mudança é necessária.
      Foque no problema, não na solução.
    requires: []

  - id: design
    generates: design.md
    description: Design técnico
    template: design.md
    instruction: |
      Crie um documento de design explicando o HOW (como) implementar.
    requires:
      - proposal    # Não dá para criar o design antes de a proposal existir

  - id: tasks
    generates: tasks.md
    description: Checklist de implementação
    template: tasks.md
    requires:
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
```

**Campos principais:**

| Campo | Finalidade |
|-------|-----------|
| `id` | Identificador único, usado em comandos e regras |
| `generates` | Nome do arquivo de saída (suporta globs como `specs/**/*.md`) |
| `template` | Arquivo de template no diretório `templates/` |
| `instruction` | Instruções para a IA ao criar este artefato |
| `requires` | Dependências — quais artefatos devem existir primeiro |

Liste os artefatos na ordem em que você quer que sejam escritos. O `requires`
decide o que é possível; a ordem da lista `artifacts:` decide o que vem primeiro
quando vários artefatos estão prontos ao mesmo tempo.

### Templates

Templates são arquivos markdown que guiam a IA. Eles são injetados no prompt ao criar aquele artefato.

```markdown
<!-- templates/proposal.md -->
## Why

<!-- Explique a motivação desta mudança. Que problema ela resolve? -->

## What Changes

<!-- Descreva o que vai mudar. Seja específico sobre novas capabilities ou modificações. -->

## Impacto

<!-- Código, APIs, dependências e sistemas afetados -->
```

Templates podem incluir:
- Cabeçalhos de seção que a IA deve preencher
- Comentários HTML com orientações para a IA
- Formatos de exemplo mostrando a estrutura esperada

### Validar Seu Schema

Antes de usar um schema personalizado, valide-o:

```bash
openspec schema validate my-workflow
```

Isso verifica:
- A sintaxe do `schema.yaml` está correta
- Todos os templates referenciados existem
- Não há dependências circulares
- Os IDs dos artefatos são válidos

### Usar Seu Schema Personalizado

Uma vez criado, use seu schema com:

```bash
# Especificar no comando
openspec new change feature --schema my-workflow

# Ou definir como padrão no config.yaml
schema: my-workflow
```

### Depurar a Resolução do Schema

Não tem certeza de qual schema está sendo usado? Verifique com:

```bash
# Ver de onde um schema específico é resolvido
openspec schema which my-workflow

# Listar todos os schemas disponíveis
openspec schema which --all
```

A saída mostra se vem do seu projeto, diretório do usuário ou do pacote:

```text
Schema: my-workflow
Source: project
Path: /caminho/para/projeto/openspec/schemas/my-workflow
```

---

> **Nota:** O BR-OpenSpec também suporta schemas em nível de usuário em `~/.local/share/openspec/schemas/` para compartilhamento entre projetos, mas schemas em nível de projeto em `openspec/schemas/` são recomendados por serem versionados junto com seu código.

---

## Exemplos

### Fluxo de Trabalho de Iteração Rápida

Um fluxo de trabalho mínimo para iterações rápidas:

```yaml
# openspec/schemas/rapid/schema.yaml
name: rapid
version: 1
description: Iteração rápida com mínimo de overhead

artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposta rápida
    template: proposal.md
    instruction: |
      Crie uma proposta breve para esta mudança.
      Foque no o quê e no porquê, pule specs detalhadas.
    requires: []

  - id: tasks
    generates: tasks.md
    description: Checklist de implementação
    template: tasks.md
    requires: [proposal]

apply:
  requires: [tasks]
  tracks: tasks.md
```

### Adicionando um Artefato de Revisão

Faça fork do padrão e adicione uma etapa de revisão:

```bash
openspec schema fork spec-driven with-review
```

Depois edite `schema.yaml` para adicionar:

```yaml
  - id: review
    generates: review.md
    description: Checklist de revisão pré-implementação
    template: review.md
    instruction: |
      Crie um checklist de revisão com base no design.
      Inclua considerações de segurança, desempenho e testes.
    requires:
      - design

  - id: tasks
    # ... configuração de tasks existente ...
    requires:
      - specs
      - design
      - review    # Agora tasks também requer review
```

---

## Schemas da Comunidade

O BR-OpenSpec também suporta schemas mantidos pela comunidade, distribuídos em repositórios independentes. Eles oferecem fluxos de trabalho opinativos que integram o BR-OpenSpec a outras ferramentas ou sistemas, de forma semelhante a como o [catálogo de extensões da comunidade do github/spec-kit](https://github.com/github/spec-kit/tree/main/extensions) funciona para o spec-kit.

Schemas da comunidade não são embutidos no core do BR-OpenSpec — eles vivem em seus próprios repositórios, com sua própria cadência de releases. Para usar um, copie o bundle do schema para o diretório `openspec/schemas/<nome-do-schema>/` do seu projeto (o README de cada repositório traz as instruções de instalação).

| Schema | Mantenedor | Repositório | Descrição |
|--------|-----------|-----------|-------------|
| `intent-driven` | @harikrishnan83 | [intent-driven-dev/openspec-schemas](https://github.com/intent-driven-dev/openspec-schemas/tree/main/openspec/schemas/intent-driven) | Captura a intenção da mudança, o comportamento observável, o design técnico e as decisões arquiteturais duráveis antes da implementação. Adiciona um manifesto de revisão de ADRs local à mudança e grava as decisões qualificadas de longa duração como ADRs imutáveis e passíveis de substituição. |
| `superpowers-bridge` | @JiangWay | [JiangWay/openspec-schemas](https://github.com/JiangWay/openspec-schemas/tree/main/superpowers-bridge) | Integra a governança de artefatos do OpenSpec com as skills de execução do [obra/superpowers](https://github.com/obra/superpowers) (brainstorming, escrita de planos, TDD via subagentes, code review, finalização). Adiciona um artefato `retrospective` orientado a evidências, preenchendo uma lacuna que o Superpowers não cobre nativamente. |
| `nanopm` | @nmrtn | [nmrtn/nanopm](https://github.com/nmrtn/nanopm/tree/main/openspec-schema) | Fluxo PM-first. Roda o pipeline de planejamento do [nanopm](https://github.com/nmrtn/nanopm) (auditoria → estratégia → roadmap → PRD) antes da implementação. Conecta o planejamento de produto ao fluxo de engenharia orientado a specs do BR-OpenSpec. Os artefatos são lidos de `.nanopm/`, se presente — a proposal parte da auditoria, o design da estratégia e as tasks do detalhamento do PRD. |
| `e2e-runbooks` | @Lukk17 | [Lukk17/openspec-schemas](https://github.com/Lukk17/openspec-schemas/tree/master/openspec/schemas/e2e-runbooks) | Runbooks de teste end-to-end no nível da capability. Cada capability ganha uma spec imutável, um template de tasks imutável e um registro de execução com timestamp por execução. As asserções cobrem apenas comportamento observável (status HTTP, corpo da resposta, estado persistido — nunca substrings de log); cada execução registra início/fim em UTC, duração e a melhor estimativa de consumo de tokens de LLM. |
| `anvil` | @jikkujoyce | [jikkujoyce/openspec-schemas](https://github.com/jikkujoyce/openspec-schemas/tree/main/schemas/anvil) | Fluxo spec-driven com disciplina de TDD e uma etapa de revisão adversarial. Fluxo: `proposal` → `specs` → `design` → `review` → `test-plan` → `tasks` → `apply` → `verify`. O `review` é escrito por um revisor de contexto novo e somente leitura (um segundo modelo, quando disponível) e emite uma linha `VERDICT:` dizendo ao agente para condicionar `test-plan`, `tasks` e `apply`; o BR-OpenSpec só verifica se os artefatos existem, então faça o gate valer com seu próprio CI ou hook. O `test-plan` mapeia cada cenário da spec para um teste nomeado e funciona também como um registro red/green que o `verify` audita. |

> Quer contribuir com um schema da comunidade? Abra uma issue com o link do seu repositório, ou envie um PR adicionando uma linha a esta tabela.

---

## Veja Também

- [Referência CLI: Comandos de Schema](cli.md#schema-commands) - Documentação completa dos comandos

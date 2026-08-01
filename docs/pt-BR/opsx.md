# Fluxo de Trabalho OPSX

## O Que É?

O OPSX é agora o fluxo de trabalho padrão do BR-OpenSpec.

É um **fluxo de trabalho fluido e iterativo** para mudanças no BR-OpenSpec. Sem mais fases rígidas — apenas ações que você pode executar a qualquer momento.

## Por Que Existe

O fluxo de trabalho legado do BR-OpenSpec funciona, mas é **engessado**:

- **Instruções estão hardcoded** — enterradas no TypeScript, você não pode alterá-las
- **Tudo ou nada** — um grande comando cria tudo, não dá para testar partes individuais
- **Estrutura fixa** — mesmo fluxo de trabalho para todos, sem personalização
- **Caixa preta** — quando a saída da IA é ruim, você não pode ajustar os prompts

**O OPSX abre isso.** Agora qualquer pessoa pode:

1. **Experimentar com instruções** — editar um template, ver se a IA melhora
2. **Testar de forma granular** — validar as instruções de cada artefato de forma independente
3. **Personalizar fluxos de trabalho** — definir seus próprios artefatos e dependências
4. **Iterar rapidamente** — mudar um template, testar imediatamente, sem rebuild

```
Fluxo de trabalho legado:             OPSX:
┌────────────────────────┐           ┌────────────────────────┐
│  Hardcoded no pacote   │           │  schema.yaml           │◄── Você edita isto
│  (não dá para mudar)   │           │  templates/*.md        │◄── Ou isto
│        ↓               │           │        ↓               │
│  Esperar novo release  │           │  Efeito imediato       │
│        ↓               │           │        ↓               │
│  Torcer para melhorar  │           │  Testar você mesmo     │
└────────────────────────┘           └────────────────────────┘
```

**Isso é para todos:**
- **Equipes** — crie fluxos de trabalho que correspondam à forma como você realmente trabalha
- **Usuários avançados** — ajuste prompts para obter melhores saídas da IA para sua base de código
- **Contribuidores do BR-OpenSpec** — experimente novas abordagens sem precisar de releases

Ainda estamos aprendendo o que funciona melhor. O OPSX nos permite aprender juntos.

## A Experiência do Usuário

**O problema com fluxos de trabalho lineares:**
Você está "na fase de planejamento", depois "na fase de implementação", depois "pronto". Mas o trabalho real não funciona assim. Você implementa algo, percebe que seu design estava errado, precisa atualizar as specs, continua implementando. Fases lineares lutam contra como o trabalho realmente acontece.

**Abordagem do OPSX:**
- **Ações, não fases** — criar, implementar, atualizar, arquivar — faça qualquer uma delas a qualquer momento
- **Dependências são facilitadores** — elas mostram o que é possível, não o que é obrigatório a seguir

```
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
```

## Configuração

```bash
# Garanta que o openspec está instalado — as skills são geradas automaticamente
openspec init
```

Isso cria skills em `.claude/skills/` (ou equivalente) que assistentes de codificação com IA detectam automaticamente.

Por padrão, o BR-OpenSpec usa o perfil de fluxo de trabalho `core` (`propose`, `explore`, `apply`, `update`, `sync`, `archive`). Se você quiser os comandos de fluxo de trabalho expandido (`new`, `continue`, `ff`, `verify`, `code-review`, `bulk-archive`, `onboard`), configure-os com `openspec config profile` e aplique com `openspec update`.

Durante a configuração, você será solicitado a criar uma **configuração de projeto** (`openspec/config.yaml`). Isso é opcional, mas recomendado.

## Configuração do Projeto

A configuração do projeto permite definir padrões e injetar contexto específico do projeto em todos os artefatos.

### Criando a Configuração

A configuração é criada durante `openspec init`, ou manualmente:

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  Stack de tecnologia: TypeScript, React, Node.js
  Convenções de API: RESTful, respostas JSON
  Testes: Vitest para testes unitários, Playwright para e2e
  Estilo: ESLint com Prettier, TypeScript estrito

rules:
  proposal:
    - Incluir plano de rollback
    - Identificar equipes afetadas
  specs:
    - Usar o formato Given/When/Then para os cenários
  design:
    - Incluir diagramas de sequência para fluxos complexos
```

### Campos de Configuração

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `schema` | string | Schema padrão para novas mudanças (ex.: `spec-driven`) |
| `context` | string | Contexto do projeto injetado em todas as instruções de artefatos |
| `rules` | object | Regras por artefato, indexadas pelo ID do artefato |

### Como Funciona

**Precedência do schema** (maior para menor):
1. Flag CLI (`--schema <name>`)
2. Metadados da mudança (`.openspec.yaml` no diretório da mudança)
3. Configuração do projeto (`openspec/config.yaml`)
4. Padrão (`spec-driven`)

**Injeção de contexto:**
- O contexto é adicionado ao início das instruções de cada artefato
- Envolvido em tags `<context>...</context>`
- Ajuda a IA a entender as convenções do seu projeto

**Injeção de regras:**
- As regras são injetadas apenas para os artefatos correspondentes
- Envolvidas em tags `<rules>...</rules>`
- Aparecem após o contexto, antes do template

### IDs de Artefatos por Schema

**spec-driven** (padrão):
- `proposal` — Proposta de mudança
- `specs` — Especificações
- `design` — Design técnico
- `tasks` — Tarefas de implementação

### Validação da Configuração

- IDs de artefatos desconhecidos em `rules` geram avisos
- Nomes de schemas são validados contra os schemas disponíveis
- O contexto tem um limite de tamanho de 50KB
- YAML inválido é reportado com números de linha

### Resolução de Problemas

**"Unknown artifact ID in rules: X"**
- Verifique se os IDs dos artefatos correspondem ao seu schema (veja a lista acima)
- Execute `openspec schemas --json` para ver os IDs dos artefatos de cada schema

**Configuração não está sendo aplicada:**
- Certifique-se de que o arquivo está em `openspec/config.yaml` (não `.yml`)
- Verifique a sintaxe YAML com um validador
- As alterações na configuração têm efeito imediato (sem necessidade de reiniciar)

**Contexto muito grande:**
- O contexto é limitado a 50KB
- Resuma ou faça referência a documentos externos

## Comandos

| Comando | O que faz |
|---------|-----------|
| `/opsx:propose` | Cria uma mudança e gera artefatos de planejamento em uma etapa (caminho rápido padrão) |
| `/opsx:explore` | Pensa em ideias, investiga problemas, esclarece requisitos |
| `/opsx:new` | Inicia um novo scaffold de mudança (fluxo de trabalho expandido) |
| `/opsx:continue` | Cria o próximo artefato (fluxo de trabalho expandido) |
| `/opsx:ff` | Avança rapidamente os artefatos de planejamento (fluxo de trabalho expandido) |
| `/opsx:apply` | Implementa tarefas, atualizando artefatos conforme necessário |
| `/opsx:update` | Revisa os artefatos de planejamento de uma mudança e os mantém coerentes |
| `/opsx:verify` | Valida a implementação contra os artefatos (fluxo de trabalho expandido) |
| `/opsx:code-review` | Revisa diffs, branches, PRs ou arquivos com contexto do projeto (fluxo de trabalho expandido) |
| `/opsx:sync` | Sincroniza specs delta com a principal (fluxo de trabalho padrão, opcional) |
| `/opsx:archive` | Arquiva quando concluído |
| `/opsx:bulk-archive` | Arquiva múltiplas mudanças concluídas (fluxo de trabalho expandido) |
| `/opsx:onboard` | Guia passo a passo por uma mudança completa (fluxo de trabalho expandido) |

## Uso

### Explorar uma ideia
```
/opsx:explore
```
Pense em ideias, investigue problemas, compare opções. Nenhuma estrutura necessária — apenas um parceiro de raciocínio. Quando os insights se cristalizarem, faça a transição para `/opsx:propose` (padrão) ou `/opsx:new`/`/opsx:ff` (expandido).

### Iniciar uma nova mudança
```
/opsx:propose
```
Cria a mudança e gera os artefatos de planejamento necessários antes da implementação.

Se você habilitou fluxos de trabalho expandidos, pode usar alternativamente:

```text
/opsx:new        # apenas o scaffold
/opsx:continue   # criar um artefato por vez
/opsx:ff         # criar todos os artefatos de planejamento de uma vez
```

### Criar artefatos
```
/opsx:continue
```
Mostra o que está pronto para criar com base nas dependências, depois cria um artefato. Use repetidamente para construir sua mudança de forma incremental.

```
/opsx:ff add-dark-mode
```
Cria todos os artefatos de planejamento de uma vez. Use quando você tem uma visão clara do que está construindo.

### Implementar (a parte fluida)
```
/opsx:apply
```
Percorre as tarefas, marcando-as conforme avança. Se você está gerenciando múltiplas mudanças, pode executar `/opsx:apply <name>`; caso contrário, ele deve inferir pela conversa e solicitar que você escolha se não conseguir determinar.

### Atualizando uma mudança
```
/opsx:update add-dark-mode - agora guardamos o tema em um cookie
```
Revisa os artefatos de planejamento existentes da mudança e os mantém coerentes - em qualquer direção (uma edição no design pode repercutir de volta na proposta). Apenas artefatos de planejamento: nunca edita código e nunca cria artefatos faltantes (isso é trabalho do `/opsx:continue`). Toda edição é confirmada com você antes. Se a mudança já foi implementada, ele recomenda `/opsx:apply` para que o código acompanhe o plano revisado. Se a sua revisão muda a *intenção* da mudança, comece do zero - veja [Quando Atualizar vs. Começar do Zero](#quando-atualizar-vs-começar-do-zero).

### Finalizar
```
/opsx:archive   # Move para o arquivo quando concluído (solicita sincronizar as specs se necessário)
```

## Quando Atualizar vs. Começar do Zero

Você sempre pode editar sua proposta ou specs antes da implementação. Mas quando o refinamento se torna "este é um trabalho diferente"?

### O Que uma Proposta Captura

Uma proposta define três coisas:
1. **Intenção** — Qual problema você está resolvendo?
2. **Escopo** — O que está dentro/fora dos limites?
3. **Abordagem** — Como você vai resolver?

A questão é: o que mudou, e em que medida?

### Atualize a Mudança Existente Quando:

**Mesma intenção, execução refinada**
- Você descobre casos extremos que não considerou
- A abordagem precisa de ajustes, mas o objetivo não mudou
- A implementação revela que o design estava ligeiramente errado

**O escopo diminui**
- Você percebe que o escopo completo é muito grande, quer entregar o MVP primeiro
- "Adicionar modo escuro" → "Adicionar alternância de modo escuro (preferência do sistema na v2)"

**Correções baseadas em aprendizado**
- A base de código não está estruturada como você pensava
- Uma dependência não funciona como esperado
- "Usar variáveis CSS" → "Usar o prefixo dark: do Tailwind"

### Inicie uma Nova Mudança Quando:

**A intenção mudou fundamentalmente**
- O problema em si é diferente agora
- "Adicionar modo escuro" → "Adicionar sistema de temas abrangente com cores, fontes e espaçamento personalizados"

**O escopo explodiu**
- A mudança cresceu tanto que é essencialmente um trabalho diferente
- A proposta original ficaria irreconhecível após as atualizações
- "Corrigir bug de login" → "Reescrever sistema de autenticação"

**A original pode ser concluída**
- A mudança original pode ser marcada como "feita"
- O novo trabalho existe por conta própria, não é um refinamento
- Conclua "Adicionar MVP de modo escuro" → Arquivar → Nova mudança "Aprimorar modo escuro"

### As Heurísticas

```
                        ┌─────────────────────────────────────┐
                        │     É o mesmo trabalho?             │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            Mesma intenção?    >50% de sobrep.?   A original pode
            Mesmo problema?    Mesmo escopo?      ser "concluída" sem
                    │                  │          estas mudanças?
                    │                  │                  │
          ┌────────┴────────┐  ┌──────┴──────┐   ┌───────┴───────┐
          │                 │  │             │   │               │
         SIM               NÃO SIM          NÃO NÃO             SIM
          │                 │  │             │   │               │
          ▼                 ▼  ▼             ▼   ▼               ▼
     ATUALIZAR           NOVA ATUALIZAR    NOVA ATUALIZAR      NOVA
```

| Teste | Atualizar | Nova Mudança |
|-------|-----------|--------------|
| **Identidade** | "Mesma coisa, refinada" | "Trabalho diferente" |
| **Sobreposição de escopo** | >50% sobrepõe | <50% sobrepõe |
| **Conclusão** | Não pode ser "feita" sem as mudanças | Pode terminar a original, novo trabalho existe por conta própria |
| **Narrativa** | A cadeia de atualizações conta uma história coerente | Correções confundiriam mais do que esclareceriam |

### O Princípio

> **Atualizar preserva o contexto. Nova mudança proporciona clareza.**
>
> Escolha atualizar quando o histórico do seu raciocínio é valioso.
> Escolha novo quando começar do zero seria mais claro do que corrigir.

Pense como branches do git:
- Continue fazendo commits enquanto trabalha na mesma funcionalidade
- Inicie um novo branch quando for genuinamente um trabalho novo
- Às vezes faça merge de uma funcionalidade parcial e comece do zero para a fase 2

## O Que é Diferente?

| | Legado (`/openspec:proposal`) | OPSX (`/opsx:*`) |
|---|---|---|
| **Estrutura** | Um grande documento de proposta | Artefatos discretos com dependências |
| **Fluxo de trabalho** | Fases lineares: planejar → implementar → arquivar | Ações fluidas — faça qualquer coisa a qualquer momento |
| **Iteração** | Difícil voltar atrás | Atualizar artefatos conforme aprende |
| **Personalização** | Estrutura fixa | Baseado em schema (defina seus próprios artefatos) |

**O insight principal:** o trabalho não é linear. O OPSX para de fingir que é.

## Visão Detalhada da Arquitetura

Esta seção explica como o OPSX funciona internamente e como se compara ao fluxo de trabalho legado.
Os exemplos nesta seção usam o conjunto de comandos expandido (`new`, `continue`, etc.); usuários do `core` padrão podem mapear o mesmo fluxo para `propose → apply → sync → archive`.

### Filosofia: Fases vs. Ações

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE TRABALHO LEGADO                                │
│                  (Travado por Fase, Tudo ou Nada)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│   │     FASE     │ ───► │     FASE     │ ───► │     FASE     │             │
│   │ PLANEJAMENTO │      │IMPLEMENTAÇÃO │      │ ARQUIVAMENTO │             │
│   └──────────────┘      └──────────────┘      └──────────────┘             │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│   /openspec:proposal   /openspec:apply      /openspec:archive              │
│                                                                             │
│   • Cria TODOS os artefatos de uma vez                                     │
│   • Não dá para voltar e atualizar specs durante a implementação           │
│   • Portões de fase forçam progressão linear                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO DE TRABALHO OPSX                                 │
│                      (Ações Fluidas, Iterativo)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌────────────────────────────────────────────┐                 │
│              │           AÇÕES (não fases)                │                 │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► archive │                 │
│              │    │          │           │           │    │                 │
│              │    └──────────┴───────────┴───────────┘    │                 │
│              │           qualquer ordem                   │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • Criar artefatos um por vez OU avançar rapidamente                      │
│   • Atualizar specs/design/tasks durante a implementação                   │
│   • Dependências facilitam o progresso, fases não existem                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquitetura de Componentes

**Fluxo de trabalho legado** usa templates hardcoded em TypeScript:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              COMPONENTES DO FLUXO DE TRABALHO LEGADO                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Templates hardcoded (strings TypeScript)                                  │
│                    │                                                        │
│                    ▼                                                        │
│   Configuradores/adaptadores específicos por ferramenta                     │
│                    │                                                        │
│                    ▼                                                        │
│   Arquivos de comando gerados (.claude/commands/openspec/*.md)              │
│                                                                             │
│   • Estrutura fixa, sem percepção de artefatos                              │
│   • Mudar exige modificação de código + rebuild                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**OPSX** usa schemas externos e um motor de grafo de dependências:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPONENTES DO OPSX                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Definições de schema (YAML)                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  name: spec-driven                                                  │   │
│   │  artifacts:                                                         │   │
│   │    - id: proposal                                                   │   │
│   │      generates: proposal.md                                         │   │
│   │      requires: []              ◄── Dependências                     │   │
│   │    - id: specs                                                      │   │
│   │      generates: specs/**/*.md  ◄── Padrões glob                     │   │
│   │      requires: [proposal]      ◄── Habilita após proposal           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Motor de grafo de artefatos                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Ordenação topológica (ordenação de dependências)                 │   │
│   │  • Detecção de estado (existência no sistema de arquivos)           │   │
│   │  • Geração de instruções ricas (templates + contexto)               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Arquivos de skill (.claude/skills/openspec-*/SKILL.md)                    │
│                                                                             │
│   • Compatível entre editores (Claude Code, Cursor, Devin)                  │
│   • Skills consultam a CLI por dados estruturados                           │
│   • Totalmente personalizável via arquivos de schema                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Grafo de Dependências

Os artefatos formam um grafo acíclico dirigido (DAG). Dependências são **facilitadores**, não portões:

```
                              proposal
                             (nó raiz)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
                 specs                       design
              (requires:                  (requires:
               proposal)                   proposal)
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                               tasks
                           (requires:
                           specs, design)
                                  │
                                  ▼
                          ┌──────────────┐
                          │  FASE APPLY  │
                          │ (requires:   │
                          │  tasks)      │
                          └──────────────┘
```

**Transições de estado:**

```
   BLOQUEADO ──────────────► PRONTO ───────────────► CONCLUÍDO
      │                        │                       │
   Dependências            Todas as deps          Arquivo existe
   faltando                CONCLUÍDAS             no sist. de arquivos
```

### Fluxo de Informações

**Fluxo de trabalho legado** — o agente recebe instruções estáticas:

```
  Usuário: "/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Instruções estáticas:                  │
  │  • Criar proposal.md                    │
  │  • Criar tasks.md                       │
  │  • Criar design.md                      │
  │  • Criar specs/<capability>/spec.md     │
  │                                         │
  │  Sem percepção do que existe ou das     │
  │  dependências entre os artefatos        │
  └─────────────────────────────────────────┘
           │
           ▼
  O agente cria TODOS os artefatos de uma vez
```

**OPSX** — o agente consulta por contexto rico:

```
  Usuário: "/opsx:continue"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Passo 1: Consultar o estado atual                                       │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec status --change "add-auth" --json                      │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "artifacts": [                                                  │  │
  │  │      {"id": "proposal", "status": "done"},                         │  │
  │  │      {"id": "specs", "status": "ready"},      ◄── Primeiro pronto  │  │
  │  │      {"id": "design", "status": "ready"},                          │  │
  │  │      {"id": "tasks", "status": "blocked",                          │  │
  │  │       "missingDeps": ["specs", "design"]}                          │  │
  │  │    ]                                                               │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Passo 2: Obter instruções ricas para o artefato pronto                  │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec instructions specs --change "add-auth" --json          │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "template": "# Specification\n\n## ADDED Requirements...",      │  │
  │  │    "dependencies": [{"id": "proposal", "path": "...", "done": true}│  │
  │  │    "unlocks": ["tasks"]                                            │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Passo 3: Ler dependências → Criar UM artefato → Mostrar o que liberou   │
  └──────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Iteração

**Fluxo de trabalho legado** — difícil de iterar:

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── "Espera, o design está errado"
       │               │
       │               ├── Opções:
       │               │   • Editar arquivos manualmente (quebra o contexto)
       │               │   • Abandonar e começar do zero
       │               │   • Seguir em frente e corrigir depois
       │               │
       │               └── Nenhum mecanismo oficial de "voltar"
       │
       └── Cria TODOS os artefatos de uma vez
```

**OPSX** — iteração natural:

```
  /opsx:new ───► /opsx:continue ───► /opsx:apply ───► /opsx:archive
      │                │                  │
      │                │                  ├── "O design está errado"
      │                │                  │
      │                │                  ▼
      │                │            Basta editar design.md
      │                │            e continuar!
      │                │                  │
      │                │                  ▼
      │                │         /opsx:apply retoma
      │                │         de onde você parou
      │                │
      │                └── Cria UM artefato, mostra o que foi liberado
      │
      └── Faz o scaffold da mudança, aguarda direção
```

### Schemas Personalizados

Crie fluxos de trabalho personalizados usando os comandos de gerenciamento de schema:

```bash
# Criar um novo schema do zero (interativo)
openspec schema init my-workflow

# Ou derivar (fork) um schema existente como ponto de partida
openspec schema fork spec-driven my-workflow

# Validar a estrutura do seu schema
openspec schema validate my-workflow

# Ver de onde um schema é resolvido (útil para depuração)
openspec schema which my-workflow
```

Schemas são armazenados em `openspec/schemas/` (local do projeto, versionado) ou `~/.local/share/openspec/schemas/` (global do usuário).

**Estrutura do schema:**
```
openspec/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md
```

**Exemplo de schema.yaml:**
```yaml
name: research-first
artifacts:
  - id: research        # Adicionado antes da proposal
    generates: research.md
    requires: []

  - id: proposal
    generates: proposal.md
    requires: [research]  # Agora depende de research

  - id: tasks
    generates: tasks.md
    requires: [proposal]
```

**Grafo de Dependências:**
```
   research ──► proposal ──► tasks
```

### Resumo

| Aspecto | Legado | OPSX |
|---------|--------|------|
| **Templates** | TypeScript hardcoded | YAML + Markdown externos |
| **Dependências** | Nenhuma (tudo de uma vez) | DAG com ordenação topológica |
| **Estado** | Modelo mental baseado em fases | Existência no sistema de arquivos |
| **Personalização** | Editar código-fonte, rebuild | Criar schema.yaml |
| **Iteração** | Bloqueada por fases | Fluida, edite qualquer coisa |
| **Suporte a Editores** | Configurador/adaptadores específicos por ferramenta | Diretório único de skills |

## Schemas

Schemas definem quais artefatos existem e suas dependências. Atualmente disponíveis:

- **spec-driven** (padrão): proposal → specs → design → tasks

```bash
# Listar os schemas disponíveis
openspec schemas

# Ver todos os schemas com suas fontes de resolução
openspec schema which --all

# Criar um novo schema de forma interativa
openspec schema init my-workflow

# Derivar (fork) um schema existente para personalização
openspec schema fork spec-driven my-workflow

# Validar a estrutura do schema antes de usar
openspec schema validate my-workflow
```

## Dicas

- Use `/opsx:explore` para pensar em uma ideia antes de se comprometer com uma mudança
- `/opsx:ff` quando você sabe o que quer, `/opsx:continue` quando está explorando
- Durante `/opsx:apply`, se algo estiver errado — corrija o artefato, depois continue
- As tarefas rastreiam o progresso via checkboxes em `tasks.md`
- Verifique o status a qualquer momento: `openspec status --change "name"`

## Feedback

Isso ainda está em desenvolvimento. Isso é intencional — estamos aprendendo o que funciona.

Encontrou um bug? Tem ideias? Abra uma issue no [GitHub](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues).

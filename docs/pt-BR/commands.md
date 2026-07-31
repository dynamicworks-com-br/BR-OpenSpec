# Comandos

Esta é a referência dos comandos slash do BR-OpenSpec. Esses comandos são invocados na interface de chat do seu assistente de codificação com IA (ex.: Claude Code, Cursor, Devin Desktop).

Para padrões de fluxo de trabalho e quando usar cada comando, consulte [Workflows](workflows.md). Para comandos CLI, consulte [CLI](cli.md).

Estas páginas usam `/opsx:<command>` como nome canônico. Algumas ferramentas o escrevem de forma diferente — Cursor e GitHub Copilot registram `/opsx-propose`, o Amazon Q responde a `@opsx-propose`, skills do Codex são `$openspec-propose` — então verifique [Como Invocar](supported-tools.md#como-invocar) para a sua ferramenta. Os arquivos que o BR-OpenSpec gera já usam a forma correta.

## Referência Rápida

### Caminho Rápido Padrão (perfil `core`)

| Comando | Finalidade |
|---------|---------|
| `/opsx:propose` | Criar uma mudança e gerar artefatos de planejamento em um único passo |
| `/opsx:explore` | Explorar ideias antes de se comprometer com uma mudança |
| `/opsx:apply` | Implementar tarefas da mudança |
| `/opsx:update` | Revisar os artefatos de planejamento de uma mudança e mantê-los coerentes |
| `/opsx:sync` | Mesclar delta specs nas specs principais |
| `/opsx:archive` | Arquivar uma mudança concluída |

### Comandos de Fluxo de Trabalho Expandido (seleção de workflow personalizado)

| Comando | Finalidade |
|---------|---------|
| `/opsx:new` | Iniciar uma estrutura inicial para uma nova mudança |
| `/opsx:continue` | Criar o próximo artefato com base nas dependências |
| `/opsx:ff` | Fast-forward: criar todos os artefatos de planejamento de uma vez |
| `/opsx:verify` | Validar se a implementação corresponde aos artefatos |
| `/opsx:code-review` | Revisar diffs, branches, PRs ou arquivos com contexto do projeto |
| `/opsx:bulk-archive` | Arquivar múltiplas mudanças de uma vez |
| `/opsx:onboard` | Tutorial guiado pelo fluxo de trabalho completo |

O perfil global padrão é `core`. Para habilitar os comandos de fluxo de trabalho expandido, execute `openspec config profile`, selecione os workflows e, em seguida, execute `openspec update` no seu projeto.

---

## Referência de Comandos

### `/opsx:propose`

Criar uma nova mudança e gerar artefatos de planejamento em um único passo. Este é o comando de início padrão no perfil `core`.

**Sintaxe:**
```text
/opsx:propose [change-name-or-description]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name-or-description` | Não | Nome em kebab-case ou descrição da mudança em linguagem natural |

**O que faz:**
- Cria `openspec/changes/<change-name>/`
- Gera os artefatos necessários antes da implementação (para `spec-driven`: proposal, specs, design, tasks)
- Para quando a mudança estiver pronta para `/opsx:apply`

**Exemplo:**
```text
Você: /opsx:propose add-dark-mode

IA:   Criado openspec/changes/add-dark-mode/
      ✓ proposal.md
      ✓ specs/ui/spec.md
      ✓ design.md
      ✓ tasks.md
      Pronto para implementação. Execute /opsx:apply.
```

**Dicas:**
- Use para o caminho mais rápido de ponta a ponta
- Se quiser controle passo a passo sobre os artefatos, habilite os workflows expandidos e use `/opsx:new` + `/opsx:continue`

---

### `/opsx:explore`

> **Comece aqui quando estiver em dúvida.** O explore é um parceiro de raciocínio sem risco algum: ele lê sua base de código, compara opções e afia uma ideia difusa em um plano concreto antes que qualquer mudança exista. Ele vem no perfil padrão. Para o argumento completo e mais exemplos, veja o guia [Explore Primeiro](explore.md).

Explorar ideias, investigar problemas e esclarecer requisitos antes de se comprometer com uma mudança.

**Sintaxe:**
```
/opsx:explore [topic]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `topic` | Não | O que você deseja explorar ou investigar |

**O que faz:**
- Abre uma conversa exploratória sem estrutura necessária
- Investiga a base de código para responder perguntas
- Compara opções e abordagens
- Cria diagramas visuais para esclarecer o raciocínio
- Pode transicionar para `/opsx:propose` (padrão) ou `/opsx:new` (fluxo de trabalho expandido) quando as ideias se consolidam

**Exemplo:**
```text
Você: /opsx:explore

IA:   O que você gostaria de explorar?

Você: Como devemos tratar a autenticação para o app mobile?

IA:   Deixe-me investigar a sua configuração de autenticação atual...
      [Analisa a base de código]

      Vejo que você está usando autenticação baseada em sessão no app web.
      Para mobile, temos três opções principais:

      1. Tokens JWT (sem estado, funciona offline)
      2. OAuth2 (se você precisa de login de terceiros)
      3. Estender as sessões atuais (mais simples, mas exige conectividade)

      Sua API já tem CORS configurado. Qual direção interessa a você?

Você: Vamos com JWT. Podemos iniciar uma mudança para isso?

IA:   Quando você quiser. Execute /opsx:propose add-jwt-auth para começar.
```

**Dicas:**
- Use quando os requisitos não estão claros ou você precisa investigar
- Nenhum artefato é criado durante a exploração
- Bom para comparar múltiplas abordagens antes de decidir
- Pode ler arquivos e pesquisar na base de código

---

### `/opsx:new`

Iniciar uma estrutura inicial para uma nova mudança. Cria a pasta da mudança e aguarda que você gere os artefatos com `/opsx:continue` ou `/opsx:ff`.

Este comando faz parte do conjunto de fluxo de trabalho expandido (não incluído no perfil `core` padrão).

**Sintaxe:**
```
/opsx:new [change-name] [--schema <schema-name>]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Nome para a pasta da mudança (solicitado se não fornecido) |
| `--schema` | Não | Schema de fluxo de trabalho a usar (padrão: da configuração ou `spec-driven`) |

**O que faz:**
- Cria o diretório `openspec/changes/<change-name>/`
- Cria o arquivo de metadados `.openspec.yaml` na pasta da mudança
- Exibe o primeiro template de artefato pronto para criação
- Solicita o nome da mudança e o schema se não fornecidos

**O que cria:**
```
openspec/changes/<change-name>/
└── .openspec.yaml    # Metadados da mudança (schema, data de criação)
```

**Exemplo:**
```
Você: /opsx:new add-dark-mode

IA:   Criado openspec/changes/add-dark-mode/
      Schema: spec-driven

      Pronto para criar: proposal
      Use /opsx:continue para criá-lo, ou /opsx:ff para criar todos os artefatos.
```

**Dicas:**
- Use nomes descritivos: `add-feature`, `fix-bug`, `refactor-module`
- Evite nomes genéricos como `update`, `changes`, `wip`
- O schema também pode ser definido na configuração do projeto (`openspec/config.yaml`)

---

### `/opsx:continue`

Criar o próximo artefato na cadeia de dependências. Cria um artefato de cada vez para progresso incremental.

**Sintaxe:**
```
/opsx:continue [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança continuar (inferida do contexto se não fornecida) |

**O que faz:**
- Consulta o grafo de dependência dos artefatos
- Mostra quais artefatos estão prontos versus bloqueados
- Cria o primeiro artefato disponível
- Lê os arquivos de dependência para contexto
- Mostra o que fica disponível após a criação

**Exemplo:**
```
Você: /opsx:continue

IA:   Mudança: add-dark-mode

      Status dos artefatos:
      ✓ proposal    (concluído)
      ◆ specs       (pronto)
      ◆ design      (pronto)
      ○ tasks       (bloqueado - precisa de: specs)

      Criando specs...

      [Lê proposal.md, cria specs com base nos requisitos]

      ✓ Criado openspec/changes/add-dark-mode/specs/ui/spec.md

      Agora disponível: tasks
      Execute /opsx:continue para criar o próximo artefato.
```

**Dicas:**
- Use quando quiser revisar cada artefato antes de prosseguir
- Bom para mudanças complexas onde você quer controle
- Múltiplos artefatos podem ficar prontos simultaneamente
- Você pode editar os artefatos criados antes de continuar

---

### `/opsx:ff`

Avançar rapidamente pela criação de artefatos. Cria todos os artefatos de planejamento de uma vez.

**Sintaxe:**
```
/opsx:ff [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança avançar rapidamente (inferida do contexto se não fornecida) |

**O que faz:**
- Cria todos os artefatos na ordem de dependência
- Acompanha o progresso por meio de uma lista de tarefas
- Para quando todos os artefatos `apply-required` estiverem completos
- Lê cada dependência antes de criar o próximo artefato

**Exemplo:**
```
Você: /opsx:ff add-dark-mode

IA:   Avançando rapidamente add-dark-mode...

      ✓ Criando proposal.md
      ✓ Criando specs/ui/spec.md
      ✓ Criando design.md
      ✓ Criando tasks.md

      Todos os artefatos de planejamento concluídos!
      Pronto para implementação. Execute /opsx:apply para começar.
```

**Dicas:**
- Use quando você tem uma ideia clara do que está construindo
- Mais rápido que `/opsx:continue` para mudanças diretas
- Você ainda pode editar os artefatos depois
- Bom para funcionalidades pequenas a médias

---

### `/opsx:apply`

Implementar tarefas da mudança. Percorre a lista de tarefas, escrevendo código e marcando os itens como concluídos.

**Sintaxe:**
```
/opsx:apply [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança implementar (inferida do contexto se não fornecida) |

**O que faz:**
- Lê `tasks.md` e identifica tarefas incompletas
- Percorre as tarefas uma a uma
- Escreve código, cria arquivos, executa testes conforme necessário
- Marca as tarefas como concluídas com checkboxes `[x]`

**Exemplo:**
```
Você: /opsx:apply

IA:   Implementando add-dark-mode...

      Lendo tasks.md:
      - [ ] 1.1 Criar ThemeContext
      - [ ] 1.2 Adicionar propriedades CSS personalizadas
      - [ ] 1.3 Implementar persistência com localStorage

      Trabalhando em 1.1: Criar ThemeContext...
      [Cria src/context/ThemeContext.tsx]

      ✓ 1.1 Concluído

      Trabalhando em 1.2: Adicionar propriedades CSS personalizadas...
      [Atualiza src/styles/globals.css]

      ✓ 1.2 Concluído
      ...
```

**Dicas:**
- Pode retomar de onde parou se interrompido
- Use para mudanças paralelas especificando o nome da mudança
- O estado de conclusão é rastreado nos checkboxes do `tasks.md`

---

### `/opsx:update`

Revisar os artefatos de planejamento existentes de uma mudança e mantê-los coerentes entre si. Apenas artefatos de planejamento - nunca edita código.

**Sintaxe:**
```
/opsx:update [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança atualizar (inferida do contexto se não fornecida) |

**O que faz:**
- Lê os artefatos da mudança via `openspec status --change <name> --json`
- Aplica a revisão solicitada, ou revisa os artefatos em busca de contradições se você não indicou uma
- Reconcilia os demais artefatos existentes em qualquer direção (uma edição no design pode repercutir de volta na proposta)
- Confirma cada edição com você antes de escrever, um artefato por vez
- Termina recomendando o próximo passo: `/opsx:continue` (artefatos faltando), `/opsx:apply` (levar o plano revisado ao código) ou `/opsx:archive` (tudo concluído)

**Exemplo:**
```
Você: /opsx:update add-dark-mode - agora guardamos o tema em um cookie, não no localStorage

IA:   Lendo os artefatos de add-dark-mode...

      O design referencia localStorage em dois lugares; a tarefa 1.3 cobre
      persistência em localStorage; a proposta não menciona armazenamento.

      Revisões propostas:
      1. design.md - trocar a decisão de localStorage por armazenamento em cookie
      2. tasks.md - reescrever a tarefa 1.3 para persistência em cookie

      Aplicar a revisão 1? (design.md)
```

**Dicas:**
- Ele não cria artefatos faltantes - isso é trabalho do `/opsx:continue`
- Se a mudança já foi implementada, siga com `/opsx:apply` para que o código corresponda ao plano revisado
- Se a sua revisão muda a *intenção* da mudança, comece do zero com uma nova mudança (veja [Quando Atualizar vs. Começar do Zero](opsx.md#quando-atualizar-vs-começar-do-zero))

---

### `/opsx:verify`

Validar que a implementação corresponde aos artefatos da mudança. Verifica completude, correção e coerência.

**Sintaxe:**
```
/opsx:verify [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança verificar (inferida do contexto se não fornecida) |

**O que faz:**
- Verifica três dimensões da qualidade da implementação
- Pesquisa na base de código por evidências de implementação
- Relata problemas categorizados como CRITICAL, WARNING ou SUGGESTION
- Não bloqueia o arquivamento, mas expõe problemas

**Dimensões de verificação:**

| Dimensão | O que valida |
|-----------|-------------------|
| **Completude** | Todas as tarefas concluídas, todos os requisitos implementados, cenários cobertos |
| **Correção** | Implementação corresponde à intenção da spec, casos extremos tratados |
| **Coerência** | Decisões de design refletidas no código, padrões consistentes |

**Exemplo:**
```
Você: /opsx:verify

IA:   Verificando add-dark-mode...

      COMPLETUDE
      ✓ Todas as 8 tarefas em tasks.md estão marcadas
      ✓ Todos os requisitos nas specs têm código correspondente
      ⚠ O cenário "Detecção da preferência do sistema" não tem cobertura de testes

      CORREÇÃO
      ✓ A implementação corresponde à intenção da spec
      ✓ Casos extremos dos cenários são tratados
      ✓ Estados de erro correspondem às definições da spec

      COERÊNCIA
      ✓ Decisões de design refletidas na estrutura do código
      ✓ Convenções de nomenclatura consistentes com design.md
      ⚠ O design menciona "variáveis CSS", mas a implementação usa classes do Tailwind

      RESUMO
      ─────────────────────────────
      Problemas críticos: 0
      Avisos: 2
      Pronto para arquivar: Sim (com avisos)

      Recomendações:
      1. Adicionar teste para a detecção de preferência do sistema
      2. Atualizar design.md para refletir o uso do Tailwind, ou refatorar para usar variáveis CSS
```

**Dicas:**
- Execute antes de arquivar para detectar inconsistências cedo
- Avisos não bloqueiam o arquivamento, mas indicam possíveis problemas
- Bom para revisar o trabalho da IA antes de confirmar
- Pode revelar divergências entre os artefatos e a implementação

---

### `/opsx:code-review`

Revisar código alterado com contexto específico do projeto. Diferente do `/opsx:verify`, este comando pode revisar working tree, staged diff, branch, PR ou arquivos explícitos mesmo quando não existe uma change OpenSpec.

**Sintaxe:**
```
/opsx:code-review [target]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `target` | Não | Branch, PR, diff, working tree, staged changes, caminho de arquivo ou escopo da review |

**O que faz:**
- Lê orientações do projeto como README, AGENTS.md, configuração OpenSpec, docs, manifests e CI
- Infere stack e comandos de validação a partir dos arquivos locais
- Usa artefatos OpenSpec relacionados como contexto extra quando disponíveis
- Reporta findings primeiro, ordenados por severidade com referências de arquivo/linha
- Não modifica arquivos a menos que você peça explicitamente correções

**Dicas:**
- Use antes de commitar, abrir PR ou mesclar mudanças geradas por IA
- Use `/opsx:verify` quando o objetivo for validar uma change OpenSpec nomeada contra seus artefatos

---

### `/opsx:sync`

**Comando opcional.** Mesclar delta specs de uma mudança nas specs principais. O arquivamento pedirá para sincronizar se necessário, portanto, normalmente você não precisa executar isso manualmente.

**Sintaxe:**
```
/opsx:sync [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança sincronizar (inferida do contexto se não fornecida) |

**O que faz:**
- Lê as delta specs da pasta da mudança
- Analisa as seções ADDED/MODIFIED/REMOVED/RENAMED
- Mescla as alterações no diretório principal `openspec/specs/`
- Preserva o conteúdo existente não mencionado no delta
- Não arquiva a mudança (permanece ativa)

**Exemplo:**
```text
Você: /opsx:sync

IA:   Sincronizando as delta specs de add-dark-mode...

      Lendo:  openspec/changes/add-dark-mode/specs/ui/spec.md
      Destino: openspec/specs/ui/spec.md

      Alterações a aplicar:
      ✓ ADDED: requisito Theme Selection (2 cenários)
      ✓ ADDED: requisito Accessibility (1 cenário)

      Mesclando...
      ✓ openspec/specs/ui/spec.md atualizado

      A mudança permanece ativa. Execute /opsx:archive quando estiver pronto para concluir.
```

**Quando usar manualmente:**

| Cenário | Usar sync? |
|----------|-----------|
| Mudança de longa duração, quer specs no principal antes de arquivar | Sim |
| Múltiplas mudanças paralelas precisam das specs base atualizadas | Sim |
| Quer visualizar/revisar a mesclagem separadamente | Sim |
| Mudança rápida, indo direto para o arquivamento | Não (o archive cuida disso) |

**Dicas:**
- O sync é inteligente, não é cópia e cola
- Pode adicionar cenários a requisitos existentes sem duplicar
- A mudança permanece ativa após o sync (não arquivada)
- A maioria dos usuários nunca precisará chamar isso diretamente—o archive solicita se necessário

---

### `/opsx:archive`

Arquivar uma mudança concluída. Finaliza a mudança e a move para a pasta de histórico.

**Sintaxe:**
```
/opsx:archive [change-name]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-name` | Não | Qual mudança arquivar (inferida do contexto se não fornecida) |

**O que faz:**
- Verifica o status de conclusão dos artefatos
- Verifica a conclusão das tarefas (avisa se incompleta)
- Oferece sincronizar as delta specs se ainda não foram sincronizadas
- Move a pasta da mudança para `openspec/changes/archive/YYYY-MM-DD-<name>/`
- Preserva todos os artefatos para auditoria

**Exemplo:**
```text
Você: /opsx:archive

IA:   Arquivando add-dark-mode...

      Status dos artefatos:
      ✓ proposal.md existe
      ✓ specs/ existe
      ✓ design.md existe
      ✓ tasks.md existe (8/8 tarefas concluídas)

      Delta specs: Ainda não sincronizadas
      → Sincronizar agora? (recomendado)

Você: Sim

IA:   ✓ Specs sincronizadas com openspec/specs/ui/spec.md
      ✓ Movido para openspec/changes/archive/2025-01-24-add-dark-mode/

      Mudança arquivada com sucesso.
```

**Dicas:**
- O archive não bloqueará em tarefas incompletas, mas avisará
- As delta specs podem ser sincronizadas durante o arquivamento ou antes
- As mudanças arquivadas são preservadas para o histórico
- Use `/opsx:verify` primeiro para detectar problemas

---

### `/opsx:bulk-archive`

Arquivar múltiplas mudanças concluídas de uma vez. Lida com conflitos de specs entre mudanças.

**Sintaxe:**
```
/opsx:bulk-archive [change-names...]
```

**Argumentos:**
| Argumento | Obrigatório | Descrição |
|----------|----------|-------------|
| `change-names` | Não | Mudanças específicas para arquivar (solicita seleção se não fornecidas) |

**O que faz:**
- Lista todas as mudanças concluídas
- Valida cada mudança antes de arquivar
- Detecta conflitos de specs entre mudanças
- Resolve conflitos verificando o que está realmente implementado
- Arquiva em ordem cronológica

**Exemplo:**
```
Você: /opsx:bulk-archive

IA:   Encontradas 3 mudanças concluídas:
      - add-dark-mode (8/8 tarefas concluídas)
      - fix-login-bug (3/3 tarefas concluídas)
      - update-footer (2/2 tarefas concluídas)

      Verificando conflitos de specs...
      ⚠ add-dark-mode e update-footer tocam ambas em specs/ui/

      Inspecionando a base de código para resolver...
      Ambas as mudanças estão implementadas. Serão mescladas em ordem cronológica:
      1. add-dark-mode (criada em 20 de jan)
      2. update-footer (criada em 22 de jan)

      Arquivar as 3 mudanças?

Você: Sim

IA:   ✓ add-dark-mode arquivada
      ✓ fix-login-bug arquivada
      ✓ update-footer arquivada
      Specs mescladas: add-dark-mode → update-footer
```

**Dicas:**
- Bom para fluxos de trabalho paralelos
- A resolução de conflitos é agêntica (verifica a base de código)
- As mudanças são arquivadas na ordem de criação
- Solicita confirmação antes de sobrescrever conteúdo de spec

---

### `/opsx:onboard`

Integração guiada pelo fluxo de trabalho completo do BR-OpenSpec. Um tutorial interativo usando sua base de código real.

**Sintaxe:**
```
/opsx:onboard
```

**O que faz:**
- Percorre um ciclo completo de fluxo de trabalho com narração
- Escaneia sua base de código em busca de oportunidades reais de melhoria
- Cria uma mudança real com artefatos reais
- Implementa trabalho real (mudanças pequenas e seguras)
- Arquiva a mudança concluída
- Explica cada passo conforme acontece

**Fases:**
1. Boas-vindas e análise da base de código
2. Encontrando uma oportunidade de melhoria
3. Criando uma mudança (`/opsx:new`)
4. Escrevendo a proposta
5. Criando specs
6. Escrevendo o design
7. Criando tarefas
8. Implementando tarefas (`/opsx:apply`)
9. Verificando a implementação
10. Arquivando a mudança
11. Resumo e próximos passos

**Exemplo:**
```
Você: /opsx:onboard

IA:   Bem-vindo ao BR-OpenSpec!

      Vou guiá-lo pelo fluxo de trabalho completo usando a sua própria base de código.
      Vamos encontrar algo pequeno para melhorar, criar uma mudança adequada para isso,
      implementá-la e arquivá-la.

      Deixe-me escanear a sua base de código em busca de oportunidades...

      [Analisa a base de código]

      Encontrei algumas coisas em que poderíamos trabalhar:
      1. Adicionar validação de entrada ao formulário de contato
      2. Melhorar as mensagens de erro no fluxo de autenticação
      3. Adicionar estados de carregamento aos botões assíncronos

      Qual interessa a você? (ou sugira outra coisa)
```

**Dicas:**
- Melhor para novos usuários aprendendo o fluxo de trabalho
- Usa código real, não exemplos simplificados
- Cria uma mudança real que você pode manter ou descartar
- Leva de 15 a 30 minutos para concluir

---

## Sintaxe de Comando por Ferramenta de IA

Diferentes ferramentas de IA usam sintaxes de comando ligeiramente diferentes. Use o formato que corresponde à sua ferramenta:

| Arquivo de comando da sua ferramenta | Exemplo de sintaxe | Ferramentas de exemplo |
|--------------------------------------|--------------------|------------------------|
| `.../commands/opsx/<id>.*` | `/opsx:propose`, `/opsx:apply` | Claude Code, Gemini CLI, Crush |
| `.../opsx-<id>.*` | `/opsx-propose`, `/opsx-apply` | Cursor, Devin Desktop, Copilot (IDE), Codex (prompts globais) |
| `.amazonq/prompts/opsx-<id>.md` | `@opsx-propose`, `@opsx-apply` | Amazon Q Developer |
| nenhum — somente skills | `/openspec-propose`, `/openspec-apply-change` | ForgeCode, Mistral Vibe, Trae, alvo `.agents` compartilhado |
| nenhum — Kimi Code | `/skill:openspec-propose` | Kimi Code |
| skills do Codex | `$openspec-propose` | Codex |

> **Devin Desktop vs Devin Local:** os arquivos `.devin/workflows/opsx-*.md` dão
> ao Devin Desktop o `/opsx-propose`. O Devin Local não tem workflows — use as
> skills que o BR-OpenSpec escreve em `.devin/skills/`, ex.: `/openspec-propose`,
> que funcionam nos dois agentes.

A intenção é a mesma em todas as ferramentas, mas como os comandos são exibidos pode variar por integração. [Como Invocar](supported-tools.md#como-invocar) lista todas as ferramentas suportadas; esta tabela mostra apenas exemplos de cada forma.

> **Nota:** Os comandos do GitHub Copilot (`.github/prompts/*.prompt.md`) estão disponíveis apenas em extensões de IDE (VS Code, JetBrains, Visual Studio). O GitHub Copilot CLI atualmente não suporta arquivos de prompt personalizados — consulte [Ferramentas Suportadas](supported-tools.md) para detalhes e alternativas.

---

## Comandos Legados

Estes comandos usam o fluxo de trabalho mais antigo "tudo de uma vez". Eles ainda funcionam, mas os comandos OPSX são recomendados.

| Comando | O que faz |
|---------|--------------|
| `/openspec:proposal` | Criar todos os artefatos de uma vez (proposal, specs, design, tasks) |
| `/openspec:apply` | Implementar a mudança |
| `/openspec:archive` | Arquivar a mudança |

**Quando usar comandos legados:**
- Projetos existentes usando o fluxo de trabalho antigo
- Mudanças simples onde você não precisa de criação incremental de artefatos
- Preferência pela abordagem tudo ou nada

**Migrando para o OPSX:**
Mudanças legadas podem ser continuadas com comandos OPSX. A estrutura de artefatos é compatível.

---

## Solução de Problemas

### "Change not found"

O comando não conseguiu identificar em qual mudança trabalhar.

**Soluções:**
- Especifique o nome da mudança explicitamente: `/opsx:apply add-dark-mode`
- Verifique se a pasta da mudança existe: `openspec list`
- Verifique se você está no diretório correto do projeto

### "No artifacts ready"

Todos os artefatos estão completos ou bloqueados por dependências ausentes.

**Soluções:**
- Execute `openspec status --change <name>` para ver o que está bloqueando
- Verifique se os artefatos necessários existem
- Crie primeiro os artefatos de dependência ausentes

### "Schema not found"

O schema especificado não existe.

**Soluções:**
- Liste os schemas disponíveis: `openspec schemas`
- Verifique a ortografia do nome do schema
- Crie o schema se for personalizado: `openspec schema init <name>`

### Comandos não reconhecidos

A ferramenta de IA não reconhece os comandos do BR-OpenSpec.

**Soluções:**
- Certifique-se de que o BR-OpenSpec está inicializado: `openspec init`
- Regenere as skills: `openspec update`
- Verifique se o diretório `.claude/skills/` existe (para Claude Code)
- Reinicie sua ferramenta de IA para carregar as novas skills

### Artefatos não sendo gerados corretamente

A IA cria artefatos incompletos ou incorretos.

**Soluções:**
- Adicione contexto do projeto em `openspec/config.yaml`
- Adicione regras por artefato para orientações específicas
- Forneça mais detalhes na descrição da mudança
- Use `/opsx:continue` em vez de `/opsx:ff` para mais controle

---

## Próximos Passos

- [Workflows](workflows.md) - Padrões comuns e quando usar cada comando
- [CLI](cli.md) - Comandos de terminal para gerenciamento e validação
- [Customização](customization.md) - Criar schemas e workflows personalizados

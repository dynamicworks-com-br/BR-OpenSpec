# Migrando para o OPSX

Este guia ajuda você a fazer a transição do fluxo de trabalho legado do BR-OpenSpec para o OPSX. A migração foi projetada para ser suave—seu trabalho existente é preservado, e o novo sistema oferece mais flexibilidade.

## O Que Está Mudando?

O OPSX substitui o antigo fluxo de trabalho baseado em fases por uma abordagem fluida e baseada em ações. Aqui está a principal mudança:

| Aspecto | Legado | OPSX |
|--------|--------|------|
| **Comandos** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` | Padrão: `/opsx:propose`, `/opsx:apply`, `/opsx:sync`, `/opsx:archive` (comandos de fluxo de trabalho expandido opcionais) |
| **Fluxo de trabalho** | Criar todos os artefatos de uma vez | Criar incrementalmente ou tudo de uma vez—sua escolha |
| **Retroceder** | Fases bloqueantes difíceis | Natural—atualize qualquer artefato a qualquer momento |
| **Personalização** | Estrutura fixa | Orientado por schema, totalmente personalizável |
| **Configuração** | `CLAUDE.md` com marcadores + `project.md` | Configuração limpa em `openspec/config.yaml` |

**A mudança de filosofia:** O trabalho não é linear. O OPSX para de fingir que é.

---

## Antes de Começar

### Seu Trabalho Existente Está Seguro

O processo de migração foi projetado com preservação em mente:

- **Mudanças ativas em `openspec/changes/`** — Completamente preservadas. Você pode continuá-las com comandos OPSX.
- **Mudanças arquivadas** — Intocadas. Seu histórico permanece intacto.
- **Specs principais em `openspec/specs/`** — Intocadas. Estas são sua fonte de verdade.
- **Seu conteúdo em CLAUDE.md, AGENTS.md, etc.** — Preservado. Apenas os blocos de marcadores do BR-OpenSpec são removidos; tudo o que você escreveu permanece.

### O Que Será Removido

Apenas os arquivos gerenciados pelo BR-OpenSpec que estão sendo substituídos:

| O quê | Por quê |
|------|-----|
| Diretórios/arquivos de comandos slash legados | Substituídos pelo novo sistema de skills |
| `openspec/AGENTS.md` | Gatilho de fluxo de trabalho obsoleto |
| Marcadores do BR-OpenSpec em `CLAUDE.md`, `AGENTS.md`, etc. | Não são mais necessários |

**Localizações de comandos legados por ferramenta** (exemplos—sua ferramenta pode variar):

- Claude Code: `.claude/commands/openspec/`
- Cursor: `.cursor/commands/openspec-*.md`
- Devin Desktop, anteriormente Windsurf: `.windsurf/workflows/openspec-*.md`
- Cline: `.clinerules/workflows/openspec-*.md`
- Roo: `.roo/commands/openspec-*.md`
- GitHub Copilot: `.github/prompts/openspec-*.prompt.md` (somente extensões de IDE; não suportado no Copilot CLI)
- E outros (Augment, Continue, Amazon Q, etc.)

A migração detecta quais ferramentas você tem configuradas e limpa seus arquivos legados.

A lista de remoção pode parecer longa, mas todos esses arquivos foram criados originalmente pelo BR-OpenSpec. Seu próprio conteúdo nunca é excluído.

### O Que Precisa da Sua Atenção

Um arquivo requer migração manual:

**`openspec/project.md`** — Este arquivo não é excluído automaticamente porque pode conter contexto do projeto que você escreveu. Você precisará:

1. Revisar seu conteúdo
2. Mover contexto útil para `openspec/config.yaml` (veja as orientações abaixo)
3. Excluir o arquivo quando estiver pronto

**Por que fizemos essa mudança:**

O antigo `project.md` era passivo—os agentes podiam lê-lo, ou não, ou esquecer o que leram. Descobrimos que a confiabilidade era inconsistente.

O contexto do novo `config.yaml` é **ativamente injetado em cada requisição de planejamento do BR-OpenSpec**. Isso significa que as convenções do seu projeto, tech stack e regras estão sempre presentes quando a IA está criando artefatos. Maior confiabilidade.

**A troca:**

Como o contexto é injetado em cada requisição, você vai querer ser conciso. Foque no que realmente importa:
- Tech stack e convenções principais
- Restrições não óbvias que a IA precisa saber
- Regras que frequentemente eram ignoradas antes

Não se preocupe em acertar de primeira. Ainda estamos aprendendo o que funciona melhor aqui, e continuaremos melhorando como a injeção de contexto funciona conforme experimentamos.

---

## Executando a Migração

Tanto `openspec init` quanto `openspec update` detectam arquivos legados e guiam você pelo mesmo processo de limpeza. Use o que melhor se adaptar à sua situação:

- Novas instalações padrão ao perfil `core` (`propose`, `explore`, `apply`, `sync`, `archive`).
- Instalações migradas preservam seus fluxos de trabalho instalados anteriormente gravando um perfil `custom` quando necessário.

### Usando `openspec init`

Execute isso se quiser adicionar novas ferramentas ou reconfigurar quais ferramentas estão configuradas:

```bash
openspec init
```

O comando init detecta arquivos legados e guia você pelo processo de limpeza:

```
Atualizando para o novo BR-OpenSpec

O BR-OpenSpec agora usa agent skills, o padrão emergente entre os
agentes de codificação. Isso simplifica sua configuração mantendo
tudo funcionando como antes.

Arquivos a remover
Nenhum conteúdo de usuário a preservar:
  • .claude/commands/openspec/
  • openspec/AGENTS.md

Arquivos a atualizar
Os marcadores do BR-OpenSpec serão removidos, seu conteúdo preservado:
  • CLAUDE.md
  • AGENTS.md

Precisa da sua atenção
  • openspec/project.md
    Não vamos excluir este arquivo. Ele pode conter contexto útil do projeto.

    O novo openspec/config.yaml tem uma seção "context:" para contexto de
    planejamento. Ele é incluído em cada requisição do BR-OpenSpec e funciona
    de forma mais confiável que a antiga abordagem do project.md.

    Revise o project.md, mova qualquer conteúdo útil para a seção context do
    config.yaml e depois exclua o arquivo quando estiver pronto.

? Atualizar e limpar os arquivos legados? (Y/n)
```

**O que acontece quando você diz sim:**

1. Os diretórios de comandos slash legados são removidos
2. Os marcadores do BR-OpenSpec são removidos de `CLAUDE.md`, `AGENTS.md`, etc. (seu conteúdo permanece)
3. `openspec/AGENTS.md` é excluído
4. Novas skills são instaladas em `.claude/skills/`
5. `openspec/config.yaml` é criado com um schema padrão

### Usando `openspec update`

Execute isso se quiser apenas migrar e atualizar suas ferramentas existentes para a versão mais recente:

```bash
openspec update
```

O comando update também detecta e limpa artefatos legados, depois atualiza as skills/comandos gerados para corresponder ao seu perfil atual e configurações de entrega.

### Ambientes Não Interativos / CI

Para migrações automatizadas:

```bash
openspec init --force --tools claude
```

O flag `--force` pula as solicitações e aceita automaticamente a limpeza.

---

## Migrando project.md para config.yaml

O antigo `openspec/project.md` era um arquivo markdown de formato livre para contexto do projeto. O novo `openspec/config.yaml` é estruturado e—fundamentalmente—**injetado em cada requisição de planejamento** para que suas convenções estejam sempre presentes quando a IA trabalha.

### Antes (project.md)

```markdown
# Contexto do Projeto

Este é um monorepo TypeScript usando React e Node.js.
Usamos Jest para testes e seguimos regras estritas do ESLint.
Nossa API é RESTful e documentada em docs/api.md.

## Convenções

- Todas as APIs públicas devem manter compatibilidade retroativa
- Novas funcionalidades devem incluir testes
- Use o formato Given/When/Then para especificações
```

### Depois (config.yaml)

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  Testes: Jest com React Testing Library
  API: RESTful, documentada em docs/api.md
  Mantemos compatibilidade retroativa para todas as APIs públicas

rules:
  proposal:
    - Inclua plano de rollback para mudanças arriscadas
  specs:
    - Use o formato Given/When/Then para cenários
    - Referencie padrões existentes antes de inventar novos
  design:
    - Inclua diagramas de sequência para fluxos complexos
```

### Principais Diferenças

| project.md | config.yaml |
|------------|-------------|
| Markdown de formato livre | YAML estruturado |
| Um bloco único de texto | Contexto separado e regras por artefato |
| Incerto quando é usado | O contexto aparece em TODOS os artefatos; as regras aparecem apenas nos artefatos correspondentes |
| Sem seleção de schema | O campo explícito `schema:` define o fluxo de trabalho padrão |

### O Que Manter, O Que Descartar

Ao migrar, seja seletivo. Pergunte a si mesmo: "A IA precisa disso para *cada* requisição de planejamento?"

**Bons candidatos para `context:`**
- Tech stack (linguagens, frameworks, bancos de dados)
- Padrões arquiteturais principais (monorepo, microsserviços, etc.)
- Restrições não óbvias ("não podemos usar a biblioteca X porque...")
- Convenções críticas que frequentemente são ignoradas

**Mova para `rules:` em vez disso**
- Formatação específica de artefato ("use Given/When/Then nas specs")
- Critérios de revisão ("propostas devem incluir planos de rollback")
- Eles aparecem apenas para o artefato correspondente, mantendo outras requisições mais leves

**Omita completamente**
- Boas práticas gerais que a IA já conhece
- Explicações detalhadas que poderiam ser resumidas
- Contexto histórico que não afeta o trabalho atual

### Passos da Migração

1. **Crie o config.yaml** (se ainda não foi criado pelo init):
   ```yaml
   schema: spec-driven
   ```

2. **Adicione seu contexto** (seja conciso—isso vai em cada requisição):
   ```yaml
   context: |
     O panorama do seu projeto vai aqui.
     Foque no que a IA genuinamente precisa saber.
   ```

3. **Adicione regras por artefato** (opcional):
   ```yaml
   rules:
     proposal:
       - Sua orientação específica de proposal
     specs:
       - Suas regras de escrita de specs
   ```

4. **Exclua o project.md** depois de ter movido tudo o que é útil.

**Não complique.** Comece com o essencial e itere. Se perceber que a IA está perdendo algo importante, adicione. Se o contexto parecer inflado, reduza. Este é um documento vivo.

### Precisa de Ajuda? Use Este Prompt

Se não tiver certeza de como condensar seu project.md, pergunte ao seu assistente de IA:

```
Estou migrando do antigo project.md do BR-OpenSpec para o novo formato config.yaml.

Aqui está o meu project.md atual:
[cole aqui o conteúdo do seu project.md]

Ajude-me a criar um config.yaml com:
1. Uma seção `context:` concisa (é injetada em toda requisição de planejamento, então seja enxuto — foque em stack tecnológica, restrições principais e convenções que costumam ser ignoradas)
2. `rules:` para artefatos específicos, se houver conteúdo voltado a um artefato (ex.: "use Given/When/Then" vai em regras de specs, não no contexto global)

Elimine qualquer coisa genérica que os modelos de IA já conheçam. Seja implacável com a brevidade.
```

A IA ajudará você a identificar o que é essencial versus o que pode ser removido.

---

## Os Novos Comandos

A disponibilidade de comandos depende do perfil:

**Padrão (perfil `core`):**

| Comando | Finalidade |
|---------|---------|
| `/opsx:propose` | Criar uma mudança e gerar artefatos de planejamento em um único passo |
| `/opsx:explore` | Explorar ideias sem estrutura |
| `/opsx:apply` | Implementar tarefas do tasks.md |
| `/opsx:archive` | Finalizar e arquivar a mudança |

**Fluxo de trabalho expandido (seleção personalizada):**

| Comando | Finalidade |
|---------|---------|
| `/opsx:new` | Iniciar uma estrutura inicial para uma nova mudança |
| `/opsx:continue` | Criar o próximo artefato (um de cada vez) |
| `/opsx:ff` | Fast-forward—criar artefatos de planejamento de uma vez |
| `/opsx:verify` | Validar se a implementação corresponde às specs |
| `/opsx:code-review` | Revisar diffs, branches, PRs ou arquivos com contexto do projeto |
| `/opsx:sync` | Mesclar delta specs nas specs principais |
| `/opsx:bulk-archive` | Arquivar múltiplas mudanças de uma vez |
| `/opsx:onboard` | Fluxo de trabalho de integração guiado de ponta a ponta |

Habilite os comandos expandidos com `openspec config profile`, depois execute `openspec update`.

### Mapeamento de Comandos do Legado

| Legado | Equivalente OPSX |
|--------|-----------------|
| `/openspec:proposal` | `/opsx:propose` (padrão) ou `/opsx:new` seguido de `/opsx:ff` (expandido) |
| `/openspec:apply` | `/opsx:apply` |
| `/openspec:archive` | `/opsx:archive` |

### Novas Capacidades

Estas capacidades fazem parte do conjunto de comandos de fluxo de trabalho expandido.

**Criação granular de artefatos:**
```
/opsx:continue
```
Cria um artefato de cada vez com base nas dependências. Use isso quando quiser revisar cada passo.

**Modo de exploração:**
```
/opsx:explore
```
Explore ideias com um parceiro antes de se comprometer com uma mudança.

---

## Entendendo a Nova Arquitetura

### De Fases Bloqueadas para Fluido

O fluxo de trabalho legado forçava uma progressão linear:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ PLANEJAMENTO │ ───► │ IMPLEMENTAÇÃO│ ───► │  ARQUIVAMENTO│
│     FASE     │      │     FASE     │      │     FASE     │
└──────────────┘      └──────────────┘      └──────────────┘

Está na implementação e percebe que o design está errado?
Que pena. Os portões de fase não deixam você voltar facilmente.
```

O OPSX usa ações, não fases:

```
         ┌───────────────────────────────────────────────┐
         │           AÇÕES (não fases)                   │
         │                                               │
         │     new ◄──► continue ◄──► apply ◄──► archive │
         │      │          │           │             │   │
         │      └──────────┴───────────┴─────────────┘   │
         │                qualquer ordem                 │
         └───────────────────────────────────────────────┘
```

### Grafo de Dependências

Os artefatos formam um grafo dirigido. As dependências são habilitadores, não bloqueadores:

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
```

Quando você executa `/opsx:continue`, ele verifica o que está pronto e oferece o próximo artefato. Você também pode criar múltiplos artefatos prontos em qualquer ordem.

### Skills vs Comandos

O sistema legado usava arquivos de comandos específicos por ferramenta:

```
.claude/commands/openspec/
├── proposal.md
├── apply.md
└── archive.md
```

O OPSX usa o padrão emergente de **skills**:

```
.claude/skills/
├── openspec-explore/SKILL.md
├── openspec-new-change/SKILL.md
├── openspec-continue-change/SKILL.md
├── openspec-apply-change/SKILL.md
└── ...
```

As skills são reconhecidas em múltiplas ferramentas de codificação com IA e fornecem metadados mais ricos.

---

## Continuando Mudanças Existentes

Suas mudanças em andamento funcionam perfeitamente com os comandos OPSX.

**Tem uma mudança ativa do fluxo de trabalho legado?**

```
/opsx:apply add-my-feature
```

O OPSX lê os artefatos existentes e continua de onde você parou.

**Quer adicionar mais artefatos a uma mudança existente?**

```
/opsx:continue add-my-feature
```

Mostra o que está pronto para criar com base no que já existe.

**Precisa ver o status?**

```bash
openspec status --change add-my-feature
```

---

## O Novo Sistema de Configuração

### Estrutura do config.yaml

```yaml
# Obrigatório: schema padrão para novas mudanças
schema: spec-driven

# Opcional: contexto do projeto (máx. 50KB)
# Injetado em TODAS as instruções de artefato
context: |
  O panorama do seu projeto, tech stack,
  convenções e restrições.

# Opcional: regras por artefato
# Injetadas apenas nos artefatos correspondentes
rules:
  proposal:
    - Inclua plano de rollback
  specs:
    - Use o formato Given/When/Then
  design:
    - Documente estratégias de fallback
  tasks:
    - Divida em blocos de no máximo 2 horas
```

### Resolução de Schema

Ao determinar qual schema usar, o OPSX verifica na seguinte ordem:

1. **Flag CLI**: `--schema <name>` (maior prioridade)
2. **Metadados da mudança**: `.openspec.yaml` no diretório da mudança
3. **Configuração do projeto**: `openspec/config.yaml`
4. **Padrão**: `spec-driven`

### Schemas Disponíveis

| Schema | Artefatos | Melhor Para |
|--------|-----------|----------|
| `spec-driven` | proposal → specs → design → tasks | A maioria dos projetos |

Listar todos os schemas disponíveis:

```bash
openspec schemas
```

### Schemas Personalizados

Crie seu próprio fluxo de trabalho:

```bash
openspec schema init my-workflow
```

Ou faça um fork de um existente:

```bash
openspec schema fork spec-driven my-workflow
```

Consulte [Customização](customization.md) para detalhes.

---

## Solução de Problemas

### "Arquivos legados detectados em modo não interativo" ("Legacy files detected in non-interactive mode")

Você está executando em um ambiente CI ou não interativo. Use:

```bash
openspec init --force
```

### Comandos não aparecem após a migração

Reinicie sua IDE. As skills são detectadas na inicialização.

### "ID de artefato desconhecido em rules" ("Unknown artifact ID in rules")

Verifique se as chaves de `rules:` correspondem aos IDs de artefatos do seu schema:

- **spec-driven**: `proposal`, `specs`, `design`, `tasks`

Execute isso para ver os IDs de artefatos válidos:

```bash
openspec schemas --json
```

### Configuração não está sendo aplicada

1. Certifique-se de que o arquivo está em `openspec/config.yaml` (não `.yml`)
2. Valide a sintaxe YAML
3. As alterações de configuração entram em vigor imediatamente—sem necessidade de reiniciar

### project.md não migrado

O sistema preserva intencionalmente o `project.md` porque pode conter seu conteúdo personalizado. Revise-o manualmente, mova as partes úteis para `config.yaml` e depois exclua-o.

### Quer ver o que seria limpo?

Execute o init e recuse o prompt de limpeza—você verá o resumo completo de detecção sem que nenhuma alteração seja feita.

---

## Referência Rápida

### Arquivos Após a Migração

```
project/
├── openspec/
│   ├── specs/                    # Inalterado
│   ├── changes/                  # Inalterado
│   │   └── archive/              # Inalterado
│   └── config.yaml               # NOVO: Configuração do projeto
├── .claude/
│   └── skills/                   # NOVO: Skills OPSX
│       ├── openspec-propose/     # perfil core padrão
│       ├── openspec-explore/
│       ├── openspec-apply-change/
│       ├── openspec-sync-specs/
│       └── ...                   # perfil expandido adiciona new/continue/ff/etc.
├── CLAUDE.md                     # Marcadores do BR-OpenSpec removidos, seu conteúdo preservado
└── AGENTS.md                     # Marcadores do BR-OpenSpec removidos, seu conteúdo preservado
```

### O Que Foi Removido

- `.claude/commands/openspec/` — substituído por `.claude/skills/`
- `openspec/AGENTS.md` — obsoleto
- `openspec/project.md` — migre para `config.yaml`, depois exclua
- Blocos de marcadores do BR-OpenSpec em `CLAUDE.md`, `AGENTS.md`, etc.

### Guia Rápido de Comandos

```text
/opsx:propose      Iniciar rapidamente (perfil core padrão)
/opsx:apply        Implementar tarefas
/opsx:archive      Finalizar e arquivar

# Fluxo de trabalho expandido (se habilitado):
/opsx:new          Criar estrutura inicial para uma mudança
/opsx:continue     Criar próximo artefato
/opsx:ff           Criar artefatos de planejamento
```

---

## Obtendo Ajuda

- **GitHub Issues**: [github.com/fkmatsuda/BR-OpenSpec/issues](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues)
- **Documentação**: [docs/opsx.md](opsx.md) para a referência completa do OPSX

---
name: openspec-onboard
description: Onboarding guiado para o BR-OpenSpec - percorra um ciclo completo de workflow com narração e trabalho real na codebase. Use também quando o usuário disser "openspec onboard" ou "opsx onboard".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---


Guie o usuário através de seu primeiro ciclo completo de workflow do BR-OpenSpec. Esta é uma experiência de ensino - você fará trabalho real na codebase dele enquanto explica cada passo.

**Verificação do projeto:** Estes passos esperam um projeto que já usa o BR-OpenSpec. Antes do primeiro passo que escreve qualquer coisa (`new change`, `archive`, `sync specs` ou a autoria de um arquivo de artifact), confirme que o projeto tem uma raiz: execute `openspec list --json` e leia `root`. Um objeto root significa que o projeto está configurado. `"root": null` significa que não está — não há diretório `openspec/` aqui, e uma escrita como `openspec new change` criaria um como efeito colateral. O comando também sai com código diferente de zero, e isso é essa resposta, não um CLI quebrado: leia o JSON em vez de tentar de novo ou contornar.

Sem raiz, o que acontece em seguida depende de como este workflow foi alcançado:

- **Selecionado automaticamente**: você escolheu este workflow sozinho, sem o usuário nomear o BR-OpenSpec, nomear esta skill ou executar o slash command dela. Pare de usar o BR-OpenSpec e responda à solicitação normalmente, como faria sem o BR-OpenSpec instalado. Não peça para configurar nada e não mencione a configuração do BR-OpenSpec.
- **Solicitação explícita do BR-OpenSpec**: o usuário nomeou o BR-OpenSpec, nomeou esta skill ou executou o slash command dela. Pare antes de escrever e pergunte como prosseguir: configurar este projeto (`openspec init`) ou continuar sem o BR-OpenSpec nesta solicitação. Aguarde a resposta.

Nos dois ramos, nunca crie a raiz como efeito colateral: não execute `openspec init` até o usuário pedir, não crie arquivos `openspec/` à mão e não deixe um comando criá-la.

---

## Pré-voo

Antes de começar, verifique se o CLI do BR-OpenSpec está instalado. Use o bloco adequado ao SO do usuário:

```bash
# Unix/macOS
openspec --version 2>&1 || echo "CLI_NOT_INSTALLED"
```

```powershell
# Windows (PowerShell)
if (Get-Command openspec -ErrorAction SilentlyContinue) { openspec --version } else { Write-Output "CLI_NOT_INSTALLED" }
```

**Se o CLI não estiver instalado:**
> O CLI do BR-OpenSpec não está instalado. Instale-o primeiro, depois volte para `/openspec-onboard`.

Pare aqui se não estiver instalado.

---

## Fase 1: Boas-vindas

Exiba:

```
## Bem-vindo ao BR-OpenSpec!

Eu vou te guiar através de um ciclo completo de change - da ideia à implementação - usando uma tarefa real na sua codebase. Ao longo do caminho, você aprenderá o workflow fazendo.

**O que faremos:**
1. Escolher uma tarefa pequena e real na sua codebase
2. Explorar o problema brevemente
3. Criar uma change (o container para nosso trabalho)
4. Construir os artifacts: proposal → specs → design → tasks
5. Implementar as tarefas
6. Arquivar a change concluída

**Tempo:** ~15-20 minutos

Vamos começar encontrando algo para trabalhar.
```

---

## Fase 2: Seleção de Tarefa

### Análise da Codebase

Escaneie a codebase em busca de pequenas oportunidades de melhoria. Procure por:

1. **Comentários TODO/FIXME** - Pesquise por `TODO`, `FIXME`, `HACK`, `XXX` em arquivos de código
2. **Tratamento de erros ausente** - Blocos `catch` que engolem erros, operações arriscadas sem try-catch
3. **Funções sem testes** - Relacione `src/` com diretórios de teste
4. **Problemas de tipos** - Tipos `any` em arquivos TypeScript (`: any`, `as any`)
5. **Artifacts de debug** - Declarações `console.log`, `console.debug`, `debugger` em código não-debug
6. **Validação ausente** - Handlers de entrada de usuário sem validação

Verifique também a atividade recente do git:
```bash
# Unix/macOS
git log --oneline -10 2>/dev/null || echo "Sem histórico git"
# Windows (PowerShell)
# git log --oneline -10 2>$null; if ($LASTEXITCODE -ne 0) { echo "Sem histórico git" }
```

### Apresente Sugestões

A partir da sua análise, apresente 3-4 sugestões específicas:

```
## Sugestões de Tarefas

Com base no escaneamento da sua codebase, aqui estão algumas boas tarefas iniciais:

**1. [Tarefa mais promissora]**
   Local: `src/caminho/para/arquivo.ts:42`
   Escopo: ~1-2 arquivos, ~20-30 linhas
   Por que é boa: [breve razão]

**2. [Segunda tarefa]**
   Local: `src/outro/arquivo.ts`
   Escopo: ~1 arquivo, ~15 linhas
   Por que é boa: [breve razão]

**3. [Terceira tarefa]**
   Local: [local]
   Escopo: [estimativa]
   Por que é boa: [breve razão]

**4. Outra coisa?**
   Me diga no que você gostaria de trabalhar.

Qual tarefa te interessa? (Escolha um número ou descreva a sua)
```

**Se nada for encontrado:** Volte a perguntar o que o usuário quer construir:
> Não encontrei vitórias rápidas óbvias na sua codebase. Qual é algo pequeno que você vem querendo adicionar ou corrigir?

### Guardrail de Escopo

Se o usuário escolher ou descrever algo muito grande (funcionalidade principal, trabalho de vários dias):

```
Essa é uma tarefa valiosa, mas provavelmente maior do que o ideal para sua primeira execução do BR-OpenSpec.

Para aprender o workflow, menor é melhor - permite ver o ciclo completo sem ficar preso em detalhes de implementação.

**Opções:**
1. **Fatiar menor** - Qual é a menor peça útil de [tarefa dele]? Talvez apenas [fatia específica]?
2. **Escolher outra coisa** - Uma das outras sugestões, ou uma tarefa pequena diferente?
3. **Fazer assim mesmo** - Se você realmente quiser encarar isso, podemos. Só saiba que vai demorar mais.

O que você prefere?
```

Deixe o usuário sobrepor se insistir - este é um guardrail suave.

---

## Fase 3: Demonstração do Explore

Uma vez que uma tarefa seja selecionada, demonstre brevemente o modo explore:

```
Antes de criarmos uma change, deixe-me rapidamente te mostrar o **modo explore** - é como você pensa sobre problemas antes de se comprometer com uma direção.
```

Gaste 1-2 minutos investigando o código relevante:
- Leia o(s) arquivo(s) envolvido(s)
- Desenhe um diagrama ASCII rápido se ajudar
- Note quaisquer considerações

```
## Exploração Rápida

[Sua breve análise - o que você encontrou, quaisquer considerações]

┌─────────────────────────────────────────┐
│   [Opcional: diagrama ASCII se útil]    │
└─────────────────────────────────────────┘

O modo explore (`/openspec-explore`) é para esse tipo de pensamento - investigar antes de implementar. Você pode usá-lo a qualquer momento que precisar pensar sobre um problema.

Agora vamos criar uma change para conter nosso trabalho.
```

**PAUSA** - Aguarde confirmação do usuário antes de prosseguir.

---

## Fase 4: Criar a Change

**EXPLIQUE:**
```
## Criando uma Change

Uma "change" no BR-OpenSpec é um container para todo o pensamento e planejamento em torno de uma peça de trabalho. Ela fica no `changeRoot` reportado por `openspec status --change "<nome>" --json` e armazena seus artifacts - proposal, specs, design, tasks.

Deixe-me criar uma para nossa tarefa.
```

**FAÇA:** Crie a change com um nome kebab-case derivado:
```bash
openspec new change "<nome-derivado>"
```

**MOSTRE:**
```
Criado: <changeRoot do JSON de status>

A estrutura de pastas:
```
<changeRoot>/
├── proposal.md    ← Por que estamos fazendo isso (vazio, vamos preencher)
├── design.md      ← Como vamos construir (vazio)
├── specs/         ← Requisitos detalhados (vazio)
└── tasks.md       ← Checklist de implementação (vazio)
```

Agora vamos preencher o primeiro artifact - a proposal.
```

---

## Fase 5: Proposal

**EXPLIQUE:**
```
## A Proposal

A proposal captura **por que** estamos fazendo esta change e **o que** ela envolve em alto nível. É o "pitch de elevador" para o trabalho.

Vou elaborar uma com base na nossa tarefa.
```

**FAÇA:** Elabore o conteúdo da proposal (ainda não salve):

`<capability-path>` é o diretório do spec relativo a `specs/` (por exemplo,
`user-auth` ou `identity/user-auth`). Use o caminho exato existente para capabilities
modificadas. Para capabilities novas, siga a organização de specs já estabelecida no
projeto.

```
Aqui está um rascunho de proposal:

---

# Proposal

## Why

[1-2 frases explicando o problema/oportunidade]

## What Changes

[Bullet points do que será diferente]

## Capabilities

### New Capabilities
- `<capability-path>`: [breve descrição]

### Modified Capabilities
<!-- Se modificar comportamento existente -->
- `<existing-capability-path>`: [breve descrição]

## Impact

- `src/caminho/para/arquivo.ts`: [o que muda]
- [outros arquivos se aplicável]

---

Isso captura a intenção? Posso ajustar antes de salvá-la.
```

**PAUSA** - Aguarde aprovação/feedback do usuário.

Após aprovação, salve a proposal:
```bash
openspec instructions proposal --change "<nome>" --json
```
Depois escreva o conteúdo no `resolvedOutputPath` de `openspec instructions proposal --change "<nome>" --json`.

```
Proposal salva. Este é seu documento de "por que" - você sempre pode voltar e refiná-lo à medida que o entendimento evolui.

Próximo: specs.
```

---

## Fase 6: Specs

**EXPLIQUE:**
```
## Specs

Os specs definem **o que** estamos construindo em termos precisos e testáveis. Eles usam um formato de requisito/cenário que torna o comportamento esperado cristalino.

Para uma tarefa pequena como esta, talvez precisemos apenas de um arquivo spec.
```

**FAÇA:** Resolva onde o arquivo spec deve ser criado:
```bash
openspec instructions specs --change "<nome>" --json
# Use resolvedOutputPath do JSON. Se for um glob, escolha o caminho concreto do arquivo usando a instrução do schema e o contexto da change.
```

Elabore o conteúdo do spec:

```
Aqui está o spec:

---

# Spec Delta

## ADDED Requirements

### Requirement: <Nome>

O sistema SHALL <descrição do que o sistema deve fazer>

#### Scenario: <Nome do cenário>

- **WHEN** <condição de gatilho>
- **THEN** <resultado esperado>
- **AND** <resultado adicional se necessário>

---

Este formato - WHEN/THEN/AND - torna os requisitos testáveis. Você pode literalmente lê-los como casos de teste. Os marcadores estruturais (ADDED Requirements, Requirement, Scenario) e as palavras-chave (WHEN/THEN/AND, SHALL/MUST) ficam SEMPRE em inglês — é o protocolo que o parser e o validador reconhecem. Apenas o conteúdo descritivo é escrito em português.
```

Salve no caminho concreto escolhido a partir de `resolvedOutputPath`.

---

## Fase 7: Design

**EXPLIQUE:**
```
## Design

O design captura **como** vamos construir - decisões técnicas, tradeoffs, abordagem.

Para changes pequenas, isto pode ser breve. Tudo bem - nem toda change precisa de discussão profunda de design.
```

**FAÇA:** Elabore design.md:

```
Aqui está o design:

---

# Design

## Context

[Contexto breve sobre o estado atual]

## Goals / Non-Goals

**Goals:**
- [O que estamos tentando alcançar]

**Non-Goals:**
- [O que está explicitamente fora do escopo]

## Decisions

### Decision 1: [Decisão-chave]

[Explicação da abordagem e racional]

---

Para uma tarefa pequena, isto captura as decisões-chave sem over-engineering.
```

Salve no `resolvedOutputPath` de `openspec instructions design --change "<nome>" --json`.

---

## Fase 8: Tasks

**EXPLIQUE:**
```
## Tasks

Finalmente, quebramos o trabalho em tarefas de implementação - checkboxes que impulsionam a fase de apply.

Elas devem ser pequenas, claras e em ordem lógica. Cada grupo carrega os testes e a documentação do próprio trabalho - o último grupo é só para verificações de integração.
```

**FAÇA:** Gere tarefas baseadas nos specs e design:

```
Aqui estão as tarefas de implementação:

---

# Tasks

## 1. [Categoria ou arquivo]

- [ ] 1.1 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]
- [ ] 1.2 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]

## 2. Verificação de Integração

- [ ] 2.1 Verificar [integração mais ampla ou comportamento do sistema] com [teste de ponta a ponta ou resultado observável]

---

Cada checkbox se torna uma unidade de trabalho na fase de apply. Este detalhamento de tarefas está certo?
```

**PAUSA** - Aguarde aprovação/feedback do usuário.

Após aprovação, salve no `resolvedOutputPath` de `openspec instructions tasks --change "<nome>" --json`.

Depois pergunte:
> "Tarefas salvas. Pronto para implementar?"

**PAUSA** - Aguarde o usuário confirmar antes da implementação.

---

## Fase 9: Apply (Implementação)

**EXPLIQUE:**
```
## Implementação

Agora implementamos cada tarefa, marcando-as à medida que avançamos. Anunciarei cada uma e ocasionalmente notarei como os specs/design informaram a abordagem.
```

**FAÇA:** Para cada tarefa:

1. Anuncie: "Trabalhando na tarefa N: [descrição]"
2. Implemente a mudança na codebase
3. Referencie specs/design naturalmente: "O spec diz X, então estou fazendo Y"
4. Marque como concluída em tasks.md: `- [ ]` → `- [x]`
5. Breve status: "✓ Tarefa N concluída"

Mantenha a narração leve - não explique cada linha de código.

Após todas as tarefas:

```
## Implementação Concluída

Todas as tarefas concluídas:
- [x] Tarefa 1
- [x] Tarefa 2
- [x] ...

A change está implementada! Mais um passo - vamos arquivá-la.
```

---

## Fase 10: Archive

**EXPLIQUE:**
```
## Arquivamento

Quando uma change está completa, nós a arquivamos. Isso a move de `openspec/changes/` para `openspec/changes/archive/YYYY-MM-DD-<nome>/`.

As changes arquivadas se tornam o histórico de decisões do seu projeto - você sempre pode encontrá-las depois para entender por que algo foi construído de certa forma.
```

**FAÇA:** Arquive a change (`--yes` responde às perguntas de confirmação, que você não consegue responder a partir de uma chamada de ferramenta):
```bash
openspec archive "<nome>" --yes
```

**MOSTRE:**
```
Arquivado em: `openspec/changes/archive/<target-name>/` (o nome de destino prefixa a data de hoje, a menos que o nome já comece com um prefixo `YYYY-MM-DD-` — nesse caso ele é mantido como está, sem segunda data)

A change agora faz parte do histórico do seu projeto. O código está na sua codebase, o registro de decisão está preservado.
```

---

## Fase 11: Recapitulação e Próximos Passos

```
## Parabéns!

Você acabou de completar um ciclo completo do BR-OpenSpec:

1. **Explore** - Pensou sobre o problema
2. **New** - Criou um container de change
3. **Proposal** - Capturou POR QUE
4. **Specs** - Definiu O QUE em detalhes
5. **Design** - Decidiu COMO
6. **Tasks** - Quebrou em passos
7. **Apply** - Implementou o trabalho
8. **Archive** - Preservou o registro

Este mesmo ritmo funciona para qualquer tamanho de change - uma pequena correção ou uma funcionalidade principal.

---

## Referência de Comandos

**Os comandos que você tem instalados:**

 | Comando          | O que faz                                  |
 |------------------|--------------------------------------------|
 | `/openspec-propose` | Cria uma change e gera todos os artifacts |
 | `/openspec-explore` | Pensa sobre problemas antes/durante o trabalho |
 | `/openspec-apply-change`   | Implementa tarefas de uma change |
 | `/openspec-archive-change` | Arquiva uma change concluída |
 | `/openspec-new-change`     | Inicia uma nova change, um artifact de cada vez |
 | `/openspec-continue-change` | Continua trabalhando em uma change existente |
 | `/openspec-ff-change`      | Fast-forward: cria todos os artifacts de uma vez |
 | `/openspec-verify-change`  | Verifica se a implementação corresponde aos artifacts |

---

## E Agora?

Experimente `/openspec-propose` em algo que você realmente quer construir. Você já pegou o ritmo!
```

---

## Tratamento de Saída Graciosa

### Usuário quer parar no meio do caminho

Se o usuário disser que precisa parar, quer pausar, ou parecer desengajado:

```
Sem problema! Sua change está salva no `changeRoot` reportado por `openspec status --change "<nome>" --json`.

Para retomar de onde paramos depois, `openspec status --change "<nome>" --json` mostra exatamente onde a change está.
- `/openspec-continue-change <nome>` - Retoma a criação de artifacts
- `/openspec-apply-change <nome>` - Pula para implementação (se tasks existirem)

O trabalho não será perdido. Volte quando estiver pronto.
```

Saia graciosamente sem pressão.

### Usuário apenas quer a referência de comandos

Se o usuário disser que apenas quer ver os comandos ou pular o tutorial:

```
## Referência Rápida do BR-OpenSpec

**Os comandos que você tem instalados:**

 | Comando                  | O que faz                                  |
 |--------------------------|--------------------------------------------|
 | `/openspec-propose <nome>`  | Cria uma change e gera todos os artifacts |
 | `/openspec-explore`         | Pensa sobre problemas (sem mudanças de código) |
 | `/openspec-apply-change <nome>`    | Implementa tarefas |
 | `/openspec-archive-change <nome>`  | Arquiva quando concluído |
 | `/openspec-new-change <nome>`      | Inicia uma nova change, passo a passo |
 | `/openspec-continue-change <nome>` | Continua uma change existente |
 | `/openspec-ff-change <nome>`       | Fast-forward: todos os artifacts de uma vez |
 | `/openspec-verify-change <nome>`   | Verifica a implementação |

Experimente `/openspec-propose` para iniciar sua primeira change.
```

Saia graciosamente.

---

## Guardrails

- **Siga o padrão EXPLICAR → FAZER → MOSTRAR → PAUSA** nas transições-chave (após explore, após rascunho de proposal, após tasks, após archive)
- **Mantenha a narração leve** durante a implementação - ensine sem pregar
- **Não pule fases** mesmo se a change for pequena - o objetivo é ensinar o workflow
- **Pause para confirmação** nos pontos marcados, mas não exagere nas pausas
- **Trate saídas graciosamente** - nunca pressione o usuário a continuar
- **Use tarefas reais da codebase** - não simule ou use exemplos falsos
- **Ajuste o escopo gentilmente** - guie para tarefas menores mas respeite a escolha do usuário

# Primeiros Passos

Este guia explica como o BR-OpenSpec funciona após você tê-lo instalado e inicializado. Para instruções de instalação, consulte o [README principal](../../README.pt-BR.md#quick-start).

## Como Funciona

O BR-OpenSpec ajuda você e seu assistente de codificação com IA a chegarem a um acordo sobre o que construir antes de qualquer código ser escrito.

**Caminho rápido padrão (perfil `core`):**

```text
/opsx:propose ──► /opsx:apply ──► /opsx:sync ──► /opsx:archive
```

**Caminho expandido (seleção de workflow personalizado):**

```text
/opsx:new ──► /opsx:ff ou /opsx:continue ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

O perfil global padrão é `core`, que inclui `propose`, `explore`, `apply`, `sync` e `archive`. Você pode habilitar os comandos de workflow expandido com `openspec config profile` e depois `openspec update`.

## O Que o BR-OpenSpec Cria

Após executar `openspec init`, seu projeto terá esta estrutura:

```
openspec/
├── specs/              # Fonte de verdade (o comportamento do seu sistema)
│   └── <domain>/
│       └── spec.md
├── changes/            # Atualizações propostas (uma pasta por mudança)
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # Delta specs (o que está mudando)
│           └── <domain>/
│               └── spec.md
└── config.yaml         # Configuração do projeto (opcional)
```

**Dois diretórios principais:**

- **`specs/`** - A fonte de verdade. Essas specs descrevem como o seu sistema se comporta atualmente. Organizadas por domínio (ex.: `specs/auth/`, `specs/payments/`).

- **`changes/`** - Modificações propostas. Cada mudança tem sua própria pasta com todos os artefatos relacionados. Quando uma mudança é concluída, suas specs são mescladas no diretório principal `specs/`.

## Entendendo os Artefatos

Cada pasta de mudança contém artefatos que orientam o trabalho:

| Artefato | Propósito |
|----------|-----------|
| `proposal.md` | O "por quê" e o "o quê" — captura a intenção, o escopo e a abordagem |
| `specs/` | Delta specs mostrando requisitos ADICIONADOS/MODIFICADOS/REMOVIDOS |
| `design.md` | O "como" — abordagem técnica e decisões de arquitetura |
| `tasks.md` | Lista de verificação de implementação com checkboxes |

**Os artefatos se constroem uns sobre os outros:**

```
proposta ──► specs ──► design ──► tarefas ──► implementação
   ▲           ▲          ▲                        │
   └───────────┴──────────┴────────────────────────┘
            atualizar conforme você aprende
```

Você sempre pode voltar e refinar artefatos anteriores à medida que aprende mais durante a implementação.

## Como as Delta Specs Funcionam

As delta specs são o conceito central do BR-OpenSpec. Elas mostram o que está mudando em relação às suas specs atuais.

### O Formato

As delta specs usam seções para indicar o tipo de mudança:

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Autenticação de Dois Fatores
O sistema MUST exigir um segundo fator durante o login.

#### Scenario: OTP obrigatório
- GIVEN um usuário com 2FA habilitado
- WHEN o usuário envia credenciais válidas
- THEN um desafio de OTP é apresentado

## MODIFIED Requirements

### Requirement: Tempo Limite de Sessão
O sistema SHALL expirar as sessões após 30 minutos de inatividade.
(Anteriormente: 60 minutos)

#### Scenario: Tempo limite por inatividade
- GIVEN uma sessão autenticada
- WHEN 30 minutos se passam sem atividade
- THEN a sessão é invalidada

## REMOVED Requirements

### Requirement: Lembrar de Mim
(Descontinuado em favor do 2FA)
```

### O Que Acontece ao Arquivar

Quando você arquiva uma mudança:

1. Os requisitos **ADDED** são anexados à spec principal
2. Os requisitos **MODIFIED** substituem a versão existente
3. Os requisitos **REMOVED** são excluídos da spec principal

A pasta da mudança é movida para `openspec/changes/archive/` como histórico de auditoria.

## Exemplo: Sua Primeira Mudança

Vamos percorrer o processo de adição do modo escuro a uma aplicação.

### 1. Iniciar a Mudança (Padrão)

```text
Você: /opsx:propose add-dark-mode

IA:   Criado openspec/changes/add-dark-mode/
      ✓ proposal.md — por que estamos fazendo isso, o que está mudando
      ✓ specs/       — requisitos e cenários
      ✓ design.md    — abordagem técnica
      ✓ tasks.md     — lista de verificação de implementação
      Pronto para implementação!
```

Se você habilitou o perfil de workflow expandido, também pode fazer isso em duas etapas: `/opsx:new` e depois `/opsx:ff` (ou `/opsx:continue` de forma incremental).

### 2. O Que é Criado

**proposal.md** — Captura a intenção:

```markdown
# Proposal: Adicionar Modo Escuro

## Intenção
Os usuários solicitaram uma opção de modo escuro para reduzir o cansaço
visual durante o uso noturno.

## Escopo
- Adicionar alternância de tema nas configurações
- Suportar a detecção da preferência do sistema
- Persistir a preferência no localStorage

## Abordagem
Usar propriedades CSS customizadas para temas com um contexto React
para gerenciamento de estado.
```

**specs/ui/spec.md** — Delta mostrando os novos requisitos:

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Seleção de Tema
O sistema SHALL permitir que os usuários escolham entre temas claro e escuro.

#### Scenario: Alternância manual
- GIVEN um usuário em qualquer página
- WHEN o usuário clica na alternância de tema
- THEN o tema muda imediatamente
- AND a preferência persiste entre as sessões

#### Scenario: Preferência do sistema
- GIVEN um usuário sem preferência salva
- WHEN a aplicação carrega
- THEN o esquema de cores preferido do sistema é usado
```

**tasks.md** — Lista de verificação de implementação:

```markdown
# Tasks

## 1. Infraestrutura de Tema
- [ ] 1.1 Criar ThemeContext com estado claro/escuro
- [ ] 1.2 Adicionar propriedades CSS customizadas para cores
- [ ] 1.3 Implementar persistência com localStorage

## 2. Componentes de UI
- [ ] 2.1 Criar o componente ThemeToggle
- [ ] 2.2 Adicionar a alternância à página de configurações
- [ ] 2.3 Atualizar o Header para incluir alternância rápida

## 3. Estilização
- [ ] 3.1 Definir a paleta de cores do tema escuro
- [ ] 3.2 Atualizar os componentes para usar variáveis CSS
```

### 3. Implementar

```
Você: /opsx:apply

IA:   Executando as tarefas...
      ✓ 1.1 ThemeContext criado com estado light/dark
      ✓ 1.2 Propriedades CSS customizadas adicionadas ao globals.css
      ✓ 1.3 Persistência com localStorage implementada
      ✓ 2.1 Componente ThemeToggle criado
      ...
      Todas as tarefas concluídas!
```

Durante a implementação, se você descobrir que o design precisa de ajuste, basta atualizar o artefato e continuar.

### 4. Arquivar

```
Você: /opsx:archive

IA:   Arquivando add-dark-mode...
      ✓ Specs mescladas em openspec/specs/ui/spec.md
      ✓ Movido para openspec/changes/archive/2025-01-24-add-dark-mode/
      Concluído! Pronto para o próximo recurso.
```

Suas delta specs agora fazem parte das specs principais, documentando como o seu sistema funciona.

## Verificando e Revisando

Use a CLI para conferir suas mudanças:

```bash
# Listar mudanças ativas
openspec list

# Ver detalhes de uma mudança
openspec show add-dark-mode

# Validar a formatação das specs
openspec validate add-dark-mode

# Dashboard interativo
openspec view
```

## Próximos Passos

- [Fluxos de Trabalho](workflows.md) — Padrões comuns e quando usar cada comando
- [Comandos](commands.md) — Referência completa de todos os comandos slash
- [Conceitos](concepts.md) — Compreensão mais profunda de specs, mudanças e schemas
- [Personalização](customization.md) — Faça o BR-OpenSpec funcionar do seu jeito

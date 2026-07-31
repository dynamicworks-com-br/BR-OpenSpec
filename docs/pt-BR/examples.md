# Exemplos e Receitas

Mudanças reais, do início ao fim. Cada receita mostra os comandos que você digitaria e o que veria de volta, para que você possa casar sua situação com um padrão e copiá-lo. Elas usam os comandos **core** padrão (`propose`, `explore`, `apply`, `update`, `sync`, `archive`); onde o conjunto expandido ajuda, está indicado.

Um lembrete antes de começar: slash commands como `/opsx:propose` vão no **chat do seu assistente de IA**, e comandos `openspec` vão no seu **terminal**. Se isso é novidade, leia [Como os Comandos Funcionam](how-commands-work.md) primeiro. Nas transcrições abaixo, `Você:` e `IA:` são o chat, e linhas começando com `$` são o terminal.

> **Ainda não sabe o que está construindo?** A maioria destas receitas fica mais afiada se você começar com `/opsx:explore` para pensar primeiro. A [Receita 3](#receita-3-explorando-antes-de-se-comprometer) mostra isso em ação, e o guia [Explore Primeiro](explore.md) apresenta o argumento completo.

## Receita 1: Uma funcionalidade pequena, o caminho rápido

**Quando usar:** você sabe o que quer, e é uma porção de trabalho contida. Esta é a receita mais comum.

A coisa toda são três comandos. Propor, construir, arquivar.

```text
Você: /opsx:propose add-logout-button

IA:   Criado openspec/changes/add-logout-button/
      ✓ proposal.md — por quê e o quê
      ✓ specs/      — o novo requisito e seus cenários
      ✓ design.md   — abordagem técnica
      ✓ tasks.md    — checklist de implementação
      Pronto para implementação. Rode /opsx:apply.
```

Agora leia o plano. Abra a proposta e a delta spec. Este é o momento para o qual o BR-OpenSpec foi feito: pegar uma suposição errada enquanto ainda é um parágrafo, não 400 linhas de código. Edite qualquer artefato diretamente se algo estiver fora do lugar, depois continue.

```text
Você: /opsx:apply

IA:   Trabalhando pelas tarefas...
      ✓ 1.1 Adicionar botão de logout ao cabeçalho
      ✓ 1.2 Limpar sessão ao clicar
      ✓ 1.3 Adicionar diálogo de confirmação
      Todas as tarefas concluídas!

Você: /opsx:archive

IA:   Arquivando add-logout-button...
      ✓ Specs mescladas em openspec/specs/auth/spec.md
      ✓ Movido para openspec/changes/archive/2026-06-22-add-logout-button/
      Pronto. Preparado para a próxima mudança.
```

É isso. O comportamento de logout agora faz parte das suas specs, e a mudança está arquivada com todo o seu contexto.

## Receita 2: Uma correção de bug

**Quando usar:** algo está quebrado e você quer a correção registrada como uma mudança deliberada de comportamento, não um commit misterioso.

Correções de bug funcionam exatamente como funcionalidades. A diferença está em como você enquadra a proposta: descreva o comportamento *correto*, não apenas "corrija o bug".

```text
Você: /opsx:propose fix-login-redirect-loop

IA:   Criado openspec/changes/fix-login-redirect-loop/
      A proposta captura o comportamento quebrado atual e o
      comportamento pretendido. A delta spec faz MODIFY do requisito
      de redirecionamento, que agora está preciso e testável.
      Pronto para implementação.
```

Como a correção chega como um requisito `MODIFIED` com um cenário novo, a próxima pessoa (ou a próxima sessão de IA) vê não só que você corrigiu, mas o que "correto" significa. Depois `/opsx:apply` e `/opsx:archive` como de costume.

Dica: para uma correção, um bom cenário é o teste de regressão em prosa. "GIVEN um usuário deslogado, WHEN ele envia credenciais válidas, THEN ele chega ao dashboard e não é redirecionado de novo." Escreva isso, e a implementação tem um alvo claro.

## Receita 3: Explorando antes de se comprometer

**Quando usar:** você tem um problema, mas ainda não um plano. Não tem certeza do que construir, nem de qual abordagem é a certa.

Comece com `/opsx:explore`. É um parceiro de raciocínio sem estrutura e sem artefatos criados. Ele lê sua base de código e ajuda você a decidir.

```text
Você: /opsx:explore

IA:   O que você gostaria de explorar?

Você: O carregamento das páginas parece lento, mas não sei para onde
      o tempo está indo.

IA:   Deixe-me olhar... Encontrei três suspeitos prováveis:
      1. Imagens grandes não otimizadas na lista de produtos
      2. Busca de dados síncrona que bloqueia a renderização
      3. Re-renderizações disparadas por mudanças de contexto
      Qual atacamos primeiro?

Você: O da busca de dados.

Você: /opsx:propose optimize-product-list-fetching

IA:   Criada a mudança, com uma proposta informada pelo que acabamos
      de descobrir. Pronta para implementação.
```

A exploração clarifica seu pensamento *antes* de você gastar uma mudança nisso. Quando o insight cristaliza, proponha, e a IA carrega o contexto adiante.

## Receita 4: Malabarismo com duas mudanças ao mesmo tempo

**Quando usar:** você está no meio de uma funcionalidade e uma correção urgente furou a fila.

Mudanças são pastas independentes, então trabalho paralelo não conflita. Comece a correção, entregue-a, depois volte para a funcionalidade exatamente de onde parou.

```text
Você: Estou no meio de add-dark-mode, mas preciso corrigir um bug de
      login agora.

Você: /opsx:propose fix-login-redirect

IA:   Criado openspec/changes/fix-login-redirect/. Pronto para
      implementação.

Você: /opsx:apply

IA:   Correção implementada. Todas as tarefas concluídas.

Você: /opsx:archive

IA:   ✓ Arquivado fix-login-redirect.

Você: De volta ao dark mode.

Você: /opsx:apply add-dark-mode

IA:   Retomando add-dark-mode. Continuando da tarefa 2.3: Atualizar
      Header...
```

Nomear a mudança em `/opsx:apply add-dark-mode` é como você aponta a IA para uma mudança específica quando mais de uma está ativa. Como as tarefas acompanham o progresso em `tasks.md`, a IA sabe exatamente onde você parou.

Quando várias mudanças terminam ao mesmo tempo, o `/opsx:bulk-archive` expandido as arquiva juntas e resolve conflitos de spec verificando o que está realmente implementado. Veja [Fluxos de Trabalho](workflows.md#mudanças-paralelas).

## Receita 5: Uma refatoração sem mudança de comportamento

**Quando usar:** você está reestruturando código, e o comportamento visível externamente deve ficar idêntico.

Este é o caso interessante, porque uma refatoração pura *não tem nada a adicionar às suas specs*. O contrato de comportamento não muda; só a implementação muda. Então o trabalho vive no design e nas tarefas, e o delta de spec fica vazio ou ausente.

```text
Você: /opsx:propose refactor-payment-module

IA:   Criada a mudança. A proposta declara o objetivo (dividir o
      módulo de pagamento, sem mudança de comportamento) e o design
      captura a nova estrutura. Nenhuma mudança de spec, já que o
      comportamento é idêntico. Pronta para implementação.
```

Declare o delta vazio explicitamente definindo `skip_specs: true` no `.openspec.yaml` da mudança:

```yaml
schema: spec-driven
skip_specs: true
```

Sem o marcador, o `openspec validate` rejeita uma mudança com zero deltas (assim uma fase de specs esquecida ainda é detectada); com ele, a validação passa e o `openspec status` mostra o estágio de specs como explicitamente ignorado, em vez de pendente. Se a refatoração acabar mudando o comportamento, remova `skip_specs` do `.openspec.yaml` e escreva as specs de delta — o validate trata o marcador combinado com arquivos de spec como conflito, então um marcador obsoleto não fica para trás silenciosamente.

Arquivar uma mudança marcada não precisa de flags extras (não há deltas para mesclar). Independentemente disso, a flag `--skip-specs` diz ao comando de terminal para pular o passo de specs explicitamente:

```bash
$ openspec archive refactor-payment-module --skip-specs
```

A mesma flag é útil para tooling, CI e mudanças só de docs. O princípio: specs descrevem comportamento, então se o comportamento não mudou, a spec também não deveria. Veja [Conceitos](concepts.md#o-que-uma-spec-é-e-não-é).

## Receita 6: Controle passo a passo (comandos expandidos)

**Quando usar:** uma mudança complexa ou arriscada, em que você quer revisar cada artefato antes de seguir.

O `/opsx:propose` do core elabora tudo de uma vez. Quando você preferir ir um passo por vez, ative os comandos expandidos:

```bash
$ openspec config profile      # selecione os fluxos de trabalho expandidos
$ openspec update              # aplique-os a este projeto
```

Agora você pode esqueletar e construir incrementalmente:

```text
Você: /opsx:new add-2fa

IA:   Criado openspec/changes/add-2fa/. Pronto para criar: proposta.

Você: /opsx:continue

IA:   Criado proposal.md. Agora disponíveis: specs, design.

Você: /opsx:continue

IA:   Criado specs/auth/spec.md. Agora disponível: design.
```

Revise cada artefato conforme ele chega, edite livremente e continue quando estiver satisfeito. Quando quiser o resto elaborado de uma vez, `/opsx:ff` avança pelos artefatos de planejamento restantes. Antes de arquivar, `/opsx:verify` verifica que a implementação realmente corresponde às specs. Veja [Fluxos de Trabalho](workflows.md#opsxff-vs-opsxcontinue).

## Receita 7: Aprendendo o loop inteiro na prática

**Quando usar:** você instalou o BR-OpenSpec e quer *sentir* o fluxo de trabalho no seu próprio código, não num exemplo de brinquedo.

Ative os comandos expandidos (veja a Receita 6), depois:

```text
Você: /opsx:onboard

IA:   Boas-vindas ao BR-OpenSpec! Vou guiar você por uma mudança
      completa usando sua base de código real. Deixe-me procurar uma
      melhoria pequena e segura que possamos fazer juntos...
```

`/opsx:onboard` encontra uma melhoria real (pequena), cria uma mudança para ela, implementa-a e arquiva-a, narrando cada passo. Leva de 15 a 30 minutos e deixa você com uma mudança real que pode manter ou descartar. É a forma mais suave de aprender. Veja [Comandos](commands.md#opsxonboard).

## Verificando seu trabalho pelo terminal

A qualquer momento, do seu terminal, você pode inspecionar o estado das coisas:

```bash
$ openspec list                      # mudanças ativas
$ openspec show add-dark-mode        # uma mudança em detalhe
$ openspec validate add-dark-mode    # verificar estrutura
$ openspec view                      # dashboard interativo
```

Essas são ferramentas de ler e inspecionar. As propostas e a construção continuam acontecendo pelos slash commands no chat. Detalhes completos na [referência da CLI](cli.md).

## Para onde ir em seguida

- [Explore Primeiro](explore.md): a forma recomendada de começar quando você está em dúvida
- [Fluxos de Trabalho](workflows.md): os padrões acima, com orientação de decisão sobre quando usar cada um
- [Comandos](commands.md): cada slash command em detalhe
- [Primeiros Passos](getting-started.md): o walkthrough canônico da primeira mudança
- [Conceitos](concepts.md): por que as peças se encaixam do jeito que se encaixam

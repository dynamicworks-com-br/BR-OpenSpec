# Editando e Iterando em uma Mudança

**Todo artefato numa mudança é apenas um arquivo Markdown que você pode editar a qualquer momento.** Não há "fase de planejamento" travada, nenhum portão de aprovação, nenhum modo especial de edição para entrar. Quer mudar a proposta depois de já ter começado a construir? Abra o `proposal.md` e mude. Percebeu que o design está errado no meio da implementação? Corrija o `design.md` e siga em frente. Essa é a resposta inteira, e é de propósito.

Esta página é para o momento em que você pensa "espera, posso voltar e mudar isso?" Pode. Veja como, para cada caso comum.

## Duas formas de editar qualquer coisa

Você sempre tem as duas:

1. **Edite o arquivo diretamente.** Artefatos são Markdown puro em `openspec/changes/<nome>/`. Abra `proposal.md`, `design.md`, `tasks.md` ou uma delta spec em `specs/` no seu editor e mude. Nada mais é necessário.

2. **Peça à sua IA para revisar.** No chat, simplesmente diga o que você quer: "Atualize a proposta para tirar a ideia do cache e adicionar uma seção de rate limit", ou "o design deveria usar uma fila, não polling". A IA edita o artefato para você, usando o resto da mudança como contexto.

Use o que couber no momento. Pequeno ajuste de redação? Edite o arquivo. Repensar substancial? Deixe a IA revisar com o contexto completo.

## "Como atualizo a proposta (ou as specs) depois de começar?"

Simplesmente atualize. Mesma mudança, refinada.

Se você está usando os comandos expandidos, o fluxo natural é: edite o artefato, depois rode `/opsx:continue` para retomar do novo estado, ou `/opsx:apply` para continuar implementando contra o plano atualizado. Se você está nos comandos `core` padrão, edite o artefato e rode `/opsx:apply`; ele lê os arquivos atuais, então constrói contra o que quer que os artefatos digam agora.

O modelo mental: artefatos são o plano vivo, não um contrato assinado. A IA sempre trabalha a partir do conteúdo atual deles, então editá-los dirige o trabalho.

```text
Você: Quero mudar a abordagem nesta mudança.

Você: [edita o design.md, ou diz à IA:]
      Atualize o design.md para usar um job em background em vez de
      uma chamada síncrona.

IA:   Atualizado design.md. A lista de tarefas ainda serve; quer que
      eu continue aplicando?

Você: /opsx:apply
```

Isso responde uma pergunta muito comum: não existe um comando separado de "atualizar proposta" porque você não precisa de um. O arquivo é a fonte de verdade, e editá-lo (manualmente ou via IA) é a atualização.

## "Como volto para revisar depois de implementar?"

Você não precisa "voltar", porque nunca saiu. O fluxo de trabalho é fluido: revisão, edição e implementação não são fases sequenciais em que você fica preso.

Concretamente, depois de algum trabalho de `/opsx:apply`:

- Quer reexaminar o plano? Abra os artefatos e leia-os, ou rode `openspec show <mudança>` no seu terminal para uma visão consolidada.
- Encontrou algo para mudar? Edite o artefato (ou peça à IA), depois continue.
- Quer uma verificação estruturada de que o código corresponde ao plano? Rode `/opsx:verify` (comando expandido). Ele reporta completude, correção e coerência sem bloquear nada. Veja [Fluxos de Trabalho: Verify](workflows.md#verify-verifique-seu-trabalho).

Não há "fase de revisão" para a qual retornar, porque revisão é algo que você pode fazer a qualquer momento, inclusive depois da implementação.

## "Editei o código manualmente. Como reconcilio isso com o BR-OpenSpec?"

Isso acontece o tempo todo e não tem problema. Você ajustou algo no seu editor, e agora o código e os artefatos discordam. Traga-os de volta à sincronia na direção que for verdade:

- **O código agora está correto, a spec está desatualizada.** Atualize a delta spec (e as tarefas, se relevante) para descrever o comportamento que você realmente entregou. A spec deve corresponder à realidade antes de você arquivar, porque arquivar mescla a spec na sua fonte de verdade.
- **A spec está correta, o código desviou.** Continue construindo ou corrigindo até o código corresponder à spec.

Uma forma rápida de trazer divergências à tona é `/opsx:verify`: ele lê seus artefatos e seu código e diz onde eles divergem. Trate a saída dele como uma lista de pendências para reconciliação, depois arquive quando eles concordarem.

O princípio: no momento do arquivamento, suas specs se tornam a verdade registrada. Então, antes de arquivar, torne as specs honestas sobre o que o código faz. Edições manuais são bem-vindas; só não deixe que elas dessincronizem a spec silenciosamente.

## Refinando uma proposta com que você não está satisfeito

Se uma proposta gerada errou o alvo, você tem três bons movimentos:

- **Itere no lugar.** Diga à IA o que está fora ("o escopo está amplo demais, remova as funcionalidades de admin") e deixe-a revisar. Mais barato e geralmente certo.
- **Explore primeiro, depois proponha de novo.** Se o problema é que a ideia em si está nebulosa, dê um passo atrás para `/opsx:explore`, pense com calma, e deixe uma proposta mais afiada sair disso. Veja [Explore Primeiro](explore.md).
- **Comece do zero.** Se a intenção mudou fundamentalmente, uma mudança nova pode ser mais clara do que remendar a antiga.

Esse último movimento tem seu próprio guia de decisão, a seguir.

## Quando atualizar vs. começar uma nova mudança

Versão curta: **atualize quando é o mesmo trabalho refinado; comece uma nova quando a intenção mudou fundamentalmente ou o escopo explodiu para um trabalho diferente.**

- Mesmo objetivo, abordagem melhor? Atualize.
- Escopo estreitando (entregue o MVP agora, o resto depois)? Atualize, arquive, depois uma nova mudança para a fase dois.
- O problema em si mudou ("adicionar dark mode" virou "construir um sistema completo de temas")? Nova mudança.

Há um fluxograma completo e exemplos trabalhados em [Fluxos de Trabalho: Quando Atualizar vs Começar do Zero](workflows.md#quando-atualizar-vs-começar-do-zero) e um tratamento mais profundo em [OPSX: Quando Atualizar vs. Começar do Zero](opsx.md#quando-atualizar-vs-começar-do-zero).

## Uma nota sobre tarefas

`tasks.md` é uma checklist viva, não um plano congelado. Conforme você implementa, pode adicionar tarefas que descobrir, remover as que se mostraram desnecessárias, ou reordená-las. A IA marca os itens conforme os conclui durante `/opsx:apply`, e retoma da primeira tarefa não marcada se você voltar depois. Editar a lista no meio do voo é esperado.

## Para onde ir em seguida

- [Fluxos de Trabalho](workflows.md) - padrões, mais o guia de decisão atualizar-vs-nova
- [Revisando uma Mudança](reviewing-changes.md) - a passada de dois minutos num plano antes de construí-lo
- [Explore Primeiro](explore.md) - o lugar para onde recuar quando uma ideia precisa ser repensada
- [Comandos](commands.md) - `/opsx:continue`, `/opsx:apply` e `/opsx:verify` em detalhe
- [Conceitos: Artefatos](concepts.md#artefatos) - para que serve cada artefato

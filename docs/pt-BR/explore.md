# Explore Primeiro

**`/opsx:explore` é seu parceiro de raciocínio. Use-o sempre que você tiver um problema, mas ainda não um plano.** Ele investiga sua base de código, pesa opções com você e clarifica o que você realmente quer, tudo antes que um único artefato ou linha de código seja criado. Quando o quadro está claro, ele passa o bastão para `/opsx:propose`.

Se você levar um único hábito destes docs, leve este: **quando não tiver certeza, explore antes de propor.**

Eis por que isso importa. Assistentes de codificação com IA são ansiosos. Peça vagamente e eles construirão confiantemente *algo*, só que talvez não o que você precisava. O explore é a cura. É uma conversa sem risco algum, em que você e a IA descobrem juntos o movimento certo, de modo que, quando você propõe, está propondo a coisa certa.

## Quando explorar

O explore é o primeiro passo certo com mais frequência do que as pessoas esperam. Use-o quando qualquer uma destas for verdade:

- Você sabe o *problema*, mas não a *solução*. ("As páginas parecem lentas." "A autenticação está uma bagunça." "Vivem aparecendo pedidos duplicados.")
- Você está escolhendo entre abordagens e quer os trade-offs expostos contra o seu código real.
- Você é novo numa base de código e precisa entender como algo funciona antes de mudá-lo.
- Os requisitos estão difusos e você quer afiá-los antes de se comprometer.
- Você suspeita que o trabalho é maior ou menor do que parece e quer dimensioná-lo honestamente.

Pule o explore apenas quando você já sabe exatamente o que quer e como. Nesse caso, vá direto para [`/opsx:propose`](commands.md#opsxpropose).

## O que ele faz (e não faz)

O explore é uma **conversa**, não um gerador.

**Ele faz:**
- Ler e pesquisar sua base de código para responder perguntas reais.
- Comparar opções e nomear os trade-offs de cada uma.
- Desenhar diagramas para tornar um design legível.
- Ajudar você a estreitar uma ideia vaga em um escopo concreto e construível.
- Transitar para `/opsx:propose` quando você estiver pronto.

**Ele não faz:**
- Criar uma pasta de mudança.
- Escrever artefatos (nenhuma proposta, specs, design ou tarefas).
- Escrever ou modificar código.

Esse é o ponto. Explorar não lhe custa nada e não o compromete com nada. Você pode explorar três becos sem saída, aprender algo com cada um, e só então propor o caminho que sobreviveu.

## Já está instalado

Boa notícia: `/opsx:explore` vem no perfil padrão **core**, junto com `propose`, `apply`, `update`, `sync` e `archive`. Você não precisa ativar nada. Se o BR-OpenSpec está configurado no seu projeto, o explore está pronto no chat da sua IA. (Como em todos os comandos `/opsx:*`, você o digita no chat do seu assistente, não no terminal. Veja [Como os Comandos Funcionam](how-commands-work.md).)

## Um exemplo completo

Veja como uma preocupação vaga vira uma mudança afiada e construível.

```text
Você: /opsx:explore

IA:   O que você gostaria de explorar?

Você: Nosso checkout às vezes cria pedidos duplicados. Não sei por quê
      e não sei como corrigir com segurança.

IA:   Deixe-me investigar o caminho do checkout...
      [lê o serviço de pedidos, o handler do webhook de pagamento e a
       lógica de envio do cliente]

      Aqui está o que encontrei. Há duas formas de uma duplicata acontecer:

      1. O cliente pode enviar duas vezes (clique duplo, nova tentativa
         em rede lenta). Nada faz debounce disso.
      2. O webhook de pagamento pode disparar mais de uma vez, e o
         handler cria um pedido a cada vez. Não há chave de idempotência.

      A causa nº 2 é a perigosa: pode cobrar e entregar duas vezes.

      Três formas de corrigir, aproximadamente em ordem de robustez:
      - Chave de idempotência no endpoint de criação de pedidos
        (resolve as duas causas)
      - Deduplicação no webhook pelo id do payment-intent (resolve só a nº 2)
      - Debounce no lado do cliente (resolve só a nº 1, varre o bug real
        para debaixo do tapete)

      Como seu código já armazena o id do payment-intent, a abordagem da
      chave de idempotência é uma mudança pequena com o maior retorno.
      Quer que eu dimensione isso?

Você: Sim, vamos com a chave de idempotência.

Você: /opsx:propose add-order-idempotency-key

IA:   Criado openspec/changes/add-order-idempotency-key/, com uma proposta
      e uma delta spec fundamentadas no que acabamos de descobrir. Pronto
      para implementação.
```

Note o que aconteceu. O ponto de partida era "algo está errado e tenho medo de mexer". Vinte segundos de exploração transformaram isso em uma causa-raiz nomeada, três opções ranqueadas, uma recomendação ligada ao código existente e uma mudança precisa. A proposta que segue é afiada porque o raciocínio aconteceu primeiro.

## Passando o bastão para o propose

O explore não arquiva em lugar nenhum. Quando você está pronto, simplesmente inicia uma mudança, e a IA carrega o contexto da sua conversa para os artefatos.

```text
explore  ──►  propose  ──►  apply  ──►  archive
 (pensar)     (alinhar)    (construir)  (registrar)
```

Você pode dizer em linguagem natural ("vamos transformar isso numa mudança") ou rodar `/opsx:propose <nome>` diretamente. De qualquer forma, a exploração que você acabou de fazer vira o alicerce da proposta, não lixo de chat.

Se você usa o conjunto expandido de comandos, o explore pode passar o bastão para `/opsx:new`, para criação de artefatos passo a passo. Veja [Fluxos de Trabalho](workflows.md).

## Dicas para uma boa exploração

- **Traga o problema, não a solução.** "Logins parecem lentos" dá à IA espaço para investigar. "Adicione um cache Redis" pré-compromete você com uma resposta que ainda não testou.
- **Peça os trade-offs em voz alta.** "Quais são as desvantagens de cada opção?" traz uma comparação mais honesta.
- **Deixe ele ler primeiro.** As melhores explorações começam com a IA realmente olhando seu código, não adivinhando. Aponte-a para a área relevante se ajudar.
- **Tudo bem desistir.** Se a exploração revelar que a ideia não vale a pena, isso é uma vitória. Você aprendeu barato.
- **Explore de novo no meio da mudança.** Travado durante `/opsx:apply`? Você pode dar um passo atrás e explorar um subproblema, depois voltar.

## Os trade-offs honestos

**O que você ganha:** o explore pega rumos errados no momento mais barato possível, antes que qualquer artefato exista. É especialmente poderoso em código desconhecido, onde a habilidade da IA de ler e resumir o sistema poupa uma tarde de exploração manual.

**O que custa:** um pouco de paciência. O explore é uma conversa, então é mais lento do que disparar `/opsx:propose` e torcer. Para trabalho que você já entende de verdade, esse passo extra é overhead puro, e você deve pulá-lo.

A regra prática: quanto mais difusa a tarefa, mais o explore compensa. Quanto mais clara a tarefa, mais você pode pular direto para a proposta.

## Para onde ir em seguida

- [Comandos: `/opsx:explore`](commands.md#opsxexplore): a referência precisa
- [Fluxos de Trabalho](workflows.md): o explore como parte do loop do dia a dia
- [Exemplos e Receitas](examples.md#receita-3-explorando-antes-de-se-comprometer): explore num walkthrough completo
- [Primeiros Passos](getting-started.md): o guia da primeira mudança, com exploração incluída

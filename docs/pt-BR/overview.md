# Conceitos Essenciais em Resumo

**O BR-OpenSpec é uma camada leve de alinhamento entre você e sua IA.** Você escreve o que uma mudança deve fazer, a IA elabora os detalhes, ambos olham para o mesmo plano, e só então o código é escrito. Esta página é o modelo mental inteiro em uma tela. Quando quiser a versão longa, [Conceitos](concepts.md) tem tudo.

Aqui está a ideia inteira em cinco palavras: **alinhe primeiro, construa com confiança.**

## As cinco ideias

Tudo no BR-OpenSpec é construído a partir de cinco conceitos. Aprenda-os e o resto é detalhe.

**1. Specs são a verdade.** Uma spec descreve como seu sistema se comporta *agora*. Ela vive em `openspec/specs/`, organizada por domínio (`auth/`, `payments/`, `ui/`). Specs são feitas de requisitos ("o sistema SHALL expirar sessões após 30 minutos") e cenários (exemplos concretos em given/when/then). Pense nas specs como a única resposta acordada para "o que este software faz?"

**2. Uma mudança é uma unidade de trabalho.** Quando você quer adicionar, modificar ou remover comportamento, você cria uma mudança: uma pasta em `openspec/changes/` que reúne tudo sobre aquele trabalho em um só lugar. Uma proposta, um design, uma lista de tarefas e as edições de spec. Uma mudança, uma pasta, uma funcionalidade.

**3. Delta specs descrevem o que está mudando, não o mundo inteiro.** Dentro de uma mudança, você não reescreve a spec inteira. Você escreve um pequeno delta: `ADDED` este requisito, `MODIFIED` aquele, `REMOVED` este outro. Este é o truque que torna o BR-OpenSpec bom em editar sistemas existentes, não apenas projetos novos. Você descreve o diff, não o destino.

**4. Artefatos se constroem uns sobre os outros.** Uma mudança contém alguns documentos, criados em uma ordem natural, cada um alimentando o próximo:

```text
proposta ──► specs ──► design ──► tarefas ──► implementação
  por quê     o quê      como       passos         faça
```

Você pode revisitar qualquer um deles a qualquer momento. Eles são facilitadores, não portões. (Mais sobre isso abaixo.)

**5. Arquivar dobra a mudança de volta para dentro da verdade.** Quando o trabalho termina, você arquiva a mudança. Suas delta specs são mescladas nas specs principais, e a pasta da mudança vai para `changes/archive/` com um carimbo de data. Agora suas specs descrevem a nova realidade, e você está pronto para a próxima mudança. O ciclo se fecha.

## A figura

```text
┌─────────────────────────────────────────────────────────────────┐
│                          openspec/                              │
│                                                                 │
│   ┌──────────────────┐         ┌──────────────────────────┐    │
│   │     specs/       │         │        changes/          │    │
│   │                  │ ◄─────  │                          │    │
│   │ fonte de verdade │ mescla  │ uma pasta por mudança    │    │
│   │ como as coisas   │   no    │ proposta · design ·      │    │
│   │ funcionam hoje   │ arquivar│ tarefas · delta specs    │    │
│   └──────────────────┘         └──────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Duas pastas. `specs/` é o que é verdade. `changes/` é o que você está propondo. Arquivar move uma proposta para dentro da verdade.

## O loop que você vai rodar de verdade

Na configuração padrão, seu dia se parece com isto. Opcionalmente pense primeiro; depois um comando elabora o plano, você o lê, o próximo o constrói, e o último o arquiva.

```text
/opsx:explore                   →  (opcional) pense com a IA primeiro
/opsx:propose add-dark-mode     →  IA elabora proposta, specs, design, tarefas
        (você lê e ajusta o plano)
/opsx:apply                     →  IA constrói, marcando as tarefas
/opsx:archive                   →  specs atualizadas, mudança arquivada
```

**Na dúvida, comece explorando.** `/opsx:explore` é um parceiro de raciocínio sem risco algum: ele lê seu código, apresenta opções e transforma uma ideia difusa em um plano concreto antes que qualquer artefato exista. É o melhor antídoto para uma IA que, de outra forma, construiria *algo* a partir de um prompt vago. Já sabe exatamente o que quer? Pule direto para `/opsx:propose`. De qualquer forma, o explore vem no perfil padrão, então está sempre lá. Veja o [guia Explore](explore.md).

Esses são slash commands, digitados no chat do seu assistente de IA. A configuração (`openspec init`) acontece no seu terminal. Se essa divisão é nova para você, leia [Como os Comandos Funcionam](how-commands-work.md) primeiro; é o ponto de confusão mais comum.

## "Facilitadores, não portões"

Essa frase aparece em todo lugar no BR-OpenSpec, então aqui está o que ela significa em termos simples.

Processos de spec da velha escola são cascatas: termine o planejamento, *então* você tem permissão para implementar, e voltar atrás é doloroso. O BR-OpenSpec recusa isso. A ordem `proposta → specs → design → tarefas` mostra o que se torna *possível* em seguida, não o que você é *obrigado* a fazer em seguida.

Descobriu durante a implementação que o design estava errado? Edite o `design.md` e siga em frente. Percebeu que o escopo deveria encolher? Atualize a proposta. Nada trava. As dependências existem apenas para que a IA tenha o contexto de que precisa (não dá para escrever boas tarefas sem specs em que se basear), não para encurralar você.

A força aqui é a honestidade: trabalho real é bagunçado e iterativo, e o BR-OpenSpec permite que ele seja. O trade-off é disciplina: como nada empurra você para frente, cabe a você manter uma mudança focada em vez de deixá-la se espalhar. O guia [Fluxos de Trabalho](workflows.md) tem bons hábitos para isso.

## Por que vale o pequeno overhead

Verdade simples: o BR-OpenSpec adiciona um passo. Você escreve um plano curto antes de construir. Então, o que você ganha com isso?

- **Você pega rumos errados antes que eles custem caro.** Corrigir um mal-entendido em uma proposta de um parágrafo é grátis. Corrigi-lo depois que a IA escreveu 400 linhas, não.
- **O plano e o código ficam no mesmo repo.** Seis meses depois, a spec diz a você (e à próxima sessão de IA) por que o sistema funciona como funciona.
- **Mudanças são revisáveis.** Uma pasta de mudança é um pacote arrumado: leia a proposta, folheie os deltas, confira as tarefas. Sem arqueologia pelo histórico do chat.
- **Cabe em bases de código existentes.** Deltas significam que você pode especificar uma mudança em um app de 50.000 linhas sem documentar tudo antes.

E o trade-off honesto: para uma correção de uma linha realmente trivial, a cerimônia pode não compensar, e tudo bem. O BR-OpenSpec é projetado para ser leve, mas não é grátis. Use-o onde o alinhamento importa, o que acaba sendo na maior parte do tempo quando você trabalha com uma IA que constrói confiantemente qualquer coisa que você pediu vagamente.

## Para onde ir em seguida

- Novo por aqui? [Primeiros Passos](getting-started.md) percorre a primeira mudança por completo.
- Ainda não sabe o que construir? [Explore Primeiro](explore.md) é o lugar para começar.
- Confuso sobre onde os comandos rodam? [Como os Comandos Funcionam](how-commands-work.md).
- Quer a versão profunda de tudo acima? [Conceitos](concepts.md).
- Aprende por exemplos? [Exemplos e Receitas](examples.md).
- Precisa de um termo definido? [Glossário](glossary.md).

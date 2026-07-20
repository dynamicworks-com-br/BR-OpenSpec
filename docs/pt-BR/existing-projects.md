# Usando o BR-OpenSpec em um Projeto Existente

**Você não documenta sua base de código inteira para começar. Você escreve specs apenas para o que está prestes a mudar.** Esta é a coisa mais importante a saber sobre adotar o BR-OpenSpec num projeto existente, e é por isso que o BR-OpenSpec é construído brownfield-first.

Uma preocupação comum soa assim: "Meu app tem 80.000 linhas. Preciso escrever specs para tudo antes que o BR-OpenSpec seja útil?" Não. Você odiaria isso, e nós também. O BR-OpenSpec faz suas specs crescerem uma mudança por vez. Sua primeira mudança documenta a fatia que toca, a próxima documenta a fatia dela, e ao longo de meses suas specs se preenchem naturalmente em torno do trabalho que você realmente faz.

Este guia mostra como começar no primeiro dia sem tentar abraçar o oceano.

## A versão de trinta segundos

```bash
$ cd seu-projeto-existente
$ openspec init          # adiciona openspec/ e os comandos da sua ferramenta de IA
```

Depois, no chat da sua IA:

```text
/opsx:explore            # opcional: faça a IA ler a área que você vai tocar
/opsx:propose <uma mudança real e pequena que você realmente precisa>
/opsx:apply
/opsx:archive
```

Suas specs agora descrevem exatamente a parte do sistema que essa mudança tocou, e nada mais. Isso está correto. Você pode parar de se preocupar com as outras 80.000 linhas.

## Por que delta-first é o truque inteiro

As mudanças do BR-OpenSpec são escritas como **deltas**: `ADDED`, `MODIFIED`, `REMOVED`. Um delta descreve o que está mudando em relação ao comportamento atual, não o sistema inteiro.

Isso é exatamente o que trabalho brownfield precisa. Você raramente está construindo do nada. Você está adicionando um campo, corrigindo um redirecionamento, apertando um timeout. Um delta permite especificar essa única mudança com precisão, sem antes escrever uma spec de 40 páginas de tudo ao redor.

Então seu diretório `openspec/specs/` não começa cheio e completo. Ele começa quase vazio e acumula. Cada mudança arquivada mescla seu delta. A spec de `auth/` só fica completa depois que você fez várias mudanças de auth, que é exatamente quando você quer que ela seja completa.

Se quiser a mecânica mais profunda, veja [Conceitos: Delta Specs](concepts.md#delta-specs).

## Sua primeira mudança numa base de código real

Escolha algo pequeno e real. Não um brinquedo, não uma reescrita. Uma mudança que você ia fazer esta semana de qualquer jeito. Primeiras mudanças pequenas ensinam o fluxo de trabalho com apostas baixas.

**Passo 1: Deixe a IA ler a área relevante.** É aqui que `/opsx:explore` mostra seu valor numa base de código grande ou desconhecida. Aponte-o para a parte que você está prestes a tocar e deixe-o mapear como as coisas funcionam antes de propor qualquer coisa.

```text
Você: /opsx:explore

IA:   O que você gostaria de explorar?

Você: Preciso adicionar rate limiting à nossa API pública, mas não
      tenho certeza de como as requisições fluem hoje pelo middleware.

IA:   Deixe-me rastrear... [lê o router, a pilha de middleware e a
      configuração]
      As requisições chegam ao Express, passam pelo middleware de auth
      e então pelos seus controllers. Não há camada de rate limiting
      hoje. O ponto de inserção mais limpo é um middleware logo após
      o auth. Quer que eu dimensione isso?
```

Note que a IA agora entende sua estrutura real, então a proposta que ela escrever vai caber no seu código, não num template genérico. Numa base de código grande, este único hábito poupa a maior dor. Veja [Explore Primeiro](explore.md).

**Passo 2: Proponha a mudança.** A proposta e sua delta spec capturam apenas esta mudança.

```text
Você: /opsx:propose add-api-rate-limiting
```

**Passo 3: Construa e arquive** com `/opsx:apply` e `/opsx:archive`, como qualquer mudança. Depois de arquivar, você tem uma spec real para o seu comportamento de rate limiting, nascida de uma mudança que você precisava de qualquer forma.

## Prefere um tour guiado? Use o onboard

Se você preferir ver o loop inteiro acontecer no seu próprio código com narração, o comando expandido `/opsx:onboard` faz exatamente isso: ele varre sua base de código atrás de uma melhoria pequena e segura, depois guia você por propor, construir e arquivar, explicando cada passo.

Ative os comandos expandidos primeiro:

```bash
$ openspec config profile      # selecione os fluxos de trabalho expandidos
$ openspec update              # aplique-os a este projeto
```

Depois, no chat:

```text
/opsx:onboard
```

É a introdução mais suave possível num projeto real, e deixa você com uma mudança genuína (pequena) que pode manter ou descartar. Veja [Comandos: `/opsx:onboard`](commands.md#opsxonboard).

## "Mas eu já tenho documentos de requisitos"

Talvez você tenha um PRD, uma SRS, uma spec formal, até modelos TLA+. Ótimo. Você não os importa no atacado, e também não os joga fora.

Trate os documentos existentes como **material de origem para exploração**, não como specs a converter. Quando iniciar uma mudança, cole ou aponte a IA para a seção relevante, e deixe-a moldar um delta BR-OpenSpec focado a partir dele. O delta captura o comportamento que você está mudando agora, na forma testável de requisito-e-cenário do BR-OpenSpec. Seus documentos originais ficam onde estão, como pano de fundo.

A razão honesta: as specs do BR-OpenSpec são deliberadamente behavior-first e escopadas a mudanças. Um PRD de 40 páginas é um artefato diferente, com um trabalho diferente. Forçar uma conversão única em massa tende a produzir uma spec grande e desatualizada em que ninguém confia. Deixar as specs crescerem a partir de mudanças reais as mantém precisas.

```text
Você: /opsx:explore
Você: Aqui está a seção do nosso PRD sobre checkout. Vou implementar
      o requisito de "checkout de convidado" em seguida.
      [cole o requisito relevante]
IA:   [lê, faz perguntas de esclarecimento, depois ajuda a dimensionar
      uma mudança]
Você: /opsx:propose add-guest-checkout
```

## Organizando specs numa base de código grande

Specs vivem sob `openspec/specs/`, agrupadas por **domínio**: uma área lógica que corresponde a como sua equipe pensa sobre o sistema. Você não precisa desenhar a taxonomia inteira de antemão. Crie uma pasta de domínio quando sua primeira mudança naquela área precisar de uma.

Formas comuns de fatiar domínios:

- **Por área de funcionalidade:** `auth/`, `payments/`, `search/`
- **Por componente:** `api/`, `frontend/`, `workers/`
- **Por contexto delimitado:** `ordering/`, `fulfillment/`, `inventory/`

Escolha o que fizer um recém-chegado assentir. Você pode refinar depois. Veja [Conceitos: Specs](concepts.md#specs).

## Monorepos e trabalho que atravessa repos

Para um monorepo, o modelo mais simples é um diretório `openspec/` na raiz do repo, com domínios que mapeiam para seus pacotes ou serviços. Isso cobre a maioria das equipes.

Se seu trabalho genuinamente atravessa **múltiplos repositórios** (ou vários pacotes que você trata como separados), o mesmo modelo se aplica por repo: um diretório `openspec/` em cada repositório, com specs que descrevem o comportamento daquele repo. Mantenha as mudanças relacionadas alinhadas por convenção — nomes de mudança iguais entre repos e links entre as propostas — para que a história continue legível dos dois lados.

## Algumas cautelas honestas

- **Resista ao impulso de preencher tudo retroativamente.** Escrever specs para código que você não está mudando parece produtivo e geralmente não é. Essas specs desatualizam, porque nada as força a acompanhar a realidade. Deixe mudanças reais dirigirem suas specs.
- **Mantenha as primeiras mudanças pequenas.** Suas primeiras mudanças são tanto sobre aprender o ritmo quanto sobre entregar. Um escopo apertado torna o loop rápido e as lições baratas.
- **Commite `openspec/` no git.** Suas specs e seu arquivo morto pertencem ao controle de versão, ao lado do código que descrevem.
- **Dê contexto à IA.** Numa base de código grande com convenções fortes, preencha o `context:` do `openspec/config.yaml` para que toda proposta respeite sua stack e padrões. Veja [Personalização](customization.md#configuração-do-projeto).

## Para onde ir em seguida

- [Explore Primeiro](explore.md) - o hábito-chave para entender código antes de mudá-lo
- [Primeiros Passos](getting-started.md) - o walkthrough completo da primeira mudança
- [Editando e Iterando em uma Mudança](editing-changes.md) - ajustando uma mudança conforme você aprende
- [Conceitos: Delta Specs](concepts.md#delta-specs) - por que deltas tornam o trabalho brownfield limpo
- [Personalização](customization.md) - ensine ao BR-OpenSpec as convenções do seu projeto

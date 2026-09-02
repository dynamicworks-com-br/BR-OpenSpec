# Escrevendo Boas Specs

Você raramente escreve uma spec a partir de uma página em branco. Você descreve uma mudança em linguagem simples, `/opsx:propose` elabora os requisitos e cenários, e então você os torna bons. Esta página é sobre essa última parte — como é "bom", e como direcionar a IA para lá.

É a companheira de [Revisando uma Mudança](reviewing-changes.md): revisar é pegar os pontos fracos de um rascunho; escrever é saber do que um rascunho forte é feito.

## Uma spec é comportamento, não código

Uma spec diz o que seu sistema *faz*, em termos que qualquer pessoa poderia verificar — não como ele é construído. É feita de **requisitos** (declarações de comportamento) e **cenários** (exemplos concretos que os comprovam).

```markdown
### Requirement: Tempo Limite de Sessão
O sistema SHALL expirar uma sessão após 30 minutos de inatividade.

#### Scenario: Tempo limite por inatividade
- GIVEN uma sessão autenticada
- WHEN 30 minutos se passam sem atividade
- THEN a sessão é invalidada e o usuário precisa se reautenticar
```

Mantenha o *como* — a fila, a biblioteca, o schema da tabela — no `design.md` ou no código. Quando comportamento e implementação se misturam num único requisito, o requisito deixa de ser testável e começa a desatualizar no momento em que o código muda.

## O que faz um bom requisito

Um bom requisito é um comportamento, declarado tão claramente que você poderia entregá-lo a outra pessoa para testar.

- **Uma declaração, um `SHALL`/`MUST`.** Se um requisito tem três cláusulas de "e também", ele é na verdade três requisitos. Divida-os.
- **Observável.** Alguém de fora do código deveria conseguir dizer se ele se sustenta. "O sistema SHALL mostrar um banner de erro quando o upload exceder 10 MB" é observável. "O sistema SHALL lidar bem com uploads grandes" não é.
- **A força certa.** O BR-OpenSpec usa as palavras-chave RFC 2119, e elas significam coisas diferentes:

  | Palavra-chave | Significado |
  |---------|---------|
  | `MUST` / `SHALL` | Um requisito rígido. Inegociável. |
  | `SHOULD` | Uma recomendação forte, com margem para uma exceção justificada. |
  | `MAY` | Genuinamente opcional. |

  Use `MUST`/`SHALL` por padrão. Use `SHOULD` apenas quando você realmente quer dizer "a menos que haja um bom motivo para não".

O teste para um requisito: *um testador que nunca viu o código conseguiria dizer se ele passou?* Se não, ele precisa ser afiado.

## O que faz um bom cenário

Cenários são onde um requisito mostra seu valor. Cada um é um GIVEN / WHEN / THEN concreto que poderia virar um teste automatizado.

- **Ele exercita seu requisito.** Um cenário que apenas repete o requisito com outras palavras não testa nada. Faça dele uma situação específica com um resultado específico.
- **Cubra os casos que importam, não só o caminho feliz.** O login válido é fácil. A entrada vazia, o token expirado, o segundo clique, a coisa que dá errado — é aí que os bugs moram, e onde um cenário vale mais.
- **Nomeie o caso no título.** "Scenario: Rejeita um token expirado" diz a um revisor o que está coberto num relance; "Scenario: Teste 2", não.

Um hábito útil: antes de aprovar, pergunte *qual é o único caso que eu ficaria chateado de ver quebrado?* — e garanta que um cenário o nomeie.

## Escolha o tipo certo de delta

Uma mudança descreve suas edições às specs com três tipos de seção. Usar o certo mantém suas specs arquivadas honestas:

- **`## ADDED Requirements`** — comportamento novinho em folha, que não existia antes.
- **`## MODIFIED Requirements`** — comportamento que já existia e está mudando. Inclua a nova versão completa; uma nota curta sobre o que mudou ajuda o revisor.
- **`## REMOVED Requirements`** — comportamento que está indo embora, com uma linha sobre o porquê.

No arquivamento, ADDED é anexado à spec principal, MODIFIED substitui a versão antiga, e REMOVED é retirado dela. Remova o último requisito que uma capability tem e você a aposenta: em vez de deixar uma spec sem nada dentro, o arquivamento exclui `openspec/specs/<capability>/spec.md`. Como esse é o único passo do arquivamento que remove um arquivo, ele precisa ser pedido — adicione `retire_capabilities: true` ao `.openspec.yaml` da mudança, ao lado do `schema:` que esse arquivo já exige. Sem isso, o arquivamento aborta e avisa você. A aposentadoria exclui o arquivo inteiro, então ela também é recusada enquanto a spec contiver qualquer coisa fora do título, do `## Purpose` e dos blocos de requisito — uma seção `## Notes`, um comentário sob um requisito. O abort nomeia essas linhas; mova-as para o `## Purpose` ou para um requisito, ou exclua a spec à mão. Para uma spec no checkout de quem chamou, a saída do arquivamento também nomeia o `git checkout` que restaura um arquivo já commitado. Se você marcar uma mudança real como ADDED, acaba com dois requisitos concorrentes; se descrever comportamento novo como MODIFIED, não há nada a substituir. Na dúvida, abra a spec atual e veja se o requisito já está lá.

Vale conhecer mais uma seção. Quando seu delta cria uma capability que ainda não existe, abra-o com `## Purpose` — uma frase ou duas sobre para que serve a capability. O arquivamento a usa como o Purpose da spec principal que ele cria; se você a omitir, ganha um placeholder `A definir` para preencher à mão. Uma spec existente já tem um Purpose, então o do delta é ignorado ali — edite `openspec/specs/<capability-path>/spec.md` diretamente para alterar um. Aqui, `<capability-path>` é o diretório relativo a `specs/`, como `user-auth` em um projeto plano ou `identity/user-auth` em um projeto organizado por domínio.

## Dimensione a mudança

O erro de autoria mais comum de todos não é um requisito mal redigido — é uma mudança tentando ser três mudanças.

**Uma boa mudança tem uma intenção que você consegue dizer em uma frase.** "Adicionar um botão de dark mode." "Aplicar rate limit ao endpoint de login." "Migrar sessões para fora de cookies." Se descrever a mudança precisa de muito "e também", esse é o sinal para dividi-la.

Sinais de que uma mudança está grande demais:

- O escopo da proposta lê como uma lista de funcionalidades não relacionadas.
- Revisá-la levaria uma tarde, então ninguém vai.
- Duas pessoas não conseguiriam trabalhar nela sem colidir.
- Metade das tarefas poderia ser entregue por conta própria.

Mudanças menores são mais fáceis de revisar, mais fáceis de construir numa sessão focada e mais fáceis de entender seis meses depois, quando o arquivo morto é tudo o que resta. Você sempre pode rodar várias mudanças em paralelo — veja [Editando e iterando](editing-changes.md) e [Fluxos de Trabalho](workflows.md).

O oposto também acontece: uma correção de typo de uma linha não precisa de três requisitos e um doc de design. Faça a cerimônia corresponder às apostas.

## Como direcionar a IA para um bom rascunho

Como `/opsx:propose` faz o primeiro rascunho, a qualidade do que você recebe acompanha a qualidade do que você dá. Você não precisa escrever requisitos à mão — precisa mirar bem a IA:

- **Declare a intenção e o limite.** *"Adicione um botão de dark mode que segue a configuração do SO na primeira carga — não toque na API de temas existente."* A metade fora-de-escopo importa tanto quanto a dentro-do-escopo.
- **Nomeie os casos com que você se importa.** *"Garanta que haja um cenário para um usuário que já escolheu um tema manualmente."* A IA cobre o que você aponta.
- **Depois edite.** É Markdown puro. Aperte um `SHALL` vago, delete um cenário que não testa nada, adicione o caso que faltou — ou peça à IA: *"o requisito de timeout está vago, fixe em 30 minutos."*

Rascunhe, afie, repita. Algumas rodadas disso produzem uma spec em que você confiaria, que é o objetivo inteiro.

## Uma checklist rápida

- [ ] Cada requisito é um comportamento observável com um `SHALL`/`MUST`.
- [ ] Nenhum detalhe de implementação está embutido nos requisitos.
- [ ] Todo requisito tem pelo menos um cenário que realmente o exercita.
- [ ] Os casos de borda e erro importantes têm cenários, não só o caminho feliz.
- [ ] Os deltas usam ADDED / MODIFIED / REMOVED corretamente contra a spec atual.
- [ ] A mudança inteira tem uma intenção que você consegue declarar em uma frase.

## Para onde ir em seguida

- [Revisando uma Mudança](reviewing-changes.md) — a passada de dois minutos que pega o que escapou.
- [Conceitos](concepts.md) — o modelo mais profundo por trás de specs, mudanças e deltas.
- [Exemplos e Receitas](examples.md) — mudanças reais do início ao fim.

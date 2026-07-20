# BR-OpenSpec em Equipe

Tudo nos outros guias funciona igual quer você esteja sozinho ou numa equipe de vinte. O que muda numa equipe são as perguntas nas bordas: onde as specs vivem, como colegas revisam um plano, e como qualquer coisa disso se encaixa no fluxo de pull request que já temos?

A resposta curta: uma mudança é só arquivos, e o BR-OpenSpec nunca toca no git. Então ele se encaixa no seu fluxo de trabalho existente em vez de substituí-lo. Esta página explicita as convenções que funcionam bem.

## Uma regra: o BR-OpenSpec não toca no git

O BR-OpenSpec lê e escreve Markdown puro sob `openspec/`. Ele nunca commita, cria branches, dá push ou pull no seu projeto. Isso significa:

- **Você commita `openspec/` como qualquer código-fonte.** Specs, mudanças ativas e o arquivo morto fazem parte da história do seu projeto. (Sim, commite a pasta inteira — veja o [FAQ](faq.md#devo-commitar-a-pasta-openspec-no-git).)
- **Uma mudança é uma pasta que você versiona como código.** `openspec/changes/add-dark-mode/` é só arquivos numa branch.
- **Tudo abaixo é convenção, não imposição.** O BR-OpenSpec não vai obrigar você a fazer desse jeito; ele simplesmente se encaixa limpo.

## O loop do dia a dia

O fluxo de trabalho que funciona bem mapeia uma mudança em uma branch e um pull request:

```
git switch -c add-dark-mode        comece uma branch, como sempre
   │
/opsx:propose add-dark-mode        elabore o plano (proposta + specs + tarefas)
   │
REVISE O PLANO                     você o lê antes de qualquer código — veja Revisando uma Mudança
   │
/opsx:apply                        construa; artefatos + código mudam juntos
   │
git commit && abra um PR           o PR contém o delta de spec E o código
   │
colega revisa, faz merge
   │
/opsx:archive                      dobre o delta para dentro de specs/, mova a mudança para archive/
```

O plano e o código vivem lado a lado na mesma branch, então seus colegas revisam ambos juntos, e seis meses depois a spec arquivada ainda explica por que o código tem a cara que tem.

## Revisando specs num pull request

É aqui que uma equipe sente o retorno. Quando um PR inclui a delta spec da mudança, o revisor ganha algo que um diff cru nunca dá: **uma declaração em linguagem simples do que esta mudança deveria fazer**, antes de ler uma única linha de código.

Uma boa ordem de revisão para o revisor:

1. **Leia o `proposal.md`** — este é o problema e o escopo certos?
2. **Leia o delta em `specs/`** — "pronto" está definido corretamente? (Esta é a passada de dois minutos de [Revisando uma Mudança](reviewing-changes.md), agora acontecendo no PR.)
3. **Depois leia o diff do código** — ele entrega exatamente aqueles requisitos?

Um revisor que discorda da *abordagem* pode dizê-lo contra a proposta, barato, em vez de relitigar isso ao longo de 300 linhas de código. Coloque a delta spec perto do topo da descrição do PR, ou aponte os revisores para a pasta da mudança, para que comecem por aí.

## Quando arquivar

Arquivar dobra os deltas de uma mudança para dentro do seu `openspec/specs/` principal e move a pasta da mudança para `openspec/changes/archive/AAAA-MM-DD-<nome>/`. Como `specs/` é a **fonte de verdade compartilhada**, o momento importa numa equipe. Duas convenções viáveis:

- **Arquive depois do merge do PR (recomendado).** A branch carrega a mudança ativa; uma vez mergeada na sua branch principal, arquive lá (geralmente um pequeno commit de acompanhamento ou uma faxina agendada). Isso mantém o `specs/` compartilhado avançando apenas com trabalho que realmente foi entregue.
- **Arquive dentro do PR.** Mais simples para equipes pequenas: o mesmo PR que adiciona o código também sincroniza e arquiva. O trade-off é que seu diff de `specs/` e seu diff de código chegam juntos, o que pode deixar o PR mais barulhento.

Escolha uma e seja consistente. De qualquer forma, `/opsx:archive` verifica que as tarefas estão completas e se oferece para sincronizar primeiro, então nada é mergeado pela metade por acidente.

## Duas pessoas, mudanças em paralelo

Como mudanças são pastas separadas, elas não colidem:

- **Mudanças diferentes, pessoas diferentes — sem problema.** `add-dark-mode` e `rate-limit-login` são pastas diferentes em branches diferentes; nunca se tocam até ambas arquivarem.
- **Uma mudança, um dono.** Duas pessoas editando a mesma pasta de mudança conflitam exatamente como duas pessoas editando o mesmo arquivo. Mantenha uma mudança com um único autor, ou divida-a em duas mudanças (outro motivo para [dimensionar](writing-specs.md#dimensione-a-mudança)).
- **O único lugar onde conflitos aparecem é `specs/`.** Se duas mudanças modificam o *mesmo* requisito, arquivar a segunda vai conflitar em `openspec/specs/…/spec.md` — resolva como qualquer conflito de merge, mantendo o requisito que reflete a realidade. Isso é raro, e é uma funcionalidade: é o git dizendo que duas mudanças discordaram sobre como o sistema deveria se comportar.

## Quando o planejamento supera um repo

Tudo acima assume que o plano vive na pasta `openspec/` do próprio repo de código, que é o padrão certo. Quando o trabalho genuinamente atravessa vários repos — uma funcionalidade tocando três serviços, ou requisitos que uma equipe mantém e outras consomem — mantenha um `openspec/` por repo e coordene por convenção: nomes de mudança iguais entre repos, links entre as propostas, e as specs de cada repo descrevendo o seu próprio lado do comportamento.

## Para onde ir em seguida

- [Revisando uma Mudança](reviewing-changes.md) — a passada de revisão, agora dentro do seu PR.
- [Escrevendo Boas Specs](writing-specs.md) — incluindo como dimensionar uma mudança para que caiba numa branch.

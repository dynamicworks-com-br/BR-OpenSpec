# Revisando uma Mudança

A promessa inteira do BR-OpenSpec é que você e sua IA **concordam sobre o que construir antes de qualquer código ser escrito.** Esse alinhamento só significa algo se você realmente ler o que a IA elaborou. Esta página é sobre os dois minutos em que você faz isso — o que abrir, em que ordem, e o que procurar.

A aposta é simples: pegar um rumo errado num plano de um parágrafo é quase grátis. Pegar o mesmo rumo errado em 300 linhas de código, não. A revisão é onde você cobra essa aposta.

## Os dois momentos em que você revisa

Há exatamente dois:

```
/opsx:propose ──► REVISE O PLANO ──► /opsx:apply ──► REVISE O CÓDIGO ──► /opsx:archive
                  (antes de qualquer código)          (/opsx:verify)
```

1. **Depois de `/opsx:propose`** (ou `/opsx:ff`), antes de `/opsx:apply` — leia o plano enquanto ele ainda é só palavras.
2. **Depois de construir**, com `/opsx:verify` — verifique que o código realmente fez o que o plano dizia.

A primeira revisão é a que mais lhe poupa, e a que as pessoas pulam. Esta página passa a maior parte do tempo nela.

## Leia nesta ordem

Uma mudança é uma pasta de Markdown puro em `openspec/changes/<nome>/`. Leia os arquivos na ordem que permite parar mais cedo se algo estiver errado:

```
openspec/changes/add-dark-mode/
├── proposal.md      1. a intenção e o escopo   ← se isto estiver errado, pare aqui
├── specs/…/spec.md  2. os requisitos           ← o coração da revisão
├── design.md        (só para mudanças maiores) — a abordagem técnica
└── tasks.md         3. o plano de trabalho
```

Você não precisa ler cada linha. Precisa responder três perguntas, uma por arquivo.

## A proposta: este é o problema certo?

Abra o `proposal.md` primeiro. Ele captura o "por quê" e o "o quê" — a intenção, o escopo, a abordagem em um parágrafo ou dois.

**Como é o bom:** uma intenção clara, um escopo que você reconhece, e um motivo para valer a pena fazer agora.

**Sinais de alerta:**

- Ele resolve um problema levemente *diferente* do que você pediu.
- O escopo cresceu — você pediu um botão de tema e a proposta também mexe em auth "já que estamos aqui".
- Está vaga. "Melhorar a página de configurações" não é um escopo; "adicionar um botão de dark mode que respeita a preferência do SO" é.

**A pergunta a responder:** *Isso corresponde ao que eu realmente pedi, e tem algo se infiltrando?* Se a resposta for não, pare — não leia adiante, corrija a proposta (veja [Reagir é barato](#reagir-é-barato)).

## Os deltas de spec: "pronto" está definido corretamente?

Este é o coração da revisão. As delta specs em `specs/` dizem o que será *verdade* quando a mudança for entregue — como requisitos e os cenários que os comprovam:

```markdown
## ADDED Requirements

### Requirement: Botão de Dark Mode
O sistema SHALL permitir que um usuário alterne entre temas claro e escuro.

#### Scenario: Respeita a preferência do SO na primeira carga
- GIVEN um usuário que nunca definiu um tema
- WHEN ele abre o app num dispositivo configurado para dark mode
- THEN o app renderiza em dark mode
```

**Como é um bom requisito:** uma única declaração clara com `SHALL`/`MUST` que você poderia entregar a um testador, e pelo menos um cenário cujo GIVEN/WHEN/THEN realmente exercita essa declaração.

**Sinais de alerta:**

- **Um requisito vago.** "O sistema SHALL ser rápido" não pode ser construído nem testado. Rápido quanto?
- **Um requisito sem cenário**, ou um cenário que não testa o requisito sob o qual está.
- **A captura mais valiosa de todas: o que está faltando.** A IA fielmente escreve o que você *disse*. Seu trabalho é notar o que você *esqueceu* de dizer. Se o caso com que você mais se importava era o da preferência do SO e nenhum cenário o menciona, é a revisão pagando por si mesma.

Leia os deltas perguntando *eu ficaria feliz se o sistema fizesse exatamente — e somente — isto?* Nada aqui é sobre código ainda, então continua barato mudar.

## As tarefas: o plano de trabalho é são?

Abra o `tasks.md` por último. É a checklist de implementação pela qual a IA vai trabalhar.

**Como é o bom:** passos ordenados, cada um rastreável a um requisito, nada misterioso.

**Sinais de alerta:**

- Uma tarefa sem requisito correspondente (de onde veio isso?).
- Uma tarefa gigante de "implementar a funcionalidade" que esconde todas as decisões reais.
- Uma tarefa que toca algo fora do escopo que você acabou de aprovar.

Você não está estimando nem microgerenciando aqui — está verificando que o plano corresponde aos requisitos que você já aceitou.

## Reagir é barato

Se alguma das três perguntas voltou errada, diga. Não há fases e nada está travado — você corrige e segue em frente. Duas formas, exatamente como em [Editando uma mudança](editing-changes.md):

- **Edite o arquivo você mesmo.** É Markdown puro; mude a linha de escopo, aperte um requisito, delete uma tarefa.
- **Diga à IA o que está errado** e deixe-a revisar: *"remova as mudanças de auth — fora de escopo,"* *"adicione um cenário para quando o usuário já escolheu um tema,"* *"divida a tarefa 3 em schema e UI."*

Depois releia a parte que você mudou. Refaça o rascunho até ser um plano que você assinaria. Esse vai-e-vem *é* o produto funcionando.

## Depois do código: verify

Uma vez construído o trabalho, `/opsx:verify` é sua segunda revisão. Ele relê os artefatos e o código e reporta divergências em três dimensões:

| Dimensão | O que verifica |
|-----------|----------------|
| **Completude** | Toda tarefa concluída, todo requisito implementado, cenários cobertos |
| **Correção** | A implementação corresponde à intenção da spec, casos de borda tratados |
| **Coerência** | As decisões de design realmente aparecem no código |

```
Você: /opsx:verify

IA:   Verificando add-dark-mode...

      COMPLETUDE
      ✓ Todas as 8 tarefas em tasks.md estão marcadas
      ✓ Todos os requisitos nas specs têm código correspondente
      ⚠ Cenário "Respeita a preferência do SO na primeira carga" não
        tem cobertura de teste
```

Ele sinaliza problemas como CRITICAL, WARNING ou SUGGESTION, e **não** bloqueia o arquivamento — traz as lacunas à tona e deixa a decisão com você. Esta é a diferença entre "a IA escreveu código" e "ela construiu o que combinamos".

`/opsx:verify` está no perfil expandido. Se você não o tem, ative-o com `openspec config profile` (depois `openspec update`), ou simplesmente releia a mudança e o diff você mesmo.

## Dimensione a revisão

Nem toda mudança merece a passada completa. Uma correção de typo de um arquivo merece uma olhada de vinte segundos. Uma mudança que toca auth, pagamentos ou dados irrecuperáveis merece cada pergunta acima. O objetivo nunca foi cerimônia — é gastar sua atenção onde um erro seria caro, e passar o olho onde não seria.

## A checklist de dois minutos

- [ ] A intenção da proposta corresponde ao que eu pedi.
- [ ] Nada extra se infiltrou no escopo.
- [ ] Todo requisito é específico o bastante para testar.
- [ ] Todo requisito tem um cenário que realmente o exercita.
- [ ] O caso com que eu mais me importo está coberto.
- [ ] As tarefas mapeiam para requisitos; nada é misterioso ou fora de escopo.
- [ ] Eu ficaria confortável se a IA construísse exatamente isto e nada mais.

Se todas as sete passarem, rode `/opsx:apply` com confiança. Se alguma falhar, isso não é um revés — são os dois minutos fazendo seu trabalho.

## Para onde ir em seguida

- [Escrevendo Boas Specs](writing-specs.md) — o outro lado: como elaborar requisitos e cenários que valem a pena aprovar.
- [Editando e Iterando em uma Mudança](editing-changes.md) — a mecânica de mudar um plano depois de começar.
- [Fluxos de Trabalho](workflows.md) — onde a revisão se encaixa no loop maior.

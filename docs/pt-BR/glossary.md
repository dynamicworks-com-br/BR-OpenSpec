# Glossário

Cada termo do BR-OpenSpec em um só lugar, definido em linguagem simples. Folheie uma vez e o resto da documentação flui mais rápido.

Os termos estão agrupados por tópico e em ordem alfabética dentro de cada grupo.

## Os substantivos centrais

**Spec.** Um documento que descreve como parte do seu sistema se comporta. Specs vivem em `openspec/specs/`, são organizadas por domínio e são feitas de requisitos e cenários. A spec é a resposta acordada para "o que este software faz?" Veja [Conceitos](concepts.md#specs).

**Fonte de verdade.** O diretório `openspec/specs/` como um todo. Ele guarda o comportamento atual e acordado do seu sistema. Mudanças propõem edições a ele; o arquivamento as aplica.

**Mudança.** Uma unidade de trabalho, empacotada como uma pasta em `openspec/changes/<nome>/`. Uma mudança reúne tudo sobre aquele trabalho: sua proposta, design, tarefas e as edições de spec que introduz. Uma mudança, uma funcionalidade ou correção.

**Artefato.** Um documento dentro de uma mudança. Os artefatos padrão são a proposta, as delta specs, o design e as tarefas. São criados em ordem de dependência e alimentam uns aos outros.

**Delta spec.** Uma spec dentro de uma mudança que descreve apenas o que está mudando, usando seções `ADDED`, `MODIFIED` e `REMOVED`, em vez de reafirmar a spec inteira. É o que permite ao BR-OpenSpec editar sistemas existentes limpamente. Veja [Conceitos](concepts.md#delta-specs).

**Domínio.** Um agrupamento lógico para specs, como `auth/`, `payments/` ou `ui/`. Você escolhe domínios que correspondem a como pensa sobre seu sistema.

## Dentro de uma spec

**Requisito.** Um único comportamento que o sistema deve ter, geralmente escrito com uma palavra-chave RFC 2119: "O sistema SHALL expirar sessões após 30 minutos." Requisitos declaram o *o quê*, não o *como*.

**Cenário.** Um exemplo concreto e testável de um requisito em ação, tipicamente na forma Given/When/Then. Cenários tornam um requisito verificável: você poderia escrever um teste automatizado a partir de um.

**Palavras-chave RFC 2119.** As palavras MUST, SHALL, SHOULD e MAY, que carregam significado padronizado sobre quão estrito é um requisito. MUST e SHALL são absolutos. SHOULD é recomendado, com margem para exceções. MAY é opcional. O nome vem do documento de padrões da internet que as definiu.

## Os artefatos

**Proposta (`proposal.md`).** O *por quê* e o *o quê* de uma mudança: sua intenção, escopo e abordagem em alto nível. O primeiro artefato que você cria.

**Design (`design.md`).** O *como*: abordagem técnica, decisões de arquitetura e os arquivos que você espera tocar. Opcional para mudanças simples.

**Tarefas (`tasks.md`).** A checklist de implementação, com caixas de seleção. A IA trabalha por ela durante `/opsx:apply` e marca os itens conforme avança.

## O ciclo de vida

**Arquivamento.** O ato de concluir uma mudança. Suas delta specs são mescladas nas specs principais, e a pasta da mudança vai para `openspec/changes/archive/AAAA-MM-DD-<nome>/`. Depois de arquivar, suas specs descrevem a nova realidade. Veja [Conceitos](concepts.md#arquivamento).

**Sync.** Mesclar as delta specs de uma mudança nas specs principais *sem* arquivar a mudança. Geralmente automático (o arquivamento se oferece para fazê-lo), mas disponível por conta própria como `/opsx:sync` para mudanças de longa duração. Veja [Comandos](commands.md#opsxsync).

## Fluxo de trabalho e comandos

**OPSX.** O fluxo de trabalho padrão atual do BR-OpenSpec, construído em torno de ações fluidas em vez de fases rígidas. Seus slash commands todos começam com `/opsx:`. Veja [Fluxo de Trabalho OPSX](opsx.md).

**Slash command.** Um comando que você digita no chat do seu assistente de IA, como `/opsx:propose`. Slash commands dirigem o fluxo de trabalho. Não são comandos de terminal. Veja [Como os Comandos Funcionam](how-commands-work.md).

**Explore (`/opsx:explore`).** O comando parceiro de raciocínio. Ele lê sua base de código, compara opções e clarifica uma ideia difusa em um plano concreto, sem criar artefatos e sem escrever código. O ponto de partida recomendado sempre que você tem um problema, mas ainda não um plano. Veja [Explore Primeiro](explore.md).

**CLI.** O programa `openspec` que você roda no seu terminal. Ele prepara projetos, lista e valida mudanças, abre o dashboard e arquiva. A metade de terminal do BR-OpenSpec. Veja [CLI](cli.md).

**Skill.** Uma pasta de instruções (`.../skills/openspec-*/SKILL.md`) que seu assistente de IA detecta e segue automaticamente. Skills são o padrão emergente entre ferramentas para entregar o fluxo de trabalho do BR-OpenSpec ao seu assistente.

**Arquivo de comando.** Um arquivo de slash command específico de uma ferramenta (`.../commands/opsx-*`). O mecanismo de entrega mais antigo, ainda suportado junto às skills. Você raramente mexe neles diretamente.

**Perfil.** O conjunto de slash commands instalados no seu projeto. **Core** (o padrão) é `propose`, `explore`, `apply`, `update`, `sync`, `archive`. O conjunto **expandido** adiciona `new`, `continue`, `ff`, `verify`, `code-review`, `bulk-archive`, `onboard`. Mude com `openspec config profile`.

**Entrega.** Se o BR-OpenSpec instala skills, arquivos de comando, ou ambos para suas ferramentas. Configurado globalmente e aplicado com `openspec update`.

## Personalização

**Schema.** A definição de quais artefatos um fluxo de trabalho tem e como eles dependem uns dos outros. O padrão embutido é `spec-driven` (proposta → specs → design → tarefas). Você pode bifurcá-lo ou escrever o seu. Veja [Personalização](customization.md#schemas-personalizados).

**Template.** Um arquivo Markdown dentro de um schema que molda o que a IA gera para um dado artefato. Editar um template muda a saída da IA imediatamente, sem rebuild.

**Configuração do projeto (`openspec/config.yaml`).** Configurações por projeto: o schema padrão, o `context:` injetado em cada pedido de planejamento e `rules:` por artefato. A forma mais fácil de ensinar ao BR-OpenSpec sua stack e convenções. Veja [Personalização](customization.md#configuração-do-projeto).

**Injeção de contexto.** Colocar o pano de fundo do projeto no campo `context:` do `config.yaml` para que ele seja adicionado automaticamente a cada artefato que a IA gera. Mais confiável do que torcer para a IA ler um arquivo separado.

**Grafo de dependências.** O grafo direcionado formado pelas relações `requires:` dos artefatos. É um DAG (grafo acíclico dirigido: as setas só apontam para frente, nunca em loop), e o BR-OpenSpec o usa para saber o que você pode criar em seguida.

**Facilitadores, não portões.** O princípio de que as dependências entre artefatos mostram o que se torna *possível* em seguida, não o que é *obrigatório* em seguida. Você pode revisitar e editar qualquer artefato a qualquer momento. Veja [Conceitos Essenciais em Resumo](overview.md#facilitadores-não-portões).

## Veja também

- [Conceitos Essenciais em Resumo](overview.md): as cinco ideias, em uma página
- [Conceitos](concepts.md): a explicação longa
- [Como os Comandos Funcionam](how-commands-work.md): slash commands versus a CLI

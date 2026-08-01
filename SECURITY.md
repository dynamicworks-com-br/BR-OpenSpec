# Política de Segurança

## Como reportar uma vulnerabilidade

Reporte privadamente através dos [GitHub Security Advisories](https://github.com/dynamicworks-com-br/BR-OpenSpec/security/advisories/new). Por favor, não abra uma issue pública para uma vulnerabilidade suspeita.

Inclua o que puder: versão afetada, passos de reprodução e o impacto que você acredita que ela tem. Nosso objetivo é confirmar o recebimento em até 3 dias úteis e entregar uma correção ou uma decisão em até 30 dias. Relatos válidos são creditados no advisory, a menos que você prefira permanecer anônimo.

## Versões suportadas

As correções são publicadas na versão mais recente no npm. Versões antigas não recebem patches — atualize para obter a correção.

## Modelo de ameaças

O BR-OpenSpec é uma ferramenta de linha de comando local. Não tem servidor, não escuta portas de rede e não roda nenhum daemon privilegiado. Ele lê e escreve markdown no diretório em que você o executa, usando caminhos que você fornece, com as permissões do seu próprio usuário. Pode oferecer atualizar a si mesmo durante o `openspec update`, e somente com o seu consentimento. Envia telemetria anônima de uso, que você pode desativar com `OPENSPEC_TELEMETRY=0`.

Isso define o que é e o que não é uma vulnerabilidade aqui:

| No escopo | Fora do escopo |
| --- | --- |
| Execução de código disparada pelo parsing de um arquivo de spec, config ou template | Ler ou escrever um caminho de arquivo que você mesmo passou para a CLI |
| Escapar do diretório para o qual o BR-OpenSpec foi apontado, via entrada não confiável | Achados de análise estática em joins de caminho sem entrada não confiável |
| Vazamento de credenciais ou de conteúdo de arquivos via telemetria ou logs | Vulnerabilidades em devDependencies que não são distribuídas no pacote publicado |
| Prototype pollution ou injeção alcançável a partir de um arquivo de config ou spec | Negação de serviço contra a sua própria máquina usando a sua própria entrada |

Se você acha que algo está na fronteira, reporte e nós resolvemos juntos.

## Conteúdo do pacote publicado

O pacote npm `@dynamicworks/br-openspec` publica `dist/`, `bin/`, `schemas/` e `scripts/postinstall.js`. Ferramentas de build e teste (vite, rollup, vitest, eslint e suas dependências transitivas) não são publicadas. Scanners que leem o `pnpm-lock.yaml` sem separar o escopo das dependências vão reportar advisories de pacotes que nunca chegam a uma cópia instalada do BR-OpenSpec.

Você não precisa confiar cegamente — instale o pacote e veja:

```sh
npm install @dynamicworks/br-openspec
ls node_modules | grep -E '^(vite|rollup|vitest|eslint|js-yaml|minimatch)$'   # sem correspondências
```

`pnpm audit --prod` neste repositório reporta o mesmo escopo, e o CI o executa em todo pull request.

## O que a CLI faz na sua máquina

| Superfície | Comportamento |
| --- | --- |
| Script de instalação | `scripts/postinstall.js` imprime uma linha sugerindo autocompletions do shell. Não faz requisição de rede, não escreve arquivos e não executa shell. Completions são opt-in via `openspec completion install`. |
| Executar outros programas | Toda chamada que passa por um shell usa um literal fixo (`which gh`, `gh auth status`). Qualquer coisa que carrega entrada sua — texto de issues, caminhos de editor, o caminho passado para `openspec update` — usa um array de argumentos, nunca interpolação de string num shell. No Windows, shims `.cmd` são lançados através do `cross-spawn`, que escapa argumentos em vez de concatená-los. |
| Instalar software | `openspec update` pode executar `npm install -g @dynamicworks/br-openspec@latest` e depois reexecutar `openspec update` com a CLI atualizada. Ele faz isso somente depois que você responde sim a um prompt, somente para o próprio pacote BR-OpenSpec, somente quando o npm é o dono da instalação, e nunca em CI ou num shell não interativo. Uma instalação global fica fora do seu projeto, então roda com as suas permissões lá e executa quaisquer lifecycle scripts que o pacote publicado traz. Em seguida, ele lê de volta a versão do binário instalado em vez de assumir que o upgrade aconteceu. Recuse e ele imprime o comando para você executar por conta própria. |
| Telemetria | Nome do comando, versão do BR-OpenSpec e um UUID aleatório gerado localmente. Sem caminhos de arquivo, sem conteúdo de arquivos, sem ambiente, sem hostname, e a captura de IP é explicitamente desativada. Desative com `OPENSPEC_TELEMETRY=0` ou `DO_NOT_TRACK=1`; é desligada automaticamente em CI. |
| Rede | Telemetria quando habilitada, e uma requisição ao registry npm durante o `openspec update` para verificar se uma CLI mais nova foi publicada. Essa requisição não envia dados sobre você além do que qualquer requisição HTTP revela, roda uma vez por `openspec update` sem nada cacheado, e é pulada quando `CI` está definido com qualquer valor que não seja um valor de desligamento explícito, sob `NODE_ENV=test`, ou quando `OPENSPEC_NO_UPDATE_CHECK`, `DO_NOT_TRACK=1` ou `OPENSPEC_TELEMETRY=0` estão definidos. Ler, escrever e validar specs é inteiramente local. |

## Verificações automatizadas

| Ferramenta | Cobertura |
| --- | --- |
| [Dependabot](https://github.com/dynamicworks-com-br/BR-OpenSpec/security/dependabot) | Alertas de dependências mais PRs semanais de atualização para a CLI e para as actions de CI |
| Dependency review | Bloqueia um pull request que introduz uma dependência de severidade alta |
| `pnpm audit` | Dependências publicadas são auditadas em todo pull request, em pushes na `main` e semanalmente. Advisory em pull requests, para que uma mudança não relacionada não seja bloqueada; falha nos demais eventos, para que um advisory novo apareça mesmo quando nenhuma dependência mudou. Ferramentas de build são sempre advisory. |

Os alertas são triados contra o modelo de ameaças acima, então um achado em ferramentas que só existem em build é corrigido na cadência normal de atualizações, e não tratado como incidente.

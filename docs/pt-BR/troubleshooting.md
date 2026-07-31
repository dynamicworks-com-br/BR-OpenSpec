# Solução de Problemas

Correções concretas para problemas concretos. Cada entrada nomeia um sintoma, explica a causa provável em uma frase e dá a correção. Se você não vir seu problema aqui, o [FAQ](faq.md) pode ajudar, e as [GitHub Issues](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues) com certeza ajudam.

## Instalação e configuração

### `openspec: command not found`

A CLI não está instalada, ou seu shell não a encontra. Instale-a globalmente e verifique:

```bash
npm install -g @dynamicworks/br-openspec@latest
openspec --version
```

Se instalou mas ainda não é encontrado, seu prefixo global do npm provavelmente não está no seu `PATH`. Rode `npm config get prefix` para ver o diretório de prefixo. Em Unix/macOS/Linux, os executáveis globais ficam em `<prefix>/bin`; no Windows, ficam diretamente em `<prefix>`. Adicione o diretório aplicável ao perfil do seu shell ou ao `PATH`.

### "Requires Node.js 20.19.0 or higher"

O BR-OpenSpec roda em Node 20.19.0+. Verifique sua versão e atualize se necessário:

```bash
node --version
```

Se você usa o bun para instalar o BR-OpenSpec, note que o BR-OpenSpec ainda *roda* sobre o Node, então você precisa do Node 20.19.0+ disponível no seu `PATH` de qualquer forma. Veja [Instalação](installation.md).

### `openspec init` não configurou minha ferramenta de IA

O init pergunta quais ferramentas configurar. Se você pulou a sua ou quer adicionar outra, simplesmente rode de novo, ou use a forma não interativa:

```bash
openspec init --tools claude,cursor
```

A lista completa de IDs de ferramentas está em [Ferramentas Suportadas](supported-tools.md). Use `--tools all` para tudo, `--tools none` para pular a configuração de ferramentas.

## Comandos não aparecem

Se `/opsx:propose` (ou o equivalente da sua ferramenta) não aparece ou não faz nada, percorra esta lista. Está ordenada do mais rápido de verificar primeiro.

1. **Você pode estar no lugar errado.** Slash commands vão no chat do seu assistente de IA, não no seu terminal. Se você digitou `/opsx:propose` no seu shell, é isso. Veja [Como os Comandos Funcionam](how-commands-work.md).

2. **Regenere os arquivos.** Da raiz do seu projeto:

   ```bash
   openspec update
   ```

   Isso reescreve os arquivos de skill e comando para cada ferramenta que você configurou.

   Os arquivos de instrução vêm da CLI *instalada*, então uma CLI desatualizada reporta tudo como atualizado sem jamais escrever os fluxos de trabalho mais novos. O `openspec update` agora verifica isso e oferece a atualização — aceite a oferta se a vir.

3. **Reinicie seu assistente.** A maioria das ferramentas varre skills e comandos na inicialização. Uma janela nova geralmente resolve.

4. **Confirme que os arquivos existem.** Para o Claude Code, verifique que `.claude/skills/` contém pastas `openspec-*`. Outras ferramentas usam seus próprios diretórios, todos listados em [Ferramentas Suportadas](supported-tools.md).

5. **Verifique que você inicializou este projeto.** Skills são escritas por projeto. Se você clonou um repo ou trocou de pasta, rode `openspec init` (ou `openspec update`) lá.

6. **Confirme que sua ferramenta suporta arquivos de comando.** Kimi Code, ForgeCode, Mistral Vibe, Trae e o alvo `.agents` compartilhado não recebem arquivos de comando `opsx-*` gerados; elas usam invocações baseadas em skills, então `/opsx` nunca vai autocompletar para elas. Digite `/skill:openspec-propose` no Kimi Code e `/openspec-propose` nas demais. O alvo `.agents` compartilhado é neutro em relação a fornecedores, então `/openspec-propose` é a forma comum, não uma garantida — se o seu assistente não responder a ela, consulte a documentação dele sobre como invocar uma skill. Os arquivos de comando do Codex ficam no diretório global do Codex (`$CODEX_HOME/prompts/opsx-*.md`), e suas skills são invocadas como `$openspec-propose`. O Amazon Q recebe arquivos de comando, mas os carrega na sua biblioteca de prompts em vez do menu de barra — digite `@opsx-propose` lá, não `/opsx`. A forma de cada ferramenta está listada em [Como Invocar](supported-tools.md#como-invocar).

## Trabalhando com mudanças

### "Change not found"

O comando não conseguiu dizer qual mudança você quis dizer. Nomeie-a explicitamente, ou veja o que existe:

```bash
openspec list                    # ver mudanças ativas
/opsx:apply add-dark-mode        # nomeie a mudança no chat
```

Confirme também que você está no diretório de projeto certo.

### "No artifacts ready"

Cada artefato ou já foi criado ou está bloqueado esperando uma dependência. Veja o que está bloqueando:

```bash
openspec status --change <nome>
```

Depois crie primeiro a dependência que falta. Lembre-se da ordem: a proposta habilita specs e design; specs e design juntos habilitam tarefas.

### `openspec validate` reporta avisos ou erros

A validação verifica suas specs e mudanças quanto a problemas estruturais. Leia a mensagem: ela nomeia o arquivo e o problema.

```bash
openspec validate <nome>           # validar um item
openspec validate --all            # validar tudo
openspec validate --all --strict   # verificações mais estritas, boas para CI
```

Causas comuns são uma seção obrigatória faltando (como uma spec sem cenários) ou um cabeçalho de delta malformado. Corrija o arquivo e rode de novo. A [referência da CLI](cli.md#openspec-validate) documenta o formato da saída.

Uma mensagem merece uma nota própria:

```text
MODIFIED "<requisito>" omite cenário(s) que o spec atual ainda tem: "<cenário>"
```

Um requisito `MODIFIED` substitui o bloco inteiro do requisito, então ele precisa carregar todos os cenários que sobrevivem à mudança, não apenas os que você editou. Copie os cenários nomeados de `openspec/specs/<capability>/spec.md` de volta para o delta. Isso costuma aparecer em uma mudança antiga depois que a mudança de outra pessoa adicionou um cenário ao mesmo requisito — o archive recusa essa mudança de qualquer forma, e a validação agora avisa antes de você implementá-la.

### A IA criou artefatos incompletos ou errados

A IA não tinha contexto suficiente. Algumas alavancas ajudam:

- Adicione contexto do projeto em `openspec/config.yaml` para que sua stack e convenções sejam injetadas em cada pedido. Veja [Personalização](customization.md#configuração-do-projeto).
- Adicione `rules:` por artefato para orientação que só se aplica a, digamos, specs.
- Dê uma descrição mais detalhada ao propor.
- Use o `/opsx:continue` expandido para criar um artefato por vez e revisar cada um, em vez de `/opsx:ff` fazendo todos de uma vez.

### O arquivamento não termina, ou avisa sobre tarefas incompletas

O arquivamento não *bloqueia* por tarefas incompletas, mas avisa você, porque arquivar normalmente significa que o trabalho está concluído. Se restam tarefas de propósito (você está arquivando uma mudança parcial), prossiga. Caso contrário, termine as tarefas primeiro. O arquivamento também se oferece para mesclar suas delta specs nas specs principais se você ainda não sincronizou; diga sim, a menos que tenha um motivo para não o fazer.

### "User force closed the prompt with 0 null"

Algo executou `openspec archive` onde nada consegue responder a uma pergunta — um agente de IA chamando-o a partir de uma ferramenta, um job de CI, ou qualquer shell com stdin fechado. O arquivamento faz até três confirmações, e uma que não pode ser respondida costumava falhar com essa mensagem crua.

Passe `--yes` para respondê-las de antemão:

```bash
openspec archive <nome-da-alteração> --yes
```

Mantenha quaisquer flags que você já estava passando — `--skip-specs` e `--no-validate` mudam o que o arquivamento faz, então uma reexecução com `--yes` puro não é o mesmo comando. As versões atuais nomeiam a flag para você e imprimem uma linha `Correção:` que você pode colar. Se você pretendia escolher de uma lista, passe o nome da mudança explicitamente: o seletor também precisa de uma resposta.

## Configuração

### Meu `config.yaml` não está sendo aplicado

Três suspeitos de sempre:

1. **Nome de arquivo errado.** Deve ser `openspec/config.yaml`, não `.yml`.
2. **YAML inválido.** Passe por qualquer validador de YAML; a CLI também reporta erros de sintaxe com números de linha.
3. **Você esperava precisar reiniciar.** Não precisa. Mudanças de configuração fazem efeito imediatamente.

### "Unknown artifact ID in rules: X"

Uma chave sob `rules:` não corresponde a nenhum artefato do seu schema. Para o schema padrão `spec-driven`, os IDs válidos são `proposal`, `specs`, `design`, `tasks`. Para ver os IDs de qualquer schema:

```bash
openspec schemas --json
```

### "Context too large"

O campo `context:` tem um limite de 50KB, de propósito, porque é injetado em cada pedido. Resuma-o, ou aponte para docs mais longos em vez de colá-los. Contexto enxuto também produz resultados melhores e mais rápidos.

### "Schema not found"

O nome de schema que você referenciou não existe. Liste o que está disponível e confira a grafia:

```bash
openspec schemas                    # listar schemas disponíveis
openspec schema which <nome>        # ver de onde um schema é resolvido
openspec schema init <nome>         # criar um personalizado
```

Veja [Personalização](customization.md#schemas-personalizados).

## Migração do fluxo de trabalho legado

### "Legacy files detected in non-interactive mode"

Você está em CI ou num shell não interativo, e o BR-OpenSpec encontrou arquivos antigos para limpar, mas não pode perguntar. Aprove automaticamente:

```bash
openspec init --force
```

Para o Codex, o BR-OpenSpec pode detectar arquivos de prompt gerenciados antigos em `$CODEX_HOME/prompts` ou `~/.codex/prompts`. Essa limpeza é limitada aos nomes de arquivo de prompt legados do Codex na lista de permissões do BR-OpenSpec, e o `openspec init` não interativo remove apenas os arquivos cujas skills `.codex/skills/openspec-*` substitutas existem. O `openspec update` não interativo não toca em nenhuma limpeza de legado, a menos que você passe `--force`.

### Comandos não apareceram depois de migrar

Reinicie sua IDE. Skills são detectadas na inicialização. Se ainda não aparecerem, rode `openspec update` e confira as localizações dos arquivos em [Ferramentas Suportadas](supported-tools.md).

### Meu antigo `project.md` não foi migrado

Isso é intencional. O BR-OpenSpec nunca deleta `project.md` automaticamente porque ele pode conter contexto que você escreveu. Mova as partes úteis para a seção `context:` do `config.yaml`, depois delete-o você mesmo. O [Guia de Migração](migration-guide.md#migrando-projectmd-para-configyaml) percorre isso, incluindo um prompt que você pode entregar à sua IA para fazer a destilação.

## Ainda travado?

- **GitHub Issues:** [github.com/dynamicworks-com-br/BR-OpenSpec/issues](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues)
- **Do seu terminal:** `openspec feedback "o que deu errado"` abre uma issue para você.

Ao reportar um problema, inclua sua versão do BR-OpenSpec (`openspec --version`), sua versão do Node (`node --version`), sua ferramenta de IA e o comando exato com a saída. Isso torna a ajuda muito mais rápida.

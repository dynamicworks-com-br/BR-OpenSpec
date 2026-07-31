---
name: openspec-bulk-archive-change
description: Arquiva múltiplas changes concluídas de uma vez. Use ao arquivar várias changes paralelas.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Arquiva múltiplas changes concluídas em uma única operação.

Esta skill permite arquivar changes em lote, tratando conflitos de specs de forma inteligente verificando a codebase para determinar o que está realmente implementado.

**Entrada**: Nenhuma necessária (solicita seleção)

**Passos**

1. **Obtenha as changes ativas**

   Execute `openspec list --json` para obter todas as changes ativas.

   Se não existirem changes ativas, informe o usuário e pare.

2. **Solicite a seleção de changes**

   Peça ao usuário que escolha as changes (multi-seleção):
   - Mostre cada change com seu schema
   - Inclua uma opção para "Todas as changes"
   - Permita qualquer número de seleções (1+ funciona, 2+ é o caso típico)

   **IMPORTANTE**: NÃO selecione automaticamente. Sempre deixe o usuário escolher.

   **Carregue as entradas atuais de arquivamento uma vez antes da validação em lote:**

   Escolha uma change selecionada e execute
   `openspec instructions archive --change "<change-selecionada>" --json`.
   Essa consulta é consultiva e opcional: ela só fornece entradas extras de
   prompt, então nunca deve bloquear o lote. Se falhar ou retornar JSON
   inválido — por exemplo em um CLI mais antigo que ainda não suporta este
   comando — continue o lote sem contexto e sem orientação de operação. Não
   reporte erro e não pare.

   Uma resposta válida pode omitir `context` e `operationGuidance`. Trate
   `context` como uma entrada obrigatória em nível de prompt para todo o
   lote: leia e considere esse conteúdo, aplicando fatos, convenções e
   restrições relevantes do projeto. Trate `operationGuidance` como conselho
   aditivo opcional: leia e considere cada entrada, seguindo as que forem
   aplicáveis e compatíveis com o workflow em lote embutido.

   Mantenha ambos os campos separados da análise de conflitos, das escolhas
   explícitas do usuário, dos caminhos resolvidos, das verificações do CLI e
   dos contratos de comandos. Se o contexto conflitar com uma dessas entradas
   controladoras, reporte o conflito e preserve o valor controlador. Se a
   orientação for inaplicável ou conflitar com uma entrada controladora, não a
   siga e explique por quê. Não infira prompts ignorados, caminhos substitutos
   ou flags a partir desses campos, e não copie o texto deles verbatim para
   specs, changes ou resumos. Estes são contratos de comportamento em nível de
   prompt, não verificações impostas.

3. **Validação em lote - colete o status de todas as changes selecionadas**

   Para cada change selecionada, colete:

   a. **Status dos artifacts** - Execute `openspec status --change "<nome>" --json`
      - Analise `schemaName` e lista de `artifacts`
      - Note quais artifacts estão `done` vs outros estados

   b. **Conclusão de tarefas** - Leia `openspec/changes/<nome>/tasks.md`
      - Conte `- [ ]` (incompleto) vs `- [x]` (concluído)
      - Se não existir arquivo de tasks, note como "Sem tarefas"

   c. **Delta specs** - Verifique `artifactPaths.specs.existingOutputPaths` do JSON de status
      - Liste quais capability specs existem
      - Para cada um, extraia os nomes dos requisitos (linhas correspondentes a `### Requirement: <nome>`)
      - Trate essa lista como a única fonte de delta specs. Se a entrada `specs`
        estiver ausente ou a lista estiver vazia, não faça sync de specs nem
        consulta de instruções de specs para aquela change; não infira deltas de
        artifacts não relacionados.
      - Avalie isso independentemente para cada change, incluindo lotes com
        schemas mistos em que alguns schemas não têm artifact `specs`.

4. **Detecte conflitos de specs**

   Construa um mapa de `capability -> [changes que a tocam]`:

   ```
   auth -> [change-a, change-b]  <- CONFLITO (2+ changes)
   api  -> [change-c]            <- OK (apenas 1 change)
   ```

   Um conflito existe quando 2+ changes selecionadas têm delta specs para a mesma capability.

5. **Resolva conflitos de forma agentica**

   **Para cada conflito**, investigue a codebase:

   a. **Leia os delta specs** de cada change conflitante para entender o que cada uma pretende adicionar/modificar

   b. **Pesquise a codebase** por evidências de implementação:
      - Procure por código implementando requisitos de cada delta spec
      - Verifique arquivos, funções ou testes relacionados

   c. **Determine a resolução**:
      - Se apenas uma change está realmente implementada -> sincronize os specs dessa
      - Se ambas estão implementadas -> aplique em ordem cronológica (mais antiga primeiro, mais recente sobrescreve)
      - Se nenhuma está implementada -> ignore o sync de specs, avise o usuário

   d. **Registre a resolução** para cada conflito:
      - Uma decisão de inclusão ou exclusão para cada delta spec, por change e capability
      - Quais delta specs incluídos aplicar e em qual ordem
      - Quais delta specs excluir do sync porque a implementação deles está ausente
      - Racional (o que foi encontrado na codebase)

6. **Mostre a tabela de status consolidada**

   Exiba uma tabela resumindo todas as changes:

   ```
   | Change              | Artifacts | Tarefas | Specs   | Conflitos | Status |
   |---------------------|-----------|---------|---------|-----------|--------|
   | schema-management   | Done      | 5/5     | 2 delta | Nenhum    | Pronto |
   | project-config      | Done      | 3/3     | 1 delta | Nenhum    | Pronto |
   | add-oauth           | Done      | 4/4     | 1 delta | auth (!)  | Pronto*|
   | add-verify-skill    | 1 restante| 2/5     | Nenhum  | Nenhum    | Aviso  |
   ```

   Para conflitos, mostre a resolução:
   ```
   * Resolução de conflito:
     - auth spec: Aplicará add-oauth depois add-jwt (ambas implementadas, ordem cronológica)
   ```

   Para changes incompletas, mostre avisos:
   ```
   Avisos:
   - add-verify-skill: 1 artifact incompleto, 3 tarefas incompletas
   ```

7. **Confirme a operação em lote**

   Faça uma única pergunta de confirmação ao usuário:

   - "Arquivar N changes?" com opções baseadas no status
   - As opções podem incluir:
     - "Arquivar todas as N changes"
     - "Arquivar apenas as N changes prontas (ignorar incompletas)"
     - "Cancelar"

   Se houver changes incompletas, deixe claro que elas serão arquivadas com avisos.

   Encaminhe conforme a intenção da resposta, não pelo rótulo exato — você escreveu esses rótulos,
   então corresponda ao que o usuário escolheu em vez do texto acima:
   - "Cancelar" — pare, não arquive. Reporte que nada foi arquivado e pule os passos restantes.
   - A opção de arquivar tudo — prossiga com todas as changes selecionadas
   - A opção de arquivar apenas as prontas — prossiga apenas com as changes que a tabela do passo 6 marca como `Pronto` ou `Pronto*`, e registre o restante como Ignorado no passo 8d. Se o parceiro de conflito de uma change `Pronto*` for ignorado, derive novamente a resolução daquele conflito usando apenas as changes que estão sendo arquivadas.
   - Qualquer outra resposta — pergunte novamente em vez de arquivar

   Antes que o passo 8 escreva o primeiro spec principal ou mova qualquer
   change, obtenha todos os snapshots de regras de specs necessários para o
   lote confirmado. Para cada change que for sincronizar
   `artifactPaths.specs.existingOutputPaths` concretos, execute
   `openspec instructions specs --change "<nome>" --json` exatamente uma vez.
   Obtenha todos os snapshots antes da primeira escrita ou movimentação. Se
   qualquer consulta sair com código não-zero ou retornar JSON de instrução de
   artifact inválido, identifique a change afetada, reporte o erro e pare todo
   o lote antes de qualquer escrita de spec principal ou movimentação de
   change. Não trate falha da consulta como regras omitidas. Uma resposta
   válida sem `rules` é o caso sem regras.

8. **Execute o arquivamento para cada change confirmada**

   Antes de processar, carregue as decisões registradas no passo 5 (após
   qualquer rederivação do passo 7) em dois conjuntos por delta:
   - `includedDeltas`: todos os delta specs sem conflito das changes
     confirmadas, mais os deltas de conflito selecionados para sync
   - `excludedDeltas`: deltas de conflito das changes confirmadas excluídos
     porque a implementação deles está ausente
   - Uma única change pode ter delta specs incluídos e excluídos. Mantenha a
     decisão por delta; não a colapse em uma flag de sync por change.

   Processe as changes na ordem determinada (respeitando a resolução de conflitos):

   a. **Sincronize os delta specs incluídos**:
      - Execute o workflow `/openspec-sync-specs` inline (merge inteligente dirigido
        por agente) apenas para changes com entradas em `includedDeltas`,
        passando somente os caminhos de delta incluídos e instruindo-o
        explicitamente a ignorar os `excludedDeltas` daquela change. Aguarde
        a conclusão.
      - Para conflitos, aplique na ordem resolvida.
      - Passe o snapshot de regras de specs obtido daquela change para o sync
        inline; o sync inline deve reutilizá-lo sem buscar instruções novamente
      - Aplique regras de artifact apenas aos specs principais produzidos por
        aquela change. Elas não mudam a resolução de conflitos, o comportamento
        de arquivamento ou os contratos do CLI, e seu texto não é copiado para
        nenhum arquivo de saída
      - Não o delegue a uma tarefa em background — o passo 8c moveria o
        diretório da change enquanto um sync ainda o lê.
      - Se uma change não tiver delta specs incluídos, não execute o workflow
        de sync para ela.

   b. **Verifique os delta specs incluídos antes de mover a change**:
      - Refaça a comparação apenas para os delta specs em `includedDeltas`
        contra o spec principal em `openspec/specs/<capability>/spec.md`.
      - Verifique que os specs principais foram atualizados:
        - Requisitos ADDED presentes
        - Requisitos MODIFIED carregando as alterações de cenário e descrição
          nomeadas no delta, com seus demais cenários intactos
        - Requisitos REMOVED ausentes
        - Requisitos RENAMED presentes sob o novo nome e ausentes sob o antigo
      - Não verifique os delta specs em `excludedDeltas`; eles ficam
        intencionalmente sem sync.
      - Se o sync falhar ou qualquer capability não corresponder à
        verificação, reporte a divergência e falhe/ignore a movimentação
        daquela change — não a arquive. O diretório da change permanece
        intacto.

   c. **Realize o arquivamento**:

      Nome de destino (`<target-name>`): o `openspec archive` usa o nome da change como está quando ele já começa com um prefixo `YYYY-MM-DD-`; caso contrário, prefixa a data atual como `YYYY-MM-DD-<nome>` (nunca empilha uma segunda data).

      ```bash
      openspec archive <nome>
      ```

      Se precisar manipular programaticamente, construa os caminhos com `path.join()`
      ou `path.resolve()` e use `fs.rename()` — evite comandos shell e separadores `/` hardcoded.

   d. **Rastreie o resultado** para cada change:
      - Sucesso: arquivado com sucesso
      - Falha: erro durante o arquivamento ou na verificação de specs (registre o erro)
      - Ignorado: usuário escolheu não arquivar (se aplicável)
      - Sync ignorado: para cada delta em `excludedDeltas`, reporte `sync skipped` com a change, a capability e a razão registrada. Isso é distinto de ignorar o arquivamento.

9. **Exiba o resumo**

   Mostre os resultados finais:

   ```
   ## Arquivamento em Lote Concluído

   3 changes arquivadas:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   1 change ignorada:
   - add-verify-skill (usuário escolheu não arquivar incompleta)

   Resumo de sync de specs:
   - 4 delta specs sincronizados com os specs principais
   - 1 delta spec com sync ignorado (add-jwt/auth: implementação não encontrada)
   - 1 conflito resolvido (auth: sincronizado add-oauth, ignorado add-jwt)
   ```

   Se houver falhas:
   ```
   1 change falhou:
   - some-change: O diretório de arquivo já existe
   ```

**Exemplos de Resolução de Conflitos**

Exemplo 1: Apenas uma implementada
```text
Conflito: openspec/specs/auth/spec.md tocado por [add-oauth, add-jwt]

Verificando add-oauth:
- Delta adiciona requisito "OAuth Provider Integration"
- Pesquisando codebase... encontrado src/auth/oauth.ts implementando fluxo OAuth

Verificando add-jwt:
- Delta adiciona requisito "JWT Token Handling"
- Pesquisando codebase... nenhuma implementação JWT encontrada

Resolução: Apenas add-oauth está implementada. Sincronizará apenas os specs de add-oauth.
```

Exemplo 2: Ambas implementadas
```text
Conflito: openspec/specs/api/spec.md tocado por [add-rest-api, add-graphql]

Verificando add-rest-api (criada 2026-01-10):
- Delta adiciona requisito "REST Endpoints"
- Pesquisando codebase... encontrado src/api/rest.ts

Verificando add-graphql (criada 2026-01-15):
- Delta adiciona requisito "GraphQL Schema"
- Pesquisando codebase... encontrado src/api/graphql.ts

Resolução: Ambas implementadas. Aplicará specs de add-rest-api primeiro,
depois specs de add-graphql (ordem cronológica, mais recente tem precedência).
```

**Saída em Sucesso**

```markdown
## Arquivamento em Lote Concluído

N changes arquivadas:
- <change-1> -> archive/<target-name-1>/
- <change-2> -> archive/<target-name-2>/

Resumo de sync de specs:
- N delta specs sincronizados com os specs principais
- Nenhum conflito (ou: M conflitos resolvidos)
```

**Saída em Sucesso Parcial**

```markdown
## Arquivamento em Lote Concluído (parcial)

N changes arquivadas:
- <change-1> -> archive/<target-name-1>/

M changes ignoradas:
- <change-2> (usuário escolheu não arquivar incompleta)

K changes falharam:
- <change-3>: O diretório de arquivo já existe
```

**Saída Quando Não Há Changes**

```markdown
## Nenhuma Change para Arquivar

Nenhuma change ativa encontrada. Crie uma nova change para começar.
```

**Guardrails**
- Permita qualquer número de changes (1+ está ok, 2+ é o caso típico)
- Sempre solicite seleção, nunca selecione automaticamente
- Detecte conflitos de specs cedo e resolva verificando a codebase
- Quando ambas as changes estiverem implementadas, aplique specs em ordem cronológica
- Ignore o sync de specs apenas quando a implementação estiver ausente (avise o usuário)
- Mostre o status claro por change antes de confirmar
- Use uma única confirmação para todo o lote
- Nunca arquive depois que o usuário cancela a confirmação — um lote cancelado não arquiva nada
- Rastreie e reporte todos os resultados (sucesso/ignorado/falha)
- Preservar .openspec.yaml ao mover para o arquivo
- O diretório de destino do arquivo usa a data atual: YYYY-MM-DD-<nome>; um nome que já começa com um prefixo `YYYY-MM-DD-` é usado como está (nunca empilhe uma segunda data)
- Se o destino do arquivo existir, falhe aquela change mas continue com as outras
- Se sync for solicitado, execute o workflow `/openspec-sync-specs` inline (agent-driven) para cada change com delta specs incluídos
- Carregue as decisões por delta de `includedDeltas` e `excludedDeltas` para a execução; sincronize e verifique apenas os deltas incluídos
- Reporte cada delta excluído como `sync skipped` sem tratar o arquivamento em si como ignorado
- Nunca arquive uma change enquanto um sync de specs ainda estiver em andamento — execute o sync inline e verifique os specs principais em `openspec/specs/<capability>/spec.md` antes de mover o diretório da change
- Obtenha as entradas de arquivamento uma vez antes da inspeção de specs ou movimentações
- Obtenha todos os snapshots de regras de specs necessários antes da primeira escrita de spec principal ou movimentação do lote
- Uma consulta de entradas de arquivamento malsucedida nunca bloqueia o lote; ele prossegue sem contexto nem orientação
- Uma consulta de instruções de specs malsucedida interrompe todo o lote atomicamente
- Changes sem `artifactPaths.specs.existingOutputPaths` concretos continuam sem sync de specs
- Aplique o contexto de runtime relevante em todo o lote e reporte conflitos
- A orientação da operação permanece consultiva; considere cada entrada e explique conselhos rejeitados
- Mantenha entradas de runtime, análise de conflitos, valores derivados do CLI e regras de artifact separados
- Regras de artifact restringem apenas os specs escritos
- Nunca copie texto de entradas de runtime ou de regras de artifact verbatim para arquivos de saída

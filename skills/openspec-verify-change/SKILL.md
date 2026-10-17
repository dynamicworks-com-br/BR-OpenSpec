---
name: openspec-verify-change
description: Verifica se a implementação corresponde aos artifacts da change do BR-OpenSpec. Use quando o usuário quiser validar que a implementação está completa, correta e coerente antes de arquivar. Use também quando o usuário disser "openspec verify" ou "opsx verify".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Verifica se uma implementação corresponde aos artifacts da change (specs, tasks, design).

**Verificação do projeto:** Estes passos esperam um projeto que já usa o BR-OpenSpec. Antes do primeiro passo que escreve qualquer coisa (`new change`, `archive`, `sync specs` ou a autoria de um arquivo de artifact), confirme que o projeto tem uma raiz: execute `openspec list --json` e leia `root`. Um objeto root significa que o projeto está configurado. `"root": null` significa que não está — não há diretório `openspec/` aqui, e uma escrita como `openspec new change` criaria um como efeito colateral. O comando também sai com código diferente de zero, e isso é essa resposta, não um CLI quebrado: leia o JSON em vez de tentar de novo ou contornar.

Sem raiz, o que acontece em seguida depende de como este workflow foi alcançado:

- **Selecionado automaticamente**: você escolheu este workflow sozinho, sem o usuário nomear o BR-OpenSpec, nomear esta skill ou executar o slash command dela. Pare de usar o BR-OpenSpec e responda à solicitação normalmente, como faria sem o BR-OpenSpec instalado. Não peça para configurar nada e não mencione a configuração do BR-OpenSpec.
- **Solicitação explícita do BR-OpenSpec**: o usuário nomeou o BR-OpenSpec, nomeou esta skill ou executou o slash command dela. Pare antes de escrever e pergunte como prosseguir: configurar este projeto (`openspec init`) ou continuar sem o BR-OpenSpec nesta solicitação. Aguarde a resposta.

Nos dois ramos, nunca crie a raiz como efeito colateral: não execute `openspec init` até o usuário pedir, não crie arquivos `openspec/` à mão e não deixe um comando criá-la.

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute `openspec list --json` para obter as changes disponíveis e peça ao usuário que selecione uma

   Ao solicitar, mostre todas as changes ativas retornadas pela lista, incluindo changes com `status: "no-tasks"`.
   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, `/openspec-verify-change <outra>`).

2. **Verifique o status para entender o schema**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Analise o JSON para entender:
   - `schemaName`: O workflow sendo usado (por exemplo, "spec-driven")
   - `changeRoot`, `artifactPaths` e `actionContext`: contexto de caminho e escopo
   - Quais artifacts existem para esta change

3. **Obtenha o diretório da change e carregue os artifacts**

   ```bash
   openspec instructions apply --change "<nome>" --json
   ```

   Isso retorna o diretório da change, `contextFiles` (ID do artifact -> array de caminhos de arquivos concretos), `taskTrackingConfigured` e os campos de topo `tasks` e `progress` agregados de cada arquivo concreto legível casado pela configuração `apply.tracks` do schema. Leia todos os artifacts disponíveis de `contextFiles`.

   Trate `state` e `instruction` do apply como contexto, não como veredito de verificação. Não implemente tarefas nem arquive a change durante a verificação.

4. **Inicialize a estrutura do relatório de verificação**

   Crie uma estrutura de relatório com três dimensões:
   - **Completeness**: Acompanhe tasks e cobertura de specs
   - **Correctness**: Acompanhe implementação de requisitos e cobertura de cenários
   - **Coherence**: Acompanhe aderência ao design e consistência de padrões

   Cada dimensão pode ter issues CRITICAL, WARNING ou SUGGESTION.

   A verificação é consultiva. Respeite omissões intencionais como `skip_specs: true`, documentos de design opcionais e schemas sem rastreamento de tarefas. Não exija nem invente artifacts opcionais ou omitidos de propósito para obter um relatório limpo. `Not verified` descreve um limite deste relatório, não um novo pré-requisito de arquivamento. O archive mantém as próprias verificações e o comportamento de confirmação do usuário.

   Marque como **Not applicable** as verificações que o schema não define, ou artifacts que o status reporta como ignorados de propósito. As verificações de correctness de uma change cujos delta specs legíveis contêm requisitos REMOVED ou RENAMED, mas nenhum ADDED ou MODIFIED, também são **Not applicable** (veja o passo 6). Exclua-as das contagens de verificações puladas e da avaliação de prontidão para arquivar. Reserve **Not verified** para verificações aplicáveis cuja evidência está ausente ou inutilizável.

   Se apenas evidência de tarefas estiver disponível para as verificações aplicáveis, verifique somente a conclusão das tarefas e marque as demais verificações aplicáveis, incluindo **Code Pattern Consistency**, como not verified com a razão "Only task evidence available".

   Se os artifacts não puderem ser lidos ou não contiverem requisitos, cenários ou decisões de design utilizáveis, marque as verificações afetadas como not verified com a razão específica. Continue as verificações sustentadas pela evidência restante, mas um conjunto de entrada parcialmente verificado não é uma verificação totalmente verificada. Requisitos ausentes afetam Spec Coverage e Requirement Implementation Mapping; cenários ausentes afetam Scenario Coverage; decisões de design ausentes afetam Design Adherence.

5. **Verifique Completeness**

   **Conclusão de Tasks**:
   - Se `taskTrackingConfigured` for false, reporte **Task Completion** como not applicable. Não trate `tasks` vazio como evidência ausente.
   - Caso contrário, use os campos de topo `tasks` e `progress`. Eles já agregam cada arquivo concreto legível casado por `apply.tracks`, independentemente do ID do artifact rastreado; não infira o rastreamento a partir de uma chave de `contextFiles`.
   - Se `unavailableTrackingFiles` não estiver vazio, marque **Task Completion** como not verified e inclua cada caminho indisponível e a razão. Continue usando qualquer evidência de tarefa legível, mas não infira conclusão a partir dos campos parciais `tasks` e `progress`.
   - Se `taskTrackingConfigured` for true e `tasks` estiver vazio, marque **Task Completion** como not verified e registre a razão a partir de `state` e `instruction` do apply. Totais diferentes de zero, sozinhos, não estabelecem descrições de tarefa avaliáveis.
   - Reporte tarefas concluídas vs total a partir de `progress`.
   - Se `progress.remaining` for maior que 0:
     - Adicione issue CRITICAL para cada tarefa incompleta listada. Se a contagem restante exceder as tarefas incompletas listadas, reporte também os checkboxes incompletos sem descrição e recomende adicionar descrições e concluí-los. Não infira conclusão apenas a partir das tarefas listadas.
     - Recomendação: "Complete task: <descrição>" ou "Mark as done if already implemented"

   **Cobertura de Specs**:
   - Se o status marcar o artifact de spec como ignorado por `skip_specs: true`, ou o schema não definir artifact de spec (nenhum artifact cujo `artifactPaths.<id>.outputPath` esteja sob `specs/`), reporte as verificações que dependem de spec como not applicable.
   - Caso contrário, `contextFiles` é chaveado por id de artifact, e os ids vêm do schema ativo, então não assuma um id como `specs`. Os artifacts de spec são aqueles cujo `artifactPaths.<id>.outputPath` está sob `specs/`; leia os arquivos deles em `contextFiles.<id>`. Se esses arquivos de spec estiverem ausentes ou vazios, marque **Spec Coverage**, **Requirement Implementation Mapping** e **Scenario Coverage** como not verified; não trate nenhum deles como limpo.
   - Se existirem delta specs nesses arquivos de spec:
     - Extraia todos os requisitos (marcados com "### Requirement:", ou listados como pares `FROM:`/`TO:` sob `## RENAMED Requirements`) e note a seção de delta em que cada um está: `## ADDED`, `## MODIFIED`, `## REMOVED` ou `## RENAMED Requirements`. A seção decide o que a verificação procura.
     - Para cada requisito ADDED ou MODIFIED (para MODIFIED, verifique o texto no delta, não a redação antiga):
       - Procure no codebase por palavras-chave relacionadas ao requisito
       - Avalie se a implementação provavelmente existe
     - Se requisitos ADDED ou MODIFIED parecerem não implementados:
       - Adicione issue CRITICAL: "Requirement not found: <nome do requisito>"
       - Recomendação: "Implement requirement X: <descrição>"
     - Para cada requisito REMOVED, a change pede que o comportamento desapareça, então inverta a verificação:
       - Um bloco REMOVED carrega apenas o nome do requisito e quaisquer notas `**Reason**`/`**Migration**`, então o delta não descreve o comportamento em si. Antes de buscar, leia o requisito de baseline no spec principal em `openspec/specs/<capability-path>/spec.md`, usando o mesmo caminho de capability do delta spec. Case pelo nome normalizado, varrendo os headings de requisito daquele arquivo em vez de comparar a string exata do título do delta. O corpo e os cenários dele são a evidência do comportamento que deve ter sumido; nunca busque apenas a partir do nome do requisito.
       - Se aquele arquivo não tiver tal requisito sob este nome ou um nome quase equivalente — por exemplo porque um sync anterior já aplicou a remoção — recupere o baseline do histórico do mesmo arquivo: `git log -p -- openspec/specs/<capability-path>/spec.md`, ou `git show <commit>^:./openspec/specs/<capability-path>/spec.md` depois de identificar o commit que aplicou a remoção. Saída vazia significa que o pathspec não casou nada, não que não há baseline: `git log` reporta um caminho sem match como sucesso, então confira o caminho antes de tirar qualquer conclusão do silêncio.
       - Um baseline que não acrescenta nada ao próprio título — sem corpo além de uma reafirmação do nome, sem cenários — é evidência inutilizável, o mesmo que um baseline ausente. Se não houver baseline utilizável em nenhum dos dois lugares, marque **Spec Coverage** como not verified para essa entrada com a razão e pare aí: não busque, e nunca conte uma remoção não buscada como aprovada.
       - Procure no codebase por aquele comportamento. Matches em artifacts ou docs de `openspec/`, ou em código que serve apenas à nota de Migration ou a um requisito ADDED, não são evidência por si só. Reporte qualquer caminho de código que ainda entregue o comportamento removido, inclusive um compartilhado com um requisito ADDED.
       - Não encontrar implementação é o resultado esperado, mas só depois que o comportamento do baseline foi o que você buscou. Nunca reporte um requisito REMOVED como "Requirement not found" nem recomende implementá-lo.
       - Se o comportamento ainda estiver presente:
         - Adicione issue CRITICAL: "Removed requirement still implemented: <nome do requisito>"
         - Recomendação: "Remove the remaining implementation at <arquivo>:<linhas>, following the requirement's Migration note if it has one"
     - Para cada entrada RENAMED (`FROM:`/`TO:`), o nome muda mas o comportamento permanece, então verifique o requisito TO por esse comportamento inalterado:
       - Não reporte o nome FROM como ausente, e não exija que símbolos de código, identificadores ou nomes de arquivo sejam renomeados.
       - Se o nome TO também aparecer sob MODIFIED, o comportamento dele é verificado lá contra o texto MODIFIED; pule-o aqui.
       - Caso contrário, leia o requisito de baseline no spec principal em `openspec/specs/<capability-path>/spec.md`, usando o mesmo caminho de capability do delta spec: o requisito sob o nome FROM, ou sob o nome TO somente quando o nome FROM estiver ausente porque o spec principal já está sincronizado. O corpo e os cenários dele são a evidência do comportamento que o requisito TO mantém.
       - Procure no codebase por aquele comportamento e avalie se ele ainda está implementado.
       - Se parecer não implementado:
         - Adicione issue CRITICAL: "Renamed requirement not found: <nome TO>"
         - Recomendação: "Restore the behavior of <nome TO> (renamed from <nome FROM>); a rename must not change behavior"
       - Se o requisito de baseline não puder ser encontrado ou lido, marque **Spec Coverage** como not verified para essa entrada com a razão. Nunca conte um rename não verificado como aprovado.

6. **Verifique Correctness**

   Se os delta specs forem legíveis e contiverem pelo menos um requisito REMOVED ou RENAMED, mas nenhum ADDED ou MODIFIED (a change só remove ou renomeia requisitos), reporte **Requirement Implementation Mapping** e **Scenario Coverage** como **Not applicable**. As verificações REMOVED e RENAMED em Spec Coverage são a evidência para uma change assim (cada entrada REMOVED e RENAMED com baseline utilizável é verificada lá contra o comportamento do baseline, e uma entrada já marcada not verified lá permanece not verified), então não marque essas duas verificações como not verified. Um delta spec sem nenhum requisito analisável é evidência inutilizável, não uma change só de remoção: marque essas verificações como not verified.

   **Mapeamento de Implementação de Requisitos**:
   - Para cada requisito ADDED ou MODIFIED dos delta specs (entradas REMOVED, e entradas RENAMED sem um bloco MODIFIED, foram resolvidas em Spec Coverage):
     - Procure no codebase por evidências de implementação
     - Se encontrado, anote os caminhos de arquivo e intervalos de linha
     - Avalie se a implementação corresponde à intenção do requisito
     - Se divergência for detectada:
       - Adicione WARNING: "Implementation may diverge from spec: <detalhes>"
       - Recomendação: "Review <arquivo>:<linhas> against requirement X"

   **Cobertura de Cenários**:
   - Para cada cenário sob um requisito ADDED ou MODIFIED nos delta specs (marcado com "#### Scenario:"):
     - Verifique se as condições são tratadas no código
     - Verifique se existem testes cobrindo o cenário
     - Se o cenário parecer não coberto:
       - Adicione WARNING: "Scenario not covered: <nome do cenário>"
       - Recomendação: "Add test or implementation for scenario: <descrição>"
   - Pule cenários sob um requisito REMOVED; aquele comportamento deve ter sumido.

7. **Verifique Coherence**

   **Aderência ao Design**:
   - Se o schema não definir artifact de design (nenhum artifact com id `design`, e nenhum cujo `artifactPaths.<id>.outputPath` seja ou termine em `design.md`), reporte **Design Adherence** como not applicable.
   - Se o arquivo `contextFiles.<id>` do artifact de design existir:
     - Extraia decisões-chave (procure por seções como "Decision:", "Approach:", "Architecture:")
     - Verifique se a implementação segue essas decisões
     - Se contradição for detectada:
       - Adicione WARNING: "Design decision not followed: <decisão>"
       - Recomendação: "Update implementation or revise design.md to match reality"
   - Caso contrário, se o arquivo `contextFiles.<id>` do artifact de design estiver ausente ou vazio: marque **Design Adherence** como not verified. Com outros artifacts de apoio, **Code Pattern Consistency** ainda roda; o caso só de tarefas continua limitado à conclusão das tarefas.

   **Consistência de Padrões de Código**:
   - Se as mudanças de implementação não puderem ser identificadas, marque **Code Pattern Consistency** como not verified e explique a evidência ausente.
   - Caso contrário, revise o novo código quanto à consistência com os padrões do projeto
   - Verifique nomenclatura de arquivos, estrutura de diretórios, estilo de código
   - Se houver desvios significativos:
     - Adicione SUGGESTION: "Code pattern deviation: <detalhes>"
     - Recomendação: "Consider following project pattern: <exemplo>"

8. **Gere o Relatório de Verificação**

   **Scorecard de Resumo**:
   ```markdown
   ## Verification Report: <nome-change>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   ```

   Em cada célula de Status, reporte os resultados das verificações que rodaram e `Not verified (<razão>)` para cada verificação pulada. Se todas as verificações de uma dimensão foram puladas, comece a célula com `Not verified`. Nunca pontue uma verificação pulada como aprovada. Trate toda verificação not verified ou parcialmente verificada como pulada na avaliação final. Conte apenas requisitos ADDED e MODIFIED em N, e reporte requisitos REMOVED e RENAMED separadamente (por exemplo, "1 removal confirmed, 1 rename verified", ou "1 removal not verified (baseline unavailable)"). Para uma change que só remove ou renomeia requisitos, a célula de Correctness fica `Not applicable (no ADDED or MODIFIED requirements)`.

   **Issues por Prioridade**:

   1. **CRITICAL** (Deve corrigir antes de arquivar):
      - Tasks incompletas
      - Implementações de requisitos ausentes
      - Requisitos removidos ainda implementados
      - Requisitos renomeados cujo comportamento não está mais implementado
      - Cada uma com recomendação específica e acionável

   2. **WARNING** (Deveria corrigir):
      - Divergências de spec/design
      - Cobertura de cenário ausente
      - Cada uma com recomendação específica

   3. **SUGGESTION** (Bom corrigir):
      - Inconsistências de padrão
      - Melhorias menores
      - Cada uma com recomendação específica

   **Avaliação Final**:
   - Se houver issues CRITICAL: "X critical issue(s) found. Fix before archiving." Se alguma verificação foi pulada, nomeie também cada verificação pulada e a razão.
   - Se não houver issues CRITICAL, houver um ou mais warnings e nenhuma verificação foi pulada: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - Se houver apenas suggestions e nenhuma verificação foi pulada: "No critical issues or warnings. Z suggestion(s) to consider. Ready for archive (with noted improvements)."
   - Se não houver issues e nenhuma verificação foi pulada: "All checks passed. Ready for archive."
   - Se alguma verificação foi pulada e não houver issues CRITICAL: não afirme prontidão. Diga "No critical issues found in the checks that ran. <check(s)> not verified: <reason>." Inclua a contagem de warnings quando for diferente de zero.
   - Inclua a contagem de suggestions quando for diferente de zero em toda avaliação final.

**Heurísticas de Verificação**

- **Completeness**: Foque em itens de checklist objetivos (checkboxes, lista de requisitos)
- **Correctness**: Use busca por palavras-chave, análise de caminhos de arquivo, inferência razoável — não exija certeza perfeita
- **Coherence**: Procure inconsistências gritantes, não seja meticuloso com estilo
- **False Positives**: Quando incerto, prefira SUGGESTION ao invés de WARNING, WARNING ao invés de CRITICAL
- **Actionability**: Cada issue deve ter uma recomendação específica com referências de arquivo/linha quando aplicável

**Formato de Saída**

Use markdown claro com:
- Tabela para scorecard de resumo
- Listas agrupadas para issues (CRITICAL/WARNING/SUGGESTION)
- Referências de código no formato: `arquivo.ts:123`
- Recomendações específicas e acionáveis
- Sem sugestões vagas como "consider reviewing"

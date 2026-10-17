---
name: openspec-continue-change
description: Continue trabalhando em uma change do BR-OpenSpec criando o próximo artifact. Use quando o usuário quiser progredir sua change, criar o próximo artifact ou continuar seu workflow. Use também quando o usuário disser "openspec continue" ou "opsx continue".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Continue trabalhando em uma change criando o próximo artifact.

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
   - Se ambíguo, execute `openspec list --json` para obter as changes disponíveis ordenadas pela mais recentemente modificada e peça ao usuário que selecione uma

   Ao solicitar, apresente as 3-4 changes mais recentemente modificadas como opções, mostrando:
   - Nome da change
   - Status (por exemplo, "0/5 tasks", "completo", "sem tarefas")
   - Quão recentemente foi modificada (do campo `lastModified`)

   Marque a change mais recentemente modificada como "(Recomendada)" já que é provavelmente o que o usuário quer continuar.

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, `/openspec-continue-change <outra>`).

2. **Verifique o status atual**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Analise o JSON para entender o estado atual. A resposta inclui:
   - `schemaName`: O schema de workflow sendo usado (por exemplo, "spec-driven")
   - `artifacts`: Array de artifacts com seu status ("done", "skipped", "ready", "blocked")
   - `isPlanningComplete`: Booleano indicando se todos os artifacts de planejamento estão completos. Versões mais antigas do CLI expõem o mesmo valor como `isComplete`.
   - `changeRoot`, `artifactPaths` e `actionContext`: contexto de caminho e escopo. Use-os em vez de assumir caminhos locais do repositório.

3. **Aja com base no status**:

   ---

   **Antes de qualquer outra coisa, termine um artifact escrito pela metade**:
   - Um artifact cuja saída é um padrão glob (por exemplo, `specs/**/*.md`) fica `done` assim que um arquivo correspondente existe, então uma execução interrompida enquanto escrevia os arquivos o deixa `done` com alguns ainda faltando
   - Para cada artifact `done` assim, primeiro obtenha as instruções dele e leia quaisquer dependências concluídas necessárias para determinar os arquivos esperados. Depois compare esses arquivos com `artifactPaths.<id>.existingOutputPaths`. Para o `specs` do spec-driven, leia a proposta e verifique se há um `specs/<capability-path>/spec.md` por capability que ela lista; resolva cada caminho esperado contra `changeRoot` antes de comparar a identidade do caminho, e verifique que cada um permanece dentro de `changeRoot` depois de resolver symlinks, tanto nos diretórios pai quanto no próprio arquivo se ele já existir
   - Nunca escreva um caminho esperado que falhe nessa checagem; pare e avise o usuário. Se algum estiver faltando, escreva apenas os arquivos faltantes, cada um no caminho checado - quando o campo `instruction` delegar a criação a uma skill ou comando, invoque-o somente se ele puder escrever cada arquivo no caminho checado; caso contrário, pare e avise o usuário - e PARE - isso conta como o UM artifact desta invocação. Se você não conseguir dizer se um arquivo foi deixado de fora de propósito, pergunte ao usuário

   ---

   **Se todos os artifacts de planejamento estão completos (`isPlanningComplete: true`, ou o legado `isComplete: true`)**:
   - Parabenize o usuário
   - Mostre o status final incluindo o schema usado
   - Sugira: "Planejamento concluído! Agora você pode implementar esta change. Quando a implementação e qualquer trabalho rastreado estiverem concluídos, arquive-a."
   - PARE

   ---

   **Se os artifacts estão prontos para criar** (status mostra artifacts com `status: "ready"`):
   - Escolha o PRIMEIRO artifact com `status: "ready"` da saída do status
   - Obtenha suas instruções:
     ```bash
     openspec instructions <artifact-id> --change "<nome>" --json
     ```
   - Analise o JSON. Os campos-chave são:
     - `context`: Contexto do projeto (restrições para você - NÃO inclua na saída)
     - `rules`: Regras específicas do artifact (restrições para você - NÃO inclua na saída)
     - `template`: A estrutura a ser usada para seu arquivo de saída
     - `instruction`: Orientação específica do schema
     - `resolvedOutputPath`: Caminho ou padrão resolvido onde escrever o artifact
     - `dependencies`: Artifacts concluídos para ler como contexto (entradas com `skipped: true` não têm arquivos - não os procure)
     - `skipped`/`warning`: presentes quando a change declara skip_specs e este artifact NÃO deve ser criado - escolha outro artifact
   - **Crie o arquivo do artifact**:
     - Leia quaisquer arquivos de dependências concluídos para contexto - sempre releia-os do disco, mesmo que já os tenha visto antes na conversa (o usuário pode tê-los editado)
     - Escolha o caminho de saída antes de criar qualquer coisa. Se o `resolvedOutputPath` especificado nas instruções for um padrão glob, escolha um caminho concreto dentro de `changeRoot` usando a instrução do schema e o contexto da change, e verifique que ele permanece dentro de `changeRoot` depois de resolver symlinks, tanto nos diretórios pai quanto no próprio arquivo se ele já existir; se não permanecer, pare e avise o usuário. Caso contrário, o caminho de saída é `resolvedOutputPath`
     - Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o somente se ele puder escrever o artifact nesse caminho de saída; caso contrário, pare e avise o usuário
     - Caso contrário, escreva você mesmo:
       - Use `template` como a estrutura - preencha suas seções
       - Aplique `context` e `rules` como restrições ao escrever - mas NÃO copie-os para o arquivo
       - Escreva o arquivo nesse caminho de saída
     - De qualquer forma, verifique se o arquivo do artifact existe nesse caminho de saída
   - Mostre o que foi criado e o que agora está desbloqueado
   - PARE após criar UM artifact

   ---

   **Se nenhum artifact estiver pronto (todos bloqueados)**:
   - Isso não deveria acontecer com um schema válido
   - Mostre o status e sugira verificar problemas

4. **Após criar um artifact, mostre o progresso**
   ```bash
   openspec status --change "<nome>"
   ```

**Saída**

Após cada invocação, mostre:
- Qual artifact foi criado
- Schema de workflow sendo usado
- Progresso atual (N/M completos)
- Quais artifacts agora estão desbloqueados
- Prompt: "Quer continuar? Basta me pedir para continuar ou me dizer o que fazer em seguida."

**Diretrizes de Criação de Artifacts**

Os tipos de artifact e sua finalidade dependem do schema. O campo `instruction` da saída das instruções é a orientação autoritativa para cada artifact - siga-o mesmo quando o artifact tiver um nome familiar (proposal.md, tasks.md, etc.), pois schemas personalizados podem definir um conteúdo ou processo diferente para os mesmos nomes de arquivo.

Se o campo `instruction` direcionar você a usar uma skill ou comando específico para criar o artifact, invoque-o em vez de escrever o artifact diretamente - mas somente depois de ter escolhido e checado o caminho de saída, e somente se ele puder escrever ali.

**Guardrails**
- Crie UM artifact por invocação
- Sempre leia artifacts de dependência antes de criar um novo - releia do disco, não da memória da conversa (os arquivos podem ter mudado desde a última vez que você os viu)
- Nunca pule artifacts ou crie fora de ordem
- Se o contexto estiver incerto, pergunte ao usuário antes de criar
- Verifique se o arquivo do artifact existe após escrever antes de marcar progresso
- Use a sequência de artifacts do schema, não assuma nomes específicos de artifacts
- **IMPORTANTE**: `context` e `rules` são restrições para VOCÊ, não conteúdo para o arquivo
  - NÃO copie blocos `<context>`, `<rules>`, `<project_context>` para o artifact
  - Eles guiam o que você escreve, mas nunca devem aparecer na saída

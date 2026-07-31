---
name: openspec-continue-change
description: Continue trabalhando em uma change do BR-OpenSpec criando o próximo artifact. Use quando o usuário quiser progredir sua change, criar o próximo artifact ou continuar seu workflow.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Continue trabalhando em uma change criando o próximo artifact.

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute `openspec list --json` para obter as changes disponíveis ordenadas pela mais recentemente modificada e peça ao usuário que selecione uma

   Ao solicitar, apresente as 3-4 changes mais recentemente modificadas como opções, mostrando:
   - Nome da change
   - Schema (do campo `schema` se presente, caso contrário "spec-driven")
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
   - `isComplete`: Booleano indicando se todos os artifacts estão completos

3. **Aja com base no status**:

   ---

   **Se todos os artifacts estão completos (`isComplete: true`)**:
   - Parabenize o usuário
   - Mostre o status final incluindo o schema usado
   - Sugira: "Todos os artifacts criados! Agora você pode implementar esta change ou arquivá-la."
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
     - `outputPath`: Onde escrever o artifact
     - `dependencies`: Artifacts concluídos para ler como contexto (entradas com `skipped: true` não têm arquivos - não os procure)
     - `skipped`/`warning`: presentes quando a change declara skip_specs e este artifact NÃO deve ser criado - escolha outro artifact
   - **Crie o arquivo do artifact**:
     - Leia quaisquer arquivos de dependências concluídos para contexto - sempre releia-os do disco, mesmo que já os tenha visto antes na conversa (o usuário pode tê-los editado)
     - Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o para produzir o artifact em vez de escrever o arquivo você mesmo, depois verifique se o arquivo do artifact existe em `outputPath`
     - Caso contrário, use `template` como a estrutura - preencha suas seções
     - Aplique `context` e `rules` como restrições ao escrever - mas NÃO copie-os para o arquivo
     - Escreva no caminho de saída especificado nas instruções
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

Se o campo `instruction` direcionar você a usar uma skill ou comando específico para criar o artifact, invoque-o em vez de escrever o artifact diretamente.

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

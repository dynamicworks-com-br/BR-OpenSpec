---
name: openspec-ff-change
description: Avance rapidamente pela criação de artifacts do BR-OpenSpec. Use quando o usuário quiser criar rapidamente todos os artifacts necessários para implementação sem passar por cada um individualmente.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Avance rapidamente pela criação de artifacts - gere tudo o que é necessário para iniciar a implementação de uma vez só.

**Entrada**: A solicitação do usuário deve incluir um nome de change (kebab-case) OU uma descrição do que ele quer construir.

**Passos**

1. **Se nenhuma entrada clara for fornecida, pergunte o que ele quer construir**

   Pergunte ao usuário (de forma aberta, sem opções pré-definidas):
   > "Em qual change você quer trabalhar? Descreva o que quer construir ou corrigir."

   A partir da descrição dele, derive um nome kebab-case (por exemplo, "adicionar autenticação de usuário" → `add-user-auth`).

   **IMPORTANTE**: NÃO prossiga sem entender o que o usuário quer construir.

2. **Crie o diretório da change**
   ```bash
   openspec new change "<nome>"
   ```
   Isso cria uma change com scaffold em `openspec/changes/<nome>/`.

3. **Obtenha a ordem de construção dos artifacts**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Analise o JSON para obter:
   - `applyRequires`: array de IDs de artifacts necessários antes da implementação (por exemplo, `["tasks"]`)
   - `artifacts`: lista de todos os artifacts, cada um com seu `status` e suas arestas `requires` (os IDs de artifact dos quais ele depende diretamente)

4. **Crie todos os artifacts do conjunto necessário**

   Use uma lista de tarefas para rastrear o progresso pelos artifacts.

   Percorra os artifacts em ordem de dependência (artifacts sem dependências pendentes primeiro):

   a. **Para cada artifact que está `ready` (dependências satisfeitas)**:
      - Obtenha instruções:
        ```bash
        openspec instructions <artifact-id> --change "<nome>" --json
        ```
      - O JSON de instruções inclui:
        - `context`: Contexto do projeto (restrições para você - NÃO inclua na saída)
        - `rules`: Regras específicas do artifact (restrições para você - NÃO inclua na saída)
        - `template`: A estrutura a ser usada para seu arquivo de saída
        - `instruction`: Orientação específica do schema para este tipo de artifact
        - `skipped`/`warning`: presentes quando a change declara skip_specs e este artifact NÃO deve ser criado - pare e escolha outro artifact
        - `outputPath`: Onde escrever o artifact
        - `dependencies`: Artifacts concluídos para ler como contexto
      - Leia quaisquer arquivos de dependências concluídos para contexto - sempre releia-os do disco, mesmo que já os tenha visto antes na conversa (o usuário pode tê-los editado)
      - Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o para produzir o artifact em vez de escrever o arquivo você mesmo, depois verifique se o arquivo do artifact existe em `outputPath`
      - Caso contrário, crie o arquivo do artifact usando `template` como a estrutura e escreva-o em `outputPath`; se for um glob, siga o `instruction` para escolher o caminho concreto do arquivo
      - Aplique `context` e `rules` como restrições - mas NÃO copie-os para o arquivo
      - Mostre breve progresso: "✓ Criado <artifact-id>"

   b. **Continue até que todos os artifacts do conjunto necessário existam (não apenas o `apply.requires`)**
      - Após criar cada artifact, reexecute `openspec status --change "<nome>" --json`
      - O conjunto necessário é o `applyRequires` mais todo artifact alcançável a partir deles seguindo as arestas `requires` do `status --json` - percorra-as transitivamente (o spec-driven fecha sobre proposal, specs, design, tasks). Deixe artifacts fora desse conjunto em paz
      - Um artifact com `status: "skipped"` já está satisfeito: a change declara `skip_specs` em `.openspec.yaml`, então seus arquivos NÃO devem existir. Nunca tente criá-lo
      - O `status` é apenas existência de arquivo, então um artifact de `applyRequires` marcado como `done` NÃO significa que suas dependências existam - escrever `tasks.md` cedo marca `tasks` como done sem que `specs` jamais tenha sido escrito. Use as arestas `requires` de cada artifact, não o `status`, para montar o conjunto necessário: um artifact `done` ainda lista do que depende
      - Crie todo artifact do conjunto necessário que estiver faltando, depois verifique novamente - criar um pode desbloquear outros
      - Pule um apenas quando o próprio `instruction` dele disser que é condicional: execute `openspec instructions <artifact-id> --change "<nome>" --json` e pule somente se o campo `instruction` o marcar como opcional (por exemplo, "crie apenas se..."). O `design.md` do spec-driven se qualifica; `specs` nunca. Avise o usuário e não reconsidere
      - Dependências são facilitadoras, não portões: se um artifact necessário ainda estiver `blocked` apenas porque você pulou uma dependência condicional, escreva-o assim mesmo
      - Pare quando todos os artifacts do conjunto necessário estiverem `done` ou `skipped`, ou tiverem sido deliberadamente pulados

   c. **Se um artifact requerer entrada do usuário** (contexto incerto):
      - Peça esclarecimento ao usuário
      - Depois continue com a criação

5. **Mostre o status final**
   ```bash
   openspec status --change "<nome>"
   ```

**Saída**

Após completar todos os artifacts, resuma:
- Nome da change e localização
- Lista de artifacts criados com breves descrições, mais qualquer artifact condicional que você pulou e por quê
- O que está pronto: "Todos os artifacts necessários para a implementação estão prontos."
- Prompt: "Execute `/openspec-apply-change` ou peça-me para implementar para começar a trabalhar nas tarefas."

**Diretrizes de Criação de Artifacts**

- Siga o campo `instruction` de `openspec instructions` para cada tipo de artifact - ele é a orientação autoritativa, mesmo para nomes de artifact familiares
- Se o campo `instruction` direcionar você a usar uma skill ou comando específico para criar o artifact, invoque-o em vez de escrever o artifact diretamente
- O schema define o que cada artifact deve conter - siga-o
- Leia artifacts de dependência para contexto antes de criar novos
- Use `template` como a estrutura para seu arquivo de saída - preencha suas seções
- **IMPORTANTE**: `context` e `rules` são restrições para VOCÊ, não conteúdo para o arquivo
  - NÃO copie blocos `<context>`, `<rules>`, `<project_context>` para o artifact
  - Eles guiam o que você escreve, mas nunca devem aparecer na saída

**Guardrails**
- Crie todo artifact do qual a fase de apply depende transitivamente, não apenas os ids listados em `apply.requires`
- Sempre leia artifacts de dependência antes de criar um novo - releia do disco, não da memória da conversa (os arquivos podem ter mudado desde a última vez que você os viu)
- Se o contexto estiver criticamente incerto, pergunte ao usuário - mas prefira tomar decisões razoáveis para manter o momento
- Se uma change com aquele nome já existir, pergunte se o usuário quer continuar ela ou criar uma nova
- Verifique se cada arquivo do artifact existe após escrever antes de prosseguir para o próximo

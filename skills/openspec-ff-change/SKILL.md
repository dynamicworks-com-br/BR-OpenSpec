---
name: openspec-ff-change
description: Avance rapidamente pela criação de artifacts do BR-OpenSpec. Use quando o usuário quiser criar rapidamente todos os artifacts necessários para implementação sem passar por cada um individualmente. Use também quando o usuário disser "openspec ff" ou "opsx ff".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Avance rapidamente pela criação de artifacts - gere tudo o que é necessário para iniciar a implementação de uma vez só.

**Verificação do projeto:** Estes passos esperam um projeto que já usa o BR-OpenSpec. Antes do primeiro passo que escreve qualquer coisa (`new change`, `archive`, `sync specs` ou a autoria de um arquivo de artifact), confirme que o projeto tem uma raiz: execute `openspec list --json` e leia `root`. Um objeto root significa que o projeto está configurado. `"root": null` significa que não está — não há diretório `openspec/` aqui, e uma escrita como `openspec new change` criaria um como efeito colateral. O comando também sai com código diferente de zero, e isso é essa resposta, não um CLI quebrado: leia o JSON em vez de tentar de novo ou contornar.

Sem raiz, o que acontece em seguida depende de como este workflow foi alcançado:

- **Selecionado automaticamente**: você escolheu este workflow sozinho, sem o usuário nomear o BR-OpenSpec, nomear esta skill ou executar o slash command dela. Pare de usar o BR-OpenSpec e responda à solicitação normalmente, como faria sem o BR-OpenSpec instalado. Não peça para configurar nada e não mencione a configuração do BR-OpenSpec.
- **Solicitação explícita do BR-OpenSpec**: o usuário nomeou o BR-OpenSpec, nomeou esta skill ou executou o slash command dela. Pare antes de escrever e pergunte como prosseguir: configurar este projeto (`openspec init`) ou continuar sem o BR-OpenSpec nesta solicitação. Aguarde a resposta.

Nos dois ramos, nunca crie a raiz como efeito colateral: não execute `openspec init` até o usuário pedir, não crie arquivos `openspec/` à mão e não deixe um comando criá-la.

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
   - `changeRoot`, `artifactPaths` e `actionContext`: contexto de caminho e escopo. Use-os em vez de assumir caminhos locais do repositório.

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
        - `resolvedOutputPath`: Caminho ou padrão resolvido onde escrever o artifact
        - `dependencies`: Artifacts concluídos para ler como contexto
      - Leia quaisquer arquivos de dependências concluídos para contexto - sempre releia-os do disco, mesmo que já os tenha visto antes na conversa (o usuário pode tê-los editado)
      - **Inspecione o projeto relevante antes de rascunhar**: Leia `context` e `rules` primeiro, depois inspecione a implementação relevante, testes próximos, configuração e documentação fora de `openspec/`. Mantenha a inspeção somente leitura e proporcional à change; reutilize os achados nos artifacts seguintes e inspecione mais apenas quando necessário.
        - Identifique o projeto alvo a partir da solicitação e do contexto do projeto. Se o alvo não estiver claro, pergunte. Para changes greenfield ou que não sejam de código, inspecione a estrutura disponível e os documentos relevantes. Se o código-fonte não estiver disponível, declare a limitação e pergunte quando isso afetar materialmente o plano.
        - Ancore escopo, abordagem e tarefas no que você encontrar. Distinga comportamento observado de suposições e de acréscimos propostos; traga à tona conflitos com specs existentes em vez de decidir silenciosamente qual está certo.
        - Faça essa descoberta agora, em vez de deixar tarefas genéricas de "explorar a codebase" ou "fazer um plano" para a implementação. Mantenha qualquer investigação de acompanhamento específica de uma pergunta ainda não resolvida.
      - Escolha o caminho de saída antes de criar qualquer coisa. Se `resolvedOutputPath` for um glob, siga `instruction` para escolher um caminho concreto dentro de `changeRoot` que case com o glob, e verifique que ele permanece dentro de `changeRoot` depois de resolver symlinks, tanto nos diretórios pai quanto no próprio arquivo se ele já existir; se não permanecer, pare e avise o usuário. Caso contrário, o caminho de saída é `resolvedOutputPath`
      - Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o somente se ele puder escrever o artifact nesse caminho de saída; caso contrário, pare e avise o usuário. Depois verifique se o arquivo do artifact existe nesse caminho de saída
      - Caso contrário, crie o arquivo do artifact usando `template` como a estrutura e escreva-o nesse caminho de saída
      - Aplique `context` e `rules` como restrições - mas NÃO copie-os para o arquivo
      - Mostre breve progresso: "✓ Criado <artifact-id>"

   b. **Continue até que todos os artifacts do conjunto necessário existam (não apenas o `apply.requires`)**
      - Após criar cada artifact, reexecute `openspec status --change "<nome>" --json`
      - O conjunto necessário é o `applyRequires` mais todo artifact alcançável a partir deles seguindo as arestas `requires` do `status --json` - percorra-as transitivamente (o spec-driven fecha sobre proposal, specs, design, tasks). Deixe artifacts fora desse conjunto em paz
      - O `status` é apenas existência de arquivo, então um artifact de `applyRequires` marcado como `done` NÃO significa que suas dependências existam - escrever `tasks.md` cedo marca `tasks` como done sem que `specs` jamais tenha sido escrito. Use as arestas `requires` de cada artifact, não o `status`, para montar o conjunto necessário: um artifact `done` ainda lista do que depende
      - Um artifact com `status: "skipped"` já está satisfeito: a change declara `skip_specs` em `.openspec.yaml`, então seus arquivos NÃO devem existir. Nunca tente criá-lo
      - Crie todo artifact do conjunto necessário que estiver faltando, depois verifique novamente - criar um pode desbloquear outros
      - Pule um apenas quando o `status` já o reportar como `skipped`, ou quando o próprio `instruction` dele disser que é condicional: execute `openspec instructions <artifact-id> --change "<nome>" --json` e pule somente se o campo `instruction` o marcar como opcional (por exemplo, "crie apenas se..."). O `design.md` do spec-driven se qualifica; `specs` se qualifica somente pelo status `skipped` acima, nunca pelo seu próprio julgamento. Avise o usuário e não reconsidere
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
- Se o campo `instruction` direcionar você a usar uma skill ou comando específico para criar o artifact, invoque-o em vez de escrever o artifact diretamente - mas somente depois de ter escolhido e checado o caminho de saída, e somente se ele puder escrever ali
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
- Se uma change com aquele nome já existir, sugira continuar aquela change em vez disso
- Verifique se cada arquivo do artifact existe após escrever antes de prosseguir para o próximo

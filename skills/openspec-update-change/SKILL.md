---
name: openspec-update-change
description: Atualize uma change do BR-OpenSpec revisando seus artifacts de planejamento existentes e mantendo-os coerentes entre si. Use quando o usuário quiser revisar o plano de uma change, incorporar novas decisões a ela ou reconciliar seus artifacts após uma edição. Use também quando o usuário disser "openspec update change" ou "opsx update". Se o usuário quiser o comando de CLI openspec update, que atualiza os arquivos gerados, execute esse comando. Nunca edita código.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Revise os artifacts de planejamento existentes de uma change e mantenha-os coerentes. Nunca edite código.

**Verificação do projeto:** Estes passos esperam um projeto que já usa o BR-OpenSpec. Antes do primeiro passo que escreve qualquer coisa (`new change`, `archive`, `sync specs` ou a autoria de um arquivo de artifact), confirme que o projeto tem uma raiz: execute `openspec list --json` e leia `root`. Um objeto root significa que o projeto está configurado. `"root": null` significa que não está — não há diretório `openspec/` aqui, e uma escrita como `openspec new change` criaria um como efeito colateral. O comando também sai com código diferente de zero, e isso é essa resposta, não um CLI quebrado: leia o JSON em vez de tentar de novo ou contornar.

Sem raiz, o que acontece em seguida depende de como este workflow foi alcançado:

- **Selecionado automaticamente**: você escolheu este workflow sozinho, sem o usuário nomear o BR-OpenSpec, nomear esta skill ou executar o slash command dela. Pare de usar o BR-OpenSpec e responda à solicitação normalmente, como faria sem o BR-OpenSpec instalado. Não peça para configurar nada e não mencione a configuração do BR-OpenSpec.
- **Solicitação explícita do BR-OpenSpec**: o usuário nomeou o BR-OpenSpec, nomeou esta skill ou executou o slash command dela. Pare antes de escrever e pergunte como prosseguir: configurar este projeto (`openspec init`) ou continuar sem o BR-OpenSpec nesta solicitação. Aguarde a resposta.

Nos dois ramos, nunca crie a raiz como efeito colateral: não execute `openspec init` até o usuário pedir, não crie arquivos `openspec/` à mão e não deixe um comando criá-la.

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

Este workflow revisa artifacts que já existem; `/openspec-continue-change` é o que cria os que não existem.

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

   Marque a change mais recentemente modificada como "(Recomendada)" já que é provavelmente a que o usuário quer atualizar.

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, `/openspec-update-change <outra>`).

2. **Obtenha os artifacts da change**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Analise o JSON para entender o estado atual. A resposta inclui:
   - `schemaName`: O schema de workflow sendo usado (por exemplo, "spec-driven")
   - `artifacts`: Array de artifacts com seu status ("done", "skipped", "ready", "blocked")
   - `isPlanningComplete`: Booleano indicando se todos os artifacts de planejamento estão completos. Versões mais antigas do CLI expõem o mesmo valor como `isComplete`.
   - `changeRoot`, `artifactPaths` e `actionContext`: contexto de caminho e escopo. Use-os em vez de assumir caminhos locais do repositório.

   Os ids e caminhos dos artifacts vêm do schema ativo - NÃO os assuma e NÃO ramifique com base em nomes de artifact fixos. Schemas personalizados devem funcionar sem alterações.

   Os arquivos a editar são `artifactPaths.<id>.existingOutputPaths` - os arquivos concretos que existem em disco, já expandidos do glob para artifacts com glob (por exemplo, `specs/**/*.md`), mais qualquer caminho concreto confirmado permitido sob um artifact com glob parcialmente preenchido (passo 4). NÃO escreva em `resolvedOutputPath`: para um artifact com glob, ele ainda é o padrão glob, não um arquivo real.

3. **Entenda a solicitação**
   - Se o usuário pediu uma revisão específica ("o design agora usa X"), essa é a edição inicial.
   - Se ele apenas disse "atualize" / "deixe coerente", trate como uma revisão de coerência: leia os artifacts existentes e compare-os entre si procurando contradições, lacunas e duplicações.

4. **Leia e reconcilie**
   - Leia o(s) artifact(s) que a solicitação afeta e os demais artifacts existentes da change.
   - Rascunhe a edição solicitada na conversa, não nos arquivos. Defina exatamente o que ela muda; o passo 5 é dono de toda escrita. Depois verifique cada outro artifact existente contra o rascunho - em QUALQUER direção: uma edição em um artifact posterior pode exigir revisar um anterior, não apenas o contrário. A ordem de construção é uma ordem de leitura útil, não uma restrição sobre quais artifacts podem ser revisados.
   - Anote tudo o que ficou inconsistente, faltando ou contraditório.
   - Proponha revisões nos arquivos que já existem (`existingOutputPaths`). Se um artifact não tiver arquivos de saída existentes e o status for `ready` ou `blocked`, anote-o e aponte o usuário para `/openspec-continue-change` para criá-los. Deixe artifacts `skipped` intocados; não os trate como ausentes nem os adie para o workflow continue.
   - Um artifact com glob (por exemplo, `specs/**/*.md`) fica marcado `done` depois que pelo menos um arquivo casa, e o workflow continue só trata artifacts `ready`. Quando a reconciliação identificar um arquivo ausente de um artifact com glob cujo `existingOutputPaths` não está vazio:
     1. Execute `openspec instructions "<artifact-id>" --change "<nome>" --json` e use `instruction` e `template`. Trate `context` e `rules` como restrições; não os copie para o arquivo. Se as instruções reportarem `skipped: true`, não crie o arquivo. Leia do disco os arquivos de dependência atuais; se uma dependência obrigatória e não skipped estiver ausente, pare e peça ao usuário para restaurá-la primeiro.
     2. Escolha um caminho concreto dentro de `changeRoot` que case com `artifactPaths.<id>.outputPath` e que ainda não exista. Verifique que ele permanece dentro de `changeRoot` depois de resolver quaisquer diretórios pai que sejam symlinks. O `resolvedOutputPath` do glob não é um alvo válido.
     3. Inclua o arquivo novo nas revisões propostas do passo 5 e crie-o somente depois que o usuário confirmar.
     4. Depois da confirmação, imediatamente antes de criar, atualize status e instructions. Verifique que o artifact ainda está no escopo, não está skipped e está parcialmente preenchido; repita as checagens de caminho concreto acima.
     5. Use uma operação de criação que falhe se o alvo já existir. Se `instruction` delegar a criação a outra skill ou comando, invoque-o somente se ele puder honrar o caminho confirmado e estes guardrails; caso contrário, pare. Se alguma checagem falhar ou o rascunho confirmado não for mais válido, pare e reconcilie com o usuário em vez de substituir conteúdo existente ou escolher outro caminho.
   - Se a change já estiver coerente, diga isso e não proponha revisões.

5. **Confirme e aplique, um artifact por vez**
   - Este passo faz toda escrita de artifact neste workflow; nenhum passo anterior edita um artifact.
   - Mostre cada revisão proposta e o porquê - incluindo a edição solicitada rascunhada no passo 4. Escreva somente após o usuário confirmar.
   - Se o usuário rejeitar uma revisão, não a escreva - deixe aquele artifact inalterado.
   - Quando uma reescrita substancial for necessária, obtenha primeiro as regras e o template daquele artifact:
     ```bash
     openspec instructions "<artifact-id>" --change "<nome>" --json
     ```

6. **Aponte o próximo passo (apenas orientação - NUNCA aja sobre ele)**
   - Artifacts com `existingOutputPaths` vazio e status `ready` ou `blocked` -> sugira `/openspec-continue-change` para criá-los.
   - Change já implementada (tarefas marcadas / já aplicada) -> o código pode não corresponder mais ao plano revisado; sugira `/openspec-apply-change` para levar o delta ao código.
   - Tudo pronto e implementado -> sugira `/openspec-archive-change`.

**Saída**

Após cada invocação, mostre:
- Quais artifacts foram revisados (e quais revisões propostas foram rejeitadas)
- Qualquer arquivo criado sob um artifact com glob que já estava parcialmente preenchido
- Qualquer coisa adiada para `/openspec-continue-change` (artifacts sem arquivos ainda e status `ready` ou `blocked`, nunca artifacts `skipped`)
- Onde a change está e o próximo comando recomendado

**Guardrails**
- Apenas artifacts de planejamento - NUNCA edite código de implementação. Se o plano revisado implicar mudanças de código, pare e aponte para `/openspec-apply-change`.
- Use os ids e caminhos de artifacts reportados por `openspec status`; nunca ramifique com base em nomes de artifact fixos.
- Edite apenas os arquivos concretos em `existingOutputPaths`, mais qualquer caminho concreto confirmado permitido sob um artifact com glob parcialmente preenchido (passo 4); nunca escreva em um `resolvedOutputPath` com glob.
- Não avance a fronteira de construção: se um artifact tiver `existingOutputPaths` vazio e status `ready` ou `blocked`, esse é o trabalho do `/openspec-continue-change`. Deixe artifacts `skipped` intocados. O único escopo de arquivo novo é um caminho concreto confirmado sob um artifact com glob cujo `existingOutputPaths` não está vazio.
- Confirme cada edição com o usuário antes de escrever.
- Se a solicitação mudar a *intenção* da change em vez de refiná-la, recomende começar do zero com `/openspec-new-change` (a heurística "Atualizar vs. Começar do Zero").

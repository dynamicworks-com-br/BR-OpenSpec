---
name: openspec-archive-change
description: Arquiva uma change concluída no workflow experimental. Use quando o usuário quiser finalizar e arquivar uma change após a implementação estar completa.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Arquiva uma change concluída no workflow experimental.

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute `openspec list --json` para obter as changes disponíveis e peça ao usuário que selecione uma

   Ao solicitar, mostre apenas as changes ativas (não arquivadas).
   Inclua o schema usado para cada change, se disponível.

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, `/openspec-archive-change <outra>`).

   **Carregue as entradas atuais de arquivamento antes das verificações de arquivamento existentes:**

   Após resolver a change selecionada, execute:
   ```bash
   openspec instructions archive --change "<nome>" --json
   ```
   Essa consulta é consultiva e opcional: ela só fornece entradas extras de
   prompt, então nunca deve bloquear o arquivamento. Se sair com código não-zero
   ou retornar JSON inválido — por exemplo em um CLI mais antigo que ainda não
   suporta este comando — continue o workflow de arquivamento sem contexto e sem
   orientação de operação. Não reporte erro e não pare.

   Uma resposta bem-sucedida pode omitir ambos os campos opcionais. Trate
   `context` como uma entrada obrigatória em nível de prompt: leia e considere
   esse conteúdo, aplicando fatos, convenções e restrições relevantes do
   projeto. Trate `operationGuidance` como conselho aditivo opcional: leia e
   considere cada entrada, seguindo as que forem aplicáveis e compatíveis com o
   workflow de arquivamento embutido.

   Mantenha ambos os campos separados dos passos embutidos, das escolhas
   explícitas do usuário, dos caminhos resolvidos, das verificações do CLI e
   dos contratos de comandos. Se o contexto conflitar com uma dessas entradas
   controladoras, reporte o conflito e preserve o valor controlador. Se a
   orientação for inaplicável ou conflitar com uma entrada controladora, não a
   siga e explique por quê. Não infira caminhos substitutos, prompts ignorados
   ou flags a partir desses campos, e não copie o texto deles verbatim para
   specs, artifacts da change ou resumos de arquivamento, a menos que o usuário
   peça separadamente por esse conteúdo. Estes são contratos de comportamento
   em nível de prompt, não verificações impostas.

2. **Verifique o status de conclusão dos artifacts**

   Execute `openspec status --change "<nome>" --json` para verificar a conclusão dos artifacts.

   Analise o JSON para entender:
   - `schemaName`: O workflow sendo usado
   - `artifacts`: Lista de artifacts com seu status (`done`, `skipped` ou outro)

   **Se algum artifact não estiver `done` nem `skipped`** (artifacts ignorados satisfazem o requisito - a change declara skip_specs):
   - Exiba um aviso listando os artifacts incompletos
   - Peça ao usuário que confirme se deseja prosseguir
   - Prossiga se o usuário confirmar

3. **Verifique o status de conclusão das tarefas**

   Execute `openspec status --change "<nome>" --json` e use `artifactPaths` para localizar o artifact de tarefas do schema ativo (tipicamente `tasks`, mas confira o JSON).

   Leia os caminhos em `artifactPaths.<id>.existingOutputPaths` (ou o equivalente retornado) em vez de assumir `tasks.md`.

   Use o formato de conclusão definido pelo schema ativo e pela saída de `openspec instructions apply --change "<nome>" --json` (lista de tarefas e instrução dinâmica) para contar pendentes vs concluídas.

   **Se tarefas incompletas forem encontradas:**
   - Exiba um aviso mostrando a quantidade de tarefas incompletas
   - Peça ao usuário que confirme se deseja prosseguir
   - Prossiga se o usuário confirmar

   **Se não existir artifact de tarefas:** Prossiga sem aviso relacionado a tarefas.

4. **Avalie o estado de sincronização dos delta specs**

   Execute `openspec status --change "<nome>" --json` e use `artifactPaths.specs.existingOutputPaths` como a única fonte de delta specs. Se a entrada `specs` estiver ausente ou `existingOutputPaths` estiver vazia, prossiga sem prompt de sync e não infira delta specs de outros artifacts.

   **Se delta specs existirem:**
   - Compare cada delta spec com seu spec principal correspondente em `openspec/specs/`
   - Determine quais alterações seriam aplicadas (adições, modificações, remoções, renomeações)
   - Mostre um resumo combinado antes de solicitar

   **Opções de prompt:**
   - Se alterações forem necessárias: "Sincronizar agora (recomendado)", "Arquivar sem sincronizar"
   - Se já estiver sincronizado: "Arquivar agora", "Sincronizar mesmo assim", "Cancelar"

   Encaminhe conforme a resposta:
   - "Cancelar" — pare, não arquive
   - "Arquivar sem sincronizar" ou "Arquivar agora" — prossiga para o arquivamento
   - "Sincronizar agora" ou "Sincronizar mesmo assim" — sincronize, depois verifique (abaixo)
   - Qualquer outra resposta — pergunte novamente em vez de arquivar

   Antes que um sync selecionado escreva qualquer spec principal, execute
   `openspec instructions specs --change "<nome>" --json` uma vez. Exija código de
   saída zero e JSON de instrução de artifact válido. Se a consulta falhar ou
   retornar JSON inválido, reporte o erro e pare antes de escrever qualquer spec
   principal ou mover a change. Uma resposta válida com `rules` omitido é o
   caso sem regras. Aplique as `rules` retornadas apenas ao conteúdo e à forma
   dos specs principais produzidos por esta mesclagem; não as use como
   orientação de arquivamento, não mude o comportamento do CLI nem copie o
   texto das regras para qualquer arquivo de saída.

   Para sincronizar, execute o workflow `/openspec-sync-specs` inline (merge inteligente dirigido por agente) para a change '<nome>', passando a análise de delta spec acima e o snapshot de regras de specs obtido, e aguarde a conclusão. O sync inline deve reutilizar esse snapshot sem buscar as instruções de `specs` novamente. Não o delegue a uma tarefa em background — o passo 5 moveria o diretório da change enquanto um sync ainda o lê, deixando a change arquivada e os specs principais nunca atualizados. Se o seu agente só conseguir executá-lo por delegação, delegue de forma síncrona e aguarde o resultado.

   Em seguida, refaça a comparação do topo deste passo contra cada capability que tem um delta spec em `artifactPaths.specs.existingOutputPaths` — não apenas as que o sync reporta ter tocado. Um sync bem-sucedido não deixa nada para aplicar, então cada capability deve agora constar como já sincronizada:
   - Requisitos ADDED presentes
   - Requisitos MODIFIED carregando as alterações de cenário e descrição nomeadas no delta, com seus demais cenários intactos
   - Requisitos REMOVED ausentes
   - Requisitos RENAMED presentes sob o novo nome e ausentes sob o antigo

   Se o sync falhar, ou qualquer capability não corresponder, reporte a divergência e pare — não arquive. Nada foi movido e o diretório da change está intacto, então o usuário pode corrigir a inconsistência ou reexecutar o sync e iniciar o arquivamento novamente.

5. **Realize o arquivamento**

   Use o CLI para mover a change de forma atômica:

   ```bash
   openspec archive "<nome>"
   ```

   O comando trata colisões no destino, prefixo de data e validação. O nome de destino (`<target-name>`) usa o nome da change como está quando ele já começa com um prefixo `YYYY-MM-DD-`; caso contrário, a data atual é prefixada como `YYYY-MM-DD-<nome>` — nunca empilhe uma segunda data (mesma regra do `openspec archive`). Se o destino já existir, falhe com erro e sugira renomear o arquivo existente ou usar outra data — **não** use `mv` manual nem aninhe o diretório da change.

6. **Exiba o resumo**

   Mostre o resumo de conclusão do arquivamento incluindo:
   - Nome da change
   - Schema que foi usado
   - Local do arquivo
   - Se os specs foram sincronizados (se aplicável)
   - Observação sobre quaisquer avisos (artifacts/tarefas incompletos)

**Saída em Sucesso**

```markdown
## Arquivamento Concluído

**Change:** <nome-change>
**Schema:** <nome-schema>
**Arquivado em:** openspec/changes/archive/<target-name>/
**Specs:** <"✓ Sincronizados com os specs principais" somente se a verificação do passo 4 passou; caso contrário "Sem delta specs" ou "Sincronização ignorada">

<"Todos os artifacts completos. Todas as tarefas completas." — ou, se arquivado com avisos, liste-os em vez disso (ex.: "Arquivado com 2 tarefas incompletas")>
```

**Guardrails**
- Anuncie a change selecionada; solicite a seleção quando for ambígua
- Use o grafo de artifacts (openspec status --json) para verificação de conclusão
- Não bloqueie o arquivamento por avisos - apenas informe e confirme
- Preservar .openspec.yaml ao mover para o arquivo (ele move com o diretório)
- Mostre um resumo claro do que aconteceu
- Se sync for solicitado, execute o workflow `/openspec-sync-specs` inline (agent-driven)
- Nunca arquive enquanto um sync de specs ainda estiver em andamento — execute o sync inline e verifique os specs principais antes de mover o diretório da change
- Se delta specs existirem, sempre execute a avaliação de sync e mostre o resumo combinado antes de solicitar
- Aplique o contexto de runtime relevante e reporte conflitos; a orientação da operação permanece consultiva
- Considere cada entrada de orientação e explique qualquer conselho inaplicável ou conflitante
- Verificações do CLI, caminhos resolvidos, prompts e contratos de comandos existentes permanecem inalterados
- Regras de artifact restringem apenas os specs sendo escritos e nunca são orientação de operação
- Nunca copie contexto de runtime, orientação da operação ou texto de regras de artifact verbatim para arquivos de saída

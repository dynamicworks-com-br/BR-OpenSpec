---
name: openspec-archive-change
description: Arquiva uma change concluída no workflow experimental. Use quando o usuário quiser finalizar e arquivar uma change após a implementação estar completa.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Arquiva uma change concluída no workflow experimental.

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Se nenhum nome de change for fornecido, solicite a seleção**

   Execute `openspec list --json` para obter as changes disponíveis. Use a ferramenta **AskUserQuestion** para permitir que o usuário selecione.

   Mostre apenas as changes ativas (não arquivadas).
   Inclua o schema usado para cada change, se disponível.

   **IMPORTANTE**: NÃO adivinhe ou selecione automaticamente uma change. Sempre deixe o usuário escolher.

2. **Verifique o status de conclusão dos artifacts**

   Execute `openspec status --change "<nome>" --json` para verificar a conclusão dos artifacts.

   Analise o JSON para entender:
   - `schemaName`: O workflow sendo usado
   - `artifacts`: Lista de artifacts com seu status (`done` ou outro)

   **Se algum artifact não estiver `done`:**
   - Exiba um aviso listando os artifacts incompletos
   - Use a ferramenta **AskUserQuestion** para confirmar se o usuário deseja prosseguir
   - Prossiga se o usuário confirmar

3. **Verifique o status de conclusão das tarefas**

   Leia o arquivo de tarefas (tipicamente `tasks.md`) para verificar tarefas incompletas.

   Conte as tarefas marcadas com `- [ ]` (incompleto) vs `- [x]` (concluído).

   **Se tarefas incompletas forem encontradas:**
   - Exiba um aviso mostrando a quantidade de tarefas incompletas
   - Use a ferramenta **AskUserQuestion** para confirmar se o usuário deseja prosseguir
   - Prossiga se o usuário confirmar

   **Se não existir arquivo de tarefas:** Prossiga sem aviso relacionado a tarefas.

4. **Avalie o estado de sincronização dos delta specs**

   Verifique se existem delta specs em `openspec/changes/<nome>/specs/`. Se não existirem, prossiga sem prompt de sync.

   **Se delta specs existirem:**
   - Compare cada delta spec com seu spec principal correspondente em `openspec/specs/<capability>/spec.md`
   - Determine quais alterações seriam aplicadas (adições, modificações, remoções, renomeações)
   - Mostre um resumo combinado antes de solicitar

   **Opções de prompt:**
   - Se alterações forem necessárias: "Sincronizar agora (recomendado)", "Arquivar sem sincronizar"
   - Se já estiver sincronizado: "Arquivar agora", "Sincronizar mesmo assim", "Cancelar"

   Se o usuário escolher sincronizar, use a ferramenta Task (subagent_type: "general-purpose", prompt: "Use a ferramenta Skill para invocar openspec-sync-specs para a change '<nome>'. Análise de delta spec: <inclua o resumo analisado do delta spec>"). Se o usuário escolher "Cancelar", pare — não arquive. Para qualquer outra escolha, prossiga para o arquivamento.

5. **Realize o arquivamento**

   Crie o diretório de arquivo se não existir:
   ```bash
   mkdir -p openspec/changes/archive
   ```

   Gere o nome do destino usando a data atual: `YYYY-MM-DD-<nome-change>`

   **Verifique se o destino já existe:**
   - Se sim: Falhe com erro, sugira renomear o arquivo existente ou usar uma data diferente
   - Se não: Mova o diretório da change para o arquivo

   ```bash
   mv openspec/changes/<nome> openspec/changes/archive/YYYY-MM-DD-<nome>
   ```

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
**Arquivado em:** openspec/changes/archive/YYYY-MM-DD-<nome>/
**Specs:** ✓ Sincronizados com os specs principais (ou "Sem delta specs" ou "Sincronização ignorada")

<"Todos os artifacts completos. Todas as tarefas completas." — ou, se arquivado com avisos, liste-os em vez disso (ex.: "Arquivado com 2 tarefas incompletas")>
```

**Guardrails**
- Sempre solicite a seleção da change se não fornecida
- Use o grafo de artifacts (openspec status --json) para verificação de conclusão
- Não bloqueie o arquivamento por avisos - apenas informe e confirme
- Preservar .openspec.yaml ao mover para o arquivo (ele move com o diretório)
- Mostre um resumo claro do que aconteceu
- Se sync for solicitado, use a abordagem openspec-sync-specs (agent-driven)
- Se delta specs existirem, sempre execute a avaliação de sync e mostre o resumo combinado antes de solicitar

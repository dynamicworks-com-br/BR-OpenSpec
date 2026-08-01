---
name: openspec-verify-change
description: Verifica se a implementação corresponde aos artifacts da change. Use quando o usuário quiser validar que a implementação está completa, correta e coerente antes de arquivar.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Verifica se uma implementação corresponde aos artifacts da change (specs, tasks, design).

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute `openspec list --json` para obter as changes disponíveis e peça ao usuário que selecione uma

   Ao solicitar, mostre as changes que possuem artifact de implementação. Para cada change, execute `openspec status --change "<nome>" --json` e use os IDs de artifacts e `contextFiles` (via `openspec instructions apply --change "<nome>" --json`) para identificar qual artifact rastreia a implementação — não fixe `tasks`.

   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, `/openspec-verify-change <outra>`).

2. **Verifique o status para entender o schema**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Analise o JSON para entender:
   - `schemaName`: O workflow sendo usado (por exemplo, "spec-driven")
   - Quais artifacts existem para esta change

3. **Obtenha o diretório da change e carregue os artifacts**

   ```bash
   openspec instructions apply --change "<nome>" --json
   ```

   Isso retorna o diretório da change e `contextFiles` (artifact ID -> array de caminhos de arquivos concretos). Leia todos os artifacts disponíveis de `contextFiles`.

4. **Inicialize a estrutura do relatório de verificação**

   Crie uma estrutura de relatório com três dimensões:
   - **Completeness**: Acompanhe tasks e cobertura de specs
   - **Correctness**: Acompanhe implementação de requisitos e cobertura de cenários
   - **Coherence**: Acompanhe aderência ao design e consistência de padrões

   Cada dimensão pode ter issues CRITICAL, WARNING ou SUGGESTION.

5. **Verifique Completeness**

   **Conclusão de Tasks**:
   - Se `contextFiles.tasks` existir, leia cada caminho de arquivo nele
   - Analise checkboxes: `- [ ]` (incompleto) vs `- [x]` (concluído)
   - Conte tasks concluídas vs total
   - Se houver tasks incompletas:
     - Adicione issue CRITICAL para cada task incompleta
     - Recomendação: "Complete task: <descrição>" ou "Mark as done if already implemented"

   **Cobertura de Specs**:
   - Use `contextFiles` e `artifactPaths` do status/instructions para localizar delta specs — não assuma caminhos fixos
   - Extraia todos os requisitos (marcados com "### Requirement:")
   - Para cada requisito:
     - Procure no codebase por evidências objetivas de implementação (símbolos, testes, endpoints)
     - Não classifique como CRITICAL apenas por busca heurística de palavras-chave inconclusiva
     - Se houver evidência clara de que o requisito não foi implementado: issue CRITICAL
     - Se a análise for inconclusiva: registre WARNING ou SUGGESTION conforme o risco de falso positivo
     - Recomendação: "Implement requirement X: <descrição>" ou "Verify requirement X manually: <descrição>"

6. **Verifique Correctness**

   **Mapeamento de Implementação de Requisitos**:
   - Para cada requisito dos delta specs:
     - Procure no codebase por evidências de implementação
     - Se encontrado, anote os caminhos de arquivo e intervalos de linha
     - Avalie se a implementação corresponde à intenção do requisito
     - Se divergência for detectada:
       - Adicione WARNING: "Implementation may diverge from spec: <detalhes>"
       - Recomendação: "Review <arquivo>:<linhas> contra requirement X"

   **Cobertura de Cenários**:
   - Para cada cenário nos delta specs (marcado com "#### Scenario:"):
     - Verifique se as condições são tratadas no código
     - Verifique se existem testes cobrindo o cenário
     - Se o cenário parecer não coberto:
       - Adicione WARNING: "Scenario not covered: <nome do cenário>"
       - Recomendação: "Add test or implementation for scenario: <descrição>"

7. **Verifique Coherence**

   **Aderência ao Design**:
   - Se `contextFiles.design` existir:
     - Extraia decisões-chave (procure por seções como "Decision:", "Approach:", "Architecture:")
     - Verifique se a implementação segue essas decisões
     - Se contradição for detectada:
       - Adicione WARNING: "Design decision not followed: <decisão>"
       - Recomendação: "Update implementation or revise design.md to match reality"
   - Se não houver design.md: Pule a verificação de aderência ao design, anote "No design.md to verify against"

   **Consistência de Padrões de Código**:
   - Revise o novo código quanto à consistência com os padrões do projeto
   - Verifique nomenclatura de arquivos, estrutura de diretórios, estilo de código
   - Se houver desvios significativos:
     - Adicione SUGGESTION: "Code pattern deviation: <detalhes>"
     - Recomendação: "Consider following project pattern: <exemplo>"

8. **Gere o Relatório de Verificação**

   **Scorecard de Resumo**:
   ```
   ## Verification Report: <nome-change>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   ```

   **Issues por Prioridade**:

   1. **CRITICAL** (Deve corrigir antes de arquivar):
      - Tasks incompletas
      - Implementações de requisitos ausentes
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
   - Se houver issues CRITICAL: "X critical issue(s) found. Fix before archiving."
   - Se houver apenas warnings: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - Se tudo estiver claro: "All checks passed. Ready for archive."

**Heurísticas de Verificação**

- **Completeness**: Foque em itens de checklist objetivos (checkboxes, lista de requisitos)
- **Correctness**: Use busca por palavras-chave, análise de caminhos de arquivo, inferência razoável — não exija certeza perfeita
- **Coherence**: Procure inconsistências gritantes, não seja meticuloso com estilo
- **False Positives**: Quando incerto, prefira SUGGESTION ao invés de WARNING, WARNING ao invés de CRITICAL
- **Actionability**: Cada issue deve ter uma recomendação específica com referências de arquivo/linha quando aplicável

**Degradação Graciosa**

- Se apenas tasks.md existir: verifique apenas a conclusão de tasks, pule verificações de spec/design
- Se tasks + specs existirem: verifique completeness e correctness, pule design
- Se todos os artifacts existirem: verifique as três dimensões
- Sempre anote quais verificações foram puladas e por quê

**Formato de Saída**

Use markdown claro com:
- Tabela para scorecard de resumo
- Listas agrupadas para issues (CRITICAL/WARNING/SUGGESTION)
- Referências de código no formato: `arquivo.ts:123`
- Recomendações específicas e acionáveis
- Sem sugestões vagas como "consider reviewing"

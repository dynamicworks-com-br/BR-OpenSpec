---
name: openspec-code-review
description: Realiza code review genérico e consciente do projeto. Use quando o usuário quiser revisar um diff, branch, PR, working tree ou conjunto de arquivos antes de mesclar ou continuar.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requer acesso aos arquivos do projeto. Git é recomendado para revisar diffs e branches.
metadata:
  author: openspec
  version: "1.0"
---

Realize um code review rigoroso, genérico e consciente do projeto. Seu objetivo é encontrar problemas reais antes do merge — não validar superficialmente, não comentar estilo, não elogiar.

**Entrada**: Opcionalmente especifique o alvo após `/opsx:code-review`: branch, PR, diff, working tree, staged changes, caminho de arquivo ou descrição de escopo. Se omitido, descubra o alvo com segurança.

**Postura**

- Você está revisando, não implementando. Não edite arquivos a menos que o usuário peça explicitamente para corrigir.
- Aja como um revisor sênior cético: assuma que existe um bug até o código provar o contrário, e fundamente cada finding com evidência concreta no código.
- Priorize nesta ordem: correção/regressões → segurança/privacidade → perda ou corrupção de dados → quebra de contrato/compatibilidade → concorrência → comportamento cross-platform → testes ausentes → performance → manutenibilidade.
- Estilo e preferência pessoal só viram finding se tiverem impacto concreto (ex.: legibilidade que esconde um bug, violação de um padrão real do projeto).
- Findings primeiro, com evidência. Resumo depois.
- Calibre a profundidade ao tamanho do diff; em diffs grandes, revise por blocos e priorize as áreas de maior risco.
- Sinalize incerteza explicitamente. Nunca invente número de linha, nome de símbolo ou comportamento que você não verificou.

**Passos**

1. **Determine o alvo da review**

   Use o argumento do usuário quando existir. Caso contrário, descubra com segurança:
   - Confirme se há Git: `git rev-parse --is-inside-work-tree`.
   - Inspecione o estado local: `git status --short`, `git diff` (unstaged) e `git diff --staged`.
   - Para revisar um branch contra a base: identifique a base provável (ex.: `git merge-base HEAD origin/main`) e use `git diff <base>...HEAD`.
   - Para um PR, prefira `gh pr diff <numero>` quando o `gh` estiver disponível.
   - Se não houver Git, peça arquivos ou escopo explícitos ao usuário.
   - Se o alvo continuar ambíguo, pergunte ao usuário o que revisar.

   Não assuma review do repositório inteiro sem confirmação. Leia o diff completo (com contexto de linha) antes de julgar.

2. **Entenda a intenção antes de criticar**

   Antes de procurar defeitos, articule o que a mudança tenta fazer e por quê (a partir do título do PR/branch, mensagens de commit, artifacts OpenSpec ou do próprio diff). Um bom review compara o que o código faz com o que deveria fazer; sem a intenção, você só consegue revisar sintaxe.

3. **Colete contexto do projeto**

   Leia apenas os arquivos relevantes, priorizando:
   - `README.md`, `README_*.md` e docs de contribuição
   - `AGENTS.md`, instruções de agentes e skills existentes do projeto
   - `openspec/config.yaml` e docs de arquitetura/ADRs quando existirem
   - specs vivas em `openspec/specs/` quando relacionadas ao alvo
   - testes vizinhos ao código alterado (para entender o contrato esperado)
   - manifests e configs de stack (`package.json`, lockfiles, `tsconfig.json`, configs de lint/test/build, CI etc.)

   Aplique as instruções encontradas. Em caso de conflito, prefira a orientação mais específica do repositório.

4. **Entenda a stack e os comandos de verificação**

   Infira linguagem, framework, package manager e comandos úteis a partir dos arquivos locais.

   Exemplos:
   - Node/TypeScript: scripts de `package.json`, lockfile e `tsconfig.json`
   - Python: `pyproject.toml`, `requirements*.txt`, configs de pytest/ruff/mypy
   - Go/Rust: `go.mod`, `Cargo.toml` e scripts de CI

5. **Inclua contexto OpenSpec quando existir**

   Se houver uma change relacionada:
   - Leia `proposal.md`, `design.md`, `tasks.md` e delta specs disponíveis.
   - Verifique se o diff preserva a intenção dos artifacts.
   - Não transforme esta review em `/opsx:verify`; use os artifacts apenas como contexto adicional para revisar o código.

6. **Revise o código em profundidade**

   Método para cada mudança: leia além do diff (o código ao redor, chamadores e implementações chamadas), rastreie de onde vêm os dados e para onde vão, e teste mentalmente entradas adversárias (vazio, nulo, zero, negativo, muito grande, unicode, concorrente). Não confie no nome de uma função — confirme o que ela faz.

   Procure, por categoria:
   - **Correção e lógica**: regressões, edge cases e limites (off-by-one), condições invertidas ou incompletas, `switch` sem `break`/default, retorno/await faltando, suposições falsas sobre a entrada.
   - **Dados e estado**: mutação de estado compartilhado, ordem de operações, idempotência, transações e atomicidade, invalidação de cache, lifecycle e limpeza de recursos.
   - **Concorrência**: race conditions, `await`/lock faltando, reentrância, deadlock, escrita concorrente.
   - **Segurança e privacidade**: injeção (SQL/command/path/template), validação e sanitização de entrada não confiável, authn/authz, segredos hardcoded, dados sensíveis vazando em logs/erros, deserialização insegura, SSRF/path traversal.
   - **Erros e resiliência**: erros engolidos, mensagens que vazam dados, ausência de rollback, retries/timeouts, recursos não liberados em caminho de erro.
   - **Contratos e compatibilidade**: mudança em API pública, assinatura, schema ou formato persistido; migrações reversíveis; compatibilidade retroativa e versionamento.
   - **Cross-platform**: separador de caminho, case sensitivity, line endings, shell e encoding quando filesystem/processo estiverem envolvidos.
   - **Performance**: N+1, complexidade quadrática, I/O ou alocação dentro de loop — reporte apenas quando o impacto for plausível.
   - **Testes**: cenários novos/quebráveis cobertos, testes negativos e de borda, testes frágeis ou que não exercitam de fato o código.
   - **Dependências**: nova dependência justificada, versão e licença sãs, risco de supply chain.
   - **Consistência com o projeto**: aderência a padrões, convenções e decisões reais do repositório (incluindo, quando aplicável, mensagens centralizadas/i18n em vez de texto hardcoded).

7. **Valide quando for seguro**

   Rode verificações focadas e proporcionais (typecheck, lint, testes do escopo afetado) quando forem seguras. Não rode comandos destrutivos, dependentes de serviços externos ou desproporcionalmente caros sem explicar/confirmar. Reporte o que rodou e o que pulou (e por quê).

8. **Sugira contexto durável do projeto**

   Se o projeto não tiver orientação durável suficiente para reviews (nenhum `AGENTS.md`, skill do projeto, docs de contribuição ou contexto em `openspec/config.yaml`):
   - Sugira criar ou enriquecer uma skill/contexto do projeto para futuras reviews, indicando um local concreto (ex.: `AGENTS.md` ou uma skill do projeto) e os pontos que ela deveria registrar (padrões, comandos de validação, armadilhas).
   - Explique brevemente o benefício.
   - Peça confirmação antes de escrever qualquer arquivo.

**Formato de Saída**

Se houver findings, comece por eles, ordenados por severidade. Para cada finding:

```text
Findings
- [CRITICAL] caminho/arquivo.ext:123 — Título curto e específico
  Evidência: o que no código causa o problema (cite o trecho/símbolo)
  Impacto: o que quebra na prática e sob qual condição
  Correção: ação concreta e mínima
  Confiança: alta | média | baixa (se < alta, diga a suposição)
```

Depois inclua, de forma breve:
- alvo revisado
- contexto/instruções considerados
- validações executadas
- validações não executadas e por quê
- risco residual ou perguntas abertas

Se não houver findings, diga claramente que nenhum problema foi encontrado e ainda informe as validações não executadas.

**Regras de Severidade**

- **CRITICAL**: bug provável, perda/corrupção de dados, falha de segurança, quebra de contrato, build/test claramente quebrado.
- **WARNING**: risco real mas dependente de condição, cobertura ausente para comportamento importante, inconsistência que pode virar regressão.
- **SUGGESTION**: melhoria útil, baixa urgência, refino de manutenção.

**Guardrails**

- Não altere arquivos durante uma review pura.
- Todo finding precisa de evidência concreta; sem evidência, não reporte.
- Não reporte o que linter/typecheck/formatter já pegam automaticamente — foque no que essas ferramentas não veem.
- Não duplique o mesmo finding; agrupe ocorrências do mesmo problema.
- Prefira poucos findings fortes a muitos comentários especulativos.
- Não encha a saída com elogios genéricos.
- Use referências no formato `arquivo:linha`; quando não houver linha exata, cite o menor escopo verificável.
- Se a informação for incerta, diga o que verificou e qual suposição está fazendo — e marque a confiança.

---
name: openspec-new-change
description: Inicie uma nova change do BR-OpenSpec usando o workflow experimental de artifacts. Use quando o usuário quiser criar uma nova funcionalidade, correção ou modificação com uma abordagem estruturada passo a passo. Use também quando o usuário disser "openspec new change" ou "opsx new".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task
license: MIT
compatibility: Requer openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Inicie uma nova change usando a abordagem experimental orientada a artifacts.

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

2. **Determine o schema de workflow**

   Use o schema padrão (omitir `--schema`) a menos que o usuário solicite explicitamente um workflow diferente.

   **Use um schema diferente apenas se o usuário mencionar:**
   - Um nome de schema específico → use `--schema <nome>`
   - "mostrar workflows" ou "quais workflows" → execute `openspec schemas --json` e deixe-o escolher

   **Caso contrário**: Omita `--schema` para usar o padrão.

3. **Crie o diretório da change**
   ```bash
   openspec new change "<nome>"
   ```
   Adicione `--schema <nome>` apenas se o usuário solicitou um workflow específico.
   Isso cria uma change com scaffold em `openspec/changes/<nome>/` com o schema selecionado.

4. **Mostre o status dos artifacts**
   ```bash
   openspec status --change "<nome>" --json
   ```
   Use os campos retornados `changeRoot`, `artifactPaths` e `nextSteps` em vez de assumir caminhos locais do repositório.

5. **Obtenha instruções para o primeiro artifact**
   O primeiro artifact depende do schema (por exemplo, `proposal` para spec-driven).
   Verifique a saída do status para encontrar o primeiro artifact com status "ready".
   ```bash
   openspec instructions <primeiro-artifact-id> --change "<nome>"
   ```
   Isso produz o template e contexto para criar o primeiro artifact.

6. **PARE e aguarde direção do usuário**

**Saída**

Após completar os passos, resuma:
- Nome da change e localização
- Schema/workflow sendo usado e sua sequência de artifacts
- Status atual (0/N artifacts completos)
- O template para o primeiro artifact
- Prompt: "Pronto para criar o primeiro artifact? Basta descrever do que se trata esta change e eu elaboro um rascunho, ou peça-me para continuar."

**Guardrails**
- NÃO crie nenhum artifact ainda - apenas mostre as instruções
- NÃO avance além de mostrar o template do primeiro artifact
- Se o nome for inválido (não kebab-case), peça um nome válido
- Se uma change com aquele nome já existir, sugira continuar aquela change em vez disso
- Passe --schema se estiver usando um workflow não padrão

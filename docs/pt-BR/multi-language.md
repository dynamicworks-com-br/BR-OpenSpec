# Guia Multi-Idioma

Configure o BR-OpenSpec para gerar artefatos em idiomas diferentes do inglês.

## Configuração Rápida

Em um projeto novo, defina o idioma durante a inicialização:

```bash
openspec init --language "Português (pt-BR)"
```

Isso grava a instrução de idioma no `openspec/config.yaml`. O bloco gerado fica
em inglês, porque é lido pelos agentes de IA:

```yaml
context: |
  Language: Português (pt-BR)
  All artifacts must be written in Português (pt-BR).
  Keep OpenSpec structural headings and SHALL/MUST keywords in English.
```

Se o projeto já tem uma configuração, edite o campo `context` diretamente para
preservar as orientações existentes.

Você também pode configurar o mesmo comportamento manualmente:

Adicione uma instrução de idioma ao seu `openspec/config.yaml`:

```yaml
schema: spec-driven

context: |
  Idioma: Português (pt-BR)
  Todos os artefatos devem ser escritos em português do Brasil.
  Mantenha os cabeçalhos estruturais do OpenSpec e as palavras-chave SHALL/MUST em inglês.

  # Seu outro contexto de projeto abaixo...
  Tech stack: TypeScript, React, Node.js
```

Pronto. Todos os artefatos gerados agora estarão em português.

A estrutura dos documentos do BR-OpenSpec e as palavras-chave normativas
`SHALL`/`MUST` permanecem em inglês porque a validação depende delas — assim
como os demais termos reservados (`## Requirements`, `### Requirement:`,
`#### Scenario:`, WHEN/THEN). A prosa dos requisitos e cenários ao redor pode
usar o idioma escolhido.

## Exemplos de Idiomas

### Português (Brasil)

```yaml
context: |
  Idioma: Português (pt-BR)
  Todos os artefatos devem ser escritos em português do Brasil.
```

### Espanhol

```yaml
context: |
  Idioma: Español
  Todos los artefactos deben escribirse en español.
```

### Chinês (Simplificado)

```yaml
context: |
  语言：中文（简体）
  所有产出物必须用简体中文撰写。
```

### Japonês

```yaml
context: |
  言語：日本語
  すべての成果物は日本語で作成してください。
```

### Francês

```yaml
context: |
  Langue : Français
  Tous les artefacts doivent être rédigés en français.
```

### Alemão

```yaml
context: |
  Sprache: Deutsch
  Alle Artefakte müssen auf Deutsch verfasst werden.
```

## Dicas

### Lidar com Termos Técnicos

Decida como tratar a terminologia técnica:

```yaml
context: |
  Idioma: Japonês
  Escreva em japonês, mas:
  - Mantenha termos técnicos como "API", "REST", "GraphQL" em inglês
  - Exemplos de código e caminhos de arquivo permanecem em inglês
```

### Combinar com Outro Contexto

As configurações de idioma funcionam junto com o restante do contexto do seu projeto:

```yaml
schema: spec-driven

context: |
  Idioma: Português (pt-BR)
  Todos os artefatos devem ser escritos em português do Brasil.

  Tech stack: TypeScript, React 18, Node.js 20
  Database: PostgreSQL with Prisma ORM
```

## Verificação

Para verificar se a configuração de idioma está funcionando:

```bash
# Verifique as instruções - deve exibir o contexto de idioma
openspec instructions proposal --change my-change

# A saída incluirá o contexto de idioma
```

## Documentação Relacionada

- [Guia de Personalização](../customization.md) - Opções de configuração do projeto
- [Guia de Fluxos de Trabalho](../workflows.md) - Documentação completa de fluxos de trabalho

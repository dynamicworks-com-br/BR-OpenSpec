# Vitrine da Comunidade

Uma lista mantida pela comunidade de projetos e recursos feitos com e para o BR-OpenSpec. Ferramentas, integrações, fluxos de trabalho e materiais de aprendizado são bem-vindos. Quem participa cresce e mantém esta vitrine por pull requests.

Os projetos listados são mantidos de forma independente. A inclusão não implica suporte oficial nem endosso do BR-OpenSpec. Consulte a documentação e o rastreador de issues de cada projeto para instalação e suporte.

## Projetos e recursos

- **[OpenSpec Workbench](https://github.com/VeryComplexAndLongName/OpenSpec-UI)**: executar e supervisionar agentes em mudanças OpenSpec.
- **[openspec-guard](https://github.com/guillaume-flambard/spec-guard)**: CLI e GitHub Action que informa quais cenários OpenSpec estão cobertos por um teste Vitest ou Jest, sem executar os testes.

## Serviços hospedados

Produtos hospedados que acrescentam uma capacidade do BR-OpenSpec que a CLI não oferece. Cada entrada declara conta, pagamento e tratamento de dados.

- **[MySpec](https://myspec.dev)**: beta na nuvem (conta obrigatória; faixa gratuita, sem cartão) que conduz entrevistas guiadas de spec e exporta pacotes de quatro arquivos ou mudanças compatíveis com OpenSpec. O servidor MCP (`@myspec/mcp-server`) e os [plugins para Claude Code](https://github.com/myspecs/claude-plugins) permitem que agentes de código leiam essas specs, escrevam mudanças OpenSpec e as implementem tarefa a tarefa. O serviço envia o conteúdo submetido a provedores de IA de terceiros e não foi feito para dados sensíveis.
- **[Entalpa](https://entalpa.com/en/openspec)**: importa o `openspec/specs/` de um repositório público do GitHub (até 300 requisitos) para um projeto navegável, acrescenta stakeholders, histórias e perguntas em aberto marcadas como inferidas, e exporta o resultado como uma árvore `openspec/specs/`; nunca escreve no repositório. Importar e ler não exigem conta; salvar ou editar exige, e os recursos de IA usam créditos pagos. O conteúdo importado é enviado a provedores de IA de terceiros.
- **[OpenSpec Review](https://skillgild.dev/skills/openspec-review) e [OpenSpec Compact](https://skillgild.dev/skills/openspec-compact)**: skills hospedadas da SkillGild para Claude Code, Codex, Cursor, Gemini CLI ou qualquer cliente MCP. O Review publica uma mudança como um link em que quem o tiver pode aprovar, pedir alterações ou comentar por requisito sem conta, mostra a spec principal como o `openspec archive` a escreveria e sinaliza requisitos que outras mudanças abertas também tocam. O Compact encontra requisitos lexicalmente parecidos e cenários repetidos nas specs principais e escreve a limpeza como uma mudança OpenSpec. Exige a CLI da SkillGild e uma conta gratuita (25 execuções por mês por skill). Ambos enviam o conteúdo da spec aos servidores da SkillGild, que rodam código fechado e não chamam modelo de IA; o Review também envia proposal, design e tasks, e guarda a mudança por 30 dias.

## Adicione seu projeto

Abra um pull request acrescentando uma linha a este arquivo com o nome do projeto, um link direto e uma descrição curta de como ele se relaciona com o BR-OpenSpec.

- Mantenha as entradas focadas em algo feito com o BR-OpenSpec ou que apoie o uso dele, e não em publicidade geral de produto.
- Descreva o que as pessoas podem usar. Evite alegações promocionais, links de indicação e links de rastreamento.
- Revele recursos pagos ou contas obrigatórias na entrada, se houver.
- Serviços hospedados ou pagos entram em Serviços hospedados somente quando acrescentam uma capacidade do BR-OpenSpec que a CLI ainda não oferece e têm um jeito gratuito de experimentá-los. Um serviço que reempacota as skills ou os comandos do próprio BR-OpenSpec não é listado.

Correções e atualizações de entradas existentes também são bem-vindas.

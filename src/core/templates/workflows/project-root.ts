/**
 * Shared project-root guidance for skill template workflows.
 *
 * Generated skills and commands are installed once per machine, so they are
 * offered in every repository the agent opens - including repositories that
 * never ran `openspec init`. Nothing stops the workflow there: `openspec new
 * change` falls back to an implicit root and creates `openspec/` in whatever
 * directory the agent happens to be in.
 *
 * This guidance is interpolated into every workflow so the agent checks for a
 * root before writing. `openspec list --json` is the check because it refuses
 * to fabricate an implicit root: it reports `root: null` when nothing is set up.
 *
 * What follows the check depends on how the workflow was reached, because the
 * two cases want opposite things (#1645). A skill the model picked on its own
 * in an unrelated repository must get out of the way: the user asked for help,
 * not for BR-OpenSpec, and answering with a setup menu is the reported bug. A
 * user who named BR-OpenSpec, named the skill, or ran its slash command is owed
 * an answer about BR-OpenSpec, so that case stops and asks.
 *
 * One text serves both surfaces. `apply-change` and `onboard` render a single
 * body into the skill and the command alike, so a command-only variant would
 * mean threading a surface flag through bodies that deliberately have none.
 * The bullets scope themselves instead: a slash command is an explicit
 * invocation, so its branch is the only one that can apply there.
 */
export const PROJECT_ROOT_GUARD = `**Verificação do projeto:** Estes passos esperam um projeto que já usa o BR-OpenSpec. Antes do primeiro passo que escreve qualquer coisa (\`new change\`, \`archive\`, \`sync specs\` ou a autoria de um arquivo de artifact), confirme que o projeto tem uma raiz: execute \`openspec list --json\` e leia \`root\`. Um objeto root significa que o projeto está configurado. \`"root": null\` significa que não está — não há diretório \`openspec/\` aqui, e uma escrita como \`openspec new change\` criaria um como efeito colateral. O comando também sai com código diferente de zero, e isso é essa resposta, não um CLI quebrado: leia o JSON em vez de tentar de novo ou contornar.

Sem raiz, o que acontece em seguida depende de como este workflow foi alcançado:

- **Selecionado automaticamente**: você escolheu este workflow sozinho, sem o usuário nomear o BR-OpenSpec, nomear esta skill ou executar o slash command dela. Pare de usar o BR-OpenSpec e responda à solicitação normalmente, como faria sem o BR-OpenSpec instalado. Não peça para configurar nada e não mencione a configuração do BR-OpenSpec.
- **Solicitação explícita do BR-OpenSpec**: o usuário nomeou o BR-OpenSpec, nomeou esta skill ou executou o slash command dela. Pare antes de escrever e pergunte como prosseguir: configurar este projeto (\`openspec init\`) ou continuar sem o BR-OpenSpec nesta solicitação. Aguarde a resposta.

Nos dois ramos, nunca crie a raiz como efeito colateral: não execute \`openspec init\` até o usuário pedir, não crie arquivos \`openspec/\` à mão e não deixe um comando criá-la.`;

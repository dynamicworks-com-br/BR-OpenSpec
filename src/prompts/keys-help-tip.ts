import chalk from 'chalk';
import { PROMPT_MESSAGES } from '../messages/index.js';

/**
 * Rótulos de tecla que o @inquirer/{checkbox,select} v5 envia para
 * `theme.style.keysHelpTip`. Teclas ausentes do mapa (`↑↓`, `a`, `i`, `⏎`…)
 * passam sem tradução.
 */
const KEY_LABELS: Record<string, string> = {
  space: PROMPT_MESSAGES.keySpace,
};

/**
 * Rótulos de ação enviados junto com cada tecla. Ações desconhecidas passam
 * sem tradução. `navigate`, `select` e `submit` reaproveitam as chaves já
 * usadas pelo prompt de seleção múltipla do fork, para que a tecla espaço
 * continue descrita como `alternar` em todas as telas.
 */
const ACTION_LABELS: Record<string, string> = {
  navigate: PROMPT_MESSAGES.navigate,
  select: PROMPT_MESSAGES.toggle,
  all: PROMPT_MESSAGES.keyActionAll,
  invert: PROMPT_MESSAGES.keyActionInvert,
  submit: PROMPT_MESSAGES.confirm,
};

/**
 * Dica de teclas em PT-BR para os prompts do inquirer.
 *
 * Substitui a opção `instructions`, removida no @inquirer/checkbox v5: a dica
 * embutida (`theme.style.keysHelpTip`) cobre o mesmo conteúdo, mas em inglês.
 * Reproduz o formato padrão (`tecla` em negrito, ação esmaecida, separados por
 * ` • `) traduzindo apenas os rótulos conhecidos.
 */
export function ptBrKeysHelpTip(keys: [key: string, action: string][]): string {
  return keys
    .map(
      ([key, action]) =>
        `${chalk.bold(KEY_LABELS[key] ?? key)} ${chalk.dim(ACTION_LABELS[action] ?? action)}`
    )
    .join(chalk.dim(' • '));
}

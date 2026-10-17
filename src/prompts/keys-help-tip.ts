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
 * sem tradução. `navigate` e `submit` reaproveitam as chaves já usadas pelo
 * prompt de seleção múltipla do fork.
 */
const ACTION_LABELS: Record<string, string> = {
  navigate: PROMPT_MESSAGES.navigate,
  all: PROMPT_MESSAGES.keyActionAll,
  invert: PROMPT_MESSAGES.keyActionInvert,
  submit: PROMPT_MESSAGES.confirm,
};

/**
 * A ação `select` significa coisas diferentes conforme a tecla que a acompanha:
 * o checkbox envia `['space','select']` (espaço alterna a marcação) e o select
 * e o search enviam `['⏎','select']` (Enter confirma a escolha). Um rótulo
 * único para as duas descreveria uma delas errado, então a desambiguação é
 * feita pelo par (tecla, ação).
 */
const ACTION_LABELS_BY_KEY: Record<string, Record<string, string>> = {
  space: { select: PROMPT_MESSAGES.toggle },
  '⏎': { select: PROMPT_MESSAGES.confirm },
};

function resolveActionLabel(key: string, action: string): string {
  return ACTION_LABELS_BY_KEY[key]?.[action] ?? ACTION_LABELS[action] ?? action;
}

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
        `${chalk.bold(KEY_LABELS[key] ?? key)} ${chalk.dim(resolveActionLabel(key, action))}`
    )
    .join(chalk.dim(' • '));
}

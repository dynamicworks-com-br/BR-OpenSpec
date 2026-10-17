import { ID_MESSAGES } from '../messages/index.js';

/**
 * Gramática de nome seguro para diretório. Retorna a descrição do problema,
 * ou null quando o valor é válido.
 *
 * Mantido mínimo de propósito: a gramática kebab de ids (stores/worksets)
 * pertence ao subsistema de stores, ainda não portado para o fork.
 */
export function folderStyleNameProblem(
  value: string,
  label: string
): string | null {
  if (value.length === 0) {
    return ID_MESSAGES.mustNotBeEmpty(label);
  }

  if (value === '.' || value === '..') {
    return ID_MESSAGES.mustNotBe(label, value);
  }

  if (/[\\/]/u.test(value)) {
    return ID_MESSAGES.mustNotContainPathSeparators(label);
  }

  return null;
}

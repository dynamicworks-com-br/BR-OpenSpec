/**
 * Resolução confinada de caminhos de comando gerados.
 *
 * Nenhum adapter registrado produz caminho absoluto (o adapter do Codex, que
 * escrevia prompts globais em `<CODEX_HOME>/prompts/`, foi aposentado quando o
 * Codex passou a ser somente skills), então todo caminho é resolvido dentro da
 * raiz do projeto pela guarda canônica.
 *
 * O wrapper continua recebendo o adapter para manter a assinatura estável nos
 * chamadores caso alguma ferramenta volte a declarar uma raiz global.
 */

import { FileSystemUtils } from '../../utils/file-system.js';
import type { ToolCommandAdapter } from './types.js';

export function resolveCommandArtifactPath(
  projectPath: string,
  _adapter: ToolCommandAdapter,
  commandPath: string
): string {
  return FileSystemUtils.resolveProjectArtifactPath(projectPath, commandPath);
}

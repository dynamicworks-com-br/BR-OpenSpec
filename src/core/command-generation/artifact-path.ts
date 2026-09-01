/**
 * Resolução confinada de caminhos de comando gerados.
 *
 * Extensão do fork: no upstream, nenhum adapter produz caminho absoluto e
 * `FileSystemUtils.resolveProjectArtifactPath` recusa qualquer um. No fork, o
 * adapter do Codex escreve prompts globais em `<CODEX_HOME>/prompts/`; esses
 * caminhos são confinados à raiz declarada pelo adapter (`getArtifactRoot`),
 * com a mesma guarda canônica (links para fora são recusados).
 */

import path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import type { ToolCommandAdapter } from './types.js';

export function resolveCommandArtifactPath(
  projectPath: string,
  adapter: ToolCommandAdapter,
  commandPath: string
): string {
  if (path.isAbsolute(commandPath)) {
    const globalRoot = adapter.getArtifactRoot?.();
    if (globalRoot) {
      FileSystemUtils.assertPathWithin(globalRoot, commandPath);
      return commandPath;
    }
  }

  return FileSystemUtils.resolveProjectArtifactPath(projectPath, commandPath);
}

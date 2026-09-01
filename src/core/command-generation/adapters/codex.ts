/**
 * Codex Command Adapter
 *
 * Formats commands for Codex following its frontmatter specification.
 * Codex custom prompts live in the global home directory (~/.codex/prompts/)
 * and are not shared through the repository. The CODEX_HOME env var can
 * override the default ~/.codex location.
 */

import os from 'os';
import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Returns the Codex home directory.
 * Respects the CODEX_HOME env var, defaulting to ~/.codex.
 */
function getCodexHome(): string {
  const envHome = process.env.CODEX_HOME?.trim();
  return path.resolve(envHome ? envHome : path.join(os.homedir(), '.codex'));
}

/**
 * Codex adapter for command generation.
 * File path: <CODEX_HOME>/prompts/opsx-<id>.md (absolute, global)
 * Frontmatter: description, argument-hint
 */
export const codexAdapter: ToolCommandAdapter = {
  toolId: 'codex',

  getFilePath(commandId: string): string {
    return path.join(getCodexHome(), 'prompts', `opsx-${commandId}.md`);
  },

  /**
   * Os prompts do Codex são globais: a raiz de confiança é `<CODEX_HOME>/prompts`,
   * nunca o projeto.
   */
  getArtifactRoot(): string {
    return path.join(getCodexHome(), 'prompts');
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: command arguments
---

${content.body}
`;
  },
};

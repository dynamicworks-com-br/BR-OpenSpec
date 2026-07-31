/**
 * Qwen Code Command Adapter
 *
 * Formats commands for Qwen Code following its TOML specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../utils/command-references.js';

/**
 * Qwen adapter for command generation.
 * File path: .qwen/commands/opsx-<id>.toml
 * Format: TOML with description and prompt fields
 */
export const qwenAdapter: ToolCommandAdapter = {
  toolId: 'qwen',

  getFilePath(commandId: string): string {
    return path.join('.qwen', 'commands', `opsx-${commandId}.toml`);
  },

  formatFile(content: CommandContent): string {
    // Comandos Qwen são invocados pelo nome do arquivo (/opsx-<id>), então as
    // referências cruzadas também devem usar a forma com hífen.
    const transformedBody = transformToHyphenCommands(content.body);

    return `description = "${content.description}"

prompt = """
${transformedBody}
"""
`;
  },
};

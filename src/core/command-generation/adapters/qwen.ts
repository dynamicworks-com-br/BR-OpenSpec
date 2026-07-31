/**
 * Qwen Code Command Adapter
 *
 * Formats commands for Qwen Code following its TOML specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Qwen adapter for command generation.
 * File path: .qwen/commands/opsx-<id>.toml
 * Format: TOML with description and prompt fields
 *
 * Qwen commands are invoked by filename (/opsx-<id>), so generateCommand
 * rewrites the body's command references to the hyphen form before this
 * adapter formats it.
 */
export const qwenAdapter: ToolCommandAdapter = {
  toolId: 'qwen',

  getFilePath(commandId: string): string {
    return path.join('.qwen', 'commands', `opsx-${commandId}.toml`);
  },

  formatFile(content: CommandContent): string {
    return `description = "${content.description}"

prompt = """
${content.body}
"""
`;
  },
};

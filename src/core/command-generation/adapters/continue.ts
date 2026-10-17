/**
 * Continue Command Adapter
 *
 * Formats commands for Continue following its .prompt specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';
import { COMMAND_ADAPTER_MESSAGES } from '../../../messages/index.js';

/**
 * Continue adapter for command generation.
 * File path: .continue/prompts/opsx-<id>.prompt
 * Frontmatter: name, description, invokable
 */
export const continueAdapter: ToolCommandAdapter = {
  toolId: 'continue',

  getFilePath(commandId: string): string {
    return path.join('.continue', 'prompts', `opsx-${commandId}.prompt`);
  },

  formatFile(content: CommandContent): string {
    // Continue injects an invoked prompt into the model context. Smaller local
    // models can otherwise mistake the workflow name for a tool to call (#925).
    return `---
name: ${escapeYamlValue(`opsx-${content.id}`)}
description: ${escapeYamlValue(content.description)}
invokable: true
---

${COMMAND_ADAPTER_MESSAGES.continueWorkflowAlreadyActive}

${content.body}
`;
  },
};

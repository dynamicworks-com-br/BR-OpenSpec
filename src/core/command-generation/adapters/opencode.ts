/**
 * OpenCode Command Adapter
 *
 * Formats commands for OpenCode following its frontmatter specification.
 *
 * BR-OpenSpec: workflow bodies are authored in PT-BR, so the input contract
 * line is `**Entrada**:` (upstream: `**Input**:`), the input-free workflow
 * declares `Nenhuma necessária` (upstream: `None required`) and the injected
 * label comes from the message catalog. The English forms are tolerated so a
 * hand-authored English body still receives arguments.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';
import { COMMAND_ADAPTER_MESSAGES } from '../../../messages/index.js';

const OPENCODE_INPUT_BLOCK =
  /^\*\*(?:Entrada|Input)\*\*:[^\r\n]*(?:\r?\n(?!\r?\n)[^\r\n]*)*/m;
const OPENCODE_NO_INPUT =
  /^\*\*(?:Entrada|Input)\*\*:\s*(?:Nenhuma necessária|None required)\b/im;
const OPENCODE_ARGUMENT_PLACEHOLDER = /\$(?:ARGUMENTS\b|[1-9]\d*\b)/;

function injectOpenCodeArgs(body: string): string {
  if (OPENCODE_ARGUMENT_PLACEHOLDER.test(body) || OPENCODE_NO_INPUT.test(body)) {
    return body;
  }

  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  return body.replace(
    OPENCODE_INPUT_BLOCK,
    (input) => `${input}${eol}${COMMAND_ADAPTER_MESSAGES.providedArguments('$ARGUMENTS')}`
  );
}

/**
 * OpenCode adapter for command generation.
 * File path: .opencode/commands/opsx-<id>.md
 * Frontmatter: description. $ARGUMENTS is injected after the complete input
 * contract because OpenCode only passes arguments through explicit placeholders.
 */
export const opencodeAdapter: ToolCommandAdapter = {
  toolId: 'opencode',

  getFilePath(commandId: string): string {
    return path.join('.opencode', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${injectOpenCodeArgs(content.body)}
`;
  },
};

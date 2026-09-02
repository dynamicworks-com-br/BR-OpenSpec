/**
 * Command Code Command Adapter
 *
 * Command Code reads custom slash commands from `.commandcode/commands/`. The
 * command name is the markdown filename without its `.md` extension, so
 * `opsx-<id>.md` registers `/opsx-<id>` — the same flat naming Cursor and
 * OpenCode use. See https://commandcode.ai/docs/reference/slash-commands.
 *
 * BR-OpenSpec: workflow bodies are authored in PT-BR, so the input contract
 * line is `**Entrada**:` (upstream: `**Input**:`) and the injected label comes
 * from the message catalog. `Input` is tolerated so a hand-authored English
 * body still receives arguments.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { COMMAND_ADAPTER_MESSAGES } from '../../../messages/index.js';

const COMMAND_CODE_INPUT_HEADING = /^\*\*(?:Entrada|Input)\*\*:[^\n]*$/m;
const COMMAND_CODE_PROVIDED_ARGS =
  /^\*\*(?:Argumentos fornecidos|Provided arguments)\*\*:\s*(?:\$(?:ARGUMENTS|@)|\$\{(?:ARGUMENTS|@)\})\s*$/m;

function injectCommandCodeArgs(body: string): string {
  if (COMMAND_CODE_PROVIDED_ARGS.test(body)) {
    return body;
  }

  return body.replace(
    COMMAND_CODE_INPUT_HEADING,
    (heading) => `${heading}\n${COMMAND_ADAPTER_MESSAGES.providedArguments('$ARGUMENTS')}`
  );
}

/**
 * Command Code adapter for command generation.
 * File path: .commandcode/commands/opsx-<id>.md
 * Format: plain Markdown with $ARGUMENTS injected after the input contract
 *
 * Command Code executes the full trimmed file body and substitutes invocation
 * arguments only where the body includes one of its argument placeholders.
 */
export const commandCodeAdapter: ToolCommandAdapter = {
  toolId: 'command-code',

  getFilePath(commandId: string): string {
    return path.join('.commandcode', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `${injectCommandCodeArgs(content.body)}\n`;
  },
};

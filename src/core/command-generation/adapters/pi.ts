/**
 * Pi Command Adapter
 *
 * Formats commands for Pi (pi.dev) following its prompt template specification.
 * Pi prompt templates live in .pi/prompts/*.md with description frontmatter.
 *
 * BR-OpenSpec: workflow bodies are authored in PT-BR, so the input contract
 * line is `**Entrada**:` (upstream: `**Input**:`) and the injected label comes
 * from the message catalog. `Input` is tolerated so a hand-authored English
 * body still receives arguments.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';
import { COMMAND_ADAPTER_MESSAGES } from '../../../messages/index.js';

const PI_INPUT_HEADING = /^\*\*(?:Entrada|Input)\*\*:[^\n]*$/m;

function injectPiArgs(body: string): string {
  if (body.includes('$@') || body.includes('$ARGUMENTS')) {
    return body;
  }

  return body.replace(
    PI_INPUT_HEADING,
    (heading) => `${heading}\n${COMMAND_ADAPTER_MESSAGES.providedArguments('$@')}`
  );
}

/**
 * Pi adapter for prompt template generation.
 * File path: .pi/prompts/opsx-<id>.md
 * Frontmatter: description
 *
 * Pi uses the filename (minus .md) as the slash command name, so
 * opsx-propose.md → /opsx-propose. generateCommand rewrites the body's
 * command references to that form before this adapter formats it.
 */
export const piAdapter: ToolCommandAdapter = {
  toolId: 'pi',

  getFilePath(commandId: string): string {
    return path.join('.pi', 'prompts', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${injectPiArgs(content.body)}
`;
  },
};

import { describe, it, expect } from 'vitest';
import { Command, Option } from 'commander';

import { isJsonRun } from '../../src/cli/index.js';

/**
 * Reproduce the three ways `--json` reaches a command in the real CLI, so a
 * future refactor of the telemetry-notice guard can't silently reintroduce
 * first-run stdout pollution for `store --json` / `workset --json <sub>`.
 *
 * `store` and `workset` are upstream-only forms (the stores/workset subsystem
 * is still deferred in this fork). The synthetic program below models them so
 * the guard already covers those shapes when they land.
 */
function buildProgram(capture: (command: Command) => void): Command {
  const program = new Command();
  program.name('openspec').exitOverride();
  program.configureOutput({ writeOut: () => {}, writeErr: () => {} });
  program.option('--no-color', 'Disable color output');
  program.hook('preAction', (_thisCommand, actionCommand) => {
    capture(actionCommand);
  });

  // 1. Leaf declares --json (e.g. `openspec status --json`).
  program
    .command('status')
    .option('--json', 'Output as JSON')
    .action(() => {});

  // 2. Permissive bare group that never declares --json and detects it from
  //    residual args (upstream's `openspec store --json`; not in this fork yet).
  const store = program.command('store');
  store.allowExcessArguments(true);
  store.allowUnknownOption(true);
  store.action(() => {});

  // 3. Parent group declares --json (read via optsWithGlobals) with its own
  //    subcommands (upstream's `openspec workset --json list`; not in this fork
  //    yet).
  const workset = program.command('workset');
  workset.addOption(new Option('--json', 'Output as JSON').hideHelp());
  workset
    .command('list')
    .option('--json', 'Output as JSON')
    .action(() => {});

  return program;
}

describe('isJsonRun', () => {
  async function actionCommandFor(argv: string[]): Promise<Command> {
    let captured: Command | undefined;
    const program = buildProgram((command) => {
      captured = command;
    });
    await program.parseAsync(['node', 'openspec', ...argv]);
    if (!captured) throw new Error(`no action command captured for: ${argv.join(' ')}`);
    return captured;
  }

  it('detects --json declared on the leaf command', async () => {
    expect(isJsonRun(await actionCommandFor(['status', '--json']))).toBe(true);
  });

  it('detects --json as a residual arg on a permissive bare group', async () => {
    expect(isJsonRun(await actionCommandFor(['store', '--json']))).toBe(true);
  });

  it('detects --json on a parent group placed before the subcommand', async () => {
    expect(isJsonRun(await actionCommandFor(['workset', '--json', 'list']))).toBe(true);
  });

  it('detects --json declared on the subcommand leaf', async () => {
    expect(isJsonRun(await actionCommandFor(['workset', 'list', '--json']))).toBe(true);
  });

  it('is false when no --json is present', async () => {
    expect(isJsonRun(await actionCommandFor(['status']))).toBe(false);
  });

  it('is false for a bare group with unrelated residual args', async () => {
    expect(isJsonRun(await actionCommandFor(['store', 'bogus']))).toBe(false);
  });
});

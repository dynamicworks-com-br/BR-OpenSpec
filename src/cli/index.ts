import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { AI_TOOLS, TOOL_ID_ALIASES } from '../core/config.js';
import { CLI_DESCRIPTIONS, CLI_MESSAGES, CONFIG_MESSAGES } from '../messages/index.js';
import { UpdateCommand } from '../core/update.js';
import {
  getAvailableCliUpdate,
  displayCliUpdateNote,
  shouldOfferUpgrade,
  getInstallDir,
  offerCliUpgrade,
  rerunUpdateWithUpgradedCli,
  displayUpgradeCommand,
  isSourceCheckout,
} from '../core/version-check.js';
import { isInteractive } from '../utils/interactive.js';
import { ListCommand } from '../core/list.js';
import { ArchiveCommand } from '../core/archive.js';
import { ViewCommand } from '../core/view.js';
import { registerSpecCommand } from '../commands/spec.js';
import { ChangeCommand } from '../commands/change.js';
import { ValidateCommand } from '../commands/validate.js';
import { ShowCommand } from '../commands/show.js';
import { CompletionCommand } from '../commands/completion.js';
import { FeedbackCommand } from '../commands/feedback.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerSchemaCommand } from '../commands/schema.js';
import { registerToolsCommand } from '../commands/tools.js';
import {
  statusCommand,
  instructionsCommand,
  applyInstructionsCommand,
  archiveInstructionsCommand,
  templatesCommand,
  schemasCommand,
  newChangeCommand,
  DEFAULT_SCHEMA,
  type StatusOptions,
  type InstructionsOptions,
  type TemplatesOptions,
  type SchemasOptions,
  type NewChangeOptions,
} from '../commands/workflow/index.js';
import { maybeShowTelemetryNotice, trackCommand, shutdown } from '../telemetry/index.js';
import { maybeShowCompletionTip } from '../core/completion-tip.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
export function getCommandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;

  while (current) {
    const name = current.name();
    // Skip the root 'openspec' command
    if (name && name !== 'openspec') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'openspec';
}

/**
 * True when the executing command asked for JSON output — used to suppress the
 * first-run telemetry notice so stdout stays a single valid JSON document.
 *
 * `--json` reaches commands three ways, so a single parsed option is not enough:
 * - declared on the leaf (`openspec status --json`) → `opts().json`
 * - declared on a parent group and read via globals (upstream's
 *   `openspec workset --json list`) → `optsWithGlobals().json`
 * - a residual arg on a permissive group that never declares the option
 *   (upstream's `openspec store --json`) → `args`
 *
 * This fork does not expose `store`/`workset` yet (stores/workset are still
 * deferred); the last two branches are kept for parity so the guard already
 * covers those permissive groups when they land.
 *
 * Suppressing is always safe: the disclosure is only deferred to the next
 * non-JSON run, never lost, whereas printing it on a JSON run corrupts stdout.
 */
export function isJsonRun(command: Command): boolean {
  return (
    command.optsWithGlobals().json === true ||
    command.args.includes('--json')
  );
}

/**
 * True for the commands that exist to serve shell completions: the user-facing
 * `openspec completion ...` group and the hidden `__complete` resolver that
 * generated completion scripts call on every Tab press. Tipping either about
 * completions is noise, and `__complete` would burn the one-shot tip invisibly.
 */
export function isCompletionRun(commandPath: string): boolean {
  return commandPath.split(':')[0] === 'completion' || commandPath === '__complete';
}

/**
 * True when the first-run completions tip must be deferred rather than shown.
 *
 * Deferring keeps the tip unconsumed, so it still reaches the user on a later
 * run that can actually carry it. All three cases are runs nobody would read a
 * hint from: JSON output, the completion machinery itself, and a stderr that is
 * not a terminal — pipes and the agent-driven runs that dominate this CLI's
 * usage would otherwise burn the user's one-shot tip into a log nobody opens.
 */
export function shouldDeferCompletionTip(command: Command, stderrIsTty: boolean): boolean {
  return isJsonRun(command) || isCompletionRun(getCommandPath(command)) || !stderrIsTty;
}

program
  .name('openspec')
  .description(CLI_DESCRIPTIONS.root)
  .version(version);

// Global options
program.option('--no-color', CLI_DESCRIPTIONS.noColor);

// Apply global flags and telemetry before any command runs
// Note: preAction receives (thisCommand, actionCommand) where:
// - thisCommand: the command where hook was added (root program)
// - actionCommand: the command actually being executed (subcommand)
program.hook('preAction', async (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }

  // Show first-run telemetry notice (if not seen). It's written to stderr, so it
  // never pollutes stdout — but --json runs still defer it (see isJsonRun) so the
  // very first invocation stays free of any incidental output on either stream.
  await maybeShowTelemetryNotice({ silent: isJsonRun(actionCommand) });

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);

  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async (_thisCommand, actionCommand) => {
  // Show the first-run shell-completions tip (on stderr, so piped stdout stays
  // clean). postAction, not preAction: the tip trails the command's own output
  // instead of pushing an error message or `init`'s setup summary down the
  // screen. Deferred — not consumed — whenever nobody would read it: JSON runs,
  // `openspec completion ...`, and a stderr that is not a terminal (agents and
  // pipes would otherwise silently burn the user's one-shot tip).
  try {
    await maybeShowCompletionTip({
      silent: shouldDeferCompletionTip(actionCommand, Boolean(process.stderr.isTTY)),
    });
  } finally {
    // The flush runs even if the hint throws: parse() is synchronous, so a
    // rejection here has no catch anywhere above it.
    await shutdown();
  }
});

const availableToolIds = AI_TOOLS
  .filter((tool) => tool.skillsDir || tool.globalSkillsDir)
  .map((tool) => tool.value);
const toolAliasNote = Object.entries(TOOL_ID_ALIASES)
  .map(([retired, current]) => CLI_DESCRIPTIONS.toolAlias(retired, current))
  .join(', ');

program
  .command('init [path]')
  .description(CLI_DESCRIPTIONS.init)
  .option('--tools <tools>', CLI_DESCRIPTIONS.tools(availableToolIds.join(', '), toolAliasNote))
  .option('--language <language>', CLI_DESCRIPTIONS.language)
  .option('--force', CLI_DESCRIPTIONS.force)
  .option('--profile <profile>', CLI_DESCRIPTIONS.profile)
  .option('--no-animation', CLI_DESCRIPTIONS.noAnimation)
  .option('--copilot-cloud', CLI_DESCRIPTIONS.copilotCloud)
  .option('--no-copilot-cloud', CLI_DESCRIPTIONS.noCopilotCloud)
  .action(async (targetPath = '.', options?: { tools?: string; language?: string; force?: boolean; profile?: string; animation?: boolean; copilotCloud?: boolean }) => {
    try {
      // Validate that the path is a valid directory
      const resolvedPath = path.resolve(targetPath);

      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(CLI_MESSAGES.notADirectory(targetPath));
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Directory doesn't exist, but we can create it
          console.log(CLI_MESSAGES.directoryWillBeCreated(targetPath));
        } else if (error.message && error.message.includes('not a directory')) {
          throw error;
        } else {
          throw new Error(CLI_MESSAGES.cannotAccessPath(targetPath, error.message));
        }
      }

      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tools,
        language: options?.language,
        force: options?.force,
        profile: options?.profile,
        animation: options?.animation,
        copilotCloud: options?.copilotCloud,
      });
      await initCommand.execute(targetPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Hidden alias: 'experimental' -> 'init' for backwards compatibility
program
  .command('experimental', { hidden: true })
  .description(CLI_DESCRIPTIONS.experimental)
  .option('--tool <tool-id>', CLI_DESCRIPTIONS.experimentalTool)
  .option('--no-interactive', CLI_DESCRIPTIONS.experimentalNoInteractive)
  .action(async (options?: { tool?: string; noInteractive?: boolean }) => {
    try {
      console.log(CLI_MESSAGES.experimentalDeprecated);
      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tool,
        interactive: options?.noInteractive === true ? false : undefined,
      });
      await initCommand.execute('.');
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description(CLI_DESCRIPTIONS.update)
  .option('--force', CLI_DESCRIPTIONS.updateForce)
  .action(async (targetPath = '.', options?: { force?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const installDir = getInstallDir();
      // Running from a clone: the version is whatever the branch says, so any
      // upgrade advice would be noise. Decided before the request, so a
      // contributor never waits on an answer that gets thrown away.
      const latestVersion = isSourceCheckout(installDir) ? null : await getAvailableCliUpdate();
      const announce = latestVersion !== null;
      // Offer to upgrade first: this process generates files from its own
      // templates, so upgrading afterwards would leave the old ones on disk.
      // Both streams must be a terminal — with stdout redirected the question
      // lands in the file and the user waits at a blank screen forever.
      const canOffer =
        announce &&
        shouldOfferUpgrade({
          installDir,
          projectPath: resolvedPath,
          interactive: isInteractive(),
          stdoutIsTty: Boolean(process.stdout.isTTY),
        });

      let declined = false;
      if (latestVersion && canOffer) {
        displayCliUpdateNote(latestVersion, resolvedPath, { withCommand: false });
        const outcome = await offerCliUpgrade(latestVersion);

        // Set the code and return rather than process.exit: exiting here would
        // skip commander's postAction hook, killing the telemetry flush
        // mid-request.
        if (outcome === 'cancelled') {
          // Ctrl-C means stop the command, not fall through to more prompts.
          process.exitCode = 130;
          return;
        }
        if (outcome === 'upgraded') {
          process.exitCode = await rerunUpdateWithUpgradedCli(resolvedPath, {
            force: options?.force,
          });
          return;
        }
        // Declined, failed, or upgraded-but-unreachable: fall through to the
        // update, then leave the command on screen underneath it.
        declined = true;
      }

      const updateCommand = new UpdateCommand({ force: options?.force });
      await updateCommand.execute(resolvedPath);

      if (declined) {
        // The headline was printed before the prompt; only the manual route is
        // still owed, and it belongs where the user is looking now.
        displayUpgradeCommand(resolvedPath);
      } else if (latestVersion) {
        displayCliUpdateNote(latestVersion, resolvedPath);
      }
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

program
  .command('list')
  .description(CLI_DESCRIPTIONS.list)
  .option('--specs', CLI_DESCRIPTIONS.listSpecs)
  .option('--changes', CLI_DESCRIPTIONS.listChanges)
  .option('--sort <order>', CLI_DESCRIPTIONS.listSort, 'recent')
  .option('--json', CLI_DESCRIPTIONS.listJson)
  .action(async (options?: { specs?: boolean; changes?: boolean; sort?: string; json?: boolean }) => {
    try {
      const listCommand = new ListCommand();
      const mode: 'changes' | 'specs' = options?.specs ? 'specs' : 'changes';
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute('.', mode, { sort, json: options?.json });
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

program
  .command('view')
  .description(CLI_DESCRIPTIONS.view)
  .action(async () => {
    try {
      const viewCommand = new ViewCommand();
      await viewCommand.execute('.');
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Change command with subcommands
const changeCmd = program
  .command('change')
  .description(CLI_DESCRIPTIONS.change);

// Deprecation notice for noun-based commands
changeCmd.hook('preAction', () => {
  console.error(CLI_MESSAGES.changeCommandsDeprecated);
});

changeCmd
  .command('show [change-name]')
  .description(CLI_DESCRIPTIONS.changeShow)
  .option('--json', CLI_DESCRIPTIONS.changeShowJson)
  .option('--deltas-only', CLI_DESCRIPTIONS.changeShowDeltasOnly)
  .option('--requirements-only', CLI_DESCRIPTIONS.changeShowRequirementsOnly)
  .option('--diff', CLI_DESCRIPTIONS.changeShowDiff)
  .option('--no-interactive', CLI_DESCRIPTIONS.changeShowNoInteractive)
  .action(async (changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; diff?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      await changeCommand.show(changeName, options);
    } catch (error) {
      console.error(CLI_MESSAGES.error((error as Error).message));
      process.exitCode = 1;
    }
  });

changeCmd
  .command('list')
  .description(CLI_DESCRIPTIONS.changeList)
  .option('--json', CLI_DESCRIPTIONS.changeListJson)
  .option('--long', CLI_DESCRIPTIONS.changeListLong)
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      console.error(CLI_MESSAGES.changeListDeprecated);
      const changeCommand = new ChangeCommand();
      await changeCommand.list(options);
    } catch (error) {
      console.error(CLI_MESSAGES.error((error as Error).message));
      process.exitCode = 1;
    }
  });

changeCmd
  .command('validate [change-name]')
  .description(CLI_DESCRIPTIONS.changeValidate)
  .option('--strict', CLI_DESCRIPTIONS.changeValidateStrict)
  .option('--json', CLI_DESCRIPTIONS.changeValidateJson)
  .option('--no-interactive', CLI_DESCRIPTIONS.changeValidateNoInteractive)
  .action(async (changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      // validate() already sets process.exitCode, and Node honours it at
      // natural exit. Calling process.exit() here would skip commander's
      // postAction hook — the same trap called out for `update` below — which
      // kills the telemetry flush and the first-run completions tip on what is
      // a routine outcome, not an error: a change that fails validation.
      await changeCommand.validate(changeName, options);
    } catch (error) {
      console.error(CLI_MESSAGES.error((error as Error).message));
      process.exitCode = 1;
    }
  });

program
  .command('archive [change-name]')
  .description(CLI_DESCRIPTIONS.archive)
  .option('-y, --yes', CLI_DESCRIPTIONS.archiveYes)
  .option('--skip-specs', CLI_DESCRIPTIONS.archiveSkipSpecs)
  .option('--no-validate', CLI_DESCRIPTIONS.archiveNoValidate)
  .action(async (changeName?: string, options?: { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean }) => {
    try {
      const archiveCommand = new ArchiveCommand();
      await archiveCommand.execute(changeName, options);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

registerSpecCommand(program);
registerConfigCommand(program);
registerSchemaCommand(program);
registerToolsCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description(CLI_DESCRIPTIONS.validate)
  .option('--all', CLI_DESCRIPTIONS.validateAll)
  .option('--changes', CLI_DESCRIPTIONS.validateChanges)
  .option('--specs', CLI_DESCRIPTIONS.validateSpecs)
  .option('--archived', CLI_DESCRIPTIONS.validateArchived)
  .option('--type <type>', CLI_DESCRIPTIONS.validateType)
  .option('--strict', CLI_DESCRIPTIONS.validateStrict)
  .option('--json', CLI_DESCRIPTIONS.validateJson)
  .option('--concurrency <n>', CLI_DESCRIPTIONS.validateConcurrency)
  .option('--no-interactive', CLI_DESCRIPTIONS.validateNoInteractive)
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; specs?: boolean; archived?: boolean; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string }) => {
    try {
      const validateCommand = new ValidateCommand();
      await validateCommand.execute(itemName, options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Top-level show command
program
  .command('show [item-name]')
  .description(CLI_DESCRIPTIONS.show)
  .option('--json', CLI_DESCRIPTIONS.showJson)
  .option('--type <type>', CLI_DESCRIPTIONS.showType)
  .option('--no-interactive', CLI_DESCRIPTIONS.showNoInteractive)
  // change-only flags
  .option('--deltas-only', CLI_DESCRIPTIONS.showDeltasOnly)
  .option('--requirements-only', CLI_DESCRIPTIONS.showRequirementsOnly)
  .option('--diff', CLI_DESCRIPTIONS.showDiff)
  // spec-only flags
  .option('--requirements', CLI_DESCRIPTIONS.showRequirements)
  .option('--no-scenarios', CLI_DESCRIPTIONS.showNoScenarios)
  .option('-r, --requirement <id>', CLI_DESCRIPTIONS.showRequirement)
  // allow unknown options to pass-through to underlying command implementation
  .allowUnknownOption(true)
  .action(async (itemName?: string, options?: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: any }) => {
    try {
      const showCommand = new ShowCommand();
      await showCommand.execute(itemName, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Feedback command
program
  .command('feedback <message>')
  .description(CLI_DESCRIPTIONS.feedback)
  .option('--body <text>', CLI_DESCRIPTIONS.feedbackBody)
  .action(async (message: string, options?: { body?: string }) => {
    try {
      const feedbackCommand = new FeedbackCommand();
      await feedbackCommand.execute(message, options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion')
  .description(CLI_DESCRIPTIONS.completion);

completionCmd
  .command('generate [shell]')
  .description(CLI_DESCRIPTIONS.completionGenerate)
  .action(async (shell?: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.generate({ shell });
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

completionCmd
  .command('install [shell]')
  .description(CLI_DESCRIPTIONS.completionInstall)
  .option('--verbose', CLI_DESCRIPTIONS.completionVerbose)
  .action(async (shell?: string, options?: { verbose?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.install({ shell, verbose: options?.verbose });
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall [shell]')
  .description(CLI_DESCRIPTIONS.completionUninstall)
  .option('-y, --yes', CONFIG_MESSAGES.skipConfirmationOption)
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Hidden command for machine-readable completion data
program
  .command('__complete <type>', { hidden: true })
  .description(CLI_DESCRIPTIONS.__complete)
  .action(async (type: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.complete({ type });
    } catch (error) {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  });

// ═══════════════════════════════════════════════════════════
// Workflow Commands (formerly experimental)
// ═══════════════════════════════════════════════════════════

// Status command
program
  .command('status')
  .description(CLI_DESCRIPTIONS.status)
  .option('--change <id>', CLI_DESCRIPTIONS.statusChange)
  .option('--all', CLI_DESCRIPTIONS.statusAll)
  .option('--schema <name>', CLI_DESCRIPTIONS.statusSchema)
  .option('--json', CLI_DESCRIPTIONS.statusJson)
  .action(async (options: StatusOptions) => {
    try {
      await statusCommand(options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Instructions command
program
  .command('instructions [artifact]')
  .description(CLI_DESCRIPTIONS.instructions)
  .option('--change <id>', CLI_DESCRIPTIONS.instructionsChange)
  .option('--schema <name>', CLI_DESCRIPTIONS.instructionsSchema)
  .option('--json', CLI_DESCRIPTIONS.instructionsJson)
  .action(async (artifactId: string | undefined, options: InstructionsOptions) => {
    try {
      // Superfícies de instrução de workflow são ramos reservados do comando, não artefatos.
      if (artifactId === 'apply') {
        await applyInstructionsCommand(options);
      } else if (artifactId === 'archive') {
        await archiveInstructionsCommand(options);
      } else {
        await instructionsCommand(artifactId, options);
      }
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description(CLI_DESCRIPTIONS.templates)
  .option('--schema <name>', CLI_DESCRIPTIONS.templatesSchema(DEFAULT_SCHEMA))
  .option('--json', CLI_DESCRIPTIONS.templatesJson)
  .action(async (options: TemplatesOptions) => {
    try {
      await templatesCommand(options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// Schemas command
program
  .command('schemas')
  .description(CLI_DESCRIPTIONS.schemas)
  .option('--json', CLI_DESCRIPTIONS.schemasJson)
  .action(async (options: SchemasOptions) => {
    try {
      await schemasCommand(options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

// New command group with change subcommand
const newCmd = program.command('new').description(CLI_DESCRIPTIONS.new);

newCmd
  .command('change <name>')
  .description(CLI_DESCRIPTIONS.newChange)
  .option('--description <text>', CLI_DESCRIPTIONS.newChangeDescription)
  .option('--schema <name>', CLI_DESCRIPTIONS.newChangeSchema(DEFAULT_SCHEMA))
  .action(async (name: string, options: NewChangeOptions) => {
    try {
      await newChangeCommand(name, options);
    } catch (error) {
      console.log();
      ora().fail(CLI_MESSAGES.error((error as Error).message));
      process.exit(1);
    }
  });

export { program };

export function runCli(argv = process.argv): void {
  program.parse(argv);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}

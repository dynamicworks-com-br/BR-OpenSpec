import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS } from '../core/config.js';
import { CLI_DESCRIPTIONS, CLI_MESSAGES, CONFIG_MESSAGES } from '../messages/index.js';
import { UpdateCommand } from '../core/update.js';
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

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
function getCommandPath(command: Command): string {
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

  // Show first-run telemetry notice (if not seen)
  await maybeShowTelemetryNotice();

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);
  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async () => {
  await shutdown();
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);

program
  .command('init [path]')
  .description(CLI_DESCRIPTIONS.init)
  .option('--tools <tools>', CLI_DESCRIPTIONS.tools(availableToolIds.join(', ')))
  .option('--force', CLI_DESCRIPTIONS.force)
  .option('--profile <profile>', CLI_DESCRIPTIONS.profile)
  .action(async (targetPath = '.', options?: { tools?: string; force?: boolean; profile?: string }) => {
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
        force: options?.force,
        profile: options?.profile,
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
      const updateCommand = new UpdateCommand({ force: options?.force });
      await updateCommand.execute(resolvedPath);
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
  .option('--no-interactive', CLI_DESCRIPTIONS.changeShowNoInteractive)
  .action(async (changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; noInteractive?: boolean }) => {
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
      await changeCommand.validate(changeName, options);
      if (typeof process.exitCode === 'number' && process.exitCode !== 0) {
        process.exit(process.exitCode);
      }
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
  .option('--type <type>', CLI_DESCRIPTIONS.validateType)
  .option('--strict', CLI_DESCRIPTIONS.validateStrict)
  .option('--json', CLI_DESCRIPTIONS.validateJson)
  .option('--concurrency <n>', CLI_DESCRIPTIONS.validateConcurrency)
  .option('--no-interactive', CLI_DESCRIPTIONS.validateNoInteractive)
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; specs?: boolean; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string }) => {
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
      // Special case: "apply" is not an artifact, but a command to get apply instructions
      if (artifactId === 'apply') {
        await applyInstructionsCommand(options);
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

program.parse();

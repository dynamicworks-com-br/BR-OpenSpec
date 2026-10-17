import type { ChildProcess, spawn as nodeSpawn } from 'node:child_process';
import type { Command } from 'commander';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  isConfigRootObject,
  isGlobalConfigUnreadable,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
import type { Profile, Delivery } from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  hasUnsafeKeySegment,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { CORE_WORKFLOWS, ALL_WORKFLOWS, getProfileWorkflows } from '../core/profiles.js';
import { OPENSPEC_DIR_NAME } from '../core/config.js';
import { CONFIG_MESSAGES, CLI_MESSAGES } from '../messages/index.js';
import { ptBrKeysHelpTip } from '../prompts/keys-help-tip.js';

type EditorOutcome =
  | { code: number | null; signal: NodeJS.Signals | null }
  | { error: Error };

// cross-spawn finds `.cmd` shims such as `code.cmd` on Windows and escapes each
// argument for cmd.exe; elsewhere it is plain spawn. Loaded lazily so other
// commands skip its module graph.
let cachedSpawn: typeof nodeSpawn | undefined;
function loadSpawn(): typeof nodeSpawn {
  if (cachedSpawn === undefined) {
    cachedSpawn = createRequire(import.meta.url)('cross-spawn') as typeof nodeSpawn;
  }
  return cachedSpawn;
}

/**
 * Splits an EDITOR or VISUAL value into a program and its arguments without
 * running a shell, so `;`, `|`, `$VAR`, `~` and backticks are plain characters.
 * Double quotes group words. On POSIX, single quotes group words too and a
 * backslash escapes the next character (inside double quotes only `"` and `\`).
 * On Windows a backslash is a path separator and a single quote is a plain
 * character. Returns null when a quote is left open.
 */
export function splitEditorCommand(value: string, platform: NodeJS.Platform = process.platform): string[] | null {
  const posix = platform !== 'win32';
  const words: string[] = [];
  let word = '';
  let inWord = false;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else word += ch;
      continue;
    }
    if (posix && ch === '\\' && i + 1 < value.length) {
      const next = value[i + 1];
      if (quote === '"' && next !== '"' && next !== '\\') {
        word += ch;
      } else {
        word += next;
        i++;
      }
      inWord = true;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else word += ch;
      continue;
    }
    if (ch === '"' || (posix && ch === "'")) {
      quote = ch;
      inWord = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (inWord) words.push(word);
      word = '';
      inWord = false;
      continue;
    }
    word += ch;
    inWord = true;
  }

  if (quote) return null;
  if (inWord) words.push(word);
  return words;
}

/**
 * Starts the user's editor on `filePath`, never through a shell.
 *
 * EDITOR and VISUAL hold a command line, not a program name: `code --wait`
 * and `"/path with spaces/subl" -w` are both ordinary values, so the value is
 * split into words and the file path is appended as its own argument. A value
 * that is itself the absolute path of an existing file is run as-is, so an
 * unquoted editor path with spaces keeps working.
 */
function spawnEditor(editor: string, filePath: string): ChildProcess {
  const words = path.isAbsolute(editor) && fs.existsSync(editor) ? [editor] : splitEditorCommand(editor);
  if (words === null) {
    throw new Error(CONFIG_MESSAGES.editorUnterminatedQuote);
  }
  if (words.length === 0) {
    throw new Error(CONFIG_MESSAGES.editorValueBlank);
  }
  const [program, ...args] = words;
  return loadSpawn()(program, [...args, filePath], { stdio: 'inherit', shell: false });
}

/** Runs the editor on `filePath` and resolves once it has closed or failed to start. */
function runEditor(editor: string, filePath: string): Promise<EditorOutcome> {
  return new Promise((resolve) => {
    try {
      const child = spawnEditor(editor, filePath);
      child.once('error', (error) => resolve({ error }));
      child.once('close', (code, signal) => resolve({ code, signal }));
    } catch (error) {
      resolve({ error: error instanceof Error ? error : new Error(String(error)) });
    }
  });
}

function reportEditorFailure(editor: string, outcome: EditorOutcome): void {
  if ('error' in outcome) {
    console.error(CONFIG_MESSAGES.editorCouldNotStart(editor, outcome.error.message));
  } else if (outcome.signal) {
    console.error(CONFIG_MESSAGES.editorTerminatedBySignal(editor, outcome.signal));
  } else {
    console.error(CONFIG_MESSAGES.editorExitedWithCode(editor, outcome.code));
  }
  // Only a missing program earns the hint: EACCES or EPERM means it exists.
  if ('error' in outcome && (outcome.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.error(CONFIG_MESSAGES.editorSetInstalledExample);
  }
}

type ProfileAction = 'both' | 'delivery' | 'workflows' | 'keep';

/**
 * A config file that exists but cannot be parsed is still the user's file:
 * getGlobalConfig() reads it as defaults, and saving those back would erase
 * every setting in it. Reports the fix instead, and returns true when it did.
 */
function refuseUnreadableConfig(): boolean {
  if (!isGlobalConfigUnreadable()) {
    return false;
  }
  console.error(CONFIG_MESSAGES.configUnreadableLeftUnchanged(getGlobalConfigPath()));
  console.error(CONFIG_MESSAGES.configUnreadableFix);
  process.exitCode = 1;
  return true;
}

interface ProfileState {
  profile: Profile;
  delivery: Delivery;
  workflows: string[];
}

interface ProfileStateDiff {
  hasChanges: boolean;
  lines: string[];
}

interface WorkflowPromptMeta {
  name: string;
  description: string;
}

export const WORKFLOW_PROMPT_META: Record<string, WorkflowPromptMeta> = {
  propose: {
    name: CONFIG_MESSAGES.workflowProposeName,
    description: CONFIG_MESSAGES.workflowProposeDesc,
  },
  explore: {
    name: CONFIG_MESSAGES.workflowExploreName,
    description: CONFIG_MESSAGES.workflowExploreDesc,
  },
  new: {
    name: CONFIG_MESSAGES.workflowNewName,
    description: CONFIG_MESSAGES.workflowNewDesc,
  },
  continue: {
    name: CONFIG_MESSAGES.workflowContinueName,
    description: CONFIG_MESSAGES.workflowContinueDesc,
  },
  apply: {
    name: CONFIG_MESSAGES.workflowApplyName,
    description: CONFIG_MESSAGES.workflowApplyDesc,
  },
  update: {
    name: CONFIG_MESSAGES.workflowUpdateName,
    description: CONFIG_MESSAGES.workflowUpdateDesc,
  },
  ff: {
    name: CONFIG_MESSAGES.workflowFastForwardName,
    description: CONFIG_MESSAGES.workflowFastForwardDesc,
  },
  sync: {
    name: CONFIG_MESSAGES.workflowSyncName,
    description: CONFIG_MESSAGES.workflowSyncDesc,
  },
  archive: {
    name: CONFIG_MESSAGES.workflowArchiveName,
    description: CONFIG_MESSAGES.workflowArchiveDesc,
  },
  'bulk-archive': {
    name: CONFIG_MESSAGES.workflowBulkArchiveName,
    description: CONFIG_MESSAGES.workflowBulkArchiveDesc,
  },
  verify: {
    name: CONFIG_MESSAGES.workflowVerifyName,
    description: CONFIG_MESSAGES.workflowVerifyDesc,
  },
  'code-review': {
    name: CONFIG_MESSAGES.workflowCodeReviewName,
    description: CONFIG_MESSAGES.workflowCodeReviewDesc,
  },
  onboard: {
    name: CONFIG_MESSAGES.workflowOnboardName,
    description: CONFIG_MESSAGES.workflowOnboardDesc,
  },
};

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.includes('force closed the prompt with SIGINT'))
  );
}

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Resolve the effective current profile state from global config defaults.
 */
export function resolveCurrentProfileState(config: GlobalConfig): ProfileState {
  const profile = config.profile || 'core';
  const delivery = config.delivery || 'both';
  const workflows = [
    ...getProfileWorkflows(profile, config.workflows ? [...config.workflows] : undefined),
  ];
  return { profile, delivery, workflows };
}

/**
 * Derive profile type from selected workflows.
 */
export function deriveProfileFromWorkflowSelection(selectedWorkflows: string[]): Profile {
  const isCoreMatch =
    selectedWorkflows.length === CORE_WORKFLOWS.length &&
    CORE_WORKFLOWS.every((w) => selectedWorkflows.includes(w));
  return isCoreMatch ? 'core' : 'custom';
}

/**
 * Format a compact workflow summary for the profile header.
 */
export function formatWorkflowSummary(workflows: readonly string[], profile: Profile): string {
  return CONFIG_MESSAGES.workflowsSelectedCount(workflows.length, profile);
}

function stableWorkflowOrder(workflows: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const workflow of ALL_WORKFLOWS) {
    if (workflows.includes(workflow) && !seen.has(workflow)) {
      ordered.push(workflow);
      seen.add(workflow);
    }
  }

  const extras = workflows.filter((w) => !ALL_WORKFLOWS.includes(w as (typeof ALL_WORKFLOWS)[number]));
  extras.sort();
  for (const extra of extras) {
    if (!seen.has(extra)) {
      ordered.push(extra);
      seen.add(extra);
    }
  }

  return ordered;
}

/**
 * Build a user-facing diff summary between two profile states.
 */
export function diffProfileState(before: ProfileState, after: ProfileState): ProfileStateDiff {
  const lines: string[] = [];

  if (before.delivery !== after.delivery) {
    lines.push(`delivery: ${before.delivery} -> ${after.delivery}`);
  }

  if (before.profile !== after.profile) {
    lines.push(`profile: ${before.profile} -> ${after.profile}`);
  }

  const beforeOrdered = stableWorkflowOrder(before.workflows);
  const afterOrdered = stableWorkflowOrder(after.workflows);
  const beforeSet = new Set(beforeOrdered);
  const afterSet = new Set(afterOrdered);

  const added = afterOrdered.filter((w) => !beforeSet.has(w));
  const removed = beforeOrdered.filter((w) => !afterSet.has(w));

  if (added.length > 0 || removed.length > 0) {
    const tokens: string[] = [];
    if (added.length > 0) {
      tokens.push(CONFIG_MESSAGES.workflowsAdded(added.join(', ')));
    }
    if (removed.length > 0) {
      tokens.push(CONFIG_MESSAGES.workflowsRemoved(removed.join(', ')));
    }
    lines.push(CONFIG_MESSAGES.workflowsDiffLabel(tokens.join('; ')));
  }

  return {
    hasChanges: lines.length > 0,
    lines,
  };
}

async function maybeWarnProjectConfigDrift(
  projectDir: string,
  state: ProfileState,
  colorize: (message: string) => string
): Promise<void> {
  const openspecDir = path.join(projectDir, OPENSPEC_DIR_NAME);
  if (!fs.existsSync(openspecDir)) {
    return;
  }
  // Loaded here, not at the top: it pulls in every tool's command adapter,
  // which `config path` and `config list` never need.
  const { hasProjectConfigDrift } = await import('../core/profile-sync-drift.js');
  if (!hasProjectConfigDrift(projectDir, state.workflows, state.delivery)) {
    return;
  }
  console.log(colorize(CONFIG_MESSAGES.warningGlobalConfigNotApplied));
}

function printConfigProfileApplyGuidance(): void {
  console.log(CONFIG_MESSAGES.configUpdated);
}

export function configPathCommand(): void {
  console.log(getGlobalConfigPath());
}

export function configListCommand(options: { json?: boolean }): void {
  const config = getGlobalConfig();

  if (options.json) {
    console.log(JSON.stringify(config, null, 2));
  } else {
    // Read raw config to determine which values are explicit vs defaults
    const configPath = getGlobalConfigPath();
    let rawConfig: Record<string, unknown> = {};
    try {
      if (fs.existsSync(configPath)) {
        const parsed: unknown = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        // A non-object root holds no explicit settings, and reading a key
        // off `null` would crash this read-only command.
        if (isConfigRootObject(parsed)) {
          rawConfig = parsed as Record<string, unknown>;
        }
      }
    } catch {
      // If reading fails, treat all as defaults
    }

    console.log(formatValueYaml(config));

    // Annotate profile settings
    const profileSource = rawConfig.profile !== undefined ? CONFIG_MESSAGES.explicitSource : CONFIG_MESSAGES.defaultSource;
    const deliverySource = rawConfig.delivery !== undefined ? CONFIG_MESSAGES.explicitSource : CONFIG_MESSAGES.defaultSource;
    console.log(`\n${CONFIG_MESSAGES.profileSettings}`);
    console.log(CONFIG_MESSAGES.profileLabel(config.profile, profileSource));
    console.log(CONFIG_MESSAGES.deliveryLabel(config.delivery, deliverySource));
    if (config.profile === 'core') {
      console.log(CONFIG_MESSAGES.coreWorkflowsNote(CORE_WORKFLOWS.join(', ')));
    } else if (config.workflows && config.workflows.length > 0) {
      console.log(CONFIG_MESSAGES.explicitWorkflowsNote(config.workflows.join(', ')));
    } else {
      console.log(CONFIG_MESSAGES.noWorkflowsNote);
    }
  }
}

export function configGetCommand(key: string): void {
  const config = getGlobalConfig();
  const value = getNestedValue(config as Record<string, unknown>, key);

  if (value === undefined) {
    process.exitCode = 1;
    return;
  }

  if (typeof value === 'object' && value !== null) {
    console.log(JSON.stringify(value));
  } else {
    console.log(String(value));
  }
}

export function configSetCommand(key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }): void {
  const allowUnknown = Boolean(options.allowUnknown);
  const keyValidation = validateConfigKeyPath(key);
  // --allow-unknown relaxes the known-key check, but never the prototype-safety check.
  const unsafeKey = hasUnsafeKeySegment(key);
  if (!keyValidation.valid && (!allowUnknown || unsafeKey)) {
    const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
    console.error(CONFIG_MESSAGES.invalidConfigKey(key, reason));
    console.error(CONFIG_MESSAGES.useConfigList);
    if (!allowUnknown && !unsafeKey) {
      console.error(CONFIG_MESSAGES.passAllowUnknown);
    }
    process.exitCode = 1;
    return;
  }

  if (refuseUnreadableConfig()) {
    return;
  }

  const config = getGlobalConfig() as Record<string, unknown>;
  const coercedValue = coerceValue(value, options.string || false);

  // Create a copy to validate before saving
  const newConfig = JSON.parse(JSON.stringify(config));
  setNestedValue(newConfig, key, coercedValue);

  // Validate the new config
  const validation = validateConfig(newConfig);
  if (!validation.success) {
    console.error(CONFIG_MESSAGES.invalidConfiguration(validation.error!));
    process.exitCode = 1;
    return;
  }

  // Apply changes and save
  setNestedValue(config, key, coercedValue);
  saveGlobalConfig(config as GlobalConfig);

  const displayValue =
    typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
  console.log(CONFIG_MESSAGES.setKeyValue(key, displayValue));
}

export function configUnsetCommand(key: string): void {
  if (refuseUnreadableConfig()) {
    return;
  }

  const config = getGlobalConfig() as Record<string, unknown>;
  const existed = deleteNestedValue(config, key);

  if (existed) {
    saveGlobalConfig(config as GlobalConfig);
    console.log(CONFIG_MESSAGES.unsetKey(key));
  } else {
    console.log(CONFIG_MESSAGES.keyNotSet(key));
  }
}

export async function configResetCommand(options: { all?: boolean; yes?: boolean }): Promise<void> {
  if (!options.all) {
    console.error(CONFIG_MESSAGES.resetAllRequired);
    console.error(CONFIG_MESSAGES.resetUsage);
    process.exitCode = 1;
    return;
  }

  if (!options.yes) {
    const { confirm } = await import('@inquirer/prompts');
    let confirmed: boolean;
    try {
      confirmed = await confirm({
        message: CONFIG_MESSAGES.resetConfirm,
        default: false,
      });
    } catch (error) {
      if (isPromptCancellationError(error)) {
        console.log(CONFIG_MESSAGES.resetCancelled);
        process.exitCode = 130;
        return;
      }
      throw error;
    }

    if (!confirmed) {
      console.log(CONFIG_MESSAGES.resetCancelled);
      return;
    }
  }

  // A reset is the one write meant to replace a file that cannot be parsed.
  saveGlobalConfig({ ...DEFAULT_CONFIG }, { replaceUnreadable: true });
  console.log(CONFIG_MESSAGES.configurationReset);
}

export async function configEditCommand(): Promise<void> {
  const editor = process.env.EDITOR || process.env.VISUAL;

  if (!editor) {
    console.error(CONFIG_MESSAGES.noEditorConfigured);
    console.error(CONFIG_MESSAGES.setEditorEnv);
    console.error(CONFIG_MESSAGES.editorExample);
    process.exitCode = 1;
    return;
  }

  const configPath = getGlobalConfigPath();

  // Ensure config file exists with defaults
  if (!fs.existsSync(configPath)) {
    saveGlobalConfig({ ...DEFAULT_CONFIG });
  }

  // Wait for the editor to close; a failure is reported, never thrown.
  const outcome = await runEditor(editor, configPath);
  if ('error' in outcome || outcome.code !== 0) {
    reportEditorFailure(editor, outcome);
    process.exitCode = 1;
    return;
  }

  try {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(rawConfig);
    const validation = validateConfig(parsedConfig);

    if (!validation.success) {
      console.error(CONFIG_MESSAGES.invalidConfiguration(validation.error!));
      process.exitCode = 1;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(CONFIG_MESSAGES.configFileNotFound(configPath));
    } else if (error instanceof SyntaxError) {
      console.error(CONFIG_MESSAGES.invalidJson(configPath));
      console.error(error.message);
    } else {
      console.error(CONFIG_MESSAGES.unableToValidateConfig(error instanceof Error ? error.message : String(error)));
    }
    process.exitCode = 1;
  }
}

export async function configProfileCommand(preset?: string): Promise<void> {
  if (refuseUnreadableConfig()) {
    return;
  }

  // Preset shortcut: `openspec config profile core`
  if (preset === 'core') {
    const config = getGlobalConfig();
    config.profile = 'core';
    config.workflows = [...CORE_WORKFLOWS];
    // Preserve delivery setting
    saveGlobalConfig(config);
    printConfigProfileApplyGuidance();
    return;
  }

  if (preset) {
    console.error(CONFIG_MESSAGES.unknownProfilePreset(preset));
    process.exitCode = 1;
    return;
  }

  // Non-interactive check
  if (!process.stdout.isTTY) {
    console.error(CONFIG_MESSAGES.interactiveModeRequired);
    process.exitCode = 1;
    return;
  }

  // Interactive picker
  const { select, checkbox, confirm } = await import('@inquirer/prompts');
  const chalk = (await import('chalk')).default;

  try {
    const config = getGlobalConfig();
    const currentState = resolveCurrentProfileState(config);

    console.log(chalk.bold('\n' + CONFIG_MESSAGES.currentProfileSettings));
    console.log(CONFIG_MESSAGES.deliveryLabel(currentState.delivery));
    console.log(CONFIG_MESSAGES.workflowsLabel(formatWorkflowSummary(currentState.workflows, currentState.profile)));
    console.log(chalk.dim(CONFIG_MESSAGES.deliveryHelp));
    console.log(chalk.dim(CONFIG_MESSAGES.workflowsHelp));
    console.log();

    const action = await select<ProfileAction>({
      message: CONFIG_MESSAGES.whatToConfigure,
      choices: [
        {
          value: 'both',
          name: CONFIG_MESSAGES.deliveryAndWorkflows,
          description: CONFIG_MESSAGES.deliveryAndWorkflowsDesc,
        },
        {
          value: 'delivery',
          name: CONFIG_MESSAGES.deliveryOnly,
          description: CONFIG_MESSAGES.deliveryOnlyDesc,
        },
        {
          value: 'workflows',
          name: CONFIG_MESSAGES.workflowsOnly,
          description: CONFIG_MESSAGES.workflowsOnlyDesc,
        },
        {
          value: 'keep',
          name: CONFIG_MESSAGES.keepCurrentSettings,
          description: CONFIG_MESSAGES.keepCurrentSettingsDesc,
        },
      ],
    });

    if (action === 'keep') {
      console.log(CONFIG_MESSAGES.noConfigChanges);
      await maybeWarnProjectConfigDrift(process.cwd(), currentState, chalk.yellow);
      return;
    }

    const nextState: ProfileState = {
      profile: currentState.profile,
      delivery: currentState.delivery,
      workflows: [...currentState.workflows],
    };
    let workflowSelectionChanged = false;

    if (action === 'both' || action === 'delivery') {
      const deliveryChoices: { value: Delivery; name: string; description: string }[] = [
        {
          value: 'both' as Delivery,
          name: CONFIG_MESSAGES.bothSkillsAndCommands,
          description: CONFIG_MESSAGES.bothSkillsAndCommandsDesc,
        },
        {
          value: 'skills' as Delivery,
          name: CONFIG_MESSAGES.skillsOnly,
          description: CONFIG_MESSAGES.skillsOnlyDesc,
        },
        {
          value: 'commands' as Delivery,
          name: CONFIG_MESSAGES.commandsOnly,
          description: CONFIG_MESSAGES.commandsOnlyDesc,
        },
      ];
      for (const choice of deliveryChoices) {
        if (choice.value === currentState.delivery) {
          choice.name += CONFIG_MESSAGES.currentSuffix;
        }
      }

      nextState.delivery = await select<Delivery>({
        message: CONFIG_MESSAGES.deliveryMode,
        choices: deliveryChoices,
        default: currentState.delivery,
      });
    }

    if (action === 'both' || action === 'workflows') {
      const formatWorkflowChoice = (workflow: string) => {
        const metadata = WORKFLOW_PROMPT_META[workflow] ?? {
          name: workflow,
          description: CONFIG_MESSAGES.workflowLabel(workflow),
        };
        return {
          value: workflow,
          name: metadata.name,
          description: metadata.description,
          short: metadata.name,
          checked: currentState.workflows.includes(workflow),
        };
      };

      const selectedWorkflows = await checkbox<string>({
        // The `instructions` option was removed in @inquirer/checkbox v5.
        // Its replacement, the built-in keys help tip, renders
        // "↑↓ navigate • space select • ⏎ submit" by default — a superset of
        // the hint this used to pass — so no theme override is needed here.
        message: CONFIG_MESSAGES.selectWorkflows,
        pageSize: ALL_WORKFLOWS.length,
        theme: {
          icon: {
            checked: '[x]',
            unchecked: '[ ]',
          },
          style: {
            keysHelpTip: ptBrKeysHelpTip,
          },
        },
        choices: ALL_WORKFLOWS.map(formatWorkflowChoice),
      });
      nextState.workflows = selectedWorkflows;
      workflowSelectionChanged =
        selectedWorkflows.length !== currentState.workflows.length ||
        selectedWorkflows.some((workflow) => !currentState.workflows.includes(workflow));
      nextState.profile = workflowSelectionChanged
        ? deriveProfileFromWorkflowSelection(selectedWorkflows)
        : currentState.profile;
    }

    const diff = diffProfileState(currentState, nextState);
    if (!diff.hasChanges) {
      console.log(CONFIG_MESSAGES.noConfigChanges);
      await maybeWarnProjectConfigDrift(process.cwd(), nextState, chalk.yellow);
      return;
    }

    console.log(chalk.bold('\n' + CONFIG_MESSAGES.configChanges));
    for (const line of diff.lines) {
      console.log(`  ${line}`);
    }
    console.log();

    config.profile = nextState.profile;
    config.delivery = nextState.delivery;
    if (currentState.profile !== 'custom' || workflowSelectionChanged) {
      config.workflows = nextState.workflows;
    }
    saveGlobalConfig(config);

    // Check if inside an OpenSpec project
    const projectDir = process.cwd();
    const openspecDir = path.join(projectDir, OPENSPEC_DIR_NAME);
    if (fs.existsSync(openspecDir)) {
      const applyNow = await confirm({
        message: CONFIG_MESSAGES.applyChangesNow,
        default: true,
      });

      if (applyNow) {
        try {
          const { UpdateCommand } = await import('../core/update.js');
          await new UpdateCommand().execute(projectDir);
          console.log(CONFIG_MESSAGES.configUpdatedOtherProjects);
        } catch (error) {
          console.error(CONFIG_MESSAGES.updateFailed(asErrorMessage(error)));
          process.exitCode = 1;
        }
        return;
      }
    }

    printConfigProfileApplyGuidance();
  } catch (error) {
    if (isPromptCancellationError(error)) {
      console.log(CONFIG_MESSAGES.configProfileCancelled);
      process.exitCode = 130;
      return;
    }
    throw error;
  }
}

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description(CONFIG_MESSAGES.viewAndModify)
    .option('--scope <scope>', CONFIG_MESSAGES.configScopeOption)
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.scope && opts.scope !== 'global') {
        console.error(CLI_MESSAGES.projectLocalNotImplemented);
        process.exit(1);
      }
    });

  configCmd
    .command('path')
    .description(CONFIG_MESSAGES.showLocation)
    .action(() => {
      configPathCommand();
    });

  configCmd
    .command('list')
    .description(CONFIG_MESSAGES.showAllSettings)
    .option('--json', CONFIG_MESSAGES.outputAsJson)
    .action((options: { json?: boolean }) => {
      configListCommand(options);
    });

  configCmd
    .command('get <key>')
    .description(CONFIG_MESSAGES.getValue)
    .action((key: string) => {
      configGetCommand(key);
    });

  configCmd
    .command('set <key> <value>')
    .description(CONFIG_MESSAGES.setValue)
    .option('--string', CONFIG_MESSAGES.forceStringOption)
    .option('--allow-unknown', CONFIG_MESSAGES.allowUnknownOption)
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      configSetCommand(key, value, options);
    });

  configCmd
    .command('unset <key>')
    .description(CONFIG_MESSAGES.removeKey)
    .action((key: string) => {
      configUnsetCommand(key);
    });

  configCmd
    .command('reset')
    .description(CONFIG_MESSAGES.resetConfig)
    .option('--all', CONFIG_MESSAGES.resetAllOption)
    .option('-y, --yes', CONFIG_MESSAGES.skipConfirmationOption)
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      await configResetCommand(options);
    });

  configCmd
    .command('edit')
    .description(CONFIG_MESSAGES.openInEditor)
    .action(async () => {
      await configEditCommand();
    });

  configCmd
    .command('profile [preset]')
    .description(CONFIG_MESSAGES.configureProfile)
    .action(async (preset?: string) => {
      await configProfileCommand(preset);
    });
}

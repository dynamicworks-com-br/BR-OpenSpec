/**
 * Update Command
 *
 * Refreshes BR-OpenSpec skills and commands for configured tools.
 * Supports profile-aware updates, delivery changes, migration, and smart update detection.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import {
  getSkillReferenceTransformer,
  getTransformerForTool,
  transformToSkillReferences,
} from '../utils/command-references.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldGenerateCommandsForTool,
} from './command-surface.js';
import { AI_TOOLS, OPENSPEC_DIR_NAME } from './config.js';
import {
  generateCommands,
  CommandAdapterRegistry,
  resolveCommandArtifactPath,
} from './command-generation/index.js';
import {
  getToolVersionStatus,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  getToolsWithSkillsDir,
  type ToolVersionStatus,
} from './shared/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  getToolsFromLegacyArtifacts,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import { isInteractive } from '../utils/interactive.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { MIGRATION_MESSAGES, ONBOARDING_MESSAGES, UPDATE_MESSAGES } from '../messages/index.js';
import { getProfileWorkflows, ALL_WORKFLOWS, CORE_WORKFLOWS } from './profiles.js';
import { getOnboardingCommands } from './onboarding-commands.js';
import { getAvailableTools } from './available-tools.js';
import {
  WORKFLOW_TO_SKILL_DIR,
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  scanInstalledWorkflows as scanInstalledWorkflowsShared,
  migrateIfNeeded as migrateIfNeededShared,
  findLegacyToolMigrations,
  migrateLegacyToolDirs,
  describeLegacyMigration,
  legacyMigrationNotice,
  keptInPlaceNotice,
  hasMovableContent,
  type LegacyToolMigration,
} from './migration.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 * Wrapper around the shared migration module's scanInstalledWorkflows that accepts tool IDs.
 */
export function scanInstalledWorkflows(projectPath: string, toolIds: string[]): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflowsShared(projectPath, tools);
}

export class UpdateCommand {
  private readonly force: boolean;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const openspecPath = path.join(resolvedProjectPath, OPENSPEC_DIR_NAME);

    // 1. Check openspec directory exists
    if (!await FileSystemUtils.directoryExists(openspecPath)) {
      throw new Error(UPDATE_MESSAGES.noOpenspecDir);
    }

    // 2. Migrate OpenSpec-managed skills left in renamed tool directories
    // (e.g. .kimi -> .kimi-code) so they stay detected and get refreshed,
    // then perform the one-time profile migration if needed before any
    // legacy upgrade generation.
    for (const migration of migrateLegacyToolDirs(resolvedProjectPath)) {
      if (hasMovableContent(migration)) {
        console.log(chalk.dim(MIGRATION_MESSAGES.migratedToolContent(describeLegacyMigration(migration), migration.from, migration.to)));
      }
      this.reportKeptInPlace(migration);
    }
    const declinedMigrations = await this.offerConsentedLegacyMigrations(resolvedProjectPath);

    // Use detected tool directories to preserve existing opsx skills/commands.
    const detectedTools = getAvailableTools(resolvedProjectPath);
    migrateIfNeededShared(resolvedProjectPath, detectedTools);

    // 3. Read global config for profile/delivery
    const globalConfig = getGlobalConfig();
    const profile = globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const profileWorkflows = getProfileWorkflows(profile, globalConfig.workflows);
    const desiredWorkflows = profileWorkflows.filter((workflow): workflow is (typeof ALL_WORKFLOWS)[number] =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
    );
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';

    // 4. Detect and handle legacy artifacts + upgrade legacy tools using effective config
    const newlyConfiguredTools = await this.handleLegacyCleanup(
      resolvedProjectPath,
      desiredWorkflows,
      delivery
    );

    // 5. Find configured tools
    const configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath);

    if (configuredTools.length === 0 && newlyConfiguredTools.length === 0) {
      if (declinedMigrations.length > 0) {
        // Not an unconfigured project — a configured one the user chose to
        // leave in its former directory. Saying "run init" would be wrong.
        for (const migration of declinedMigrations) {
          console.log(chalk.yellow(UPDATE_MESSAGES.nothingToUpdateLegacyOnly(migration.from)));
          console.log(chalk.dim(UPDATE_MESSAGES.rerunUpdateAcceptMove(migration.to)));
        }
        return;
      }
      console.log(chalk.yellow(UPDATE_MESSAGES.noConfiguredTools));
      console.log(chalk.dim(UPDATE_MESSAGES.runInitHint));
      return;
    }

    // 6. Check version status for all configured tools, against the same workflow set
    //    the generation loop below writes — otherwise a legacy-upgraded tool would be
    //    fingerprinted against commands it was never given.
    const toolStatuses = configuredTools.map((toolId) =>
      getToolVersionStatus(resolvedProjectPath, toolId, OPENSPEC_VERSION, {
        workflows: desiredWorkflows,
      })
    );
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 7. Smart update detection
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => s.needsUpdate)
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      delivery,
      configuredTools
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
    ]);
    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0) {
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, configuredTools);
      this.displayExtraWorkflowsNote(resolvedProjectPath, configuredTools, desiredWorkflows);
      this.displayMissingCoreWorkflowsNote(profile, globalConfig.workflows);
      return;
    }

    // 8. Display update plan
    if (this.force) {
      console.log(UPDATE_MESSAGES.forceUpdating(configuredTools.length, configuredTools.join(', ')));
    } else {
      this.displayUpdatePlan([...toolsToUpdateSet], statusByTool, toolsUpToDate);
    }
    console.log();

    // 9. Determine what to generate based on delivery
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(desiredWorkflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(desiredWorkflows) : [];

    // 10. Update tools (all if force, otherwise only those needing update)
    const toolsToUpdate = this.force ? configuredTools : [...toolsToUpdateSet];
    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];
    const zeroArtifactTools: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;
    let removedDeselectedCommandCount = 0;
    let removedDeselectedSkillCount = 0;

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(UPDATE_MESSAGES.updatingTool(tool.name)).start();

      try {
        const skillsDir = path.join(resolvedProjectPath, tool.skillsDir, 'skills');

        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value)
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
            FileSystemUtils.assertProjectArtifactPath(resolvedProjectPath, skillFile);
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }

          removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(
            resolvedProjectPath,
            skillsDir,
            desiredWorkflows
          );
        }

        // Delete skill directories if delivery is commands-only
        if (!shouldGenerateSkills) {
          removedSkillCount += await this.removeSkillDirs(resolvedProjectPath, skillsDir);
          // A tool with no command adapter now has zero OpenSpec artifacts;
          // say so, rather than deleting its skills silently and letting
          // tool detection re-suggest an init that would also generate
          // nothing under this delivery setting.
          if (!CommandAdapterRegistry.get(tool.value)) {
            zeroArtifactTools.push(tool.name);
          }
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = resolveCommandArtifactPath(
                resolvedProjectPath,
                adapter,
                cmd.path
              );
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }

            removedDeselectedCommandCount += await this.removeUnselectedCommandFiles(
              resolvedProjectPath,
              toolId,
              desiredWorkflows
            );
          }
        }

        // Delete command files if delivery is skills-only
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(resolvedProjectPath, toolId);
        }

        spinner.succeed(UPDATE_MESSAGES.updatedTool(tool.name));
        updatedTools.push(tool.name);
      } catch (error) {
        spinner.fail(UPDATE_MESSAGES.failedToUpdate(tool.name));
        failedTools.push({
          name: tool.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 11. Summary
    console.log();
    if (updatedTools.length > 0) {
      console.log(chalk.green(UPDATE_MESSAGES.updated(updatedTools.join(', '), OPENSPEC_VERSION)));
    }
    if (failedTools.length > 0) {
      console.log(chalk.red(UPDATE_MESSAGES.failed(failedTools.map(f => `${f.name} (${f.error})`).join(', '))));
    }
    if (removedCommandCount > 0) {
      console.log(chalk.dim(UPDATE_MESSAGES.removedCommands(removedCommandCount)));
    }
    if (removedSkillCount > 0) {
      console.log(chalk.dim(UPDATE_MESSAGES.removedSkills(removedSkillCount)));
    }
    if (zeroArtifactTools.length > 0) {
      console.log(
        chalk.yellow(
          UPDATE_MESSAGES.noSkillsOrCommandsRemain(
            zeroArtifactTools.join(', '),
            zeroArtifactTools.length === 1
          )
        )
      );
    }
    if (removedDeselectedCommandCount > 0) {
      console.log(chalk.dim(UPDATE_MESSAGES.removedDeselectedCommands(removedDeselectedCommandCount)));
    }
    if (removedDeselectedSkillCount > 0) {
      console.log(chalk.dim(UPDATE_MESSAGES.removedDeselectedSkills(removedDeselectedSkillCount)));
    }

    // 12. Show onboarding message for newly configured tools from legacy upgrade.
    // Command tools get the command name their files answer to, skill-only
    // tools their documented skill invocation, and disagreements fall back to
    // naming the skill. Only workflows these tools actually received are
    // hinted (the effective profile).
    if (newlyConfiguredTools.length > 0) {
      const referenceFor = (command: string): string => {
        const neutralForm = ONBOARDING_MESSAGES.skillReference(transformToSkillReferences(command).slice(1));
        const forms = new Set(
          newlyConfiguredTools.map((toolId) => {
            if (shouldGenerateCommandsForTool(toolId, delivery)) {
              // Name the command the tool's files actually answer to:
              // /opsx-<id> where the filename is the command name.
              const transformer = getTransformerForTool(
                toolId,
                delivery,
                resolveCommandSurfaceCapability(toolId),
                resolveCommandInvocation(toolId)
              );
              return transformer ? transformer(command) : command;
            }
            return getSkillReferenceTransformer(toolId)(command);
          })
        );
        return forms.size === 1 ? [...forms][0] : neutralForm;
      };
      const entries: Array<[string, string]> = getOnboardingCommands(desiredWorkflows).map(
        ({ command, description }) => [referenceFor(command), description]
      );
      console.log();
      if (entries.length > 0) {
        const width = Math.max(...entries.map(([reference]) => reference.length));
        console.log(chalk.bold(UPDATE_MESSAGES.gettingStarted));
        for (const [reference, description] of entries) {
          console.log(`  ${reference.padEnd(width)}  ${description}`);
        }
        console.log();
      }
      console.log(UPDATE_MESSAGES.learnMore(chalk.cyan('https://github.com/dynamicworks-com-br/BR-OpenSpec')));
    }

    const configuredAndNewTools = [...new Set([...configuredTools, ...newlyConfiguredTools])];

    // 13. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredAndNewTools);

    // 14. Display note about extra workflows not in profile
    this.displayExtraWorkflowsNote(resolvedProjectPath, configuredAndNewTools, desiredWorkflows);
    this.displayMissingCoreWorkflowsNote(profile, globalConfig.workflows);

    // 15. List affected tools
    if (updatedTools.length > 0) {
      const toolDisplayNames = updatedTools;
      console.log(chalk.dim(UPDATE_MESSAGES.toolsList(toolDisplayNames.join(', '))));
    }

    console.log();
    console.log(chalk.dim(UPDATE_MESSAGES.restartIDE));
    if (failedTools.length > 0) {
      throw new Error(UPDATE_MESSAGES.updateFailedFor(failedTools.map((tool) => tool.name).join(', ')));
    }
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    console.log(chalk.green(UPDATE_MESSAGES.allUpToDate(toolStatuses.length, OPENSPEC_VERSION)));
    console.log(chalk.dim(UPDATE_MESSAGES.toolsList(toolNames.join(', '))));
    console.log();
    console.log(chalk.dim(UPDATE_MESSAGES.useForceHint));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? 'unknown';
        return `${status.toolId} (${fromVersion} → ${OPENSPEC_VERSION})`;
      }
      return `${toolId} (config sync)`;
    });

    console.log(UPDATE_MESSAGES.updatingPlan(toolsToUpdate.length, updates.join(', ')));

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      console.log(chalk.dim(UPDATE_MESSAGES.alreadyUpToDate(upToDateNames.join(', '))));
    }
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredTools: string[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredTools);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      const isSingleTool = newToolNames.length === 1;
      const toolNoun = isSingleTool ? UPDATE_MESSAGES.toolNoun : UPDATE_MESSAGES.toolsNoun;
      const pronoun = isSingleTool ? UPDATE_MESSAGES.it : UPDATE_MESSAGES.them;
      console.log();
      console.log(
        chalk.yellow(
          UPDATE_MESSAGES.detectedNewTools(toolNoun, newToolNames.join(', '), pronoun)
        )
      );
    }
  }

  /**
   * Displays a note about extra workflows installed that aren't in the current profile.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): void {
    const installedWorkflows = scanInstalledWorkflows(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      console.log(chalk.dim(UPDATE_MESSAGES.extraWorkflowsNote(extraWorkflows.length)));
    }
  }

  /**
   * Aponta os fluxos de trabalho do core que faltam em um perfil
   * personalizado, para que releases que ampliam CORE_WORKFLOWS continuem
   * visíveis. Mantém os perfis personalizados sob controle do usuário;
   * não os altera.
   */
  private displayMissingCoreWorkflowsNote(profile: Profile, workflows?: readonly string[]): void {
    if (profile !== 'custom' || !workflows) {
      return;
    }

    const workflowSet = new Set(workflows);
    const missing = CORE_WORKFLOWS.filter((workflow) => !workflowSet.has(workflow));

    if (missing.length === 0) {
      return;
    }

    console.log(chalk.dim(UPDATE_MESSAGES.missingCoreWorkflowsNote(missing.length, missing.join(', '))));
    console.log(chalk.dim(UPDATE_MESSAGES.missingCoreWorkflowsHint(missing.length)));
  }

  /**
   * Removes skill directories for workflows when delivery changed to commands-only.
   * Returns the number of directories removed.
   */
  private async removeSkillDirs(projectPath: string, skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      if (!fs.existsSync(skillDir)) continue;
      FileSystemUtils.assertProjectArtifactPath(projectPath, skillDir);
      try {
        await fs.promises.rm(skillDir, { recursive: true, force: true });
        removed++;
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes skill directories for workflows that are no longer selected in the active profile.
   * Returns the number of directories removed.
   */
  private async removeUnselectedSkillDirs(
    projectPath: string,
    skillsDir: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    const desiredSet = new Set(desiredWorkflows);
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      if (!fs.existsSync(skillDir)) continue;
      FileSystemUtils.assertProjectArtifactPath(projectPath, skillDir);
      try {
        await fs.promises.rm(skillDir, { recursive: true, force: true });
        removed++;
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows when delivery changed to skills-only.
   * Returns the number of files removed.
   */
  private async removeCommandFiles(
    projectPath: string,
    toolId: string,
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    for (const workflow of ALL_WORKFLOWS) {
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = resolveCommandArtifactPath(projectPath, adapter, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows that are no longer selected in the active profile.
   * Returns the number of files removed.
   */
  private async removeUnselectedCommandFiles(
    projectPath: string,
    toolId: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    const desiredSet = new Set(desiredWorkflows);

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = resolveCommandArtifactPath(projectPath, adapter, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Offers to move OpenSpec content out of a renamed tool's former directory
   * when the old location might still be the live one — today, Windsurf's
   * `.windsurf/` after the Devin Desktop rebrand.
   *
   * Interactive runs are asked, because nothing on disk distinguishes a user
   * who took the rebrand from one still on a pre-rebrand Windsurf build that
   * reads only `.windsurf/`. `--force` and non-interactive runs migrate, which
   * is what an unattended upgrade wants.
   */
  /** Surfaces files the move left behind rather than overwriting. */
  private reportKeptInPlace(migration: LegacyToolMigration): void {
    const notice = keptInPlaceNotice(migration);
    if (notice) console.log(chalk.dim(notice));
  }

  private async offerConsentedLegacyMigrations(
    projectPath: string
  ): Promise<LegacyToolMigration[]> {
    const pending = findLegacyToolMigrations(projectPath).filter((m) => m.needsConsent);
    const declined: LegacyToolMigration[] = [];
    if (pending.length === 0) return declined;

    for (const migration of pending) {
      // Nothing movable: every legacy file differs from its counterpart, so
      // there is no move to offer. Still say so — silence would leave two
      // divergent copies the user never hears about.
      if (!hasMovableContent(migration)) {
        this.reportKeptInPlace(migration);
        console.log();
        continue;
      }

      console.log(chalk.yellow(legacyMigrationNotice(migration)));

      if (!this.force && isInteractive()) {
        const { confirm } = await import('@inquirer/prompts');
        let shouldMigrate: boolean;
        try {
          shouldMigrate = await confirm({
            message: UPDATE_MESSAGES.confirmLegacyMove(
              describeLegacyMigration(migration),
              migration.from,
              migration.to
            ),
            default: true,
          });
        } catch {
          // Closed stdin is not consent, and it must not abort the update.
          shouldMigrate = false;
        }
        if (!shouldMigrate) {
          // Say what declining costs. OpenSpec writes the current root now, so
          // the files keep working where they are, but OpenSpec stops managing
          // them — it no longer looks in the former directory.
          console.log(chalk.dim(UPDATE_MESSAGES.legacyMoveDeclined(migration.from, migration.to)));
          console.log();
          declined.push(migration);
          continue;
        }
      }

      for (const applied of migrateLegacyToolDirs(projectPath, [migration.toolId])) {
        if (hasMovableContent(applied)) {
          console.log(chalk.dim(MIGRATION_MESSAGES.migratedToolContent(describeLegacyMigration(applied), applied.from, applied.to)));
        }
        this.reportKeptInPlace(applied);
      }
      console.log();
    }

    return declined;
  }

  /**
   * Detect and handle legacy BR-OpenSpec artifacts.
   * Unlike init, update warns but continues if legacy files found in non-interactive mode.
   * Returns array of tool IDs that were newly configured during legacy upgrade.
   */
  private async handleLegacyCleanup(
    projectPath: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][],
    delivery: Delivery
  ): Promise<string[]> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return []; // No legacy artifacts found
    }

    // Show what was detected
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = isInteractive();

    if (this.force) {
      // --force flag: proceed with cleanup automatically
      await this.performLegacyCleanup(projectPath, detection);
      // Then upgrade legacy tools to new skills
      return this.upgradeLegacyTools(projectPath, detection, canPrompt, desiredWorkflows, delivery);
    }

    if (!canPrompt) {
      // Non-interactive mode without --force: warn and continue
      // (Unlike init, update doesn't abort - user may just want to update skills)
      console.log(chalk.yellow(UPDATE_MESSAGES.forceLegacyHint));
      console.log();
      return [];
    }

    // Interactive mode: prompt for confirmation
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: UPDATE_MESSAGES.upgradeLegacyPrompt,
      default: true,
    });

    if (shouldCleanup) {
      await this.performLegacyCleanup(projectPath, detection);
      // Then upgrade legacy tools to new skills
      return this.upgradeLegacyTools(projectPath, detection, canPrompt, desiredWorkflows, delivery);
    } else {
      console.log(chalk.dim(UPDATE_MESSAGES.skippingLegacyCleanup));
      console.log();
      return [];
    }
  }

  /**
   * Perform cleanup of legacy artifacts.
   */
  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora(UPDATE_MESSAGES.cleaningLegacy).start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed(UPDATE_MESSAGES.legacyCleaned);

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
  }

  /**
   * Upgrade legacy tools to new skills system.
   * Returns array of tool IDs that were newly configured.
   */
  private async upgradeLegacyTools(
    projectPath: string,
    detection: LegacyDetectionResult,
    canPrompt: boolean,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][],
    delivery: Delivery
  ): Promise<string[]> {
    // Get tools that had legacy artifacts
    const legacyTools = getToolsFromLegacyArtifacts(detection);

    if (legacyTools.length === 0) {
      return [];
    }

    // Get currently configured tools
    const configuredTools = getConfiguredToolsForProfileSync(projectPath);
    const configuredSet = new Set(configuredTools);

    // Filter to tools that aren't already configured
    const unconfiguredLegacyTools = legacyTools.filter((t) => !configuredSet.has(t));

    if (unconfiguredLegacyTools.length === 0) {
      return [];
    }

    // Get valid tools (those with skillsDir)
    const validToolIds = new Set(getToolsWithSkillsDir());
    const validUnconfiguredTools = unconfiguredLegacyTools.filter((t) => validToolIds.has(t));

    if (validUnconfiguredTools.length === 0) {
      return [];
    }

    // Show what tools were detected from legacy artifacts
    console.log(chalk.bold(UPDATE_MESSAGES.toolsDetectedFromLegacy));
    for (const toolId of validUnconfiguredTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      console.log(`  • ${tool?.name || toolId}`);
    }
    console.log();

    let selectedTools: string[];

    if (this.force || !canPrompt) {
      // Non-interactive with --force: auto-select detected tools
      selectedTools = validUnconfiguredTools;
      console.log(UPDATE_MESSAGES.setupSkillsFor(selectedTools.join(', ')));
    } else {
      // Interactive mode: prompt for tool selection with detected tools pre-selected
      const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

      const sortedChoices = validUnconfiguredTools.map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        return {
          name: tool?.name || toolId,
          value: toolId,
          configured: false,
          preSelected: true, // Pre-select all detected legacy tools
        };
      });

      selectedTools = await searchableMultiSelect({
        message: UPDATE_MESSAGES.selectToolsNewSkillSystem,
        pageSize: 15,
        choices: sortedChoices,
        validate: (_selected: string[]) => true, // Allow empty selection (user can skip)
      });

      if (selectedTools.length === 0) {
        console.log(chalk.dim(UPDATE_MESSAGES.skippingToolSetup));
        console.log();
        return [];
      }
    }

    // Create skills/commands for selected tools using effective profile+delivery.
    const newlyConfigured: string[] = [];
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(desiredWorkflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(desiredWorkflows) : [];

    for (const toolId of selectedTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(UPDATE_MESSAGES.settingUp(tool.name)).start();

      try {
        const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

        // Create skill files when delivery includes skills
        if (shouldGenerateSkills) {
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value)
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
            FileSystemUtils.assertProjectArtifactPath(projectPath, skillFile);
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }

        // Create commands when delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = resolveCommandArtifactPath(
                projectPath,
                adapter,
                cmd.path
              );
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          }
        }

        spinner.succeed(UPDATE_MESSAGES.setupComplete(tool.name));
        newlyConfigured.push(toolId);
      } catch (error) {
        spinner.fail(UPDATE_MESSAGES.failedToSetup(tool.name));
        console.log(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    if (newlyConfigured.length > 0) {
      console.log();
    }

    return newlyConfigured;
  }
}

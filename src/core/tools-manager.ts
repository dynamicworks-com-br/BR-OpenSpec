/**
 * Tools Manager
 *
 * Encapsulates adding and removing IDE/Code Agent OpenSpec configuration files.
 * Shared by `openspec init` (via InitCommand) and `openspec tools`.
 */

import { TOOLS_MESSAGES, TOOLS_MANAGER_MESSAGES } from '../messages/index.js';
import path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { getTransformerForTool } from '../utils/command-references.js';
import { type AIToolOption } from './config.js';
import {
  generateCommands,
  CommandAdapterRegistry,
  resolveCommandArtifactPath,
} from './command-generation/index.js';
import {
  resolveCommandInvocation,
  resolveCommandSurfaceCapability,
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
} from './command-surface.js';
import {
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
} from './shared/index.js';
import {
  getToolStates,
  getToolsWithSkillsDir,
  getSkillCapableTools,
  hasGlobalSkillTarget,
  resolveToolSkillsDir,
  toolSupportsSkills,
  type ToolSkillStatus,
} from './shared/index.js';
import {
  clearSharedSkillTarget,
  resolveSharedSkillTargetOwner,
  writeSharedSkillTarget,
} from './shared-skill-target.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from './profiles.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

// Map from workflow ID to the skill directory name it uses
const WORKFLOW_TO_SKILL_DIR: Record<string, string> = {
  explore: 'openspec-explore',
  new: 'openspec-new-change',
  continue: 'openspec-continue-change',
  apply: 'openspec-apply-change',
  update: 'openspec-update-change',
  ff: 'openspec-ff-change',
  sync: 'openspec-sync-specs',
  archive: 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  verify: 'openspec-verify-change',
  'code-review': 'openspec-code-review',
  onboard: 'openspec-onboard',
  propose: 'openspec-propose',
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared remove helpers (also used by InitCommand)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes all OpenSpec-owned skill directories under the given `skillsDir`.
 * Only directories whose names match known workflow skill dir names are removed.
 * Other files and directories are left intact.
 *
 * `skillsRoot` is the directory the removal may never escape: the project root
 * for skills local to the project, or the global skills target itself.
 *
 * @returns Number of directories removed
 */
export async function removeOpenSpecSkillDirs(
  skillsRoot: string,
  skillsDir: string
): Promise<number> {
  let removed = 0;

  for (const workflow of ALL_WORKFLOWS) {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
    if (!dirName) continue;

    const skillDir = path.join(skillsDir, dirName);
    if (!fs.existsSync(skillDir)) continue;
    // Nunca apaga através de um diretório de ferramenta vinculado para fora
    // da raiz permitida (mesma guarda de init/update).
    FileSystemUtils.assertPathWithin(skillsRoot, skillDir);
    try {
      await fs.promises.rm(skillDir, { recursive: true, force: true });
      removed++;
    } catch {
      // Ignore individual errors
    }
  }

  return removed;
}

/**
 * Removes all OpenSpec-owned command files for the given tool.
 * Only files whose paths are produced by the tool's adapter `getFilePath()` are removed.
 * The tool's configuration directory is left intact.
 *
 * @returns Number of files removed
 */
export async function removeOpenSpecCommandFiles(
  projectPath: string,
  toolId: string
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
      // Ignore individual errors
    }
  }

  return removed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Remove API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds OpenSpec skill and command files for the given tool.
 * Creates the tool's configuration directory if it does not exist.
 * Respects the active global config (profile and delivery settings).
 */
export async function addTool(
  projectPath: string,
  tool: AIToolOption
): Promise<void> {
  if (!toolSupportsSkills(tool)) {
    throw new Error(TOOLS_MANAGER_MESSAGES.toolDoesNotSupportSkills(tool.value));
  }

  const skillsPath = resolveToolSkillsDir(projectPath, tool);
  const skillsRoot = hasGlobalSkillTarget(tool) ? skillsPath : projectPath;

  const globalConfig = getGlobalConfig();
  const profile: Profile = globalConfig.profile ?? 'core';
  const delivery: Delivery = globalConfig.delivery ?? 'both';
  const workflows = getProfileWorkflows(profile, globalConfig.workflows);

  // Por ferramenta: uma ferramenta skills-invocable (Codex) recebe skills mesmo
  // sob `delivery: commands` e nunca recebe arquivos de comando.
  const shouldGenerateSkills = shouldGenerateSkillsForTool(tool.value, delivery);
  const shouldGenerateCommands = shouldGenerateCommandsForTool(tool.value, delivery);

  // Write skill files
  if (shouldGenerateSkills) {
    const skillTemplates = getSkillTemplates(workflows);

    for (const { template, dirName } of skillTemplates) {
      const skillDir = path.join(skillsPath, dirName);
      const skillFile = path.join(skillDir, 'SKILL.md');
      const transformer = getTransformerForTool(
        tool.value,
        delivery,
        resolveCommandSurfaceCapability(tool.value),
        resolveCommandInvocation(tool.value)
      );
      const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
      FileSystemUtils.assertPathWithin(skillsRoot, skillFile);
      await FileSystemUtils.writeFile(skillFile, skillContent);
    }
    // Uma raiz compartilhada (ex.: `.agents/skills`, usada por codex e agents)
    // guarda uma única variante de cada skill: registrar o dono aqui — como
    // fazem `init` e `update` — impede que o próximo `update` reescreva a
    // árvore com as referências da ferramenta anterior.
    writeSharedSkillTarget(projectPath, tool.value);
  }

  // Write command files
  if (shouldGenerateCommands) {
    const adapter = CommandAdapterRegistry.get(tool.value);
    if (adapter) {
      const commandContents = getCommandContents(workflows);
      const generatedCommands = generateCommands(commandContents, adapter);

      for (const cmd of generatedCommands) {
        const commandFile = resolveCommandArtifactPath(projectPath, adapter, cmd.path);
        await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
      }
    }
  }
}

/** Whether an OpenSpec-owned skill directory still exists under `skillsDir`. */
function hasManagedSkillDirs(skillsDir: string): boolean {
  return ALL_WORKFLOWS.some((workflow) => {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
    return Boolean(dirName) && fs.existsSync(path.join(skillsDir, dirName));
  });
}

/** Drops the `skills/` directory left empty by a complete removal. */
function removeSkillsDirIfEmpty(skillsRoot: string, skillsDir: string): void {
  try {
    FileSystemUtils.assertPathWithin(skillsRoot, skillsDir);
    if (fs.readdirSync(skillsDir).length === 0) {
      fs.rmdirSync(skillsDir);
    }
  } catch {
    // Diretório ausente, não vazio ou fora da raiz permitida: nada a fazer.
  }
}

/**
 * Removes OpenSpec-owned skill and command files for the given tool.
 * The tool's configuration directory itself is left intact; only files and
 * directories created by OpenSpec are removed.
 *
 * @returns Counts of removed skill dirs and command files
 */
export async function removeTool(
  projectPath: string,
  tool: AIToolOption
): Promise<{
  removedSkillCount: number;
  removedCommandCount: number;
  keptGlobalSkillsDir?: string;
  keptSharedSkillsDir?: string;
  keptSharedSkillsOwner?: string;
}> {
  if (!toolSupportsSkills(tool)) {
    return { removedSkillCount: 0, removedCommandCount: 0 };
  }

  const skillsDir = resolveToolSkillsDir(projectPath, tool);

  // Skills em alvo global (fora do projeto) são compartilhadas por todos os
  // projetos: removê-las daqui apagaria as skills usadas em outro lugar.
  if (hasGlobalSkillTarget(tool)) {
    const removedCommandCount = await removeOpenSpecCommandFiles(projectPath, tool.value);
    return { removedSkillCount: 0, removedCommandCount, keptGlobalSkillsDir: skillsDir };
  }

  // Uma raiz compartilhada tem exatamente um dono: só ele escreve e remove.
  // Sem esta guarda, `--remove codex` apagaria as skills que pertencem a
  // `agents` (e vice-versa), já que ambos apontam para `.agents/skills`.
  const sharedOwner = resolveSharedSkillTargetOwner(projectPath, tool.value);
  if (sharedOwner !== undefined && sharedOwner !== tool.value) {
    const removedCommandCount = await removeOpenSpecCommandFiles(projectPath, tool.value);
    return hasManagedSkillDirs(skillsDir)
      ? {
          removedSkillCount: 0,
          removedCommandCount,
          keptSharedSkillsDir: skillsDir,
          keptSharedSkillsOwner: sharedOwner,
        }
      : { removedSkillCount: 0, removedCommandCount };
  }

  const removedSkillCount = await removeOpenSpecSkillDirs(projectPath, skillsDir);
  const removedCommandCount = await removeOpenSpecCommandFiles(projectPath, tool.value);
  // Sem largar o marcador, a ferramenta continuaria "configurada" (só-marcador
  // conta como configurado) e o próximo `update` recriaria as skills.
  clearSharedSkillTarget(projectPath, tool.value);
  removeSkillsDirIfEmpty(projectPath, skillsDir);

  return { removedSkillCount, removedCommandCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the IDs of all tools that are currently configured in the project.
 */
export function getCurrentToolIds(projectPath: string): Set<string> {
  const toolStates: Map<string, ToolSkillStatus> = getToolStates(projectPath);
  const configured = new Set<string>();
  for (const [toolId, status] of toolStates) {
    if (status.configured) configured.add(toolId);
  }
  return configured;
}

/**
 * Returns all tools eligible for skill generation (project-local or global).
 */
export function getEligibleTools(): AIToolOption[] {
  return getSkillCapableTools();
}

/**
 * Resolves a comma-separated tool list string to an array of valid tool IDs.
 *
 * Accepts the special values "all" and "none".
 * Throws a descriptive error for invalid or ambiguous inputs.
 */
export function resolveToolsArg(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error(TOOLS_MESSAGES.addRemoveRequiresValue);
  }

  const availableTools = getToolsWithSkillsDir();
  const availableSet = new Set(availableTools);

  if (trimmed.toLowerCase() === 'all') {
    return availableTools;
  }

  if (trimmed.toLowerCase() === 'none') {
    return [];
  }

  const tokens = trimmed
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  if (tokens.some((t) => t === 'all' || t === 'none')) {
    throw new Error(TOOLS_MESSAGES.cannotCombineReserved);
  }

  const invalid = tokens.filter((t) => !availableSet.has(t));
  if (invalid.length > 0) {
    throw new Error(
      TOOLS_MESSAGES.invalidTools(invalid.join(', '), availableTools.join(', '))
    );
  }

  // Deduplicate preserving order
  const deduped: string[] = [];
  for (const t of tokens) {
    if (!deduped.includes(t)) deduped.push(t);
  }
  return deduped;
}

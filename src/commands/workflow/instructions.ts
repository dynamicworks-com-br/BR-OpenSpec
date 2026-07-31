/**
 * Instructions Command
 *
 * Generates enriched instructions for creating artifacts or applying tasks.
 * Includes both artifact instructions and apply instructions.
 */

import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  generateInstructions,
  resolveSchema,
  resolveArtifactOutputs,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
} from './shared.js';
import { parseTaskLines, type ParsedTask } from '../../utils/task-progress.js';
import { WORKFLOW_MESSAGES } from '../../messages/index.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = options.json ? undefined : ora(WORKFLOW_MESSAGES.generatingInstructions).start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);

    if (!artifactId) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        WORKFLOW_MESSAGES.missingArtifactArgument(validIds.join('\n  '))
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        WORKFLOW_MESSAGES.artifactNotFound(artifactId, context.schemaName, validIds.join('\n  '))
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot);
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    outputPath,
    description,
    instruction,
    context,
    rules,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  console.log(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  console.log();

  // Artifacts skipped via skip_specs get no creation directive: emitting the
  // task/template anyway would prompt an agent to write spec files that
  // validate then rejects as conflicting with the marker.
  if (instructions.skipped) {
    console.log('<warning>');
    console.log(instructions.warning ?? WORKFLOW_MESSAGES.artifactSkippedFallback);
    console.log('</warning>');
    console.log();
    console.log('</artifact>');
    return;
  }

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    console.log('<warning>');
    console.log(WORKFLOW_MESSAGES.unmetDependenciesWarning);
    console.log(WORKFLOW_MESSAGES.missingDependencies(missing.join(', ')));
    console.log('</warning>');
    console.log();
  }

  // Task directive
  console.log('<task>');
  console.log(WORKFLOW_MESSAGES.createArtifactTask(artifactId, changeName));
  console.log(description);
  console.log('</task>');
  console.log();

  // Project context (AI constraint - do not include in output)
  if (context) {
    console.log('<project_context>');
    console.log('<!-- This is background information for you. Do NOT include this in your output. -->');
    console.log(context);
    console.log('</project_context>');
    console.log();
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    console.log('<rules>');
    console.log('<!-- These are constraints for you to follow. Do NOT include this in your output. -->');
    for (const rule of rules) {
      console.log(`- ${rule}`);
    }
    console.log('</rules>');
    console.log();
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    console.log('<dependencies>');
    console.log(WORKFLOW_MESSAGES.readFilesForContext);
    console.log();
    for (const dep of dependencies) {
      // A dependency satisfied via skip_specs has no files by design: telling
      // the agent to read them (or calling them "done") would send it hunting
      // for spec files that must not exist.
      if (dep.skipped) {
        console.log(`<dependency id="${dep.id}" status="skipped">`);
        console.log(`  <description>${WORKFLOW_MESSAGES.skippedDependencyNoFiles}</description>`);
        console.log('</dependency>');
        continue;
      }
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      console.log(`<dependency id="${dep.id}" status="${status}">`);
      console.log(`  <path>${fullPath}</path>`);
      console.log(`  <description>${dep.description}</description>`);
      console.log('</dependency>');
    }
    console.log('</dependencies>');
    console.log();
  }

  // Output location
  console.log('<output>');
  console.log(WORKFLOW_MESSAGES.writeTo(path.join(changeDir, outputPath)));
  console.log('</output>');
  console.log();

  // Instruction (guidance)
  if (instruction) {
    console.log('<instruction>');
    console.log(instruction.trim());
    console.log('</instruction>');
    console.log();
  }

  // Template
  console.log('<template>');
  console.log('<!-- Use this as the structure for your output file. Fill in the sections. -->');
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- To be defined in schema validation rules -->');
  console.log('</success_criteria>');
  console.log();

  // Unlocks
  if (unlocks.length > 0) {
    console.log('<unlocks>');
    console.log(WORKFLOW_MESSAGES.unlocksArtifacts(unlocks.join(', ')));
    console.log('</unlocks>');
    console.log();
  }

  // Closing tag
  console.log('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

/**
 * Turns parsed task lines into the listed task items.
 *
 * A checkbox with no text after it is left out of the list: this is work for an
 * agent to act on and tick off, and a bare `- [ ]` gives it nothing to match.
 * It still counts toward progress, which is taken from every parsed line, so
 * this list can be shorter than the totals beside it but never disagrees with
 * `openspec list` or archive about how much work is left. An empty list is also
 * what puts apply in its "nothing to work on" state, so a file of nothing but
 * text-less checkboxes asks to be rewritten instead of being called done.
 */
function toTaskItems(parsed: ParsedTask[]): TaskItem[] {
  const tasks: TaskItem[] = [];

  for (const task of parsed) {
    if (task.description.length === 0) continue;
    tasks.push({
      id: `${tasks.length + 1}`,
      description: task.description,
      done: task.done,
    });
  }

  return tasks;
}

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const changeDir = context.changeDir;

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot);
  const applyConfig = schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;

  // Check which required artifacts are missing. Artifacts the change skips
  // via skip_specs count as present - their files must not exist, and
  // status already reports them complete, so apply cannot block on them.
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    if (context.skippedArtifacts?.has(artifactId)) {
      continue;
    }
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // Parse tasks if tracking file exists
  let parsedTasks: ParsedTask[] = [];
  let tracksFileExists = false;
  if (tracksFile) {
    const tracksPath = path.join(changeDir, tracksFile);
    tracksFileExists = fs.existsSync(tracksPath);
    if (tracksFileExists) {
      const tasksContent = await fs.promises.readFile(tracksPath, 'utf-8');
      parsedTasks = parseTaskLines(tasksContent);
    }
  }
  const tasks = toTaskItems(parsedTasks);

  // Calculate progress over every checkbox in the file, listed or not, so these
  // numbers match `openspec list` and archive's incomplete-task check.
  const total = parsedTasks.length;
  const complete = parsedTasks.filter((task) => task.done).length;
  const remaining = total - complete;

  // Determine state and instruction
  let state: ApplyInstructions['state'];
  let instruction: string;

  if (missingArtifacts.length > 0) {
    state = 'blocked';
    instruction = WORKFLOW_MESSAGES.cannotApplyMissingArtifacts(missingArtifacts.join(', '));
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = WORKFLOW_MESSAGES.missingTrackingFile(tracksFilename);
  } else if (tracksFile && tracksFileExists && tasks.length === 0) {
    // Tracking file exists but lists nothing an agent can work on: either no
    // checkboxes at all, or only checkboxes with no text after them.
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = WORKFLOW_MESSAGES.trackingFileNoTasks(tracksFilename);
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = WORKFLOW_MESSAGES.allTasksComplete;
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? WORKFLOW_MESSAGES.allArtifactsCompleteProceed;
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? WORKFLOW_MESSAGES.readContextAndWorkTasks;
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    contextFiles,
    progress: { total, complete, remaining },
    tasks,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    instruction,
  };
}

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora(WORKFLOW_MESSAGES.generatingApplyInstructions).start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // generateApplyInstructions uses loadChangeContext which auto-detects schema
    const instructions = await generateApplyInstructions(projectRoot, changeName, options.schema);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(WORKFLOW_MESSAGES.applyTitle(changeName));
  console.log(WORKFLOW_MESSAGES.schemaLabel(schemaName));
  console.log();

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log(WORKFLOW_MESSAGES.blockedTitle);
    console.log();
    console.log(WORKFLOW_MESSAGES.missingArtifactsLabel(missingArtifacts.join(', ')));
    console.log(WORKFLOW_MESSAGES.createMissingFirst);
    console.log();
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log(WORKFLOW_MESSAGES.contextFilesTitle);
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        console.log(`- ${artifactId}: ${filePath}`);
      }
    }
    console.log();
  }

  // Progress (only show if we have tracking)
  if (progress.total > 0 || tasks.length > 0) {
    console.log(WORKFLOW_MESSAGES.progressTitle);
    if (state === 'all_done') {
      console.log(WORKFLOW_MESSAGES.progressCompleteWithCheck(progress.complete, progress.total));
    } else {
      console.log(WORKFLOW_MESSAGES.progressComplete(progress.complete, progress.total));
    }
    console.log();
  }

  // Tasks
  if (tasks.length > 0) {
    console.log(WORKFLOW_MESSAGES.tasksTitle);
    for (const task of tasks) {
      const checkbox = task.done ? '[x]' : '[ ]';
      console.log(`- ${checkbox} ${task.description}`);
    }
    console.log();
  }

  // Instruction
  console.log(WORKFLOW_MESSAGES.instructionTitle);
  console.log(instruction);
}

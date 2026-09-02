import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { JsonConverter } from '../core/converters/json-converter.js';
import { Validator } from '../core/validation/validator.js';
import { VALIDATION_MESSAGES } from '../core/validation/constants.js';
import { ChangeParser } from '../core/parsers/change-parser.js';
import { Change, type Delta } from '../core/schemas/index.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { discoverSpecFiles } from '../utils/spec-discovery.js';
import {
  foldRequirementName,
  parseDeltaSpec,
} from '../core/parsers/requirement-blocks.js';
import {
  extractRequirementBlock,
  diffRequirementBlock,
  buildRenameMap,
} from '../utils/requirement-diff.js';
import { CHANGE_MESSAGES } from '../messages/index.js';

/**
 * True only when `target` is definitively absent. An EACCES or I/O failure
 * means existence cannot be determined, so callers fall through to their
 * read-error path rather than claim the file was never written.
 */
async function isDefinitelyMissing(target: string): Promise<boolean> {
  return fs
    .access(target)
    .then(() => false)
    .catch((error: NodeJS.ErrnoException) => error?.code === 'ENOENT');
}

/**
 * A change is a directory directly under changes/. Rejecting anything else up
 * front keeps a traversing name (`../..`) from reading a proposal outside the
 * changes directory, and keeps the missing-proposal message honest.
 */
function isChangeDirectoryName(changesPath: string, changeDir: string): boolean {
  return path.dirname(path.resolve(changeDir)) === path.resolve(changesPath);
}

/** One requirement of one delta spec, paired with its main-spec counterpart. */
interface RequirementDiff {
  capability: string;
  operation: 'ADDED' | 'REMOVED' | 'RENAMED' | 'MODIFIED';
  requirementName: string;
  raw: string;
  diff?: string;
  rename?: { from: string; to: string };
  warning?: string;
}

/** A JSON delta carrying the extra fields `--diff` adds to MODIFIED entries. */
type DeltaWithDiff = Delta & { diff?: string; warning?: string };

export class ChangeCommand {
  private converter: JsonConverter;

  constructor() {
    this.converter = new JsonConverter();
  }

  /**
   * Show a change proposal.
   * - Text mode: raw markdown passthrough (no filters)
   * - JSON mode: minimal object with deltas; --deltas-only returns same object with filtered deltas
   *   Note: --requirements-only is deprecated alias for --deltas-only
   * - --diff: per-requirement diffs of the delta specs against the main specs,
   *   appended in text mode and attached to MODIFIED deltas in JSON mode
   */
  async show(changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; diff?: boolean; noInteractive?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'openspec', 'changes');

    if (!changeName) {
      const canPrompt = isInteractive(options);
      // Offer exactly the changes `show <name>` can resolve.
      const changes = await getActiveChangeIds();
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: CHANGE_MESSAGES.selectChangeToShow,
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          console.error(CHANGE_MESSAGES.noChangeSpecifiedNoActive);
        } else {
          console.error(CHANGE_MESSAGES.noChangeSpecifiedAvailable(changes.join(', ')));
        }
        console.error(CHANGE_MESSAGES.hintViewChanges);
        process.exitCode = 1;
        return;
      }
    }

    const changeDir = path.join(changesPath, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');

    if (!isChangeDirectoryName(changesPath, changeDir)) {
      throw new Error(CHANGE_MESSAGES.changeNotFound(changeName, proposalPath));
    }

    try {
      await fs.access(proposalPath);
    } catch {
      // A change can exist without a proposal: `openspec new change` scaffolds
      // only .openspec.yaml, and a custom schema need not define a proposal
      // artifact. Say which of the two cases this is instead of reporting a
      // change that does exist as missing. A stray file under changes/ is not a
      // change, and naming it one would point the user at a `status --change`
      // call that cannot work.
      const isChangeDirectory = await fs
        .stat(changeDir)
        .then((stats) => stats.isDirectory())
        .catch(() => false);
      if (isChangeDirectory) {
        throw new Error(CHANGE_MESSAGES.changeNoProposalYet(changeName));
      }
      throw new Error(CHANGE_MESSAGES.changeNotFound(changeName, proposalPath));
    }
    FileSystemUtils.assertPathWithin(path.dirname(proposalPath), proposalPath);

    if (options?.json) {
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const jsonOutput = await this.converter.convertChangeToJson(proposalPath);

      if (options.requirementsOnly) {
        console.error(CHANGE_MESSAGES.requirementsOnlyDeprecated);
      }

      const parsed: Change = JSON.parse(jsonOutput);
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const contentForTitle = await fs.readFile(proposalPath, 'utf-8');
      const title = this.extractTitle(contentForTitle, changeName);
      const id = parsed.name;
      const deltas = parsed.deltas || [];

      if (options.diff) {
        await this.enrichDeltasWithDiffs(deltas, changeName, changesPath);
      }

      const output = {
        id,
        title,
        deltaCount: deltas.length,
        deltas,
      };
      console.log(JSON.stringify(output, null, 2));
    } else {
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const content = await fs.readFile(proposalPath, 'utf-8');
      console.log(content);

      if (options?.diff) {
        await this.showSpecDiffs(changeName, changesPath);
      }
    }
  }

  /**
   * Read every delta spec under the change and pair each requirement with its
   * counterpart in the main spec. Text mode and JSON mode both render from this
   * one pass, so the two surfaces cannot drift apart.
   */
  private async collectSpecDiffs(
    changeName: string,
    changesPath: string
  ): Promise<{ capabilities: string[]; results: RequirementDiff[] }> {
    const specsDir = path.join(changesPath, changeName, 'specs');
    // Derived from changesPath so the main specs come from the same root as the
    // change — the same derivation `validate()` already uses.
    const mainSpecsDir = path.join(path.dirname(changesPath), 'specs');

    // Same discovery ChangeParser uses, so a nested capability (specs/<area>/<id>)
    // is diffed rather than silently skipped, and the ids here match the `spec`
    // field of the JSON deltas.
    const discovered = await discoverSpecFiles(specsDir);

    const capabilities = discovered.map(spec => spec.id);
    const results: RequirementDiff[] = [];

    for (const { id: capability, specFile: deltaSpecPath } of discovered) {
      const deltaContent = await fs.readFile(deltaSpecPath, 'utf-8');

      const mainSpecPath = path.join(mainSpecsDir, ...capability.split('/'), 'spec.md');
      let mainContent: string | null = null;
      try {
        FileSystemUtils.assertPathWithin(mainSpecsDir, mainSpecPath);
        mainContent = await fs.readFile(mainSpecPath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
        // No main spec on disk. For ADDED requirements that is the ordinary new
        // capability case; MODIFIED requirements are handled as a mismatch below.
      }

      const plan = parseDeltaSpec(deltaContent);
      const renameMap = buildRenameMap(plan.renamed);

      for (const block of plan.added) {
        results.push({ capability, operation: 'ADDED', requirementName: block.name, raw: block.raw });
      }

      // Prefer the authored REMOVED block so its Reason/Migration text reaches
      // the reader; the bullet-list form carries a name and nothing else.
      const removedBlocks = new Map(
        plan.removedBlocks.map(block => [foldRequirementName(block.name), block.raw])
      );
      for (const name of plan.removed) {
        const raw = removedBlocks.get(foldRequirementName(name));
        results.push({
          capability,
          operation: 'REMOVED',
          requirementName: name,
          raw: raw ?? `### Requirement: ${name}`,
        });
      }

      for (const rename of plan.renamed) {
        results.push({ capability, operation: 'RENAMED', requirementName: rename.to, raw: '', rename });
      }

      for (const block of plan.modified) {
        const entry: RequirementDiff = {
          capability,
          operation: 'MODIFIED',
          requirementName: block.name,
          raw: block.raw,
        };

        // A requirement renamed and modified in the same delta still lives in
        // the main spec under its old name, so look it up there.
        const oldName = renameMap.get(foldRequirementName(block.name));
        const lookupName = oldName ?? block.name;

        const match = mainContent ? extractRequirementBlock(mainContent, lookupName) : null;
        if (match) {
          entry.diff = diffRequirementBlock(match.raw, block.raw, `${capability}/${block.name}`);
          if (!match.exact) {
            // Archive matches requirement names exactly, so a header that
            // differs only in case or spacing will not merge. Show the diff the
            // author meant, and name the mismatch while it is still cheap to fix.
            entry.warning = CHANGE_MESSAGES.diffHeaderNearMiss(match.name);
          }
        } else if (mainContent) {
          entry.warning = CHANGE_MESSAGES.diffNoMatchingRequirement(lookupName, capability);
        } else {
          // A MODIFIED requirement names a block that should already exist, so a
          // missing main spec is an authoring error, not a new capability.
          // Rendering it as all-additions would hide what archive will reject.
          entry.warning = CHANGE_MESSAGES.diffNoMainSpec(capability, block.name);
        }

        results.push(entry);
      }
    }

    return { capabilities, results };
  }

  /**
   * Attach `diff` (or `warning`) to every MODIFIED delta in the JSON payload.
   * Mutates the deltas array in place.
   *
   * The parsed Delta objects carry the requirement body in `description`, not
   * the header name, so they are matched to parsed blocks by capability and
   * source order: ChangeParser emits one Delta per MODIFIED block in that order.
   */
  private async enrichDeltasWithDiffs(deltas: Delta[], changeName: string, changesPath: string): Promise<void> {
    const modifiedDeltasBySpec = new Map<string, Delta[]>();
    for (const delta of deltas) {
      if (!delta.spec || delta.operation !== 'MODIFIED') continue;
      const list = modifiedDeltasBySpec.get(delta.spec) ?? [];
      list.push(delta);
      modifiedDeltasBySpec.set(delta.spec, list);
    }
    if (modifiedDeltasBySpec.size === 0) return;

    const { results } = await this.collectSpecDiffs(changeName, changesPath);
    const modifiedEntriesBySpec = new Map<string, RequirementDiff[]>();
    for (const entry of results) {
      if (entry.operation !== 'MODIFIED') continue;
      const list = modifiedEntriesBySpec.get(entry.capability) ?? [];
      list.push(entry);
      modifiedEntriesBySpec.set(entry.capability, list);
    }

    for (const [capability, modifiedDeltas] of modifiedDeltasBySpec) {
      const entries = modifiedEntriesBySpec.get(capability) ?? [];
      for (let i = 0; i < modifiedDeltas.length && i < entries.length; i++) {
        const entry = entries[i];
        if (entry.diff !== undefined) {
          (modifiedDeltas[i] as DeltaWithDiff).diff = entry.diff;
        }
        if (entry.warning !== undefined) {
          (modifiedDeltas[i] as DeltaWithDiff).warning = entry.warning;
        }
      }
    }
  }

  /**
   * Text mode: per-requirement diffs of the delta specs against the main specs.
   */
  private async showSpecDiffs(changeName: string, changesPath: string): Promise<void> {
    const { capabilities, results } = await this.collectSpecDiffs(changeName, changesPath);

    console.log();
    if (capabilities.length === 0 || results.length === 0) {
      // Not an error: a change can be proposal-only. Saying so beats printing a
      // heading with nothing under it.
      console.log(CHANGE_MESSAGES.noDeltaSpecsToDiff(changeName));
      return;
    }

    console.log(chalk.bold(CHANGE_MESSAGES.specDiffsHeading));
    console.log();
    this.printDiffText(results);
  }

  private printDiffText(results: RequirementDiff[]): void {
    let currentCap = '';

    for (const r of results) {
      if (r.capability !== currentCap) {
        if (currentCap) console.log();
        currentCap = r.capability;
        console.log(chalk.bold.underline(currentCap));
        console.log();
      }

      switch (r.operation) {
        case 'ADDED':
          console.log(chalk.green.bold(CHANGE_MESSAGES.diffLabelAdded(r.requirementName)));
          for (const line of r.raw.split('\n')) {
            console.log(chalk.green(`    ${line}`));
          }
          console.log();
          break;

        case 'REMOVED':
          console.log(chalk.red.bold(CHANGE_MESSAGES.diffLabelRemoved(r.requirementName)));
          for (const line of r.raw.split('\n')) {
            console.log(chalk.red(`    ${line}`));
          }
          console.log();
          break;

        case 'RENAMED':
          console.log(
            chalk.cyan.bold(CHANGE_MESSAGES.diffLabelRenamed(r.rename?.from ?? '', r.rename?.to ?? ''))
          );
          console.log();
          break;

        case 'MODIFIED':
          console.log(chalk.yellow.bold(CHANGE_MESSAGES.diffLabelModified(r.requirementName)));
          if (r.warning) {
            console.log(chalk.yellow(`    ⚠ ${r.warning}`));
          }
          // A near-miss header carries both: the warning about the mismatch and
          // the diff against the block it almost matched.
          if (r.diff === undefined) {
            for (const line of r.raw.split('\n')) {
              console.log(`    ${line}`);
            }
          } else if (r.diff === '') {
            console.log(chalk.dim(`    ${CHANGE_MESSAGES.noTextualChanges}`));
          } else {
            for (const line of r.diff.split('\n')) {
              if (line.startsWith('+')) {
                console.log(chalk.green(`    ${line}`));
              } else if (line.startsWith('-')) {
                console.log(chalk.red(`    ${line}`));
              } else {
                console.log(`    ${line}`);
              }
            }
          }
          console.log();
          break;
      }
    }
  }

  /**
   * List active changes.
   * - Text default: IDs only; --long prints minimal details (title, counts)
   * - JSON: array of { id, title, deltaCount, taskStatus }, sorted by id
   */
  async list(options?: { json?: boolean; long?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'openspec', 'changes');
    
    // Same directory-based resolution as `openspec list`, the command this
    // deprecated alias points users at. Every output path below already
    // tolerates a change whose proposal.md is missing or unreadable.
    const changes = await getActiveChangeIds();

    if (options?.json) {
      const changeDetails = await Promise.all(
        changes.map(async (changeName) => {
          const changeDir = path.join(changesPath, changeName);
          const proposalPath = path.join(changeDir, 'proposal.md');

          // Resolve task progress through the shared tracked-tasks helper so
          // this deprecated noun-form list cannot re-fork the resolution
          // (#1202). Tasks are independent of the proposal: a change can carry
          // tasks before, or without, a proposal.md.
          const taskStatus = await getTaskProgressForChange(changesPath, changeName, process.cwd());

          // No proposal yet is an ordinary state (scaffolded change, or a
          // schema with no proposal artifact), so name the change rather than
          // labelling it Unknown. Unknown stays for a proposal that exists but
          // cannot be read or parsed.
          if (await isDefinitelyMissing(proposalPath)) {
            return { id: changeName, title: changeName, deltaCount: 0, taskStatus };
          }

          try {
            FileSystemUtils.assertPathWithin(changeDir, proposalPath);
            const content = await fs.readFile(proposalPath, 'utf-8');
            const parser = new ChangeParser(content, changeDir);
            const change = await parser.parseChangeWithDeltas(changeName);

            return {
              id: changeName,
              title: this.extractTitle(content, changeName),
              deltaCount: change.deltas.length,
              taskStatus,
            };
          } catch {
            return { id: changeName, title: 'Unknown', deltaCount: 0, taskStatus };
          }
        })
      );
      
      const sorted = changeDetails.sort((a, b) => a.id.localeCompare(b.id));
      console.log(JSON.stringify(sorted, null, 2));
    } else {
      if (changes.length === 0) {
        console.log(CHANGE_MESSAGES.noItemsFound);
        return;
      }
      const sorted = [...changes].sort();
      if (!options?.long) {
        // IDs only
        sorted.forEach(id => console.log(id));
        return;
      }

      // Long format: id: title and minimal counts
      for (const changeName of sorted) {
        const changeDir = path.join(changesPath, changeName);
        const proposalPath = path.join(changeDir, 'proposal.md');
        const { total, completed } = await getTaskProgressForChange(changesPath, changeName, process.cwd());
        const taskStatusText = total > 0 ? ` ${CHANGE_MESSAGES.tasks(completed, total)}` : '';
        if (await isDefinitelyMissing(proposalPath)) {
          console.log(`${changeName}: ${CHANGE_MESSAGES.noProposalYet}${taskStatusText}`);
          continue;
        }
        try {
          FileSystemUtils.assertPathWithin(changeDir, proposalPath);
          const content = await fs.readFile(proposalPath, 'utf-8');
          const title = this.extractTitle(content, changeName);
          const parser = new ChangeParser(content, changeDir);
          const change = await parser.parseChangeWithDeltas(changeName);
          const deltaCountText = CHANGE_MESSAGES.deltas(change.deltas.length);
          console.log(`${changeName}: ${title}${deltaCountText}${taskStatusText}`);
        } catch {
          console.log(`${changeName}: ${CHANGE_MESSAGES.unableToRead}${taskStatusText}`);
        }
      }
    }
  }

  async validate(changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'openspec', 'changes');
    
    if (!changeName) {
      const canPrompt = isInteractive(options);
      const changes = await getActiveChangeIds();
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: CHANGE_MESSAGES.selectChangeToValidate,
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          console.error(CHANGE_MESSAGES.noChangeSpecifiedNoActive);
        } else {
          console.error(CHANGE_MESSAGES.noChangeSpecifiedAvailable(changes.join(', ')));
        }
        console.error(CHANGE_MESSAGES.hintViewChanges);
        process.exitCode = 1;
        return;
      }
    }
    
    const changeDir = path.join(changesPath, changeName);
    if (!isChangeDirectoryName(changesPath, changeDir)) {
      throw new Error(CHANGE_MESSAGES.changeNotFound(changeName, changeDir));
    }
    try {
      await fs.access(changeDir);
    } catch {
      throw new Error(CHANGE_MESSAGES.changeNotFound(changeName, changeDir));
    }
    
    const validator = new Validator(options?.strict || false);
    const report = await validator.validateChangeDeltaSpecs(changeDir, {
      // Derived from changesPath so the main specs come from the same root the
      // change itself was resolved against.
      mainSpecsDir: path.join(path.dirname(changesPath), 'specs'),
      projectRoot: path.dirname(path.dirname(changesPath)),
    });
    
    if (options?.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      if (report.valid) {
        console.log(CHANGE_MESSAGES.changeIsValid(changeName));
      } else {
        console.error(CHANGE_MESSAGES.changeHasIssues(changeName));
        report.issues.forEach(issue => {
          const label = issue.level === 'ERROR' ? 'ERROR' : 'WARNING';
          const prefix = issue.level === 'ERROR' ? '✗' : '⚠';
          console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
        });
        // Next steps footer to guide fixing issues
        this.printNextSteps(report.issues);
        if (!options?.json) {
          process.exitCode = 1;
        }
      }
    }
  }

  private extractTitle(content: string, changeName: string): string {
    const match = content.match(/^#\s+(?:Change:\s+)?(.+)$/im);
    return match ? match[1].trim() : changeName;
  }

  private printNextSteps(issues: Array<{ message: string }> = []): void {
    const bullets: string[] = [];
    // Branch on the exact marker messages: the generic no-deltas guidance
    // also mentions skip_specs and must not trigger the marker bullets.
    const conflictIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_CONFLICT)
    );
    const invalidMarkerIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_INVALID_METADATA)
    );
    if (conflictIssue) {
      bullets.push(CHANGE_MESSAGES.skipSpecsConflictRemoveFiles);
      bullets.push(CHANGE_MESSAGES.skipSpecsConflictValidMetadata);
    } else if (invalidMarkerIssue) {
      bullets.push(CHANGE_MESSAGES.skipSpecsInvalidFixMetadata);
      bullets.push(CHANGE_MESSAGES.skipSpecsInvalidOrRemove);
    } else {
      bullets.push(CHANGE_MESSAGES.ensureDeltasInSpecs);
      bullets.push(CHANGE_MESSAGES.eachRequirementNeedsScenario);
      bullets.push(CHANGE_MESSAGES.debugParsedDeltas);
    }
    console.error(CHANGE_MESSAGES.nextSteps);
    bullets.forEach(b => console.error(`  ${b}`));
  }
}

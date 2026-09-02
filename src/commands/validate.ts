import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import { VALIDATION_MESSAGES } from '../core/validation/constants.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getSpecIds } from '../utils/item-discovery.js';
import { getAvailableChanges } from './workflow/shared.js';
import { nearestMatches } from '../utils/match.js';
import { CLI_MESSAGES, VALIDATE_MESSAGES } from '../messages/index.js';
import { promises as fs } from 'fs';
import { getTaskProgressDetailForChange, type SchemaGlobCache } from '../utils/task-progress.js';
import { FileSystemUtils } from '../utils/file-system.js';

type ItemType = 'change' | 'spec';

interface ExecuteOptions {
  all?: boolean;
  changes?: boolean;
  specs?: boolean;
  archived?: boolean;
  type?: string;
  strict?: boolean;
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean; // Commander sets this to false when --no-interactive is used
  concurrency?: string;
}

interface BulkItemResult {
  id: string;
  type: ItemType;
  valid: boolean;
  issues: { level: 'ERROR' | 'WARNING' | 'INFO'; path: string; message: string }[];
  durationMs: number;
}

export class ValidateCommand {
  async execute(itemName: string | undefined, options: ExecuteOptions = {}): Promise<void> {
    const interactive = isInteractive(options);

    // Archived-task linting is its own scope: it checks task completion of
    // already-archived changes, not delta specs (whose operations are already
    // applied). Handled before the other bulk flags so `--archived` is explicit
    // and never alters an existing invocation's behavior (#205).
    if (options.archived) {
      await this.runArchivedTaskValidation({
        json: !!options.json,
        noInteractive: resolveNoInteractive(options),
      });
      return;
    }

    // Handle bulk flags first
    if (options.all || options.changes || options.specs) {
      await this.runBulkValidation({
        changes: !!options.all || !!options.changes,
        specs: !!options.all || !!options.specs,
      }, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency, noInteractive: resolveNoInteractive(options) });
      return;
    }

    // No item and no flags
    if (!itemName) {
      if (interactive) {
        await this.runInteractiveSelector({ strict: !!options.strict, json: !!options.json, concurrency: options.concurrency });
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    // Direct item validation with type detection or override
    const typeOverride = this.normalizeType(options.type);
    await this.validateDirectItem(itemName, { typeOverride, strict: !!options.strict, json: !!options.json });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  /**
   * Resolve change IDs by directory existence — the same rule
   * `openspec status`/`instructions` use (`getAvailableChanges`) — rather than
   * requiring `proposal.md`. This lets `validate` resolve a scaffolded or
   * still-authoring change that the sibling commands already resolve (#1182).
   * Sorted to preserve the prior `getActiveChangeIds` ordering.
   */
  private async listChangeIds(): Promise<string[]> {
    const ids = await getAvailableChanges(process.cwd());
    return ids.sort();
  }

  private async runInteractiveSelector(opts: { strict: boolean; json: boolean; concurrency?: string }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    const choice = await select({
      message: VALIDATE_MESSAGES.whatToValidate,
      choices: [
        { name: VALIDATE_MESSAGES.optionAll, value: 'all' },
        { name: VALIDATE_MESSAGES.optionAllChanges, value: 'changes' },
        { name: VALIDATE_MESSAGES.optionAllSpecs, value: 'specs' },
        { name: VALIDATE_MESSAGES.optionPickOne, value: 'one' },
      ],
    });

    if (choice === 'all') return this.runBulkValidation({ changes: true, specs: true }, opts);
    if (choice === 'changes') return this.runBulkValidation({ changes: true, specs: false }, opts);
    if (choice === 'specs') return this.runBulkValidation({ changes: false, specs: true }, opts);

    // one
    const [changes, specs] = await Promise.all([this.listChangeIds(), getSpecIds()]);
    const items: { name: string; value: { type: ItemType; id: string } }[] = [];
    items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change' as const, id } })));
    items.push(...specs.map(id => ({ name: `spec/${id}`, value: { type: 'spec' as const, id } })));
    if (items.length === 0) {
      console.error(VALIDATE_MESSAGES.noItemsToValidate);
      process.exitCode = 1;
      return;
    }
    const picked = await select<{ type: ItemType; id: string }>({ message: VALIDATE_MESSAGES.pickAnItem, choices: items });
    await this.validateByType(picked.type, picked.id, opts);
  }

  private printNonInteractiveHint(): void {
    console.error(VALIDATE_MESSAGES.nothingToValidate);
    console.error(VALIDATE_MESSAGES.validateAllHint);
    console.error(VALIDATE_MESSAGES.validateChangesHint);
    console.error(VALIDATE_MESSAGES.validateSpecsHint);
    console.error(VALIDATE_MESSAGES.validateItemHint);
    console.error(VALIDATE_MESSAGES.runInteractiveHint);
  }

  private async validateDirectItem(itemName: string, opts: { typeOverride?: ItemType; strict: boolean; json: boolean }): Promise<void> {
    const [changes, specs] = await Promise.all([this.listChangeIds(), getSpecIds()]);
    const isChange = changes.includes(itemName);
    const isSpec = specs.includes(itemName);

    const type = opts.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!type) {
      console.error(VALIDATE_MESSAGES.unknownItem(itemName));
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      if (suggestions.length) console.error(VALIDATE_MESSAGES.didYouMean(suggestions.join(', ')));
      process.exitCode = 1;
      return;
    }

    if (!opts.typeOverride && isChange && isSpec) {
      console.error(VALIDATE_MESSAGES.ambiguousItem(itemName));
      console.error(VALIDATE_MESSAGES.passTypeHint);
      process.exitCode = 1;
      return;
    }

    await this.validateByType(type, itemName, opts);
  }

  private async validateByType(type: ItemType, id: string, opts: { strict: boolean; json: boolean }): Promise<void> {
    const validator = new Validator(opts.strict);
    if (type === 'change') {
      const changeDir = path.join(process.cwd(), 'openspec', 'changes', id);
      const start = Date.now();
      const report = await validator.validateChangeDeltaSpecs(changeDir, {
        mainSpecsDir: path.join(process.cwd(), 'openspec', 'specs'),
        projectRoot: process.cwd(),
      });
      const durationMs = Date.now() - start;
      this.printReport('change', id, report, durationMs, opts.json);
      // Non-zero exit if invalid (keeps enriched output test semantics)
      process.exitCode = report.valid ? 0 : 1;
      return;
    }
    const file = path.join(process.cwd(), 'openspec', 'specs', id, 'spec.md');
    const start = Date.now();
    const report = await validator.validateSpec(file);
    const durationMs = Date.now() - start;
    this.printReport('spec', id, report, durationMs, opts.json);
    process.exitCode = report.valid ? 0 : 1;
  }

  private printReport(type: ItemType, id: string, report: { valid: boolean; issues: any[] }, durationMs: number, json: boolean): void {
    if (json) {
      const out = { items: [{ id, type, valid: report.valid, issues: report.issues, durationMs }], summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { [type]: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } }, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (report.valid) {
      console.log(type === 'change' ? VALIDATE_MESSAGES.changeIsValid(id) : VALIDATE_MESSAGES.specIsValid(id));
    } else {
      console.error(type === 'change' ? VALIDATE_MESSAGES.changeHasIssues(id) : VALIDATE_MESSAGES.specHasIssues(id));
      for (const issue of report.issues) {
        const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
      }
      this.printNextSteps(type, report.issues);
    }
  }

  private printNextSteps(type: ItemType, issues: Array<{ message: string }> = []): void {
    const bullets: string[] = [];
    // The delta-authoring bullets contradict a marker-related error ("add
    // deltas" vs "remove skip_specs or the files"), so branch on the exact
    // marker messages - the generic no-deltas guidance also mentions
    // skip_specs, which must not trigger this.
    const conflictIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_CONFLICT)
    );
    const invalidMarkerIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_INVALID_METADATA)
    );
    if (type === 'change' && conflictIssue) {
      bullets.push(VALIDATE_MESSAGES.skipSpecsConflictRemoveFiles);
      bullets.push(VALIDATE_MESSAGES.skipSpecsConflictValidMetadata);
    } else if (type === 'change' && invalidMarkerIssue) {
      bullets.push(VALIDATE_MESSAGES.skipSpecsInvalidFixMetadata);
      bullets.push(VALIDATE_MESSAGES.skipSpecsInvalidOrRemove);
    } else if (type === 'change') {
      bullets.push(VALIDATE_MESSAGES.ensureDeltasInSpecs);
      bullets.push(VALIDATE_MESSAGES.eachRequirementNeedsScenario);
      bullets.push(VALIDATE_MESSAGES.debugParsedDeltas);
    } else {
      bullets.push(VALIDATE_MESSAGES.ensurePurposeAndRequirements);
      bullets.push(VALIDATE_MESSAGES.requirementScenarioBullet);
      bullets.push(VALIDATE_MESSAGES.rerunWithJson);
    }
    console.error(type === 'change' ? VALIDATE_MESSAGES.nextStepsChange : VALIDATE_MESSAGES.nextStepsSpec);
    bullets.forEach(b => console.error(`  ${b}`));
  }

  private async runBulkValidation(scope: { changes: boolean; specs: boolean }, opts: { strict: boolean; json: boolean; concurrency?: string; noInteractive?: boolean }): Promise<void> {
    const spinner = !opts.json && !opts.noInteractive ? ora(VALIDATE_MESSAGES.validating).start() : undefined;
    const [changeIds, specIds] = await Promise.all([
      scope.changes ? this.listChangeIds() : Promise.resolve<string[]>([]),
      scope.specs ? getSpecIds() : Promise.resolve<string[]>([]),
    ]);

    const DEFAULT_CONCURRENCY = 6;
    const maxSuggestions = 5; // used by nearestMatches
    const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.OPENSPEC_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
    const validator = new Validator(opts.strict);
    const queue: Array<() => Promise<BulkItemResult>> = [];

    for (const id of changeIds) {
      queue.push(async () => {
        const start = Date.now();
        const changeDir = path.join(process.cwd(), 'openspec', 'changes', id);
        const report = await validator.validateChangeDeltaSpecs(changeDir, {
          mainSpecsDir: path.join(process.cwd(), 'openspec', 'specs'),
          projectRoot: process.cwd(),
        });
        const durationMs = Date.now() - start;
        return { id, type: 'change' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const id of specIds) {
      queue.push(async () => {
        const start = Date.now();
        const file = path.join(process.cwd(), 'openspec', 'specs', id, 'spec.md');
        const report = await validator.validateSpec(file);
        const durationMs = Date.now() - start;
        return { id, type: 'spec' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }

    if (queue.length === 0) {
      spinner?.stop();

      const summary = {
        totals: { items: 0, passed: 0, failed: 0 },
        byType: {
          ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.specs ? { spec: { items: 0, passed: 0, failed: 0 } } : {}),
        },
      } as const;

      if (opts.json) {
        const out = { items: [] as BulkItemResult[], summary, version: '1.0' };
        console.log(JSON.stringify(out, null, 2));
      } else {
        console.log(VALIDATE_MESSAGES.noItemsFoundToValidate);
      }

      process.exitCode = 0;
      return;
    }

    const results: BulkItemResult[] = [];
    let index = 0;
    let running = 0;
    let passed = 0;
    let failed = 0;

    await new Promise<void>((resolve) => {
      const next = () => {
        while (running < concurrency && index < queue.length) {
          const currentIndex = index++;
          const task = queue[currentIndex];
          running++;
          if (spinner) spinner.text = VALIDATE_MESSAGES.validatingProgress(currentIndex + 1, queue.length);
          task()
            .then(res => {
              results.push(res);
              if (res.valid) passed++; else failed++;
            })
            .catch((error: any) => {
              const message = error?.message || CLI_MESSAGES.unknownError;
              const res: BulkItemResult = { id: getPlannedId(currentIndex, changeIds, specIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, specIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
              results.push(res);
              failed++;
            })
            .finally(() => {
              running--;
              if (index >= queue.length && running === 0) resolve();
              else next();
            });
        }
      };
      next();
    });

    spinner?.stop();

    results.sort((a, b) => a.id.localeCompare(b.id));
    const summary = {
      totals: { items: results.length, passed, failed },
      byType: {
        ...(scope.changes ? { change: summarizeType(results, 'change') } : {}),
        ...(scope.specs ? { spec: summarizeType(results, 'spec') } : {}),
      },
    } as const;

    if (opts.json) {
      const out = { items: results, summary, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
    } else {
      for (const res of results) {
        if (res.valid) console.log(`✓ ${res.type}/${res.id}`);
        else console.error(`✗ ${res.type}/${res.id}`);
      }
      console.log(VALIDATE_MESSAGES.totals(summary.totals.passed, summary.totals.failed, summary.totals.items));
    }

    process.exitCode = failed > 0 ? 1 : 0;
  }

  /**
   * Lists archived change ids from `openspec/changes/archive`, mirroring
   * `getArchivedChangeIds` (item-discovery) but failing loudly. Directories
   * only, hidden entries skipped — which also excludes the archive lock file
   * (`.openspec-archive.lock`) and in-flight move staging dirs
   * (`.openspec-move-*`), so neither can be reported as an archived change.
   *
   * Only a missing archive directory (ENOENT) is an empty list; a permission
   * error, an I/O error, or an `archive` path that is a file (ENOTDIR) is a real
   * failure and must not read as "no archived changes" — that would let a
   * pre-commit lint pass without inspecting anything (#205).
   */
  private async listArchivedChangeIds(archiveDir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(archiveDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort();
    } catch (error: any) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  }

  /**
   * Validates that every archived change has all of its tasks completed.
   *
   * An archived change is expected to be finished; an archived change with
   * unchecked tasks is a real integrity problem the normal validate flow never
   * surfaces, because active-change discovery excludes the archive directory
   * (#205). Reuses the same task-progress counting `status`, `list`, and
   * `archive` rely on, so what counts as a task never forks. Changes with no
   * tasks pass (nothing to complete).
   */
  private async runArchivedTaskValidation(
    opts: { json: boolean; noInteractive?: boolean }
  ): Promise<void> {
    const projectRoot = process.cwd();
    const archiveDir = path.join(projectRoot, 'openspec', 'changes', 'archive');
    // List first (may throw on a real archive-read failure), then start the
    // spinner so a thrown error never leaves a spinner spinning.
    const ids = await this.listArchivedChangeIds(archiveDir);
    const spinner = !opts.json && !opts.noInteractive ? ora(VALIDATE_MESSAGES.validatingArchived).start() : undefined;

    // The archive is append-only and can hold thousands of changes; a single
    // run resolves them all under one constant projectRoot, so memoize the
    // schema→glob lookup to avoid re-parsing the same schema.yaml once per
    // change. The loop is intentionally sequential: the per-change work is
    // dominated by synchronous schema/config resolution, which a promise pool
    // cannot overlap on Node's single thread — a pool would add complexity for
    // no real gain here.
    const schemaGlobCache: SchemaGlobCache = new Map();
    const results: BulkItemResult[] = [];
    let passed = 0;
    let failed = 0;
    for (const id of ids) {
      const start = Date.now();
      const issues: BulkItemResult['issues'] = [];
      try {
        // The explicit projectRoot override is load-bearing: an archived change
        // lives one directory deeper (changes/archive/<id>), so the default
        // "../../.." projectRoot derivation would be wrong without it.
        const progress = await getTaskProgressDetailForChange(archiveDir, id, projectRoot, schemaGlobCache);
        // A tasks file that exists but cannot be read must fail loudly, not be
        // silently counted as "no tasks" and pass. Report one issue per file,
        // pathed like every other validate issue (POSIX, root-relative).
        for (const file of progress.unreadable) {
          issues.push({
            level: 'ERROR',
            path: FileSystemUtils.toPosixPath(path.relative(projectRoot, file)),
            message: VALIDATE_MESSAGES.couldNotReadTaskFile,
          });
        }
        const incomplete = Math.max(progress.total - progress.completed, 0);
        if (incomplete > 0) {
          issues.push({
            level: 'ERROR',
            path: 'tasks.md',
            message: VALIDATE_MESSAGES.incompleteTasks(incomplete, progress.completed, progress.total),
          });
        }
      } catch (error: any) {
        issues.push({ level: 'ERROR', path: 'tasks.md', message: error?.message || CLI_MESSAGES.unknownError });
      }
      const valid = issues.length === 0;
      if (valid) passed++; else failed++;
      results.push({ id, type: 'change', valid, issues, durationMs: Date.now() - start });
    }

    spinner?.stop();

    const summary = {
      totals: { items: results.length, passed, failed },
      byType: { change: summarizeType(results, 'change') },
    } as const;

    if (opts.json) {
      const out = { items: results, summary, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
      process.exitCode = failed > 0 ? 1 : 0;
      return;
    }

    if (results.length === 0) {
      console.log(VALIDATE_MESSAGES.noArchivedChangesFound);
      process.exitCode = 0;
      return;
    }

    // Use the same `<type>/<id>` prefix bulk validation prints, so the plain
    // output maps to the JSON `type` ('change') and stays greppable the same way.
    for (const res of results) {
      if (res.valid) {
        console.log(`✓ change/${res.id}`);
      } else {
        console.error(`✗ change/${res.id}`);
        for (const issue of res.issues) {
          const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
          console.error(`  ${prefix} ${issue.message}`);
        }
      }
    }
    console.log(VALIDATE_MESSAGES.totals(summary.totals.passed, summary.totals.failed, summary.totals.items));
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

function summarizeType(results: BulkItemResult[], type: ItemType) {
  const filtered = results.filter(r => r.type === type);
  const items = filtered.length;
  const passed = filtered.filter(r => r.valid).length;
  const failed = items - passed;
  return { items, passed, failed };
}

function normalizeConcurrency(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

function getPlannedId(index: number, changeIds: string[], specIds: string[]): string | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return changeIds[index];
  const specIndex = index - totalChanges;
  return specIds[specIndex];
}

function getPlannedType(index: number, changeIds: string[], specIds: string[]): ItemType | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return 'change';
  const specIndex = index - totalChanges;
  if (specIndex >= 0 && specIndex < specIds.length) return 'spec';
  return undefined;
}

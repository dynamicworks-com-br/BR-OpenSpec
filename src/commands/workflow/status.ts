/**
 * Status Command
 *
 * Displays artifact completion status for one change or every active change.
 */

import ora from 'ora';
import chalk from 'chalk';
import {
  loadChangeContext,
  formatChangeStatus,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  getAvailableChanges,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';
import { WORKFLOW_MESSAGES } from '../../messages/index.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  all?: boolean;
  schema?: string;
  json?: boolean;
}

// Per-change diagnostic carried inside the --all envelope. Same shape as the
// upstream StoreDiagnostic (severity/code/message) so agents can parse both,
// without depending on the deferred store subsystem.
interface BatchStatusDiagnostic {
  severity: 'error';
  code: string;
  message: string;
}

// A batch entry is either a fully loaded status or, for a change that failed
// to load, the change name plus the diagnostic — the sweep never aborts.
type BatchStatusEntry = ChangeStatus | { changeName: string; status: BatchStatusDiagnostic[] };

function asBatchDiagnostic(error: unknown, code: string): BatchStatusDiagnostic {
  return {
    severity: 'error',
    code,
    message: error instanceof Error ? error.message : String(error),
  };
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  // Checked before the spinner starts so a thrown error never leaves one running.
  if (options.all && options.change) {
    throw new Error(WORKFLOW_MESSAGES.allAndChangeMutuallyExclusive);
  }

  const spinner = options.json ? undefined : ora(WORKFLOW_MESSAGES.loadingChangeStatus).start();

  try {
    const projectRoot = process.cwd();

    // Single definition of "load one change's status" so the batch and
    // single-change payloads can never drift apart.
    const loadStatus = (changeName: string): ChangeStatus =>
      formatChangeStatus(loadChangeContext(projectRoot, changeName, options.schema));

    // Handle no-changes case gracefully — status is informational,
    // so "no changes" is a valid state, not an error.
    if (!options.change) {
      // Validate before the no-changes early return so a bogus --schema
      // fails the same way whether or not any change exists yet.
      if (options.all && options.schema) {
        validateSchemaExists(options.schema, projectRoot);
      }

      const available = await getAvailableChanges(projectRoot);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          console.log(JSON.stringify({ changes: [], message: WORKFLOW_MESSAGES.noActiveChanges }, null, 2));
          return;
        }
        console.log(WORKFLOW_MESSAGES.noActiveChanges);
        return;
      }

      if (options.all) {
        // readdir order is platform-dependent; sort for deterministic output,
        // with the same comparator validate --all uses so the two batch
        // commands order a given change set identically.
        const entries: BatchStatusEntry[] = [];
        for (const changeName of available.sort((a, b) => a.localeCompare(b))) {
          try {
            entries.push(loadStatus(changeName));
          } catch (error) {
            // One malformed change must not blank the sweep; carry its
            // diagnostic in place and keep going.
            entries.push({ changeName, status: [asBatchDiagnostic(error, 'change_error')] });
          }
        }

        spinner?.stop();
        const failed = entries.some((entry) => !('artifacts' in entry));

        if (options.json) {
          console.log(JSON.stringify({ changes: entries }, null, 2));
          if (failed) {
            process.exitCode = 1;
          }
          return;
        }

        entries.forEach((entry, index) => {
          if (index > 0) {
            console.log();
          }
          if ('artifacts' in entry) {
            printStatusText(entry);
          } else {
            console.log(
              chalk.red(
                WORKFLOW_MESSAGES.statusAllChangeFailed(entry.changeName, entry.status[0]?.message ?? '')
              )
            );
          }
        });
        // A partial load is still a failed command in both output modes;
        // JSON callers can parse the complete envelope independently of
        // the process exit code.
        if (failed) {
          process.exitCode = 1;
        }
        return;
      }

      // Changes exist but neither --change nor --all provided. Name --all
      // here too: it is the other way to answer this prompt, and a caller
      // who wants every change should not have to find it in --help.
      spinner?.stop();
      throw new Error(
        WORKFLOW_MESSAGES.missingChangeOrAllOption(available.join('\n  '))
      );
    }

    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const status = loadStatus(changeName);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const skippedCount = status.artifacts.filter((a) => a.status === 'skipped').length;
  const total = status.artifacts.length - skippedCount;

  console.log(WORKFLOW_MESSAGES.changeLabel(status.changeName));
  console.log(WORKFLOW_MESSAGES.schemaLabel2(status.schemaName));
  if (skippedCount > 0) {
    console.log(WORKFLOW_MESSAGES.progressArtifactsSkipped(doneCount, total, skippedCount));
  } else {
    console.log(WORKFLOW_MESSAGES.progressArtifacts(doneCount, total));
  }
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'skipped') {
      line += color(WORKFLOW_MESSAGES.skippedDeclaresSkipSpecs);
    }

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(WORKFLOW_MESSAGES.blockedBy(artifact.missingDeps.join(', ')));
    }

    console.log(line);
  }

  if (status.isPlanningComplete) {
    console.log();
    console.log(chalk.green(WORKFLOW_MESSAGES.allPlanningArtifactsComplete));
  }
}

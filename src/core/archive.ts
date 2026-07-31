import { promises as fs } from 'fs';
import path from 'path';
import { formatLocalDate } from '../utils/date.js';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import chalk from 'chalk';
import { ARCHIVE_MESSAGES, SPECS_APPLY_MESSAGES } from '../messages/index.js';
import {
  findSpecUpdates,
  buildUpdatedSpec,
  writeUpdatedSpec,
  type SpecUpdate,
} from './specs-apply.js';
import { discoverSpecFiles } from '../utils/spec-discovery.js';
import { isNonInteractivePromptError } from '../utils/interactive.js';

type ArchiveOptions = { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean };

/**
 * Quotes a change name for a `Fix:` line the reader is meant to paste.
 * Archive resolves a change by stat-ing its directory, so the name is
 * whatever the directory is called - including names with spaces or shell
 * metacharacters, which pasted unquoted would run as a second command.
 *
 * Double quotes are the one form bash, zsh, PowerShell and cmd.exe all read
 * the same way, so a POSIX-only `'...'` would be wrong on Windows. Characters
 * that stay inert inside double quotes in every one of those shells are the
 * limit of what can be quoted portably; a name containing anything else has
 * no portable spelling, so the placeholder is named instead of emitting a
 * command that might expand to something the reader did not intend.
 *
 * `%` and `!` are unquotable for the same reason even though POSIX shells
 * leave them alone inside double quotes: cmd.exe expands `%NAME%` inside
 * double quotes, and `!NAME!` expands there too under `setlocal
 * enabledelayedexpansion` (as does `!` under bash's interactive history
 * expansion). A change directory really can be named `%USERNAME%`, and a
 * rerun that silently targets a different change is worse than one the reader
 * has to fill in.
 */
function quoteChangeName(name: string): string {
  if (/^[A-Za-z0-9._-]+$/.test(name)) return name;
  if (!/["\\$`\r\n%!]/.test(name)) return `"${name}"`;
  return '<nome-da-alteração>';
}

/**
 * Renders a change name inside a prose message. The name is a directory name,
 * so it can hold control characters, and human mode prints the message
 * verbatim: a raw CR or LF would let a change directory forge its own `Fix:`
 * line, which is worse here than anywhere else because `quoteChangeName`
 * degrades the real fix to the `<nome-da-alteração>` placeholder for exactly
 * those names - leaving the forged line as the only pasteable command on
 * screen. An ESC could redraw the terminal. Neither survives.
 */
function describeChangeName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, '?');
}

/**
 * Builds the flags a blocked archive's suggested rerun has to reproduce. The
 * caller's own flags are carried, because suggesting a bare `--yes` rerun for
 * `archive x --skip-specs` would merge deltas into the main specs - the exact
 * thing `--skip-specs` was passed to prevent.
 */
function rerunFlags(options: ArchiveOptions): string[] {
  return [
    ...(options.skipSpecs ? ['--skip-specs'] : []),
    ...(options.validate === false || options.noValidate === true ? ['--no-validate'] : []),
    '--yes',
  ];
}

function rerunCommand(changeName: string, options: ArchiveOptions): string {
  const flags = rerunFlags(options).join(' ');
  // A name starting with a dash is read as an option wherever it sits, so it
  // goes last, behind the `--` that ends option parsing.
  if (changeName.startsWith('-')) {
    return `openspec archive ${flags} -- ${quoteChangeName(changeName)}`;
  }
  return `openspec archive ${quoteChangeName(changeName)} ${flags}`;
}

/**
 * Asks a yes/no question in human mode. When no answer can be read — the
 * usual case for an AI agent or a script that runs the command with stdin
 * closed — the raw @inquirer failure is replaced with guidance for this
 * decision point, so the caller learns which flag to pass instead of reading
 * `User force closed the prompt` (#1479).
 */
async function confirmOrBlock(
  prompt: { message: string; default: boolean },
  blocked: () => string
): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  try {
    return await confirm(prompt);
  } catch (error) {
    if (isNonInteractivePromptError(error)) {
      throw new Error(blocked());
    }
    throw error;
  }
}

/**
 * Recursively copy a directory. Used when fs.rename fails (e.g. EPERM on Windows).
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Move a directory from src to dest. On Windows, fs.rename() often fails with
 * EPERM when the directory is non-empty or another process has it open (IDE,
 * file watcher, antivirus). Fall back to copy-then-remove when rename fails
 * with EPERM or EXDEV.
 */
async function moveDirectory(src: string, dest: string): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (err: any) {
    const code = err?.code;
    if (code === 'EPERM' || code === 'EXDEV') {
      await copyDirRecursive(src, dest);
      await fs.rm(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

/**
 * Matches the `YYYY-MM-DD-` prefix that archiving prepends to a change name.
 * A change whose name already starts with one (a common authoring convention)
 * is archived under its existing name so the prefix is never stacked (#1309).
 */
const ARCHIVE_DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

export class ArchiveCommand {
  async execute(
    changeName?: string,
    options: ArchiveOptions = {}
  ): Promise<void> {
    const targetPath = '.';
    const changesDir = path.join(targetPath, 'openspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    const mainSpecsDir = path.join(targetPath, 'openspec', 'specs');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error(ARCHIVE_MESSAGES.noChangesDir);
    }

    // Get change name interactively if not provided
    if (!changeName) {
      const selectedChange = await this.selectChange(changesDir, options);
      if (!selectedChange) {
        console.log(ARCHIVE_MESSAGES.noChangeSelected);
        return;
      }
      changeName = selectedChange;
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.stat(changeDir);
      if (!stat.isDirectory()) {
        throw new Error(ARCHIVE_MESSAGES.changeNotFound(changeName));
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(ARCHIVE_MESSAGES.changeNotFound(changeName));
      }
      throw err;
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (non-blocking unless strict mode desired in future)
      const changeFile = path.join(changeDir, 'proposal.md');
      try {
        await fs.access(changeFile);
        const changeReport = await validator.validateChange(changeFile);
        // Proposal validation is informative only (do not block archive).
        // `validateChange` parses the change together with its delta specs,
        // so it also raises requirement-level issues under
        // `deltas.<n>.requirement(s)`. Those
        // are not proposal problems, and reporting them here was noisy and
        // sometimes wrong (#498): the change parser records every requirement
        // under both `requirement` and `requirements`, so each defect was
        // printed twice, and REMOVED requirements — names-only by design —
        // produced a "missing scenario" warning for a correct removal.
        // Genuine delta defects are still caught below, by the delta spec
        // validation and by the rebuilt-spec check that runs before any write.
        const proposalIssues = changeReport.issues.filter(
          (issue) => !/^deltas\.\d+\.requirements?\./.test(issue.path)
        );
        if (!changeReport.valid && proposalIssues.length > 0) {
          console.log(chalk.yellow(`\n${ARCHIVE_MESSAGES.proposalWarnings}`));
          for (const issue of proposalIssues) {
            const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
            console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
          }
        }
      } catch {
        // Change file doesn't exist, skip validation
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      // A spec.md at the specs/ root is never merged, so archiving a change
      // that has one drops its content whether or not it carries delta headers
      // (#1385). Its existence alone must run validation, which reports it and
      // blocks the archive. A directory named spec.md is a normal capability
      // folder, so only a regular file counts.
      const rootSpecStat = await fs.stat(path.join(changeSpecsDir, 'spec.md')).catch(() => null);
      let hasDeltaSpecs = rootSpecStat?.isFile() === true;
      for (const { specFile } of hasDeltaSpecs ? [] : await discoverSpecFiles(changeSpecsDir)) {
        try {
          const content = await fs.readFile(specFile, 'utf-8');
          // Insensível a caixa para corresponder ao parser de delta, para que
          // um cabeçalho em minúsculas passe pela mesma validação de deltas
          // que o validate executa.
          if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/im.test(content)) {
            hasDeltaSpecs = true;
            break;
          }
        } catch {}
      }
      if (hasDeltaSpecs) {
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationErrorsInDeltas}`));
          for (const issue of deltaReport.issues) {
            if (issue.level === 'ERROR') {
              console.log(chalk.red(`  ✗ ${issue.message}`));
            } else if (issue.level === 'WARNING') {
              console.log(chalk.yellow(`  ⚠ ${issue.message}`));
            }
          }
        }
      }

      if (hasValidationErrors) {
        console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationFailed}`));
        console.log(chalk.yellow(ARCHIVE_MESSAGES.skipValidationHint));
        process.exitCode = 1;
        return;
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();
      
      if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: chalk.yellow(ARCHIVE_MESSAGES.skipValidationWarning),
            default: false
          },
          () => ARCHIVE_MESSAGES.blockedSkipValidation(rerunCommand(changeName!, options))
        );
        if (!proceed) {
          console.log(ARCHIVE_MESSAGES.archiveCancelled);
          return;
        }
      } else {
        console.log(chalk.yellow(`\n${ARCHIVE_MESSAGES.skipValidationFlagWarning}`));
      }
      
      console.log(chalk.yellow(ARCHIVE_MESSAGES.skipValidationLog(timestamp, changeName)));
      console.log(chalk.yellow(ARCHIVE_MESSAGES.affectedFiles(changeDir)));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName, path.resolve(changesDir, '..', '..'));
    const status = formatTaskStatus(progress);
    console.log(ARCHIVE_MESSAGES.taskStatus(status));

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: ARCHIVE_MESSAGES.incompleteTasksWarning(incompleteTasks),
            default: false
          },
          () =>
            ARCHIVE_MESSAGES.blockedIncompleteTasks(
              incompleteTasks,
              describeChangeName(changeName!),
              rerunCommand(changeName!, options)
            )
        );
        if (!proceed) {
          console.log(ARCHIVE_MESSAGES.archiveCancelled);
          return;
        }
      } else {
        console.log(ARCHIVE_MESSAGES.incompleteTasksContinuing(incompleteTasks));
      }
    }

    // Handle spec updates unless skipSpecs flag is set
    if (options.skipSpecs) {
      console.log(ARCHIVE_MESSAGES.skipSpecUpdates);
    } else {
      // Find specs to update
      const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
      
      if (specUpdates.length > 0) {
        console.log(`\n${ARCHIVE_MESSAGES.specsToUpdate}`);
        for (const update of specUpdates) {
          const status = update.exists ? ARCHIVE_MESSAGES.actionUpdate : ARCHIVE_MESSAGES.actionCreate;
          const capability = update.id;
          console.log(ARCHIVE_MESSAGES.specUpdateStatus(capability, status));
        }

        // Monta as atualizações propostas antes de pedir permissão para
        // aplicá-las. buildUpdatedSpec também reporta conteúdo que a mesclagem
        // descartaria, então a confirmação deve vir depois desta prévia.
        const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
        const specWarnings: string[] = [];
        let prepareError: unknown;
        try {
          for (const update of specUpdates) {
            const built = await buildUpdatedSpec(update, changeName!, { silent: true });
            prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
            specWarnings.push(...built.warnings);
          }
        } catch (err: unknown) {
          // O usuário ainda pode recusar as atualizações de spec e arquivar a
          // change, como antes desta prévia existir. Adia o erro até ele aceitar.
          prepareError = err;
        }
        if (prepareError === undefined) {
          for (const warning of specWarnings) {
            console.log(chalk.yellow(SPECS_APPLY_MESSAGES.warning(warning)));
          }
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          shouldUpdateSpecs = await confirmOrBlock(
            {
              message: ARCHIVE_MESSAGES.proceedWithSpecUpdates,
              default: true
            },
            () =>
              ARCHIVE_MESSAGES.blockedSpecUpdatesConfirmation(
                specUpdates.length,
                rerunCommand(changeName!, options)
              )
          );
          if (!shouldUpdateSpecs) {
            console.log(ARCHIVE_MESSAGES.skipSpecUpdatesProceeding);
          }
        }

        if (shouldUpdateSpecs) {
          if (prepareError !== undefined) {
            const message =
              prepareError instanceof Error ? prepareError.message : String(prepareError);
            console.log(message);
            console.log(ARCHIVE_MESSAGES.abortedNoChanges);
            process.exitCode = 1;
            return;
          }

          // All validations passed; pre-validate rebuilt full spec and then write files and display counts
          let totals = { added: 0, modified: 0, removed: 0, renamed: 0 };
          let wroteAny = false;
          for (const p of prepared) {
            const specName = p.update.id;
            if (!skipValidation) {
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationErrorsInRebuiltSpec(specName)}`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                console.log(ARCHIVE_MESSAGES.abortedNoChanges);
                process.exitCode = 1;
                return;
              }
            }
            const { added, modified, removed, renamed } = p.counts;
            if (added + modified + removed + renamed === 0) {
              // Toda operação já estava sincronizada: reescrever o arquivo só
              // despejaria diferenças de normalização nele.
              continue;
            }
            await writeUpdatedSpec(p.update, p.rebuilt, p.counts);
            wroteAny = true;
            totals.added += added;
            totals.modified += modified;
            totals.removed += removed;
            totals.renamed += renamed;
          }
          console.log(
            ARCHIVE_MESSAGES.totals(totals.added, totals.modified, totals.removed, totals.renamed)
          );
          console.log(
            wroteAny
              ? ARCHIVE_MESSAGES.specsUpdatedSuccessfully
              : ARCHIVE_MESSAGES.specsAlreadyInSync
          );
        }
      }
    }

    // Create archive directory with date prefix. Names that already carry
    // one keep it: re-prefixing would stutter the name, and when the archive
    // runs on a later day the folder would sort under a day on which the
    // change did not happen (#1309).
    const archiveName = ARCHIVE_DATE_PREFIX_PATTERN.test(changeName)
      ? changeName
      : `${formatLocalDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Check if archive already exists
    try {
      await fs.access(archivePath);
      throw new Error(ARCHIVE_MESSAGES.archiveAlreadyExists(archiveName));
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create archive directory if needed
    await fs.mkdir(archiveDir, { recursive: true });

    // Move change to archive (uses copy+remove on EPERM/EXDEV, e.g. Windows)
    await moveDirectory(changeDir, archivePath);

    console.log(ARCHIVE_MESSAGES.changeArchived(changeName, archiveName));
  }

  private async selectChange(changesDir: string, options: ArchiveOptions): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();

    if (changeDirs.length === 0) {
      console.log(ARCHIVE_MESSAGES.noActiveChanges);
      return null;
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id, path.resolve(changesDir, '..', '..'));
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: ARCHIVE_MESSAGES.selectChangeToArchive,
        choices
      });
      return answer;
    } catch (error) {
      // Ninguém para escolher da lista: reportar "Nenhuma alteração
      // selecionada" e sair 0 dizia a um agente que o arquivamento teve
      // sucesso quando nada aconteceu (#1479). A reexecução sugerida carrega
      // --yes porque o mesmo chamador não consegue responder às confirmações
      // mais adiante, e carrega as flags do próprio chamador porque descartar
      // --skip-specs aqui sugeriria uma reexecução que mescla os specs que
      // ela foi passada para deixar intocados.
      if (isNonInteractivePromptError(error)) {
        throw new Error(
          ARCHIVE_MESSAGES.blockedChangeNameRequired(
            `openspec archive <nome-da-alteração> ${rerunFlags(options).join(' ')}`
          )
        );
      }
      // User cancelled (Ctrl+C)
      return null;
    }
  }
}

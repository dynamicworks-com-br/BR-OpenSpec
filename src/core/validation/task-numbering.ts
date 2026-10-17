import { parseTaskLines } from '../../utils/task-progress.js';
import { TASK_NUMBERING_MESSAGES } from '../../messages/index.js';

export interface TaskNumberingDocument {
  path: string;
  content: string;
}

export interface TaskNumberingIssue {
  path: string;
  line: number;
  message: string;
}

interface TaskLocation {
  path: string;
  line: number;
}

const LEVEL_TWO_HEADING = /^ {0,3}##(?!#)(?:[ \t]+|[ \t]*\r?$)/;
const NUMBERED_GROUP_HEADING = /^ {0,3}##[ \t]+(\d+)\.(?:[ \t]|\r?$)/;
const TASK_ID = /^(\d+(?:\.\d+)+(?:[A-Za-z]+)?)(?=\s|$)/;

/**
 * Finds ambiguous task references across the task files tracked by a change.
 * Numbering is interpreted only inside `## N.` groups. Unnumbered sections,
 * unnumbered tasks, and files without numbered groups are intentionally ignored.
 */
export function findTaskNumberingIssues(
  documents: readonly TaskNumberingDocument[]
): TaskNumberingIssue[] {
  const issues: TaskNumberingIssue[] = [];
  const firstLocationById = new Map<string, TaskLocation>();

  for (const document of documents) {
    const lines = document.content.split('\n');
    if (!lines.some((line) => NUMBERED_GROUP_HEADING.test(line))) continue;

    let currentGroup: string | undefined;

    lines.forEach((line, index) => {
      if (LEVEL_TWO_HEADING.test(line)) {
        currentGroup = line.match(NUMBERED_GROUP_HEADING)?.[1];
      }
      if (currentGroup === undefined) return;

      const task = parseTaskLines(line)[0];
      const id = task?.description.match(TASK_ID)?.[1];
      if (!id) return;

      const lineNumber = index + 1;
      const taskGroup = id.split('.')[0];
      const normalizedTaskGroup = taskGroup.replace(/^0+(?=\d)/, '');
      const normalizedCurrentGroup = currentGroup.replace(/^0+(?=\d)/, '');
      if (normalizedTaskGroup !== normalizedCurrentGroup) {
        issues.push({
          path: document.path,
          line: lineNumber,
          message: TASK_NUMBERING_MESSAGES.taskGroupMismatch(id, currentGroup, taskGroup),
        });
      }

      const firstLocation = firstLocationById.get(id);
      if (firstLocation !== undefined) {
        const firstDeclaration =
          firstLocation.path === document.path
            ? TASK_NUMBERING_MESSAGES.firstDeclaredOnLine(firstLocation.line)
            : TASK_NUMBERING_MESSAGES.firstDeclaredInFileOnLine(firstLocation.path, firstLocation.line);
        issues.push({
          path: document.path,
          line: lineNumber,
          message: TASK_NUMBERING_MESSAGES.duplicateTaskId(id, firstDeclaration),
        });
      } else {
        firstLocationById.set(id, { path: document.path, line: lineNumber });
      }
    });
  }

  return issues;
}

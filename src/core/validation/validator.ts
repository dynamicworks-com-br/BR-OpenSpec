import { z, ZodError } from 'zod';
import { readFileSync, promises as fs } from 'fs';
import path from 'path';
import { SpecSchema, ChangeSchema, Spec, Change } from '../schemas/index.js';
import { MarkdownParser } from '../parsers/markdown-parser.js';
import { ChangeParser } from '../parsers/change-parser.js';
import { ValidationReport, ValidationIssue, ValidationLevel } from './types.js';
import {
  MIN_PURPOSE_LENGTH,
  MAX_REQUIREMENT_TEXT_LENGTH,
  VALIDATION_MESSAGES
} from './constants.js';
import { parseDeltaSpec, foldRequirementName, normalizeRequirementName, extractRequirementsSection } from '../parsers/requirement-blocks.js';
import {
  extractRequirementBody as extractRequirementBodyShared,
  containsShallOrMust as containsShallOrMustShared,
  countScenarios as countScenariosShared,
} from '../parsers/requirement-text.js';
import { findMainSpecStructureIssues } from '../parsers/spec-structure.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { discoverSpecFiles } from '../../utils/spec-discovery.js';
import { VALIDATOR_MESSAGES } from '../../messages/index.js';

export class Validator {
  private strictMode: boolean;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
  }

  async validateSpec(filePath: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const specName = this.extractNameFromPath(filePath);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parser = new MarkdownParser(content);
      
      const spec = parser.parseSpec(specName);
      
      const result = SpecSchema.safeParse(spec);
      
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      
      issues.push(...this.applySpecRules(spec, content));
      
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : VALIDATOR_MESSAGES.unknownError;
      const enriched = this.enrichTopLevelError(specName, baseMessage);
      issues.push({
        level: 'ERROR',
        path: 'file',
        message: enriched,
      });
    }
    
    return this.createReport(issues);
  }

  /**
   * Validate spec content from a string (used for pre-write validation of rebuilt specs)
   */
  async validateSpecContent(specName: string, content: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    try {
      const parser = new MarkdownParser(content);
      const spec = parser.parseSpec(specName);
      const result = SpecSchema.safeParse(spec);
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      issues.push(...this.applySpecRules(spec, content));
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : VALIDATOR_MESSAGES.unknownError;
      const enriched = this.enrichTopLevelError(specName, baseMessage);
      issues.push({ level: 'ERROR', path: 'file', message: enriched });
    }
    return this.createReport(issues);
  }

  async validateChange(filePath: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const changeName = this.extractNameFromPath(filePath);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const changeDir = path.dirname(filePath);
      const parser = new ChangeParser(content, changeDir);
      
      const change = await parser.parseChangeWithDeltas(changeName);
      
      const result = ChangeSchema.safeParse(change);
      
      if (!result.success) {
        issues.push(...this.convertZodErrors(result.error));
      }
      
      issues.push(...this.applyChangeRules(change, content));
      
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : VALIDATOR_MESSAGES.unknownError;
      const enriched = this.enrichTopLevelError(changeName, baseMessage);
      issues.push({
        level: 'ERROR',
        path: 'file',
        message: enriched,
      });
    }
    
    return this.createReport(issues);
  }

  /**
   * Validate delta-formatted spec files under a change directory.
   * Enforces:
   * - At least one delta across all files
   * - ADDED/MODIFIED: each requirement has SHALL/MUST and at least one scenario
   * - REMOVED: names only; no scenario/description required
   * - RENAMED: pairs well-formed
   * - No duplicates within sections; no cross-section conflicts per spec
   */
  async validateChangeDeltaSpecs(changeDir: string): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const specsDir = path.join(changeDir, 'specs');
    let totalDeltas = 0;
    let hasRootLevelSpec = false;
    const missingHeaderSpecs: string[] = [];
    const emptySectionSpecs: Array<{ path: string; sections: string[] }> = [];

    try {
      // Discover delta specs through the same helper the change parser, show,
      // apply, and archive use, so validate never accepts a layout the merge
      // path silently skips (#1385). It finds spec.md at any depth, covering
      // both specs/<capability>/spec.md and the nested multi-area
      // specs/<area>/<capability>/spec.md layout (#1182b).
      const specFiles = (await discoverSpecFiles(specsDir)).map(spec => spec.specFile);

      // A spec.md directly at the specs/ root has no capability folder, so the
      // merge path drops it: without this error the change validates clean and
      // archives while its requirements never reach openspec/specs/ (#1385).
      // Only a regular file counts — a *directory* named spec.md is a capability
      // folder like any other, and discoverSpecFiles reads it normally.
      const rootSpecStat = await fs.stat(path.join(specsDir, 'spec.md')).catch(() => null);
      hasRootLevelSpec = rootSpecStat?.isFile() === true;
      if (hasRootLevelSpec) {
        issues.push({
          level: 'ERROR',
          path: 'spec.md',
          message: VALIDATOR_MESSAGES.rootLevelDeltaSpec,
        });
      }

      for (const specFile of specFiles) {
        let content: string | undefined;
        try {
          content = await fs.readFile(specFile, 'utf-8');
        } catch {
          continue;
        }

        const plan = parseDeltaSpec(content);
        const entryPath = FileSystemUtils.toPosixPath(path.relative(specsDir, specFile));

        // Surface (as INFO, never a failure) the non-canonical level-3 headers
        // the delta reader skipped while parsing ADDED/MODIFIED sections —
        // without this note a stray divider like "### Documentation
        // Requirements" would pass validate <change> while failing
        // archive/validate <spec>. The list comes from the parse itself, so it
        // reflects exactly what the reader skipped.
        for (const stray of plan.skippedHeaders) {
          const nameless = /^requirement:?$/i.test(stray.header);
          issues.push({
            level: 'INFO',
            path: entryPath,
            line: stray.line,
            message: nameless
              ? VALIDATOR_MESSAGES.skippedHeaderNameless(stray.header, stray.section)
              : VALIDATOR_MESSAGES.skippedHeaderNotRequirement(stray.header, stray.section),
          });
        }

        const sectionNames: string[] = [];
        if (plan.sectionPresence.added) sectionNames.push('## ADDED Requirements');
        if (plan.sectionPresence.modified) sectionNames.push('## MODIFIED Requirements');
        if (plan.sectionPresence.removed) sectionNames.push('## REMOVED Requirements');
        if (plan.sectionPresence.renamed) sectionNames.push('## RENAMED Requirements');
        const hasSections = sectionNames.length > 0;
        const hasEntries = plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length > 0;
        if (!hasEntries) {
          if (hasSections) emptySectionSpecs.push({ path: entryPath, sections: sectionNames });
          else missingHeaderSpecs.push(entryPath);
        }

        const addedNames = new Set<string>();
        const modifiedNames = new Set<string>();
        const removedNames = new Set<string>();
        const renamedFrom = new Set<string>();
        const renamedTo = new Set<string>();

        // Validate ADDED
        for (const block of plan.added) {
          const key = normalizeRequirementName(block.name);
          totalDeltas++;
          if (addedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.duplicateRequirementAdded(block.name) });
          } else {
            addedNames.add(key);
          }
          const requirementText = this.extractRequirementText(block.raw);
          if (!requirementText) {
            issues.push({
              level: 'ERROR',
              path: entryPath,
              message: this.containsShallOrMust(block.name)
                ? VALIDATOR_MESSAGES.missingShallOrMustAdded(block.name, true)
                : VALIDATOR_MESSAGES.missingRequirementTextAdded(block.name),
            });
          } else if (!this.containsShallOrMust(requirementText)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.missingShallOrMustAdded(block.name, this.containsShallOrMust(block.name)) });
          }
          const scenarioCount = this.countScenarios(block.raw);
          if (scenarioCount < 1) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.missingScenarioAdded(block.name) });
          }
        }

        // Validate MODIFIED
        for (const block of plan.modified) {
          const key = normalizeRequirementName(block.name);
          totalDeltas++;
          if (modifiedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.duplicateRequirementModified(block.name) });
          } else {
            modifiedNames.add(key);
          }
          const requirementText = this.extractRequirementText(block.raw);
          if (!requirementText) {
            issues.push({
              level: 'ERROR',
              path: entryPath,
              message: this.containsShallOrMust(block.name)
                ? VALIDATOR_MESSAGES.missingShallOrMustModified(block.name, true)
                : VALIDATOR_MESSAGES.missingRequirementTextModified(block.name),
            });
          } else if (!this.containsShallOrMust(requirementText)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.missingShallOrMustModified(block.name, this.containsShallOrMust(block.name)) });
          }
          const scenarioCount = this.countScenarios(block.raw);
          if (scenarioCount < 1) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.missingScenarioModified(block.name) });
          }
        }

        // Validate REMOVED (names only)
        for (const name of plan.removed) {
          const key = normalizeRequirementName(name);
          totalDeltas++;
          if (removedNames.has(key)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.duplicateRequirementRemoved(name) });
          } else {
            removedNames.add(key);
          }
        }

        // Validate RENAMED pairs
        for (const { from, to } of plan.renamed) {
          const fromKey = normalizeRequirementName(from);
          const toKey = normalizeRequirementName(to);
          totalDeltas++;
          if (renamedFrom.has(fromKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.duplicateFromRenamed(from) });
          } else {
            renamedFrom.add(fromKey);
          }
          if (renamedTo.has(toKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.duplicateToRenamed(to) });
          } else {
            renamedTo.add(toKey);
          }
        }

        // Cross-section conflicts (within the same spec file)
        for (const n of modifiedNames) {
          if (removedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.requirementInModifiedAndRemoved(n) });
          }
          if (addedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.requirementInModifiedAndAdded(n) });
          }
        }
        for (const n of addedNames) {
          if (removedNames.has(n)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.requirementInAddedAndRemoved(n) });
          }
        }
        for (const { from, to } of plan.renamed) {
          const fromKey = normalizeRequirementName(from);
          const toKey = normalizeRequirementName(to);
          if (modifiedNames.has(fromKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.modifiedReferencesOldRenamed(to) });
          }
          if (addedNames.has(toKey)) {
            issues.push({ level: 'ERROR', path: entryPath, message: VALIDATOR_MESSAGES.renamedToCollidesAdded(to) });
          }
          // Comparação com fold: uma variante de caixa/espaços do cabeçalho
          // FROM em REMOVED é a mesma contradição, não um nome diferente.
          const removedFoldMatch = [...removedNames].find(
            (r) => foldRequirementName(r) === foldRequirementName(fromKey)
          );
          if (removedFoldMatch !== undefined) {
            issues.push({
              level: 'ERROR',
              path: entryPath,
              message: VALIDATOR_MESSAGES.requirementInRenamedAndRemoved(
                from,
                removedFoldMatch === fromKey ? undefined : removedFoldMatch
              ),
            });
          }
        }
      }
    } catch {
      // If no specs dir, treat as no deltas
    }

    for (const { path: specPath, sections } of emptySectionSpecs) {
      issues.push({
        level: 'ERROR',
        path: specPath,
        message: VALIDATOR_MESSAGES.deltaSectionsEmpty(this.formatSectionList(sections)),
      });
    }
    for (const path of missingHeaderSpecs) {
      issues.push({
        level: 'ERROR',
        path,
        message: VALIDATOR_MESSAGES.noDeltaSectionsFound,
      });
    }

    // The root-level error already names the file and the fix; adding "No
    // deltas found" on top would contradict it, since the deltas are sitting in
    // the file just reported.
    if (totalDeltas === 0 && !hasRootLevelSpec) {
      issues.push({ level: 'ERROR', path: 'file', message: this.enrichTopLevelError('change', VALIDATION_MESSAGES.CHANGE_NO_DELTAS) });
    }

    return this.createReport(issues);
  }

  private convertZodErrors(error: ZodError): ValidationIssue[] {
    return error.issues.map(err => {
      let message = err.message;
      if (message === VALIDATION_MESSAGES.CHANGE_NO_DELTAS) {
        message = `${message}. ${VALIDATION_MESSAGES.GUIDE_NO_DELTAS}`;
      }
      return {
        level: 'ERROR' as ValidationLevel,
        path: err.path.join('.'),
        message,
      };
    });
  }

  private applySpecRules(spec: Spec, content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const structuralIssue of findMainSpecStructureIssues(content)) {
      issues.push({
        level: 'ERROR',
        path: 'file',
        line: structuralIssue.line,
        message: structuralIssue.message,
      });
    }
    
    if (spec.overview.length < MIN_PURPOSE_LENGTH) {
      issues.push({
        level: 'WARNING',
        path: 'overview',
        message: VALIDATION_MESSAGES.PURPOSE_TOO_BRIEF,
      });
    }
    
    spec.requirements.forEach((req, index) => {
      if (req.text.length > MAX_REQUIREMENT_TEXT_LENGTH) {
        issues.push({
          level: 'INFO',
          path: `requirements[${index}]`,
          message: VALIDATION_MESSAGES.REQUIREMENT_TOO_LONG,
        });
      }
      
      if (req.scenarios.length === 0) {
        issues.push({
          level: 'WARNING',
          path: `requirements[${index}].scenarios`,
          message: `${VALIDATION_MESSAGES.REQUIREMENT_NO_SCENARIOS}. ${VALIDATION_MESSAGES.GUIDE_SCENARIO_FORMAT}`,
        });
      }
    });

    // SHALL/MUST body-keyword enforcement for main specs (#1156). The main-spec
    // parser collapses the requirement header into `text`, so we recover the
    // header+body pairs here (the same source the delta path trusts) and reuse
    // the delta detection: a body that omits the keyword errors, with the
    // targeted "move it to the body line" hint when the keyword is in the header
    // only and the generic message otherwise. Emitted exactly once per
    // requirement (the Zod refine that used to emit a generic error is removed).
    extractRequirementsSection(content).bodyBlocks.forEach((block, index) => {
      const requirementText = this.extractRequirementText(block.raw);
      if (!requirementText || !this.containsShallOrMust(requirementText)) {
        issues.push({
          level: 'ERROR',
          path: `requirements[${index}]`,
          message: VALIDATOR_MESSAGES.missingShallOrMustRequirement(block.name, this.containsShallOrMust(block.name)),
        });
      }
    });

    return issues;
  }

  private applyChangeRules(change: Change, content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const MIN_DELTA_DESCRIPTION_LENGTH = 10;
    
    change.deltas.forEach((delta, index) => {
      if (!delta.description || delta.description.length < MIN_DELTA_DESCRIPTION_LENGTH) {
        issues.push({
          level: 'WARNING',
          path: `deltas[${index}].description`,
          message: VALIDATION_MESSAGES.DELTA_DESCRIPTION_TOO_BRIEF,
        });
      }
      
      if ((delta.operation === 'ADDED' || delta.operation === 'MODIFIED') && 
          (!delta.requirements || delta.requirements.length === 0)) {
        issues.push({
          level: 'WARNING',
          path: `deltas[${index}].requirements`,
          message: `${delta.operation} ${VALIDATION_MESSAGES.DELTA_MISSING_REQUIREMENTS}`,
        });
      }
    });
    
    return issues;
  }

  private enrichTopLevelError(itemId: string, baseMessage: string): string {
    const msg = baseMessage.trim();
    if (msg === VALIDATION_MESSAGES.CHANGE_NO_DELTAS) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_NO_DELTAS}`;
    }
    if (msg.includes('A especificação deve ter uma seção Purpose') || msg.includes('A especificação deve ter uma seção Requirements')) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_MISSING_SPEC_SECTIONS}`;
    }
    if (msg.includes('A alteração deve ter uma seção Why') || msg.includes('A alteração deve ter uma seção What Changes')) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_MISSING_CHANGE_SECTIONS}`;
    }
    return msg;
  }

  private extractNameFromPath(filePath: string): string {
    const normalizedPath = FileSystemUtils.toPosixPath(filePath);
    const parts = normalizedPath.split('/');
    
    // Look for the directory name after 'specs' or 'changes'
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === 'specs' || parts[i] === 'changes') {
        if (i < parts.length - 1) {
          return parts[i + 1];
        }
      }
    }
    
    // Fallback to filename without extension if not in expected structure
    const fileName = parts[parts.length - 1] ?? '';
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  }

  private createReport(issues: ValidationIssue[]): ValidationReport {
    const errors = issues.filter(i => i.level === 'ERROR').length;
    const warnings = issues.filter(i => i.level === 'WARNING').length;
    const info = issues.filter(i => i.level === 'INFO').length;
    
    const valid = this.strictMode 
      ? errors === 0 && warnings === 0
      : errors === 0;
    
    return {
      valid,
      issues,
      summary: {
        errors,
        warnings,
        info,
      },
    };
  }

  isValid(report: ValidationReport): boolean {
    return report.valid;
  }

  private extractRequirementText(blockRaw: string): string | undefined {
    // Delegate to the shared, fence-/metadata-/multi-line-aware body reader.
    // Validation intentionally does not use the parser/display header-title
    // fallback for canonical `### Requirement:` blocks: #1280 requires a
    // SHALL/MUST that appears only in the header to receive the body-keyword
    // hint. Line 0 is the `### Requirement: ...` header.
    const [, ...bodyLines] = blockRaw.split('\n');
    return extractRequirementBodyShared(bodyLines) || undefined;
  }

  private containsShallOrMust(text: string): boolean {
    return containsShallOrMustShared(text);
  }

  private countScenarios(blockRaw: string): number {
    // Fence-aware count via the shared reader: a `#### Scenario:` inside a fenced
    // example is not a real scenario. Drop the header line (index 0).
    return countScenariosShared(blockRaw.split('\n').slice(1));
  }

  private formatSectionList(sections: string[]): string {
    if (sections.length === 0) return '';
    if (sections.length === 1) return sections[0];
    const head = sections.slice(0, -1);
    const last = sections[sections.length - 1];
    return `${head.join(', ')} e ${last}`;
  }
}

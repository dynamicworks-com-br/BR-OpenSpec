import path from 'path';
import { FileSystemUtils } from './file-system.js';
import { writeChangeMetadata, validateSchemaName } from './change-metadata.js';
import { formatLocalDate } from './date.js';
import { readProjectConfig } from '../core/project-config.js';
import { resolveSchema } from '../core/artifact-graph/resolver.js';
import { isSpecsArtifactPath } from '../core/artifact-graph/outputs.js';
import { CHANGE_UTILS_MESSAGES } from '../messages/index.js';

const DEFAULT_SCHEMA = 'spec-driven';

/**
 * Options for creating a change.
 */
export interface CreateChangeOptions {
  /** The workflow schema to use (default: 'spec-driven') */
  schema?: string;
}

/**
 * Result of creating a change.
 */
export interface CreateChangeResult {
  /** The schema that was actually used (resolved from options, config, or default) */
  schema: string;
}

/**
 * Result of validating a change name.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a change name follows kebab-case conventions.
 *
 * Valid names:
 * - Start with a lowercase letter or a digit
 * - Contain only lowercase letters, numbers, and hyphens
 * - Do not start or end with a hyphen
 * - Do not contain consecutive hyphens
 *
 * A leading digit is allowed so ordering conventions like `100-add-feature` or
 * `00001-add-auth` work; archive already treats such prefixes as a supported
 * convention (see ARCHIVE_DATE_PREFIX_PATTERN).
 *
 * @param name - The change name to validate
 * @returns Validation result with `valid: true` or `valid: false` with an error message
 *
 * @example
 * validateChangeName('add-auth') // { valid: true }
 * validateChangeName('100-add-feature') // { valid: true }
 * validateChangeName('Add-Auth') // { valid: false, error: '...' }
 */
export function validateChangeName(name: string): ValidationResult {
  // Pattern: lowercase letters/numbers separated by single hyphens; a leading
  // digit is allowed so numeric ordering prefixes work (#850, #1169)
  const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: CHANGE_UTILS_MESSAGES.nameEmpty };
  }

  // Filesystem directory components cap at 255 bytes and archive prepends a
  // date prefix; bounding here turns the failure into a validation message
  // instead of a raw ENAMETOOLONG from mkdir.
  if (name.length > 200) {
    return { valid: false, error: CHANGE_UTILS_MESSAGES.nameTooLong };
  }

  if (!kebabCasePattern.test(name)) {
    // Provide specific error messages for common mistakes
    if (/[A-Z]/.test(name)) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameMustBeLowercase };
    }
    if (/\s/.test(name)) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameNoSpaces };
    }
    if (/_/.test(name)) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameNoUnderscores };
    }
    if (name.startsWith('-')) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameNoStartHyphen };
    }
    if (name.endsWith('-')) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameNoEndHyphen };
    }
    if (/--/.test(name)) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameNoConsecutiveHyphens };
    }
    if (/[^a-z0-9-]/.test(name)) {
      return { valid: false, error: CHANGE_UTILS_MESSAGES.nameOnlyAllowedChars };
    }

    return { valid: false, error: CHANGE_UTILS_MESSAGES.nameKebabCase };
  }

  return { valid: true };
}

/**
 * Creates a new change directory with metadata file.
 *
 * @param projectRoot - The root directory of the project (where `openspec/` lives)
 * @param name - The change name (must be valid kebab-case)
 * @param options - Optional settings for the change
 * @throws Error if the change name is invalid
 * @throws Error if the schema name is invalid
 * @throws Error if the change directory already exists
 *
 * @returns Result containing the resolved schema name
 *
 * @example
 * // Creates openspec/changes/add-auth/ with default schema
 * const result = await createChange('/path/to/project', 'add-auth')
 * console.log(result.schema) // 'spec-driven' or value from config
 *
 * @example
 * // Creates openspec/changes/add-auth/ with custom schema
 * const result = await createChange('/path/to/project', 'add-auth', { schema: 'my-workflow' })
 * console.log(result.schema) // 'my-workflow'
 */
export async function createChange(
  projectRoot: string,
  name: string,
  options: CreateChangeOptions = {}
): Promise<CreateChangeResult> {
  // Validate the name first
  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Determine schema: explicit option → project config → hardcoded default
  let schemaName: string;
  if (options.schema) {
    schemaName = options.schema;
  } else {
    // Try to read from project config
    try {
      const config = readProjectConfig(projectRoot);
      schemaName = config?.schema ?? DEFAULT_SCHEMA;
    } catch {
      // If config read fails, use default
      schemaName = DEFAULT_SCHEMA;
    }
  }

  // Validate the resolved schema
  validateSchemaName(schemaName, projectRoot);

  // Build the change directory path
  const changeDir = path.join(projectRoot, 'openspec', 'changes', name);

  // Check if change already exists
  if (await FileSystemUtils.directoryExists(changeDir)) {
    throw new Error(CHANGE_UTILS_MESSAGES.changeAlreadyExists(name, changeDir));
  }

  // Um schema cujos artefatos nunca escrevem em specs/ (ex.: só proposal.md +
  // tasks.md) produz uma alteração sem deltas por construção; sem o marcador
  // skip_specs ela nasceria inválida para `openspec validate`. Resolvido antes
  // de criar o diretório, para que um schema.yaml inválido falhe sem deixar
  // uma pasta pela metade.
  const schema = resolveSchema(schemaName, projectRoot);
  const skipsSpecs = !schema.artifacts.some(artifact =>
    isSpecsArtifactPath(artifact.generates)
  );

  // Create the directory (including parent directories if needed)
  await FileSystemUtils.createDirectory(changeDir);

  // Write metadata file with schema and creation date
  writeChangeMetadata(changeDir, {
    schema: schemaName,
    created: formatLocalDate(),
    ...(skipsSpecs ? { skip_specs: true } : {}),
  }, projectRoot);

  return { schema: schemaName };
}

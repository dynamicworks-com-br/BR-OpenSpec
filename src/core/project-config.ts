import { PROJECT_CONFIG_MESSAGES, PROJECT_CONFIG_SUGGEST_MESSAGES } from '../messages/index.js';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const OPERATION_IDS = ['apply', 'archive'] as const;
export type OperationId = (typeof OPERATION_IDS)[number];

export interface OperationConfig {
  guidance?: string[];
}

export type OperationsConfig = Partial<Record<OperationId, OperationConfig>>;

const OperationConfigSchema = z.object({
  guidance: z.array(z.string()).optional(),
});

/**
 * Zod schema for project configuration.
 *
 * Purpose:
 * 1. Documentation - clearly defines the config file structure
 * 2. Type safety - TypeScript infers ProjectConfig type from schema
 * 3. Runtime validation - uses safeParse() for resilient field-by-field validation
 *
 * Why Zod over manual validation:
 * - Helps understand OpenSpec's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other OpenSpec schemas
 */
export const ProjectConfigSchema = z.object({
  // Required: which schema to use (e.g., "spec-driven", or project-local schema name)
  schema: z
    .string()
    .min(1)
    .describe('The workflow schema to use (e.g., "spec-driven")'),

  // Optional: project context (injected into all artifact instructions)
  // Max size: 50KB (enforced during parsing)
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),

  // Optional: per-artifact rules (additive to schema's built-in guidance)
  rules: z
    .record(
      z.string(), // artifact ID
      z.array(z.string()) // list of rules
    )
    .optional()
    .describe('Per-artifact rules, keyed by artifact ID'),

  // Optional: per-operation advisory guidance, kept separate from artifact rules.
  operations: z
    .object({
      apply: OperationConfigSchema.optional(),
      archive: OperationConfigSchema.optional(),
    })
    .optional()
    .describe('Per-operation advisory guidance'),

  // Optional: GitHub Copilot integration preferences. `cloudAgent` is the
  // opt-in for generating the Copilot cloud coding-agent files (a GitHub
  // Actions workflow + agent file); absent means "not yet decided".
  githubCopilot: z
    .object({
      cloudAgent: z.boolean().optional(),
    })
    .optional()
    .describe('GitHub Copilot integration preferences'),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export interface OperationInputs {
  context?: string;
  operationGuidance?: string[];
}

/**
 * Extracts the runtime inputs for one operation from an already-read project
 * config: the project context (required prompt-level input) and that
 * operation's advisory guidance. Artifact rules are never exposed here.
 */
export function loadOperationInputs(
  projectConfig: ProjectConfig | null,
  operationId: OperationId
): OperationInputs {
  const context =
    projectConfig?.context !== undefined && projectConfig.context.trim().length > 0
      ? projectConfig.context
      : undefined;
  const guidance = projectConfig?.operations?.[operationId]?.guidance;
  const operationGuidance = guidance && guidance.length > 0 ? guidance : undefined;

  return {
    ...(context !== undefined ? { context } : {}),
    ...(operationGuidance !== undefined ? { operationGuidance } : {}),
  };
}

/**
 * Parser for the `operations:` map: per-operation advisory guidance, validated
 * entry by entry so one malformed operation never discards the valid ones.
 * Unknown operation IDs and unknown fields warn and are ignored.
 */
function parseOperations(raw: unknown): OperationsConfig | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    console.warn(PROJECT_CONFIG_MESSAGES.invalidOperationsField);
    return undefined;
  }

  const supported = new Set<string>(OPERATION_IDS);
  const operations: OperationsConfig = {};

  for (const [operationId, value] of Object.entries(raw)) {
    if (!supported.has(operationId)) {
      console.warn(
        PROJECT_CONFIG_MESSAGES.unknownOperationId(operationId, OPERATION_IDS.join(', '))
      );
      continue;
    }

    const typedOperationId = operationId as OperationId;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      console.warn(PROJECT_CONFIG_MESSAGES.invalidOperationEntry(operationId));
      continue;
    }

    const operation = value as Record<string, unknown>;
    const unknownFields = Object.keys(operation).filter((field) => field !== 'guidance');
    if (unknownFields.length > 0) {
      console.warn(
        PROJECT_CONFIG_MESSAGES.unknownOperationFields(operationId, unknownFields.join(', '))
      );
    }

    if (operation.guidance === undefined) {
      continue;
    }

    const guidanceResult = z.array(z.string()).safeParse(operation.guidance);
    if (!guidanceResult.success) {
      console.warn(PROJECT_CONFIG_MESSAGES.operationGuidanceMustBeArray(operationId));
      continue;
    }

    const guidance = guidanceResult.data.filter((entry) => entry.length > 0);
    if (guidance.length < guidanceResult.data.length) {
      console.warn(PROJECT_CONFIG_MESSAGES.emptyGuidanceForOperation(operationId));
    }
    if (guidance.length > 0) {
      operations[typedOperationId] = { guidance };
    }
  }

  return Object.keys(operations).length > 0 ? operations : undefined;
}

const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit

/**
 * Read and parse openspec/config.yaml from project root.
 * Uses resilient parsing - validates each field independently using Zod safeParse.
 * Returns null if file doesn't exist.
 * Returns partial config if some fields are invalid (with warnings).
 *
 * Performance note (Jan 2025):
 * Benchmarks showed direct file reads are fast enough without caching:
 * - Typical config (1KB): ~0.5ms per read
 * - Large config (50KB): ~1.6ms per read
 * - Missing config: ~0.01ms per read
 * Config is read 1-2 times per command (schema resolution + instruction loading),
 * adding ~1-3ms total overhead. Caching would add complexity (mtime checks,
 * invalidation logic) for negligible benefit. Direct reads also ensure config
 * changes are reflected immediately without stale cache issues.
 *
 * @param projectRoot - The root directory of the project (where `openspec/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
export function readProjectConfig(projectRoot: string): ProjectConfig | null {
  const configPath = resolveConfigFilePath(projectRoot);
  if (configPath === null) {
    return null; // No config is OK
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const raw = parseYaml(content);

    if (!raw || typeof raw !== 'object') {
      console.warn(PROJECT_CONFIG_SUGGEST_MESSAGES.configNotValidYaml);
      return null;
    }

    const config: Partial<ProjectConfig> = {};

    // Parse schema field using Zod
    const schemaField = z.string().min(1);
    const schemaResult = schemaField.safeParse(raw.schema);
    if (schemaResult.success) {
      config.schema = schemaResult.data;
    } else if (raw.schema !== undefined) {
      console.warn(PROJECT_CONFIG_MESSAGES.invalidSchemaField);
    }

    // Parse context field with size limit
    if (raw.context !== undefined) {
      const contextField = z.string();
      const contextResult = contextField.safeParse(raw.context);

      if (contextResult.success) {
        const contextSize = Buffer.byteLength(contextResult.data, 'utf-8');
        if (contextSize > MAX_CONTEXT_SIZE) {
          console.warn(
            PROJECT_CONFIG_MESSAGES.contextTooLarge((contextSize / 1024).toFixed(1), String(MAX_CONTEXT_SIZE / 1024))
          );
          console.warn(PROJECT_CONFIG_MESSAGES.ignoringContextField);
        } else {
          config.context = contextResult.data;
        }
      } else {
        console.warn(PROJECT_CONFIG_MESSAGES.invalidContextField);
      }
    }

    // Parse rules field using Zod
    if (raw.rules !== undefined) {
      const rulesField = z.record(z.string(), z.array(z.string()));

      // First check if it's an object structure (guard against null since typeof null === 'object')
      if (typeof raw.rules === 'object' && raw.rules !== null && !Array.isArray(raw.rules)) {
        // IDs de artefato não são restritos à convenção de nomes embutida,
        // então chaves como "constructor" continuam válidas para schemas
        // customizados. Um mapa sem protótipo preserva essas chaves como
        // dados sem deixar "__proto__" alterar o protótipo do objeto de lookup.
        const parsedRules: Record<string, string[]> = Object.create(null);
        let hasValidRules = false;

        for (const [artifactId, rules] of Object.entries(raw.rules)) {
          const rulesArrayResult = z.array(z.string()).safeParse(rules);

          if (rulesArrayResult.success) {
            // Filter out empty strings
            const validRules = rulesArrayResult.data.filter((r) => r.length > 0);
            if (validRules.length > 0) {
              parsedRules[artifactId] = validRules;
              hasValidRules = true;
            }
            if (validRules.length < rulesArrayResult.data.length) {
              console.warn(
                PROJECT_CONFIG_MESSAGES.emptyRulesForArtifact(artifactId)
              );
            }
          } else {
            console.warn(
              PROJECT_CONFIG_MESSAGES.rulesMustBeArrayOfStrings(artifactId)
            );
          }
        }

        if (hasValidRules) {
          config.rules = parsedRules;
        }
      } else {
        console.warn(PROJECT_CONFIG_MESSAGES.invalidRulesField);
      }
    }

    // Parse operations field (per-operation advisory guidance)
    const operations = parseOperations(raw.operations);
    if (operations) {
      config.operations = operations;
    }

    // Parse githubCopilot preferences (only cloudAgent is recognized today).
    if (raw.githubCopilot !== undefined) {
      if (
        typeof raw.githubCopilot === 'object' &&
        raw.githubCopilot !== null &&
        !Array.isArray(raw.githubCopilot)
      ) {
        const cloudAgent = (raw.githubCopilot as Record<string, unknown>).cloudAgent;
        if (typeof cloudAgent === 'boolean') {
          config.githubCopilot = { cloudAgent };
        } else if (cloudAgent !== undefined) {
          console.warn(PROJECT_CONFIG_MESSAGES.invalidGithubCopilotCloudAgentField);
        }
      } else {
        console.warn(PROJECT_CONFIG_MESSAGES.invalidGithubCopilotField);
      }
    }

    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
  } catch (error) {
    console.warn(PROJECT_CONFIG_SUGGEST_MESSAGES.configFailedToParse, error);
    return null;
  }
}

/**
 * Shared .yaml/.yml probe: the single source of truth for which config file a
 * project actually uses (`.yaml` wins over `.yml`). Used by readProjectConfig
 * and by any writer that must edit the very file the reader consumed.
 */
export function resolveConfigFilePath(projectRoot: string): string | null {
  const yamlPath = path.join(projectRoot, 'openspec', 'config.yaml');
  if (existsSync(yamlPath)) {
    return yamlPath;
  }
  const ymlPath = path.join(projectRoot, 'openspec', 'config.yml');
  return existsSync(ymlPath) ? ymlPath : null;
}

/**
 * Validate artifact IDs in rules against the artifacts of every available
 * schema. The `rules:` map is global, but each change can use a different
 * schema, so a key is only unknown when it matches no artifact in ANY schema.
 * Returns warnings for keys that are unknown everywhere.
 *
 * @param rules - The rules object from config
 * @param validArtifactIds - Set of valid artifact IDs across all schemas
 * @returns Array of warning messages for unknown artifact IDs
 */
export function validateConfigRules(
  rules: Record<string, string[]>,
  validArtifactIds: Set<string>
): string[] {
  const warnings: string[] = [];

  for (const artifactId of Object.keys(rules)) {
    if (!validArtifactIds.has(artifactId)) {
      const validIds = Array.from(validArtifactIds).sort().join(', ');
      warnings.push(
        PROJECT_CONFIG_SUGGEST_MESSAGES.unknownArtifactId(artifactId, validIds)
      );
    }
  }

  return warnings;
}

/**
 * Suggest valid schema names when user provides invalid schema.
 * Uses fuzzy matching to find similar names.
 *
 * @param invalidSchemaName - The invalid schema name from config
 * @param availableSchemas - List of available schemas with their type (built-in or project-local)
 * @returns Error message with suggestions and available schemas
 */
export function suggestSchemas(
  invalidSchemaName: string,
  availableSchemas: { name: string; isBuiltIn: boolean }[]
): string {
  // Simple fuzzy match: Levenshtein distance
  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Find closest matches (distance <= 3)
  const suggestions = availableSchemas
    .map((s) => ({ ...s, distance: levenshtein(invalidSchemaName, s.name) }))
    .filter((s) => s.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const builtIn = availableSchemas.filter((s) => s.isBuiltIn).map((s) => s.name);
  const projectLocal = availableSchemas.filter((s) => !s.isBuiltIn).map((s) => s.name);

  let message = PROJECT_CONFIG_SUGGEST_MESSAGES.schemaNotFound(invalidSchemaName);

  if (suggestions.length > 0) {
    message += PROJECT_CONFIG_SUGGEST_MESSAGES.didYouMean;
    suggestions.forEach((s) => {
      const type = PROJECT_CONFIG_SUGGEST_MESSAGES.schemaType(s.isBuiltIn);
      message += `  - ${s.name} (${type})\n`;
    });
    message += '\n';
  }

  message += PROJECT_CONFIG_SUGGEST_MESSAGES.availableSchemas;
  if (builtIn.length > 0) {
    message += PROJECT_CONFIG_SUGGEST_MESSAGES.builtInSchemas(builtIn.join(', '));
  }
  if (projectLocal.length > 0) {
    message += PROJECT_CONFIG_SUGGEST_MESSAGES.projectLocalSchemas(projectLocal.join(', '));
  } else {
    message += PROJECT_CONFIG_SUGGEST_MESSAGES.noProjectLocalSchemas;
  }

  message += PROJECT_CONFIG_SUGGEST_MESSAGES.fixSuggestion(invalidSchemaName);

  return message;
}

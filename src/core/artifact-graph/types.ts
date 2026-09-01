import * as path from 'node:path';
import { z } from 'zod';
import { ARTIFACT_GRAPH_MESSAGES } from '../../messages/index.js';

/**
 * Caminho relativo confinado ao diretório permitido: sem `..`, sem caractere
 * nulo e nunca absoluto (posix, win32 ou com letra de unidade `C:`).
 */
function relativePathSchema(fieldName: string) {
  return z
    .string()
    .min(1, { error: ARTIFACT_GRAPH_MESSAGES.fieldRequired(fieldName) })
    .superRefine((value, ctx) => {
      const segments = value.split(/[\\/]+/u);
      const isDrivePath = /^[A-Za-z]:/u.test(value);
      const isAbsolute =
        path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || isDrivePath;
      const escapes = segments.includes('..');

      if (isAbsolute || escapes || value.includes('\0')) {
        ctx.addIssue({
          code: 'custom',
          message: ARTIFACT_GRAPH_MESSAGES.fieldMustBeRelativePath(fieldName),
        });
      }
    });
}

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: relativePathSchema('generates'),
  description: z.string(),
  template: relativePathSchema('template'),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: relativePathSchema('apply.tracks').nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Optional apply phase configuration (for schema-aware apply instructions)
  apply: ApplyPhaseSchema.optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// Per-change metadata schema
// Note: schema field is validated at parse time against available schemas
// using a lazy import to avoid circular dependencies
export const ChangeMetadataSchema = z.object({
  // Required: which workflow schema this change uses
  schema: z.string().min(1, { message: 'schema is required' }),

  // Optional: creation timestamp (ISO date string)
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'created must be YYYY-MM-DD format',
    })
    .optional(),

  // Declares that this change intentionally has no spec deltas (pure refactor,
  // tooling, or docs work). Validation accepts zero deltas, and the artifact
  // graph counts artifacts whose `generates` path lives under specs/ as
  // complete - that path prefix, not the artifact id, is the contract custom
  // schemas inherit.
  skip_specs: z.boolean().optional(),
  // Declara que esta alteração pode aposentar uma capability: quando suas
  // entradas REMOVED levam o último requisito que uma capability possui, o
  // archive exclui o spec principal dessa capability em vez de abortar em um
  // spec que não conseguiria escrever (#1302). Obrigatório porque a exclusão
  // não é recuperável a partir da árvore de trabalho - só do git - então é
  // decisão do autor, não uma inferência a partir da forma de um delta.
  retire_capabilities: z.boolean().optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}


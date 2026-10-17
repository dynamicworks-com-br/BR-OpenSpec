import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseSchema } from '../../../src/core/artifact-graph/schema.js';

// This fork does not publish a docs-lab schema reference. The instruction the
// agent receives is the one in schemas/spec-driven/schema.yaml, so the tasks
// guidance that used to drift on the site is pinned on that file directly.
const SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'schemas',
  'spec-driven',
  'schema.yaml'
);

describe('spec-driven schema instructions', () => {
  it('gives every artifact and apply a non-empty instruction', () => {
    const schema = parseSchema(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
    for (const artifact of schema.artifacts) {
      expect(artifact.instruction?.trim(), artifact.id).not.toBe('');
    }
    expect(schema.apply?.instruction?.trim()).not.toBe('');
  });

  it('keeps the tasks guidance on the shipped instruction', () => {
    const schema = parseSchema(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
    const tasks = (schema.artifacts.find((artifact) => artifact.id === 'tasks')?.instruction ?? '').replace(
      /\s+/g,
      ' '
    );
    expect(tasks).toContain(
      'Cada grupo de tarefas MUST entregar os testes e a documentação que o próprio trabalho pede'
    );
    expect(tasks).toContain('Cada tarefa MUST indicar como verificar sua conclusão');
  });
});

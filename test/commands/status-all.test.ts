import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';
import { WORKFLOW_MESSAGES } from '../../src/messages/index.js';

describe('status --all', () => {
  let tempDir: string;
  let changesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-status-all-'));
    changesDir = path.join(tempDir, 'openspec', 'changes');
    await fs.mkdir(changesDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  function getOutput(result: { stdout: string; stderr: string }): string {
    return result.stdout + result.stderr;
  }

  async function createTestChange(
    changeName: string,
    artifacts: ('design' | 'specs' | 'tasks')[] = []
  ): Promise<string> {
    const changeDir = path.join(changesDir, changeName);
    await fs.mkdir(changeDir, { recursive: true });

    // proposal.md marks the change as active
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '## Why\nMinimal proposal.\n\n## What Changes\n- **test:** Placeholder'
    );

    if (artifacts.includes('design')) {
      await fs.writeFile(path.join(changeDir, 'design.md'), '# Design\n\nTechnical design.');
    }

    if (artifacts.includes('specs')) {
      const specsDir = path.join(changeDir, 'specs');
      await fs.mkdir(specsDir, { recursive: true });
      await fs.writeFile(path.join(specsDir, 'test-spec.md'), '## Purpose\nTest spec.');
    }

    if (artifacts.includes('tasks')) {
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Tasks\n- [ ] Task 1');
    }

    return changeDir;
  }

  /**
   * Fixture for "this change fails to load".
   *
   * Upstream points `.openspec.yaml` at an unknown schema; in the fork that
   * does NOT fail — `resolveSchemaForChange` swallows the metadata-read error
   * and falls back to spec-driven (pre-stores divergence, see the LF3 report).
   * A project-local schema whose `schema.yaml` is invalid does fail, in the
   * same place (`resolveSchema` throws "Esquema inválido em '…'"), so it is
   * the fork's equivalent fixture.
   */
  async function createBrokenChange(changeName: string): Promise<void> {
    await createTestChange(changeName);
    const schemaDir = path.join(tempDir, 'openspec', 'schemas', 'broken-schema');
    await fs.mkdir(schemaDir, { recursive: true });
    await fs.writeFile(
      path.join(schemaDir, 'schema.yaml'),
      'name: broken-schema\nversion: 1\nartifacts: not-a-list\n'
    );
    await fs.writeFile(
      path.join(changesDir, changeName, '.openspec.yaml'),
      'schema: broken-schema\n'
    );
  }

  it('reports every active change in alphabetical order', async () => {
    // Created out of order to prove the output sort is not readdir order
    await createTestChange('zebra-change', ['design']);
    await createTestChange('alpha-change');
    await createTestChange('mid-change', ['design', 'specs', 'tasks']);

    const result = await runCLI(['status', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');

    const json = JSON.parse(result.stdout);
    expect(json.changes.map((c: any) => c.changeName)).toEqual([
      'alpha-change',
      'mid-change',
      'zebra-change',
    ]);
  });

  it('emits the empty envelope when no changes exist', async () => {
    const result = await runCLI(['status', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);

    const json = JSON.parse(result.stdout);
    expect(json.changes).toEqual([]);
    expect(json.message).toBe(WORKFLOW_MESSAGES.noActiveChanges);
    // Upstream also asserts `json.root`; the fork resolves the root from
    // process.cwd() and emits no `root` field (stores deferred).
  });

  it('carries a full ChangeStatus per change', async () => {
    await createTestChange('json-change', ['design']);

    const result = await runCLI(['status', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);

    const json = JSON.parse(result.stdout);
    expect(json.changes).toHaveLength(1);

    const entry = json.changes[0];
    // Full ChangeStatus shape, same as the single-change payload
    expect(entry.changeName).toBe('json-change');
    expect(entry.schemaName).toBe('spec-driven');
    expect(entry.isComplete).toBe(false);
    expect(entry.isPlanningComplete).toBe(false);
    expect(Array.isArray(entry.artifacts)).toBe(true);
    expect(entry.artifacts).toHaveLength(4);
    expect(entry.artifactPaths).toBeDefined();
    // Upstream also asserts `nextSteps` and `actionContext`; both live in the
    // deferred change-status-policy module and are absent in the fork.
    expect(entry.root).toBeUndefined();

    const designArtifact = entry.artifacts.find((a: any) => a.id === 'design');
    expect(designArtifact.status).toBe('done');
  });

  it('rejects --all combined with --change', async () => {
    await createTestChange('some-change');

    const result = await runCLI(['status', '--all', '--change', 'some-change'], {
      cwd: tempDir,
    });
    expect(result.exitCode).toBe(1);
    expect(getOutput(result)).toContain(WORKFLOW_MESSAGES.allAndChangeMutuallyExclusive);
  });

  it('offers --all when neither --change nor --all is given', async () => {
    await createTestChange('some-change');

    const result = await runCLI(['status'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(getOutput(result)).toContain('--all');
    expect(getOutput(result)).toContain('some-change');
  });

  // Skipped: upstream's `honors the JSON null-shape when root selection fails
  // under --all` drives `--store no-such-store`; the fork has no store
  // subsystem and no `--store` flag.

  it('still fails under --json when --all and --change are combined', async () => {
    await createTestChange('some-change');

    const result = await runCLI(
      ['status', '--all', '--change', 'some-change', '--json'],
      { cwd: tempDir }
    );
    expect(result.exitCode).toBe(1);
    expect(getOutput(result)).toContain(WORKFLOW_MESSAGES.allAndChangeMutuallyExclusive);
    // Upstream emits a `{ changes: [], root: null, status: [diag] }` document
    // on stdout here; that null-shape depends on failWithError/shared-output
    // (stores, deferred). The fork reports the error on stderr like every
    // other command, so stdout carries no JSON document to parse.
  });

  it('keeps sweeping when one change fails to load', async () => {
    await createTestChange('good-change', ['design']);
    await createBrokenChange('broken-change');

    const result = await runCLI(['status', '--all', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);

    const json = JSON.parse(result.stdout);
    expect(json.changes).toHaveLength(2);
    expect(json.changes.map((c: any) => c.changeName)).toEqual([
      'broken-change',
      'good-change',
    ]);

    const broken = json.changes.find((c: any) => c.changeName === 'broken-change');
    expect(Array.isArray(broken.status)).toBe(true);
    expect(broken.status[0].code).toBe('change_error');
    expect(broken.status[0].severity).toBe('error');
    expect(broken.artifacts).toBeUndefined();

    const good = json.changes.find((c: any) => c.changeName === 'good-change');
    expect(good.schemaName).toBe('spec-driven');
    expect(good.artifacts).toHaveLength(4);
  });

  it('prints one text block per change with --all', async () => {
    await createTestChange('first-change');
    await createTestChange('second-change', ['design']);

    const result = await runCLI(['status', '--all'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.changeLabel('first-change'));
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.changeLabel('second-change'));
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.progressArtifacts(1, 4));
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.progressArtifacts(2, 4));
  });

  it('exits 1 in text mode when a change fails to load, still printing the others', async () => {
    await createTestChange('good-change', ['design']);
    await createBrokenChange('broken-change');

    const result = await runCLI(['status', '--all'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('✗ broken-change:');
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.changeLabel('good-change'));
    expect(result.stdout).toContain(WORKFLOW_MESSAGES.progressArtifacts(2, 4));
  });

  describe('--schema interaction', () => {
    /** Writes a minimal project-local schema so an override is distinguishable from the default. */
    async function createProjectSchema(schemaName: string): Promise<void> {
      const schemaDir = path.join(tempDir, 'openspec', 'schemas', schemaName);
      await fs.mkdir(schemaDir, { recursive: true });
      await fs.writeFile(
        path.join(schemaDir, 'schema.yaml'),
        [
          `name: ${schemaName}`,
          'version: 1',
          'description: Minimal test schema',
          'artifacts:',
          '  - id: proposal',
          '    generates: proposal.md',
          '    description: Proposal document',
          '    template: proposal.md',
          '',
        ].join('\n')
      );
    }

    it('fails when --schema names an unknown schema', async () => {
      await createTestChange('some-change');

      const result = await runCLI(
        ['status', '--all', '--schema', 'no-such-schema', '--json'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(1);
      // No JSON null-shape in the fork (see the mutual-exclusion test above).
      expect(getOutput(result)).toContain("Esquema 'no-such-schema' não encontrado");
    });

    it('rejects an unknown --schema even when no changes exist', async () => {
      const result = await runCLI(
        ['status', '--all', '--schema', 'no-such-schema', '--json'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(1);
      expect(getOutput(result)).toContain("Esquema 'no-such-schema' não encontrado");
    });

    it('applies a valid --schema override to every change', async () => {
      await createProjectSchema('mini');
      await createTestChange('first-change');
      await createTestChange('second-change');

      const result = await runCLI(['status', '--all', '--schema', 'mini', '--json'], {
        cwd: tempDir,
      });
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json.changes).toHaveLength(2);
      for (const entry of json.changes) {
        expect(entry.schemaName).toBe('mini');
        expect(entry.artifacts).toHaveLength(1);
      }
    });

    // Skipped: upstream's `does not rescue a change with broken metadata via an
    // explicit --schema`. In the fork `resolveSchemaForChange` returns an
    // explicit override without reading the metadata, and `loadChangeContext`
    // swallows metadata-read errors, so an explicit `--schema` DOES rescue a
    // change with broken metadata. Upstream reads the metadata unconditionally
    // since fd92ccc (stores, deferred). Registered as pre-existing debt.
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  writeChangeMetadata,
  readChangeMetadata,
  resolveSchemaForChange,
  validateSchemaName,
  ChangeMetadataError,
  readRetireCapabilitiesMarker,
  listUnknownChangeMetadataKeys,
  isExtensionMetadataKey,
  formatUnknownChangeMetadataKeysMessage,
} from '../../src/utils/change-metadata.js';
import { ChangeMetadataSchema } from '../../src/core/artifact-graph/types.js';
import { CHANGE_METADATA_MESSAGES } from '../../src/messages/index.js';

describe('ChangeMetadataSchema', () => {
  describe('valid metadata', () => {
    it('should accept valid schema with created date', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-01-05',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schema).toBe('spec-driven');
        expect(result.data.created).toBe('2025-01-05');
      }
    });

    it('should accept skip_specs boolean and reject non-boolean values', () => {
      const withFlag = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        skip_specs: true,
      });
      expect(withFlag.success).toBe(true);
      if (withFlag.success) {
        expect(withFlag.data.skip_specs).toBe(true);
      }

      const nonBoolean = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        skip_specs: 'yes',
      });
      expect(nonBoolean.success).toBe(false);
    });

    it('should accept valid schema without created date', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'custom-schema',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schema).toBe('custom-schema');
        expect(result.data.created).toBeUndefined();
      }
    });
  });

  describe('invalid metadata', () => {
    it('should reject empty schema', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing schema', () => {
      const result = ChangeMetadataSchema.safeParse({
        created: '2025-01-05',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '01/05/2025', // Wrong format
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-ISO date format', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-1-5', // Missing leading zeros
      });
      expect(result.success).toBe(false);
    });

    it('strips unrecognized top-level keys instead of rejecting the file', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        skip_specs: true,
        skip_design: true,
        bogus_key: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_specs).toBe(true);
        expect(result.data).not.toHaveProperty('skip_design');
        expect(result.data).not.toHaveProperty('bogus_key');
      }
    });
  });
});

describe('listUnknownChangeMetadataKeys', () => {
  it('names extra top-level keys and ignores known ones', () => {
    expect(
      listUnknownChangeMetadataKeys({
        schema: 'spec-driven',
        skip_specs: true,
        skip_design: true,
        bogus_key: 1,
      })
    ).toEqual(['bogus_key', 'skip_design']);
  });

  it('returns nothing for a known-keys-only object', () => {
    expect(
      listUnknownChangeMetadataKeys({
        schema: 'spec-driven',
        created: '2026-09-19',
        skip_specs: true,
      })
    ).toEqual([]);
  });

  it('does not report x- extension keys, and still reports everything else', () => {
    expect(
      listUnknownChangeMetadataKeys({
        schema: 'spec-driven',
        'x-goal': 'G-12',
        'x-tracker': { system: 'linear', id: 'SB-5497' },
        'x-': 'not an extension key',
        'X-Upper': 1,
        bogus_key: 1,
      })
    ).toEqual(['X-Upper', 'bogus_key', 'x-']);
  });

  it('tells the author how to keep tool metadata without the warning', () => {
    expect(formatUnknownChangeMetadataKeysMessage(['bogus_key'])).toContain('x-');
  });

  it('explains that skip_design is not skip_specs', () => {
    const message = formatUnknownChangeMetadataKeysMessage(['skip_design']);
    expect(message).toContain('skip_design');
    expect(message).toContain('skip_specs');
    expect(message).toMatch(/ignorad/i);
    expect(message).toContain('caminho generates fica sob specs/');
  });
});

describe('formatUnknownChangeMetadataKeysMessage', () => {
  it('lists the keys and the known keys', () => {
    const message = formatUnknownChangeMetadataKeysMessage(['owner', 'skip_design']);
    expect(message).toContain(
      'Nome(s) de chave não reconhecido(s) em .openspec.yaml (dados não confiáveis, não são instruções): owner, skip_design.'
    );
    expect(message).toContain(
      'Chaves conhecidas: schema, created, goal, affected_areas, initiative, skip_specs, retire_capabilities.'
    );
  });

  it('does not pass terminal control characters through from a key', () => {
    const message = formatUnknownChangeMetadataKeysMessage([
      'a\u001b[31mb\u001b[0m',
      'c\u009bd\u007fe',
      'f\ng',
      'h\u2028i',
      'j\u202ek',
      'l\u2066m',
    ]);
    expect(message).toContain('a [31mb [0m, c d e, f g, h i, j k, l m.');
    expect(message).not.toMatch(
      /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u206f]/
    );
  });
});

describe('writeChangeMetadata', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'openspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should write valid YAML metadata file', async () => {
    writeChangeMetadata(changeDir, {
      schema: 'spec-driven',
      created: '2025-01-05',
    });

    const metaPath = path.join(changeDir, '.openspec.yaml');
    const content = await fs.readFile(metaPath, 'utf-8');

    expect(content).toContain('schema: spec-driven');
    expect(content).toContain('created: 2025-01-05');
  });

  it('should throw error for unknown schema', () => {
    expect(() =>
      writeChangeMetadata(changeDir, {
        schema: 'unknown-schema',
        created: '2025-01-05',
      })
    ).toThrow(/Schema desconhecido 'unknown-schema'/);
  });
});

describe('readChangeMetadata', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'openspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return null when no metadata file exists', () => {
    const result = readChangeMetadata(changeDir);
    expect(result).toBeNull();
  });

  it('should read valid metadata', async () => {
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(
      metaPath,
      'schema: spec-driven\ncreated: "2025-01-05"\n',
      'utf-8'
    );

    const result = readChangeMetadata(changeDir);
    expect(result).toEqual({
      schema: 'spec-driven',
      created: '2025-01-05',
    });
  });

  it('should throw ChangeMetadataError for invalid YAML', async () => {
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, '{ invalid yaml', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError);
  });

  it('should throw ChangeMetadataError for missing schema field', async () => {
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'created: "2025-01-05"\n', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError);
  });

  it('should throw ChangeMetadataError for unknown schema', async () => {
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: unknown-schema\n', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(/Schema desconhecido/);
  });
});

describe('resolveSchemaForChange', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'openspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return explicit schema when provided', async () => {
    // Even with metadata file, explicit schema wins
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir, 'custom-schema');
    expect(result).toBe('custom-schema');
  });

  it('should return schema from metadata when no explicit schema', async () => {
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should return default when no metadata and no explicit schema', () => {
    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should return default when metadata read fails', async () => {
    // Create an invalid metadata file
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, '{ invalid yaml', 'utf-8');

    // Should fall back to default, not throw
    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should use project config schema when no metadata exists', async () => {
    // Create project config
    const configDir = path.join(testDir, 'openspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'config.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('custom-schema');
  });

  it('should prefer change metadata over project config', async () => {
    // Create project config
    const configDir = path.join(testDir, 'openspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'config.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    // Create change metadata with different schema
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven'); // Change metadata wins
  });

  it('should prefer explicit schema over all config sources', async () => {
    // Create project config
    const configDir = path.join(testDir, 'openspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'config.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    // Create change metadata
    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    // Explicit schema should win
    const result = resolveSchemaForChange(changeDir, 'custom-schema');
    expect(result).toBe('custom-schema');
  });

  it('should test full precedence order: CLI > metadata > config > default', async () => {
    // Setup all levels
    const configDir = path.join(testDir, 'openspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'config.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    const metaPath = path.join(changeDir, '.openspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    // Test each level
    expect(resolveSchemaForChange(changeDir, 'custom-schema')).toBe('custom-schema'); // CLI wins
    expect(resolveSchemaForChange(changeDir)).toBe('spec-driven'); // Metadata wins when no CLI

    // Remove metadata, config should win
    await fs.unlink(metaPath);
    expect(resolveSchemaForChange(changeDir)).toBe('custom-schema'); // Config wins

    // Remove config, default should win
    await fs.unlink(path.join(configDir, 'config.yaml'));
    expect(resolveSchemaForChange(changeDir)).toBe('spec-driven'); // Default wins
  });
});

describe('validateSchemaName', () => {
  it('should accept valid schema name', () => {
    expect(() => validateSchemaName('spec-driven')).not.toThrow();
  });

  it('should throw for unknown schema', () => {
    expect(() => validateSchemaName('unknown-schema')).toThrow(
      /Schema desconhecido 'unknown-schema'/
    );
  });
});

describe('boolean marker reasons', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-marker-reason-'));
    await fs.mkdir(path.join(tempDir, 'openspec', 'changes', 'c'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // Every reason quotes something the author wrote, and callers print it
  // straight to a terminal. A schema name carrying an ESC could redraw the
  // screen; a CR could forge a line of its own.
  it('strips control characters from a reason that quotes authored content', async () => {
    const changeDir = path.join(tempDir, 'openspec', 'changes', 'c');
    await fs.writeFile(
      path.join(changeDir, '.openspec.yaml'),
      'schema: "ghost\u001b[31m-schema"\nretire_capabilities: true\n',
      'utf-8'
    );

    const marker = readRetireCapabilitiesMarker(changeDir);

    expect(marker.declared).toBe(false);
    // The name is still recognisable, so the author can find what they typed.
    expect(marker.invalidReason).toContain(
      CHANGE_METADATA_MESSAGES.markerUnknownSchema('ghost?[31m-schema')
    );
    expect(marker.invalidReason).not.toMatch(/[\u0000-\u001f\u007f]/);
  });
});

describe('isExtensionMetadataKey', () => {
  it('accepts x- followed by a name', () => {
    expect(isExtensionMetadataKey('x-goal')).toBe(true);
    expect(isExtensionMetadataKey('x-kf_part-2')).toBe(true);
    expect(isExtensionMetadataKey('x-')).toBe(false);
    expect(isExtensionMetadataKey('X-goal')).toBe(false);
    expect(isExtensionMetadataKey('goal')).toBe(false);
  });

  // The name after the prefix is the owner's business, in any case or spelling.
  it('accepts the spellings a tracker id is actually written in', () => {
    expect(isExtensionMetadataKey('x-jiraKey')).toBe(true);
    expect(isExtensionMetadataKey('x-trackerID')).toBe(true);
    expect(isExtensionMetadataKey('x-Owner')).toBe(true);
    expect(isExtensionMetadataKey('x-foo.bar')).toBe(true);
    expect(isExtensionMetadataKey('x--foo')).toBe(true);
  });

  it('rejects a prefix that names nothing, or a name carrying whitespace', () => {
    expect(isExtensionMetadataKey('x-')).toBe(false);
    expect(isExtensionMetadataKey('x- ')).toBe(false);
    expect(isExtensionMetadataKey('x- tracker')).toBe(false);
    expect(isExtensionMetadataKey(' x-foo')).toBe(false);
    expect(isExtensionMetadataKey('x-foo ')).toBe(false);
    expect(isExtensionMetadataKey('x-a\nb')).toBe(false);
  });

  it('rejects a near-miss prefix, including the wrong case', () => {
    expect(isExtensionMetadataKey('x_foo')).toBe(false);
    expect(isExtensionMetadataKey('xfoo')).toBe(false);
    expect(isExtensionMetadataKey('x')).toBe(false);
    expect(isExtensionMetadataKey('-x-foo')).toBe(false);
    expect(isExtensionMetadataKey('X-Foo')).toBe(false);
  });
});

describe('extension keys alongside the unknown-key warning', () => {
  it('keeps reporting a misspelled real key beside a valid extension', () => {
    expect(
      listUnknownChangeMetadataKeys({
        schema: 'spec-driven',
        'x-goal': 'G-12',
        skip_spec: true,
        taskss: true,
      })
    ).toEqual(['skip_spec', 'taskss']);
  });

  // The message must not tell someone who already wrote x-jiraKey to "prefix a
  // key with x-". It now names the two conditions the prefix does not cover.
  it('explains the near-miss to a user who did use the prefix', () => {
    const message = formatUnknownChangeMetadataKeysMessage(['X-Tracker', 'x-']);
    expect(message).toContain('prefixo x- minúsculo');
    expect(message).toContain('sem espaços');
    expect(message).toContain('x-jiraKey são extensões');
  });

  it('leaves the message alone when no key used the prefix', () => {
    expect(formatUnknownChangeMetadataKeysMessage(['taskss'])).not.toContain(
      'prefixo x- minúsculo'
    );
  });

  // ChangeMetadataSchema strips unknown keys, so writeChangeMetadata is only
  // safe on a new file. If a future caller rewrites an existing one without
  // merging the raw YAML back, every x- key in it is silently deleted.
  it('strips extension keys, so the writer must never rewrite an existing file', () => {
    expect(
      ChangeMetadataSchema.safeParse({ schema: 'spec-driven', 'x-goal': 'G-12' }).data
    ).toEqual({ schema: 'spec-driven' });
  });
});

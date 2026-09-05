import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { buildUpdatedSpec, findSpecUpdates } from '../../src/core/specs-apply.js';

// Um bloco de requirement corre até o próximo cabeçalho que o parser
// RECONHECE, então uma nota escrita abaixo dele - indentada pelos 0-3 espaços
// que o CommonMark permite, digamos - é absorvida por esse requirement e vai
// embora quando o requirement é reescrito ou removido. A perda era silenciosa:
// nada contava a nota, então nada dizia uma palavra, e o spec deixado para
// trás ainda validava.
//
// Ela é reportada, não movida. Uma linha em forma de cabeçalho dentro de um
// cenário (um `# comment`, um exemplo markdown) é indistinguível de uma nota
// real por qualquer regra baseada em linhas, e relocar uma dessas reescreve o
// spec errado - ressuscitando texto superado no MODIFIED e crescendo o arquivo
// a cada reaplicação. Um aviso errado custa uma linha de saída, em vez disso.
describe('buildUpdatedSpec (content absorbed into a requirement)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-orphan-'));
  });
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function build(specBody: string[], deltaBody: string[]) {
    const specsDir = path.join(tempDir, 'openspec', 'specs', 'demo');
    const changeDir = path.join(tempDir, 'openspec', 'changes', 'c');
    await fs.mkdir(specsDir, { recursive: true });
    await fs.mkdir(path.join(changeDir, 'specs', 'demo'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'spec.md'), specBody.join('\n'));
    await fs.writeFile(path.join(changeDir, 'specs', 'demo', 'spec.md'), deltaBody.join('\n'));
    const [update] = await findSpecUpdates(changeDir, path.join(tempDir, 'openspec', 'specs'));
    return buildUpdatedSpec(update, 'c', { silent: true });
  }

  const REQUIREMENT = [
    '### Requirement: Target',
    'The system SHALL target.',
    '',
    '#### Scenario: S',
    '- **WHEN** a',
    '- **THEN** b',
  ];
  const SPEC = (middle: string[]) => [
    '# demo Specification',
    '',
    '## Purpose',
    'Why this exists.',
    '',
    '## Requirements',
    '',
    ...REQUIREMENT,
    '',
    ...middle,
    '',
    '### Requirement: Other',
    'The system SHALL other.',
    '',
    '#### Scenario: T',
    '- **WHEN** c',
    '- **THEN** d',
    '',
  ];
  const REMOVE = [
    '# demo - Changes',
    '',
    '## REMOVED Requirements',
    '',
    '### Requirement: Target',
    '**Reason**: x.',
    '**Migration**: None.',
    '',
  ];

  it.each([
    { what: 'an indented note', line: '   ### Notes' },
    { what: 'an unindented note', line: '### Notes' },
    { what: 'an indented requirement header', line: '   ### Requirement: Absorbed' },
    { what: 'an empty ATX heading', line: '###' },
  ])('warns that $what goes with the requirement it sits in', async ({ line }) => {
    const { warnings } = await build(SPEC([line, 'Kept by hand.']), REMOVE);
    expect(warnings.join('\n')).toContain(line.trim());
    expect(warnings.join('\n')).toContain('vai com ele');
  });

  it('says nothing when a requirement holds only its own content', async () => {
    const { warnings } = await build(SPEC([]), REMOVE);
    expect(warnings.join('\n')).not.toContain('vai com ele');
  });

  it('does not warn about a requirement left untouched', async () => {
    // A nota está em `Target`, que este delta não menciona.
    const { warnings } = await build(SPEC(['   ### Notes', 'Kept by hand.']), [
      '# demo - Changes',
      '',
      '## ADDED Requirements',
      '',
      '### Requirement: Fresh',
      'The system SHALL be fresh.',
      '',
      '#### Scenario: F',
      '- **WHEN** a',
      '- **THEN** b',
      '',
    ]);
    expect(warnings.join('\n')).not.toContain('vai com ele');
  });

  it('ignores a heading inside a fenced example', async () => {
    const { warnings } = await build(
      SPEC(['```markdown', '### Requirement: Example', '```']),
      REMOVE
    );
    expect(warnings.join('\n')).not.toContain('vai com ele');
  });

  it("leaves a requirement's own scenarios alone", async () => {
    // `####` não pode contar, ou todo requirement pareceria conter conteúdo
    // estranho.
    const { warnings } = await build(SPEC([]), REMOVE);
    expect(warnings.join('\n')).not.toContain('Scenario');
  });

  it('does not warn when RENAMED carries the full absorbed tail forward', async () => {
    const tail = ['   ### Notes', 'Kept by hand.'];
    const { rebuilt, counts, warnings } = await build(SPEC(tail), [
      '# demo - Changes',
      '',
      '## RENAMED Requirements',
      '',
      '- FROM: `### Requirement: Target`',
      '- TO: `### Requirement: Renamed`',
      '',
    ]);

    expect(rebuilt).toContain(tail.join('\n'));
    expect(counts.renamed).toBe(1);
    expect(warnings.join('\n')).not.toContain('vai com ele');
  });

  it('warns against the source requirement when a rename-plus-modify drops its tail', async () => {
    const tail = ['   ### Notes', 'Kept by hand.'];
    const renamedRequirement = [...REQUIREMENT];
    renamedRequirement[0] = '### Requirement: Renamed';
    const { rebuilt, counts, warnings } = await build(SPEC(tail), [
      '# demo - Changes',
      '',
      '## RENAMED Requirements',
      '',
      '- FROM: `### Requirement: Target`',
      '- TO: `### Requirement: Renamed`',
      '',
      '## MODIFIED Requirements',
      '',
      ...renamedRequirement,
      '',
    ]);

    expect([...rebuilt.matchAll(/^### Requirement:\s*(.+?)\s*$/gm)].map((m) => m[1])).toEqual([
      'Renamed',
      'Other',
    ]);
    expect(rebuilt).not.toContain(tail.join('\n'));
    expect(counts).toMatchObject({ modified: 1, renamed: 1 });
    expect(warnings.join('\n')).toContain(
      '"### Notes" está dentro do requisito "Target" e vai com ele'
    );
    expect(warnings.join('\n')).not.toContain('requisito "Renamed"');
  });

  it('does not warn when MODIFIED carries the full absorbed tail forward', async () => {
    const tail = ['   ### Notes', 'Kept by hand.'];
    const { rebuilt, counts, warnings } = await build(SPEC(tail), [
      '# demo - Changes',
      '',
      '## MODIFIED Requirements',
      '',
      ...REQUIREMENT,
      '',
      ...tail,
      '',
    ]);

    expect(rebuilt).toContain(tail.join('\n'));
    expect(counts.modified).toBe(0);
    expect(warnings.join('\n')).not.toContain('vai com ele');
  });

  it('warns when MODIFIED keeps the heading but drops part of the absorbed tail', async () => {
    const tail = ['   ### Notes', 'Kept by hand.'];
    const { rebuilt, warnings } = await build(SPEC(tail), [
      '# demo - Changes',
      '',
      '## MODIFIED Requirements',
      '',
      ...REQUIREMENT,
      '',
      tail[0],
      '',
    ]);

    expect(rebuilt).not.toContain(tail[1]);
    expect(warnings.join('\n')).toContain(tail[0].trim());
    expect(warnings.join('\n')).toContain('vai com ele');
  });

  it('does not let an identical earlier copy mask loss of the absorbed tail', async () => {
    const repeated = ['   ### Notes', 'Kept by hand.'];
    const requirementWithExample = [
      '### Requirement: Target',
      'The system SHALL target.',
      '',
      '```markdown',
      ...repeated,
      '```',
      '',
      '#### Scenario: S',
      '- **WHEN** a',
      '- **THEN** b',
    ];
    const spec = [
      '# demo Specification',
      '',
      '## Purpose',
      'Why this exists.',
      '',
      '## Requirements',
      '',
      ...requirementWithExample,
      '',
      ...repeated,
      '',
      '### Requirement: Other',
      'The system SHALL other.',
      '',
      '#### Scenario: T',
      '- **WHEN** c',
      '- **THEN** d',
      '',
    ];
    const { rebuilt, warnings } = await build(spec, [
      '# demo - Changes',
      '',
      '## MODIFIED Requirements',
      '',
      ...requirementWithExample,
      '',
    ]);

    expect(rebuilt).toContain(repeated.join('\n'));
    expect(warnings.join('\n')).toContain(repeated[0].trim());
    expect(warnings.join('\n')).toContain('vai com ele');
  });

  it('rewrites the spec exactly as before - nothing is moved', async () => {
    const { rebuilt } = await build(SPEC(['   ### Notes', 'Kept by hand.']), REMOVE);
    // A nota é reportada, não relocada: ela vai com o requirement, que é o
    // comportamento pré-existente que este aviso existe para expor.
    expect(rebuilt).not.toContain('Kept by hand.');
    expect(rebuilt).toContain('### Requirement: Other');
  });
});

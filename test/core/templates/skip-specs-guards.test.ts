import { describe, expect, it } from 'vitest';

import {
  getOpsxProposeSkillTemplate,
  getOpsxProposeCommandTemplate,
  getFfChangeSkillTemplate,
  getOpsxFfCommandTemplate,
  getContinueChangeSkillTemplate,
  getOpsxContinueCommandTemplate,
  getUpdateChangeSkillTemplate,
  getOpsxUpdateCommandTemplate,
  getArchiveChangeSkillTemplate,
  getOpsxArchiveCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

// skip_specs (#1399) carve-out guards, ported from upstream's
// test/core/templates/propose.test.ts. Upstream's full file also pins the
// artifact loop guards (#788/#1260/#1412), which the fork's templates have
// not received yet; when those land, this file merges back into the port of
// the upstream file.
const proposeFfBodies: Array<[string, string]> = [
  ['propose skill', getOpsxProposeSkillTemplate().instructions],
  ['propose command', getOpsxProposeCommandTemplate().content],
  ['ff skill', getFfChangeSkillTemplate().instructions],
  ['ff command', getOpsxFfCommandTemplate().content],
];

const continueBodies: Array<[string, string]> = [
  ['continue skill', getContinueChangeSkillTemplate().instructions],
  ['continue command', getOpsxContinueCommandTemplate().content],
];

const continueUpdateBodies: Array<[string, string]> = [
  ...continueBodies,
  ['update skill', getUpdateChangeSkillTemplate().instructions],
  ['update command', getOpsxUpdateCommandTemplate().content],
];

const archiveBodies: Array<[string, string]> = [
  ['archive skill', getArchiveChangeSkillTemplate().instructions],
  ['archive command', getOpsxArchiveCommandTemplate().content],
];

describe('skip_specs template guards (#1399)', () => {
  // An artifact the CLI already reports as `skipped` is satisfied and must
  // never be written, or the agent creates spec files that `openspec
  // validate` then rejects as conflicting with the marker.
  it('treats a `skipped` status as satisfied and never creates the artifact', () => {
    for (const [label, body] of proposeFfBodies) {
      expect(body, label).toContain('status: "skipped"');
      expect(body, label).toContain('NÃO devem existir. Nunca tente criá-lo');
      expect(body, label).toContain('estiverem `done` ou `skipped`');
    }
  });

  it('documents the skipped/warning fields in the instructions JSON', () => {
    for (const [label, body] of [...proposeFfBodies, ...continueBodies]) {
      expect(body, label).toContain('`skipped`/`warning`');
      expect(body, label).toContain('NÃO deve ser criado');
    }
  });

  it('lists the skipped status wherever status values are enumerated', () => {
    for (const [label, body] of continueUpdateBodies) {
      expect(body, label).toContain('("done", "skipped", "ready", "blocked")');
    }
    for (const [label, body] of archiveBodies) {
      expect(body, label).toContain('(`done`, `skipped` ou outro)');
    }
  });

  it('archive accepts skipped artifacts as satisfying the completion check', () => {
    for (const [label, body] of archiveBodies) {
      expect(body, label).toContain('não estiver `done` nem `skipped`');
      expect(body, label).toContain('a change declara skip_specs');
    }
  });
});

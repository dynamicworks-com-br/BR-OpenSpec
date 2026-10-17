import { describe, expect, it } from 'vitest';

import {
  getApplyChangeSkillTemplate,
  getOpsxApplyCommandTemplate,
} from '../src/core/templates/skill-templates.js';

// This fork has no docs-lab site. The apply skill and command templates are
// what the agent is told, so the task-location contract is pinned there.
const bodies: Array<[string, string]> = [
  ['skill', getApplyChangeSkillTemplate().instructions],
  ['command', getOpsxApplyCommandTemplate().content],
];

describe('apply task location guidance', () => {
  it('updates the checkbox at the returned sourcePath and line', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('`sourcePath`');
      expect(body, label).toContain('`line`');
      expect(body, label).toContain(
        'Antes de editar, confirme que o checkbox no `sourcePath` e na `line` retornados ainda corresponde à descrição da tarefa'
      );
      expect(body, label).toContain(
        'Marque a tarefa como concluída no `sourcePath` e na `line` retornados'
      );
      expect(body, label).toContain(
        'Use o sourcePath e a line de cada tarefa para atualizar o checkbox exato'
      );
      expect(body, label).not.toContain('touches only the tasks file');
    }
  });
});

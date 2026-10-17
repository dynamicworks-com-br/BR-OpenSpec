import { describe, expect, it } from 'vitest';

import { getSkillTemplates } from '../src/core/shared/skill-generation.js';

// This fork has no docs-lab skills page. Archive's sync handoff lives in the
// template and is chosen at generation time: with sync installed the agent
// runs that workflow; without it, the agent merges the delta itself.
function archiveInstructions(workflows: string[]): string {
  const entry = getSkillTemplates(workflows).find((item) => item.workflowId === 'archive');
  expect(entry).toBeDefined();
  return entry!.template.instructions;
}

describe('archive sync handoff', () => {
  it('runs the sync workflow when it is installed (#1975)', () => {
    const body = archiveInstructions(['archive', 'sync']);
    expect(body).toContain('execute o workflow `openspec-sync-specs` inline');
    expect(body).not.toContain('faça você mesmo a mesclagem do delta para o spec principal inline');
  });

  it('merges the delta itself when the sync workflow is not installed (#1975)', () => {
    const body = archiveInstructions(['archive']);
    expect(body).toContain('faça você mesmo a mesclagem do delta para o spec principal inline');
    expect(body).not.toContain('openspec-sync-specs');
  });
});

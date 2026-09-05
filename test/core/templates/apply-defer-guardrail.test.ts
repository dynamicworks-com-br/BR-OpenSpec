import { describe, it, expect } from 'vitest';
import {
  getApplyInstructions,
  getApplyChangeSkillTemplate,
  getOpsxApplyCommandTemplate,
} from '../../../src/core/templates/workflows/apply-change.js';

// #1529: agents were silently simplifying or deferring work mid-apply and
// marking tasks done anyway. The apply instructions must tell the agent to
// surface unexpected scope instead of absorbing it, on both surfaces.
describe('apply instructions surface deferred scope (#1529)', () => {
  const instructions = getApplyInstructions();

  it('tells the agent to surface added scope rather than defer or simplify', () => {
    expect(instructions).toContain('traga o escopo adicional à tona');
    expect(instructions).toContain('além do que a spec descreve');
    expect(instructions).toMatch(/nunca reduza, adie/);
  });

  it('requires pausing, not just reporting and continuing', () => {
    // The agent must hand control back, not surface the scope and press on.
    expect(instructions).toContain('traga o escopo adicional à tona e pause');
  });

  it('forbids marking a task complete when it is only partially done', () => {
    expect(instructions).toMatch(
      /Só marque uma tarefa .* quando o comportamento especificado estiver totalmente implementado/
    );
  });

  it('carries the same guidance on both the skill and command surfaces', () => {
    const needle = 'traga o escopo adicional à tona';
    expect(getApplyChangeSkillTemplate().instructions).toContain(needle);
    expect(getOpsxApplyCommandTemplate().content).toContain(needle);
  });
});

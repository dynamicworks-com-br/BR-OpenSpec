import { describe, expect, it } from 'vitest';

import {
  getUpdateChangeSkillTemplate,
  getOpsxUpdateCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getUpdateChangeSkillTemplate();
const command = getOpsxUpdateCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

describe('update-change templates', () => {
  it('generates the expected skill and command shape (3.1)', () => {
    expect(skill.name).toBe('openspec-update-change');
    expect(skill.description).toContain('Nunca edita código');
    expect(skill.license).toBe('MIT');
    expect(skill.compatibility).toBe('Requer openspec CLI.');
    expect(skill.metadata).toEqual({ author: 'openspec', version: '1.0' });

    expect(command.name).toBe('OPSX: Update');
    expect(command.category).toBe('Workflow');
    expect(command.tags).toEqual(['workflow', 'artifacts', 'experimental']);
    expect(command.content).toContain('/opsx:update add-auth');

    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec list --json');
      expect(body, label).toContain('openspec status --change "<nome>" --json');
      expect(body, label).toContain('openspec instructions <artifact-id> --change "<nome>" --json');
    }
  });

  it('reads artifact ids from status JSON and never branches on hardcoded artifact names (3.2)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('NÃO os assuma e NÃO ramifique com base em nomes de artifact fixos');
      expect(body, label).toContain('nunca ramifique com base em nomes de artifact fixos');
      expect(body, label).toContain('Schemas personalizados devem funcionar sem alterações');
      // No literal artifact filenames anywhere: no proposal.md/design.md/tasks.md
      // branching, and no worked example that names them. The only .md literal
      // allowed is the specs/**/*.md glob illustration.
      expect(body.replace(/specs\/\*\*\/\*\.md/g, ''), label).not.toMatch(/\b[\w-]+\.md\b/);
    }
  });

  it('edits planning artifacts only, hands code off to /opsx:apply, never advances the frontier (3.3)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Nunca edite código');
      expect(body, label).toContain('NUNCA edite código de implementação');
      expect(body, label).toContain('pare e aponte para `/opsx:apply`');
      expect(body, label).toContain('Não avance a fronteira de construção');
      expect(body, label).toContain('NÃO crie artifacts que ainda não existem');
    }
  });

  it('writes to existingOutputPaths, never to a glob resolvedOutputPath (3.4)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('artifactPaths.<id>.existingOutputPaths');
      expect(body, label).toContain('NÃO escreva em `resolvedOutputPath`');
      expect(body, label).toContain('ainda é o padrão glob, não um arquivo real');
    }
  });

  it('ends with next-step guidance and never acts on it (3.5)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('apenas orientação - NUNCA aja sobre ele');
      expect(body, label).toContain('sugira `/opsx:continue`');
      expect(body, label).toContain('sugira `/opsx:apply`');
      expect(body, label).toContain('sugira `/opsx:archive`');
      expect(body, label).toContain('o código pode não corresponder mais ao plano revisado');
    }
  });

  it('confirms every edit and redirects intent changes to /opsx:new', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Escreva somente após o usuário confirmar');
      expect(body, label).toContain('Se o usuário rejeitar uma revisão, não a escreva');
      expect(body, label).toContain('recomende começar do zero com `/opsx:new`');
      expect(body, label).toContain('Atualizar vs. Começar do Zero');
    }
  });
});

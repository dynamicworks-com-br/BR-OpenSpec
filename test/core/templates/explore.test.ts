import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOpsxExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getExploreSkillTemplate();
const command = getOpsxExploreCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body. Ported from upstream's
// test/core/templates/explore.test.ts with string assertions translated
// to match the fork's PT-BR template prose.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

describe('explore templates', () => {
  // Regression for #696: explore never loaded the project's declared
  // context, so it reasoned without the tech stack, conventions, and
  // rules every artifact-creating workflow already receives.
  it('loads project context from the OpenSpec config at startup (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec/config.yaml');
      expect(body, label).toContain('`context`: background do projeto');
      expect(body, label).toContain('`rules`: indexadas por id de artifact');
    }
  });

  it('resolves the config through the reported root rather than assuming a repo-local path (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec list --json');
      expect(body, label).toContain('<root.path>/openspec/config.yaml');
      expect(body, label).toContain('root.path');
    }
  });

  // resolveConfigFilePath() probes config.yaml then config.yml, and
  // `openspec init` leaves a .yml project on .yml forever - naming only
  // .yaml would silently skip context for those projects.
  it('accepts config.yml as well as config.yaml (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('config.yml');
      expect(body, label).toContain('pule isto se nenhum dos dois arquivos existir');
    }
  });

  // `rules` is Record<artifactId, string[]>; explore holds no artifact at
  // startup, so the guidance must not invite blanket application.
  it('scopes rules to the artifact they are keyed to (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'as entradas de um artifact se aplicam apenas quando você escreve aquele artifact'
      );
    }
  });

  // House style across instructions.ts and the sibling workflow templates
  // forbids leaking context/rules into the artifact, not just the chat.
  it('treats project context as constraints that must not leak into output (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('restrições para você seguir');
      expect(body, label).toContain(
        'NÃO as copie para a conversa nem para nenhum artifact que você criar'
      );
    }
  });
});

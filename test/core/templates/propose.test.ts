import path from 'path';
import { fileURLToPath } from 'url';
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
import { loadSchema } from '../../../src/core/artifact-graph/schema.js';

// Port of upstream's test/core/templates/propose.test.ts (#788/#1260/#1412),
// with string assertions translated to the fork's PT-BR template prose.
// The skip_specs guards (#1399) that lived in skip-specs-guards.test.ts merged
// back into this file now that the artifact loop guards landed, per the note
// that file carried.

const proposeBodies: Array<[string, string]> = [
  ['propose skill', getOpsxProposeSkillTemplate().instructions],
  ['propose command', getOpsxProposeCommandTemplate().content],
];

// ff runs the byte-identical artifact loop, so it carries the identical guards.
const loopBodies: Array<[string, string]> = [
  ...proposeBodies,
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

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const defaultSchema = loadSchema(path.join(repoRoot, 'schemas', 'spec-driven', 'schema.yaml'));

/** O trecho inicial que diz ao agente quais artifacts o propose vai produzir. */
function artifactPreamble(body: string): string {
  const start = body.indexOf('Vou criar uma change com');
  const end = body.indexOf('Quando pronto para implementar');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return body.slice(start, end);
}

describe('propose preamble', () => {
  // #788/#1260: the preamble advertised proposal/design/tasks only, so agents
  // treated specs as optional and produced changes with no spec at all.
  // Derived from the schema so a new artifact cannot go unadvertised.
  it('advertises every artifact the default schema defines (#788, #1260)', () => {
    const ids = defaultSchema.artifacts.map(artifact => artifact.id);
    expect(ids).toContain('specs');

    for (const [label, body] of proposeBodies) {
      const preamble = artifactPreamble(body);
      for (const id of ids) {
        expect(preamble, `${label} preamble is missing the "${id}" artifact`).toContain(id);
      }
    }
  });
});

describe('instruction field authority (propose, continue and ff)', () => {
  // #777: custom schemas reusing familiar artifact names were overridden by
  // hard-coded spec-driven patterns embedded in the templates. The schema's
  // instruction field is now the authoritative guidance, and delegated
  // creation is invoked and verified at the creation step and restated in
  // the guidelines. (Ported from the focused assertion upstream added to
  // skill-templates-parity.test.ts in #1405; the fork's parity test is
  // hash-based and regenerated centrally, so the behavioral pin lives here.)
  const allBodies: Array<[string, string]> = [...loopBodies, ...continueBodies];

  it('states the instruction field is the authoritative guidance', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).toContain('orientação autoritativa');
    }
  });

  it('invokes delegated creation at the creation step and verifies the artifact', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).toContain(
        'Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o para produzir o artifact em vez de escrever o arquivo você mesmo'
      );
      expect(body, label).toContain('verifique se o arquivo do artifact existe');
    }
  });

  it('restates the delegation in the guidelines', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).toContain('invoque-o em vez de escrever o artifact diretamente');
    }
  });

  it('keeps the old hard-coded common artifact patterns gone', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).not.toContain('Padrões comuns de artifacts');
    }
  });
});

describe('artifact loop guards (propose and ff)', () => {
  // `status` is file-existence based (detectCompleted), so writing tasks.md before
  // specs flips tasks to done and satisfies a bare applyRequires stop condition
  // with specs never created. That is the #1260 failure chain.
  it('warns that a done applyRequires artifact does not imply its deps exist (#788, #1260)', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toMatch(/apenas existência de arquivo/i);
      expect(body, label).toMatch(/NÃO significa que suas dependências existam/i);
    }
  });

  // Scoped to the applyRequires closure, not to every `ready` artifact: a custom
  // schema may define artifacts outside it (e.g. a post-implementation retro)
  // that propose has no business creating.
  it('scopes the required set to the applyRequires dependency closure', () => {
    for (const [label, body] of loopBodies) {
      // Names the seed the walk starts from (`a partir deles`) so an agent cannot
      // read it as "every artifact that has requires edges" = the whole list.
      expect(body, label).toContain('alcançável a partir deles seguindo as arestas `requires`');
      // Points at status --json specifically (instructions calls the edges `dependencies`).
      expect(body, label).toContain('do `status --json`');
      expect(body, label).toContain('percorra-as transitivamente');
      expect(body, label).toContain('Deixe artifacts fora desse conjunto em paz');
    }
  });

  // alfred's PR #1412 blocker: `status --json` must carry the `requires` edges,
  // and the loop must derive the set from those edges rather than from `status`.
  // A `done` artifact hides nothing about its deps if the agent reads its edges.
  it('builds the required set from requires edges, not from status (#1412 review)', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'Use as arestas `requires` de cada artifact, não o `status`, para montar o conjunto necessário'
      );
      expect(body, label).toContain('um artifact `done` ainda lista do que depende');
    }
  });

  // The status-JSON parse list must document the `requires` field the loop relies on.
  it('documents the requires edges in the status JSON it tells the agent to parse', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'cada um com seu `status` e suas arestas `requires`'
      );
    }
  });

  it('creates every missing artifact in the set and re-checks for cascades', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('Crie todo artifact do conjunto necessário que estiver faltando');
      expect(body, label).toMatch(/verifique novamente - criar um pode desbloquear outros/i);
    }
  });

  // specs must not be skippable — `openspec validate` rejects a change with no
  // deltas. "Required" is not machine-readable (the graph has tasks requiring
  // both specs and design), but the artifact's own instruction is: spec-driven's
  // design says "create only if any apply", specs says nothing of the kind.
  it('permits skipping only artifacts their own instruction marks conditional', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'Pule um apenas quando o próprio `instruction` dele disser que é condicional'
      );
      expect(body, label).toContain('não reconsidere');
    }
  });

  // The skip decision hinges on reading the artifact's `instruction` field, so
  // the loop must explicitly tell the agent to fetch it before skipping -
  // otherwise a momentum-driven agent can skip specs without ever checking.
  it('makes the agent fetch and read the instruction field before skipping', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'execute `openspec instructions <artifact-id> --change "<nome>" --json` e pule somente se o campo `instruction` o marcar como opcional'
      );
      expect(body, label).toContain('`specs` nunca');
    }
  });

  // The 4b heading must not re-state the buggy stop condition (apply.requires
  // alone); it has to point the agent at the whole required set.
  it('frames the loop around the required set, not apply.requires alone', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'Continue até que todos os artifacts do conjunto necessário existam (não apenas o `apply.requires`)'
      );
      expect(body, label).not.toContain(
        'Continue até todos os artifacts `applyRequires` estarem completos'
      );
    }
  });

  // The step-4 TITLE must not use "apply-ready" either: in the prewritten-tasks
  // case the change is already apply-ready when step 4 begins, so a title of
  // "create ... until apply-ready" invites the exact early-stop this PR kills.
  it('titles the create step around the required set, not "apply-ready"', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('**Crie todos os artifacts do conjunto necessário**');
      expect(body, label).not.toContain('Crie artifacts em sequência até estar pronto para apply');
      expect(body, label).not.toMatch(/^\s*4\.\s.*pronto para apply/m);
    }
  });

  // Without this the loop deadlocks: skipping design leaves tasks blocked
  // forever, no artifact is ready, and the stop condition can never be met.
  // docs/concepts.md: "Dependencies are enablers, not gates."
  it('authorizes writing a blocked artifact whose only blocker was skipped', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('Dependências são facilitadoras, não portões');
      expect(body, label).toMatch(
        /ainda estiver `blocked` apenas porque você pulou uma dependência condicional, escreva-o assim mesmo/
      );
    }
  });

  // The stop condition must cover the whole required set. A bare "stop when
  // applyRequires is done" is the lenient rule #1260 blames. In the fork the
  // stop line also honors the skip_specs `skipped` status.
  it('stops on the whole required set, not on applyRequires alone', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'Pare quando todos os artifacts do conjunto necessário estiverem `done` ou `skipped`, ou tiverem sido deliberadamente pulados'
      );
      expect(body, label).not.toContain('Pare quando todos os artifacts `applyRequires` estiverem');
    }
  });

  // The Guardrails section used to define completeness as `apply.requires`,
  // which is exactly the premise this fix refutes.
  it('does not define completeness as apply.requires in the guardrails', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).not.toContain(
        'Crie TODOS os artifacts necessários para implementação (conforme definido pelo `apply.requires` do schema)'
      );
      expect(body, label).toContain(
        'Crie todo artifact do qual a fase de apply depende transitivamente'
      );
    }
  });

  // specs `generates` a glob (specs/**/*.md), so an agent told only to "write it
  // to outputPath" would create a directory literally named `**`.
  it('tells the agent how to resolve a glob output path', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'for um glob, siga o `instruction` para escolher o caminho concreto do arquivo'
      );
    }
  });
});

describe('skip_specs template guards (#1399)', () => {
  // An artifact the CLI already reports as `skipped` is satisfied and must
  // never be written, or the agent creates spec files that `openspec
  // validate` then rejects as conflicting with the marker.
  it('treats a `skipped` status as satisfied and never creates the artifact', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('status: "skipped"');
      expect(body, label).toContain('NÃO devem existir. Nunca tente criá-lo');
      expect(body, label).toContain('estiverem `done` ou `skipped`');
    }
  });

  it('documents the skipped/warning fields in the instructions JSON', () => {
    for (const [label, body] of [...loopBodies, ...continueBodies]) {
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

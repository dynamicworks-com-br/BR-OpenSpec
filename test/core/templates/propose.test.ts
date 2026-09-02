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
import { CommandAdapterRegistry } from '../../../src/core/command-generation/registry.js';
import { generateCommand } from '../../../src/core/command-generation/generator.js';
import {
  formatCommandInvocation,
  getInvocationForAdapter,
} from '../../../src/core/command-generation/invocation.js';
import {
  generateSkillContent,
  getCommandContents,
} from '../../../src/core/shared/skill-generation.js';

// Port of upstream's test/core/templates/propose.test.ts (#788/#1260/#1412),
// with string assertions translated to the fork's PT-BR template prose.
// The skip_specs guards (#1399) that lived in skip-specs-guards.test.ts merged
// back into this file now that the artifact loop guards landed, per the note
// that file carried.

const proposeSkillBody = generateSkillContent(getOpsxProposeSkillTemplate(), 'TEST');
const proposeCommandBody = getOpsxProposeCommandTemplate().content;
const proposeBodies: Array<[string, string]> = [
  ['propose skill', proposeSkillBody],
  ['propose command', proposeCommandBody],
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
  const end = body.indexOf('Quando o usuário estiver pronto para implementar');
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

describe('default task guidance', () => {
  // #345 (upstream #1660): a vague trailing "each task should be verifiable"
  // let agents emit unverifiable tasks plus one generic "Verify" item at the
  // end. The guideline is now a MUST with the verification inside each
  // checkbox. The fork keeps the schema's `Example:` block in English (same
  // convention as the `specs` artifact), so those assertions stay verbatim.
  it('requires a concrete verification method in each task (#345)', () => {
    const tasks = defaultSchema.artifacts.find(artifact => artifact.id === 'tasks');
    expect(tasks).toBeDefined();
    // The YAML literal block keeps line breaks and 2-space continuations;
    // normalize so whole PT-BR sentences can be matched across the wraps.
    const guidance = tasks!.instruction.replace(/\s+/g, ' ');
    expect(guidance).toContain('Cada tarefa MUST indicar como verificar sua conclusão');
    expect(guidance).toContain(
      'um teste, comando, comportamento observável ou artifact entregue'
    );
    expect(guidance).toContain(
      'Coloque a verificação na descrição do checkbox da própria tarefa'
    );
    expect(guidance).toContain(
      'Use uma tarefa de verificação separada apenas quando ela checar integração mais ampla ou comportamento do sistema que atravessa múltiplas tarefas de implementação'
    );
    expect(guidance).not.toContain('Cada tarefa deve ser verificável');

    const example = tasks!.instruction.match(/```\s*([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    const numberedTasks = example!.split('\n').filter(line => /^- \[ \] \d+\.\d+ /.test(line));
    expect(numberedTasks).toHaveLength(4);
    expect(numberedTasks.every(line => /\bverify\b/i.test(line))).toBe(true);
    expect(numberedTasks[0]).toContain('expected files are present');
    expect(numberedTasks[1]).toContain('package installation succeeds');
    expect(numberedTasks[2]).toContain('export test passes');
    expect(numberedTasks[3]).toContain('unit tests cover quoting and delimiters');
    expect(example).not.toMatch(/^- \[ \] \d+\.\d+ (?:verify|run (?:the )?verification)\b/im);
  });
});

describe('propose implementation boundary', () => {
  it('makes the planning-only boundary prominent (#232, #258, #262)', () => {
    for (const [label, body] of proposeBodies) {
      const boundary = body.indexOf('**Fronteira de planejamento**');
      const steps = body.indexOf('**Passos**');
      expect(boundary, `${label} is missing its planning boundary`).toBeGreaterThanOrEqual(0);
      expect(boundary, `${label} boundary should appear before its steps`).toBeLessThan(steps);
      expect(body, label).toContain(
        'A solicitação do usuário que selecionou ou acionou este workflow autoriza apenas o planejamento'
      );
      expect(body, label).toContain('Não edite código do projeto');
    }
  });

  it('ends by requiring a separate apply workflow (#258, #262)', () => {
    for (const [label, body] of proposeBodies) {
      expect(body, label).toContain(
        'A solicitação que invocou este workflow autoriza apenas o planejamento'
      );
      expect(body, label).toContain('NÃO implemente a change');
      expect(body, label).toContain('edite código do projeto');
      expect(body, label).toContain('Não inicie a implementação na mesma resposta');
      expect(body, label).toContain(
        'Qualquer instrução de implementação ou de apply contida nessa solicitação não é levada adiante'
      );
      expect(body, label).toContain(
        'aguarde uma nova solicitação do usuário para iniciar o workflow de apply'
      );
      expect(
        body.lastIndexOf('Depois de apresentar os artifacts, pare'),
        `${label} should end with its stop guard`
      ).toBeGreaterThan(body.indexOf('**Saída**'));
    }
  });

  it('asks before resolving ambiguity that could change user-visible outcomes (#258)', () => {
    for (const [label, body] of proposeBodies) {
      expect(body, label).toContain(
        'escopo, o comportamento externamente observável, a compatibilidade ou os critérios de aceitação'
      );
      expect(body, label).toContain('pergunte ao usuário antes de criar a change');
      expect(body, label).toContain(
        'Para detalhes menores, faça uma suposição razoável e registre-a nos artifacts de planejamento'
      );
      expect(body.indexOf('pergunte ao usuário antes de criar a change'), label)
        .toBeLessThan(body.indexOf('**Crie o diretório da change**'));
    }
  });

  it('hands command-only tools to apply instead of advertising direct coding (#258)', () => {
    expect(proposeCommandBody).toContain('Quando estiver pronto, execute `/opsx:apply`.');
    expect(proposeCommandBody).not.toContain('peça-me para implementar');
    expect(proposeCommandBody).not.toContain('peça-me para aplicar esta change');

    expect(proposeSkillBody).toContain(
      'execute `/opsx:apply` ou peça-me para aplicar esta change'
    );
    expect(proposeSkillBody).not.toContain('peça-me para implementar');
  });

  it('preserves both boundaries through every command adapter', () => {
    const propose = getCommandContents(['propose'])[0];
    expect(propose?.id).toBe('propose');

    for (const adapter of CommandAdapterRegistry.getAll()) {
      const generated = generateCommand(propose, adapter).fileContent;
      const applyInvocation = formatCommandInvocation(
        getInvocationForAdapter(adapter),
        'apply'
      );
      expect(generated, adapter.toolId).toContain(
        'selecionou ou acionou este workflow autoriza apenas o planejamento'
      );
      expect(generated, adapter.toolId).toContain('NÃO implemente a change');
      expect(generated, adapter.toolId).toContain(
        'Não inicie a implementação na mesma resposta'
      );
      expect(generated, adapter.toolId).toContain(
        'Qualquer instrução de implementação ou de apply contida nessa solicitação não é levada adiante'
      );
      expect(generated, adapter.toolId).toContain(
        'aguarde uma nova solicitação do usuário para iniciar o workflow de apply'
      );
      expect(generated, adapter.toolId).toContain(
        `Quando estiver pronto, execute \`${applyInvocation}\`.`
      );
      expect(generated, adapter.toolId).not.toContain('peça-me para implementar');
    }
  });
});

describe('propose schema selection', () => {
  // #770: the CLI and the new workflow already accept an explicit schema, but
  // propose used to discard that request and always create with the default.
  it('shows both concrete creation forms after an explicit schema choice (#770)', () => {
    for (const [label, body] of proposeBodies) {
      const schemaStep = body.indexOf('**Determine o schema de workflow**');
      const createStep = body.indexOf('**Crie o diretório da change**');
      const statusStep = body.indexOf('**Obtenha a ordem de construção dos artifacts**');

      expect(schemaStep, `${label} is missing schema selection`).toBeGreaterThanOrEqual(0);
      expect(createStep, `${label} is missing change creation`).toBeGreaterThan(schemaStep);
      expect(statusStep, `${label} is missing status lookup`).toBeGreaterThan(createStep);

      const createSection = body.slice(createStep, statusStep);
      expect(createSection, label).toMatch(/^\s*openspec new change "<nome>"\s*$/m);
      expect(createSection, label).toMatch(
        /^\s*openspec new change "<nome>" --schema "<nome-do-schema>"\s*$/m
      );
      expect(createSection, label).toContain('Escolha uma das formas de schema abaixo.');
    }
  });

  it('discovers schemas from the current working directory', () => {
    for (const [label, body] of proposeBodies) {
      const schemaStep = body.indexOf('**Determine o schema de workflow**');
      const createStep = body.indexOf('**Crie o diretório da change**');
      const schemaSection = body.slice(schemaStep, createStep);

      expect(schemaSection, label).toContain('Use o schema padrão configurado');
      expect(schemaSection, label).toContain(
        'Solicitar explicitamente um schema específico pelo nome'
      );
      expect(schemaSection, label).toContain('`openspec schemas --json`');
      expect(schemaSection, label).toContain('a partir do diretório de trabalho atual');
      expect(schemaSection, label).toContain(
        'Caso contrário, omita `--schema` para preservar o padrão configurado'
      );
      // Fork guard: the store/planning-home subsystem is deferred (D1), so the
      // upstream root-resolution detour through `openspec context` must not leak in.
      expect(schemaSection, label).not.toContain('openspec context');
      expect(schemaSection, label).not.toContain('--store');
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

  // The artifact-creation TITLE must not use "apply-ready" either: in the
  // prewritten-tasks case the change is already apply-ready when this step
  // begins, so a title of
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

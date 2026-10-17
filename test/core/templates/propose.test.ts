import fs from 'node:fs';
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
import { MAX_CONTEXT_SIZE } from '../../../src/core/project-config.js';
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';
import { parseTaskLines } from '../../../src/utils/task-progress.js';

// Templates carry optional-workflow conditionals; a body only means anything
// once resolved against a workflow set. Unless a test says otherwise, these are
// the bodies a profile with every workflow installed receives.
const withAll = (body: string) =>
  resolveOptionalWorkflows(body, new Set<string>(ALL_WORKFLOWS));
const withoutApply = (body: string) =>
  resolveOptionalWorkflows(
    body,
    new Set<string>(ALL_WORKFLOWS.filter((id) => id !== 'apply'))
  );

const proposeSkillBody = withAll(getOpsxProposeSkillTemplate().instructions);
const proposeCommandBody = withAll(getOpsxProposeCommandTemplate().content);
const asDeployed = <T extends { instructions: string }>(template: T): T => ({
  ...template,
  instructions: withAll(template.instructions),
});

const proposeBodies: Array<[string, string]> = [
  ['propose skill', generateSkillContent(asDeployed(getOpsxProposeSkillTemplate()), 'TEST')],
  ['propose command', proposeCommandBody],
];

// ff runs the byte-identical artifact loop, so it carries the identical guards.
const loopBodies: Array<[string, string]> = [
  ...proposeBodies,
  ['ff skill', withAll(getFfChangeSkillTemplate().instructions)],
  ['ff command', withAll(getOpsxFfCommandTemplate().content)],
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

describe('default proposal guidance', () => {
  it('frames new capabilities as durable behavior boundaries (#1965)', () => {
    const proposal = defaultSchema.artifacts.find(artifact => artifact.id === 'proposal');
    expect(proposal).toBeDefined();
    expect(proposal!.instruction).toContain(
      'Nomeie cada capability por um comportamento durável do sistema'
    );
    expect(proposal!.instruction).toContain(
      'não pelo trabalho desta change'
    );
    expect(proposal!.instruction).toContain(
      'possa abrigar requirements relacionados à medida que o sistema evolui'
    );
    expect(proposal!.instruction).toContain('evite capabilities genéricas que tentam cobrir tudo');

    const template = fs.readFileSync(
      path.join(repoRoot, 'schemas', 'spec-driven', 'templates', 'proposal.md'),
      'utf-8'
    );
    expect(template).toMatch(
      /Nomeie cada capacidade por um comportamento coeso\s+do sistema, que possa abrigar requirements relacionados à medida que o sistema evolui/
    );
    expect(template).toMatch(/Não nomeie\s+tarefas de implementação nem seções da proposta/);
    expect(template).toContain('Evite nomes genéricos');
  });
});

describe('default task guidance', () => {
  it('keeps tracked tasks within the pre-archive workflow (#1790)', () => {
    const tasks = defaultSchema.artifacts.find(artifact => artifact.id === 'tasks');
    expect(tasks).toBeDefined();
    expect(tasks!.instruction).toMatch(
      /pode ser concluído antes do\s+archive/
    );
    expect(tasks!.instruction).toMatch(
      /seção opcional `## Workflow follow-up`/
    );

    const examples = [...tasks!.instruction.matchAll(/```\s*([\s\S]*?)```/g)];
    expect(examples).toHaveLength(2);
    const implementation = examples[0][1];
    const followUp = examples[1][1];
    expect(followUp).toContain('## Workflow follow-up');
    expect(followUp).toContain('- Verify the archived result.');
    expect(parseTaskLines(followUp)).toEqual([]);
    expect(parseTaskLines(`${implementation}\n${followUp}`)).toEqual(
      parseTaskLines(implementation)
    );
  });

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
    expect(numberedTasks).toHaveLength(5);
    expect(numberedTasks.every(line => /\bverify\b/i.test(line))).toBe(true);
    expect(numberedTasks[0]).toContain('expected files are present');
    expect(numberedTasks[1]).toContain('package installation succeeds');
    expect(numberedTasks[2]).toContain('export test passes');
    expect(numberedTasks[3]).toContain('unit tests cover quoting and delimiters');
    expect(numberedTasks[4]).toContain('Document the export API');
    expect(example).not.toMatch(/^- \[ \] \d+\.\d+ (?:verify|run (?:the )?verification)\b/im);
  });

  // #1952: agents parked testing and documentation in one trailing group, so a
  // failure seeded in group 1 only surfaced at the end and cascaded into rework.
  it('keeps tests and documentation inside the group that does the work (#1952)', () => {
    const tasks = defaultSchema.artifacts.find(artifact => artifact.id === 'tasks');
    expect(tasks).toBeDefined();
    expect(tasks!.instruction).toMatch(
      /Cada grupo de tarefas MUST entregar os testes e a documentação que o próprio\s+trabalho pede/
    );
    expect(tasks!.instruction).toMatch(
      /NÃO junte teste ou documentação num grupo final/
    );
    // The rule is scoped to what a group's work actually needs, so the worked
    // example's scaffolding group can carry no tests or docs without
    // contradicting it.
    expect(tasks!.instruction).toMatch(
      /Um grupo\s+cujo trabalho não pede nenhum dos dois, como scaffolding ou instalação de dependências,\s+não carrega nenhum dos dois/
    );
    expect(tasks!.instruction).toMatch(
      /Um grupo final serve só para checagens de integração, não para\s+os testes e a documentação que um grupo anterior devia/
    );

    // The worked example has to show a docs task inside the implementation
    // group, not a trailing "testing and documentation" group of its own.
    const example = tasks!.instruction.match(/```\s*([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    const headings = example!
      .split('\n')
      .filter(line => /^## /.test(line.trim()))
      .map(line => line.trim());
    expect(headings).toHaveLength(2);
    expect(headings.some(heading => /\b(test|testing|documentation|docs)\b/i.test(heading))).toBe(
      false
    );

    const lastGroup = example!.slice(example!.lastIndexOf(headings[headings.length - 1]));
    expect(lastGroup).toMatch(/^- \[ \] \d+\.\d+ Document the export API in docs\/export\.md/im);
  });
});

describe('propose project context', () => {
  it('loads project context before selecting the schema or creating the change (#1651)', () => {
    for (const [label, body] of proposeBodies) {
      const contextStep = body.indexOf('**Carregue o contexto do projeto**');
      const schemaStep = body.indexOf('**Determine o schema de workflow**');
      const createStep = body.indexOf('**Crie o diretório da change**');

      expect(contextStep, `${label} is missing the early context step`).toBeGreaterThanOrEqual(0);
      expect(contextStep, `${label} loads context after schema selection`).toBeLessThan(schemaStep);
      expect(contextStep, `${label} loads context after creating the change`).toBeLessThan(createStep);
    }
  });

  function contextSection(body: string): string {
    return body.slice(
      body.indexOf('**Carregue o contexto do projeto**'),
      body.indexOf('**Determine o schema de workflow**')
    );
  }

  it('reads the resolved root before loading project config', () => {
    for (const [label, body] of proposeBodies) {
      const section = contextSection(body);
      expect(section, label).toContain('`openspec context --json`');
      expect(section, label).not.toContain('--store');
      expect(section, label).toContain('`root.path` retornado');
      expect(section, label).toContain('`<root.path>/openspec/config.yaml`');
      expect(section, label).toContain('Somente quando o contexto devolver um `root.path` resolvido');
    }
  });

  it('matches config precedence and field validation', () => {
    for (const [label, body] of proposeBodies) {
      const section = contextSection(body);
      expect(section, label).toContain('Use `config.yml` somente quando `config.yaml` não existir');
      expect(section, label).toContain('Se nenhum dos dois existir, continue sem contexto de projeto');
      expect(section, label).toContain(
        'Não volte para `config.yml` se `config.yaml` estiver ilegível ou inválido'
      );
      expect(section, label).toContain('fizer parse como um objeto YAML');
      expect(section, label).toContain('campo `context` for uma string');
      expect(section, label).toContain(
        `no máximo ${MAX_CONTEXT_SIZE.toLocaleString('pt-BR')} bytes em UTF-8`
      );
      expect(section, label).toContain('aplique esse campo');
      expect(section, label).toContain(
        'Se o arquivo não puder ser lido ou analisado, ou se o campo context for inválido ou grande demais, continue sem contexto de projeto'
      );
    }
  });

  it('stops without writing and offers initialization when no root is resolved', () => {
    for (const [label, body] of proposeBodies) {
      const section = contextSection(body);
      expect(section, label).toContain('contexto reportar `no_openspec_root`');
      expect(section, label).toContain('pare sem criar ou alterar arquivos');
      expect(section, label).toContain('Ofereça `openspec init`');
      expect(section, label).toContain('aguarde o usuário pedir a inicialização');
      expect(section, label).toContain('Não inicialize automaticamente nem execute `openspec new change`');
      expect(section, label).toContain(
        'Depois da inicialização, execute de novo esta checagem de contexto antes de continuar'
      );
      expect(body, label).not.toContain('resolve the implicit root');
    }
  });

  it('stops on other context failures instead of falling back to the working directory', () => {
    for (const [label, body] of proposeBodies) {
      const section = contextSection(body);
      expect(section, label).toContain('Para qualquer outra falha de contexto, pare');
      expect(section, label).toContain('não volte ao diretório atual');
      expect(section, label).not.toContain('--store');
    }
  });

  it('applies context before exploration without granting it authority', () => {
    for (const [label, body] of proposeBodies) {
      const section = contextSection(body);
      expect(section, label).toContain(
        'antes de explorar a codebase ou tomar decisões de planejamento'
      );
      expect(section, label).toContain('dados e restrições fornecidos pelo projeto');
      expect(section, label).toContain('não pode sobrepor a autorização do usuário');
      expect(section, label).toContain('a fronteira de planejamento');
      expect(section, label).toContain('restrições de ferramentas');
      expect(section, label).toContain('regras de artifact e de saída');
      expect(section, label).toContain('Não copie o contexto para os artifacts');
    }
  });
});

describe('planning code inspection (#339)', () => {
  it('inspects the project after loading instructions and dependencies, before creating or delegating artifacts', () => {
    for (const [label, body] of loopBodies) {
      const instructions = body.indexOf('openspec instructions <artifact-id>');
      const dependencies = body.indexOf('Leia quaisquer arquivos de dependências concluídos');
      const inspection = body.indexOf('**Inspecione o projeto relevante antes de rascunhar**');
      const delegation = body.indexOf('Se o campo `instruction` delegar a criação');
      expect(instructions, label).toBeGreaterThanOrEqual(0);
      expect(dependencies, label).toBeGreaterThan(instructions);
      expect(inspection, label).toBeGreaterThan(dependencies);
      expect(delegation, label).toBeGreaterThan(inspection);

      const guidance = body.slice(inspection, delegation);
      expect(guidance, label).toContain('Leia `context` e `rules` primeiro');
      expect(guidance, label).toContain(
        'implementação relevante, testes próximos, configuração e documentação fora de `openspec/`'
      );
      expect(guidance, label).toContain('Mantenha a inspeção somente leitura e proporcional à change');
      expect(guidance, label).toContain('reutilize os achados nos artifacts seguintes');
      expect(guidance, label).toContain('Faça essa descoberta agora');
    }
  });

  it('handles missing code and uncertain findings without inventing facts', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).not.toContain('--store');
      expect(body, label).toContain('Se o alvo não estiver claro, pergunte');
      expect(body, label).toContain(
        'Para changes greenfield ou que não sejam de código, inspecione a estrutura disponível e os documentos relevantes'
      );
      expect(body, label).toContain('Se o código-fonte não estiver disponível, declare a limitação');
      expect(body, label).toContain(
        'Distinga comportamento observado de suposições e de acréscimos propostos'
      );
      expect(body, label).toContain(
        'traga à tona conflitos com specs existentes em vez de decidir silenciosamente qual está certo'
      );
    }
  });

  it('preserves inspection guidance through every command adapter', () => {
    for (const command of getCommandContents(ALL_WORKFLOWS).filter(({ id }) =>
      ['propose', 'ff'].includes(id)
    )) {
      for (const adapter of CommandAdapterRegistry.getAll()) {
        const generated = generateCommand(command, adapter).fileContent;
        const inspection = generated.indexOf('**Inspecione o projeto relevante antes de rascunhar**');
        const delegation = generated.indexOf('Se o campo `instruction` delegar a criação');
        const label = `${adapter.toolId} ${command.id}`;
        expect(inspection, label).toBeGreaterThanOrEqual(0);
        expect(delegation, label).toBeGreaterThan(inspection);
        expect(generated, label).toContain('Mantenha a inspeção somente leitura e proporcional à change');
      }
    }
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

  // The same boundary has to hold when `apply` is not installed: the command
  // surface may name the CLI, never a conversational handoff (#1734).
  it('keeps command-only tools off direct coding when apply is not installed', () => {
    const command = withoutApply(getOpsxProposeCommandTemplate().content);
    const skill = withoutApply(getOpsxProposeSkillTemplate().instructions);
    const ffCommand = withoutApply(getOpsxFfCommandTemplate().content);

    for (const body of [command, skill, ffCommand]) {
      expect(body).not.toContain('/opsx:apply');
    }

    expect(command).toContain(
      'execute `openspec instructions apply --change "<nome>" --json` para obter as tarefas'
    );
    expect(command).not.toContain('peça-me para implementar');
    expect(command).not.toContain('peça-me para aplicar esta change');

    expect(ffCommand).toContain(
      'Execute `openspec instructions apply --change "<nome>" --json` para obter a lista de tarefas'
    );
    expect(ffCommand).not.toContain('peça-me para implementar');

    expect(skill).toContain('peça-me para aplicar esta change');
    expect(skill).not.toContain('peça-me para implementar');
  });

  it('preserves planning and initialization boundaries through every command adapter', () => {
    // Resolve against every workflow: this asserts the apply handoff, which
    // is only emitted when `apply` is installed.
    const propose = getCommandContents(ALL_WORKFLOWS).find(({ id }) => id === 'propose');
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
      expect(generated, adapter.toolId).toContain('pare sem criar ou alterar arquivos');
      expect(generated, adapter.toolId).toContain('Ofereça `openspec init`');
      expect(generated, adapter.toolId).toContain(
        'Não inicialize automaticamente nem execute `openspec new change`'
      );
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
      expect(schemaSection, label).toContain(
        'Se o contexto falhar, pare como descrito no passo de carregamento do contexto'
      );
      expect(schemaSection, label).toContain('não volte ao diretório atual');
      expect(schemaSection, label).not.toContain('--store');
    }
  });
});

describe('instruction field authority (propose, continue and ff)', () => {
  // #777: custom schemas reusing familiar artifact names were overridden by
  // hard-coded spec-driven patterns embedded in the templates. The schema's
  // instruction field is now the authoritative guidance, and delegated
  // creation is invoked and verified at the creation step and restated in
  // the guidelines.
  const allBodies: Array<[string, string]> = [...loopBodies, ...continueBodies];

  it('states the instruction field is the authoritative guidance', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).toContain('orientação autoritativa');
    }
  });

  it('invokes delegated creation at the creation step and verifies the artifact', () => {
    for (const [label, body] of allBodies) {
      expect(body, label).toContain(
        'Se o campo `instruction` delegar a criação a uma skill ou comando específico, invoque-o somente se ele puder escrever o artifact nesse caminho de saída'
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
        'Pule um apenas quando o `status` já o reportar como `skipped`, ou quando o próprio `instruction` dele disser que é condicional'
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
      expect(body, label).toContain(
        '`specs` se qualifica somente pelo status `skipped` acima, nunca pelo seu próprio julgamento'
      );
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
        'for um glob, siga `instruction` para escolher um caminho concreto'
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

import { describe, expect, it } from 'vitest';

import {
  getUpdateChangeSkillTemplate,
  getOpsxUpdateCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { PROJECT_ROOT_GUARD } from '../../../src/core/templates/workflows/project-root.js';
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS, CORE_WORKFLOWS } from '../../../src/core/profiles.js';

const skill = getUpdateChangeSkillTemplate();
const command = getOpsxUpdateCommandTemplate();

const render = (workflows: readonly string[]): Array<[string, string]> => {
  const installed = new Set<string>(workflows);
  return [
    ['skill', resolveOptionalWorkflows(skill.instructions, installed)],
    ['command', resolveOptionalWorkflows(command.content, installed)],
  ];
};

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body. Templates carry optional-workflow
// conditionals, so a body is only meaningful once resolved against a workflow
// set — these are the bodies a profile with every workflow installed receives.
const bodies = render(ALL_WORKFLOWS);
const coreBodies = render(CORE_WORKFLOWS);

// The load-bearing sentence of step 4 and the whole of step 5 are pinned
// verbatim. #1836 happened because a single verb ("Apply") in step 4 silently
// re-answered a question step 5 had already answered, so any reword of either
// passage has to come back through this test and re-argue the contract rather
// than just regenerate a parity hash.
const STEP_FOUR_DRAFT_RULE =
  '   - Rascunhe a edição solicitada na conversa, não nos arquivos. Defina exatamente o que ela muda; o passo 5 é dono de toda escrita.';

const STEP_FIVE = `5. **Confirme e aplique, um artifact por vez**
   - Este passo faz toda escrita de artifact neste workflow; nenhum passo anterior edita um artifact.
   - Mostre cada revisão proposta e o porquê - incluindo a edição solicitada rascunhada no passo 4. Escreva somente após o usuário confirmar.
   - Se o usuário rejeitar uma revisão, não a escreva - deixe aquele artifact inalterado.
   - Quando uma reescrita substancial for necessária, obtenha primeiro as regras e o template daquele artifact:
     \`\`\`bash
     openspec instructions "<artifact-id>" --change "<nome>" --json
     \`\`\`

`;

// Every mention of writing or applying allowed to live OUTSIDE step 5. Each is
// a scope rule, a hand-off to another workflow, or the gate itself - none
// authorizes a write here.
const SANCTIONED_OUTSIDE_STEP_FIVE = [
  STEP_FOUR_DRAFT_RULE,
  'essa é a edição inicial.',
  'NÃO escreva em `resolvedOutputPath`',
  '- Edite apenas os arquivos concretos em `existingOutputPaths`, mais qualquer caminho concreto confirmado permitido sob um artifact com glob parcialmente preenchido (passo 4); nunca escreva em um `resolvedOutputPath` com glob.',
  'Confirme cada edição com o usuário antes de escrever.',
  '`/opsx:apply`',
  '(tarefas marcadas / já aplicada)',
  'Nunca edite código',
  'NUNCA edite código de implementação',
];

const REQUESTED_EDIT =
  /edição solicitada|revisão do usuário|edição inicial/i;

const WRITE_VERB =
  /escrev\w*|\baplic(?:a|ar|ue|ada|adas|ando)\b|\bsalv\w*|\bpersist\w*|\bgrav\w*/i;

const WRITE_PHRASE =
  /\bexecut(?:e|a|ar) a edição\b|\bno disco\b|\bsem pedir\b/i;

const CONSENT_BYPASS =
  /sem (?:pedir|confirmar|confirmação)|não espere a confirmação|sem confirmação|isenta de confirmação|pule a confirmação/i;

function section(
  body: string,
  startMarker: string,
  endMarker: string,
  label: string
): string {
  const start = body.indexOf(startMarker);
  const end = body.indexOf(endMarker, start + startMarker.length);
  expect(start, `${label}: missing marker ${startMarker}`).toBeGreaterThanOrEqual(0);
  expect(end, `${label}: missing marker ${endMarker}`).toBeGreaterThan(start);
  return body.slice(start, end);
}

function stepFive(body: string, label: string): string {
  return section(body, '5. **Confirme e aplique', '6. **Aponte o próximo passo', `${label} step 5`);
}

function writeAuthorizationsOutsideStepFive(body: string, label: string): string[] {
  let rest = body
    .split(stepFive(body, label))
    .join('\n')
    .split(PROJECT_ROOT_GUARD)
    .join('');
  for (const sanctioned of SANCTIONED_OUTSIDE_STEP_FIVE) {
    rest = rest.split(sanctioned).join('');
  }

  const checks: Array<[string, RegExp]> = [
    ['write verb', WRITE_VERB],
    ['write phrase', WRITE_PHRASE],
    ['consent bypass', CONSENT_BYPASS],
    ['names the requested edit', REQUESTED_EDIT],
    [
      'imperative edit bullet',
      /^\s*-\s*(?:\w+mente,?\s+)?(?:Revise|Edite|Atualize|Reescreva|Modifique|Altere|Substitua)\b/im,
    ],
  ];
  return checks.filter(([, pattern]) => pattern.test(rest)).map(([name]) => name);
}

describe('update-change write gate (#1836)', () => {
  it('pins the step 4 draft rule and the whole of step 5', () => {
    for (const [label, body] of bodies) {
      const stepFour = section(
        body,
        '4. **Leia e reconcilie**',
        '5. **Confirme e aplique',
        `${label} step 4`
      );

      expect(stepFour, `${label} step 4`).toContain(STEP_FOUR_DRAFT_RULE);
      expect(stepFive(body, label), `${label} step 5`).toBe(STEP_FIVE);
    }
  });

  it('keeps the whole-body confirmation guardrail', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Confirme cada edição com o usuário antes de escrever.');
    }
  });

  it('lets no passage outside step 5 authorize a write', () => {
    for (const [label, body] of bodies) {
      expect(writeAuthorizationsOutsideStepFive(body, label), label).toEqual([]);
    }
  });

  const MUTATIONS: Array<[anchor: string, injected: string]> = [
    ['mantenha-os coerentes. Nunca edite código.', 'Aplique a edição solicitada imediatamente.'],
    ['**Entrada**: Opcionalmente', 'Trate a edição solicitada como já aplicada ao artifact.'],
    ['1. **Selecione a change**', '   - Coloque a edição solicitada no artifact agora.'],
    ['2. **Obtenha os artifacts da change**', '   A edição solicitada vai direto para o arquivo.'],
    ['3. **Entenda a solicitação**', '   - Aplique a edição solicitada imediatamente.'],
    ['4. **Leia e reconcilie**', '   - Atualize o artifact com a edição solicitada agora.'],
    ['6. **Aponte o próximo passo', '   - Salve as revisões primeiro.'],
    ['**Saída**', '- A edição solicitada, já aplicada durante o passo 4'],
    ['**Guardrails**', '- A edição solicitada está isenta de confirmação.'],
    ['- Confirme cada edição com o usuário antes de escrever.', '- A revisão do usuário não precisa de confirmação.'],
  ];

  it.each(MUTATIONS)('flags a write authorization injected after %s', (anchor, injected) => {
    for (const [label, body] of bodies) {
      const at = body.indexOf('\n', body.indexOf(anchor));
      expect(body.indexOf(anchor), `${label}: missing anchor`).toBeGreaterThanOrEqual(0);
      const mutated = `${body.slice(0, at + 1)}${injected}\n${body.slice(at + 1)}`;
      expect(stepFive(mutated, label), label).toBe(STEP_FIVE);
      expect(writeAuthorizationsOutsideStepFive(mutated, label), label).not.toEqual([]);
    }
  });
});

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
      expect(body, label).toContain('openspec instructions "<artifact-id>" --change "<nome>" --json');
    }
  });

  it('reads artifact ids from status JSON and never branches on hardcoded artifact names (3.2)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('NÃO os assuma e NÃO ramifique com base em nomes de artifact fixos');
      expect(body, label).toContain('nunca ramifique com base em nomes de artifact fixos');
      expect(body, label).toContain('Schemas personalizados devem funcionar sem alterações');
      expect(body.replace(/specs\/\*\*\/\*\.md/g, ''), label).not.toMatch(/\b[\w-]+\.md\b/);
    }
  });

  it('edits planning artifacts only, hands code off to /opsx:apply, never advances the frontier (3.3)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Nunca edite código');
      expect(body, label).toContain('NUNCA edite código de implementação');
      expect(body, label).toContain('pare e aponte para `/opsx:apply`');
      expect(body, label).toContain('Não avance a fronteira de construção');
      expect(body, label).toContain(
        'não tiver arquivos de saída existentes e o status for `ready` ou `blocked`, anote-o e aponte o usuário para `/opsx:continue`'
      );
      expect(body, label).toContain(
        '`existingOutputPaths` vazio e status `ready` ou `blocked`, esse é o trabalho do `/opsx:continue`'
      );
      expect(body, label).toContain('Deixe artifacts `skipped` intocados');
      expect(body, label).toContain('não os trate como ausentes nem os adie para o workflow continue');
    }
  });

  it('fills a gap under an already-satisfied glob artifact instead of deferring it (3.3a)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('fica marcado `done` depois que pelo menos um arquivo casa');
      expect(body, label).toContain('o workflow continue só trata artifacts `ready`');
      expect(body, label).toContain('cujo `existingOutputPaths` não está vazio');
      expect(body, label).toContain('use `instruction` e `template`');
      expect(body, label).toContain('Trate `context` e `rules` como restrições; não os copie para o arquivo');
      expect(body, label).toContain('Se as instruções reportarem `skipped: true`, não crie o arquivo');
      expect(body, label).toContain('Leia do disco os arquivos de dependência atuais');
      expect(body, label).toContain(
        'se uma dependência obrigatória e não skipped estiver ausente, pare e peça ao usuário para restaurá-la primeiro'
      );
      expect(body, label).toContain('Se `instruction` delegar a criação a outra skill ou comando');
      expect(body, label).toContain(
        'somente se ele puder honrar o caminho confirmado e estes guardrails; caso contrário, pare'
      );
      expect(body, label).toContain(
        'dentro de `changeRoot` que case com `artifactPaths.<id>.outputPath`'
      );
      expect(body, label).toContain('crie-o somente depois que o usuário confirmar');
      expect(body, label).toContain('que ainda não exista');
      expect(body, label).toContain('depois de resolver quaisquer diretórios pai que sejam symlinks');
    }
  });

  it('rechecks new-file scope after confirmation and refuses concurrent overwrites', () => {
    for (const [label, body] of bodies) {
      const confirmation = body.indexOf('crie-o somente depois que o usuário confirmar');
      const recheck = body.indexOf('Depois da confirmação, imediatamente antes de criar');
      const create = body.indexOf('Use uma operação de criação que falhe se o alvo já existir');

      expect(confirmation, label).toBeGreaterThanOrEqual(0);
      expect(recheck, label).toBeGreaterThan(confirmation);
      expect(create, label).toBeGreaterThan(recheck);
      const writeGuard = body.slice(recheck, create);
      expect(writeGuard, label).toContain('atualize status e instructions');
      expect(writeGuard, label).toContain('ainda está no escopo, não está skipped e está parcialmente preenchido');
      expect(writeGuard, label).toContain('repita as checagens de caminho concreto acima');
      expect(body, label).toContain(
        'pare e reconcilie com o usuário em vez de substituir conteúdo existente ou escolher outro caminho'
      );
    }
  });

  it('carries the glob new-file exception wherever the scope rule is stated (#2068)', () => {
    for (const [label, body] of bodies) {
      const scopeLines = body
        .split('\n')
        .filter((line) =>
          /- Edite apenas os arquivos concretos em `existingOutputPaths`|Os arquivos a editar são `artifactPaths\./.test(line)
        );
      expect(scopeLines.length, `${label}: expected both scope-rule sites`).toBe(2);

      for (const line of scopeLines) {
        expect(line, `${label}: unqualified scope rule: ${line}`).toContain(
          'qualquer caminho concreto confirmado permitido sob um artifact com glob parcialmente preenchido (passo 4)'
        );
      }

      expect(body, label).not.toMatch(/existingOutputPaths`;\s*nunca escreva em um glob/);
      expect(body, label).not.toMatch(
        /existingOutputPaths` - os arquivos concretos que existem em disco\.\s*NÃO escreva/
      );

      const guardrails = body.slice(body.indexOf('**Guardrails**'));
      expect(guardrails, label).toContain('nunca escreva em um `resolvedOutputPath` com glob');
      expect(guardrails, label).toContain(
        'O único escopo de arquivo novo é um caminho concreto confirmado sob um artifact com glob cujo `existingOutputPaths` não está vazio.'
      );

      const stepFour = section(body, '4. **Leia e reconcilie**', '5. **Confirme e aplique', `${label} step 4`);
      expect(stepFour, label).toContain('cujo `existingOutputPaths` não está vazio');
      expect(stepFour, label).toContain('crie-o somente depois que o usuário confirmar');
    }
  });

  it('writes to existingOutputPaths, never to a glob resolvedOutputPath (3.4)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('artifactPaths.<id>.existingOutputPaths');
      expect(body, label).toContain('NÃO escreva em `resolvedOutputPath`');
      expect(body, label).toContain('ainda é o padrão glob, não um arquivo real');
      expect(body, label).toContain('O `resolvedOutputPath` do glob não é um alvo válido');
      expect(body, label).toContain('O único escopo de arquivo novo');
    }
  });

  it('ends with next-step guidance and never acts on it (3.5)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('apenas orientação - NUNCA aja sobre ele');
      expect(body, label).toContain(
        'Artifacts com `existingOutputPaths` vazio e status `ready` ou `blocked` -> sugira `/opsx:continue`'
      );
      expect(body, label).toContain('sugira `/opsx:continue`');
      expect(body, label).toContain('sugira `/opsx:apply`');
      expect(body, label).toContain('sugira `/opsx:archive`');
      expect(body, label).toContain('o código pode não corresponder mais ao plano revisado');
    }
  });

  it('hands off to /opsx:continue when that workflow is installed', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('`/opsx:continue` é o que cria os que não existem');
      expect(body, label).toContain('sugira `/opsx:continue` para criá-los');
      expect(body, label).toContain('esse é o trabalho do `/opsx:continue`');
      expect(body, label).not.toContain('pode não estar instalado');
      expect(body, label).not.toContain('verifique se ele está disponível');
    }
  });

  it('never names /opsx:continue on a profile that does not install it', () => {
    for (const [label, body] of coreBodies) {
      expect(body, label).not.toContain('/opsx:continue');
      expect(body, label).toContain('ele nunca cria os que faltam');
      expect(body, label).toContain('`openspec status --change "<nome>" --json` nomeia o próximo');
      expect(body, label).toContain(
        '`openspec instructions "<artifact-id>" --change "<nome>" --json` explica como escrevê-lo'
      );
      expect(body, label).toContain('Qualquer coisa adiada porque ainda não existe');
      expect(body, label).toContain('criá-los é um passo separado, fora deste workflow');
    }
  });

  it('confirms every edit and redirects intent changes to /opsx:new when installed', () => {
    for (const [label, body] of bodies) {
      const reconciliation = body.slice(
        body.indexOf('4. **Leia e reconcilie**'),
        body.indexOf('5. **Confirme e aplique')
      );
      expect(reconciliation, label).toContain('Rascunhe a edição solicitada na conversa, não nos arquivos');
      expect(reconciliation, label).not.toContain('Aplique a edição solicitada');
      expect(body, label).toContain('Escreva somente após o usuário confirmar');
      expect(body, label).toContain('Se o usuário rejeitar uma revisão, não a escreva');
      expect(body, label).toContain('recomende começar do zero com `/opsx:new`');
      expect(body, label).toContain('Atualizar vs. Começar do Zero');
      expect(body, label).not.toContain('verifique primeiro se o workflow opcional');
    }
  });

  it('routes intent changes to the CLI when /opsx:new is not installed', () => {
    for (const [label, body] of coreBodies) {
      expect(body, label).not.toContain('/opsx:new');
      expect(body, label).toContain('peça um nome de change distinto e ainda não usado');
      expect(body, label).toContain('openspec new change "<novo-nome-da-change>"');
      expect(body, label).not.toContain('openspec new change "<nome>"');
      expect(body, label).toContain('Atualizar vs. Começar do Zero');
    }
  });
});

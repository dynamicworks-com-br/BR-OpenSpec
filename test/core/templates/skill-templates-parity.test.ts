import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyInstructions,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getCodeReviewSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxCodeReviewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getUpdateChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  generateSkillContent,
  getCommandContents,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';

const asDeployed = (template: SkillTemplate): SkillTemplate => ({
  ...template,
  instructions: resolveOptionalWorkflows(
    template.instructions,
    new Set<string>(ALL_WORKFLOWS)
  ),
});

function specDrivenTitles(): Record<string, string> {
  const schemaDir = path.join(__dirname, '..', '..', '..', 'schemas', 'spec-driven');
  const schema = parseSchema(fs.readFileSync(path.join(schemaDir, 'schema.yaml'), 'utf-8'));

  return Object.fromEntries(
    schema.artifacts.map((artifact) => [
      artifact.id,
      fs
        .readFileSync(path.join(schemaDir, 'templates', artifact.template), 'utf-8')
        .replace(/\r\n?/g, '\n')
        .split('\n')[0],
    ])
  );
}

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '85456ea0ac46b6107f9eb26c73801bde7eff5ae682b50f3704787ef7874fd18c',
  getNewChangeSkillTemplate: '0b0310f6e89af307c8e277e2ccd0443e1bd8ae4341e1d220dc19454a6e6d5c26',
  getContinueChangeSkillTemplate: 'b63653dcc10e449981c08a2976f561481bf8eccd5e68b2cb9c7741a1b13a4837',
  getApplyChangeSkillTemplate: 'a61ebfa3ee26211be7e9478c7b5a73b9ff5f540ab35342f11bb39bd841bba6ff',
  getUpdateChangeSkillTemplate: '1e04de6f51e46bb9520c337ba2414bcbd7894c3dbed04665a053e34ea52bdd41',
  getFfChangeSkillTemplate: 'b5448fe98e7662a555b51f88ab8e864839ae9f100e942a82fc653f9da0259c49',
  getSyncSpecsSkillTemplate: 'ca9ba16f3927965fc586b379bef6ddf4bac1982e1895c1beae4584ce2989d6de',
  getOnboardSkillTemplate: '092d11e80ec213da555b8a0276e4c0abd0c24e1d8b21959199840514d3573c09',
  getOpsxExploreCommandTemplate: '6bae48df5d6d82f7d4a445165c392c911d6c56b1a1c86ddc41d1348a847ada01',
  getOpsxNewCommandTemplate: '84d3abc58efa1826c5d55143301a30881c8b72b4b7d889b01d3f066532a1ae0b',
  getOpsxContinueCommandTemplate: 'a62413047d6077df11e5d4c893eccb7f3ffec154e89a67af4a1773d85424d2ca',
  getOpsxApplyCommandTemplate: '1bb9495419072845561103bd3f89af447cab5d6aed9b3f1784213e077dfbc61b',
  getOpsxUpdateCommandTemplate: 'f2c58e88583dc10c713443a65eb1d248c4f18ac33416726bd65569c9e1b7fdf0',
  getOpsxFfCommandTemplate: '646546a8c2ffd8449bd320c23af9513449c13458d51c4d955ba74f57c1e99efe',
  getArchiveChangeSkillTemplate: 'a489f236d212e1cef27b7dc6e2a36c77af00e82220a47fc954d2f80d6e76b173',
  getBulkArchiveChangeSkillTemplate: 'e7594187ed90744d7674a52a1725f767e7000d3db90f477465456c16a38c97eb',
  getCodeReviewSkillTemplate: 'fa3bf308e28197b26fee806ea7a4fdfb3543bfc0a2f4fbe39559045251368177',
  getOpsxSyncCommandTemplate: 'fc39b238d93dbf03a3dd807faba3fc1643d40633569dd92cfdbaf204836dba8d',
  getVerifyChangeSkillTemplate: 'f2f69ec9c5bc643dab4fe224fa8fe3326fb69dd17c86dcc74f992eaefefd7142',
  getOpsxArchiveCommandTemplate: '32a104c8620ff1077ab56d0b77bddb0c7b80f56823b0ff592ec7cffcfebcf8c0',
  getOpsxOnboardCommandTemplate: 'c8460ab3942287f63ed4a4e9ed38e49e5df1ebc3fbbfc0d94d345d45ce7378b6',
  getOpsxBulkArchiveCommandTemplate: 'b66ed986b929d870bdadadb6f5883fb1b92be0b264af779e04c973e8a838af30',
  getOpsxCodeReviewCommandTemplate: 'f11bcc0afd2f2f611abdd80faa583d9769755a2713898e3c5d2408f2c09b54c6',
  getOpsxVerifyCommandTemplate: '26e02b444f6fba2987acaa9eb93ad6ee050cb1640d8769591176a2b7ba4cb53a',
  getOpsxProposeSkillTemplate: 'a86984812a6259ea6d66a7b4375a1e3b4eeffd68e32d694656421565146829d7',
  getOpsxProposeCommandTemplate: 'fd1500c682779a3e22d7fc04f1c04c7239a32266bab60b63b1635a2010ceaea1',
  getFeedbackSkillTemplate: '7a1366f62544b1fd48eef1f6548d85dcfb7c7360cf06899134568f5d0d43b4df',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '707f940c9091991589a1dd1ec86d176f77d95330283c23b46789c12eb33af53c',
  'openspec-new-change': 'b1a1bc72b6da30ad86dffe686a7efeb71b8941ece652c3720f323eaf8bd6f784',
  'openspec-continue-change': 'd1d86f7de25af2493fae2e3bb9177e1e6263def4ae7b65bd848f3ecee672744e',
  'openspec-apply-change': '69ea17669214c4d7889bffd747951417cb8dff2e349f9318c71142e76a2430d4',
  'openspec-update-change': 'd6b6914ba39fcc116d8c7dae2d9a7d78b958ee4c0fc71bb6e2f702e70dd69127',
  'openspec-ff-change': '8ad7700d9df28f31a45e4bde1882bedd42920d32b8410925e8a4d29eeea072b5',
  'openspec-sync-specs': '878c725f58f8092a3d6cd8c59b2faad7e5af9cabe535f872b3415c6703b7c02c',
  'openspec-archive-change': 'f11ae39d3050167486afd9812fc27f37a8409298146800a85c15e5bd161d0596',
  'openspec-bulk-archive-change': 'd36898af3876afb1b8eff798595955d698cda5ceacf953ac2a7114b5ba011928',
  'openspec-verify-change': 'db196465017fc9a841cc7dd17f38c4d4f684b4143fb2e8c4c4938efd8d5de385',
  'openspec-code-review': 'c70f2c7180b9a075aa1837ad49268a58eb6c81626713f70637900969544ac2aa',
  'openspec-onboard': '16afc2849a38b6ef897aaed88be7d764fdaa8a555560f4518af472e834caf950',
  'openspec-propose': 'e5a324dce7fa7d5d51fb1b2061f7c2937dbd03ab5089f06a49c8227a4405782f',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('uses one clarification threshold in fast-forward guidance (#1837)', () => {
    const variants: Array<[string, string]> = [
      ['ff skill', getFfChangeSkillTemplate().instructions],
      ['ff command', getOpsxFfCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain(
        '**Se um artifact requerer entrada do usuário** (contexto incerto)'
      );
      expect(content, variant).toContain('Se o contexto estiver criticamente incerto');
      expect(content, variant).not.toContain(
        '**If an artifact requires user input** (unclear context)'
      );
      expect(content, variant).not.toContain(
        '**If an artifact requires user input** (critically unclear context)'
      );
    }
  });

  it('approves onboarding tasks before saving or offering implementation (#1837)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', getOnboardSkillTemplate().instructions],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Este detalhamento de tarefas está certo?');
      expect(content, variant).not.toContain(
        'Each checkbox becomes a unit of work in the apply phase. Ready to implement?'
      );
      expect(content, variant).toContain(
        '**PAUSA** - Aguarde aprovação/feedback do usuário.\n\n' +
        'Após aprovação, salve no `resolvedOutputPath` de `openspec instructions tasks --change "<nome>" --json`.'
      );
      expect(content, variant).toContain('> "Tarefas salvas. Pronto para implementar?"');
      expect(content, variant).toContain(
        '**PAUSA** - Aguarde o usuário confirmar antes da implementação.'
      );

      const saveAt = content.indexOf('Após aprovação, salve no `resolvedOutputPath`');
      const implementationChoiceAt = content.indexOf('> "Tarefas salvas. Pronto para implementar?"');
      const implementationAt = content.indexOf('## Fase 9: Apply (Implementação)');
      expect(saveAt, variant).toBeGreaterThanOrEqual(0);
      expect(implementationChoiceAt, variant).toBeGreaterThan(saveAt);
      expect(implementationAt, variant).toBeGreaterThan(implementationChoiceAt);
    }
  });

  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getUpdateChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxUpdateCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getCodeReviewSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxCodeReviewCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    const actualHashes = Object.fromEntries(
      getSkillTemplates().map(({ template, dirName }: { template: SkillTemplate; dirName: string }) => [
        dirName,
        hash(generateSkillContent(template, 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  // The assertion above only compares the skills this file already lists, so a
  // workflow added to getSkillTemplates() but never pinned here would ship with
  // no golden hash and nothing would fail. Pin the registry itself.
  it('pins every skill the production registry deploys', () => {
    const pinned = Object.keys(EXPECTED_GENERATED_SKILL_CONTENT_HASHES).sort();
    const deployed = getSkillTemplates().map(({ dirName }) => dirName).sort();

    expect(pinned, 'add the new skill to EXPECTED_GENERATED_SKILL_CONTENT_HASHES').toEqual(deployed);
  });

  // Auto-approve workflow tools: every generated skill carries allowed-tools
  // so agents that honor it stop prompting on each openspec call and common
  // workflow operations. Iterating the registry covers new skills too.
  it('pre-approves workflow tools via allowed-tools in every deployed skill', () => {
    const expected =
      'allowed-tools: Read, Write, Edit, Glob, Grep, Bash(openspec:*), AskUserQuestion, Task';
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain(expected);
    }
  });

  // A golden hash proves the generated file matches its source, never that the
  // source is right - so a careless `regen:parity-hashes` over a dropped
  // paragraph passes CI silently. The sync skill is the one place an agent
  // learns that retiring a capability needs the marker; pin the fact, not the
  // hash, so losing the guidance fails here instead of shipping.
  it('tells the sync skill that retirement needs the retire_capabilities marker', () => {
    const sync = getSkillTemplates().find(
      ({ dirName }) => dirName === 'openspec-sync-specs'
    );
    expect(sync, 'openspec-sync-specs template').toBeTruthy();
    const variants = [
      ['sync skill', sync!.template.instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ] as const;
    for (const [variant, text] of variants) {
      expect(text, variant).toContain('retire_capabilities: true');
      expect(text, variant).toContain('toda outra linha não vazia do arquivo inteiro é contabilizada');
      expect(text, variant).toContain('resolve dentro da raiz real dos specs');
      expect(text, variant).toContain('orientação de recuperação restrita ao checkout');
      expect(text, variant).toContain('não modifique o spec');
      expect(text, variant).toMatch(/Interrompa o sync para essa capability/);
      expect(text, variant).toContain(
        'Nunca escreva nem deixe uma seção `## Requirements` vazia'
      );
      expect(text, variant).not.toContain('quaisquer outras seções');
      expect(text, variant).not.toContain('Prosa solta deixada sob `## Requirements` NÃO bloqueia');
    }
  });

  // Upstream #1500: sync used to report success without ever validating the
  // main specs it just rewrote. The validation step has to sit between the last
  // mutation and the summary, and it must forbid claiming success on failure.
  // (Upstream also pins "same selected-root flags"; the fork has no store/root
  // flags yet — stores are deferred (D1) — so that clause is omitted.)
  it('validates synced main specs before reporting success', () => {
    const variants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      const mutationsComplete = content.indexOf(
        'Siga a **Referência de Formato de Spec Principal** abaixo'
      );
      const validation = content.indexOf('openspec validate --specs');
      const summary = content.indexOf('**Exiba o resumo**');

      expect(mutationsComplete, variant).toBeGreaterThanOrEqual(0);
      expect(validation, variant).toBeGreaterThan(mutationsComplete);
      expect(summary, variant).toBeGreaterThan(validation);
      expect(content, variant).toContain(
        'Se a validação falhar, reporte os problemas e não afirme que o sync foi concluído com sucesso'
      );
    }
  });

  // Upstream #1505: planning completion is not implementation completion, so
  // continue must stop offering the archive as an equal alternative.
  it('does not suggest archiving when only planning is complete', () => {
    const variants: Array<[string, string]> = [
      [
        'skill',
        generateSkillContent(getContinueChangeSkillTemplate(), 'PARITY-BASELINE'),
      ],
      ['opsx command', getOpsxContinueCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Planejamento concluído!');
      expect(content, variant).toContain(
        'Quando a implementação e qualquer trabalho rastreado estiverem concluídos, arquive-a'
      );
      expect(content, variant).not.toContain('Todos os artifacts criados!');
      expect(content, variant).not.toContain('ou arquivá-la');
    }
  });

  // Upstream #1459: a capability's spec directory can be nested, so every
  // spec-aware workflow must name `<capability-path>` and preserve the full path.
  it('preserves nested capability paths in spec-aware workflow guidance (#1459)', () => {
    const capabilityPathDefinition =
      '`<capability-path>` é o diretório do spec relativo a `specs/`';
    // The fork has no store/planning-home resolution (D1), so main specs are
    // addressed as `openspec/specs/<capability-path>/spec.md`, without the
    // upstream `<planningHome.root>/` prefix.
    const pathAwareTemplates: Array<[string, string, string, string]> = [
      [
        'propose skill',
        generateSkillContent(asDeployed(getOpsxProposeSkillTemplate()), 'PARITY-BASELINE'),
        'specs/<capability-path>/spec.md',
        'Preserve o caminho completo de uma capability existente',
      ],
      [
        'propose command',
        getOpsxProposeCommandTemplate().content,
        'specs/<capability-path>/spec.md',
        'Preserve o caminho completo de uma capability existente',
      ],
      [
        'explore skill',
        generateSkillContent(asDeployed(getExploreSkillTemplate()), 'PARITY-BASELINE'),
        'specs/<capability-path>/spec.md',
        'Preserve o caminho completo de uma capability existente',
      ],
      [
        'explore command',
        getOpsxExploreCommandTemplate().content,
        'specs/<capability-path>/spec.md',
        'Preserve o caminho completo de uma capability existente',
      ],
      [
        'onboard skill',
        generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE'),
        '<existing-capability-path>',
        'Use o caminho exato existente para capabilities',
      ],
      [
        'onboard command',
        getOpsxOnboardCommandTemplate().content,
        '<existing-capability-path>',
        'Use o caminho exato existente para capabilities',
      ],
      [
        'sync skill',
        generateSkillContent(asDeployed(getSyncSpecsSkillTemplate()), 'PARITY-BASELINE'),
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
      [
        'sync command',
        getOpsxSyncCommandTemplate().content,
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
      [
        'archive skill',
        generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
      [
        'archive command',
        getOpsxArchiveCommandTemplate().content,
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
      [
        'bulk archive skill',
        generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
      [
        'bulk archive command',
        getOpsxBulkArchiveCommandTemplate().content,
        'openspec/specs/<capability-path>/spec.md',
        'Preserve o caminho completo de cada delta spec',
      ],
    ];

    for (const [label, content, destination, preservationGuidance] of pathAwareTemplates) {
      expect(content, label).toContain(capabilityPathDefinition);
      expect(content, label).toContain(destination);
      expect(content, label).toContain(preservationGuidance);
      expect(content, label).not.toContain('specs/<capability>/spec.md');
    }

    const onboardVariants: Array<[string, string]> = [
      [
        'onboard skill',
        generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE'),
      ],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of onboardVariants) {
      expect(content, label).toContain('- `<capability-path>`: [breve descrição]');
      expect(content, label).not.toContain('<nome-capability>');
    }

    const bulkArchiveVariants: Array<[string, string]> = [
      [
        'bulk archive skill',
        generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
      ],
      ['bulk archive command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [label, content] of bulkArchiveVariants) {
      expect(content, label).toContain(
        'Construa um mapa chaveado por `<capability-path>`, o caminho exato relativo a `specs/`'
      );
      expect(content, label).toContain(
        'billing/user-auth  -> [change-c]            <- OK (caminho completo diferente)'
      );
      expect(content, label).toContain(
        'identity/user-auth -> [change-a, change-b]  <- CONFLITO'
      );
      expect(content, label).toContain('identity/user-auth (!)');
      expect(content, label).toContain('exatamente o mesmo `<capability-path>`');
      expect(content, label).toContain('por change e `<capability-path>`');
      expect(content, label).toContain(
        'identity/user-auth spec: Aplicará add-oauth depois add-jwt'
      );
      expect(content, label).toContain(
        'add-jwt, identity/user-auth: implementação não encontrada'
      );
      expect(content, label).toContain(
        '1 conflito resolvido (identity/user-auth: sincronizado add-oauth, ignorado add-jwt)'
      );
      expect(content, label).not.toContain('\n   auth -> [change-a');
      expect(content, label).not.toContain('| auth (!)');
      expect(content, label).not.toContain('(auth: sincronizado');
      expect(content, label).not.toContain('add-jwt/auth:');
    }
  });

  // Upstream #1459: a narrowed sync set is named by whole `existingOutputPaths`
  // entries, not by a bare capability name that a nested path would alias.
  it('narrows the sync set by complete existingOutputPaths entries (#1459)', () => {
    const variants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain(
        'explícita de entradas completas de `existingOutputPaths`'
      );
      // The fork's prose is hard-wrapped, so pin the half that never straddles a break.
      expect(content, variant).toContain('valores absolutos verbatim');
      expect(content, variant).toContain('selecionando a entrada que termina em');
      expect(content, variant).toContain('/specs/billing/invoices/spec.md');
      expect(content, variant).not.toContain('sincronize só o delta billing');
    }
  });

  // #345 (upstream #1660): the onboarding task skeleton showed unverifiable
  // checkboxes plus one generic "Verify" item, and agents copied it. Every
  // implementation checkbox now names its verification inline, and the closing
  // group is explicitly about integration.
  it('keeps onboarding task examples aligned with concrete verification guidance (#345)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE')],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of variants) {
      const taskBlock = content.match(
        /Aqui estão as tarefas de implementação:([\s\S]*?)Cada checkbox se torna uma unidade de trabalho/
      )?.[1];
      expect(taskBlock, label).toBeDefined();
      const checkboxes = taskBlock!
        .split('\n')
        .filter(line => /^- \[ \] \d+\.\d+ /.test(line));
      expect(checkboxes, label).toHaveLength(3);
      expect(
        checkboxes.every(
          line =>
            line.endsWith(
              '[Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]'
            ) || / Verificar .+ com \[.+\]$/.test(line)
        ),
        label
      ).toBe(true);
      expect(content, label).toContain(
        '[Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]'
      );
      expect(content, label).toContain(
        'Verificar [integração mais ampla ou comportamento do sistema] com [teste de ponta a ponta ou resultado observável]'
      );
      expect(content, label).toContain('## 2. Verificação de Integração');
      expect(content, label).not.toContain('[Etapa de verificação]');
    }
  });

  // #1952: the onboarding walkthrough is where a user first meets task groups,
  // so it has to say the same thing the tasks instruction does — tests and docs
  // belong to the group that did the work, not to a trailing catch-up group.
  it('teaches per-group tests and docs in the onboarding walkthrough (#1952)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE')],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of variants) {
      expect(content, label).toContain(
        'Cada grupo carrega os testes e a documentação do próprio trabalho - o último grupo é só para verificações de integração.'
      );
      expect(content, label).toContain('## 2. Verificação de Integração');
    }
  });

  it('generates no workspace-planning residue in any workflow template (4.1)', () => {
    const allSkills: Array<[string, () => SkillTemplate]> = [
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
    ];

    for (const [dirName, createTemplate] of allSkills) {
      const content = generateSkillContent(asDeployed(createTemplate()), 'PARITY-BASELINE');
      expect(content, dirName).not.toContain('workspace-planning');
      expect(content, dirName).not.toContain('Workspace guard');
    }
  });

  it('gates the archive on a completed spec sync (#1393)', () => {
    const generatedSkill = generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE');
    const commandContent = getOpsxArchiveCommandTemplate().content;

    expect(generatedSkill, 'skill').toContain('execute o workflow `openspec-sync-specs` inline');
    expect(commandContent, 'opsx command').toContain('execute o workflow `/opsx:sync` inline');

    const variants: Array<[string, string]> = [
      ['skill', generatedSkill],
      ['opsx command', commandContent],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Não o delegue a uma tarefa em background');
      expect(content, variant).toContain('Nunca arquive enquanto um sync de specs ainda estiver em andamento');
      expect(content, variant).toContain('Se o sync reportar qualquer condição de parada ou bloqueio, trate o sync como falho');
      expect(content, variant).toContain('Não faça a comparação de conteúdo pós-sync');
      expect(content, variant).toContain('não mova o `changeRoot`');
      expect(content, variant).toContain('Requisitos MODIFIED carregando as alterações de cenário e descrição');
      expect(content, variant).toContain('Requisitos REMOVED ausentes');
      expect(content, variant).toContain('Requisitos RENAMED presentes sob o novo nome e ausentes sob o antigo');
      expect(content, variant).toContain('não apenas as que o sync reporta ter tocado');
      expect(content, variant).toContain('openspec/specs/<capability-path>/spec.md');
      expect(content, variant).not.toContain('<planningHome.root>');
      expect(content, variant).toContain(
        'Um spec principal novo começa com um título `# <capability> Specification`. Um spec principal existente mantém o título exatamente como está.'
      );
      expect(content, variant).not.toContain('MUST start with a `# <capability> Specification` title');
      expect(content, variant).toContain('Preserve seções `## Purpose` existentes completamente intocadas para specs principais já estabelecidos.');
      expect(content, variant).toContain('Para um spec principal novo, copie o `## Purpose` do delta verbatim.');
      expect(content, variant).toContain('Se não houver um `## Purpose` utilizável');
      expect(content, variant).toContain('Os blocos de requirement que o sync escreveu ou alterou usam cabeçalhos `### Requirement:`');
      expect(content, variant).toContain('Deixe exatamente como está o conteúdo que o delta não menciona.');
      expect(content, variant).toContain(
        'Verifique que nenhum cabeçalho de seção no estilo delta (`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`) permaneça no spec principal'
      );
    }
  });

  it('requires sync to create a missing main spec from ADDED requirements (#1222, #1264)', () => {
    const archiveVariants: Array<[string, string]> = [
      ['archive skill', generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['archive opsx command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of archiveVariants) {
      const start = content.indexOf('**Avalie o estado de sincronização dos delta specs**');
      const end = content.indexOf('**Realize o arquivamento**');
      expect(start, variant).toBeGreaterThan(-1);
      expect(end, variant).toBeGreaterThan(start);
      const assessStep = content.slice(start, end);

      expect(assessStep, variant).toContain('Um spec principal ausente **não** está automaticamente "já sincronizado"');
      expect(assessStep, variant).toContain('é uma *saída* do sync, não uma entrada');
      expect(assessStep, variant).toContain('Se o delta tiver requirements MODIFIED ou RENAMED');
      expect(assessStep, variant).toContain('só requirements ADDED podem criar');
      expect(assessStep, variant).toContain('Nunca invente um requirement');
      expect(assessStep, variant).toContain('se o delta não tiver requirements ADDED');
      expect(assessStep, variant).toContain('reporte que nenhum sync é possível');
      expect(assessStep, variant).toContain('Para um delta só de REMOVED');
      expect(assessStep, variant).toContain('deixe a árvore de specs principais inalterada');
      expect(assessStep, variant).toContain('marque essa capability como bloqueada para sync');
      expect(assessStep, variant).toContain('Spec must have at least one requirement');
      expect(assessStep, variant).toContain('conte a capability como precisando de sync');
      expect(assessStep, variant).toContain('Se o delta também tiver requirements REMOVED');
      expect(assessStep, variant).toContain('avise que eles serão ignorados');
      expect(assessStep, variant).toContain('cria o spec principal apenas a partir dos requirements ADDED do delta');
    }

    const syncVariants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of syncVariants) {
      const start = content.indexOf('b. **Leia o spec principal**');
      const end = content.indexOf('c. **Aplique as alterações de forma inteligente**');
      expect(start, variant).toBeGreaterThan(-1);
      expect(end, variant).toBeGreaterThan(start);
      const readStep = content.slice(start, end);

      expect(readStep, variant).toContain('**Se ainda não existir** (uma capability nova)');
      expect(readStep, variant).toContain('somente requisitos ADDED podem ser aplicados');
      expect(readStep, variant).toContain('MODIFIED e RENAMED não têm requisito sobre o qual agir');
      expect(readStep, variant).toContain('nunca invente o requisito ausente');
      expect(readStep, variant).toContain('REMOVED não tem nada');

      const createStart = content.indexOf('d. **Crie um novo spec principal**');
      const createEnd = content.indexOf('**Valide os specs principais atualizados**');
      expect(createStart, variant).toBeGreaterThan(-1);
      expect(createEnd, variant).toBeGreaterThan(createStart);
      const createStep = content.slice(createStart, createEnd);

      expect(createStep, variant).toContain('Somente quando o delta tiver requisitos ADDED para colocar nele');
      expect(createStep, variant).toContain('RENAMED tiver bloqueado esta capability no passo b');
      expect(createStep, variant).toContain('crie nada');
      expect(createStep, variant).toContain('Spec must have at least one requirement');
      expect(createStep, variant).toContain('Nunca escreva uma seção `## Requirements` vazia');
    }
  });

  it('preserves explicit archive-without-sync when a missing target blocks sync', () => {
    for (const content of [
      getArchiveChangeSkillTemplate().instructions,
      getOpsxArchiveCommandTemplate().content,
    ]) {
      const assessment = content.slice(
        content.indexOf('**Se delta specs existirem:**'),
        content.indexOf('Antes que um sync selecionado escreva qualquer spec principal')
      );
      expect(assessment).not.toContain('stop instead of prompting to sync');
      expect(assessment).toContain('marque essa capability como bloqueada para sync');
      expect(assessment).toContain('Continue avaliando as capabilities restantes');
      expect(assessment).toContain(
        'Se alguma capability estiver bloqueada para sync: explique por quê e ofereça apenas "Arquivar sem sincronizar", "Cancelar"'
      );
      expect(assessment).toContain('Não inicie nenhum sync enquanto uma capability estiver bloqueada para sync');
      expect(assessment).toContain('"Arquivar sem sincronizar" ou "Arquivar agora" — prossiga para o arquivamento');
      expect(assessment).toContain('"Cancelar" — pare, não arquive');
      expect(content).toContain('Se o sync falhar, ou qualquer capability não corresponder');
      expect(content).toContain('pare — não arquive');
    }
  });

  it('recognizes explicitly retired missing specs without blocking archive verification', () => {
    for (const content of [
      getArchiveChangeSkillTemplate().instructions,
      getOpsxArchiveCommandTemplate().content,
    ]) {
      const assessment = content.slice(
        content.indexOf('**Se delta specs existirem:**'),
        content.indexOf('**Opções de prompt:**')
      );
      const retirement = assessment.indexOf('se o delta tiver apenas requirements REMOVED');
      expect(retirement).toBeGreaterThan(-1);
      expect(retirement).toBeLessThan(assessment.indexOf('se o delta não tiver requirements ADDED'));
      expect(assessment).toContain('`retire_capabilities: true`');
      expect(assessment).toContain('conte-a como já sincronizada');
      expect(assessment).toContain('não recrie o spec principal');
      expect(content).toContain('incluindo o caso de spec ausente explicitamente aposentado');
    }

    for (const content of [
      getSyncSpecsSkillTemplate().instructions,
      getOpsxSyncCommandTemplate().content,
    ]) {
      const createStep = content.slice(
        content.indexOf('d. **Crie um novo spec principal**'),
        content.indexOf('**Valide os specs principais atualizados**')
      );
      expect(createStep).toContain('`retire_capabilities: true`');
      expect(createStep).toContain('reporte-o como já');
      expect(createStep).toContain('aposentado');
      expect(createStep).toContain('Sem esse marcador, reporte o sync como');
      expect(createStep).toContain('bloqueado');
      expect(createStep).toContain('crie nada');
    }
  });

  it('gates bulk archive on inline synchronous spec sync and verification before moving change root', () => {
    const generatedSkill = generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE');
    const commandContent = getOpsxBulkArchiveCommandTemplate().content;

    expect(generatedSkill, 'bulk skill').toContain('execute o workflow `openspec-sync-specs` inline');
    expect(commandContent, 'bulk opsx command').toContain('execute o workflow `/opsx:sync` inline');

    const variants: Array<[string, string]> = [
      ['bulk skill', generatedSkill],
      ['bulk opsx command', commandContent],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Não o delegue a uma tarefa em background');
      expect(content, variant).toContain('Nunca arquive uma change enquanto um sync de specs ainda estiver em andamento');
      expect(content, variant).toContain('Verifique os delta specs incluídos antes de mover `changeRoot`');
      expect(content, variant).toContain('Requisitos MODIFIED carregando as alterações de cenário e descrição');
      expect(content, variant).toContain('Requisitos REMOVED ausentes');
      expect(content, variant).toContain('Requisitos RENAMED presentes sob o novo nome e ausentes sob o antigo');
      expect(content, variant).toContain('Se o sync reportar qualquer condição de parada ou bloqueio, trate o sync como falho');
      expect(content, variant).toContain('Não faça a comparação de conteúdo pós-sync');
      expect(content, variant).toContain('não mova o `changeRoot`');
      expect(content, variant).toContain('openspec/specs/<capability-path>/spec.md');
      expect(content, variant).not.toContain('<planningHome.root>');
    }
  });

  it('carries mixed included and excluded bulk-archive deltas through both generated variants', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Uma decisão de inclusão ou exclusão para cada delta spec');
      expect(content, variant).toContain('Uma única change pode ter delta specs incluídos e excluídos');
      expect(content, variant).toContain('passando somente os caminhos de delta incluídos e instruindo-o explicitamente a ignorar');
      expect(content, variant).not.toContain('for each change, passing the delta spec analysis');
      expect(content, variant).toContain('Refaça a comparação apenas para os delta specs em `includedDeltas`');
      expect(content, variant).toContain('Não verifique os delta specs em `excludedDeltas`');
      expect(content, variant).toContain('reporte `sync skipped`');
      expect(content, variant).toContain('`sync skipped` sem tratar o arquivamento em si como ignorado');
      expect(content, variant).toContain(
        '`includedDeltas`: todos os delta specs sem conflito das changes'
      );
      expect(content, variant).toContain(
        '`excludedDeltas`: deltas de conflito das changes confirmadas excluídos'
      );
      expect(content, variant).toContain(
        'Carregue as decisões por delta de `includedDeltas` e `excludedDeltas` para a execução'
      );
      expect(content, variant).toContain(
        '1 delta spec com sync ignorado (add-jwt, identity/user-auth: implementação não encontrada)'
      );
    }
  });

  it('lets the sync workflow honor the delta subset bulk archive hands it', () => {
    const variants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('explícita de entradas completas de `existingOutputPaths`');
      expect(content, variant).toContain('caminhos nomeados e deixe os demais delta specs intocados');
      expect(content, variant).toContain('nunca a alargue de volta à lista completa');
      expect(content, variant).toContain('caller tenha estreitado o conjunto');
      expect(content, variant).toContain('valores absolutos verbatim');
      expect(content, variant).toContain('selecionando a entrada que termina em');
      expect(content, variant).toContain('/specs/billing/invoices/spec.md');
      expect(content, variant).not.toContain('sincronize só o delta billing');
      expect(content, variant).not.toContain('only sync `specs/billing/invoices/spec.md`');
      expect(content, variant).toContain('Para cada caminho de delta spec selecionado no passo 2');
      expect(content, variant).not.toContain('Para cada caminho de delta spec retornado pelo CLI');
      expect(content, variant).toContain('Se um caminho nomeado');
      expect(content, variant).toContain('não estiver em `existingOutputPaths`, não o sincronize');
      expect(content, variant).toContain('vazia, informe que não há nada para sincronizar e pare');
    }
  });

  it('requires apply context while keeping guidance advisory and state separate', () => {
    const variants: Array<[string, string]> = [
      ['apply skill', getApplyChangeSkillTemplate().instructions],
      ['apply command', getOpsxApplyCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('`context` opcional');
      expect(content, variant).toContain('`operationGuidance` opcional');
      expect(content, variant).toContain('Trate `context` como uma entrada obrigatória em nível de prompt');
      expect(content, variant).toContain('aplicando fatos, convenções e restrições relevantes do projeto');
      expect(content, variant).toContain('Trate `operationGuidance` como conselho aditivo');
      expect(content, variant).toContain('Leia e considere cada entrada');
      expect(content, variant).toContain('aplicáveis e');
      expect(content, variant).toContain('compatíveis com o workflow embutido');
      expect(content, variant).toContain('separados do estado retornado pelo CLI');
      expect(content, variant).toContain('Não use contexto ou orientação da operação como prova de que uma tarefa está concluída');
      expect(content, variant).toContain('reporte o conflito e preserve o valor controlador');
      expect(content, variant).toContain('não a siga e explique por quê');
      expect(content, variant).toContain(
        'Não copie contexto de runtime ou orientação da operação para arquivos de implementação ou artifacts de planejamento'
      );
      expect(content, variant).toContain('Preserve o comportamento de estado blocked/ready/all_done controlado pelo CLI');
      expect(content, variant).toContain('contratos de comportamento em nível de');
      expect(content, variant).toContain('prompt, não verificações impostas');
    }
  });

  it('makes the archive-inputs lookup fail open and sync instruction consumption fail closed', () => {
    const archiveVariants: Array<[string, string]> = [
      ['archive skill', getArchiveChangeSkillTemplate().instructions],
      ['archive command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of archiveVariants) {
      expect(content, variant).toContain('openspec instructions archive --change "<nome>" --json');
      expect(content, variant).not.toContain('same selected-root flags');
      expect(content, variant).not.toContain('--store');
      expect(content, variant).toContain('consultiva e opcional');
      expect(content, variant).toContain('nunca deve bloquear o arquivamento');
      expect(content, variant).toContain('CLI mais antigo que ainda não');
      expect(content, variant).toContain('suporta este comando');
      expect(content, variant).toContain('continue o workflow de arquivamento sem contexto e sem');
      expect(content, variant).toContain('orientação de operação');
      expect(content, variant).toContain('Não reporte erro e não pare');
      expect(content, variant).not.toContain('stop before inspecting or');
      expect(content, variant).toContain('Uma resposta bem-sucedida pode omitir ambos os campos opcionais');
      expect(content, variant).toContain('`context` como uma entrada obrigatória em nível de prompt');
      expect(content, variant).toContain('Trate `operationGuidance` como conselho aditivo opcional');
      expect(content, variant).toContain('considere cada entrada');
      expect(content, variant).toContain('reporte o conflito e preserve o valor controlador');
      expect(content, variant).toContain('siga e explique por quê');
      expect(content, variant).toContain('`artifactPaths.specs.existingOutputPaths` do JSON de status como a única');
      expect(content, variant).toContain('entrada `specs` estiver ausente');
      expect(content, variant).toContain('não infira');
      expect(content, variant).toContain('delta specs de outros artifacts');
      expect(content, variant).toContain('openspec instructions specs --change "<nome>" --json');
      expect(content, variant).toContain('pare antes de escrever qualquer spec');
      expect(content, variant).toContain('principal ou mover a change');
      expect(content, variant).toContain('resposta válida com `rules` omitido');
      expect(content, variant).toContain('sync inline deve reutilizar esse snapshot');
      expect(content, variant).toContain('não as use como');
      expect(content, variant).toContain('orientação de arquivamento');
      expect(content, variant).toContain(
        'Verificações do CLI, caminhos resolvidos, prompts e contratos de comandos existentes permanecem inalterados'
      );
      expect(content, variant).toContain(
        'Nunca copie contexto de runtime, orientação da operação ou texto de regras de artifact verbatim'
      );
      expect(content, variant).toContain(
        'Regras de artifact restringem apenas os specs sendo escritos e nunca são orientação de operação'
      );
    }

    const syncVariants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of syncVariants) {
      expect(content, variant).toContain('`artifactPaths.specs.existingOutputPaths` como a única fonte');
      expect(content, variant).toContain('`specs` estiver ausente');
      expect(content, variant).toContain('não os infira de outros artifacts');
      expect(content, variant).toContain('reutilize-o e não');
      expect(content, variant).toContain('busque as mesmas instruções novamente');
      expect(content, variant).toContain('Caso contrário, execute esse comando uma vez agora');
      expect(content, variant).toContain('pare antes de escrever');
      expect(content, variant).toContain('qualquer spec principal');
      expect(content, variant).toContain('Não trate a falha como um conjunto de regras');
      expect(content, variant).toContain('ausente');
      expect(content, variant).toContain('resposta válida com `rules` omitido');
      expect(content, variant).toMatch(/Regras de artifact não são\s+orientação de operação/);
      expect(content, variant).toMatch(/sem copiá-lo\s+verbatim/);
    }
  });

  it('keeps bulk archive instruction lookups atomic across mixed-schema batches', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', getBulkArchiveChangeSkillTemplate().instructions],
      ['bulk command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('entradas atuais de arquivamento uma vez');
      expect(content, variant).toContain('openspec instructions archive --change "<change-selecionada>" --json');
      expect(content, variant).toContain('consultiva e opcional');
      expect(content, variant).toContain('nunca deve bloquear o lote');
      expect(content, variant).toContain('continue o lote sem contexto e sem orientação de operação');
      expect(content, variant).not.toContain('stop the whole batch before inspecting specs');
      expect(content, variant).toContain('Trate essa lista como a única fonte de delta specs');
      expect(content, variant).toContain('ausente ou a lista estiver vazia');
      expect(content, variant).toContain('lotes com');
      expect(content, variant).toContain('schemas mistos');
      expect(content, variant).toContain('obtenha todos os snapshots de regras de specs necessários');
      expect(content, variant).toContain('Obtenha todos os snapshots antes da primeira escrita ou movimentação');
      expect(content, variant).toContain('o lote antes de qualquer escrita de spec principal ou movimentação de');
      expect(content, variant).toContain('sync inline deve reutilizá-lo sem buscar instruções novamente');
      expect(content, variant).toContain('Trate');
      expect(content, variant).toContain('`context` como uma entrada obrigatória em nível de prompt para todo o');
      expect(content, variant).toContain('lote');
      expect(content, variant).toContain('`operationGuidance` como conselho');
      expect(content, variant).toContain('aditivo opcional');
      expect(content, variant).toContain('leia e considere cada entrada');
      expect(content, variant).toContain('reporte o conflito e preserve o valor controlador');
      expect(content, variant).toContain('siga e explique por quê');
      expect(content, variant).toContain(
        'Mantenha entradas de runtime, análise de conflitos, valores derivados do CLI e regras de artifact separados'
      );
      expect(content, variant).toContain('Regras de artifact restringem apenas os specs escritos');
      expect(content, variant).toContain(
        'Nunca copie texto de entradas de runtime ou de regras de artifact verbatim para arquivos de saída'
      );
    }
  });

  it('never instructs stacking a date prefix on an already-dated change (#1317)', () => {
    const archiveInstructions: Array<[string, string]> = [
      ['openspec-archive-change', getArchiveChangeSkillTemplate().instructions],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate().instructions],
      ['openspec-onboard', getOnboardSkillTemplate().instructions],
      ['opsx-archive', getOpsxArchiveCommandTemplate().content],
      ['opsx-bulk-archive', getOpsxBulkArchiveCommandTemplate().content],
      ['opsx-onboard', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [id, text] of archiveInstructions) {
      expect(text, id).toContain('prefixo `YYYY-MM-DD-`');
      expect(text, id).toContain('<target-name>');

      // The onboarding explainer still names the dated directory once, as
      // `archive/YYYY-MM-DD-<nome>/`. Archive and bulk instructions must not.
      const literalDatedPaths = text.match(/\/YYYY-MM-DD-/g) ?? [];
      if (id.includes('onboard')) {
        expect(literalDatedPaths, id).toEqual(['/YYYY-MM-DD-']);
      } else {
        expect(literalDatedPaths, id).toEqual([]);
      }
    }
  });

  it('passes --yes wherever it tells an agent to run openspec archive (#1479)', () => {
    const corpus: Array<[string, string]> = [
      ...getSkillTemplates().map(
        ({ dirName, template }) => [dirName, template.instructions] as [string, string]
      ),
      ...getCommandContents().map((entry) => [entry.id, entry.body] as [string, string]),
    ];

    function archiveInvocations(text: string): string[] {
      return text.split('\n').filter((line) => {
        const bare = line
          .trimStart()
          .replace(/^(?:[-*+]|\d+\.)[ \t]+/, '')
          .replace(/^\$[ \t]+/, '');
        const tokens = bare.split(/\s+/).filter(Boolean);
        if (tokens[0] !== 'openspec') return false;
        const archiveAt = tokens.indexOf('archive');
        if (archiveAt < 1) return false;
        return tokens
          .slice(1, archiveAt)
          .every((token, i, before) => token.startsWith('-') || !!before[i - 1]?.startsWith('-'));
      });
    }

    let total = 0;
    for (const [id, text] of corpus) {
      const invocations = archiveInvocations(text);
      total += invocations.length;
      for (const invocation of invocations) {
        expect(invocation.trim(), id).toContain('--yes');
      }
    }

    expect(total).toBeGreaterThan(0);
    const onboard = corpus.filter(([id]) => id.includes('onboard'));
    expect(onboard.length).toBeGreaterThan(0);
    for (const [id, text] of onboard) {
      expect(archiveInvocations(text), id).not.toHaveLength(0);
    }
  });

  it('honors Cancel at every archive confirmation (#1381)', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
      ['single skill', generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['single opsx command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('"Cancelar" — pare, não arquive');
      expect(content, variant).toContain('Qualquer outra resposta — pergunte novamente em vez de arquivar');
    }
  });

  it('routes the bulk archive confirmation by intent, not by literal label (#1381)', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('Encaminhe conforme a intenção da resposta, não pelo rótulo exato');
      expect(content, variant).toContain('as changes que a tabela do passo 6 marca');
      expect(content, variant).toContain('Nunca arquive depois que o usuário cancela a confirmação');
    }
  });

  it('makes the schema instruction field authoritative for artifact creation (#777)', () => {
    const variants: Array<[string, string]> = [
      ['propose skill', generateSkillContent(asDeployed(getOpsxProposeSkillTemplate()), 'PARITY-BASELINE')],
      ['propose command', getOpsxProposeCommandTemplate().content],
      ['continue skill', generateSkillContent(asDeployed(getContinueChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['continue command', getOpsxContinueCommandTemplate().content],
      ['ff skill', generateSkillContent(asDeployed(getFfChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['ff command', getOpsxFfCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('orientação autoritativa');
      expect(content, variant).not.toContain('Common artifact patterns');
      expect(content, variant).toContain(
        'invoque-o somente se ele puder escrever o artifact nesse caminho de saída; caso contrário, pare e avise o usuário'
      );
      expect(content, variant).toContain('verifique se o arquivo do artifact existe nesse caminho de saída');
      expect(content, variant).toContain(
        'Se o campo `instruction` direcionar você a usar uma skill ou comando específico para criar o artifact, invoque-o em vez de escrever o artifact diretamente'
      );
    }
  });

  // The explore capture table names spec-driven files; without this caveat an
  // agent on a custom schema offers to write artifacts it never defines (#2084).
  it('scopes the explore capture table to the default schema', () => {
    const variants = [
      ['explore skill', getExploreSkillTemplate().instructions],
      ['explore command', getOpsxExploreCommandTemplate().content],
    ] as const;
    for (const [variant, text] of variants) {
      expect(text, variant).toContain(
        'Os arquivos abaixo são os do schema spec-driven padrão. Com outro schema, capture cada insight no artifact de `artifactPaths` que couber'
      );
    }
  });
});

describe('apply skill/command shared instruction core', () => {
  // The apply skill and command are intentionally distinct surfaces, but they
  // differ only in how they are invoked — the generation transformers rewrite
  // the canonical `/opsx:<id>` tokens per surface downstream (asserted in
  // test/utils/command-references.test.ts). The instruction text itself is
  // shared, so this pins the contract: both surfaces render the one canonical
  // core and cannot silently drift apart at the template level.
  it('renders both apply surfaces from the shared instruction core', () => {
    const core = getApplyInstructions();
    expect(getApplyChangeSkillTemplate().instructions).toBe(core);
    expect(getOpsxApplyCommandTemplate().content).toBe(core);
  });

  it('keeps task completion distinct from archive readiness (#1790)', () => {
    const core = getApplyInstructions();
    expect(core).toContain('Todas as tarefas rastreadas estão concluídas');
    expect(core).toMatch(/Revise ou verifique a change conforme couber\s+antes de arquivar/);
    expect(core).not.toContain('Todas as tarefas completas! Você pode arquivar');
    expect(core).not.toContain('All tasks complete! You can archive');
  });
});

describe('workflow guidance matches the packaged templates (#1138)', () => {
  // Onboard drafts each artifact in the conversation and then saves what it
  // drafted, so a preview missing the template's title writes an untitled file
  // no matter what the template says.
  it('shows every artifact title in the onboarding walkthrough', () => {
    const titles = specDrivenTitles();
    const surfaces: Array<[string, string]> = [
      ['onboard skill', getOnboardSkillTemplate().instructions],
      ['opsx onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [surface, text] of surfaces) {
      for (const artifactId of ['proposal', 'specs', 'design', 'tasks']) {
        expect(text, `${surface} / ${artifactId}`).toContain(`\n${titles[artifactId]}\n`);
      }
    }
  });

  // The sync workflow prints a delta reference right beside the main-spec one.
  // The two are only telling them apart if the delta carries its own title.
  it('titles the delta spec in the sync format reference', () => {
    const titles = specDrivenTitles();

    for (const [surface, text] of [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['opsx sync command', getOpsxSyncCommandTemplate().content],
    ] as Array<[string, string]>) {
      expect(text, surface).toContain(`\n${titles.specs}\n\n## Purpose\n`);
      expect(text, surface).toContain('\n# <capability> Specification\n');
    }
  });
});

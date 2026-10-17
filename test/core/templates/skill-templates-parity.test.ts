import { createHash } from 'node:crypto';
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
import { generateSkillContent, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'b80449d7d037676c0f34b4417f58287f26cd3a20ced245b8bd4296635baf2751',
  getNewChangeSkillTemplate: 'efba244285a815605b9a4f85e140da11d3301b997608d58536dd7c65eaf9e42a',
  getContinueChangeSkillTemplate: 'd19e7494e75949def7fe056d131f948c0c20be54721dc37eddd0caa3c0f9025d',
  getApplyChangeSkillTemplate: 'e80c1eacd58c257b3008a011d1d1d62c22c15728ba8f3365bacf7f3ba3d8c1ab',
  getUpdateChangeSkillTemplate: 'b649ef88015007a3685ba6ca1c06b3c90ec0b12021af66e7f191f60cd77b79ee',
  getFfChangeSkillTemplate: 'f05980574193a31bb55d0b3842e1733095b736b1640396620f67eab2e3d0275b',
  getSyncSpecsSkillTemplate: '0d19fb22b8d8dda4fd5a182c81c66d81b340e21ec9f3454157433423a682785f',
  getOnboardSkillTemplate: '30dc8e2600ff5a0e121c18ed3a2989dfdbbba6c722611f98fd9f3aa6a0a13b04',
  getOpsxExploreCommandTemplate: '554b4a9d8c5806ea9d5978a7c70758efd6e86a9261553a0880cf5bdd08e68fcd',
  getOpsxNewCommandTemplate: '27a71f3a3dc44a7e784dd6fc479d636d02b858be5de3f688830e7b24f0a54598',
  getOpsxContinueCommandTemplate: '275b837e5ad091d51d8049e346dd73fbbaebcd3377b1abd906d112b90b05bf75',
  getOpsxApplyCommandTemplate: '442a04f763a358c8cd6256b531ad89eb79ee1de8122d899994591db56d60f261',
  getOpsxUpdateCommandTemplate: '974dffceedf9a8a669a547c7e0e5a494790dcdd0f60ab006f400bdc1c938f560',
  getOpsxFfCommandTemplate: 'b85528290e5d592831738615e28b82ee68098b21cb49adcb0eebd3c98aef5148',
  getArchiveChangeSkillTemplate: '443cf9276ccdac74ee218ef15ceafa8e4958c4f238ec36d7f5b5821986d454a7',
  getBulkArchiveChangeSkillTemplate: 'b1ce1629deb366c387fa293b2c4c9cf416e3be657bc284ec0699d0dfd3f4b09d',
  getCodeReviewSkillTemplate: '53cadf1f52914d26c021b2e9cc10bdc535c02c5ecafe0d846928bd37b1db81ea',
  getOpsxSyncCommandTemplate: '4adb080357b23e3068fc7cbc0da0ff278abeb46aa9d442e46fa6487a4ee6d85f',
  getVerifyChangeSkillTemplate: '3d30f6a69528dd6ff0ff4067a7686b01e0ebda1fca14afd8fb40154064110e94',
  getOpsxArchiveCommandTemplate: 'fc719a34665c8f8809966520528c5a44fbf699bab6591e17eff2996a06c99e00',
  getOpsxOnboardCommandTemplate: '3c0356fa22d8341ee12e11012887e34c560f0588761dfba386f4224bc154a9c6',
  getOpsxBulkArchiveCommandTemplate: '47f5a0a2cf661675707207e1a13c4579b2f2bad465cd5e7c74a19c97a903895e',
  getOpsxCodeReviewCommandTemplate: 'd4ee579f36b34a3f09ddb5512ff14780125e66205787544ae78c8b260e9605ae',
  getOpsxVerifyCommandTemplate: 'b51a8e79626968405b148627ae6f8ba2cc7a377866e6e75be34facdeb069e3ce',
  getOpsxProposeSkillTemplate: '31145a866d6018b959b17272b2e82f78358e1730711e07e92e7b958aa80e251d',
  getOpsxProposeCommandTemplate: 'ce3258829f9fe03ce40df37d1a9c991d8189789744447b143b2ed939d88f2904',
  getFeedbackSkillTemplate: '7a1366f62544b1fd48eef1f6548d85dcfb7c7360cf06899134568f5d0d43b4df',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'ddb7d8ef9e18cb4bfc6a25104cf6f198c85cf0d5853ddede948113dfd38875e8',
  'openspec-new-change': '396880c6dba86343b6087e0cdb7799f71cda4e11fc1701c73b16a5f369e29c6c',
  'openspec-continue-change': '5ac331d2e2e3110f46d8acd7ec4ec452014cc3687cf2dfb280165ff3ee935307',
  'openspec-apply-change': '9b692d8395ea3c8501e274196171c882db05ec6a33a929d84684db50dad101b5',
  'openspec-update-change': '6eba1aa8f383d3b6dc009dc0addbc8cc1e2460414766c18d40c493941521a2a6',
  'openspec-ff-change': '366fea97d528a2d60e8d2a8a40d15e30828a3e0fdf6f63e9e0fb7e75dba61507',
  'openspec-sync-specs': '766d11701c76d4a10197ad878e7fe8652fadcdbb06d8148ef0ebef46741eee0a',
  'openspec-archive-change': '6c359946da6732d231991d6dc15ee779e374daf8bbf4eca873146061f273a401',
  'openspec-bulk-archive-change': '88cef219b05063220690842a7aa7f30c9f2fdea0ef47352cef0a0cc4b633ac0f',
  'openspec-verify-change': 'c7078f8c0d078306865fd10b56603a61914882297bef0885c15ca9e3aa4d1060',
  'openspec-code-review': 'f1db9f85d11e9d66c6df2778a79540c97bb74ee4b41b111ff188f3f2d1836a65',
  'openspec-onboard': '503375ff795a7a87ee204d4e1518af10be992fc90ff8e2c22d489f0c81467ae1',
  'openspec-propose': '6559ddc9a1953c265ed98aacb6d50fac0d5461f733fc06c1f13b4ea6e7bc09e3',
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
        generateSkillContent(getOpsxProposeSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getExploreSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getSyncSpecsSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE'),
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
        generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
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
      ['onboard skill', generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE')],
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
});

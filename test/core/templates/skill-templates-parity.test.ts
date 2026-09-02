import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
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
  getExploreSkillTemplate: 'f76cd8a5a2200e5ebbc90d76288402d24a90be2642cfe398e1518303465a7685',
  getNewChangeSkillTemplate: 'efba244285a815605b9a4f85e140da11d3301b997608d58536dd7c65eaf9e42a',
  getContinueChangeSkillTemplate: '24720c8a0b007f0c24212e8c984f12b6ddc15a8d8272c6ca970b8cd3b2791f76',
  getApplyChangeSkillTemplate: '0cf574d68301f9ed14f05b864da4fd28810dcc56a4327cba823c9cd9bb1fe267',
  getUpdateChangeSkillTemplate: '9f1da486baf46a858362922e524460aa70bba04baa40c11cf92ff606f063986d',
  getFfChangeSkillTemplate: 'f05980574193a31bb55d0b3842e1733095b736b1640396620f67eab2e3d0275b',
  getSyncSpecsSkillTemplate: 'df60da64b5ae567f70ddcaedf020e5c8b48e7d9274c732fe5361fab824c811bf',
  getOnboardSkillTemplate: 'eb35b49e1772c9f5976895b3ba8d9366478051bad1374d545ee88c97f9ecc195',
  getOpsxExploreCommandTemplate: '0eb225c540cf219eef529419476b1b50b9277a789267cec69cfdab13ed340686',
  getOpsxNewCommandTemplate: '27a71f3a3dc44a7e784dd6fc479d636d02b858be5de3f688830e7b24f0a54598',
  getOpsxContinueCommandTemplate: '153ba33e4588b7fa6606f14a7027e5d7da00570cb1fd314e4302568439125eea',
  getOpsxApplyCommandTemplate: '14a6302644d79790687b463dfeeb3ae48181fe2d000d2bb37a97836334251e64',
  getOpsxUpdateCommandTemplate: '5e2d472164e04709891e5e761e3a6585d451d50049f3463495200d2bf18f8fd6',
  getOpsxFfCommandTemplate: 'b85528290e5d592831738615e28b82ee68098b21cb49adcb0eebd3c98aef5148',
  getArchiveChangeSkillTemplate: 'd5af90f6243ea90bf5243e6a065800a20b324848594d9434ecc0c7c2eacd1c02',
  getBulkArchiveChangeSkillTemplate: '62b0f7e8f07c26daa3f2a0d2275a45a85b5542e974bb2fe9f2072902a5edf0be',
  getCodeReviewSkillTemplate: '53cadf1f52914d26c021b2e9cc10bdc535c02c5ecafe0d846928bd37b1db81ea',
  getOpsxSyncCommandTemplate: '054558c61645f90ccef27a9db45904fd3245f75783a470de789c13b49229263a',
  getVerifyChangeSkillTemplate: '3d30f6a69528dd6ff0ff4067a7686b01e0ebda1fca14afd8fb40154064110e94',
  getOpsxArchiveCommandTemplate: 'a9cf6a9905d50c99049c5f3c087c4b0fe8a7f2060d0bae62a30c089b24787813',
  getOpsxOnboardCommandTemplate: '67158889470c19e3184433f8eaa6c2cb92c2030c662e0045e8a6b0e17dc84997',
  getOpsxBulkArchiveCommandTemplate: '17ecedd8eb2107c980fe5e51c4cd2e8d2e2e0e3a41621ffcf5ca319fe4db26c6',
  getOpsxCodeReviewCommandTemplate: 'd4ee579f36b34a3f09ddb5512ff14780125e66205787544ae78c8b260e9605ae',
  getOpsxVerifyCommandTemplate: 'b51a8e79626968405b148627ae6f8ba2cc7a377866e6e75be34facdeb069e3ce',
  getOpsxProposeSkillTemplate: '17ed1603bf74be01b56dd0cb87e16d1303affb9c6f7ea4dd7774bf92aede4749',
  getOpsxProposeCommandTemplate: '3312f9fd45b0aea019bc980bdf4b627be9d4c17023bb6e2d7e50fa61a5589941',
  getFeedbackSkillTemplate: '087c098185bfc7067fc89fab113ce7cf0df6b5c41138f4f869389f2e2daf0118',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '6f8893bca0da8dc8f005b40d34094af88769c1a29ac6aab316eddddce8daf397',
  'openspec-new-change': '396880c6dba86343b6087e0cdb7799f71cda4e11fc1701c73b16a5f369e29c6c',
  'openspec-continue-change': 'f956dec99885cf6cce623ed4a52dfc0957e14f804d7f181f05af546039870554',
  'openspec-apply-change': 'b45afb8e7c8d9c18cc9bae302e7f28fdaa856d4792ece78315bed8a30fb02f24',
  'openspec-update-change': 'f27b21d871033548116ff3297ad7a1a65fd3f3c98285e20d9a8777a94c9ef9f4',
  'openspec-ff-change': '366fea97d528a2d60e8d2a8a40d15e30828a3e0fdf6f63e9e0fb7e75dba61507',
  'openspec-sync-specs': 'e31a5c8dcc5ee89fe778d4e244a07b5f2b182297c3ff82525bf2556d3dc83440',
  'openspec-archive-change': 'dbfe708612086d846dc02db151c08d5e57060715255a82da2edd9eb27a893860',
  'openspec-bulk-archive-change': '392eb206c5beb12621affc315f2b0067851fd387f81b888992336bd5cb0862dc',
  'openspec-verify-change': 'c7078f8c0d078306865fd10b56603a61914882297bef0885c15ca9e3aa4d1060',
  'openspec-code-review': 'f1db9f85d11e9d66c6df2778a79540c97bb74ee4b41b111ff188f3f2d1836a65',
  'openspec-onboard': '45b18c05fb7d4c7b3dc4874a55e7ea303227935d55efe0ef39b4f4ece0ed3dee',
  'openspec-propose': '5c8ef1aa72ba0adb0b42a81851617f683e2ccc6eabb5d7877f0857928f066e3a',
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
});

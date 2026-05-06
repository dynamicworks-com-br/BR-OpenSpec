import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxUpstreamSyncCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getUpstreamSyncSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '07c5e672fba9ffd4e03b0df49e94d5bf1800167d6a46a55041dab8c2028b298b',
  getNewChangeSkillTemplate: 'f1cc31b5310eb2a0a693a3dd0bb795ea1a2524a05aaac3a136b1e2cda044ffe6',
  getContinueChangeSkillTemplate: '7941f7ded8b454305c07b9a3288b5cecb71214abe9325b5688056f3f556e0a5a',
  getApplyChangeSkillTemplate: '23df5753039a3671e6a2812f44cfea5bb1b049014c34ebace6190fece6e40dae',
  getFfChangeSkillTemplate: 'c3a18e9db642f4d5951b041b81af0fb3e20ecf721f5100a5286e29f31ceedc8d',
  getSyncSpecsSkillTemplate: 'bee62b4c28de12658f6e556b876bdeaed0977e74859301a4e6ba509d138e9be3',
  getOnboardSkillTemplate: 'e9f2f53d4557b43686fe319e2799dc96a8ce4e05934c83545409192841c03f6c',
  getOpsxExploreCommandTemplate: 'f8c9d7546429ed530dfdf03bf606fed9225bd89eae08a5982a41ce26591da1d3',
  getOpsxNewCommandTemplate: '8000acbdc49d16a870ec3a148b25ecc0cc4a14b8f7e2ea5e3d83bf25111bb0ab',
  getOpsxContinueCommandTemplate: '9c423b40b4af382bf71fbd7f38b11f6e5de1671ca81730dee2dc618ff8c239a3',
  getOpsxApplyCommandTemplate: 'b1c8d23285f6bb4356944507c7d94532781cafd5da652ebd33fc38afa4e559bf',
  getOpsxFfCommandTemplate: '3de88bc05d0514577bab0b3232a2fd5167175c4a2772cd7717d0bc036b14c476',
  getArchiveChangeSkillTemplate: 'a0e66a4cdd902c13568f35a4983da0d87f2f2d8fc0ee96bc4ed5a85df1892782',
  getBulkArchiveChangeSkillTemplate: '206addc4629610296cc6e9522d2f75a9dbe46d6352a4d038bd4175097bb37701',
  getOpsxSyncCommandTemplate: '6633667cd3726dd8fdd01b4fb6d51292c523c8e4d05ee34ab8f338c7b3e5b90d',
  getVerifyChangeSkillTemplate: 'd30ac8076ddc40f27c6fe73099abdbc382e0a2e58603ae26ebe4f30dc071dc65',
  getOpsxArchiveCommandTemplate: '8830bb1bb113cb79cbb192e2bc4feebb3a1b5071bdf59ba05b151b9ce79a6f81',
  getOpsxOnboardCommandTemplate: '9156f1458d4f5eaa9923063f1f298e5afcbbf211ff001822a0588724e9dc6907',
  getOpsxBulkArchiveCommandTemplate: '6a0b7d7d6d44efea02fc6923aa2e2415ece757558dafee8c8cf4baed01de4a94',
  getOpsxVerifyCommandTemplate: 'c468e2841df71642d27d22fd00e5a13ada8f4172187b52a02aa4f511173eb96a',
  getOpsxProposeSkillTemplate: 'f49ceeab9fb084d5540d45f1b93955b78b1cd3d06a1b57949a432ea5122a964c',
  getOpsxProposeCommandTemplate: '6843b073c38dbb25561fa3d2d2b6b0a443f3914564f44f700bff729493f65b6a',
  getFeedbackSkillTemplate: '087c098185bfc7067fc89fab113ce7cf0df6b5c41138f4f869389f2e2daf0118',
  getUpstreamSyncSkillTemplate: '5c2e19869b25d85cedac10d4ee4c74f2d467d70252e36723b4c5d80683a14f9b',
  getOpsxUpstreamSyncCommandTemplate: 'de481103108d05e5ee39f2e0605b2f709e7b057efd4c6cc246123c77dd0dfe04',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'e0aa71c37ec9ab59f7deb422d84e68f7c8198de6ab729dcdbd489750eaa7730b',
  'openspec-new-change': 'b321551e006d4cd4359361a4774ca5c3eb8336f8dd1bb80718e8073022ae8e9f',
  'openspec-continue-change': '27a25f7b9d483b5136d5c2ccf8f2ff648c213c857201bdf184cf2bee1de329ca',
  'openspec-apply-change': '298b1de718ab88bccd3e8690665fe2171fc54dc41bbe95a26de4d31e739b37d7',
  'openspec-ff-change': '36d35034b5b0c269c540defdef48a0780bdaef71a47bf250e6738d08afac7ed3',
  'openspec-sync-specs': 'ecf994fdee9fc3a1433ed4043ce1a37117ddfd75c1aa44ca8c5a43003587c8be',
  'openspec-archive-change': '21abccc89a88ab0d5e3293333ae44fbe6394020d975091c524016777b84b5d96',
  'openspec-bulk-archive-change': '2e7c35324be567fb222c902cc78ba64cda48263a4db45cbeced460c1e5470884',
  'openspec-verify-change': '75fb464069eb0d61bef15f39ba90d64021741065152b7d3c14ab7d475ab03f8a',
  'openspec-onboard': '6cfce89ebc194807090a8ad0f4ad19379cb93cb67450c3fb26aeb4ca281450a2',
  'openspec-propose': '94f406b91d410d3bef66df1819ac8462c13a58ce0e2812921eb08ea09b9ca265',
  'openspec-upstream-sync': 'f7885a66742b33b0c658de4323b64e01738ab93f984c9954cb386855e96f455c',
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
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getUpstreamSyncSkillTemplate,
      getOpsxUpstreamSyncCommandTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-ff-change', getFfChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
      ['openspec-upstream-sync', getUpstreamSyncSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });
});

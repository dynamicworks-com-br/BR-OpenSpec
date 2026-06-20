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
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '07c5e672fba9ffd4e03b0df49e94d5bf1800167d6a46a55041dab8c2028b298b',
  getNewChangeSkillTemplate: 'f1cc31b5310eb2a0a693a3dd0bb795ea1a2524a05aaac3a136b1e2cda044ffe6',
  getContinueChangeSkillTemplate: '7941f7ded8b454305c07b9a3288b5cecb71214abe9325b5688056f3f556e0a5a',
  getApplyChangeSkillTemplate: '23df5753039a3671e6a2812f44cfea5bb1b049014c34ebace6190fece6e40dae',
  getFfChangeSkillTemplate: 'c3a18e9db642f4d5951b041b81af0fb3e20ecf721f5100a5286e29f31ceedc8d',
  getSyncSpecsSkillTemplate: 'b0196bcf6257281e33b9f7c31799b7f4e193e990ac4a84645d3d9f856b5dc074',
  getOnboardSkillTemplate: '96ecbc30ac15389a94e41c3b9ffe6db44d08de030ceeacd8b4bb171e919b76cc',
  getOpsxExploreCommandTemplate: 'f8c9d7546429ed530dfdf03bf606fed9225bd89eae08a5982a41ce26591da1d3',
  getOpsxNewCommandTemplate: '8000acbdc49d16a870ec3a148b25ecc0cc4a14b8f7e2ea5e3d83bf25111bb0ab',
  getOpsxContinueCommandTemplate: '9c423b40b4af382bf71fbd7f38b11f6e5de1671ca81730dee2dc618ff8c239a3',
  getOpsxApplyCommandTemplate: 'b1c8d23285f6bb4356944507c7d94532781cafd5da652ebd33fc38afa4e559bf',
  getOpsxFfCommandTemplate: '3de88bc05d0514577bab0b3232a2fd5167175c4a2772cd7717d0bc036b14c476',
  getArchiveChangeSkillTemplate: 'a0e66a4cdd902c13568f35a4983da0d87f2f2d8fc0ee96bc4ed5a85df1892782',
  getBulkArchiveChangeSkillTemplate: '206addc4629610296cc6e9522d2f75a9dbe46d6352a4d038bd4175097bb37701',
  getCodeReviewSkillTemplate: '0c73523a300e294439ab9b4c642afacb4299b0a13ad10643d4904bc7c844d61d',
  getOpsxSyncCommandTemplate: 'fba921f718b861661908664bfd5e4fcb25a1228d1d9fdd9bf937abb134d4028b',
  getVerifyChangeSkillTemplate: 'd30ac8076ddc40f27c6fe73099abdbc382e0a2e58603ae26ebe4f30dc071dc65',
  getOpsxArchiveCommandTemplate: '8830bb1bb113cb79cbb192e2bc4feebb3a1b5071bdf59ba05b151b9ce79a6f81',
  getOpsxOnboardCommandTemplate: '8445564c7b638ecb9e23b1e204116c2dc9d0a48c62ec7d914df806791adef685',
  getOpsxBulkArchiveCommandTemplate: '6a0b7d7d6d44efea02fc6923aa2e2415ece757558dafee8c8cf4baed01de4a94',
  getOpsxCodeReviewCommandTemplate: '4760bd30a37ebbd70bf1d15c02d5427ce2c4f60f62a529f81ec9711b902d27f2',
  getOpsxVerifyCommandTemplate: 'c468e2841df71642d27d22fd00e5a13ada8f4172187b52a02aa4f511173eb96a',
  getOpsxProposeSkillTemplate: 'f49ceeab9fb084d5540d45f1b93955b78b1cd3d06a1b57949a432ea5122a964c',
  getOpsxProposeCommandTemplate: '6843b073c38dbb25561fa3d2d2b6b0a443f3914564f44f700bff729493f65b6a',
  getFeedbackSkillTemplate: '087c098185bfc7067fc89fab113ce7cf0df6b5c41138f4f869389f2e2daf0118',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'e0aa71c37ec9ab59f7deb422d84e68f7c8198de6ab729dcdbd489750eaa7730b',
  'openspec-new-change': 'b321551e006d4cd4359361a4774ca5c3eb8336f8dd1bb80718e8073022ae8e9f',
  'openspec-continue-change': '27a25f7b9d483b5136d5c2ccf8f2ff648c213c857201bdf184cf2bee1de329ca',
  'openspec-apply-change': '298b1de718ab88bccd3e8690665fe2171fc54dc41bbe95a26de4d31e739b37d7',
  'openspec-ff-change': '36d35034b5b0c269c540defdef48a0780bdaef71a47bf250e6738d08afac7ed3',
  'openspec-sync-specs': 'e04c83cd68e9f4e671b34423b307ae8a2a64112e2b051918b68b7792d5cc18ff',
  'openspec-archive-change': '21abccc89a88ab0d5e3293333ae44fbe6394020d975091c524016777b84b5d96',
  'openspec-bulk-archive-change': '2e7c35324be567fb222c902cc78ba64cda48263a4db45cbeced460c1e5470884',
  'openspec-verify-change': '75fb464069eb0d61bef15f39ba90d64021741065152b7d3c14ab7d475ab03f8a',
  'openspec-code-review': '55fa92c3af14884d7fb6714acfbdfe17f28b7a092ea30fd534591f49152d0281',
  'openspec-onboard': '0c0eddd406229f0925782abd0d83f669dba79b99fd8043a1d8b31db3036c2e1f',
  'openspec-propose': '94f406b91d410d3bef66df1819ac8462c13a58ce0e2812921eb08ea09b9ca265',
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
      ['openspec-code-review', getCodeReviewSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
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

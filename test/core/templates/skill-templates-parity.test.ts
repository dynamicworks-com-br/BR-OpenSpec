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
  getExploreSkillTemplate: '07c5e672fba9ffd4e03b0df49e94d5bf1800167d6a46a55041dab8c2028b298b',
  getNewChangeSkillTemplate: 'f1cc31b5310eb2a0a693a3dd0bb795ea1a2524a05aaac3a136b1e2cda044ffe6',
  getContinueChangeSkillTemplate: 'a0752c4a128d96d00dfd01aeedd765cbecbce85ec0c98b2ffa07a7930e344679',
  getApplyChangeSkillTemplate: '23df5753039a3671e6a2812f44cfea5bb1b049014c34ebace6190fece6e40dae',
  getUpdateChangeSkillTemplate: '6da296108c94a37b253c107f120113e87abce7eb34cd9dfe9d6320c6bcfdc77d',
  getFfChangeSkillTemplate: 'a0153a45ec305ad03977bfb791d7c1925a97b8a17a5afb7dbc1210ad64164b50',
  getSyncSpecsSkillTemplate: '2d77b7de49727758e50f6f00427e4503a60969dd3f21ee0780ef5621da65cd59',
  getOnboardSkillTemplate: '96ecbc30ac15389a94e41c3b9ffe6db44d08de030ceeacd8b4bb171e919b76cc',
  getOpsxExploreCommandTemplate: 'f8c9d7546429ed530dfdf03bf606fed9225bd89eae08a5982a41ce26591da1d3',
  getOpsxNewCommandTemplate: '8000acbdc49d16a870ec3a148b25ecc0cc4a14b8f7e2ea5e3d83bf25111bb0ab',
  getOpsxContinueCommandTemplate: 'ff61a5a4f3d051c02d5dbc07ec1233c4f0f6a784cf981b95b8a951af08af4675',
  getOpsxApplyCommandTemplate: 'b1c8d23285f6bb4356944507c7d94532781cafd5da652ebd33fc38afa4e559bf',
  getOpsxUpdateCommandTemplate: '08a14b59bb34caab5ed7750b0ddb793b9421480e3628c98ee74f3365cb59002e',
  getOpsxFfCommandTemplate: '5b7ade643acfa49e4b7e76fb93534491f39ee1e39fb0439a390e5379af34be6d',
  getArchiveChangeSkillTemplate: 'ea51c4cad9d267e599221c31f793323431115514ce3b3465e7dcb8c719929cde',
  getBulkArchiveChangeSkillTemplate: '56a38548dc5eb203944aa8c9d5eb00490e9ce09f94d337f1f82446c760dbdd2b',
  getCodeReviewSkillTemplate: '0c73523a300e294439ab9b4c642afacb4299b0a13ad10643d4904bc7c844d61d',
  getOpsxSyncCommandTemplate: '12d2d12b8b5fa1c6cf26c0e8681ae7f476c88f661da13b1bad053af105079147',
  getVerifyChangeSkillTemplate: 'd30ac8076ddc40f27c6fe73099abdbc382e0a2e58603ae26ebe4f30dc071dc65',
  getOpsxArchiveCommandTemplate: 'b3d02c1ed099c59787fce7491cae042c44778daeb8502668cda003cfb5912859',
  getOpsxOnboardCommandTemplate: '8445564c7b638ecb9e23b1e204116c2dc9d0a48c62ec7d914df806791adef685',
  getOpsxBulkArchiveCommandTemplate: '32c34b320e60533dc7f598afbae9ca740f76138e0ebcd65da9a5d613f902d684',
  getOpsxCodeReviewCommandTemplate: '4760bd30a37ebbd70bf1d15c02d5427ce2c4f60f62a529f81ec9711b902d27f2',
  getOpsxVerifyCommandTemplate: 'c468e2841df71642d27d22fd00e5a13ada8f4172187b52a02aa4f511173eb96a',
  getOpsxProposeSkillTemplate: 'ab134b5d655e505a2a9d394dacc93d68f3d86498faa729a26976a1a9ee0d744c',
  getOpsxProposeCommandTemplate: 'd5c6ff504c116f8996c6b6f419204b08b68a7340040b4b21172ba82c07fc895e',
  getFeedbackSkillTemplate: '087c098185bfc7067fc89fab113ce7cf0df6b5c41138f4f869389f2e2daf0118',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '5f0b206597f3ebc0383994d986bf11ebefa41fde8e7d6e495229e1d0b5b0a7f1',
  'openspec-new-change': '845ccd271be19e750a9136f936fe5dc2def978717b7aba0eec3dad7620b587f4',
  'openspec-continue-change': '2bd68c767a9c2d9aac635d2e4cadead54bda77260ab7bcdb989b166194ca82cd',
  'openspec-apply-change': 'aa62cff433b4cbe61d66d88f920c8ffc4b5cd8fc93a976249fa9ce1756f171e9',
  'openspec-update-change': '39f92870dcf9a390918790e863aa96ca0e78cedb82e9cb64bd46318b52532f94',
  'openspec-ff-change': '8b1e89ad87f3790b113560b9e4804ac3afaff0c1f8ada281d496a5cf19ea5db5',
  'openspec-sync-specs': 'f436445acb6c33dd06acc015fe32ff17aad2c10b9f564e365e6590409e83511a',
  'openspec-archive-change': '034cfbd29a829981eb4e9d1c60b824c41126d5b433fb65c34b0ef565184e1d6e',
  'openspec-bulk-archive-change': 'a67054288d3eab09f8148c36beaa8a7df78a29bc5278716d374fea0ee427f380',
  'openspec-verify-change': 'dfa3c432c21d89013b2d51ae9cccfa344eea9754ab694d70bd4f7d72ef469ecf',
  'openspec-code-review': '10c2990eb29c650603bd000805a181fe2dcc1faf3395d081d22c4e0c5f7c2f24',
  'openspec-onboard': 'd70cf46974ad2667689d95af98bb112665d94358e2ea1a91a97402ea1d456f86',
  'openspec-propose': 'fef44e1f201f49414baf4f851189008391324ef14219f91f51b1cb89195ba980',
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
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-update-change', getUpdateChangeSkillTemplate],
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

  // Auto-approve the OpenSpec CLI: every generated skill carries
  // `allowed-tools: Bash(openspec:*)` so agents that honor it stop prompting
  // on each `openspec` call. Iterating the registry covers new skills too.
  it('pre-approves the openspec CLI via allowed-tools in every deployed skill', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain('allowed-tools: Bash(openspec:*)');
    }
  });
});

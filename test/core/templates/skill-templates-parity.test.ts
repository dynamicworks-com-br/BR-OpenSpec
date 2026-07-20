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
  getApplyChangeSkillTemplate: '3a836eb4deafdfb7507553195279ea8c3623dcc300e748472b8b8523c69ca436',
  getUpdateChangeSkillTemplate: '6da296108c94a37b253c107f120113e87abce7eb34cd9dfe9d6320c6bcfdc77d',
  getFfChangeSkillTemplate: 'a0153a45ec305ad03977bfb791d7c1925a97b8a17a5afb7dbc1210ad64164b50',
  getSyncSpecsSkillTemplate: '5b71909c0524072b4dc004de3120d01b38a61f06c562e2954ec5eda412dddf38',
  getOnboardSkillTemplate: '6fa40befab7da32020a2c04379a0c08f31d97421e0fe02ca3950dff1e01d1c18',
  getOpsxExploreCommandTemplate: 'f8c9d7546429ed530dfdf03bf606fed9225bd89eae08a5982a41ce26591da1d3',
  getOpsxNewCommandTemplate: '8000acbdc49d16a870ec3a148b25ecc0cc4a14b8f7e2ea5e3d83bf25111bb0ab',
  getOpsxContinueCommandTemplate: 'ff61a5a4f3d051c02d5dbc07ec1233c4f0f6a784cf981b95b8a951af08af4675',
  getOpsxApplyCommandTemplate: '836b6cd5fbca346eeadce7171ab7c843a88179ad4579bb30bf68663e92736fab',
  getOpsxUpdateCommandTemplate: '08a14b59bb34caab5ed7750b0ddb793b9421480e3628c98ee74f3365cb59002e',
  getOpsxFfCommandTemplate: '5b7ade643acfa49e4b7e76fb93534491f39ee1e39fb0439a390e5379af34be6d',
  getArchiveChangeSkillTemplate: 'c73dd47fe80211f9cfeb60a9c94d662b06d8665964468461cf7372852b6d5c0e',
  getBulkArchiveChangeSkillTemplate: '56a38548dc5eb203944aa8c9d5eb00490e9ce09f94d337f1f82446c760dbdd2b',
  getCodeReviewSkillTemplate: '53cadf1f52914d26c021b2e9cc10bdc535c02c5ecafe0d846928bd37b1db81ea',
  getOpsxSyncCommandTemplate: '364ebd08bc6050b8b31139e7a32b3b12ccb46bab8c54e2accb67c8228f7b5dc6',
  getVerifyChangeSkillTemplate: '2d81da934601c6e8b9c818b35971660593c86316dc85ec7e21c2c3183b834ba3',
  getOpsxArchiveCommandTemplate: '2d0e7b7f3bdb60e428652c46ca39c589b321024e85abc33abf92d35218321a0b',
  getOpsxOnboardCommandTemplate: 'ec32e36ac28c7a3c440d812a873c72860809e740b5d1f0e1eee4b0669be6db93',
  getOpsxBulkArchiveCommandTemplate: '32c34b320e60533dc7f598afbae9ca740f76138e0ebcd65da9a5d613f902d684',
  getOpsxCodeReviewCommandTemplate: 'd4ee579f36b34a3f09ddb5512ff14780125e66205787544ae78c8b260e9605ae',
  getOpsxVerifyCommandTemplate: '79091459dd49ce468db70dc2876a3d013ac2cc4cba86ec93832369e4dee4965d',
  getOpsxProposeSkillTemplate: '33e39ecc2078c31c7e103d6f88cbe8da0bc705f425927bf95d8ba813fc918f5a',
  getOpsxProposeCommandTemplate: 'd190d75f47a5c58e4bc9b9064f00ebe4b3f51a4024604f718cbc711c4d686c0e',
  getFeedbackSkillTemplate: '087c098185bfc7067fc89fab113ce7cf0df6b5c41138f4f869389f2e2daf0118',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '87c35ac17dff2fc7a2df49055c2324a4cd136c29243d913c3bef8d3772d280a1',
  'openspec-new-change': 'c917175a7b8f11c7c0b7cc5ecee9389410f82d493f2b3349e26cc4dbaed8524d',
  'openspec-continue-change': 'd47e63b0c0126f6d8f3efc4f91032c9401aa05ced40bc8acaa4037f5a5fcb8d0',
  'openspec-apply-change': 'f1efd6170287ab57a323ae6b9590d4bf74b0cf932b4d3c583d787458938c30f7',
  'openspec-update-change': '44f9dabea39ccfa2f786be230c2c750f613247ca245be34702b84bfb2cd0d9d0',
  'openspec-ff-change': '64dd8ade2fa9c848f326de98e8d0d2cc291c6d69e7663d15c74116af54e9e19a',
  'openspec-sync-specs': '1c47cd25255065aa58d5b8e30f339b6a87d5d6a7bb2fec99123d5d5bef810c9e',
  'openspec-archive-change': 'bf54fb7341936e6742a9aafb3b7819736fb1dda779d419c3dbbe04bd8fd5764a',
  'openspec-bulk-archive-change': '4a62f82195ce7ae603c15dc7161efb8449b884494fff85140f3435cc10c0ce14',
  'openspec-verify-change': '7754b1eae87f47485e95d58c55dd977f0932281c6f0e70eabe9acc503f6e5ab8',
  'openspec-code-review': 'f1db9f85d11e9d66c6df2778a79540c97bb74ee4b41b111ff188f3f2d1836a65',
  'openspec-onboard': 'a083102a3410492ce54d442653999ef547733847eb11d17209bdd021145aec21',
  'openspec-propose': 'f9328d84b61f508ac8940bcf20bab76921a7871f9197757372498c8d941a3b5b',
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
});

import { describe, expect, it } from 'vitest';

import {
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getUpdateChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { getCommandTemplates, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

describe('workflow list --json field usage', () => {
  it('does not invent schema labels in update and continue pickers', () => {
    const bodies = [
      getUpdateChangeSkillTemplate().instructions,
      getOpsxUpdateCommandTemplate().content,
      getContinueChangeSkillTemplate().instructions,
      getOpsxContinueCommandTemplate().content,
    ];

    for (const body of bodies) {
      const picker = body.slice(body.indexOf('1. **Selecione a change**'), body.indexOf('2. **'));
      expect(picker).toContain('openspec list --json');
      expect(picker).toContain('- Nome da change');
      expect(picker).toContain('- Status');
      expect(picker).toContain('`lastModified`');
      expect(picker).not.toMatch(/schema/i);
      expect(picker).not.toContain('openspec status');

      const status = body.slice(body.indexOf('2. **'), body.indexOf('3. **'));
      expect(status).toContain('openspec status --change "<nome>" --json');
      expect(status).toContain('`schemaName`');
    }
  });

  it('limits bulk archive selection to list fields', () => {
    const bodies = [
      getBulkArchiveChangeSkillTemplate().instructions,
      getOpsxBulkArchiveCommandTemplate().content,
    ];

    for (const body of bodies) {
      const picker = body.slice(body.indexOf('2. **'), body.indexOf('3. **'));
      expect(picker).toContain('Mostre cada nome de change e o status das tarefas da saída da lista');
      expect(picker).not.toMatch(/schema/i);
      expect(picker).not.toContain('openspec status');

      const status = body.slice(body.indexOf('3. **'), body.indexOf('4. **'));
      expect(status).toContain('openspec status --change "<nome>" --json');
      expect(status).toContain('`schemaName`');
    }
  });

  it('does not claim explore receives schemas from list output', () => {
    const bodies = [
      getExploreSkillTemplate().instructions,
      getOpsxExploreCommandTemplate().content,
    ];

    for (const body of bodies) {
      expect(body).toContain('Seus nomes e status das tarefas');
      expect(body).not.toContain('Their names, schemas, and status');
    }
  });

  it('keeps bulk archive sync available with and without the sync workflow', () => {
    const variants = [
      [
        getSkillTemplates(['bulk-archive', 'sync']).find((entry) => entry.workflowId === 'bulk-archive')!.template.instructions,
        getSkillTemplates(['bulk-archive'])[0].template.instructions,
        'openspec-sync-specs',
      ],
      [
        getCommandTemplates(['bulk-archive', 'sync']).find((entry) => entry.id === 'bulk-archive')!.template.content,
        getCommandTemplates(['bulk-archive'])[0].template.content,
        '/opsx:sync',
      ],
    ] as const;

    for (const [withSync, withoutSync, workflow] of variants) {
      const syncStep = (text: string) => text.slice(
        text.indexOf('a. **Sincronize os delta specs incluídos**'),
        text.indexOf('b. **Verifique os delta specs incluídos')
      );

      expect(syncStep(withSync)).toContain(workflow);
      expect(syncStep(withoutSync)).not.toContain(workflow);
      expect(syncStep(withoutSync)).toContain('faça você mesmo a mesclagem do delta para o spec principal inline');
      expect(syncStep(withoutSync)).toContain('`includedDeltas`');
      expect(syncStep(withoutSync)).toContain('`excludedDeltas`');
      expect(withoutSync).toContain('Se sync for solicitado, faça a mesclagem do delta para o spec principal inline');
    }
  });

  it('keeps archive sync available with and without the sync workflow', () => {
    const variants = [
      [
        getSkillTemplates(['archive', 'sync']).find((entry) => entry.workflowId === 'archive')!.template.instructions,
        getSkillTemplates(['archive'])[0].template.instructions,
        'openspec-sync-specs',
      ],
      [
        getCommandTemplates(['archive', 'sync']).find((entry) => entry.id === 'archive')!.template.content,
        getCommandTemplates(['archive'])[0].template.content,
        '/opsx:sync',
      ],
    ] as const;

    for (const [withSync, withoutSync, workflow] of variants) {
      const syncStep = (text: string) => text.slice(
        text.indexOf('4. **Avalie o estado de sincronização dos delta specs**'),
        text.indexOf('5. **Realize o arquivamento**')
      );

      expect(syncStep(withSync)).toContain(workflow);
      expect(withoutSync).not.toContain(workflow);
      expect(syncStep(withoutSync)).toContain('faça você mesmo a mesclagem do delta para o spec principal inline');
      expect(withoutSync).toContain('Se sync for solicitado, faça a mesclagem do delta para o spec principal inline');
    }
  });
});

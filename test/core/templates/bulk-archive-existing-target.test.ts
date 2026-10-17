import { describe, expect, it } from 'vitest';

import {
  getBulkArchiveChangeSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getBulkArchiveChangeSkillTemplate();
const command = getOpsxBulkArchiveCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function archiveStep(body: string, label: string): string {
  const start = body.indexOf('   c. **Realize o arquivamento**:');
  const end = body.indexOf('   d. **Rastreie o resultado** para cada change:');

  expect(start, label).toBeGreaterThanOrEqual(0);
  expect(end, label).toBeGreaterThan(start);

  return body.slice(start, end);
}

describe('bulk archive existing-target handling', () => {
  // Regression for #1827: step 8c ran `mv` with no existence check. POSIX
  // `mv` moves changeRoot *inside* an existing target directory and exits 0,
  // so a same-day name collision produced
  // archive/<target>/<target>/ and was recorded as a successful archive.
  it('checks the archive target before moving changeRoot (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);

      expect(step, label).toContain('**Verifique se o destino já existe:**');
      expect(step, label).toContain('O diretório de arquivo já existe');
      expect(step, label).toContain('deixe `changeRoot` onde está');
      expect(step, label).toContain('continue com as changes restantes');
    }
  });

  it('orders the existence check between the target name and the move (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);
      const targetName = step.indexOf('Nome de destino: use o `<target-name>` registrado');
      const existenceCheck = step.indexOf('**Verifique se o destino já existe:**');
      const move = step.indexOf('mv "<changeRoot>"');

      expect(targetName, label).toBeGreaterThanOrEqual(0);
      expect(existenceCheck, label).toBeGreaterThan(targetName);
      expect(move, label).toBeGreaterThan(existenceCheck);
    }
  });

  // `openspec archive` settles the destination before touching any spec. A
  // collision found only at the move would leave main specs rewritten for a
  // change that stays active, so the batch must check every target first.
  it('checks every archive target before the first main-spec write (#1827)', () => {
    for (const [label, body] of bodies) {
      const preflight = body.indexOf('   d. **Destino do arquivo**');
      const conflicts = body.indexOf('4. **Detecte conflitos de specs**');
      const firstSync = body.indexOf('   a. **Sincronize os delta specs incluídos**');

      expect(preflight, label).toBeGreaterThanOrEqual(0);
      expect(conflicts, label).toBeGreaterThan(preflight);
      expect(firstSync, label).toBeGreaterThan(preflight);

      const step = body.slice(preflight, conflicts);
      expect(step, label).toContain('outra change selecionada resolver para o mesmo nome de destino');
      expect(step, label).toContain('Uma change bloqueada nunca é sincronizada nem movida');
      expect(body, label).toContain(
        'A opção de arquivar tudo — prossiga com todas as changes selecionadas que não estejam `Bloqueado`'
      );
      expect(body, label).toContain(
        'Verifique todo destino de arquivo no passo 3, antes da primeira escrita de spec principal'
      );
    }
  });

  // The dated name must be computed once. Recomputing it at the move lets a
  // batch that crosses midnight check yesterday's target in step 3, sync main
  // specs, then collide at today's target with the change still active.
  it('reuses the target name recorded in step 3 for the move (#1827)', () => {
    for (const [label, body] of bodies) {
      const preflight = body.slice(
        body.indexOf('   d. **Destino do arquivo**'),
        body.indexOf('4. **Detecte conflitos de specs**')
      );
      const step = archiveStep(body, label);

      expect(preflight, label).toContain('registre-o como o `<target-name>` daquela change');
      expect(preflight, label).toContain('prefixe a data atual');
      expect(step, label).toContain(
        'Nome de destino: use o `<target-name>` registrado para esta change no passo 3d, sem alteração'
      );
      expect(step, label).not.toContain('prefixe a data atual');
      expect(body, label).toContain('calculada uma vez no passo 3d e reutilizada na movimentação');
    }
  });

  // The last check and the `mv` are separate steps, so a target created in
  // between still nests the change with exit 0. The workflow must detect the
  // nesting after the move and undo it instead of reporting success.
  it('detects and undoes a move that nested inside a late target (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);
      const move = step.indexOf('mv "<changeRoot>"');
      const confirm = step.indexOf('**Confirme que a movimentação não aninhou:**');

      expect(move, label).toBeGreaterThanOrEqual(0);
      expect(confirm, label).toBeGreaterThan(move);
      expect(step.slice(confirm), label).toContain(
        'mova esse diretório de volta para `changeRoot` e registre esta change como Falha'
      );
    }
  });

  // A collision is a failure in every confirmation path, including ready-only,
  // which otherwise records everything not Ready as Skipped.
  it('keeps blocked changes Failed under the ready-only option (#1827)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'exceto changes `Bloqueado`, que permanecem Falha com `O diretório de arquivo já existe`'
      );
    }
  });

  // The guardrail and both failure output templates already promised this
  // outcome while the steps never produced it; keep them in agreement.
  it('keeps the guardrail and failure output consistent with the step (#1827)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'Se o destino do arquivo existir, falhe aquela change mas continue com as outras'
      );
      expect(body, label).toContain('O diretório de arquivo já existe');
    }
  });
});

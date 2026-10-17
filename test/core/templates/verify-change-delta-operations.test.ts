import { describe, expect, it } from 'vitest';

import {
  getVerifyChangeSkillTemplate,
  getOpsxVerifyCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

// #1959: verify treated every "### Requirement:" in a change's delta specs as
// behavior that must exist, whichever section it sat under. A REMOVED
// requirement that was removed correctly came back as CRITICAL "Requirement not
// found" with the recommendation to implement it, so an agent following the
// report restored what the change had just deleted.
// The committed skills/ tree is regenerated later (`pnpm generate:skills`).
// Assert the templates that generation reads, not the stale SKILL.md.
const bodies: Array<[string, string]> = [
  ['skill', getVerifyChangeSkillTemplate().instructions],
  ['command', getOpsxVerifyCommandTemplate().content],
];

function section(body: string, start: string, end: string, label: string): string {
  const from = body.indexOf(start);
  const to = body.indexOf(end, from + start.length);
  expect(from, `${label}: "${start}" not found`).toBeGreaterThanOrEqual(0);
  expect(to, `${label}: "${end}" not found after "${start}"`).toBeGreaterThan(from);
  return body.slice(from, to);
}

describe('verify checks each requirement by its delta operation', () => {
  it.each(bodies)('%s: classifies requirements by delta section before checking them', (label, body) => {
    const coverage = section(body, '**Cobertura de Specs**', '6. **Verifique Correctness**', label);

    // RENAMED entries carry no "### Requirement:" heading, so a rename-only
    // delta must not read as empty.
    expect(coverage, label).toContain('ou listados como pares `FROM:`/`TO:` sob `## RENAMED Requirements`');
    for (const header of ['## ADDED', '## MODIFIED', '## REMOVED', '## RENAMED Requirements']) {
      expect(coverage, label).toContain(header);
    }
    // The unscoped loop is what produced the bug.
    expect(coverage, label).not.toMatch(/^\s*- For each requirement:$/m);
    expect(coverage, label).not.toMatch(/^\s*- Para cada requisito:$/m);
  });

  it.each(bodies)('%s: reports a missing requirement only for ADDED or MODIFIED', (label, body) => {
    const coverage = section(body, '**Cobertura de Specs**', '6. **Verifique Correctness**', label);
    const addedOrModified = section(coverage, '- Para cada requisito ADDED ou MODIFIED', '- Para cada requisito REMOVED', label);

    expect(addedOrModified, label).toContain('Adicione issue CRITICAL: "Requirement not found: <nome do requisito>"');
  });

  it.each(bodies)('%s: inverts the check for a REMOVED requirement', (label, body) => {
    const coverage = section(body, '**Cobertura de Specs**', '6. **Verifique Correctness**', label);
    const removed = section(coverage, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    expect(removed, label).toContain('Não encontrar implementação é o resultado esperado, mas só depois que o comportamento do baseline foi o que você buscou.');
    expect(removed, label).toContain('Nunca reporte um requisito REMOVED como "Requirement not found"');
    expect(removed, label).toContain('Adicione issue CRITICAL: "Removed requirement still implemented: <nome do requisito>"');
    expect(removed, label).not.toContain('Recomendação: "Implement');
    expect(removed, label).not.toContain('Recommendation: "Implement');
  });

  it.each(bodies)('%s: does not report the old name of a RENAMED requirement as missing', (label, body) => {
    const renamed = section(body, '- Para cada entrada RENAMED', '6. **Verifique Correctness**', label);

    expect(renamed, label).toContain('Não reporte o nome FROM como ausente');
    expect(renamed, label).toContain('não exija que símbolos de código, identificadores ou nomes de arquivo sejam renomeados');
  });

  // A rename keeps behavior, so a rename-only change must still prove the
  // behavior exists before verify can call it ready. Its evidence is the
  // baseline requirement in the main spec, not the RENAMED entry itself.
  it.each(bodies)('%s: verifies the unchanged behavior of a RENAMED requirement against its baseline', (label, body) => {
    const renamed = section(body, '- Para cada entrada RENAMED', '6. **Verifique Correctness**', label);

    expect(renamed, label).toContain('verifique o requisito TO por esse comportamento inalterado');
    expect(renamed, label).toContain('`openspec/specs/<capability-path>/spec.md`');
    expect(renamed, label).not.toContain('planningHome');
    expect(renamed, label).toContain('o requisito sob o nome FROM, ou sob o nome TO somente quando o nome FROM estiver ausente porque o spec principal já está sincronizado.');
    expect(renamed, label).toContain('O corpo e os cenários dele são a evidência do comportamento que o requisito TO mantém.');
    expect(renamed, label).toContain('Procure no codebase por aquele comportamento e avalie se ele ainda está implementado.');
    expect(renamed, label).toContain('Adicione issue CRITICAL: "Renamed requirement not found: <nome TO>"');
    expect(body, label).toContain('- Requisitos renomeados cujo comportamento não está mais implementado');
    expect(renamed, label).toContain('Se o nome TO também aparecer sob MODIFIED, o comportamento dele é verificado lá');
  });

  it.each(bodies)('%s: never counts an unchecked rename as passing', (label, body) => {
    const renamed = section(body, '- Para cada entrada RENAMED', '6. **Verifique Correctness**', label);

    expect(renamed, label).toContain('Se o requisito de baseline não puder ser encontrado ou lido, marque **Spec Coverage** como not verified para essa entrada');
    expect(renamed, label).toContain('Nunca conte um rename não verificado como aprovado.');
    expect(body, label).toContain('cada entrada REMOVED e RENAMED com baseline utilizável é verificada lá contra o comportamento do baseline');
  });

  it.each(bodies)('%s: maps implementation and scenarios only for ADDED or MODIFIED requirements', (label, body) => {
    const correctness = section(body, '6. **Verifique Correctness**', '7. **Verifique Coherence**', label);

    expect(correctness, label).toContain('- Para cada requisito ADDED ou MODIFIED dos delta specs');
    expect(correctness, label).toContain('- Para cada cenário sob um requisito ADDED ou MODIFIED nos delta specs');
    expect(correctness, label).toContain('Pule cenários sob um requisito REMOVED');
    expect(correctness, label).not.toContain('- For each requirement from delta specs:');
    expect(correctness, label).not.toContain('- Para cada requisito dos delta specs:');
    expect(correctness, label).not.toContain('- For each scenario in delta specs');
    expect(correctness, label).not.toContain('- Para cada cenário nos delta specs');
  });
  // With #1732's "Not verified" rule, a change with nothing to add or modify
  // left both correctness checks empty, which read as unverified and withheld
  // readiness. That is the exact case #1959 reports.
  it.each(bodies)('%s: treats the correctness checks of a removal-only change as not applicable', (label, body) => {
    const correctness = section(body, '6. **Verifique Correctness**', '**Mapeamento de Implementação de Requisitos**:', label);

    expect(correctness, label).toContain('Se os delta specs forem legíveis e contiverem pelo menos um requisito REMOVED ou RENAMED, mas nenhum ADDED ou MODIFIED');
    // An empty or unparseable delta must not pass as a removal-only change.
    expect(correctness, label).toContain('Um delta spec sem nenhum requisito analisável é evidência inutilizável, não uma change só de remoção: marque essas verificações como not verified.');
    expect(correctness, label).toContain('reporte **Requirement Implementation Mapping** e **Scenario Coverage** como **Not applicable**');
    expect(correctness, label).toContain('não marque essas duas verificações como not verified');
    expect(body, label).toContain('As verificações de correctness de uma change cujos delta specs legíveis contêm requisitos REMOVED ou RENAMED, mas nenhum ADDED ou MODIFIED, também são **Not applicable** (veja o passo 6).');
  });

  it.each(bodies)('%s: does not treat artifacts or replacement code as the removed behavior', (label, body) => {
    const removed = section(body, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    expect(removed, label).toContain('Matches em artifacts ou docs de `openspec/`, ou em código que serve apenas à nota de Migration ou a um requisito ADDED, não são evidência por si só.');
    expect(removed, label).toContain('Reporte qualquer caminho de código que ainda entregue o comportamento removido, inclusive um compartilhado com um requisito ADDED.');
  });

  // #2067: the REMOVED branch said only "search codebase for the removed
  // behavior". A REMOVED block carries just the requirement name plus Reason
  // and Migration notes, so the search started from the heading alone - and
  // because an absent match is the passing result here, an implementation
  // written in different vocabulary read as a clean removal. The RENAMED
  // branch beside it already loaded the baseline from the main spec first.
  it.each(bodies)('%s: reads the removed requirement baseline before searching', (label, body) => {
    const removed = section(body, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    expect(removed, label).toContain('Um bloco REMOVED carrega apenas o nome do requisito e quaisquer notas `**Reason**`/`**Migration**`');
    expect(removed, label).toContain('`openspec/specs/<capability-path>/spec.md`');
    expect(removed, label).not.toContain('planningHome');
    expect(removed, label).toContain('O corpo e os cenários dele são a evidência do comportamento que deve ter sumido');
    expect(removed, label).toContain('nunca busque apenas a partir do nome do requisito');
    // A literal title lookup misses a differently-worded baseline and gets
    // misread as "the sync already removed it".
    expect(removed, label).toContain('Case pelo nome normalizado');
  });

  // The baseline read, the history fallback and the search have to stay in
  // that order. Each index is checked present first: an unguarded indexOf
  // returns -1, and -1 is less than everything, so a reworded sentence would
  // satisfy a bare ordering comparison and silently retire this guard.
  it.each(bodies)('%s: orders the baseline read, then the fallback, then the search', (label, body) => {
    const removed = section(body, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    const baselineAt = removed.indexOf('Antes de buscar, leia o requisito de baseline');
    const fallbackAt = removed.indexOf('recupere o baseline do histórico do mesmo arquivo');
    const bailOutAt = removed.indexOf('marque **Spec Coverage** como not verified para essa entrada');
    const searchAt = removed.indexOf('Procure no codebase por aquele comportamento.');

    expect(baselineAt, `${label}: baseline-read sentence missing`).toBeGreaterThanOrEqual(0);
    expect(fallbackAt, `${label}: history fallback missing`).toBeGreaterThanOrEqual(0);
    expect(bailOutAt, `${label}: not-verified bail-out missing`).toBeGreaterThanOrEqual(0);
    expect(searchAt, `${label}: search step missing`).toBeGreaterThanOrEqual(0);

    // The main spec is the primary source; history is only its fallback.
    expect(baselineAt, `${label}: fallback must follow the primary read`).toBeLessThan(fallbackAt);
    // Bailing out must be reachable before the search, not two bullets after
    // the rule that says finding nothing is expected.
    expect(bailOutAt, `${label}: bail-out must precede the search`).toBeLessThan(searchAt);
  });

  // The git example is the one piece of the fallback an agent runs verbatim.
  // `git log` treats an unmatched pathspec as success and prints nothing, so a
  // path missing the `openspec/specs/` prefix reads as "no baseline in
  // history" and sends every post-sync removal to the not-verified branch.
  it.each(bodies)('%s: gives a runnable, store-aware history command', (label, body) => {
    const removed = section(body, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    // This fork has no planning home or `--store`. History is read from the
    // project checkout, with the `openspec/specs/` prefix the pathspec needs.
    expect(removed, label).toContain('git log -p -- openspec/specs/<capability-path>/spec.md');
    expect(removed, label).toContain('git show <commit>^:./openspec/specs/<capability-path>/spec.md');
    expect(removed, label).not.toMatch(/show <commit>\^:openspec\//);
    expect(removed, label).not.toContain('planningHome');
    expect(removed, label).not.toContain('--store');
    expect(removed, label).toContain('Saída vazia significa que o pathspec não casou nada');
    // A bare `<capability-path>/spec.md` pathspec matches nothing: the
    // placeholder is defined relative to `specs/`.
    expect(removed, label).not.toMatch(/git[^`\n]*log[^`\n]*--\s+<capability-path>/);
  });

  it.each(bodies)('%s: never counts an unsearched removal as passing', (label, body) => {
    const removed = section(body, '- Para cada requisito REMOVED', '- Para cada entrada RENAMED', label);

    expect(removed, label).toContain('marque **Spec Coverage** como not verified para essa entrada com a razão e pare aí');
    expect(removed, label).toContain('não busque, e nunca conte uma remoção não buscada como aprovada');
    // A baseline that only restates its title gives no more vocabulary than
    // the heading did, which is the #2067 failure mode in miniature.
    expect(removed, label).toContain('Um baseline que não acrescenta nada ao próprio título');
    expect(removed, label).toContain('é evidência inutilizável, o mesmo que um baseline ausente');
    // Reworded re-introductions must fail too, not just the exact old
    // sentence: the bug was searching from the name, however it is phrased.
    expect(removed, label).not.toMatch(/Search\b[^.\n]*\bfor the removed behavior/i);
    expect(removed, label).not.toMatch(/busque[^.\n]*pelo comportamento removido/i);
    expect(removed, label).not.toMatch(/Finding no implementation is the expected result[.;]/);
    expect(removed, label).not.toMatch(/Não encontrar implementação é o resultado esperado[.;]/);
  });

  // Step 6 asserts that Spec Coverage carries the evidence for a removal-only
  // change. That claim has to leave room for the entry the branch above marks
  // not verified, or it reads as licence to drop the mark.
  it.each(bodies)('%s: does not claim a baseline check that may not have happened', (label, body) => {
    expect(body, label).toContain('cada entrada REMOVED e RENAMED com baseline utilizável é verificada lá contra o comportamento do baseline');
    expect(body, label).toContain('uma entrada já marcada not verified lá permanece not verified');
    // The scorecard must model the not-verified wording, not only the
    // confirming kind.
    expect(body, label).toContain('"1 removal not verified (baseline unavailable)"');
  });

  it.each(bodies)('%s: counts removals separately from covered requirements', (label, body) => {
    expect(body, label).toContain('Conte apenas requisitos ADDED e MODIFIED em N, e reporte requisitos REMOVED e RENAMED separadamente');
    expect(body, label).toContain('a célula de Correctness fica `Not applicable (no ADDED or MODIFIED requirements)`');
  });
});

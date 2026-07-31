/**
 * Spec Application Logic
 *
 * Extracted from ArchiveCommand to enable standalone spec application.
 * Applies delta specs from a change to main specs without archiving.
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  foldRequirementName,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
} from './parsers/requirement-blocks.js';
import { findMainSpecStructureIssues } from './parsers/spec-structure.js';
import { buildCodeFenceMask } from './parsers/code-fence.js';
import { MarkdownParser } from './parsers/markdown-parser.js';
import { MIN_PURPOSE_LENGTH } from './validation/constants.js';
import { discoverSpecFiles } from '../utils/spec-discovery.js';
import { SPECS_APPLY_MESSAGES } from '../messages/index.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SpecUpdate {
  /** Capability id relative to the specs root, forward-slash separated (e.g. "web" or "platform/session-layout"). */
  id: string;
  source: string;
  target: string;
  exists: boolean;
}

interface ScenarioBlock {
  name: string;
  raw: string;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Find all delta spec files that need to be applied from a change.
 */
export async function findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]> {
  const updates: SpecUpdate[] = [];
  const changeSpecsDir = path.join(changeDir, 'specs');

  // Discover delta specs recursively so nested layouts like
  // specs/<area>/<capability>/spec.md merge into the same relative path
  // under the main specs directory (#1353)
  const discovered = await discoverSpecFiles(changeSpecsDir);

  for (const { id, specFile } of discovered) {
    const targetFile = path.join(mainSpecsDir, ...id.split('/'), 'spec.md');

    // Check if target exists
    let exists = false;
    try {
      await fs.access(targetFile);
      exists = true;
    } catch {
      exists = false;
    }

    updates.push({
      id,
      source: specFile,
      target: targetFile,
      exists,
    });
  }

  return updates;
}

/**
 * Build an updated spec by applying delta operations.
 * Returns the rebuilt content and counts of operations.
 */
export async function buildUpdatedSpec(
  update: SpecUpdate,
  changeName: string,
  options: { silent?: boolean } = {}
): Promise<{
  rebuilt: string;
  counts: { added: number; modified: number; removed: number; renamed: number };
  warnings: string[];
}> {
  // Coletados para que chamadores silent (JSON) possam exibi-los; impressos ao
  // vivo para chamadores humanos no ponto em que ocorrem.
  const warnings: string[] = [];
  const warn = (message: string): void => {
    warnings.push(message);
    if (!options.silent) {
      console.log(chalk.yellow(SPECS_APPLY_MESSAGES.warning(message)));
    }
  };
  // Read change spec content (delta-format expected)
  const changeContent = await fs.readFile(update.source, 'utf-8');

  // Parse deltas from the change spec file
  const plan = parseDeltaSpec(changeContent);
  const specName = update.id;

  // Pre-validate duplicates within sections
  const addedNames = new Set<string>();
  for (const add of plan.added) {
    const name = normalizeRequirementName(add.name);
    if (addedNames.has(name)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.duplicateInSection(specName, 'ADDED', add.name)
      );
    }
    addedNames.add(name);
  }
  const modifiedNames = new Set<string>();
  for (const mod of plan.modified) {
    const name = normalizeRequirementName(mod.name);
    if (modifiedNames.has(name)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.duplicateInSection(specName, 'MODIFIED', mod.name)
      );
    }
    modifiedNames.add(name);
  }
  const removedNamesSet = new Set<string>();
  for (const rem of plan.removed) {
    const name = normalizeRequirementName(rem);
    if (removedNamesSet.has(name)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.duplicateInSection(specName, 'REMOVED', rem)
      );
    }
    removedNamesSet.add(name);
  }
  const renamedFromSet = new Set<string>();
  const renamedToSet = new Set<string>();
  for (const { from, to } of plan.renamed) {
    const fromNorm = normalizeRequirementName(from);
    const toNorm = normalizeRequirementName(to);
    if (renamedFromSet.has(fromNorm)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.duplicateFromInRenamed(specName, from)
      );
    }
    if (renamedToSet.has(toNorm)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.duplicateToInRenamed(specName, to)
      );
    }
    renamedFromSet.add(fromNorm);
    renamedToSet.add(toNorm);
  }

  // Pre-validate cross-section conflicts
  const conflicts: Array<{ name: string; a: string; b: string }> = [];
  for (const n of modifiedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
    if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
  }
  for (const n of addedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'ADDED', b: 'REMOVED' });
  }
  // Renamed interplay: MODIFIED must reference the NEW header, not FROM
  for (const { from, to } of plan.renamed) {
    const fromNorm = normalizeRequirementName(from);
    const toNorm = normalizeRequirementName(to);
    // Um REMOVED nomeando o lado FROM contradiz o rename. Isso costumava
    // falhar incidentalmente na aplicação (o rename consumia o cabeçalho
    // antigo, então o REMOVED caía em "não encontrado"); agora que um alvo
    // REMOVED ausente é no-op, o conflito precisa ser rejeitado
    // explicitamente. Comparado com fold, para que uma variante de
    // caixa/espaços não escape do guarda e degrade para um no-op avisado.
    const removedFoldMatch = [...removedNamesSet].find(
      (r) => foldRequirementName(r) === foldRequirementName(fromNorm)
    );
    if (removedFoldMatch !== undefined) {
      throw new Error(
        SPECS_APPLY_MESSAGES.renamedRemovedConflict(
          specName,
          from,
          removedFoldMatch === fromNorm ? undefined : removedFoldMatch
        )
      );
    }
    if (modifiedNames.has(fromNorm)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.renamedModifiedMustReferenceNew(specName, to)
      );
    }
    // Detect ADDED colliding with a RENAMED TO
    if (addedNames.has(toNorm)) {
      throw new Error(
        SPECS_APPLY_MESSAGES.renamedToCollidesWithAdded(specName, to)
      );
    }
  }
  if (conflicts.length > 0) {
    const c = conflicts[0];
    throw new Error(
      SPECS_APPLY_MESSAGES.requirementInMultipleSections(specName, c.a, c.b, c.name)
    );
  }
  const hasAnyDelta = plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length > 0;
  if (!hasAnyDelta) {
    throw new Error(
      SPECS_APPLY_MESSAGES.noDeltaOperations(update.id)
    );
  }

  // Load or create base target content
  const deltaPurpose = extractPurposeSection(changeContent);
  let targetContent: string;
  let isNewSpec = false;
  try {
    targetContent = await fs.readFile(update.target, 'utf-8');
    // Um Purpose do delta só semeia um spec que ainda não existe. Diga isso em
    // vez de descartá-lo silenciosamente - a instrução de specs pede um para
    // capabilities novas, e o arquivo de delta parece idêntico nos dois casos.
    // Somente quando o spec realmente tem um Purpose diferente: dizer que ele
    // "já possui um" seria falso quando não tem nenhum, e dizer qualquer coisa
    // é ruído quando os dois corpos são iguais.
    if (deltaPurpose) {
      const existingPurpose = extractPurposeSection(targetContent);
      if (existingPurpose && existingPurpose !== deltaPurpose) {
        warn(SPECS_APPLY_MESSAGES.deltaPurposeIgnoredExisting(specName, update.target));
      }
    }
  } catch {
    // Target spec does not exist; MODIFIED and RENAMED are not allowed for new specs
    // REMOVED will be ignored with a warning since there's nothing to remove
    if (plan.modified.length > 0 || plan.renamed.length > 0) {
      throw new Error(
        SPECS_APPLY_MESSAGES.targetSpecNotExists(specName)
      );
    }
    // Warn about REMOVED requirements being ignored for new specs
    if (plan.removed.length > 0) {
      warn(SPECS_APPLY_MESSAGES.removedRequirementsIgnoredNewSpec(specName, plan.removed.length));
    }
    isNewSpec = true;
    targetContent = buildSpecSkeleton(specName, changeName, deltaPurpose);
    const overview = deltaPurpose ? readableOverview(targetContent, specName) : null;
    if (deltaPurpose && !overview) {
      // Mantém o placeholder em vez de virar falha: esses deltas arquivavam
      // sem erro antes de existir o carregamento do Purpose.
      targetContent = buildSpecSkeleton(specName, changeName);
      warn(SPECS_APPLY_MESSAGES.deltaPurposeIgnoredUnreadable(specName));
    } else if (overview && overview.length < MIN_PURPOSE_LENGTH) {
      // O placeholder sempre passava desse limite, então um Purpose carregado é
      // a primeira forma de o archive deixar um spec que `validate --strict` falha.
      // Medido no overview parseado, que é a mesma string que o validador lê.
      warn(SPECS_APPLY_MESSAGES.carriedPurposeTooBrief(specName, MIN_PURPOSE_LENGTH));
    }
  }

  const structureIssues = findMainSpecStructureIssues(targetContent);
  if (structureIssues.length > 0) {
    const details = structureIssues
      .map(issue => `line ${issue.line}: ${issue.message}`)
      .join('\n');
    throw new Error(
      SPECS_APPLY_MESSAGES.targetSpecStructurallyInvalid(specName, details)
    );
  }

  // Extract requirements section and build name->block map
  const parts = extractRequirementsSection(targetContent);
  const nameToBlock = new Map<string, RequirementBlock>();
  for (const block of parts.bodyBlocks) {
    nameToBlock.set(normalizeRequirementName(block.name), block);
  }

  // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED
  // RENAMED
  let renamedApplied = 0;
  const renamedTargets = new Map<string, string>();
  for (const r of plan.renamed) {
    const from = normalizeRequirementName(r.from);
    const to = normalizeRequirementName(r.to);
    if (!nameToBlock.has(from)) {
      // Source gone but target present means the rename was already synced
      // to the baseline (early-sync pattern) — re-applying it is a no-op,
      // not a failure. Only a missing source AND target is a genuine error.
      if (nameToBlock.has(to)) {
        continue;
      }
      throw new Error(SPECS_APPLY_MESSAGES.renamedFailedSourceNotFound(specName, r.from));
    }
    if (nameToBlock.has(to)) {
      throw new Error(SPECS_APPLY_MESSAGES.renamedFailedTargetExists(specName, r.to));
    }
    const block = nameToBlock.get(from)!;
    const newHeader = `### Requirement: ${to}`;
    const rawLines = block.raw.split('\n');
    rawLines[0] = newHeader;
    const renamedBlock: RequirementBlock = {
      headerLine: newHeader,
      name: to,
      raw: rawLines.join('\n'),
    };
    nameToBlock.delete(from);
    nameToBlock.set(to, renamedBlock);
    renamedTargets.set(from, to);
    renamedApplied++;
  }

  // REMOVED
  let removedApplied = 0;
  for (const name of plan.removed) {
    const key = normalizeRequirementName(name);
    if (!nameToBlock.has(key)) {
      // Um requirement ausente da base significa que a remoção já foi
      // sincronizada (padrão early-sync) — reaplicá-la é no-op, não falha.
      // Um sinal separa isso de um cabeçalho digitado errado: um requirement
      // que difere só em caixa ou espaços internos ainda presente. Isso é um
      // erro de digitação, e continua sendo aborto duro.
      // Para specs novos, o pulo já foi avisado acima.
      if (!isNewSpec) {
        const nearMiss = [...nameToBlock.keys()].find((k) => foldRequirementName(k) === foldRequirementName(key));
        if (nearMiss !== undefined) {
          throw new Error(
            SPECS_APPLY_MESSAGES.removedFailedNotFoundNearMiss(specName, name, nameToBlock.get(nearMiss)!.name)
          );
        }
        warn(SPECS_APPLY_MESSAGES.removedAlreadySynced(specName, name));
      }
      continue;
    }
    nameToBlock.delete(key);
    removedApplied++;
  }

  // MODIFIED
  for (const mod of plan.modified) {
    const key = normalizeRequirementName(mod.name);
    const currentBlock = nameToBlock.get(key);
    if (!currentBlock) {
      throw new Error(SPECS_APPLY_MESSAGES.modifiedFailedNotFound(specName, mod.name));
    }
    // Replace block with provided raw (ensure header line matches key)
    const modHeaderMatch = mod.raw.split('\n')[0].match(/^###\s*Requirement:\s*(.+)\s*$/i);
    if (!modHeaderMatch || normalizeRequirementName(modHeaderMatch[1]) !== key) {
      throw new Error(
        SPECS_APPLY_MESSAGES.modifiedFailedHeaderMismatch(specName, mod.name)
      );
    }
    const missingScenarios = findMissingCurrentScenarios(currentBlock, mod);
    if (missingScenarios.length > 0) {
      throw new Error(
        SPECS_APPLY_MESSAGES.modifiedFailedMissingScenarios(specName, mod.name, missingScenarios)
      );
    }
    nameToBlock.set(key, mod);
  }

  // ADDED
  let addedApplied = 0;
  for (const add of plan.added) {
    const key = normalizeRequirementName(add.name);
    const existing = nameToBlock.get(key);
    if (existing) {
      // Identical content means the requirement was already synced to the
      // baseline (early-sync pattern) — re-applying it is a no-op, not a
      // conflict. Only differing content is a genuine collision.
      if (normalizeBlockRaw(existing.raw) === normalizeBlockRaw(add.raw)) {
        continue;
      }
      throw new Error(SPECS_APPLY_MESSAGES.addedFailedAlreadyExists(specName, add.name));
    }
    nameToBlock.set(key, add);
    addedApplied++;
  }

  // Duplicates within resulting map are implicitly prevented by key uniqueness.

  // Recompose requirements section preserving original ordering where possible
  const keptOrder: RequirementBlock[] = [];
  const seen = new Set<string>();
  for (const block of parts.bodyBlocks) {
    const key = normalizeRequirementName(block.name);
    const replacement = nameToBlock.get(key);
    if (replacement) {
      keptOrder.push(replacement);
      seen.add(key);
    }
    // O raw de um bloco corre até o próximo cabeçalho que o parser RECONHECE,
    // então uma nota sob um cabeçalho não reconhecido pode ser absorvida pelo
    // requirement. Avisa apenas quando a substituição deste mesmo bloco
    // original descarta o sufixo absorvido inteiro. RENAMED carrega o raw
    // original sob uma nova chave, e MODIFIED pode repetir o sufixo
    // deliberadamente; nenhum dos dois é perda de dados.
    const renamedTarget = renamedTargets.get(key);
    const replacementFromOriginal =
      replacement ?? (renamedTarget ? nameToBlock.get(renamedTarget) : undefined);
    if (replacementFromOriginal !== block) {
      const foreign = firstForeignTail(block.raw);
      const replacementRaw = replacementFromOriginal?.raw;
      const normalizedForeign = foreign ? normalizeBlockRaw(foreign.raw) : '';
      const keepsForeignTail =
        foreign !== undefined &&
        replacementRaw !== undefined &&
        countOccurrences(normalizeBlockRaw(replacementRaw), normalizedForeign) >=
          countOccurrences(normalizeBlockRaw(block.raw), normalizedForeign);
      if (foreign && !keepsForeignTail) {
        warn(SPECS_APPLY_MESSAGES.absorbedNoteGoesWithRequirement(specName, foreign.heading, block.name));
      }
    }
  }
  // Append any newly added that were not in original order
  for (const [key, block] of nameToBlock.entries()) {
    if (!seen.has(key)) {
      keptOrder.push(block);
    }
  }

  const reqBody = [parts.preamble && parts.preamble.trim() ? parts.preamble.trimEnd() : '']
    .filter(Boolean)
    .concat(keptOrder.map((b) => b.raw))
    .join('\n\n')
    .trimEnd();

  const rebuilt = [parts.before.trimEnd(), parts.headerLine, reqBody, parts.after]
    .filter((s, idx) => !(idx === 0 && s === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return {
    rebuilt,
    counts: {
      added: addedApplied,
      modified: plan.modified.length,
      removed: removedApplied,
      renamed: renamedApplied,
    },
    warnings,
  };
}

/**
 * O sufixo de um bloco de requirement que começa com conteúdo que o parser de
 * requirements não reconheceu como fronteira: um cabeçalho `#`, `##` ou `###`
 * depois do cabeçalho do próprio bloco.
 *
 * `####` é excluído: os cabeçalhos `#### Scenario:` de um requirement são
 * dele mesmo. Linhas cercadas são puladas, então um cabeçalho dentro de um
 * exemplo não conta.
 *
 * Aproximado de propósito, e usado apenas para AVISAR. Uma linha `#` dentro de
 * um cenário parece igual a uma nota escrita abaixo do requirement, e nenhuma
 * regra baseada em linhas as separa; um aviso errado custa uma linha de saída,
 * enquanto agir sobre uma resposta errada reescreveria o spec.
 */
function firstForeignTail(raw: string): { heading: string; raw: string } | undefined {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const fenceMask = buildCodeFenceMask(lines);
  for (let index = 1; index < lines.length; index++) {
    if (fenceMask[index]) continue;
    if (/^ {0,3}#{1,3}(?:[ \t]|$)/.test(lines[index])) {
      return {
        heading: lines[index].trim(),
        raw: lines.slice(index).join('\n').trimEnd(),
      };
    }
  }
  return undefined;
}

function normalizeBlockRaw(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').trim();
}

/** Conta cópias não sobrepostas para que uma duplicata retida não mascare a perda de outra cópia. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let start = 0;
  while ((start = haystack.indexOf(needle, start)) !== -1) {
    count++;
    start += needle.length;
  }
  return count;
}

/**
 * Write an updated spec to disk.
 */
export async function writeUpdatedSpec(
  update: SpecUpdate,
  rebuilt: string,
  counts: { added: number; modified: number; removed: number; renamed: number }
): Promise<void> {
  // Create target directory if needed
  const targetDir = path.dirname(update.target);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(update.target, rebuilt);

  const specName = update.id;
  console.log(SPECS_APPLY_MESSAGES.applyingChangesTo(specName));
  if (counts.added) console.log(SPECS_APPLY_MESSAGES.countAdded(counts.added));
  if (counts.modified) console.log(SPECS_APPLY_MESSAGES.countModified(counts.modified));
  if (counts.removed) console.log(SPECS_APPLY_MESSAGES.countRemoved(counts.removed));
  if (counts.renamed) console.log(SPECS_APPLY_MESSAGES.countRenamed(counts.renamed));
}

/** Apaga os trechos `<!-- ... -->`, preservando a contagem de linhas para os índices permanecerem alinhados. */
function maskHtmlComments(content: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  // `--!>` também é terminador de comentário, assim como `-->`.
  const masked = content.replace(/<!--[\s\S]*?--!?>/g, blank);
  // Um comentário nunca fechado corre até o fim do arquivo, então tudo depois
  // dele também está comentado. Sem isso, um `<!--` não terminado acima de um
  // `## Purpose` fazia o cabeçalho comentado parecer real (#1413).
  const unterminated = masked.indexOf('<!--');
  if (unterminated === -1) return masked;
  return masked.slice(0, unterminated) + blank(masked.slice(unterminated));
}

/**
 * Lê o corpo de uma seção `## Purpose`, ignorando markdown que só aparece
 * dentro de blocos de código cercados ou comentários HTML. Retorna undefined
 * quando a seção está ausente ou seu corpo é vazio.
 */
function extractPurposeSection(content: string): string | undefined {
  const normalized = content.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  // A estrutura é lida da cópia mascarada para que um `## Purpose` comentado
  // ou cercado não seja confundido com o real; o corpo é devolvido das linhas
  // originais para que comentários e fences do próprio autor sobrevivam intactos.
  const masked = maskHtmlComments(normalized).split('\n');
  const fenceMask = buildCodeFenceMask(masked);
  const isStructural = (i: number) => !fenceMask[i];

  const start = masked.findIndex((line, i) => isStructural(i) && /^##\s+Purpose\s*$/i.test(line));
  if (start === -1) return undefined;

  let end = masked.length;
  for (let i = start + 1; i < masked.length; i++) {
    if (isStructural(i) && /^##\s+/.test(masked[i])) {
      end = i;
      break;
    }
  }

  // O vazio é julgado com blocos cercados e comentários HTML apagados, então
  // um Purpose que é só um exemplo de código ou só um comentário de template
  // não preenchido conta como ausente e cai no placeholder TBD.
  const hasProse = masked
    .slice(start + 1, end)
    .filter((_, offset) => isStructural(start + 1 + offset))
    .join('\n')
    .trim();
  if (!hasProse) return undefined;

  const body = lines.slice(start + 1, end).join('\n').trim();
  return body || undefined;
}

/**
 * O Purpose com que um novo spec principal terminaria, ou null quando carregar
 * o corpo do delta deixaria um spec que os leitores downstream não conseguem tratar.
 *
 * Retorna o overview parseado em vez de um booleano para que os chamadores meçam
 * a mesma string que o `validate` mede, não o recorte bruto do delta.
 */
function readableOverview(skeleton: string, specName: string): string | null {
  // Comentários HTML são invisíveis para os parsers de spec, mas não para o
  // arquivo: markdown escondido em um deles é pulado pela varredura de limites
  // e ainda assim vai parar no spec, onde pode esconder os cabeçalhos de que
  // esses parsers dependem e esvaziar o documento em qualquer renderizador
  // markdown. Recusar em vez de escrever um spec que lê diferente dependendo
  // de quem lê (#1413).
  //
  // Só o abridor é desqualificante, e só porque `maskHtmlComments` cobre
  // comentários não terminados também: um comentário que abre acima do
  // cabeçalho da seção sempre mascara o próprio cabeçalho, não deixando corpo
  // para carregar, então um corpo só pode esconder conteúdo atrás de um `<!--`
  // próprio. Um `-->` solto não esconde nada e renderiza como texto - rejeitá-lo
  // jogaria fora um Purpose sobre prosa como "ingest --> transform".
  if (skeleton.includes('<!--')) return null;
  if (findMainSpecStructureIssues(skeleton).length > 0) return null;
  try {
    // Um cabeçalho ou fence não terminado no corpo trunca ou engole as seções
    // ao redor, então o archive abortaria ou escreveria um spec que seu próprio
    // validador rejeita.
    return new MarkdownParser(skeleton).parseSpec(specName).overview.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Build a skeleton spec for new capabilities. When the delta spec authored a
 * `## Purpose`, carry it over instead of the TBD placeholder (#1413) - archive
 * invents the Purpose for a brand-new main spec either way, and the author's
 * own wording beats a placeholder they then have to hand-edit.
 */
export function buildSpecSkeleton(specFolderName: string, changeName: string, purpose?: string): string {
  const titleBase = specFolderName;
  const purposeBody = purpose?.trim() || SPECS_APPLY_MESSAGES.skeletonPurpose(changeName);
  return `# ${titleBase} Specification\n\n## Purpose\n${purposeBody}\n\n## Requirements\n`;
}

function findMissingCurrentScenarios(current: RequirementBlock, incoming: RequirementBlock): string[] {
  // Multiplicity-aware: a name present N times in current and M times in
  // incoming means max(0, N - M) instances are missing. Set membership would
  // treat N>M as fully covered and let archive silently drop duplicates
  // (residual #1246 / duplicate-scenario-name blind spot).
  const remainingIncoming = new Map<string, number>();
  for (const scenario of parseScenarioBlocks(incoming.raw)) {
    const name = scenario.name;
    remainingIncoming.set(name, (remainingIncoming.get(name) ?? 0) + 1);
  }

  const missing: string[] = [];
  for (const scenario of parseScenarioBlocks(current.raw)) {
    const name = scenario.name;
    const remaining = remainingIncoming.get(name) ?? 0;
    if (remaining > 0) {
      remainingIncoming.set(name, remaining - 1);
    } else {
      missing.push(name);
    }
  }
  return missing;
}

function parseScenarioBlocks(requirementRaw: string): ScenarioBlock[] {
  const lines = requirementRaw.replace(/\r\n?/g, '\n').split('\n');
  const scenarios: ScenarioBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const headerMatch = lines[index].match(/^####\s*Scenario:\s*(.+)\s*$/);
    if (!headerMatch) {
      index++;
      continue;
    }

    const start = index;
    const name = headerMatch[1].trim();
    index++;
    while (index < lines.length && !/^####\s*Scenario:\s*(.+)\s*$/.test(lines[index])) {
      index++;
    }

    scenarios.push({
      name,
      raw: lines.slice(start, index).join('\n').trimEnd(),
    });
  }

  return scenarios;
}


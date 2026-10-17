/**
 * Spec Application Logic
 *
 * Extracted from ArchiveCommand to enable standalone spec application.
 * Applies delta specs from a change to main specs without archiving.
 */

import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  findMissingCurrentScenarios,
  foldRequirementName,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
  type RequirementsSectionParts,
} from './parsers/requirement-blocks.js';
import { findMainSpecStructureIssues } from './parsers/spec-structure.js';
import { buildCodeFenceMask } from './parsers/code-fence.js';
import { MarkdownParser } from './parsers/markdown-parser.js';
import { MIN_PURPOSE_LENGTH } from './validation/constants.js';
import { discoverSpecFiles } from '../utils/spec-discovery.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { FILE_SYSTEM_MESSAGES, SPECS_APPLY_MESSAGES } from '../messages/index.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SpecUpdate {
  /** Capability id relative to the specs root, forward-slash separated (e.g. "web" or "platform/session-layout"). */
  id: string;
  /** Raiz permitida para a fonte do delta. */
  sourceRoot: string;
  source: string;
  /** Raiz permitida para o alvo (spec principal). */
  targetRoot: string;
  target: string;
  exists: boolean;
}

function isLexicallyWithin(allowedDirectory: string, targetPath: string): boolean {
  const relative = path.relative(path.resolve(allowedDirectory), path.resolve(targetPath));
  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function resolveTrustedSpecPath(specsRoot: string, specPath: string): {
  root: string;
  file: string;
} {
  if (!isLexicallyWithin(specsRoot, specPath)) {
    throw new Error(FILE_SYSTEM_MESSAGES.pathOutsideAllowedDirectory(specPath));
  }

  try {
    // Preserva links de spec.md que permanecem dentro da árvore de specs.
    FileSystemUtils.assertPathWithin(specsRoot, specPath);
    const root = FileSystemUtils.canonicalizeExistingPath(specsRoot);
    return {
      root,
      // Rebaseia na raiz canônica para que alvos ainda inexistentes também
      // funcionem quando o projeto é alcançado por um alias de caminho do SO
      // (por exemplo /var no macOS).
      file: path.join(root, path.relative(path.resolve(specsRoot), path.resolve(specPath))),
    };
  } catch {
    // Diretórios de capability diretos podem ser, de propósito, symlinks de
    // monorepo. Congele sua localização canônica como raiz de confiança para
    // que trocas posteriores sejam rejeitadas, enquanto um link de spec.md
    // aninhado continua sem poder escapar.
    const root = FileSystemUtils.canonicalizeExistingPath(path.dirname(specPath));
    const file = path.join(root, path.basename(specPath));
    FileSystemUtils.assertPathWithin(root, file);
    return { root, file };
  }
}

function assertTrustedSpecPath(root: string, specPath: string): void {
  if (FileSystemUtils.canonicalizeExistingPath(root) !== path.resolve(root)) {
    throw new Error(FILE_SYSTEM_MESSAGES.pathOutsideAllowedDirectory(specPath));
  }
  FileSystemUtils.assertPathWithin(root, specPath);
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
    const source = resolveTrustedSpecPath(changeSpecsDir, specFile);
    const target = resolveTrustedSpecPath(mainSpecsDir, targetFile);

    // Check if target exists
    let exists = false;
    try {
      await fs.access(target.file);
      exists = true;
    } catch {
      exists = false;
    }

    updates.push({
      id,
      sourceRoot: source.root,
      source: source.file,
      targetRoot: target.root,
      target: target.file,
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
  /**
   * Todo bloco `### Requirement:` canônico sobre o qual o delta podia agir se
   * foi. Isto é apenas um sinal *candidato* de aposentadoria (#1302): o
   * validador, não esta contagem, decide se `rebuilt` é de fato inescrevível -
   * ele reconhece formas de requisito que este parser varre para o preâmbulo,
   * então um spec pode não ter blocos aqui e ainda assim validar. Ver
   * `isRetirableSpec` em archive.ts.
   */
  noRequirementBlocks: boolean;
  /**
   * Toda linha não vazia do spec que esta mesclagem não consegue nomear.
   *
   * A aposentadoria exclui o arquivo inteiro, então a única pergunta segura é
   * se a mesclagem consegue contabilizar todo ele. `extractRequirementsSection`
   * divide um spec em cinco fatias, e auditar um subconjunto foi como este
   * guarda seguiu falhando: por sete rodadas ele procurou texto com FORMA de
   * requisito e foi vencido por um disfarce novo a cada vez; quando passou a
   * perguntar onde o conteúdo caiu, ainda lia só o preâmbulo e a cauda - então
   * o conteúdo simplesmente migrava para uma fatia que ninguém conferia, e prosa
   * autoral dentro do raw de um bloco removido era excluída enquanto o relatório
   * dizia que só o "Purpose" se perdera.
   *
   * Por isso contabiliza o arquivo inteiro: o título, a seção `## Purpose`, o
   * cabeçalho `## Requirements` e, dentro de cada bloco de requisito, as partes
   * que compõem um requisito - seu cabeçalho, seu enunciado e os bullets dos
   * seus cenários. Toda outra linha não vazia é reportada e recusa a
   * aposentadoria.
   *
   * Falha em segurança em todas as direções: uma linha que isto não consegue
   * classificar conta como não contabilizada, o que recusa em vez de excluir.
   */
  unaccountedContent: string[];
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
  assertTrustedSpecPath(update.sourceRoot, update.source);
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
  assertTrustedSpecPath(update.targetRoot, update.target);
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
  // Mantém os blocos de origem imutáveis para a atribuição de perda. Esta
  // lista paralela de chaves carrega só a identidade posicional, já que
  // renames mudam as chaves de lookup.
  const orderedKeys = parts.bodyBlocks.map((block) => normalizeRequirementName(block.name));

  // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED
  // RENAMED
  let renamedApplied = 0;
  for (const r of plan.renamed) {
    const from = normalizeRequirementName(r.from);
    const to = normalizeRequirementName(r.to);
    if (!nameToBlock.has(from)) {
      // Source gone but target present means the rename was already synced
      // to the baseline (early-sync pattern) — re-applying it is a no-op,
      // not a failure. Only a missing source AND target is a genuine error.
      if (nameToBlock.has(to)) {
        // Unless a case/whitespace variant of the source still exists (and is
        // not the target itself, as in a case-only rename): that is a typo'd
        // header, not an early-synced rename — same guard REMOVED applies.
        const nearMiss = [...nameToBlock.keys()].find(
          (k) => k !== to && foldRequirementName(k) === foldRequirementName(from)
        );
        if (nearMiss !== undefined) {
          throw new Error(
            SPECS_APPLY_MESSAGES.renamedFailedSourceNotFoundNearMiss(specName, r.from, nameToBlock.get(nearMiss)!.name)
          );
        }
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
    // Um delete+set no Map move o bloco renomeado para o fim da ordem de
    // inserção. Em vez disso, carrega a nova chave no slot de origem; renames
    // encadeados a atualizam de novo.
    const orderIndex = orderedKeys.indexOf(from);
    if (orderIndex >= 0) {
      orderedKeys[orderIndex] = to;
    }
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
  let modifiedApplied = 0;
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
    // Identical content means the modification was already synced to the
    // baseline (early-sync pattern) — count only real replacements, so a
    // fully synced change still takes the "already in sync" write skip
    // instead of churning normalization differences into the file.
    if (normalizeBlockRaw(currentBlock.raw) !== normalizeBlockRaw(mod.raw)) {
      modifiedApplied++;
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
  for (let index = 0; index < parts.bodyBlocks.length; index++) {
    const block = parts.bodyBlocks[index];
    const key = orderedKeys[index];
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
    const replacementFromOriginal = replacement;
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

  // As linhas em branco ao redor de `## Requirements` não pertencem a fatia
  // nenhuma: `before` e `after` carregam no máximo um '\n' final/inicial por
  // construção, e o corpo é trimEnd(). Unir as fatias com um '\n' simples
  // colava o cabeçalho ao parágrafo do Purpose e ao primeiro requisito, então
  // todo archive reescrevia um spec bem formatado nesse formato. Em vez disso,
  // separa as fatias não vazias com uma linha em branco. O resultado termina
  // sempre com exatamente um '\n' (EOF canônico, #1528).
  const rebuilt = [parts.before.trimEnd(), parts.headerLine, reqBody, parts.after.trim()]
    .filter((s) => s !== '')
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';

  return {
    rebuilt,
    counts: {
      added: addedApplied,
      modified: modifiedApplied,
      removed: removedApplied,
      renamed: renamedApplied,
    },
    warnings,
    noRequirementBlocks: keptOrder.length === 0,
    // Lido da seção de requisitos ORIGINAL, não da reconstruída. Tudo depois do
    // último cabeçalho `### Requirement:` pertence ao raw daquele bloco e é
    // descartado com ele, então uma varredura do corpo reconstruído só veria
    // cabeçalhos acima do primeiro requisito - vetaria um `### Notes` escrito
    // antes dos requisitos e deixaria passar o cabeçalho idêntico escrito depois.
    unaccountedContent: contentTheMergeCannotName(parts),
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

/**
 * As linhas não vazias de um spec que não fazem parte do que uma aposentadoria
 * consegue nomear: o título, a seção `## Purpose`, o cabeçalho `## Requirements`
 * e, em cada bloco de requisito, seu próprio cabeçalho, enunciado e bullets de
 * cenário.
 *
 * Deliberadamente sobre o arquivo inteiro. Auditar um subconjunto das fatias foi
 * o que deixou prosa autoral dentro de um bloco removido, e conteúdo acima da
 * seção de requisitos, ser excluída sem menção.
 */
function contentTheMergeCannotName(parts: RequirementsSectionParts): string[] {
  const leftovers: string[] = [];

  // Acima da seção de requisitos: o título e a seção Purpose são esperados;
  // qualquer outra coisa é conteúdo autoral que a exclusão levaria.
  const beforeLines = parts.before.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const beforeMask = buildCodeFenceMask(beforeLines);
  let inPurpose = false;
  let titleSeen = false;
  let previousLine = '';
  for (let index = 0; index < beforeLines.length; index++) {
    const line = beforeLines[index];
    if (!line.trim()) {
      previousLine = '';
      continue;
    }
    if (!beforeMask[index]) {
      const section = line.match(/^ {0,3}##\s+(.+?)\s*$/);
      if (section) {
        inPurpose = /^purpose$/i.test(section[1].trim());
        if (!inPurpose) leftovers.push(line.trim());
        previousLine = line;
        continue;
      }
      // `##` não é a única forma de abrir uma seção. Um sublinhado setext
      // transforma a linha acima em cabeçalho, e HTML cru diz isso na cara -
      // um leitor vê um irmão de `## Purpose`, não mais corpo dele. Tratar tudo
      // até o próximo `##` ATX como Purpose engolia esses inteiros e os
      // excluía, reportados como nada além de "Purpose".
      const setext = inPurpose && previousLine.trim() && /^ {0,3}(=+|-+)\s*$/.test(line);
      const htmlHeading = /^ {0,3}<h[1-6]\b/i.test(line);
      if (setext || htmlHeading) {
        leftovers.push((setext ? previousLine : line).trim());
        inPurpose = false;
        previousLine = line;
        continue;
      }
      if (/^ {0,3}#\s+.+$/.test(line)) {
        if (!titleSeen && !inPurpose) {
          titleSeen = true;
        } else {
          leftovers.push(line.trim());
          inPurpose = false;
        }
        previousLine = line;
        continue;
      }
    }
    previousLine = line;
    if (inPurpose) continue;
    leftovers.push(line.trim());
  }

  // Entre o cabeçalho e o primeiro requisito, e depois do fim da seção.
  for (const slice of [parts.preamble, parts.after]) {
    for (const line of slice.split('\n')) {
      if (line.trim()) leftovers.push(line.trim());
    }
  }

  // Dentro de cada bloco de requisito, tudo que o parser de blocos não tratou
  // como novo cabeçalho vem junto no `raw` - tabelas, fences, comentários, prosa
  // escrita abaixo dos cenários. Só as partes do próprio requisito são esperadas.
  for (const block of parts.bodyBlocks) {
    const foreignTail = firstForeignTail(block.raw);
    if (foreignTail) leftovers.push(foreignTail.heading);

    const lines = block.raw.replace(/\r\n?/g, '\n').split('\n');
    const mask = buildCodeFenceMask(lines);
    let seenScenario = false;
    // Os bullets de um cenário correm ininterruptos sob seu cabeçalho. Uma linha
    // em branco depois deles encerra o cenário, então bullets escritos após esse
    // ponto são uma nota que o autor adicionou, não parte do cenário - e excluir
    // o arquivo os levaria. Tratar todo bullet como do próprio cenário foi o que
    // deixou uma nota operacional abaixo do último cenário ser excluída sem menção.
    let inScenarioBullets = false;
    let bulletsSeen = false;
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line.trim()) {
        // Só um branco que segue bullets de verdade fecha a sequência, então um
        // branco entre o cabeçalho do cenário e seu primeiro bullet não é fronteira.
        if (bulletsSeen) inScenarioBullets = false;
        continue;
      }
      if (index === 0) continue; // o próprio cabeçalho `### Requirement:`
      // Linhas cercadas renderizam como bloco de código dentro do requisito,
      // então são conteúdo dele seja como for escritas - um `### Requirement:`
      // em um exemplo não é cabeçalho para leitor nenhum. Marcá-las tornava
      // inaposentável um spec que apenas documenta um comando.
      if (mask[index]) continue;
      if (
        index > 1 &&
        /^ {0,3}(?:=+|-+)\s*$/.test(line) &&
        lines[index - 1].trim()
      ) {
        leftovers.push(lines[index - 1].trim());
        continue;
      }
      if (/^ {0,3}####\s+Scenario:/i.test(line)) {
        seenScenario = true;
        inScenarioBullets = true;
        bulletsSeen = false;
        continue;
      }
      if (/^\s*(?:[-*]|\d+[.)])\s/.test(line)) {
        if (inScenarioBullets) {
          bulletsSeen = true;
          continue;
        }
        // Um bullet fora de cenário. Antes do primeiro cenário faz parte do
        // enunciado do requisito; depois de um, é nota do próprio autor.
        if (!seenScenario) continue;
        leftovers.push(line.trim());
        continue;
      }
      // Prosa livre acima do primeiro cenário é o enunciado do requisito.
      if (!seenScenario && !/^\s*[|<]/.test(line)) continue;
      leftovers.push(line.trim());
    }
  }

  return [...new Set(leftovers)];
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
 * Aposenta uma capability cujo último requisito um delta removeu: exclui seu
 * spec principal e poda os diretórios que a exclusão deixar vazios. Retorna
 * false quando não havia nada a excluir.
 *
 * Condicionado pelo chamador ao marcador `retire_capabilities` da alteração,
 * para que a única ação do archive que remove um arquivo de `openspec/specs/`
 * seja sempre algo que o autor pediu, e não algo inferido da forma de um delta.
 * O arquivo é recuperável a partir do git, o que o relatório nomeia; aplicar
 * REMOVED já apaga conteúdo de requisito de um spec principal, então excluir o
 * spec quando não sobra nada é a mesma operação levada ao fim, não um novo tipo
 * de ato.
 *
 * Só o `spec.md` gerado é removido - um diretório que contenha qualquer outra
 * coisa (uma capability aninhada, uma nota mantida à mão) fica no lugar.
 *
 * O alvo precisa resolver dentro da raiz de specs selecionada. Um link
 * simbólico de diretório de capability não pode transformar um marcador de
 * aposentadoria em autorização para excluir um arquivo externo sem relação. Um
 * `spec.md` que é ele mesmo um link é seguro: unlink remove o link e deixa o
 * alvo em paz.
 *
 * A poda de diretórios É limitada, por caminhos REAIS e não por prefixos de
 * string: `path.resolve` colapsa `..` mas não resolve links simbólicos, e tanto
 * `readdir` quanto `rmdir` os seguem, então um diretório de capability linkado
 * deixaria a caminhada excluir diretórios totalmente fora da raiz de specs.
 */
export async function retireSpec(
  update: SpecUpdate,
  mainSpecsDir: string,
  options: {
    silent?: boolean;
    beforeMutate?: () => Promise<void>;
    verifyDisplaced?: (displacedPath: string) => Promise<void>;
    deferDelete?: boolean;
  } = {}
): Promise<{ retired: boolean; resolvedPath?: string; displacedPath?: string }> {
  if (options.deferDelete && options.verifyDisplaced === undefined) {
    throw new Error(SPECS_APPLY_MESSAGES.deferredRetirementRequiresVerification);
  }
  // Resolvido antes do unlink, enquanto o link ainda existe, para que o
  // relatório nomeie o arquivo que realmente some quando um link aponta para
  // fora da árvore. Um `spec.md` linkado é excluído dessa resolução: `realpath`
  // o seguiria, mas `unlink` remove o link e deixa o alvo em paz, então nomear
  // o alvo alegaria a exclusão de um arquivo que continua lá.
  let realSource: string | undefined;
  try {
    const link = await fs.lstat(update.target);
    realSource = link.isSymbolicLink() ? undefined : await fs.realpath(update.target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { retired: false };
    throw new Error(
      SPECS_APPLY_MESSAGES.retireCouldNotVerifyBeforeDeletion(
        update.id,
        update.target,
        error instanceof Error ? error.message : String(error)
      )
    );
  }

  if (realSource !== undefined) {
    let inside: boolean;
    try {
      inside = await isInsideRealDir(realSource, mainSpecsDir);
    } catch (error) {
      throw new Error(
        SPECS_APPLY_MESSAGES.retireCouldNotVerifyInside(
          update.id,
          update.target,
          mainSpecsDir,
          error instanceof Error ? error.message : String(error)
        )
      );
    }
    if (!inside) {
      throw new Error(
        SPECS_APPLY_MESSAGES.retireResolvesOutside(update.id, update.target, mainSpecsDir)
      );
    }
  }

  let displacedPath: string | undefined;
  try {
    await options.beforeMutate?.();
    if (options.verifyDisplaced) {
      const displaced = `${update.target}.openspec-retire-${randomUUID()}`;
      displacedPath = displaced;
      await fs.rename(update.target, displaced);
      try {
        await options.verifyDisplaced(displaced);
        try {
          await fs.lstat(update.target);
          throw new Error(SPECS_APPLY_MESSAGES.concurrentFileAppearedWhileRetiring(update.target));
        } catch (targetError) {
          if ((targetError as NodeJS.ErrnoException).code !== 'ENOENT') throw targetError;
        }
        if (!options.deferDelete) await fs.unlink(displaced);
      } catch (error) {
        try {
          await fs.lstat(update.target);
          throw new Error(
            SPECS_APPLY_MESSAGES.concurrentFileOccupiesTargetRetained(
              error instanceof Error ? error.message : String(error),
              update.target,
              displaced
            )
          );
        } catch (targetError) {
          if ((targetError as NodeJS.ErrnoException).code !== 'ENOENT') throw targetError;
        }
        await fs.rename(displaced, update.target);
        throw error;
      }
    } else {
      await fs.unlink(update.target);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { retired: false };
    // Um errno cru aqui parece falha interna; diga o que estava sendo tentado
    // para que a mensagem seja acionável por si só.
    throw new Error(
      SPECS_APPLY_MESSAGES.retireFailedToDelete(update.id, update.target, (error as Error).message)
    );
  }

  if (!options.deferDelete) {
    await pruneEmptyDirs(path.dirname(update.target), mainSpecsDir);
  }

  const nominal = `openspec/specs/${update.id}/spec.md`;
  if (!options.silent) {
    console.log(SPECS_APPLY_MESSAGES.retiringSpec(nominal));
  }
  // `resolvedPath` é sempre o arquivo que foi de fato desvinculado - os
  // chamadores precisam dele para reportar um caminho que o git aceite, já que
  // o nominal é montado a partir do id da capability e pode diferir em caixa,
  // ou apontar através de um link simbólico.
  return {
    retired: true,
    ...(realSource ? { resolvedPath: realSource } : {}),
    ...(options.deferDelete && displacedPath ? { displacedPath } : {}),
  };
}

/** Conclui uma aposentadoria adiada: remove o backup deslocado e poda os diretórios vazios. */
export async function finalizeRetiredSpec(
  target: string,
  displacedPath: string,
  mainSpecsDir: string
): Promise<void> {
  await fs.unlink(displacedPath);
  await pruneEmptyDirs(path.dirname(target), mainSpecsDir);
}

/** Se `realPath` (já canônico) fica sob o `dir` real. */
async function isInsideRealDir(realPath: string, dir: string): Promise<boolean> {
  const realDir = await fs.realpath(dir);
  return realPath.startsWith(realDir + path.sep);
}

/**
 * Remove diretórios agora vazios de `startDir` para cima, nunca saindo do
 * `boundaryDir` real e nunca removendo esse próprio diretório.
 *
 * A fronteira é um parâmetro, em vez de ser a raiz de specs diretamente, para
 * que a contenção da caminhada fique declarada no ponto de chamada, onde a raiz
 * da qual ela não pode escapar é o que está em questão.
 *
 * O guarda roda de novo a cada iteração, então subir para o pai LEXICAL é
 * seguro: um pai que não é o real é simplesmente re-resolvido e rejeitado.
 * Erros são engolidos e encerram a caminhada - ENOTEMPTY e ENOENT são
 * desfechos corretos (um arquivo chegando no meio da caminhada tem de vencer),
 * e uma falha de permissão deixa um diretório vazio para trás, que o próximo
 * archive bem-sucedido limpa.
 *
 * Não é livre de race: um atacante capaz de trocar um ancestral entre a
 * verificação e o `rmdir` conseguiria remover um diretório vazio fora da raiz.
 * Fechar isso exige syscalls relativas a fd que o Node não expõe, e requer
 * acesso local de escrita a `openspec/specs` durante um archive.
 */
async function pruneEmptyDirs(startDir: string, boundaryDir: string): Promise<void> {
  let boundary: string;
  try {
    boundary = await fs.realpath(boundaryDir);
  } catch {
    return;
  }

  let dir = startDir;
  for (;;) {
    let realDir: string;
    try {
      // lstat primeiro: rmdir em um link falha de qualquer forma, mas resolvê-lo
      // nos levaria para fora da árvore, e o pai para o qual subiríamos seria
      // o errado.
      const link = await fs.lstat(dir);
      if (link.isSymbolicLink()) return;
      realDir = await fs.realpath(dir);
    } catch {
      return;
    }

    // Estritamente dentro da fronteira real - a própria fronteira nunca é podada.
    if (realDir === boundary || !realDir.startsWith(boundary + path.sep)) return;

    try {
      const entries = await fs.readdir(dir);
      if (entries.length > 0) return;
      await fs.rmdir(dir);
    } catch {
      return;
    }

    dir = path.dirname(dir);
  }
}

/**
 * Write an updated spec to disk.
 */
export async function writeUpdatedSpec(
  update: SpecUpdate,
  rebuilt: string,
  counts: { added: number; modified: number; removed: number; renamed: number },
  options: { beforeMutate?: () => Promise<void> } = {}
): Promise<void> {
  assertTrustedSpecPath(update.targetRoot, update.target);

  // Create target directory if needed
  const targetDir = path.dirname(update.target);
  await fs.mkdir(targetDir, { recursive: true });
  await options.beforeMutate?.();
  // Preserva a semântica estabelecida de escrita in-place: referentes de links
  // simbólicos, specs com hard link, ACLs, atributos estendidos e sistemas de
  // arquivos sem hard links precisam continuar se comportando como antes da
  // aposentadoria de capabilities existir.
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


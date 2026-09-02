import { constants, createReadStream, promises as fs } from 'fs';
import { createHash, randomUUID } from 'crypto';
import path from 'path';
import { formatLocalDate } from '../utils/date.js';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import { VALIDATION_MESSAGES } from './validation/constants.js';
import chalk from 'chalk';
import { ARCHIVE_MESSAGES, ID_MESSAGES, SPECS_APPLY_MESSAGES } from '../messages/index.js';
import {
  findSpecUpdates,
  buildUpdatedSpec,
  writeUpdatedSpec,
  retireSpec,
  finalizeRetiredSpec,
  type SpecUpdate,
} from './specs-apply.js';
import { discoverSpecFiles, hasAnyFileUnder } from '../utils/spec-discovery.js';
import {
  METADATA_FILENAME,
  readRetireCapabilitiesMarker,
  readSkipSpecsMarker,
} from '../utils/change-metadata.js';
import { confirmPrompt, isNonInteractivePromptError } from '../utils/interactive.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { folderStyleNameProblem } from './id.js';

type ArchiveOptions = { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean };

/**
 * Matches the `YYYY-MM-DD-` prefix that archiving prepends to a change name.
 * A change whose name already starts with one (a common authoring convention)
 * is archived under its existing name so the prefix is never stacked (#1309).
 */
const ARCHIVE_DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

/**
 * Verdadeiro quando a ÚNICA coisa errada com um spec reconstruído é ele não ter
 * requisitos. É exatamente a falha que aposentar uma capability substitui
 * (#1302); qualquer outra coisa significa que o spec está quebrado de um jeito
 * que o autor ainda precisa corrigir, então o archive deve abortar exatamente
 * como sempre fez, em vez de aposentar.
 *
 * Perguntar ao validador - em vez de contar blocos de requisito uma segunda
 * vez - é o que torna "este spec não poderia ter sido escrito de qualquer
 * forma" verdadeiro por construção. As duas contagens realmente discordam:
 * `MarkdownParser` aceita qualquer cabeçalho `###` sob `## Requirements` como
 * requisito, enquanto o parser de blocos de delta só indexa cabeçalhos
 * `### Requirement:` canônicos e varre o resto para o preâmbulo, que sobrevive
 * no spec reconstruído.
 */
export async function isRetirableSpec(specName: string, rebuilt: string): Promise<boolean> {
  const report = await new Validator().validateSpecContent(specName, rebuilt);
  if (report.valid) return false;
  const errors = report.issues.filter((issue) => issue.level === 'ERROR');
  return (
    errors.length > 0 &&
    errors.every((issue) => issue.message === VALIDATION_MESSAGES.SPEC_NO_REQUIREMENTS)
  );
}

/**
 * Quanto de uma linha bloqueante o abort está disposto a mostrar. Uma linha
 * longa o bastante para encher a tela empurraria a saída do abort para fora dela.
 */
const UNACCOUNTED_LINE_MAX = 200;

/**
 * As primeiras linhas que uma aposentadoria excluiria sem conseguir nomeá-las,
 * entre aspas, com a contagem do restante. Limitado para que uma cauda longa
 * não enterre o resto do abort.
 *
 * As linhas são conteúdo autoral impresso verbatim no terminal, então recebem
 * o mesmo tratamento de um nome de diretório de alteração
 * (`describeChangeName`): um CR cru poderia forjar uma linha própria e um ESC
 * poderia redesenhar a tela. O corte conta code points para nunca deixar
 * metade de um par substituto.
 */
function describeUnaccountedContent(lines: string[]): string {
  const shown = lines
    .slice(0, 3)
    .map((line) => {
      const safe = [...line.replace(/[\u0000-\u001f\u007f]/g, '?')];
      const clipped = safe.slice(0, UNACCOUNTED_LINE_MAX).join('');
      return `"${safe.length > UNACCOUNTED_LINE_MAX ? `${clipped}\u2026` : clipped}"`;
    })
    .join(', ');
  const rest = lines.length > 3 ? ARCHIVE_MESSAGES.unaccountedMoreLines(lines.length - 3) : '';
  return `${shown}${rest}`;
}

/**
 * O que esta execução deve fazer com um spec reconstruído: escrevê-lo como de
 * costume, aposentar a capability porque o delta removeu seu último requisito
 * (#1302), ou nada porque não há spec a escrever nem a aposentar.
 */
type SpecOutcome = 'write' | 'retire' | 'skip';

async function isRetirementCandidate(
  update: SpecUpdate,
  built: Pick<
    Awaited<ReturnType<typeof buildUpdatedSpec>>,
    'rebuilt' | 'noRequirementBlocks' | 'unaccountedContent'
  >,
  skipValidation: boolean
): Promise<boolean> {
  return (
    !skipValidation &&
    built.noRequirementBlocks &&
    built.unaccountedContent.length === 0 &&
    (await isRetirableSpec(update.id, built.rebuilt))
  );
}

async function decideSpecOutcome(
  update: SpecUpdate,
  built: Awaited<ReturnType<typeof buildUpdatedSpec>>,
  skipValidation: boolean,
  retirementDeclared: boolean
): Promise<SpecOutcome> {
  // O autor precisa ter pedido. Sem o marcador isto cai na escrita comum, que
  // falha na validação exatamente como sempre falhou - e o abort nomeia o
  // marcador, então o beco sem saída que #1302 descreve agora vem com a sua
  // própria saída em vez de só um spec rejeitado.
  if (!retirementDeclared) return 'write';

  // A aposentadoria é decidida pelo validador, nunca por uma segunda opinião
  // sobre o que conta como requisito: o parser de blocos varre para o preâmbulo
  // algumas formas que o validador aceita, então "não sobrou bloco" sozinho
  // aposentaria specs que validam bem.
  //
  // Cabeçalhos `###` residuais vetam de imediato. O validador pode ser
  // convencido a não vê-los - um `### Requirements` perdido sob o Purpose captura
  // sua busca de seção - mas um leitor não, e excluir o arquivo os levaria junto.
  //
  // Sob --no-validate não há veredito em que se apoiar, então nada é aposentado:
  // o autor abriu mão da checagem que torna isto seguro, e o comportamento
  // antigo (escrever o spec) não perde nada.
  // Nada no arquivo pode ficar fora das partes que a mesclagem entende.
  // Perguntado como "alguma coisa caiu fora das partes que eu entendo" em vez de
  // "alguma coisa parece um requisito" - a segunda pergunta é a que seis rodadas
  // de revisão encontraram, cada uma, um jeito novo de responder errado.
  const retirable = await isRetirementCandidate(update, built, skipValidation);

  if (!retirable) return 'write';
  // Nada em disco para escrever ou aposentar: a capability já está aposentada.
  if (!update.exists) return 'skip';
  // Um spec que já estava sem requisitos e não perdeu nada nesta execução
  // continua sendo do autor para consertar, então recebe o mesmo abort que
  // sempre produziu.
  return built.counts.removed > 0 ? 'retire' : 'write';
}

/**
 * Quotes a change name for a `Fix:` line the reader is meant to paste.
 * Archive resolves a change by stat-ing its directory, so the name is
 * whatever the directory is called - including names with spaces or shell
 * metacharacters, which pasted unquoted would run as a second command.
 *
 * Double quotes are the one form bash, zsh, PowerShell and cmd.exe all read
 * the same way, so a POSIX-only `'...'` would be wrong on Windows. Characters
 * that stay inert inside double quotes in every one of those shells are the
 * limit of what can be quoted portably; a name containing anything else has
 * no portable spelling, so the placeholder is named instead of emitting a
 * command that might expand to something the reader did not intend.
 *
 * `%` and `!` are unquotable for the same reason even though POSIX shells
 * leave them alone inside double quotes: cmd.exe expands `%NAME%` inside
 * double quotes, and `!NAME!` expands there too under `setlocal
 * enabledelayedexpansion` (as does `!` under bash's interactive history
 * expansion). A change directory really can be named `%USERNAME%`, and a
 * rerun that silently targets a different change is worse than one the reader
 * has to fill in.
 */
function quoteChangeName(name: string): string {
  return quoteForShell(name) ?? '<nome-da-alteração>';
}

/**
 * Cita um argumento para uma linha que o leitor vai colar, ou retorna undefined
 * quando não existe grafia portável.
 *
 * Aspas duplas são a única forma que bash, zsh, PowerShell e cmd.exe leem do
 * mesmo jeito. Um valor com um caractere que continua especial DENTRO de aspas
 * duplas em qualquer um deles não tem grafia portável, então os chamadores
 * dizem outra coisa em vez de emitir um comando que expande para algo que o
 * leitor não pretendia.
 */
function quoteForShell(value: string): string | undefined {
  if (/^[A-Za-z0-9._\/-]+$/.test(value)) return value;
  if (!/["\\$`\r\n%!]/.test(value)) return `"${value}"`;
  return undefined;
}

/**
 * Renders a change name inside a prose message. The name is a directory name,
 * so it can hold control characters, and human mode prints the message
 * verbatim: a raw CR or LF would let a change directory forge its own `Fix:`
 * line, which is worse here than anywhere else because `quoteChangeName`
 * degrades the real fix to the `<nome-da-alteração>` placeholder for exactly
 * those names - leaving the forged line as the only pasteable command on
 * screen. An ESC could redraw the terminal. Neither survives.
 */
function describeChangeName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, '?');
}

/**
 * Builds the flags a blocked archive's suggested rerun has to reproduce. The
 * caller's own flags are carried, because suggesting a bare `--yes` rerun for
 * `archive x --skip-specs` would merge deltas into the main specs - the exact
 * thing `--skip-specs` was passed to prevent.
 */
function rerunFlags(options: ArchiveOptions): string[] {
  return [
    ...(options.skipSpecs ? ['--skip-specs'] : []),
    ...(options.validate === false || options.noValidate === true ? ['--no-validate'] : []),
    '--yes',
  ];
}

function rerunCommand(changeName: string, options: ArchiveOptions): string {
  const flags = rerunFlags(options).join(' ');
  // A name starting with a dash is read as an option wherever it sits, so it
  // goes last, behind the `--` that ends option parsing.
  if (changeName.startsWith('-')) {
    return `openspec archive ${flags} -- ${quoteChangeName(changeName)}`;
  }
  return `openspec archive ${quoteChangeName(changeName)} ${flags}`;
}

/**
 * Asks a yes/no question in human mode. When no answer can be read — the
 * usual case for an AI agent or a script that runs the command with stdin
 * closed — the raw @inquirer failure is replaced with guidance for this
 * decision point, so the caller learns which flag to pass instead of reading
 * `User force closed the prompt` (#1479).
 */
async function confirmOrBlock(
  prompt: { message: string; default: boolean },
  blocked: () => string
): Promise<boolean> {
  try {
    return await confirmPrompt(prompt);
  } catch (error) {
    if (isNonInteractivePromptError(error)) {
      throw new Error(blocked());
    }
    throw error;
  }
}

/**
 * Recria um link simbólico no destino (sem dereferenciá-lo). No Windows,
 * links de diretório viram junctions, que exigem alvo absoluto.
 */
async function copySymbolicLink(src: string, dest: string): Promise<void> {
  const target = await fs.readlink(src);
  const isWindowsDirectoryLink =
    process.platform === 'win32' && (await fs.stat(src)).isDirectory();
  const destinationTarget =
    isWindowsDirectoryLink && !path.isAbsolute(target)
      ? path.resolve(path.dirname(src), target)
      : target;
  await fs.symlink(destinationTarget, dest, isWindowsDirectoryLink ? 'junction' : undefined);
}

/**
 * Copia o conteúdo de um diretório já criado (`dest` existe e é nosso).
 * Usado quando fs.rename falha (p.ex. EPERM no Windows, EXDEV entre dispositivos).
 */
async function copyDirContents(src: string, dest: string): Promise<void> {
  const sourceStat = await fs.lstat(src);
  // Mantém o acesso de grupo/outros não mais amplo que o da origem, garantindo
  // que este processo consiga preencher até um diretório de origem somente-leitura.
  await fs.chmod(dest, (sourceStat.mode & 0o7777) | 0o700);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { mode: 0o700 });
      await copyDirContents(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      await copySymbolicLink(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath, constants.COPYFILE_EXCL);
    } else {
      throw new Error(ARCHIVE_MESSAGES.unsupportedFilesystemEntry(srcPath));
    }
  }
  await fs.chmod(dest, sourceStat.mode & 0o7777);
}

async function fingerprintDirectoryContents(root: string): Promise<string> {
  const hash = createHash('sha256');
  const updateHashField = (label: string, value: string | Buffer): void => {
    const labelBuffer = Buffer.from(label);
    const valueBuffer = typeof value === 'string' ? Buffer.from(value) : value;
    const lengths = Buffer.allocUnsafe(16);
    lengths.writeBigUInt64BE(BigInt(labelBuffer.length), 0);
    lengths.writeBigUInt64BE(BigInt(valueBuffer.length), 8);
    hash.update(lengths);
    hash.update(labelBuffer);
    hash.update(valueBuffer);
  };
  const fingerprintFile = async (filePath: string): Promise<Buffer> => {
    const fileHash = createHash('sha256');
    for await (const chunk of createReadStream(filePath)) {
      fileHash.update(chunk);
    }
    return fileHash.digest();
  };

  const visit = async (dir: string, relativeDir: string): Promise<void> => {
    const before = await fs.lstat(dir, { bigint: true });
    if (!before.isDirectory()) {
      throw new Error(ARCHIVE_MESSAGES.expectedDirectoryWhileVerifying(dir));
    }
    updateHashField('directory-mode', (before.mode & 0o7777n).toString());
    const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);
      const stat = await fs.lstat(entryPath, { bigint: true });
      updateHashField('path', relativePath);

      if (stat.isDirectory()) {
        updateHashField('type', 'directory');
        await visit(entryPath, relativePath);
      } else if (stat.isSymbolicLink()) {
        const target = await fs.readlink(entryPath);
        const after = await fs.lstat(entryPath, { bigint: true });
        if (statIdentity(stat) !== statIdentity(after)) {
          throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(entryPath));
        }
        updateHashField('type', 'symlink');
        updateHashField('target', target);
      } else if (stat.isFile()) {
        const contentFingerprint = await fingerprintFile(entryPath);
        const after = await fs.lstat(entryPath, { bigint: true });
        if (statIdentity(stat) !== statIdentity(after)) {
          throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(entryPath));
        }
        updateHashField('type', 'file');
        updateHashField('mode', (stat.mode & 0o7777n).toString());
        updateHashField('content-sha256', contentFingerprint);
      } else {
        updateHashField('type', 'other');
        updateHashField('mode', stat.mode.toString());
        updateHashField('size', stat.size.toString());
      }
    }

    const after = await fs.lstat(dir, { bigint: true });
    if (statIdentity(before) !== statIdentity(after)) {
      throw new Error(ARCHIVE_MESSAGES.directoryChangedWhileReading(dir));
    }
  };

  await visit(root, '');
  return hash.digest('hex');
}

async function assertCopiedDirectoryUnchanged(
  stagedSource: string,
  destination: string,
  expectedFingerprint: string
): Promise<void> {
  const sourceFingerprint = await fingerprintDirectoryContents(stagedSource);
  const destinationFingerprint = await fingerprintDirectoryContents(destination);
  if (
    sourceFingerprint !== expectedFingerprint ||
    destinationFingerprint !== expectedFingerprint
  ) {
    throw new Error(
      ARCHIVE_MESSAGES.changeContentsChangedDuringFallbackCopy(stagedSource, destination)
    );
  }
}

/**
 * Move um diretório de src para dest. No Windows, fs.rename() pode falhar com
 * EPERM, e movimentações entre dispositivos falham com EXDEV. Quando a origem
 * consegue antes ser renomeada para um irmão privado, cai para uma cópia
 * verificada seguida de remoção. Uma origem que não pode ser preparada é
 * deixada intocada em vez de copiada e apagada por um caminho que outro
 * processo ainda pode estar editando.
 */
class MoveDestinationRetainedError extends Error {}
class RetirementBackupsRetainedError extends Error {}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function moveDirectory(
  src: string,
  dest: string,
  options: {
    verifyCopiedDestination?: (stagedSource: string) => Promise<void>;
  } = {}
): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (err: any) {
    const code = err?.code;
    // rename sobre um diretório não vazio: o destino foi tomado enquanto o
    // archive rodava. A mesma condição que a checagem prévia reporta.
    if (code === 'ENOTEMPTY' || code === 'EEXIST') {
      throw new Error(ARCHIVE_MESSAGES.archiveAlreadyExists(path.basename(dest)));
    }
    if (code === 'EPERM' || code === 'EXDEV') {
      const stagedSource = path.join(path.dirname(src), `.openspec-move-${randomUUID()}`);
      try {
        await fs.rename(src, stagedSource);
      } catch (stageError) {
        throw new Error(
          ARCHIVE_MESSAGES.couldNotStageBeforeFallback(src, errorMessage(stageError))
        );
      }
      let destIsOurs = false;
      let stagedFingerprint: string;
      try {
        stagedFingerprint = await fingerprintDirectoryContents(stagedSource);
        await fs.mkdir(dest, { mode: 0o700 });
        destIsOurs = true;
        await copyDirContents(stagedSource, dest);
        await options.verifyCopiedDestination?.(stagedSource);
        await assertCopiedDirectoryUnchanged(stagedSource, dest, stagedFingerprint);
      } catch (copyError) {
        if (destIsOurs) {
          await fs.rm(dest, { recursive: true, force: true }).catch(() => undefined);
        }
        try {
          await fs.rename(stagedSource, src);
        } catch (restoreError) {
          throw new Error(
            ARCHIVE_MESSAGES.couldNotRestoreStagedSource(
              errorMessage(copyError),
              stagedSource,
              errorMessage(restoreError)
            )
          );
        }
        if ((copyError as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new Error(ARCHIVE_MESSAGES.archiveAlreadyExists(path.basename(dest)));
        }
        throw copyError;
      }
      try {
        await options.verifyCopiedDestination?.(stagedSource);
        await assertCopiedDirectoryUnchanged(stagedSource, dest, stagedFingerprint);
      } catch (verificationError) {
        await fs.rm(dest, { recursive: true, force: true }).catch(() => undefined);
        try {
          await fs.rename(stagedSource, src);
        } catch (restoreError) {
          throw new Error(
            ARCHIVE_MESSAGES.couldNotRestoreStagedSource(
              errorMessage(verificationError),
              stagedSource,
              errorMessage(restoreError)
            )
          );
        }
        throw verificationError;
      }
      try {
        await fs.rm(stagedSource, { recursive: true, force: true });
      } catch (cleanupError) {
        // A remoção recursiva pode já ter apagado parte da origem. O destino
        // agora é a única cópia completa, então nunca apagá-lo tentando fazer
        // esta movimentação falha parecer atômica.
        throw new MoveDestinationRetainedError(
          ARCHIVE_MESSAGES.copiedButStagedSourceRetained(
            src,
            dest,
            stagedSource,
            errorMessage(cleanupError)
          )
        );
      }
    } else {
      throw err;
    }
  }
}

/**
 * Recusa o destino do archive quando qualquer entrada (inclusive um link
 * simbólico pendente) já o ocupa.
 */
async function assertArchiveDestinationAvailable(
  archivePath: string,
  archiveName: string
): Promise<void> {
  let occupied = true;
  try {
    await fs.lstat(archivePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
    occupied = false;
  }
  if (occupied) {
    throw new Error(ARCHIVE_MESSAGES.archiveAlreadyExists(archiveName));
  }
}

function archiveClaimPath(archivePath: string, _archiveName: string): string {
  return path.join(path.dirname(archivePath), '.openspec-archive.lock');
}

interface ArchiveClaim {
  handle: Awaited<ReturnType<typeof fs.open>>;
  contents: string;
}

async function releaseArchiveClaim(
  claim: ArchiveClaim,
  claimPath: string
): Promise<void> {
  const owned = await claim.handle.stat({ bigint: true }).catch(() => undefined);
  await claim.handle.close().catch(() => undefined);
  if (owned === undefined) return;
  try {
    // Leitura entre dois lstat de propósito: a comparação de identidade +
    // conteúdo abaixo prova que ainda somos donos deste claim antes de removê-lo.
    // É um detector de alteração concorrente, não uma race sem fd a "corrigir"
    // (CodeQL js/file-system-race).
    const current = await fs.lstat(claimPath, { bigint: true });
    const contents = await fs.readFile(claimPath, 'utf8');
    const currentAfterRead = await fs.lstat(claimPath, { bigint: true });
    if (
      current.dev === owned.dev &&
      current.ino === owned.ino &&
      current.dev === currentAfterRead.dev &&
      current.ino === currentAfterRead.ino &&
      contents === claim.contents
    ) {
      await fs.unlink(claimPath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function claimArchiveDestination(
  archivePath: string,
  archiveName: string
): Promise<ArchiveClaim> {
  const claimPath = archiveClaimPath(archivePath, archiveName);
  try {
    const handle = await fs.open(claimPath, 'wx');
    const claim = {
      handle,
      contents: JSON.stringify({ pid: process.pid, nonce: randomUUID() }),
    };
    try {
      await handle.writeFile(claim.contents);
      await handle.sync();
      return claim;
    } catch (error) {
      await releaseArchiveClaim(claim, claimPath).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(ARCHIVE_MESSAGES.archiveBeingCreated(archiveName, claimPath));
    }
    throw error;
  }
}

interface SpecSnapshot {
  target: string;
  existed: boolean;
  outcome: 'write' | 'retire';
  expectedContent?: Buffer;
  content?: Buffer;
  contentExisted?: boolean;
  mode?: number;
  symlink?: string;
  displacedPath?: string;
  displacedFingerprint?: string;
}

interface SpecMutation {
  update: SpecUpdate;
  outcome: 'write' | 'retire';
  rebuilt: string;
}

function statIdentity(value: {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
}): string {
  return `${value.dev}:${value.ino}:${value.mode}:${value.size}:${value.mtimeNs}:${value.ctimeNs}`;
}

function movableStatIdentity(value: {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
}): string {
  return `${value.dev}:${value.ino}:${value.mode}:${value.size}`;
}

async function fingerprintPath(filePath: string): Promise<string> {
  try {
    const stat = await fs.lstat(filePath, { bigint: true });
    const digest = async (): Promise<string> =>
      createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
    if (stat.isSymbolicLink()) {
      const link = await fs.readlink(filePath);
      try {
        const referentBefore = await fs.stat(filePath, { bigint: true });
        const hash = await digest();
        const referentAfter = await fs.stat(filePath, { bigint: true });
        const entryAfter = await fs.lstat(filePath, { bigint: true });
        if (
          statIdentity(stat) !== statIdentity(entryAfter) ||
          statIdentity(referentBefore) !== statIdentity(referentAfter) ||
          link !== (await fs.readlink(filePath))
        ) {
          throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(filePath));
        }
        return `symlink:${statIdentity(stat)}:${link}:${statIdentity(referentAfter)}:${hash}`;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return `symlink:${statIdentity(stat)}:${link}:missing`;
        }
        throw error;
      }
    }
    if (stat.isFile()) {
      const hash = await digest();
      const after = await fs.lstat(filePath, { bigint: true });
      if (statIdentity(stat) !== statIdentity(after)) {
        throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(filePath));
      }
      return `file:${statIdentity(after)}:${hash}`;
    }
    return `other:${statIdentity(stat)}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

async function fingerprintMovablePath(filePath: string): Promise<string> {
  try {
    const entry = await fs.lstat(filePath, { bigint: true });
    // stat -> read -> re-stat deliberado: uma alteração concorrente é DETECTADA
    // pela comparação de statIdentity abaixo e lança erro. Não colapsar em I/O
    // por fd, que fixaria um único inode e cegaria o detector
    // (CodeQL js/file-system-race).
    const hash = createHash('sha256')
      .update(await fs.readFile(filePath))
      .digest('hex');
    if (entry.isSymbolicLink()) {
      const link = await fs.readlink(filePath);
      const referent = await fs.stat(filePath, { bigint: true });
      const entryAfter = await fs.lstat(filePath, { bigint: true });
      const referentAfter = await fs.stat(filePath, { bigint: true });
      const linkAfter = await fs.readlink(filePath);
      if (
        statIdentity(entry) !== statIdentity(entryAfter) ||
        statIdentity(referent) !== statIdentity(referentAfter) ||
        link !== linkAfter
      ) {
        throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(filePath));
      }
      return (
        `symlink:${movableStatIdentity(entry)}:${link}:` +
        `${movableStatIdentity(referentAfter)}:${hash}`
      );
    }
    const entryAfter = await fs.lstat(filePath, { bigint: true });
    if (statIdentity(entry) !== statIdentity(entryAfter)) {
      throw new Error(ARCHIVE_MESSAGES.pathChangedWhileReading(filePath));
    }
    return `file:${movableStatIdentity(entry)}:${hash}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

async function fingerprintPortableContent(filePath: string): Promise<string> {
  try {
    const entry = await fs.lstat(filePath);
    // Hash de conteúdo pontual de propósito (sem re-stat): os chamadores o
    // comparam com um fingerprint anterior dos mesmos bytes, então qualquer
    // alteração concorrente aparece como divergência de hash
    // (CodeQL js/file-system-race é falso positivo aqui).
    const hash = createHash('sha256')
      .update(await fs.readFile(filePath))
      .digest('hex');
    return entry.isSymbolicLink()
      ? `symlink:${await fs.readlink(filePath)}:${hash}`
      : `file:${hash}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

/** Falha fechado se os metadados que autorizam uma aposentadoria saírem do snapshot. */
async function assertRetirementAuthorization(
  changeDir: string,
  expectedFingerprint: string,
  options: { verifyMarker?: boolean } = {}
): Promise<void> {
  const metadataPath = path.join(changeDir, METADATA_FILENAME);
  const before = await fingerprintPortableContent(metadataPath);
  const markerStillDeclared =
    options.verifyMarker === false || readRetireCapabilitiesMarker(changeDir).declared;
  const after = await fingerprintPortableContent(metadataPath);
  if (
    before !== expectedFingerprint ||
    after !== expectedFingerprint ||
    !markerStillDeclared
  ) {
    throw new Error(
      ARCHIVE_MESSAGES.retirementAuthorizationChangedBeforeComplete(METADATA_FILENAME)
    );
  }
}

async function fingerprintSpecInputs(update: SpecUpdate): Promise<string> {
  return `${await fingerprintPath(update.source)}\n${await fingerprintPath(update.target)}`;
}

async function mutationTargetIdentity(mutation: SpecMutation): Promise<string> {
  try {
    const stat = await fs.stat(mutation.update.target, { bigint: true });
    return `${stat.dev}:${stat.ino}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const parent = path.dirname(mutation.update.target);
      const realParent = await fs.realpath(parent).catch(() => path.resolve(parent));
      return `missing:${path.join(realParent, path.basename(mutation.update.target))}`;
    }
    throw error;
  }
}

async function assertDistinctMutationTargets(mutations: SpecMutation[]): Promise<void> {
  const owners = new Map<string, string>();
  for (const mutation of mutations) {
    const identity = await mutationTargetIdentity(mutation);
    const existing = owners.get(identity);
    if (existing !== undefined) {
      throw new Error(
        ARCHIVE_MESSAGES.specUpdatesResolveToSameTarget(existing, mutation.update.id, identity)
      );
    }
    owners.set(identity, mutation.update.id);
  }
}

async function captureSpecSnapshots(mutations: SpecMutation[]): Promise<SpecSnapshot[]> {
  return Promise.all(
    mutations.map(async ({ update, outcome, rebuilt }) => {
      try {
        const stat = await fs.lstat(update.target);
        if (stat.isSymbolicLink()) {
          let content: Buffer | undefined;
          let contentExisted = false;
          if (outcome === 'write') {
            try {
              // Snapshot de rollback best-effort; uma edição concorrente é pega
              // depois, quando restoreSpecSnapshots se recusa a sobrescrever
              // conteúdo divergente, não aqui (CodeQL js/file-system-race).
              content = await fs.readFile(update.target);
              contentExisted = true;
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
            }
          }
          return {
            target: update.target,
            existed: true,
            outcome,
            ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
            content,
            contentExisted,
            symlink: await fs.readlink(update.target),
          };
        }
        return {
          target: update.target,
          existed: true,
          outcome,
          ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
          // Leitura de snapshot para rollback; restoreSpecSnapshots reconfere
          // este conteúdo antes de restaurar, então uma alteração no meio da
          // execução aborta em vez de sobrescrever (CodeQL js/file-system-race).
          ...(stat.isFile() ? { content: await fs.readFile(update.target) } : {}),
          ...(stat.isFile() ? { mode: stat.mode } : {}),
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            target: update.target,
            existed: false,
            outcome,
            ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
          };
        }
        throw error;
      }
    })
  );
}

async function restoreSpecSnapshots(snapshots: SpecSnapshot[]): Promise<void> {
  const errors: Error[] = [];
  for (const snapshot of [...snapshots].reverse()) {
    try {
      if (snapshot.outcome === 'retire') {
        if (snapshot.displacedPath !== undefined) {
          try {
            await fs.lstat(snapshot.target);
            throw new Error(
              ARCHIVE_MESSAGES.rollbackWouldOverwriteConcurrentRetained(
                snapshot.target,
                snapshot.displacedPath
              )
            );
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
          await fs.rename(snapshot.displacedPath, snapshot.target);
          snapshot.displacedPath = undefined;
          continue;
        }
        try {
          const current = await fs.lstat(snapshot.target);
          const unchangedSymlink =
            snapshot.symlink !== undefined &&
            current.isSymbolicLink() &&
            (await fs.readlink(snapshot.target)) === snapshot.symlink;
          // Relê para confirmar que o alvo ainda contém o conteúdo do snapshot;
          // uma divergência significa edição concorrente, e o rollback lança
          // erro abaixo em vez de sobrescrevê-la (CodeQL js/file-system-race é
          // intencional aqui).
          const unchangedFile =
            snapshot.symlink === undefined &&
            snapshot.content !== undefined &&
            current.isFile() &&
            (await fs.readFile(snapshot.target)).equals(snapshot.content);
          if (unchangedSymlink || unchangedFile) continue;
          throw new Error(ARCHIVE_MESSAGES.rollbackWouldOverwriteConcurrent(snapshot.target));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      } else {
        let current;
        try {
          current = await fs.lstat(snapshot.target);
        } catch (error) {
          if (
            (error as NodeJS.ErrnoException).code === 'ENOENT' &&
            !snapshot.existed
          ) {
            continue;
          }
          throw error;
        }
        if (
          (snapshot.symlink !== undefined &&
            (!current.isSymbolicLink() ||
              (await fs.readlink(snapshot.target)) !== snapshot.symlink)) ||
          (snapshot.symlink === undefined &&
            (!current.isFile() ||
              (snapshot.mode !== undefined && current.mode !== snapshot.mode)))
        ) {
          throw new Error(ARCHIVE_MESSAGES.rollbackWouldOverwriteConcurrent(snapshot.target));
        }
        // Releitura no rollback: só restaura quando o conteúdo atual bate com o
        // que o archive escreveu ou capturou no snapshot; caso contrário aborta
        // para preservar uma alteração concorrente (CodeQL js/file-system-race
        // é intencional aqui).
        const currentContent = await fs.readFile(snapshot.target);
        const originalContent =
          snapshot.symlink !== undefined && !snapshot.contentExisted
            ? undefined
            : snapshot.content;
        if (
          originalContent !== undefined &&
          currentContent.equals(originalContent)
        ) {
          continue;
        }
        if (
          snapshot.expectedContent === undefined ||
          !currentContent.equals(snapshot.expectedContent)
        ) {
          throw new Error(ARCHIVE_MESSAGES.rollbackWouldOverwriteConcurrent(snapshot.target));
        }
      }

      if (!snapshot.existed) {
        await fs.rm(snapshot.target, { force: true });
        continue;
      }
      if (snapshot.symlink !== undefined) {
        if (snapshot.outcome === 'retire') {
          await fs.mkdir(path.dirname(snapshot.target), { recursive: true });
          await fs.symlink(snapshot.symlink, snapshot.target);
        } else if (snapshot.contentExisted) {
          await fs.writeFile(snapshot.target, snapshot.content!);
        } else {
          const referent = path.resolve(path.dirname(snapshot.target), snapshot.symlink);
          await fs.rm(referent, { force: true });
        }
        continue;
      }
      if (snapshot.content !== undefined) {
        await fs.mkdir(path.dirname(snapshot.target), { recursive: true });
        await fs.writeFile(snapshot.target, snapshot.content);
        if (snapshot.mode !== undefined) await fs.chmod(snapshot.target, snapshot.mode);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.map(({ message }) => message).join(' '));
  }
}

async function finalizeRetirementBackups(
  snapshots: SpecSnapshot[],
  mainSpecsDir: string
): Promise<void> {
  const errors: string[] = [];
  for (const snapshot of snapshots) {
    if (snapshot.outcome !== 'retire' || snapshot.displacedPath === undefined) continue;
    const displacedPath = snapshot.displacedPath;
    try {
      if (
        snapshot.displacedFingerprint === undefined ||
        (await fingerprintMovablePath(displacedPath)) !== snapshot.displacedFingerprint
      ) {
        throw new Error(ARCHIVE_MESSAGES.displacedSpecChangedAfterVerification);
      }
      await finalizeRetiredSpec(snapshot.target, displacedPath, mainSpecsDir);
      snapshot.displacedPath = undefined;
    } catch (error) {
      errors.push(
        ARCHIVE_MESSAGES.couldNotRemoveRetirementBackup(displacedPath, errorMessage(error))
      );
    }
  }
  if (errors.length > 0) {
    throw new RetirementBackupsRetainedError(
      ARCHIVE_MESSAGES.changeRemainsArchivedBackupsRetained(errors.join(' '))
    );
  }
}

export class ArchiveCommand {
  async execute(
    changeName?: string,
    options: ArchiveOptions = {}
  ): Promise<void> {
    // Raiz absoluta: a transação abaixo compara e reporta caminhos de
    // rename/snapshot, e um caminho relativo ao cwd não bate com o que os
    // fingerprints e a verificação de destino resolvem.
    const targetPath = path.resolve('.');
    const changesDir = path.join(targetPath, 'openspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    const mainSpecsDir = path.join(targetPath, 'openspec', 'specs');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error(ARCHIVE_MESSAGES.noChangesDir);
    }

    // As raízes gerenciadas precisam ficar dentro da raiz do projeto — um
    // changes/, archive/ ou specs/ vinculado para fora é recusado antes de
    // qualquer movimentação.
    for (const [allowedDirectory, managedDir] of [
      [targetPath, changesDir],
      [changesDir, archiveDir],
      [targetPath, mainSpecsDir],
    ] as const) {
      try {
        FileSystemUtils.assertPathWithin(allowedDirectory, managedDir);
      } catch {
        throw new Error(ARCHIVE_MESSAGES.pathOutsideRoot(managedDir));
      }
    }

    // Get change name interactively if not provided
    if (!changeName) {
      const selectedChange = await this.selectChange(changesDir, options);
      if (!selectedChange) {
        console.log(ARCHIVE_MESSAGES.noChangeSelected);
        return;
      }
      changeName = selectedChange;
    }

    const changeNameProblem = folderStyleNameProblem(changeName, ID_MESSAGES.changeNameLabel);
    if (changeNameProblem) {
      throw new Error(changeNameProblem);
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists. Uma change que é ela mesma um link simbólico é
    // recusada: a transação abaixo depende de renomear e verificar o diretório
    // real, e um link moveria só o ponteiro.
    try {
      const stat = await fs.lstat(changeDir);
      if (stat.isSymbolicLink()) {
        throw new Error(ARCHIVE_MESSAGES.changeIsSymlink(changeName));
      }
      if (!stat.isDirectory()) {
        throw new Error(ARCHIVE_MESSAGES.changeNotFound(changeName));
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(ARCHIVE_MESSAGES.changeNotFound(changeName));
      }
      throw err;
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (non-blocking unless strict mode desired in future)
      const changeFile = path.join(changeDir, 'proposal.md');
      try {
        await fs.access(changeFile);
        const changeReport = await validator.validateChange(changeFile);
        // Proposal validation is informative only (do not block archive).
        // `validateChange` parses the change together with its delta specs,
        // so it also raises requirement-level issues under
        // `deltas.<n>.requirement(s)`. Those
        // are not proposal problems, and reporting them here was noisy and
        // sometimes wrong (#498): the change parser records every requirement
        // under both `requirement` and `requirements`, so each defect was
        // printed twice, and REMOVED requirements — names-only by design —
        // produced a "missing scenario" warning for a correct removal.
        // Genuine delta defects are still caught below, by the delta spec
        // validation and by the rebuilt-spec check that runs before any write.
        const proposalIssues = changeReport.issues.filter(
          (issue) => !/^deltas\.\d+\.requirements?\./.test(issue.path)
        );
        if (!changeReport.valid && proposalIssues.length > 0) {
          console.log(chalk.yellow(`\n${ARCHIVE_MESSAGES.proposalWarnings}`));
          for (const issue of proposalIssues) {
            const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
            console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
          }
        }
      } catch {
        // Change file doesn't exist, skip validation
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      // A spec.md at the specs/ root is never merged, so archiving a change
      // that has one drops its content whether or not it carries delta headers
      // (#1385). Its existence alone must run validation, which reports it and
      // blocks the archive. A directory named spec.md is a normal capability
      // folder, so only a regular file counts.
      const rootSpecStat = await fs.stat(path.join(changeSpecsDir, 'spec.md')).catch(() => null);
      let hasDeltaSpecs = rootSpecStat?.isFile() === true;
      // A change that declares skip_specs must not carry any file under
      // specs/ — validate reports that as a conflict, so archive has to run
      // the same check instead of skipping validation because the files
      // happen to have no delta headers. A marker that cannot be honored
      // (skip_specs mentioned but the metadata fails the shared shape, or
      // names a schema that does not resolve) also
      // forces validation, so archive and validate always agree about the
      // marker. Unreadable specs/ fails closed into validation too. (An
      // UNMARKED zero-delta change still archives with only non-blocking
      // proposal warnings — a gap that predates the marker and is left
      // unchanged here.)
      if (!hasDeltaSpecs) {
        const marker = readSkipSpecsMarker(changeDir);
        if (marker.invalidReason) {
          hasDeltaSpecs = true;
        } else if (marker.declared) {
          let specsDirHasFiles = true;
          try {
            specsDirHasFiles = await hasAnyFileUnder(changeSpecsDir);
          } catch {
            // fall through with true: let validation surface the conflict
          }
          hasDeltaSpecs = specsDirHasFiles;
        }
      }
      for (const { specFile } of hasDeltaSpecs ? [] : await discoverSpecFiles(changeSpecsDir)) {
        try {
          const content = await fs.readFile(specFile, 'utf-8');
          // Insensível a caixa para corresponder ao parser de delta, para que
          // um cabeçalho em minúsculas passe pela mesma validação de deltas
          // que o validate executa.
          if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/im.test(content)) {
            hasDeltaSpecs = true;
            break;
          }
        } catch {}
      }
      if (hasDeltaSpecs) {
        // No mainSpecsDir here on purpose: the scenario-loss check standalone
        // validate runs (#1477) is the same one buildUpdatedSpec enforces a few
        // steps later, and reporting it here would relabel that failure.
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationErrorsInDeltas}`));
          for (const issue of deltaReport.issues) {
            if (issue.level === 'ERROR') {
              console.log(chalk.red(`  ✗ ${issue.message}`));
            } else if (issue.level === 'WARNING') {
              console.log(chalk.yellow(`  ⚠ ${issue.message}`));
            }
          }
        }
      }

      if (hasValidationErrors) {
        console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationFailed}`));
        console.log(chalk.yellow(ARCHIVE_MESSAGES.skipValidationHint));
        process.exitCode = 1;
        return;
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();
      
      if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: chalk.yellow(ARCHIVE_MESSAGES.skipValidationWarning),
            default: false
          },
          () => ARCHIVE_MESSAGES.blockedSkipValidation(rerunCommand(changeName!, options))
        );
        if (!proceed) {
          console.log(ARCHIVE_MESSAGES.archiveCancelled);
          return;
        }
      } else {
        console.log(chalk.yellow(`\n${ARCHIVE_MESSAGES.skipValidationFlagWarning}`));
      }
      
      console.log(chalk.yellow(ARCHIVE_MESSAGES.skipValidationLog(timestamp, changeName)));
      console.log(chalk.yellow(ARCHIVE_MESSAGES.affectedFiles(changeDir)));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName, path.resolve(changesDir, '..', '..'));
    const status = formatTaskStatus(progress);
    console.log(ARCHIVE_MESSAGES.taskStatus(status));

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: ARCHIVE_MESSAGES.incompleteTasksWarning(incompleteTasks),
            default: false
          },
          () =>
            ARCHIVE_MESSAGES.blockedIncompleteTasks(
              incompleteTasks,
              describeChangeName(changeName!),
              rerunCommand(changeName!, options)
            )
        );
        if (!proceed) {
          console.log(ARCHIVE_MESSAGES.archiveCancelled);
          return;
        }
      } else {
        console.log(ARCHIVE_MESSAGES.incompleteTasksContinuing(incompleteTasks));
      }
    }

    // Resolve o destino do archive ANTES de tocar em qualquer spec. O nome
    // depende só da change, e uma colisão é rotina (arquivar duas vezes no
    // mesmo dia, uma change restaurada), então descobri-la depois da mesclagem
    // deixaria specs reescritos - ou uma capability aposentada - para um
    // archive que nunca aconteceu.
    //
    // Nomes que já carregam um prefixo de data o mantêm: re-prefixar
    // gaguejaria o nome, e quando o archive roda num dia posterior a pasta
    // ficaria ordenada sob um dia em que a change não aconteceu (#1309).
    const archiveName = ARCHIVE_DATE_PREFIX_PATTERN.test(changeName)
      ? changeName
      : `${formatLocalDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Lido uma vez, antes de qualquer spec ser tocado: se esta change pode
    // aposentar uma capability. Um marcador não honrável conta como não
    // declarado, exatamente como skip_specs trata um, para que metadados que o
    // resto da CLI rejeita nunca possam autorizar uma exclusão.
    const retirementMarker = readRetireCapabilitiesMarker(changeDir);
    const retirementDeclared = retirementMarker.declared;
    const retirementAuthorizationFingerprint = retirementDeclared
      ? await fingerprintPortableContent(path.join(changeDir, METADATA_FILENAME))
      : undefined;

    await assertArchiveDestinationAvailable(archivePath, archiveName);
    await fs.mkdir(archiveDir, { recursive: true });
    const claimPath = archiveClaimPath(archivePath, archiveName);
    let archiveClaim: ArchiveClaim | undefined;

    try {
      let changeArchived = false;

      // Handle spec updates unless skipSpecs flag is set
      if (options.skipSpecs) {
        console.log(ARCHIVE_MESSAGES.skipSpecUpdates);
      } else {
        // Find specs to update
        const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);

        if (specUpdates.length > 0) {
          console.log(`\n${ARCHIVE_MESSAGES.specsToUpdate}`);
          for (const update of specUpdates) {
            const status = update.exists ? ARCHIVE_MESSAGES.actionUpdate : ARCHIVE_MESSAGES.actionCreate;
            const capability = update.id;
            console.log(ARCHIVE_MESSAGES.specUpdateStatus(capability, status));
          }

          // Monta as atualizações propostas antes de pedir permissão para
          // aplicá-las. buildUpdatedSpec também reporta conteúdo que a mesclagem
          // descartaria, então a confirmação deve vir depois desta prévia.
          const prepared: Array<{
            update: SpecUpdate;
            rebuilt: string;
            counts: { added: number; modified: number; removed: number; renamed: number };
            outcome: SpecOutcome;
            noRequirementBlocks: boolean;
            unaccountedContent: string[];
            sourceFingerprint: string;
            sourceContentFingerprint: string;
            targetFingerprint: string;
            targetMovableFingerprint: string;
          }> = [];
          const specWarnings: string[] = [];
          let prepareError: unknown;
          try {
            for (const update of specUpdates) {
              const sourceBeforeBuild = await fingerprintPath(update.source);
              const targetBeforeBuild = await fingerprintPath(update.target);
              const built = await buildUpdatedSpec(update, changeName!, { silent: true });
              const sourceAfterBuild = await fingerprintPath(update.source);
              const targetAfterBuild = await fingerprintPath(update.target);
              if (
                sourceBeforeBuild !== sourceAfterBuild ||
                targetBeforeBuild !== targetAfterBuild
              ) {
                throw new Error(ARCHIVE_MESSAGES.specInputsChangedWhilePreparing(update.id));
              }
              prepared.push({
                update,
                rebuilt: built.rebuilt,
                counts: built.counts,
                outcome: await decideSpecOutcome(
                  update,
                  built,
                  skipValidation,
                  retirementDeclared
                ),
                noRequirementBlocks: built.noRequirementBlocks,
                unaccountedContent: built.unaccountedContent,
                sourceFingerprint: sourceAfterBuild,
                sourceContentFingerprint: await fingerprintPortableContent(update.source),
                targetFingerprint: targetAfterBuild,
                targetMovableFingerprint: await fingerprintMovablePath(update.target),
              });
              specWarnings.push(...built.warnings);
            }
          } catch (err: unknown) {
            // O usuário ainda pode recusar as atualizações de spec e arquivar a
            // change, como antes desta prévia existir. Adia o erro até ele aceitar.
            prepareError = err;
          }
          if (prepareError === undefined) {
            for (const warning of specWarnings) {
              console.log(chalk.yellow(SPECS_APPLY_MESSAGES.warning(warning)));
            }
          }

          let shouldUpdateSpecs = true;
          if (!options.yes) {
            shouldUpdateSpecs = await confirmOrBlock(
              {
                message: ARCHIVE_MESSAGES.proceedWithSpecUpdates,
                default: true
              },
              () =>
                ARCHIVE_MESSAGES.blockedSpecUpdatesConfirmation(
                  specUpdates.length,
                  rerunCommand(changeName!, options)
                )
            );
            if (!shouldUpdateSpecs) {
              console.log(ARCHIVE_MESSAGES.skipSpecUpdatesProceeding);
            }
          }

          if (shouldUpdateSpecs) {
            // A confirmação pode ficar aberta enquanto outro editor altera um
            // spec principal. Nunca aplicar a proposta montada antes do prompt
            // sobre uma base mais nova: em particular, uma decisão de
            // aposentadoria obsoleta não pode excluir um requisito adicionado
            // enquanto o prompt esperava.
            if (prepareError === undefined) {
              try {
                const currentRetirementMarker = readRetireCapabilitiesMarker(changeDir);
                if (
                  currentRetirementMarker.declared !== retirementMarker.declared ||
                  currentRetirementMarker.invalidReason !== retirementMarker.invalidReason
                ) {
                  throw new Error(
                    ARCHIVE_MESSAGES.retirementAuthorizationChangedAtPrompt(METADATA_FILENAME)
                  );
                }
                const currentUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
                const currentById = new Map(currentUpdates.map((update) => [update.id, update]));
                if (currentUpdates.length !== prepared.length) {
                  throw new Error(ARCHIVE_MESSAGES.changeSpecsChangedAtPrompt);
                }
                for (const proposed of prepared) {
                  const current = currentById.get(proposed.update.id);
                  if (!current) {
                    throw new Error(ARCHIVE_MESSAGES.deltaChangedAtPrompt(proposed.update.id));
                  }
                  if (
                    (await fingerprintPath(current.source)) !== proposed.sourceFingerprint ||
                    (await fingerprintPath(current.target)) !== proposed.targetFingerprint
                  ) {
                    throw new Error(ARCHIVE_MESSAGES.specInputsChangedAtPrompt(proposed.update.id));
                  }
                  const rebuilt = await buildUpdatedSpec(current, changeName!, { silent: true });
                  const outcome = await decideSpecOutcome(
                    current,
                    rebuilt,
                    skipValidation,
                    retirementDeclared
                  );
                  if (
                    current.exists !== proposed.update.exists ||
                    rebuilt.rebuilt !== proposed.rebuilt ||
                    JSON.stringify(rebuilt.counts) !== JSON.stringify(proposed.counts) ||
                    outcome !== proposed.outcome
                  ) {
                    throw new Error(ARCHIVE_MESSAGES.mainSpecChangedAtPrompt(proposed.update.id));
                  }
                }
              } catch (error) {
                prepareError = error;
              }
            }

            if (prepareError !== undefined) {
              const message =
                prepareError instanceof Error ? prepareError.message : String(prepareError);
              console.log(message);
              console.log(ARCHIVE_MESSAGES.abortedNoChanges);
              process.exitCode = 1;
              return;
            }

            // Valida todo spec reconstruído antes de escrever qualquer um deles,
            // para que uma falha tardia de validação realmente deixe todos os
            // alvos inalterados.
            if (!skipValidation) {
              for (const p of prepared) {
                // Uma aposentadoria já foi submetida ao validador e falhou só em
                // "sem requisitos" - não sobrou spec a escrever, então reportar
                // esse erro de novo só abortaria o conserto (#1302).
                if (p.outcome !== 'write') continue;
                const specName = p.update.id;
                const report = await new Validator().validateSpecContent(specName, p.rebuilt);
                if (!report.valid) {
                  // Esta execução foi o que esvaziou a capability, e "sem
                  // requisitos" é a única coisa errada com o spec que seria
                  // escrito - então aposentá-la é o que o archive faria, e o que
                  // impede isso vale a pena dizer. Nem sempre é o *único*
                  // conserto: um requisito vivo pode estar escondido numa
                  // segunda seção `## Requirements` que o validador nunca
                  // alcança, e mesclar as seções conserta esse spec sem exclusão.
                  const emptiedByThisRun =
                    p.update.exists &&
                    p.counts.removed > 0 &&
                    p.noRequirementBlocks &&
                    (await isRetirableSpec(specName, p.rebuilt));
                  // O beco sem saída de #1302: o spec reconstruído é
                  // inescrevível por exatamente uma razão, e aposentar a
                  // capability é o conserto - mas só o autor pode autorizar a
                  // exclusão do spec, então o abort nomeia o marcador em vez de
                  // só rejeitar. Só quando o marcador é a ÚNICA coisa faltando,
                  // para nunca mandar alguém atrás de um marcador que não teria
                  // ajudado.
                  const retirementHint =
                    !retirementDeclared && emptiedByThisRun && p.unaccountedContent.length === 0
                      ? ARCHIVE_MESSAGES.retirementHint(specName, METADATA_FILENAME) +
                        (retirementMarker.invalidReason
                          ? ARCHIVE_MESSAGES.retirementMarkerCannotBeHonored(
                              retirementMarker.invalidReason
                            )
                          : '')
                      : undefined;
                  // #1696: o marcador está ausente E o arquivo contém conteúdo
                  // que uma aposentadoria não consegue contabilizar, então este
                  // abort não dizia nada - só "deve ter pelo menos um
                  // requisito", sem caminho adiante. Nomeia o conteúdo em vez
                  // do marcador, de propósito: o marcador só é nomeado quando
                  // adicioná-lo realmente deixaria o archive passar, e aqui não
                  // deixaria. Resolvido o conteúdo, a reexecução nomeia o marcador.
                  const blockedRetirementHint =
                    !retirementDeclared && emptiedByThisRun && p.unaccountedContent.length > 0
                      ? ARCHIVE_MESSAGES.retirementBlockedByContent(
                          specName,
                          describeUnaccountedContent(p.unaccountedContent)
                        ) +
                        // Dito aqui também, porque um autor olhando para um
                        // marcador que acredita autorizar a exclusão não
                        // deveria ter de limpar o conteúdo primeiro para
                        // descobrir que ele nunca foi lido.
                        (retirementMarker.invalidReason
                          ? ARCHIVE_MESSAGES.retirementMarkerCannotBeHonored(
                              retirementMarker.invalidReason
                            )
                          : '')
                      : undefined;
                  // O marcador foi definido e a aposentadoria ainda assim foi
                  // recusada. Não dizer nada deixava o autor que fez exatamente
                  // o que a documentação pediu de volta no beco sem saída
                  // original, sem sinal de que seu marcador foi lido. Nomeia
                  // as linhas que ficaram no caminho.
                  const refusalReason =
                    retirementDeclared &&
                    p.unaccountedContent.length > 0 &&
                    (await isRetirableSpec(specName, p.rebuilt))
                      ? ARCHIVE_MESSAGES.retirementRefused(
                          specName,
                          describeUnaccountedContent(p.unaccountedContent)
                        )
                      : undefined;
                  console.log(chalk.red(`\n${ARCHIVE_MESSAGES.validationErrorsInRebuiltSpec(specName)}`));
                  for (const issue of report.issues) {
                    if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                    else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                  }
                  if (retirementHint) console.log(chalk.yellow(`  → ${retirementHint}`));
                  if (blockedRetirementHint) console.log(chalk.yellow(`  → ${blockedRetirementHint}`));
                  if (refusalReason) console.log(chalk.yellow(`  → ${refusalReason}`));
                  console.log(ARCHIVE_MESSAGES.abortedNoChanges);
                  process.exitCode = 1;
                  return;
                }
              }
            }

            // Um archive concorrente legítimo não passa pelo claim exclusivo,
            // enquanto isto pega um processo externo que criou o destino final
            // durante o prompt de confirmação. Verifica antes da primeira
            // mutação de spec, para que uma colisão nunca deixe uma escrita ou
            // aposentadoria órfã.
            await assertArchiveDestinationAvailable(archivePath, archiveName);
            archiveClaim = await claimArchiveDestination(archivePath, archiveName);
            await assertArchiveDestinationAvailable(archivePath, archiveName);
            const mutations: SpecMutation[] = prepared
              .filter(
                ({ outcome, counts }) =>
                  outcome === 'retire' ||
                  (outcome === 'write' &&
                    counts.added + counts.modified + counts.removed + counts.renamed > 0)
              )
              .map(({ update, outcome, rebuilt }) => ({
                update,
                outcome: outcome as 'write' | 'retire',
                rebuilt,
              }));
            const hasRetirements = mutations.some(({ outcome }) => outcome === 'retire');
            await assertDistinctMutationTargets(mutations);
            for (const proposed of prepared) {
              if (
                (await fingerprintPath(proposed.update.source)) !== proposed.sourceFingerprint ||
                (await fingerprintPath(proposed.update.target)) !== proposed.targetFingerprint
              ) {
                throw new Error(ARCHIVE_MESSAGES.specInputsChangedBeforeApply(proposed.update.id));
              }
            }
            const specSnapshots = await captureSpecSnapshots(mutations);
            const specSnapshotsByTarget = new Map(
              specSnapshots.map((snapshot) => [snapshot.target, snapshot])
            );

            const mutationAttempts = new Set<string>();
            try {
              // All validations passed; write files and display counts
              const writeTotals = { added: 0, modified: 0, removed: 0, renamed: 0 };
              let wroteAny = false;
              for (const p of prepared) {
                // As exclusões ficam adiadas para o loop abaixo.
                if (p.outcome !== 'write') continue;
                const { added, modified, removed, renamed } = p.counts;
                if (added + modified + removed + renamed === 0) {
                  // Toda operação já estava sincronizada: reescrever o arquivo só
                  // despejaria diferenças de normalização nele.
                  continue;
                }
                await writeUpdatedSpec(p.update, p.rebuilt, p.counts, {
                  beforeMutate: async () => {
                    if (
                      (await fingerprintSpecInputs(p.update)) !==
                      `${p.sourceFingerprint}\n${p.targetFingerprint}`
                    ) {
                      throw new Error(ARCHIVE_MESSAGES.specInputsChangedBeforeWrite(p.update.id));
                    }
                    mutationAttempts.add(p.update.target);
                  },
                });
                wroteAny = true;
                writeTotals.added += added;
                writeTotals.modified += modified;
                writeTotals.removed += removed;
                writeTotals.renamed += renamed;
              }

              // As aposentadorias rodam só depois de toda escrita ter dado
              // certo. Se qualquer mutação posterior falhar, os snapshots abaixo
              // restauram todos os alvos.
              for (const p of prepared) {
                if (p.outcome !== 'retire') continue;
                const { retired, resolvedPath, displacedPath } = await retireSpec(
                  p.update,
                  mainSpecsDir,
                  {
                    deferDelete: true,
                    beforeMutate: async () => {
                      if (retirementAuthorizationFingerprint === undefined) {
                        throw new Error(
                          ARCHIVE_MESSAGES.retirementAuthorizationUnavailable(METADATA_FILENAME)
                        );
                      }
                      await assertRetirementAuthorization(
                        changeDir,
                        retirementAuthorizationFingerprint
                      );
                      if (
                        (await fingerprintSpecInputs(p.update)) !==
                        `${p.sourceFingerprint}\n${p.targetFingerprint}`
                      ) {
                        throw new Error(ARCHIVE_MESSAGES.specInputsChangedBeforeRetire(p.update.id));
                      }
                      mutationAttempts.add(p.update.target);
                    },
                    verifyDisplaced: async (displacedPath) => {
                      await assertRetirementAuthorization(
                        changeDir,
                        retirementAuthorizationFingerprint!
                      );
                      if (
                        (await fingerprintMovablePath(displacedPath)) !==
                        p.targetMovableFingerprint
                      ) {
                        throw new Error(ARCHIVE_MESSAGES.mainSpecChangedWhileSecuring(p.update.id));
                      }
                    },
                  }
                );
                if (!retired) continue;
                const retirementSnapshot = specSnapshotsByTarget.get(p.update.target);
                if (retirementSnapshot === undefined || displacedPath === undefined) {
                  throw new Error(ARCHIVE_MESSAGES.couldNotTrackDisplacedSpec(p.update.id));
                }
                retirementSnapshot.displacedPath = displacedPath;
                retirementSnapshot.displacedFingerprint = p.targetMovableFingerprint;
                wroteAny = true;
                // Um rename aplicado a caminho da aposentadoria aconteceu mesmo
                // assim; somar todas as contagens mantém os totais honestos
                // sobre o delta inteiro.
                writeTotals.added += p.counts.added;
                writeTotals.modified += p.counts.modified;
                writeTotals.removed += p.counts.removed;
                writeTotals.renamed += p.counts.renamed;
                // `update.target` é montado a partir do id da capability, então
                // num sistema de arquivos insensível a caixa pode diferir em
                // caixa do arquivo realmente desvinculado - e o git é sensível
                // a caixa, então o comando impresso seria um que o git rejeita.
                // Um diretório de capability linkado a um irmão tem o mesmo
                // problema sem sair da árvore. `resolvedPath` carrega o caminho
                // resolvido, então vence sempre que discorda, não só quando
                // escapa.
                const unlinkedPath = resolvedPath ?? p.update.target;
                // Medido contra a raiz REAL, para que o link `/var` ->
                // `/private/var` da própria plataforma não pareça uma fuga. Um
                // caminho que de fato fica fora continua absoluto, que é o que
                // o encaminha para orientação em prosa em vez de um comando que
                // o git rejeitaria.
                const realRoot = await fs.realpath(targetPath).catch(() => path.resolve(targetPath));
                const relativeToRoot = path.relative(realRoot, unlinkedPath);
                const insideRoot =
                  relativeToRoot !== '' &&
                  !relativeToRoot.startsWith('..') &&
                  !path.isAbsolute(relativeToRoot);
                const deletedPath = !insideRoot
                  ? unlinkedPath
                  : relativeToRoot.split(path.sep).join('/');
                // Um comando só é oferecido quando colá-lo onde o archive rodou
                // funcionaria de fato. Um caminho absoluto aqui significa que o
                // arquivo não vivia sob esse diretório - um diretório de
                // capability linkado - e `git checkout HEAD -- <abs>` é
                // rejeitado a partir de outra worktree seja como for citado,
                // então esse caso recebe orientação em vez de um comando que
                // não roda. Um caminho sem grafia portável de shell é tratado
                // do mesmo jeito.
                //
                // Condicional de propósito, também: se o arquivo está no `HEAD`
                // não é algo que o archive saiba - um spec que um archive
                // anterior CRIOU e ninguém commitou ainda não está - e prometer
                // recuperação é a única afirmação que este recurso não pode
                // errar.
                const pasteablePath = path.isAbsolute(deletedPath)
                  ? undefined
                  : quoteForShell(`:(top)${deletedPath}`);
                const recovery = pasteablePath
                  ? ARCHIVE_MESSAGES.retirementRecoveryCommand(pasteablePath)
                  : ARCHIVE_MESSAGES.retirementRecoveryGuidance(deletedPath);
                // A linha "Aposentando ..." já disse a um humano que o arquivo
                // se foi; como recuperá-lo é a parte que não dá para ver pelo
                // caminho.
                console.log(`   ${recovery}`);
              }

              console.log(
                ARCHIVE_MESSAGES.totals(
                  writeTotals.added,
                  writeTotals.modified,
                  writeTotals.removed,
                  writeTotals.renamed
                )
              );
              console.log(
                wroteAny
                  ? ARCHIVE_MESSAGES.specsUpdatedSuccessfully
                  : ARCHIVE_MESSAGES.specsAlreadyInSync
              );

              for (const proposed of prepared) {
                if (
                  (await fingerprintPath(proposed.update.source)) !==
                  proposed.sourceFingerprint
                ) {
                  throw new Error(ARCHIVE_MESSAGES.deltaChangedBeforeArchive(proposed.update.id));
                }
              }
              if (hasRetirements) {
                await assertRetirementAuthorization(
                  changeDir,
                  retirementAuthorizationFingerprint!
                );
              }
              const verifyArchivedDeltas = async (
                stagedSource?: string
              ): Promise<void> => {
                if (hasRetirements) {
                  await assertRetirementAuthorization(
                    archivePath,
                    retirementAuthorizationFingerprint!,
                    // Changes arquivadas ficam um nível mais fundo que as
                    // ativas, então o leitor do marcador não consegue resolver
                    // o schema delas. A igualdade exata de conteúdo prova que
                    // esta é a autorização já validada no caminho ativo.
                    { verifyMarker: false }
                  );
                  if (stagedSource) {
                    await assertRetirementAuthorization(
                      stagedSource,
                      retirementAuthorizationFingerprint!
                    );
                  }
                }
                for (const proposed of prepared) {
                  const archivedSource = path.join(
                    archivePath,
                    path.relative(changeDir, proposed.update.source)
                  );
                  if (
                    (await fingerprintPortableContent(archivedSource)) !==
                    proposed.sourceContentFingerprint
                  ) {
                    throw new Error(
                      ARCHIVE_MESSAGES.archivedDeltaChangedDuringMove(proposed.update.id)
                    );
                  }
                  if (stagedSource) {
                    const stagedDelta = path.join(
                      stagedSource,
                      path.relative(changeDir, proposed.update.source)
                    );
                    if (
                      (await fingerprintPortableContent(stagedDelta)) !==
                      proposed.sourceContentFingerprint
                    ) {
                      throw new Error(
                        ARCHIVE_MESSAGES.activeDeltaChangedDuringFallbackCopy(proposed.update.id)
                      );
                    }
                  }
                }
              };
              await moveDirectory(changeDir, archivePath, {
                verifyCopiedDestination: verifyArchivedDeltas,
              });
              changeArchived = true;
              await verifyArchivedDeltas();
              await finalizeRetirementBackups(specSnapshots, mainSpecsDir);
            } catch (error) {
              if (error instanceof MoveDestinationRetainedError) {
                changeArchived = true;
                try {
                  await finalizeRetirementBackups(specSnapshots, mainSpecsDir);
                } catch (cleanupError) {
                  throw new RetirementBackupsRetainedError(
                    `${error.message} ${errorMessage(cleanupError)}`
                  );
                }
                throw error;
              }
              if (error instanceof RetirementBackupsRetainedError) throw error;
              const rollbackErrors: Error[] = [];
              try {
                await restoreSpecSnapshots(
                  specSnapshots.filter(({ target }) => mutationAttempts.has(target))
                );
              } catch (rollbackError) {
                rollbackErrors.push(
                  rollbackError instanceof Error
                    ? rollbackError
                    : new Error(String(rollbackError))
                );
              }
              if (changeArchived) {
                try {
                  await moveDirectory(archivePath, changeDir);
                  changeArchived = false;
                } catch (rollbackError) {
                  rollbackErrors.push(
                    rollbackError instanceof Error
                      ? rollbackError
                      : new Error(String(rollbackError))
                  );
                }
              }
              if (rollbackErrors.length > 0) {
                throw new Error(
                  ARCHIVE_MESSAGES.rollbackAlsoFailed(
                    errorMessage(error),
                    rollbackErrors.map(({ message }) => message).join(' ')
                  )
                );
              }
              throw error;
            }
          }
        }
      }

      // O destino foi verificado antes da mesclagem, então qualquer coisa que o
      // ocupe agora apareceu enquanto trabalhávamos. Reporta isso como a colisão
      // que é: um ENOTEMPTY cru do rename degradaria para um erro genérico.
      if (!changeArchived) {
        await assertArchiveDestinationAvailable(archivePath, archiveName);
        archiveClaim = await claimArchiveDestination(archivePath, archiveName);
        await assertArchiveDestinationAvailable(archivePath, archiveName);

        // Create archive directory if needed
        await fs.mkdir(archiveDir, { recursive: true });

        // Move change to archive (uses copy+remove on EPERM/EXDEV, e.g. Windows)
        await moveDirectory(changeDir, archivePath);
        changeArchived = true;
      }

      console.log(ARCHIVE_MESSAGES.changeArchived(changeName, archiveName));
    } finally {
      if (archiveClaim) await releaseArchiveClaim(archiveClaim, claimPath).catch(() => undefined);
    }
  }

  private async selectChange(changesDir: string, options: ArchiveOptions): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();

    if (changeDirs.length === 0) {
      console.log(ARCHIVE_MESSAGES.noActiveChanges);
      return null;
    }

    // O seletor precisa de um terminal real, e o `select` do @inquirer
    // escreve escapes ANSI de cursor no stdout mesmo quando redirecionado — o
    // mesmo mecanismo do #1526 corrigido nos prompts de confirmação. Quando
    // qualquer um dos streams não é TTY, recusa de antemão com a orientação
    // que o ExitPromptError capturado daria, em vez de renderizar um menu
    // cheio de escapes dentro de um pipe ou arquivo.
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error(
        ARCHIVE_MESSAGES.blockedChangeNameRequiredNoTerminal(
          `openspec archive <nome-da-alteração> ${rerunFlags(options).join(' ')}`
        )
      );
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id, path.resolve(changesDir, '..', '..'));
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: ARCHIVE_MESSAGES.selectChangeToArchive,
        choices
      });
      return answer;
    } catch (error) {
      // Ninguém para escolher da lista: reportar "Nenhuma alteração
      // selecionada" e sair 0 dizia a um agente que o arquivamento teve
      // sucesso quando nada aconteceu (#1479). A reexecução sugerida carrega
      // --yes porque o mesmo chamador não consegue responder às confirmações
      // mais adiante, e carrega as flags do próprio chamador porque descartar
      // --skip-specs aqui sugeriria uma reexecução que mescla os specs que
      // ela foi passada para deixar intocados.
      if (isNonInteractivePromptError(error)) {
        throw new Error(
          ARCHIVE_MESSAGES.blockedChangeNameRequired(
            `openspec archive <nome-da-alteração> ${rerunFlags(options).join(' ')}`
          )
        );
      }
      // User cancelled (Ctrl+C)
      return null;
    }
  }
}

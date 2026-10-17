import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import ora from 'ora';
import { stringify as stringifyYaml, parseDocument, isMap } from 'yaml';
import {
  getSchemaDir,
  getProjectSchemasDir,
  getUserSchemasDir,
  getPackageSchemasDir,
  isSchemaDir,
  listSchemas,
} from '../core/artifact-graph/resolver.js';
import { parseSchema, SchemaValidationError } from '../core/artifact-graph/schema.js';
import type { SchemaYaml, Artifact } from '../core/artifact-graph/types.js';
import { resolveConfigFilePath } from '../core/project-config.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { SCHEMA_MESSAGES, CLI_MESSAGES, CONFIG_MESSAGES } from '../messages/index.js';
import { ptBrKeysHelpTip } from '../prompts/keys-help-tip.js';

/**
 * Schema source location type
 */
type SchemaSource = 'project' | 'user' | 'package';

/**
 * Result of checking a schema location
 */
interface SchemaLocation {
  source: SchemaSource;
  path: string;
  exists: boolean;
}

/**
 * Schema resolution info with shadowing details
 */
interface SchemaResolution {
  name: string;
  source: SchemaSource;
  path: string;
  shadows: Array<{ source: SchemaSource; path: string }>;
}

/**
 * Validation issue structure
 */
interface ValidationIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

/**
 * Check all three locations for a schema and return which ones exist.
 */
function checkAllLocations(
  name: string,
  projectRoot: string
): SchemaLocation[] {
  const locations: SchemaLocation[] = [];

  // Project location
  const projectDir = path.join(getProjectSchemasDir(projectRoot), name);
  const projectSchemaPath = path.join(projectDir, 'schema.yaml');
  locations.push({
    source: 'project',
    path: projectDir,
    exists: fs.existsSync(projectSchemaPath),
  });

  // User location
  const userDir = path.join(getUserSchemasDir(), name);
  const userSchemaPath = path.join(userDir, 'schema.yaml');
  locations.push({
    source: 'user',
    path: userDir,
    exists: fs.existsSync(userSchemaPath),
  });

  // Package location
  const packageDir = path.join(getPackageSchemasDir(), name);
  const packageSchemaPath = path.join(packageDir, 'schema.yaml');
  locations.push({
    source: 'package',
    path: packageDir,
    exists: fs.existsSync(packageSchemaPath),
  });

  return locations;
}

/**
 * Get resolution info for a schema including shadow detection.
 */
function getSchemaResolution(
  name: string,
  projectRoot: string
): SchemaResolution | null {
  const locations = checkAllLocations(name, projectRoot);
  const existingLocations = locations.filter((loc) => loc.exists);

  if (existingLocations.length === 0) {
    return null;
  }

  const active = existingLocations[0];
  const shadows = existingLocations.slice(1).map((loc) => ({
    source: loc.source,
    path: loc.path,
  }));

  return {
    name,
    source: active.source,
    path: active.path,
    shadows,
  };
}

/**
 * Get all schemas with resolution info.
 */
function getAllSchemasWithResolution(
  projectRoot: string
): SchemaResolution[] {
  const schemaNames = listSchemas(projectRoot);
  const results: SchemaResolution[] = [];

  for (const name of schemaNames) {
    const resolution = getSchemaResolution(name, projectRoot);
    if (resolution) {
      results.push(resolution);
    }
  }

  return results;
}

/**
 * Validate a schema and return issues.
 */
function validateSchema(
  schemaDir: string,
  verbose: boolean = false
): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const schemaPath = path.join(schemaDir, 'schema.yaml');

  // Check schema.yaml exists
  if (verbose) {
    console.log(SCHEMA_MESSAGES.checkingSchemaExists);
  }
  if (!fs.existsSync(schemaPath)) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: SCHEMA_MESSAGES.schemaNotFound,
    });
    return { valid: false, issues };
  }

  // Parse YAML
  if (verbose) {
    console.log(SCHEMA_MESSAGES.parsingYaml);
  }
  let content: string;
  try {
    content = fs.readFileSync(schemaPath, 'utf-8');
  } catch (err) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: SCHEMA_MESSAGES.failedToReadFile((err as Error).message),
    });
    return { valid: false, issues };
  }

  // Validate against Zod schema
  if (verbose) {
    console.log(SCHEMA_MESSAGES.validatingSchemaStructure);
  }
  let schema: SchemaYaml;
  try {
    schema = parseSchema(content);
  } catch (err) {
    if (err instanceof SchemaValidationError) {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: err.message,
      });
    } else {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: SCHEMA_MESSAGES.parseError((err as Error).message),
      });
    }
    return { valid: false, issues };
  }

  // Verifica que os templates existem no mesmo diretório usado em runtime.
  if (verbose) {
    console.log(SCHEMA_MESSAGES.checkingTemplateFiles);
  }
  for (const artifact of schema.artifacts) {
    const templatesDir = path.join(schemaDir, 'templates');
    const existingTemplatePath = path.join(templatesDir, artifact.template);

    if (!fs.existsSync(existingTemplatePath)) {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: SCHEMA_MESSAGES.templateNotFound(artifact.template, artifact.id),
      });
      continue;
    }

    try {
      FileSystemUtils.assertPathWithin(templatesDir, existingTemplatePath);
    } catch {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: SCHEMA_MESSAGES.templateOutsideTemplatesDir(artifact.template),
      });
    }
  }

  // Dependency graph validation is already done by parseSchema
  // (it throws on cycles and invalid references)
  if (verbose) {
    console.log(SCHEMA_MESSAGES.dependencyGraphPassed);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate schema name format (kebab-case).
 */
function isValidSchemaName(name: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Resolve o caminho canônico de uma entrada do esquema, garantindo que ela
 * permaneça dentro da raiz permitida (links confinados são aceitos).
 */
function resolveSchemaCopyPath(allowedRoot: string, sourcePath: string): string {
  try {
    const canonicalRoot = fs.realpathSync(allowedRoot);
    const canonicalPath = fs.realpathSync(sourcePath);
    FileSystemUtils.assertPathWithin(canonicalRoot, canonicalPath);
    return canonicalPath;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(SCHEMA_MESSAGES.cannotForkLinkedEntry(sourcePath, detail), { cause: error });
  }
}

/**
 * Copy a directory recursively.
 */
function copyDirRecursive(
  src: string,
  dest: string,
  allowedRoot = src,
  ancestors = new Set<string>()
): void {
  const canonicalSrc = resolveSchemaCopyPath(allowedRoot, src);
  if (ancestors.has(canonicalSrc)) {
    throw new Error(SCHEMA_MESSAGES.cannotForkLinkedCycle(src));
  }
  ancestors.add(canonicalSrc);
  fs.mkdirSync(dest, { recursive: true });

  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      const canonicalEntry = resolveSchemaCopyPath(allowedRoot, srcPath);
      const stats = fs.statSync(canonicalEntry);

      if (stats.isDirectory()) {
        copyDirRecursive(canonicalEntry, destPath, allowedRoot, ancestors);
      } else if (stats.isFile()) {
        // Dereferencia links confinados para que a cópia seja um esquema independente.
        fs.copyFileSync(canonicalEntry, destPath);
      } else {
        throw new Error(SCHEMA_MESSAGES.cannotForkLinkedEntry(srcPath));
      }
    }
  } finally {
    ancestors.delete(canonicalSrc);
  }
}

/**
 * Verifica a árvore do esquema inteira antes de substituir ou criar o destino da cópia.
 */
function assertSchemaTreeCanBeCopied(
  src: string,
  allowedRoot = src,
  ancestors = new Set<string>()
): void {
  const canonicalSrc = resolveSchemaCopyPath(allowedRoot, src);
  if (ancestors.has(canonicalSrc)) {
    throw new Error(SCHEMA_MESSAGES.cannotForkLinkedCycle(src));
  }
  ancestors.add(canonicalSrc);

  try {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const entryPath = path.join(src, entry.name);
      const canonicalEntry = resolveSchemaCopyPath(allowedRoot, entryPath);
      const stats = fs.statSync(canonicalEntry);
      if (stats.isDirectory()) {
        assertSchemaTreeCanBeCopied(canonicalEntry, allowedRoot, ancestors);
      } else if (!stats.isFile()) {
        throw new Error(SCHEMA_MESSAGES.cannotForkLinkedEntry(entryPath));
      }
    }
  } finally {
    ancestors.delete(canonicalSrc);
  }
}

/**
 * Produz uma impressão digital estável do conteúdo de um diretório: um SHA-256
 * sobre o caminho relativo E os bytes de cada arquivo (mais os caminhos dos
 * diretórios), percorridos em ordem estável. Duas árvores byte a byte idênticas
 * produzem o mesmo digest, e QUALQUER mudança no conteúdo, no tamanho ou no
 * conjunto de caminhos o altera. Serve para detectar uma modificação concorrente
 * do destino de uma cópia entre o momento em que a sobrescrita é autorizada e o
 * momento em que ela é de fato movida/apagada, para que essas alterações nunca
 * sejam destruídas em silêncio.
 */
function fingerprintDir(dir: string): string {
  const hash = createHash('sha256');
  const walk = (current: string, rel: string): void => {
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      // Usa o tipo de entrada devolvido pelo readdir (sem lstat separado) e lê o
      // arquivo direto — evitando a janela entre checagem e uso. O tamanho vem
      // dos bytes efetivamente lidos, então o digest continua cobrindo conteúdo
      // e comprimento.
      if (entry.isDirectory()) {
        hash.update(`D:${relPath}\n`);
        walk(abs, relPath);
      } else if (entry.isFile()) {
        const contents = fs.readFileSync(abs);
        hash.update(`F:${relPath}:${contents.length}:`);
        hash.update(contents);
        hash.update('\n');
      } else {
        // Links simbólicos / outros tipos de entrada: registra o tipo + caminho
        // (e o alvo do link quando legível) para que a troca de um pelo outro
        // continue sendo detectada.
        let target = '';
        try {
          target = fs.readlinkSync(abs);
        } catch {
          // Não é link simbólico ou o alvo é ilegível; o marcador de tipo abaixo basta.
        }
        hash.update(`O:${relPath}:${target}\n`);
      }
    }
  };
  walk(dir, '');
  return hash.digest('hex');
}

interface PreparedConfigUpdate {
  path: string;
  content: Buffer;
  originalContent: Buffer | null;
  originalMode: number | null;
}

/** @internal Costura de operações de arquivo para testes de falha transacional. */
export const schemaInitFileOperations = {
  renameSync: fs.renameSync,
};

/**
 * Lê e prepara (em memória) a atualização de `schema: <name>` no config do
 * projeto, sem tocar em disco. Toda validação do config acontece aqui — antes de
 * qualquer arquivo de esquema ser criado ou movido.
 */
async function prepareDefaultConfigUpdate(
  projectRoot: string,
  schemaName: string
): Promise<PreparedConfigUpdate> {
  const configPath =
    resolveConfigFilePath(projectRoot) ??
    path.join(projectRoot, 'openspec', 'config.yaml');
  FileSystemUtils.assertProjectArtifactPath(projectRoot, configPath);

  if (fs.existsSync(configPath)) {
    const stats = fs.lstatSync(configPath);
    if (stats.isSymbolicLink()) {
      throw new Error(SCHEMA_MESSAGES.defaultConfigIsSymlink(path.basename(configPath)));
    }
    if (!stats.isFile()) {
      throw new Error(SCHEMA_MESSAGES.defaultConfigNotRegularFile(path.basename(configPath)));
    }
    if (
      !(await FileSystemUtils.canWriteFile(configPath)) ||
      !(await FileSystemUtils.canWriteFile(path.dirname(configPath)))
    ) {
      throw new Error(SCHEMA_MESSAGES.defaultConfigNotWritable(path.basename(configPath)));
    }

    const originalContent = fs.readFileSync(configPath);
    // A Document API edita o arquivo no lugar: comentários e demais chaves
    // (context, rules…) sobrevivem à atualização.
    const config = parseDocument(originalContent.toString('utf-8'));
    if (config.errors.length > 0) {
      throw new Error(SCHEMA_MESSAGES.defaultConfigInvalidYaml(path.basename(configPath)));
    }
    if (config.contents !== null && !isMap(config.contents)) {
      throw new Error(SCHEMA_MESSAGES.defaultConfigNotObject(path.basename(configPath)));
    }
    // `schema` é a chave que readProjectConfig lê; `defaultSchema` é a chave
    // morta que uma execução anterior possa ter deixado.
    config.set('schema', schemaName);
    config.delete('defaultSchema');

    return {
      path: configPath,
      content: Buffer.from(config.toString()),
      originalContent,
      originalMode: stats.mode,
    };
  }

  if (!(await FileSystemUtils.canWriteFile(configPath))) {
    throw new Error(SCHEMA_MESSAGES.defaultConfigNotWritable(path.dirname(configPath)));
  }

  return {
    path: configPath,
    content: Buffer.from(stringifyYaml({ schema: schemaName })),
    originalContent: null,
    originalMode: null,
  };
}

/**
 * Verifica se o config em disco continua exatamente como estava quando a
 * atualização foi preparada (existência, tipo, modo e bytes).
 */
function configMatchesPreparedState(prepared: PreparedConfigUpdate): boolean {
  if (prepared.originalContent === null) {
    return !fs.existsSync(prepared.path);
  }
  if (!fs.existsSync(prepared.path)) return false;

  const stats = fs.lstatSync(prepared.path);
  return (
    stats.isFile() &&
    !stats.isSymbolicLink() &&
    stats.mode === prepared.originalMode &&
    fs.readFileSync(prepared.path).equals(prepared.originalContent)
  );
}

/**
 * Default artifacts with descriptions for schema init.
 */
const DEFAULT_ARTIFACTS: Array<{
  id: string;
  description: string;
  generates: string;
  template: string;
}> = [
  {
    id: 'proposal',
    description: 'High-level description of the change, its motivation, and scope',
    generates: 'proposal.md',
    template: 'proposal.md',
  },
  {
    id: 'specs',
    description: 'Detailed specifications with requirements and scenarios',
    generates: 'specs/**/*.md',
    template: 'specs/spec.md',
  },
  {
    id: 'design',
    description: 'Technical design decisions and implementation approach',
    generates: 'design.md',
    template: 'design.md',
  },
  {
    id: 'tasks',
    description: 'Implementation checklist with trackable tasks',
    generates: 'tasks.md',
    template: 'tasks.md',
  },
];

/**
 * Register the schema command and all its subcommands.
 */
export function registerSchemaCommand(program: Command): void {
  const schemaCmd = program
    .command('schema')
    .description(SCHEMA_MESSAGES.manageWorkflows);

  // Experimental warning
  schemaCmd.hook('preAction', () => {
    console.error(SCHEMA_MESSAGES.experimentalWarning);
  });

  // schema which
  schemaCmd
    .command('which [name]')
    .description(SCHEMA_MESSAGES.showResolve)
    .option('--json', SCHEMA_MESSAGES.outputAsJson)
    .option('--all', SCHEMA_MESSAGES.listAllSchemasOption)
    .action(async (name?: string, options?: { json?: boolean; all?: boolean }) => {
      try {
        const projectRoot = FileSystemUtils.canonicalProjectRoot();

        if (options?.all) {
          // List all schemas
          const schemas = getAllSchemasWithResolution(projectRoot);

          if (options?.json) {
            console.log(JSON.stringify(schemas, null, 2));
          } else {
            if (schemas.length === 0) {
              console.log(SCHEMA_MESSAGES.noSchemasFound);
              return;
            }

            // Group by source
            const bySource = {
              project: schemas.filter((s) => s.source === 'project'),
              user: schemas.filter((s) => s.source === 'user'),
              package: schemas.filter((s) => s.source === 'package'),
            };

            if (bySource.project.length > 0) {
              console.log('\n' + SCHEMA_MESSAGES.projectSchemasHeader);
              for (const schema of bySource.project) {
                const shadowInfo = schema.shadows.length > 0
                  ? SCHEMA_MESSAGES.shadowsLabel(schema.shadows.map((s) => s.source).join(', '))
                  : '';
                console.log(`  ${schema.name}${shadowInfo}`);
              }
            }

            if (bySource.user.length > 0) {
              console.log('\n' + SCHEMA_MESSAGES.userSchemasHeader);
              for (const schema of bySource.user) {
                const shadowInfo = schema.shadows.length > 0
                  ? SCHEMA_MESSAGES.shadowsLabel(schema.shadows.map((s) => s.source).join(', '))
                  : '';
                console.log(`  ${schema.name}${shadowInfo}`);
              }
            }

            if (bySource.package.length > 0) {
              console.log('\n' + SCHEMA_MESSAGES.packageSchemasHeader);
              for (const schema of bySource.package) {
                console.log(`  ${schema.name}`);
              }
            }
          }
          return;
        }

        if (!name) {
          console.error(SCHEMA_MESSAGES.schemaNameRequired);
          process.exitCode = 1;
          return;
        }

        const resolution = getSchemaResolution(name, projectRoot);

        if (!resolution) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              error: SCHEMA_MESSAGES.schemaNotFoundError(name),
              available,
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.schemaNotFoundError(name));
            console.error(SCHEMA_MESSAGES.availableSchemas(available.join(', ')));
          }
          process.exitCode = 1;
          return;
        }

        if (options?.json) {
          console.log(JSON.stringify(resolution, null, 2));
        } else {
          console.log(SCHEMA_MESSAGES.schemaLabel(resolution.name));
          console.log(SCHEMA_MESSAGES.sourceLabel(resolution.source));
          console.log(SCHEMA_MESSAGES.pathLabel(resolution.path));

          if (resolution.shadows.length > 0) {
            console.log('\n' + SCHEMA_MESSAGES.shadowsHeader);
            for (const shadow of resolution.shadows) {
              console.log(SCHEMA_MESSAGES.shadowEntry(shadow.source, shadow.path));
            }
          }
        }
      } catch (error) {
        console.error(CLI_MESSAGES.error((error as Error).message));
        process.exitCode = 1;
      }
    });

  // schema validate
  schemaCmd
    .command('validate [name]')
    .description(SCHEMA_MESSAGES.validateStructure)
    .option('--json', SCHEMA_MESSAGES.outputAsJson)
    .option('--verbose', SCHEMA_MESSAGES.verboseOption)
    .action(async (name?: string, options?: { json?: boolean; verbose?: boolean }) => {
      try {
        const projectRoot = FileSystemUtils.canonicalProjectRoot();

        if (!name) {
          // Validate all project schemas
          const projectSchemasDir = getProjectSchemasDir(projectRoot);

          if (!fs.existsSync(projectSchemasDir)) {
            if (options?.json) {
              console.log(JSON.stringify({
                valid: true,
                message: SCHEMA_MESSAGES.noProjectSchemasDir,
                schemas: [],
              }, null, 2));
            } else {
              console.log(SCHEMA_MESSAGES.noProjectSchemasDir + '.');
            }
            return;
          }

          const entries = fs.readdirSync(projectSchemasDir, { withFileTypes: true });
          const schemaResults: Array<{
            name: string;
            path: string;
            valid: boolean;
            issues: ValidationIssue[];
          }> = [];

          let anyInvalid = false;

          for (const entry of entries) {
            if (!isSchemaDir(projectSchemasDir, entry)) continue;

            const schemaDir = path.join(projectSchemasDir, entry.name);
            const schemaPath = path.join(schemaDir, 'schema.yaml');

            if (!fs.existsSync(schemaPath)) continue;

            if (options?.verbose && !options?.json) {
              console.log('\n' + SCHEMA_MESSAGES.validatingEntry(entry.name));
            }

            const result = validateSchema(schemaDir, options?.verbose && !options?.json);
            schemaResults.push({
              name: entry.name,
              path: schemaDir,
              valid: result.valid,
              issues: result.issues,
            });

            if (!result.valid) {
              anyInvalid = true;
            }
          }

          if (options?.json) {
            console.log(JSON.stringify({
              valid: !anyInvalid,
              schemas: schemaResults,
            }, null, 2));
          } else {
            if (schemaResults.length === 0) {
              console.log(SCHEMA_MESSAGES.noSchemasInProject);
              return;
            }

            console.log('\n' + SCHEMA_MESSAGES.validationResultsHeader);
            for (const result of schemaResults) {
              console.log(SCHEMA_MESSAGES.validationStatus(result.valid, result.name));
              for (const issue of result.issues) {
                console.log(SCHEMA_MESSAGES.issueLine(issue.level, issue.message));
              }
            }
          }

          if (anyInvalid) {
            process.exitCode = 1;
          }
          return;
        }

        // Validate specific schema
        const schemaDir = getSchemaDir(name, projectRoot);

        if (!schemaDir) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              valid: false,
              error: SCHEMA_MESSAGES.schemaNotFoundError(name),
              available,
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.schemaNotFoundError(name));
            console.error(SCHEMA_MESSAGES.availableSchemas(available.join(', ')));
          }
          process.exitCode = 1;
          return;
        }

        if (options?.verbose && !options?.json) {
          console.log(SCHEMA_MESSAGES.validatingEntry(name));
        }

        const result = validateSchema(schemaDir, options?.verbose && !options?.json);

        if (options?.json) {
          console.log(JSON.stringify({
            name,
            path: schemaDir,
            valid: result.valid,
            issues: result.issues,
          }, null, 2));
        } else {
          if (result.valid) {
            console.log(SCHEMA_MESSAGES.schemaIsValid(name));
          } else {
            console.log(SCHEMA_MESSAGES.schemaHasErrors(name));
            for (const issue of result.issues) {
              console.log(SCHEMA_MESSAGES.issueLine(issue.level, issue.message));
            }
          }
        }
        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error) {
        if (options?.json) {
          console.log(JSON.stringify({
            valid: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(CLI_MESSAGES.error((error as Error).message));
        }
        process.exitCode = 1;
      }
    });

  // schema fork
  schemaCmd
    .command('fork <source> [name]')
    .description(SCHEMA_MESSAGES.copySchema)
    .option('--json', SCHEMA_MESSAGES.outputAsJson)
    .option('--force', SCHEMA_MESSAGES.forceOption)
    .action(async (source: string, name?: string, options?: { json?: boolean; force?: boolean }) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = FileSystemUtils.canonicalProjectRoot();
        const destinationName = name || `${source}-custom`;

        // Validate destination name
        if (!isValidSchemaName(destinationName)) {
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: SCHEMA_MESSAGES.invalidSchemaName(destinationName),
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.invalidSchemaName(destinationName).replace(/^Nome/, 'Erro: Nome'));
            console.error(SCHEMA_MESSAGES.schemaNamesKebabCase);
          }
          process.exitCode = 1;
          return;
        }

        // Find source schema
        const sourceDir = getSchemaDir(source, projectRoot);
        if (!sourceDir) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: SCHEMA_MESSAGES.schemaSourceNotFound(source),
              available,
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.schemaNotFoundError(source).replace(/^Esquema/, 'Erro: Esquema'));
            console.error(SCHEMA_MESSAGES.availableSchemas(available.join(', ')));
          }
          process.exitCode = 1;
          return;
        }

        // Determine source location
        const sourceResolution = getSchemaResolution(source, projectRoot);
        const sourceLocation = sourceResolution?.source || 'package';

        // Valida a origem completa antes que uma cópia forçada remova qualquer coisa.
        const trustedSourceDir = fs.realpathSync(sourceDir);
        assertSchemaTreeCanBeCopied(trustedSourceDir);

        // Valida também o conteúdo do schema.yaml da origem de antemão, para que
        // uma origem estruturalmente inválida seja rejeitada antes que o caminho
        // do --force possa remover um destino existente. Isso mantém o
        // `fork --force` atômico — uma origem inutilizável nunca destrói um
        // destino válido — igual ao `schema init`, que também valida antes de
        // sobrescrever.
        parseSchema(
          fs.readFileSync(path.join(trustedSourceDir, 'schema.yaml'), 'utf-8')
        );

        // Check destination
        const schemasDir = getProjectSchemasDir(projectRoot);
        const destinationDir = path.join(schemasDir, destinationName);

        // Rejeita a cópia sobre si mesma. Copiar um esquema sobre ele mesmo com
        // --force removeria a origem no passo de substituição abaixo e então
        // falharia na cópia, destruindo a única cópia do esquema. Resolve os dois
        // lados para os caminhos reais (realpathSync segue links simbólicos;
        // path.resolve é fallback só para um destino que ainda não existe) para
        // que um link ou uma grafia com `.`/`..` do mesmo diretório também seja
        // detectada.
        const resolvedDestination = fs.existsSync(destinationDir)
          ? fs.realpathSync(destinationDir)
          : path.resolve(destinationDir);
        if (resolvedDestination === trustedSourceDir) {
          throw new Error(SCHEMA_MESSAGES.cannotForkOntoItself(source));
        }

        const destinationExists = fs.existsSync(destinationDir);
        if (destinationExists && !options?.force) {
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: SCHEMA_MESSAGES.schemaAlreadyExists(destinationName),
              suggestion: SCHEMA_MESSAGES.suggestionForceOverwrite,
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.schemaAlreadyExistsAt(destinationName, destinationDir));
            console.error(SCHEMA_MESSAGES.suggestionForceOverwrite);
          }
          process.exitCode = 1;
          return;
        }

        // Registra a impressão digital do destino que o usuário autorizou a
        // sobrescrever ANTES de gastar tempo preparando a cópia. A preparação
        // pode demorar, e um processo concorrente pode editar o destino nessa
        // janela; a impressão digital permite detectar essa mudança e abortar em
        // vez de atropelá-la.
        const authorizedDestinationFingerprint = destinationExists
          ? fingerprintDir(destinationDir)
          : null;

        // Prepara a cópia completa em um diretório temporário irmão e só então a
        // troca para o lugar definitivo. Isso mantém o `fork --force` atômico: um
        // destino existente só é removido depois que a nova cópia foi totalmente
        // copiada, teve o nome atualizado e foi validada. Qualquer falha durante
        // a preparação deixa tanto a origem quanto o destino existente
        // exatamente como estavam.
        if (spinner) spinner.start(SCHEMA_MESSAGES.forkingSchema(source, destinationName));
        fs.mkdirSync(schemasDir, { recursive: true });
        const stagingDir = fs.mkdtempSync(path.join(schemasDir, '.fork-staging-'));
        try {
          copyDirRecursive(trustedSourceDir, stagingDir);

          // Atualiza o nome no schema.yaml preparado usando a Document API do
          // yaml, em vez de reserializar o objeto analisado, para que block
          // scalars, comentários e a ordem das chaves do schema.yaml de origem
          // sobrevivam à cópia.
          const stagedSchemaPath = path.join(stagingDir, 'schema.yaml');
          const schemaContent = fs.readFileSync(stagedSchemaPath, 'utf-8');
          const doc = parseDocument(schemaContent);
          doc.set('name', destinationName);
          fs.writeFileSync(stagedSchemaPath, doc.toString());

          // Validação autoritativa: valida o esquema preparado COMPLETO — os
          // bytes exatos que estão prestes a ser instalados — e não apenas a
          // origem na verificação inicial. Os arquivos de origem que
          // copyDirRecursive lê podem mudar no meio da cópia, então uma origem
          // válida no início pode gerar uma cópia preparada inválida. Validar
          // aqui, antes de QUALQUER passo destrutivo, garante que nunca
          // instalamos uma cópia inválida nem apagamos um destino válido por
          // causa dela.
          try {
            parseSchema(fs.readFileSync(stagedSchemaPath, 'utf-8'));
          } catch (validationError) {
            throw new Error(
              SCHEMA_MESSAGES.stagedForkInvalid(source, destinationName),
              { cause: validationError }
            );
          }

          // Troca a cópia preparada para o lugar. Quando um destino já existe,
          // ele é movido PRIMEIRO para um backup irmão e só então a cópia
          // preparada é instalada; o backup é descartado apenas depois que a
          // instalação dá certo. Se o próprio rename da instalação falhar (ex.:
          // um lock no Windows), o backup volta ao lugar para que o destino
          // original do usuário nunca seja perdido.
          if (destinationExists) {
            if (spinner) spinner.text = SCHEMA_MESSAGES.replacingExistingSchema(destinationName);

            // Revalida imediatamente antes do movimento destrutivo: se o destino
            // mudou em disco enquanto preparávamos a cópia (ou foi removido),
            // sua impressão digital não corresponde mais ao que o usuário
            // autorizou. Aborta SEM tocá-lo, preservando as alterações
            // concorrentes. O catch externo limpa o staging.
            const currentFingerprint = fs.existsSync(destinationDir)
              ? fingerprintDir(destinationDir)
              : null;
            if (currentFingerprint !== authorizedDestinationFingerprint) {
              throw new Error(
                SCHEMA_MESSAGES.forkDestinationChangedOnDisk(destinationName, destinationDir)
              );
            }

            const backupDir = `${destinationDir}.fork-backup-${process.pid}-${Date.now()}`;
            fs.renameSync(destinationDir, backupDir);
            try {
              fs.renameSync(stagingDir, destinationDir);
            } catch (installError) {
              // A instalação falhou depois que o original foi movido de lado.
              // Tenta trazê-lo de volta. Se a restauração TAMBÉM falhar, o
              // original fica preso no diretório de backup — lança um erro
              // nomeando o backup e o destino para que o usuário possa recuperá-lo
              // manualmente, com o erro de instalação original anexado como
              // causa. Nunca engolir esse caso.
              try {
                fs.renameSync(backupDir, destinationDir);
              } catch (restoreError) {
                throw new Error(
                  SCHEMA_MESSAGES.forkInstallRestoreFailed(
                    destinationName,
                    backupDir,
                    destinationDir,
                    (restoreError as Error).message
                  ),
                  { cause: installError }
                );
              }
              throw installError;
            }

            // Revalida antes de descartar o backup: só apaga se ele ainda for
            // byte a byte o destino original que movemos de lado. Se mudou
            // durante a janela de instalação (uma escrita concorrente no
            // diretório movido), NÃO apaga — deixa no lugar e informa onde ele
            // está, para que nada se perca.
            if (fingerprintDir(backupDir) === authorizedDestinationFingerprint) {
              fs.rmSync(backupDir, { recursive: true, force: true });
            } else {
              console.error(SCHEMA_MESSAGES.forkBackupKept(destinationName, backupDir));
            }
          } else {
            fs.renameSync(stagingDir, destinationDir);
          }
        } catch (error) {
          // Remove apenas o diretório de staging que esta execução criou; a
          // origem e qualquer destino existente ficam exatamente como os
          // encontramos. A limpeza fica no seu próprio try/catch para que uma
          // remoção que falhe (ex.: um arquivo travado no Windows) jamais
          // mascare o erro original; depois relança, para que a falha real
          // continue alimentando o relatório JSON/código de saída.
          try {
            fs.rmSync(stagingDir, { recursive: true, force: true });
          } catch {
            // Limpeza best-effort; o erro original abaixo é o que importa.
          }
          throw error;
        }

        if (spinner) spinner.succeed(SCHEMA_MESSAGES.forkedSchema(source, destinationName));

        if (options?.json) {
          console.log(JSON.stringify({
            forked: true,
            source,
            sourcePath: sourceDir,
            sourceLocation,
            destination: destinationName,
            destinationPath: destinationDir,
          }, null, 2));
        } else {
          console.log('\n' + SCHEMA_MESSAGES.sourceLabel2(sourceDir, sourceLocation));
          console.log(SCHEMA_MESSAGES.destinationLabel(destinationDir));
          console.log('\n' + SCHEMA_MESSAGES.customizeSchemaAt);
          console.log(`  ${path.join(destinationDir, 'schema.yaml')}`);
        }
      } catch (error) {
        if (spinner) spinner.fail(SCHEMA_MESSAGES.forkFailed);
        if (options?.json) {
          console.log(JSON.stringify({
            forked: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(CLI_MESSAGES.error((error as Error).message));
        }
        process.exitCode = 1;
      }
    });

  // schema init
  schemaCmd
    .command('init <name>')
    .description(SCHEMA_MESSAGES.createSchema)
    .option('--json', SCHEMA_MESSAGES.outputAsJson)
    .option('--description <text>', SCHEMA_MESSAGES.descriptionOption)
    .option('--artifacts <list>', SCHEMA_MESSAGES.artifactsOption)
    .option('--default', SCHEMA_MESSAGES.defaultOption)
    .option('--no-default', SCHEMA_MESSAGES.noDefaultOption)
    .option('--force', SCHEMA_MESSAGES.forceOption2)
    .action(async (
      name: string,
      options?: {
        json?: boolean;
        description?: string;
        artifacts?: string;
        default?: boolean;
        force?: boolean;
      }
    ) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = FileSystemUtils.canonicalProjectRoot();

        // Validate name
        if (!isValidSchemaName(name)) {
          if (options?.json) {
            console.log(JSON.stringify({
              created: false,
              error: SCHEMA_MESSAGES.invalidSchemaName(name),
            }, null, 2));
          } else {
            console.error(SCHEMA_MESSAGES.invalidSchemaName(name).replace(/^Nome/, 'Erro: Nome'));
            console.error(SCHEMA_MESSAGES.schemaNamesKebabCase);
          }
          process.exitCode = 1;
          return;
        }

        const schemaDir = path.join(getProjectSchemasDir(projectRoot), name);

        // Check overwrite permission without mutating the destination
        const schemaExists = fs.existsSync(schemaDir);
        if (schemaExists) {
          if (!options?.force) {
            if (options?.json) {
              console.log(JSON.stringify({
                created: false,
                error: SCHEMA_MESSAGES.schemaAlreadyExists(name),
                suggestion: SCHEMA_MESSAGES.suggestionForkOrForce,
              }, null, 2));
            } else {
              console.error(SCHEMA_MESSAGES.schemaAlreadyExistsAt(name, schemaDir));
              console.error(SCHEMA_MESSAGES.suggestionForkOrForce);
            }
            process.exitCode = 1;
            return;
          }
        }

        // Determine artifacts and description
        let description: string;
        let selectedArtifactIds: string[];

        // Check if we have explicit flags (non-interactive mode)
        const hasExplicitOptions = options?.description !== undefined || options?.artifacts !== undefined;
        const isInteractive = !options?.json && !hasExplicitOptions && process.stdout.isTTY;

        if (isInteractive) {
          // Interactive mode
          const { input, checkbox, confirm } = await import('@inquirer/prompts');

          description = await input({
            message: CONFIG_MESSAGES.schemaDescription,
            default: SCHEMA_MESSAGES.defaultSchemaDescription(name),
          });

          const artifactChoices = DEFAULT_ARTIFACTS.map((a) => ({
            name: a.id,
            value: a.id,
            checked: true,
          }));

          selectedArtifactIds = await checkbox({
            message: CONFIG_MESSAGES.selectArtifacts,
            theme: {
              icon: {
                checked: '[x]',
                unchecked: '[ ]',
              },
              // Localiza a dica de teclas embutida do @inquirer/checkbox v5.
              style: {
                keysHelpTip: ptBrKeysHelpTip,
              },
            },
            choices: artifactChoices,
          });

          if (selectedArtifactIds.length === 0) {
            console.error(SCHEMA_MESSAGES.atLeastOneArtifact);
            process.exitCode = 1;
            return;
          }

          // Ask about setting as default (unless --no-default was passed)
          if (options?.default === undefined) {
            const setAsDefault = await confirm({
              message: CONFIG_MESSAGES.setAsDefaultSchema,
              default: false,
            });

            if (setAsDefault) {
              options = { ...options, default: true };
            }
          }
        } else {
          // Non-interactive mode
          description = options?.description || SCHEMA_MESSAGES.defaultSchemaDescription(name);

          if (options?.artifacts) {
            selectedArtifactIds = options.artifacts.split(',').map((a) => a.trim());

            // Validate artifact IDs
            const validIds = DEFAULT_ARTIFACTS.map((a) => a.id);
            for (const id of selectedArtifactIds) {
              if (!validIds.includes(id)) {
                if (options?.json) {
                  console.log(JSON.stringify({
                    created: false,
                    error: SCHEMA_MESSAGES.unknownArtifact(id),
                    valid: validIds,
                  }, null, 2));
                } else {
                  console.error(SCHEMA_MESSAGES.unknownArtifact(id).replace(/^Artefato/, 'Erro: Artefato'));
                  console.error(SCHEMA_MESSAGES.validArtifacts(validIds.join(', ')));
                }
                process.exitCode = 1;
                return;
              }
            }
          } else {
            // Default to all artifacts
            selectedArtifactIds = DEFAULT_ARTIFACTS.map((a) => a.id);
          }
        }

        // Build artifacts array with proper dependencies
        const selectedArtifacts = selectedArtifactIds.map((id) => {
          const template = DEFAULT_ARTIFACTS.find((a) => a.id === id)!;
          const artifact: Artifact = {
            id: template.id,
            generates: template.generates,
            description: template.description,
            template: template.template,
            requires: [],
          };

          // Set up dependencies based on typical workflow
          if (id === 'specs' && selectedArtifactIds.includes('proposal')) {
            artifact.requires = ['proposal'];
          } else if (id === 'design' && selectedArtifactIds.includes('specs')) {
            artifact.requires = ['specs'];
          } else if (id === 'tasks') {
            const requires: string[] = [];
            if (selectedArtifactIds.includes('design')) requires.push('design');
            else if (selectedArtifactIds.includes('specs')) requires.push('specs');
            artifact.requires = requires;
          }

          return artifact;
        });

        // Create schema.yaml
        const schema: SchemaYaml = {
          name,
          version: 1,
          description,
          artifacts: selectedArtifacts,
        };

        // Add apply phase if tasks is included
        if (selectedArtifactIds.includes('tasks')) {
          schema.apply = {
            requires: ['tasks'],
            tracks: 'tasks.md',
          };
        }

        // Analisa e serializa o config ANTES de preparar qualquer arquivo de
        // esquema. Assim, configs malformados, que não são objeto, que são links
        // simbólicos ou somente leitura falham antes que um esquema existente
        // possa ser movido ou que um novo possa aparecer.
        const preparedConfig = options?.default
          ? await prepareDefaultConfigUpdate(projectRoot, name)
          : null;
        const schemasDir = getProjectSchemasDir(projectRoot);
        FileSystemUtils.assertProjectArtifactPath(projectRoot, schemaDir);
        const authorizedSchemaFingerprint = schemaExists
          ? fingerprintDir(schemaDir)
          : null;

        if (spinner) spinner.start(SCHEMA_MESSAGES.creatingSchema(name));
        fs.mkdirSync(schemasDir, { recursive: true });
        const schemaStagingDir = fs.mkdtempSync(
          path.join(schemasDir, '.init-staging-')
        );
        let configStagingDir: string | null = null;
        let stagedConfigPath: string | null = null;

        try {
          fs.writeFileSync(
            path.join(schemaStagingDir, 'schema.yaml'),
            stringifyYaml(schema)
          );

          // Create template files in templates/ subdirectory (standard location)
          const templatesDir = path.join(schemaStagingDir, 'templates');
          for (const artifact of selectedArtifacts) {
            const templatePath = path.join(templatesDir, artifact.template);
            fs.mkdirSync(path.dirname(templatePath), { recursive: true });
            fs.writeFileSync(templatePath, createDefaultTemplate(artifact.id));
          }

          const validation = validateSchema(schemaStagingDir);
          if (!validation.valid) {
            throw new Error(
              SCHEMA_MESSAGES.generatedSchemaInvalid(
                validation.issues.map((issue) => issue.message).join('; ')
              )
            );
          }

          if (preparedConfig) {
            const configDir = path.dirname(preparedConfig.path);
            configStagingDir = fs.mkdtempSync(
              path.join(configDir, '.schema-init-config-')
            );
            stagedConfigPath = path.join(
              configStagingDir,
              path.basename(preparedConfig.path)
            );
            fs.writeFileSync(stagedConfigPath, preparedConfig.content);
            if (preparedConfig.originalMode !== null) {
              fs.chmodSync(stagedConfigPath, preparedConfig.originalMode);
            }
          }

          // Re-resolve os dois destinos imediatamente antes do primeiro
          // movimento, para que a troca de um link simbólico pai durante a
          // preparação não consiga redirecionar o commit.
          FileSystemUtils.assertProjectArtifactPath(projectRoot, schemaDir);
          if (preparedConfig) {
            FileSystemUtils.assertProjectArtifactPath(projectRoot, preparedConfig.path);
          }

          const currentSchemaFingerprint = fs.existsSync(schemaDir)
            ? fingerprintDir(schemaDir)
            : null;
          if (currentSchemaFingerprint !== authorizedSchemaFingerprint) {
            throw new Error(SCHEMA_MESSAGES.initSchemaChangedOnDisk(name));
          }
          if (preparedConfig && !configMatchesPreparedState(preparedConfig)) {
            throw new Error(
              SCHEMA_MESSAGES.initConfigChangedOnDisk(path.basename(preparedConfig.path))
            );
          }

          const token = `${process.pid}-${Date.now()}`;
          const schemaBackup = `${schemaDir}.init-backup-${token}`;
          const configBackup = preparedConfig
            ? `${preparedConfig.path}.init-backup-${token}`
            : null;
          let schemaBackedUp = false;
          let configBackedUp = false;
          let schemaInstalled = false;
          let configInstalled = false;

          try {
            if (schemaExists) {
              schemaInitFileOperations.renameSync(schemaDir, schemaBackup);
              schemaBackedUp = true;
            }
            if (preparedConfig && preparedConfig.originalContent !== null) {
              schemaInitFileOperations.renameSync(preparedConfig.path, configBackup!);
              configBackedUp = true;
            }

            schemaInitFileOperations.renameSync(schemaStagingDir, schemaDir);
            schemaInstalled = true;
            if (preparedConfig && stagedConfigPath) {
              schemaInitFileOperations.renameSync(stagedConfigPath, preparedConfig.path);
              configInstalled = true;
            }
          } catch (installError) {
            // Os rótulos `config:`/`schema:` identificam tecnicamente os dois
            // artefatos da transação — ficam em inglês, como os IDs de artefato.
            const rollbackErrors: string[] = [];
            try {
              if (configInstalled && preparedConfig) {
                fs.rmSync(preparedConfig.path, { force: true });
              }
              if (configBackedUp && preparedConfig && configBackup) {
                schemaInitFileOperations.renameSync(configBackup, preparedConfig.path);
              }
            } catch (rollbackError) {
              rollbackErrors.push(`config: ${(rollbackError as Error).message}`);
            }
            try {
              if (schemaInstalled) {
                fs.rmSync(schemaDir, { recursive: true, force: true });
              }
              if (schemaBackedUp) {
                schemaInitFileOperations.renameSync(schemaBackup, schemaDir);
              }
            } catch (rollbackError) {
              rollbackErrors.push(`schema: ${(rollbackError as Error).message}`);
            }

            if (rollbackErrors.length > 0) {
              throw new Error(
                SCHEMA_MESSAGES.initRollbackIncomplete(
                  rollbackErrors.join(', '),
                  schemaDir,
                  preparedConfig?.path ?? null
                ),
                { cause: installError }
              );
            }
            throw installError;
          }

          // A transação foi confirmada. A limpeza não pode transformar sucesso em
          // falso fracasso, então deixe um backup recuperável e avise se a
          // remoção for bloqueada, em vez de reportar que a inicialização falhou.
          for (const backup of [
            schemaBackedUp ? schemaBackup : null,
            configBackedUp ? configBackup : null,
          ]) {
            if (!backup) continue;
            try {
              fs.rmSync(backup, { recursive: true, force: true });
            } catch (cleanupError) {
              console.error(
                SCHEMA_MESSAGES.initBackupCleanupFailed(
                  backup,
                  (cleanupError as Error).message
                )
              );
            }
          }
        } catch (error) {
          try {
            fs.rmSync(schemaStagingDir, { recursive: true, force: true });
          } catch {
            // A limpeza best-effort não pode esconder o erro real da operação.
          }
          throw error;
        } finally {
          if (configStagingDir) {
            try {
              fs.rmSync(configStagingDir, { recursive: true, force: true });
            } catch {
              // Limpeza best-effort. Um config confirmado já saiu daqui.
            }
          }
        }

        if (spinner) spinner.succeed(SCHEMA_MESSAGES.schemaCreated(name));

        if (options?.json) {
          console.log(JSON.stringify({
            created: true,
            path: schemaDir,
            schema: name,
            artifacts: selectedArtifactIds,
            setAsDefault: options?.default || false,
          }, null, 2));
        } else {
          console.log('\n' + SCHEMA_MESSAGES.schemaCreatedAt(schemaDir));
          console.log('\n' + SCHEMA_MESSAGES.artifactsLabel(selectedArtifactIds.join(', ')));
          if (options?.default) {
            console.log('\n' + SCHEMA_MESSAGES.setAsDefaultSchemaLabel);
          }
          console.log('\n' + SCHEMA_MESSAGES.nextStepsHeader);
          console.log(SCHEMA_MESSAGES.editSchemaYaml(schemaDir));
          console.log(SCHEMA_MESSAGES.modifyTemplates);
          console.log(SCHEMA_MESSAGES.useWithSchema(name));
        }
      } catch (error) {
        if (spinner) spinner.fail(SCHEMA_MESSAGES.creationFailed);
        if (options?.json) {
          console.log(JSON.stringify({
            created: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(CLI_MESSAGES.error((error as Error).message));
        }
        process.exitCode = 1;
      }
    });
}

/**
 * Create default template content for an artifact.
 */
function createDefaultTemplate(artifactId: string): string {
  switch (artifactId) {
    case 'proposal':
      return `## Why

<!-- Descreva a motivação para esta mudança -->

## What Changes

<!-- Descreva o que vai mudar -->

## Capabilities

### New Capabilities
<!-- Liste as novas capabilities -->

### Modified Capabilities
<!-- Liste as capabilities modificadas -->

## Impact

<!-- Descreva o impacto sobre a funcionalidade existente -->
`;

    case 'specs':
      return `## ADDED Requirements

### Requirement: Requisito de exemplo

Descrição do requisito.

#### Scenario: Cenário de exemplo
- **WHEN** alguma condição
- **THEN** algum resultado
`;

    case 'design':
      return `## Context

<!-- Contexto e antecedentes -->

## Goals / Non-Goals

**Goals:**
<!-- Liste os objetivos -->

**Non-Goals:**
<!-- Liste os não-objetivos -->

## Decisions

### 1. Nome da Decisão

Descrição e justificativa.

**Alternatives considered:**
- Alternativa 1: Rejeitada porque...

## Risks / Trade-offs

<!-- Liste os riscos e trade-offs -->
`;

    case 'tasks':
      return `## Implementation Tasks

- [ ] Tarefa 1
- [ ] Tarefa 2
- [ ] Tarefa 3
`;

    default:
      return `## ${artifactId}

<!-- Adicione o conteúdo aqui -->
`;
  }
}

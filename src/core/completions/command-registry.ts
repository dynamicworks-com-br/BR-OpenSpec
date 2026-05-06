import { CommandDefinition, FlagDefinition } from './types.js';
import { CLI_DESCRIPTIONS, CONFIG_MESSAGES, SCHEMA_MESSAGES } from '../../messages/index.js';

/**
 * Common flags used across multiple commands
 */
const COMMON_FLAGS = {
  json: {
    name: 'json',
    description: CLI_DESCRIPTIONS.showJson,
  } as FlagDefinition,
  jsonValidation: {
    name: 'json',
    description: CLI_DESCRIPTIONS.validateJson,
  } as FlagDefinition,
  strict: {
    name: 'strict',
    description: CLI_DESCRIPTIONS.validateStrict,
  } as FlagDefinition,
  noInteractive: {
    name: 'no-interactive',
    description: CLI_DESCRIPTIONS.showNoInteractive,
  } as FlagDefinition,
  type: {
    name: 'type',
    description: CLI_DESCRIPTIONS.validateType,
    takesValue: true,
    values: ['change', 'spec'],
  } as FlagDefinition,
} as const;

/**
 * Registry of all BR-OpenSpec CLI commands with their flags and metadata.
 * This registry is used to generate shell completion scripts.
 */
export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    name: 'init',
    description: CLI_DESCRIPTIONS.init,
    acceptsPositional: true,
    positionalType: 'path',
    flags: [
      {
        name: 'tools',
        description: CLI_DESCRIPTIONS.toolsOption,
        takesValue: true,
      },
    ],
  },
  {
    name: 'update',
    description: CLI_DESCRIPTIONS.update,
    acceptsPositional: true,
    positionalType: 'path',
    flags: [],
  },
  {
    name: 'list',
    description: CLI_DESCRIPTIONS.list,
    flags: [
      {
        name: 'specs',
        description: CLI_DESCRIPTIONS.listSpecs,
      },
      {
        name: 'changes',
        description: CLI_DESCRIPTIONS.listChanges,
      },
    ],
  },
  {
    name: 'view',
    description: CLI_DESCRIPTIONS.view,
    flags: [],
  },
  {
    name: 'validate',
    description: CLI_DESCRIPTIONS.validate,
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      {
        name: 'all',
        description: CLI_DESCRIPTIONS.validateAll,
      },
      {
        name: 'changes',
        description: CLI_DESCRIPTIONS.validateChanges,
      },
      {
        name: 'specs',
        description: CLI_DESCRIPTIONS.validateSpecs,
      },
      COMMON_FLAGS.type,
      COMMON_FLAGS.strict,
      COMMON_FLAGS.jsonValidation,
      {
        name: 'concurrency',
        description: CLI_DESCRIPTIONS.validateConcurrency,
        takesValue: true,
      },
      COMMON_FLAGS.noInteractive,
    ],
  },
  {
    name: 'show',
    description: CLI_DESCRIPTIONS.show,
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.type,
      COMMON_FLAGS.noInteractive,
      {
        name: 'deltas-only',
        description: CLI_DESCRIPTIONS.showDeltasOnly,
      },
      {
        name: 'requirements-only',
        description: CLI_DESCRIPTIONS.showRequirementsOnly,
      },
      {
        name: 'requirements',
        description: CLI_DESCRIPTIONS.showRequirements,
      },
      {
        name: 'no-scenarios',
        description: CLI_DESCRIPTIONS.showNoScenarios,
      },
      {
        name: 'requirement',
        short: 'r',
        description: CLI_DESCRIPTIONS.showRequirement,
        takesValue: true,
      },
    ],
  },
  {
    name: 'archive',
    description: CLI_DESCRIPTIONS.archive,
    acceptsPositional: true,
    positionalType: 'change-id',
    flags: [
      {
        name: 'yes',
        short: 'y',
        description: CLI_DESCRIPTIONS.archiveYes,
      },
      {
        name: 'skip-specs',
        description: CLI_DESCRIPTIONS.archiveSkipSpecs,
      },
      {
        name: 'no-validate',
        description: CLI_DESCRIPTIONS.archiveNoValidate,
      },
    ],
  },
  {
    name: 'feedback',
    description: CLI_DESCRIPTIONS.feedback,
    acceptsPositional: true,
    flags: [
      {
        name: 'body',
        description: CLI_DESCRIPTIONS.feedbackBody,
        takesValue: true,
      },
    ],
  },
  {
    name: 'change',
    description: CLI_DESCRIPTIONS.change,
    flags: [],
    subcommands: [
      {
        name: 'show',
        description: CLI_DESCRIPTIONS.changeShow,
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'deltas-only',
            description: CLI_DESCRIPTIONS.changeShowDeltasOnly,
          },
          {
            name: 'requirements-only',
            description: CLI_DESCRIPTIONS.changeShowRequirementsOnly,
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: CLI_DESCRIPTIONS.changeList,
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'long',
            description: CLI_DESCRIPTIONS.changeListLong,
          },
        ],
      },
      {
        name: 'validate',
        description: CLI_DESCRIPTIONS.changeValidate,
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
          COMMON_FLAGS.strict,
          COMMON_FLAGS.jsonValidation,
          COMMON_FLAGS.noInteractive,
        ],
      },
    ],
  },
  {
    name: 'spec',
    description: CLI_DESCRIPTIONS.spec,
    flags: [],
    subcommands: [
      {
        name: 'show',
        description: CLI_DESCRIPTIONS.specShow,
        acceptsPositional: true,
        positionalType: 'spec-id',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'requirements',
            description: CLI_DESCRIPTIONS.specShowRequirements,
          },
          {
            name: 'no-scenarios',
            description: CLI_DESCRIPTIONS.specShowNoScenarios,
          },
          {
            name: 'requirement',
            short: 'r',
            description: CLI_DESCRIPTIONS.specShowRequirement,
            takesValue: true,
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: CLI_DESCRIPTIONS.specList,
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'long',
            description: CLI_DESCRIPTIONS.specListLong,
          },
        ],
      },
      {
        name: 'validate',
        description: CLI_DESCRIPTIONS.specValidate,
        acceptsPositional: true,
        positionalType: 'spec-id',
        flags: [
          COMMON_FLAGS.strict,
          COMMON_FLAGS.jsonValidation,
          COMMON_FLAGS.noInteractive,
        ],
      },
    ],
  },
  {
    name: 'completion',
    description: CLI_DESCRIPTIONS.completion,
    flags: [],
    subcommands: [
      {
        name: 'generate',
        description: CLI_DESCRIPTIONS.completionGenerate,
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [],
      },
      {
        name: 'install',
        description: CLI_DESCRIPTIONS.completionInstall,
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'verbose',
            description: CLI_DESCRIPTIONS.completionVerbose,
          },
        ],
      },
      {
        name: 'uninstall',
        description: CLI_DESCRIPTIONS.completionUninstall,
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'yes',
            short: 'y',
            description: CLI_DESCRIPTIONS.yesSkipConfirm,
          },
        ],
      },
    ],
  },
  {
    name: 'config',
    description: CONFIG_MESSAGES.viewAndModify,
    flags: [
      {
        name: 'scope',
        description: CONFIG_MESSAGES.configScopeOption,
        takesValue: true,
        values: ['global'],
      },
    ],
    subcommands: [
      {
        name: 'path',
        description: CONFIG_MESSAGES.showLocation,
        flags: [],
      },
      {
        name: 'list',
        description: CONFIG_MESSAGES.showAllSettings,
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'get',
        description: CONFIG_MESSAGES.getValue,
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'set',
        description: CONFIG_MESSAGES.setValue,
        acceptsPositional: true,
        flags: [
          {
            name: 'string',
            description: CONFIG_MESSAGES.forceStringOption,
          },
          {
            name: 'allow-unknown',
            description: CONFIG_MESSAGES.allowUnknownOption,
          },
        ],
      },
      {
        name: 'unset',
        description: CONFIG_MESSAGES.removeKey,
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'reset',
        description: CONFIG_MESSAGES.resetConfig,
        flags: [
          {
            name: 'all',
            description: CONFIG_MESSAGES.resetAllOption,
          },
          {
            name: 'yes',
            short: 'y',
            description: CLI_DESCRIPTIONS.yesSkipConfirm,
          },
        ],
      },
      {
        name: 'edit',
        description: CONFIG_MESSAGES.openInEditor,
        flags: [],
      },
      {
        name: 'profile',
        description: CONFIG_MESSAGES.configureProfile,
        flags: [],
      },
    ],
  },
  {
    name: 'schema',
    description: SCHEMA_MESSAGES.manageWorkflows,
    flags: [],
    subcommands: [
      {
        name: 'which',
        description: SCHEMA_MESSAGES.showResolve,
        acceptsPositional: true,
        positionalType: 'schema-name',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'all',
            description: SCHEMA_MESSAGES.listAllSchemasOption,
          },
        ],
      },
      {
        name: 'validate',
        description: SCHEMA_MESSAGES.validateStructure,
        acceptsPositional: true,
        positionalType: 'schema-name',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'verbose',
            description: SCHEMA_MESSAGES.verboseOption,
          },
        ],
      },
      {
        name: 'fork',
        description: SCHEMA_MESSAGES.copySchema,
        acceptsPositional: true,
        positionalType: 'schema-name',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'force',
            description: SCHEMA_MESSAGES.forceOption,
          },
        ],
      },
      {
        name: 'init',
        description: SCHEMA_MESSAGES.createSchema,
        acceptsPositional: true,
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'description',
            description: SCHEMA_MESSAGES.descriptionOption,
            takesValue: true,
          },
          {
            name: 'artifacts',
            description: SCHEMA_MESSAGES.artifactsOption,
            takesValue: true,
          },
          {
            name: 'default',
            description: SCHEMA_MESSAGES.defaultOption,
          },
          {
            name: 'no-default',
            description: SCHEMA_MESSAGES.noDefaultOption,
          },
          {
            name: 'force',
            description: SCHEMA_MESSAGES.forceOption2,
          },
        ],
      },
    ],
  },
];

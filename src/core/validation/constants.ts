/**
 * Validation threshold constants
 */

import { SPECS_APPLY_MESSAGES } from '../../messages/index.js';

// Minimum character lengths
export const MIN_WHY_SECTION_LENGTH = 50;
export const MIN_PURPOSE_LENGTH = 50;

// Maximum character/item limits
export const MAX_WHY_SECTION_LENGTH = 1000;
export const MAX_REQUIREMENT_TEXT_LENGTH = 500;
export const MAX_DELTAS_PER_CHANGE = 10;

// O Purpose que o `openspec archive` grava no spec principal que cria quando o
// delta introduziu a capability sem um `## Purpose` utilizável. Nomeado aqui e
// composto destas duas metades no ponto de escrita
// (`SPECS_APPLY_MESSAGES.skeletonPurpose`, que é a definição única no catálogo
// PT-BR), para que a validação reconheça o placeholder pela mesma definição que
// o produz: uma segunda grafia copiada à mão deixaria de casar no dia em que o
// texto mudasse, e um check que não casa nada parece exatamente um check que
// não achou nada.
export const PURPOSE_PLACEHOLDER_PREFIX: string = SPECS_APPLY_MESSAGES.skeletonPurposePrefix;
export const PURPOSE_PLACEHOLDER_SUFFIX: string = SPECS_APPLY_MESSAGES.skeletonPurposeSuffix;

// Validation messages
export const VALIDATION_MESSAGES = {
  // Required content
  SCENARIO_EMPTY: 'O texto do cenário não pode estar vazio',
  REQUIREMENT_EMPTY: 'O texto do requisito não pode estar vazio',
  REQUIREMENT_NO_SCENARIOS: 'O requisito deve ter pelo menos um cenário',
  SPEC_NAME_EMPTY: 'O nome da especificação não pode estar vazio',
  SPEC_PURPOSE_EMPTY: 'A seção Purpose não pode estar vazia',
  SPEC_NO_REQUIREMENTS: 'A especificação deve ter pelo menos um requisito',
  CHANGE_NAME_EMPTY: 'O nome da alteração não pode estar vazio',
  CHANGE_WHY_TOO_SHORT: `A seção Why deve ter pelo menos ${MIN_WHY_SECTION_LENGTH} caracteres`,
  CHANGE_WHY_TOO_LONG: `A seção Why não deve exceder ${MAX_WHY_SECTION_LENGTH} caracteres`,
  CHANGE_WHAT_EMPTY: 'A seção What Changes não pode estar vazia',
  CHANGE_NO_DELTAS: 'A alteração deve ter pelo menos um delta',
  CHANGE_SKIP_SPECS_CONFLICT:
    'skip_specs está definido em .openspec.yaml, mas existem arquivos de spec em specs/. Remova skip_specs ou exclua os arquivos de spec de delta',
  CHANGE_SKIP_SPECS_ACCEPTED:
    'skip_specs está definido em .openspec.yaml: a alteração declara que não há mudanças de comportamento no nível de spec; zero deltas aceito',
  CHANGE_SKIP_SPECS_INVALID_METADATA:
    'skip_specs está definido, mas .openspec.yaml não é um metadado de alteração válido, então o marcador não é honrado. Corrija os metadados',
  CHANGE_TOO_MANY_DELTAS: `Considere dividir alterações com mais de ${MAX_DELTAS_PER_CHANGE} deltas`,
  DELTA_SPEC_EMPTY: 'O nome da especificação não pode estar vazio',
  DELTA_DESCRIPTION_EMPTY: 'A descrição do delta não pode estar vazia',

  // Warnings
  PURPOSE_TOO_BRIEF: `A seção Purpose é muito breve (menos de ${MIN_PURPOSE_LENGTH} caracteres)`,
  PURPOSE_IS_PLACEHOLDER:
    'A seção Purpose ainda é um placeholder, não um Purpose que alguém escreveu (a frase que o `openspec archive` ' +
    'grava para uma nova capability, ou um marcador `A definir`/`TBD`/`TODO` deixado no lugar). Substitua-a por uma ' +
    'descrição de para que serve esta capability, editando o spec principal diretamente: um `## Purpose` em um delta ' +
    'só é lido quando a capability é criada, então não pode substituir este.',
  REQUIREMENT_TOO_LONG: `O texto do requisito é muito longo (>${MAX_REQUIREMENT_TEXT_LENGTH} caracteres). Considere dividi-lo.`,
  DELTA_DESCRIPTION_TOO_BRIEF: 'A descrição do delta é muito breve',
  DELTA_MISSING_REQUIREMENTS: 'O delta deve incluir requisitos',

  // Guidance snippets (appended to primary messages for remediation)
  GUIDE_NO_DELTAS:
    'Nenhum delta encontrado. Certifique-se de que a alteração possui um diretório specs/ com pastas de capacidade (ex: specs/http-server/spec.md) contendo arquivos .md que usam cabeçalhos de delta (## ADDED/MODIFIED/REMOVED/RENAMED Requirements) e que cada requisito inclui pelo menos um bloco "#### Scenario:". Se esta alteração intencionalmente não modifica specs (refatoração pura, ferramental, docs), defina "skip_specs: true" no .openspec.yaml da alteração em vez disso. Dica: execute "openspec change show <change-id> --json --deltas-only" para inspecionar os deltas analisados.',
  GUIDE_MISSING_SPEC_SECTIONS:
    'Seções obrigatórias ausentes. Cabeçalhos esperados: "## Purpose" e "## Requirements". Exemplo:\n## Purpose\n[breve propósito]\n\n## Requirements\n### Requirement: Declaração clara de requisito\nUsers SHALL ...\n\n#### Scenario: Nome descritivo\n- **WHEN** ...\n- **THEN** ...',
  GUIDE_MISSING_CHANGE_SECTIONS:
    'Seções obrigatórias ausentes. Cabeçalhos esperados: "## Why" e "## What Changes". Certifique-se de que os deltas estão documentados em specs/ usando cabeçalhos de delta.',
  GUIDE_SCENARIO_FORMAT:
    'Os cenários devem usar cabeçalhos de nível 4. Converta listas em:\n#### Scenario: Nome curto\n- **WHEN** ...\n- **THEN** ...\n- **AND** ...',
} as const;

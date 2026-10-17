/**
 * Catálogo centralizado de mensagens do BR-OpenSpec em Português Brasileiro.
 *
 * Este módulo reúne todas as mensagens exibidas ao usuário para facilitar
 * manutenção, revisão e consistência linguística.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ TERMOS RESERVADOS — NÃO TRADUZIR
 * ─────────────────────────────────────────────────────────────────────────
 * O BR-OpenSpec é PT-BR first, mas o FORMATO de spec é um protocolo lido pelo
 * parser e pelo validador. Os marcadores estruturais e as palavras-chave
 * normativas DEVEM permanecer em inglês e em CAIXA ALTA. Só o conteúdo
 * descritivo (nomes, descrições, prosa) é escrito em português.
 *
 * - Palavras-chave normativas (RFC 2119): MUST, MUST NOT, REQUIRED, SHALL,
 *   SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY, OPTIONAL.
 * - Cabeçalhos de delta/spec: "## ADDED Requirements", "## MODIFIED Requirements",
 *   "## REMOVED Requirements", "## RENAMED Requirements", "## Requirements",
 *   "### Requirement:", "#### Scenario:".
 * - Cláusulas de cenário (Gherkin): WHEN, THEN, AND, GIVEN, ELSE.
 * - Auxiliares de RENAMED: FROM, TO.
 *
 * Regra geral: qualquer palavra em CAIXA ALTA que represente uma regra, uma
 * operação de delta (ADD/REMOVE/RENAME) ou uma cláusula de cenário fica em
 * inglês. Omitir SHALL/MUST em um requisito gera WARNING no `openspec
 * validate` (erro só com `--strict`); traduzir os marcadores estruturais
 * quebra o parsing de specs e changes.
 * Ver também AGENTS.md ("Termos reservados em inglês").
 * ─────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════
// CLI — Descrições de comandos (src/cli/index.ts)
// ═══════════════════════════════════════════════════════════

export const CLI_DESCRIPTIONS = {
  root: 'Sistema de desenvolvimento orientado a especificações com IA',
  init: 'Inicializa o BR-OpenSpec no seu projeto',
  experimental: 'Alias para init (descontinuado)',
  update: 'Atualiza os arquivos de instruções do BR-OpenSpec',
  list: 'Lista itens (alterações por padrão). Use --specs para listar especificações.',
  view: 'Exibe um painel interativo de especificações e alterações',
  change: 'Gerencia propostas de alteração do BR-OpenSpec',
  changeShow: 'Exibe uma proposta de alteração em JSON ou markdown',
  changeList: 'Lista todas as alterações ativas (DESCONTINUADO: use "openspec list")',
  changeValidate: 'Valida uma proposta de alteração',
  archive: 'Arquiva uma alteração concluída e atualiza as especificações principais',
  spec: 'Gerencia e visualiza especificações do BR-OpenSpec',
  specShow: 'Exibe uma especificação específica',
  specList: 'Lista todas as especificações disponíveis',
  specValidate: 'Valida a estrutura de uma especificação',
  validate: 'Valida alterações e especificações',
  show: 'Exibe uma alteração ou especificação',
  feedback: 'Envia feedback sobre o BR-OpenSpec',
  completion: 'Gerencia autocomplete do shell para a CLI do BR-OpenSpec',
  completionGenerate: 'Gera script de autocomplete para um shell (saída no stdout)',
  completionInstall: 'Instala script de autocomplete para um shell',
  completionUninstall: 'Remove script de autocomplete de um shell',
  __complete: 'Saída de dados de autocomplete em formato legível por máquinas (uso interno)',
  status: 'Exibe o status de conclusão dos artefatos de uma alteração',
  instructions: 'Exibe instruções enriquecidas para artefatos, apply ou archive',
  templates: 'Mostra os caminhos dos templates resolvidos para todos os artefatos de um esquema',
  schemas: 'Lista os esquemas de fluxo de trabalho disponíveis com descrições',
  new: 'Cria novos itens',
  newChange: 'Cria um novo diretório de alteração',
  // Opções globais
  noColor: 'Desativa cores na saída',
  tools: (availableToolIds: string, toolAliasNote: string) => `Configura ferramentas de IA não interativamente. Use "all", "none" ou uma lista separada por vírgula: ${availableToolIds}. Também aceito: ${toolAliasNote}`,
  toolAlias: (retired: string, current: string) => `${retired} (agora ${current})`,
  // Idioma dos artefatos gerados (`openspec init --language`). Usada tanto no
  // help do commander quanto no registry de completions, como no upstream.
  language: 'Escreve os novos artefatos do BR-OpenSpec neste idioma',
  force: 'Limpa arquivos legados automaticamente sem perguntar',
  profile: 'Sobrescreve o perfil da configuração global (core ou custom)',
  noAnimation: 'Exibe uma tela de boas-vindas estática em vez da animada',
  copilotCloud: 'Configura os arquivos do Copilot coding agent (nuvem) do GitHub sem perguntar',
  noCopilotCloud: 'Ignora os arquivos do Copilot coding agent (nuvem) do GitHub sem perguntar',
  // Variantes usadas no registry de completions (texto mais descritivo que o
  // help do commander, como no upstream).
  copilotCloudCompletion: 'Gera os arquivos do Copilot coding agent (nuvem) do GitHub (opt-in; padrão: perguntar)',
  noCopilotCloudCompletion: 'Não gera os arquivos do Copilot coding agent (nuvem) do GitHub',

  // Opções — init / experimental
  experimentalTool: 'Ferramenta de IA alvo (mapeia para --tools)',
  experimentalNoInteractive: 'Desativa prompts interativos',
  toolsOption: 'Configura ferramentas de IA não interativamente. Use "all", "none" ou IDs separados por vírgula',

  // Opções — update
  updateForce: 'Força atualização mesmo quando as ferramentas estão atualizadas',

  // Opções — list
  listSpecs: 'Lista especificações em vez de alterações',
  listChanges: 'Lista alterações explicitamente (padrão)',
  listSort: 'Ordem de classificação: "recent" (padrão) ou "name"',
  listJson: 'Saída como JSON (para uso programático)',

  // Opções — change show
  changeShowJson: 'Saída como JSON',
  changeShowDeltasOnly: 'Exibe apenas deltas (somente JSON)',
  changeShowRequirementsOnly: 'Alias para --deltas-only (descontinuado)',
  changeShowDiff: 'Exibe diffs por requisito dos specs de delta',
  changeShowNoInteractive: 'Desativa prompts interativos',

  // Opções — change validate
  changeValidateStrict: 'Ativa modo de validação estrita',
  changeValidateJson: 'Saída do relatório de validação como JSON',
  changeValidateNoInteractive: 'Desativa prompts interativos',

  // Opções — change list
  changeListJson: 'Saída como JSON',
  changeListLong: 'Exibe ID e título com contagens',

  // Opções — archive
  archiveYes: 'Pula confirmações interativas',

  // Opções genéricas — yes
  yesSkipConfirm: 'Pula confirmações interativas',
  archiveSkipSpecs: 'Ignora operações de atualização de especificação (útil para alterações de infraestrutura, ferramentas ou apenas documentação)',
  archiveNoValidate: 'Ignora validação (não recomendado, requer confirmação)',

  // Opções — validate
  validateAll: 'Valida todas as alterações e especificações',
  validateChanges: 'Valida todas as alterações',
  validateSpecs: 'Valida todas as especificações',
  validateArchived:
    'Valida que as alterações arquivadas tenham todas as tarefas concluídas (para lint em pre-commit)',
  validateType: 'Especifica o tipo do item quando ambíguo: change|spec',
  validateStrict: 'Ativa modo de validação estrita',
  validateJson: 'Saída dos resultados de validação como JSON',
  validateConcurrency: 'Máximo de validações concorrentes (padrão: env OPENSPEC_CONCURRENCY ou 6)',
  validateNoInteractive: 'Desativa prompts interativos',

  // Opções — show
  showJson: 'Saída como JSON',
  showType: 'Especifica o tipo do item quando ambíguo: change|spec',
  showDeltasOnly: 'Exibe apenas deltas (somente JSON, alteração)',
  showRequirementsOnly: 'Alias para --deltas-only (descontinuado, alteração)',
  showDiff: 'Exibe diffs por requisito dos specs de delta (alteração)',
  showRequirements: 'Somente JSON: Exibe apenas requisitos (exclui cenários)',
  showNoScenarios: 'Somente JSON: Exclui conteúdo de cenários',
  showRequirement: 'Somente JSON: Exibe requisito específico pelo ID (base 1)',
  showNoInteractive: 'Desativa prompts interativos',

  // Opções — feedback
  feedbackBody: 'Descrição detalhada do feedback',

  // Opções — completion install
  completionVerbose: 'Mostra saída detalhada da instalação',

  // Opções — status
  statusChange: 'Nome da alteração para exibir o status',
  statusAll: 'Exibe o status de todas as alterações ativas',
  statusSchema: 'Sobrescreve o esquema (auto-detectado do config.yaml)',
  statusJson: 'Saída como JSON',

  // Opções — instructions
  instructionsChange: 'Nome da alteração',
  instructionsSchema: 'Sobrescreve o esquema (auto-detectado do config.yaml)',
  instructionsJson: 'Saída como JSON',

  // Opções — templates
  templatesSchema: (defaultSchema: string) => `Esquema a usar (padrão: ${defaultSchema})`,
  templatesJson: 'Saída como JSON mapeando IDs de artefatos para caminhos de templates',

  // Opções — schemas
  schemasJson: 'Saída como JSON (para uso por agentes)',

  // Opções — new change
  newChangeDescription: 'Descrição a adicionar ao README.md',
  newChangeSchema: (defaultSchema: string) => `Esquema de fluxo de trabalho a usar (padrão: ${defaultSchema})`,

  // Opções — spec show
  specShowJson: 'Saída como JSON',
  specShowRequirements: 'Somente JSON: Exibe apenas requisitos (exclui cenários)',
  specShowNoScenarios: 'Somente JSON: Exclui conteúdo de cenários',
  specShowRequirement: 'Somente JSON: Exibe requisito específico pelo ID (base 1)',
  specShowNoInteractive: 'Desativa prompts interativos',

  // Opções — spec list
  specListJson: 'Saída como JSON',
  specListLong: 'Exibe id e título com contagens',

  // Opções — spec validate
  specValidateStrict: 'Ativa modo de validação estrita',
  specValidateJson: 'Saída do relatório de validação como JSON',
  specValidateNoInteractive: 'Desativa prompts interativos',
};

export const CLI_MESSAGES = {
  unknownError: 'Erro desconhecido',
  notADirectory: (path: string) => `O caminho "${path}" não é um diretório`,
  directoryWillBeCreated: (path: string) => `O diretório "${path}" não existe, ele será criado.`,
  cannotAccessPath: (path: string, err: string) => `Não foi possível acessar o caminho "${path}": ${err}`,
  experimentalDeprecated: 'Nota: "openspec experimental" está descontinuado. Use "openspec init" em vez disso.',
  error: (err: string) => `Erro: ${err}`,
  // Avisos de comandos descontinuados
  changeCommandsDeprecated: 'Aviso: Os comandos "openspec change ..." estão descontinuados. Prefira comandos iniciados por verbo (ex: "openspec list", "openspec validate --changes").',
  specCommandsDeprecated: 'Aviso: Os comandos "openspec spec ..." estão descontinuados. Prefira comandos iniciados por verbo (ex: "openspec show", "openspec validate --specs").',
  changeListDeprecated: 'Aviso: "openspec change list" está descontinuado. Use "openspec list".',
  projectLocalNotImplemented: 'Erro: Configuração local de projeto ainda não implementada',
};

// ═══════════════════════════════════════════════════════════
// Comandos — Alteração (src/commands/change.ts)
// ═══════════════════════════════════════════════════════════

export const CHANGE_MESSAGES = {
  selectChangeToShow: 'Selecione uma alteração para exibir',
  noChangeSpecifiedNoActive: 'Nenhuma alteração especificada. Nenhuma alteração ativa encontrada.',
  missingWhySection: 'A alteração deve ter uma seção Why',
  missingWhatChangesSection: 'A alteração deve ter uma seção What Changes',
  noChangeSpecifiedAvailable: (ids: string) => `Nenhuma alteração especificada. IDs disponíveis: ${ids}`,
  hintViewChanges: 'Dica: use "openspec change list" para ver as alterações disponíveis.',
  changeNotFound: (name: string, path: string) => `Alteração "${name}" não encontrada em ${path}`,
  changeNoProposalYet: (name: string) => `Alteração "${name}" ainda não tem proposal.md. Execute "openspec status --change ${name}" para ver qual artefato vem a seguir.`,
  requirementsOnlyDeprecated: 'A flag --requirements-only está descontinuada; use --deltas-only em vez disso.',
  noItemsFound: 'Nenhum item encontrado.',
  selectChangeToValidate: 'Selecione uma alteração para validar',
  changeIsValid: (name: string) => `Alteração "${name}" é válida`,
  changeHasIssues: (name: string) => `Alteração "${name}" tem problemas`,
  nextSteps: 'Próximos passos:',
  ensureDeltasInSpecs: 'Certifique-se de que a alteração tenha deltas em specs/: use os cabeçalhos ## ADDED/MODIFIED/REMOVED/RENAMED Requirements',
  eachRequirementNeedsScenario: 'Cada requisito DEVE incluir pelo menos um bloco #### Scenario:',
  debugParsedDeltas: 'Depure os deltas analisados: openspec change show <id> --json --deltas-only',
  skipSpecsConflictRemoveFiles: 'Esta alteração declara skip_specs (sem deltas de spec): exclua os arquivos em specs/, ou remova skip_specs do .openspec.yaml se os requisitos de fato mudam',
  skipSpecsConflictValidMetadata: 'skip_specs só é honrado quando .openspec.yaml é um metadado de alteração válido (schema: <nome> é obrigatório)',
  skipSpecsInvalidFixMetadata: 'Corrija o .openspec.yaml para que o marcador skip_specs possa ser honrado (schema: <nome> é obrigatório)',
  skipSpecsInvalidOrRemove: 'Ou remova skip_specs do .openspec.yaml e adicione specs de delta em vez disso',
  unableToRead: '(não foi possível ler)',
  noProposalYet: '(ainda sem proposal.md)',
  tasks: (completed: number, total: number) => `[tarefas ${completed}/${total}]`,
  deltas: (count: number) => `[deltas ${count}]`,
  // show --diff (ADDED/REMOVED/RENAMED/MODIFIED são termos reservados do
  // protocolo de deltas e não se traduzem)
  specDiffsHeading: 'Especificações alteradas (diffs)',
  noDeltaSpecsToDiff: (name: string) => `Nenhum spec de delta para comparar na alteração "${name}".`,
  noTextualChanges: '(sem alterações textuais)',
  diffHeaderNearMiss: (mainName: string) =>
    `O cabeçalho difere de "${mainName}" no spec principal apenas em caixa ou espaços; ` +
    `o archive casa nomes exatamente, então alinhe-os antes de arquivar`,
  diffNoMatchingRequirement: (name: string, capability: string) =>
    `Nenhum requisito correspondente encontrado para "${name}" no spec principal ${capability}`,
  diffNoMainSpec: (capability: string, name: string) =>
    `Não há spec principal em openspec/specs/${capability}/spec.md, ` +
    `então o requisito MODIFIED "${name}" não tem contra o que ser comparado`,
  diffLabelAdded: (name: string) => `  ADDED: ${name}`,
  diffLabelRemoved: (name: string) => `  REMOVED: ${name}`,
  diffLabelRenamed: (from: string, to: string) => `  RENAMED: ${from} → ${to}`,
  diffLabelModified: (name: string) => `  MODIFIED: ${name}`,
};

// ═══════════════════════════════════════════════════════════
// Comandos — Especificação (src/commands/spec.ts)
// ═══════════════════════════════════════════════════════════

export const SPEC_MESSAGES = {
  selectSpecToShow: 'Selecione uma especificação para exibir',
  missingSpecId: 'Argumento obrigatório <spec-id> ausente',
  missingPurposeSection: 'A especificação deve ter uma seção Purpose',
  missingRequirementsSection: 'A especificação deve ter uma seção Requirements',
  specNotFound: (id: string) => `Especificação '${id}' não encontrada em openspec/specs/${id}/spec.md`,
  requirementsAndRequirementConflict: 'As opções --requirements e --requirement não podem ser usadas juntas',
  requirementNotFound: (id: string) => `Requisito ${id} não encontrado`,
  specIsValid: (id: string) => `Especificação '${id}' é válida`,
  specHasIssues: (id: string) => `Especificação '${id}' tem problemas`,
  noItemsFound: 'Nenhum item encontrado.',
  requirementCount: (count: number) => `[requisitos ${count}]`,
  selectSpecToValidate: 'Selecione uma especificação para validar',
};

// ═══════════════════════════════════════════════════════════
// Comandos — Exibir (src/commands/show.ts)
// ═══════════════════════════════════════════════════════════

export const SHOW_MESSAGES = {
  whatToShow: 'O que você gostaria de exibir?',
  optionChange: 'Alteração',
  optionSpec: 'Especificação',
  noChangesFound: 'Nenhuma alteração encontrada.',
  noSpecsFound: 'Nenhuma especificação encontrada.',
  pickChange: 'Escolha uma alteração',
  pickSpec: 'Escolha uma especificação',
  nothingToShow: 'Nada para exibir. Tente um dos seguintes:',
  showItemHint: '  openspec show <item>',
  showChangeHint: '  openspec change show',
  showSpecHint: '  openspec spec show',
  runInteractiveHint: 'Ou execute em um terminal interativo.',
  unknownItem: (name: string) => `Item desconhecido '${name}'`,
  didYouMean: (suggestions: string) => `Você quis dizer: ${suggestions}?`,
  ambiguousItem: (name: string) => `Item '${name}' é ambíguo e corresponde tanto a uma alteração quanto a uma especificação.`,
  passTypeHint: 'Passe --type change|spec, ou use: openspec change show / openspec spec show',
  ignoringFlags: (type: string, flags: string) => `Aviso: Ignorando flags que não se aplicam a ${type}: ${flags}`,
};

// ═══════════════════════════════════════════════════════════
// Comandos — Validar (src/commands/validate.ts)
// ═══════════════════════════════════════════════════════════

export const VALIDATE_MESSAGES = {
  whatToValidate: 'O que você gostaria de validar?',
  optionAll: 'Tudo (alterações + especificações)',
  optionAllChanges: 'Todas as alterações',
  optionAllSpecs: 'Todas as especificações',
  optionPickOne: 'Escolher uma alteração ou especificação específica',
  pickAnItem: 'Escolha um item',
  noItemsToValidate: 'Nenhum item encontrado para validar.',
  nothingToValidate: 'Nada para validar. Tente um dos seguintes:',
  validateAllHint: '  openspec validate --all',
  validateChangesHint: '  openspec validate --changes',
  validateSpecsHint: '  openspec validate --specs',
  validateItemHint: '  openspec validate <nome-do-item>',
  runInteractiveHint: 'Ou execute em um terminal interativo.',
  unknownItem: (name: string) => `Item desconhecido '${name}'`,
  didYouMean: (suggestions: string) => `Você quis dizer: ${suggestions}?`,
  ambiguousItem: (name: string) => `Item '${name}' é ambíguo e corresponde tanto a uma alteração quanto a uma especificação.`,
  passTypeHint: 'Passe --type change|spec, ou use: openspec change validate / openspec spec validate',
  changeIsValid: (id: string) => `Alteração '${id}' é válida`,
  specIsValid: (id: string) => `Especificação '${id}' é válida`,
  changeHasIssues: (id: string) => `Alteração '${id}' tem problemas`,
  specHasIssues: (id: string) => `Especificação '${id}' tem problemas`,
  nextStepsChange: 'Próximos passos:',
  ensureDeltasInSpecs: 'Certifique-se de que a alteração tenha deltas em specs/: use os cabeçalhos ## ADDED/MODIFIED/REMOVED/RENAMED Requirements',
  eachRequirementNeedsScenario: 'Cada requisito DEVE incluir pelo menos um bloco #### Scenario:',
  debugParsedDeltas: 'Depure os deltas analisados: openspec change show <id> --json --deltas-only',
  skipSpecsConflictRemoveFiles: 'Esta alteração declara skip_specs (sem deltas de spec): exclua os arquivos em specs/, ou remova skip_specs do .openspec.yaml se os requisitos de fato mudam',
  skipSpecsConflictValidMetadata: 'skip_specs só é honrado quando .openspec.yaml é um metadado de alteração válido (schema: <nome> nomeando um esquema conhecido é obrigatório)',
  skipSpecsInvalidFixMetadata: 'Corrija o .openspec.yaml para que o marcador skip_specs possa ser honrado (schema: <nome> nomeando um esquema conhecido é obrigatório)',
  skipSpecsInvalidOrRemove: 'Ou remova skip_specs do .openspec.yaml e adicione specs de delta em vez disso',
  nextStepsSpec: 'Próximos passos:',
  ensurePurposeAndRequirements: 'Certifique-se de que a especificação inclua as seções ## Purpose e ## Requirements',
  requirementScenarioBullet: '- Cada requisito DEVE incluir pelo menos um bloco #### Scenario:',
  rerunWithJson: 'Execute novamente com --json para ver o relatório estruturado',
  validating: 'Validando...',
  validatingProgress: (current: number, total: number) => `Validando (${current}/${total})...`,
  noItemsFoundToValidate: 'Nenhum item encontrado para validar.',
  totals: (passed: number, failed: number, total: number) => `Totais: ${passed} aprovado(s), ${failed} reprovado(s) (${total} itens)`,
  passed: 'aprovado',
  failed: 'reprovado',
  // validate --archived
  validatingArchived: 'Validando alterações arquivadas...',
  noArchivedChangesFound: 'Nenhuma alteração arquivada encontrada.',
  couldNotReadTaskFile: 'não foi possível ler o arquivo de tarefas',
  incompleteTasks: (incomplete: number, completed: number, total: number) =>
    `${incomplete} tarefa(s) incompleta(s) (${completed}/${total} concluída(s))`,
};

// ═══════════════════════════════════════════════════════════
// Core — Listar (src/core/list.ts)
// ═══════════════════════════════════════════════════════════

export const LIST_MESSAGES = {
  noChangesDir: "Diretório de alterações do BR-OpenSpec não encontrado. Execute 'openspec init' primeiro.",
  noActiveChanges: 'Nenhuma alteração ativa encontrada.',
  noSpecsFound: 'Nenhuma especificação encontrada.',
  changesHeader: 'Alterações:',
  specsHeader: 'Especificações:',
  relativeTime: {
    justNow: 'agora mesmo',
    minutesAgo: (m: number) => `${m}min atrás`,
    hoursAgo: (h: number) => `${h}h atrás`,
    daysAgo: (d: number) => `${d}d atrás`,
  },
  requirements: (count: number) => `requisitos ${count}`,
  statusLabels: {
    noTasks: 'sem-tarefas',
    complete: 'concluído',
    inProgress: 'em-andamento',
  },
};

// ═══════════════════════════════════════════════════════════
// Core — Visualizar (src/core/view.ts)
// ═══════════════════════════════════════════════════════════

export const VIEW_MESSAGES = {
  noOpenspecDir: 'Diretório openspec não encontrado',
  dashboardTitle: 'Painel BR-OpenSpec',
  draftChanges: 'Alterações em Rascunho',
  activeChanges: 'Alterações Ativas',
  completedChanges: 'Alterações Concluídas',
  specifications: 'Especificações',
  summary: 'Resumo:',
  specsSummary: (totalSpecs: number, totalRequirements: number) => `Especificações: ${totalSpecs} specs, ${totalRequirements} requisitos`,
  draftChangesCount: (count: number) => `Alterações em Rascunho: ${count}`,
  activeChangesCount: (count: number) => `Alterações Ativas: ${count} em andamento`,
  completedChangesCount: (count: number) => `Alterações Concluídas: ${count}`,
  taskProgress: (completed: number, total: number, percentage: number) => `Progresso de Tarefas: ${completed}/${total} (${percentage}% concluído)`,
  requirementLabel: (count: number) => count === 1 ? 'requisito' : 'requisitos',
  listHint: (cmd: string) => `Use ${cmd} para visualizações detalhadas`,
  listHintCommands: (cmd1: string, cmd2: string) => `Use ${cmd1} ou ${cmd2} para visualizações detalhadas`,
};

// ═══════════════════════════════════════════════════════════
// Core — Arquivar (src/core/archive.ts)
// ═══════════════════════════════════════════════════════════

export const ARCHIVE_MESSAGES = {
  noChangesDir: "Diretório de alterações do BR-OpenSpec não encontrado. Execute 'openspec init' primeiro.",
  changeNotFound: (name: string) => `Alteração '${name}' não encontrada.`,
  noChangeSelected: 'Nenhuma alteração selecionada. Cancelando.',
  noActiveChanges: 'Nenhuma alteração ativa encontrada.',
  selectChangeToArchive: 'Selecione uma alteração para arquivar',
  proposalWarnings: 'Avisos na proposta proposal.md (não bloqueante):',
  validationErrorsInDeltas: 'Erros de validação nos deltas da alteração:',
  validationFailed: 'Validação falhou. Corrija os erros antes de arquivar.',
  skipValidationHint: 'Para pular a validação (não recomendado), use a flag --no-validate.',
  skipValidationWarning: 'Aviso: Pular a validação pode arquivar especificações inválidas. Continuar? (s/N)',
  archiveCancelled: 'Arquivamento cancelado.',
  skipValidationLog: (timestamp: string, name: string) => `[${timestamp}] Validação ignorada para a alteração: ${name}`,
  affectedFiles: (path: string) => `Arquivos afetados: ${path}`,
  skipValidationFlagWarning: 'Aviso: Pular a validação pode arquivar especificações inválidas.',
  taskStatus: (status: string) => `Status das tarefas: ${status}`,
  incompleteTasksWarning: (count: number) => `Aviso: ${count} tarefa(s) incompleta(s) encontrada(s). Continuar?`,
  incompleteTasksContinuing: (count: number) => `Aviso: ${count} tarefa(s) incompleta(s) encontrada(s). Continuando devido à flag --yes.`,
  skipSpecUpdates: 'Ignorando atualizações de especificação (flag --skip-specs fornecida).',
  specsToUpdate: 'Especificações para atualizar:',
  actionUpdate: 'atualizar',
  actionCreate: 'criar',
  specUpdateStatus: (capability: string, status: string) => `  ${capability}: ${status}`,
  proceedWithSpecUpdates: 'Prosseguir com as atualizações de especificação?',
  skipSpecUpdatesProceeding: 'Ignorando atualizações de especificação. Prosseguindo com o arquivamento.',
  validationErrorsInRebuiltSpec: (name: string) => `Erros de validação na especificação reconstruída para ${name} (as alterações não serão escritas):`,
  abortedNoChanges: 'Abortado. Nenhum arquivo foi alterado.',
  totals: (added: number, modified: number, removed: number, renamed: number) =>
    `Totais: + ${added}, ~ ${modified}, - ${removed}, → ${renamed}`,
  specsUpdatedSuccessfully: 'Especificações atualizadas com sucesso.',
  archiveAlreadyExists: (name: string) => `O arquivamento '${name}' já existe.`,
  changeArchived: (changeName: string, archiveName: string) => `Alteração '${changeName}' arquivada como '${archiveName}'.`,
  specsAlreadyInSync: 'Especificações já estão sincronizadas; nenhum arquivo alterado.',
  blockedSkipValidation: (rerun: string) =>
    `Pular a validação requer confirmação, e não foi possível ler uma resposta do stdin.\nCorreção: ${rerun}`,
  blockedIncompleteTasks: (count: number, changeName: string, rerun: string) =>
    `${count} tarefa(s) incompleta(s) encontrada(s) na alteração '${changeName}', e não foi possível ler uma resposta do stdin.\nCorreção: conclua as tarefas ou execute novamente com ${rerun}`,
  blockedSpecUpdatesConfirmation: (count: number, rerun: string) =>
    `Atualizar ${count} especificação(ões) requer confirmação, e não foi possível ler uma resposta do stdin.\nCorreção: ${rerun}`,
  blockedChangeNameRequired: (rerun: string) =>
    `Um nome de alteração é obrigatório: não foi possível ler uma resposta do stdin.\nCorreção: ${rerun}`,
  // Seletor de alteração sem terminal (stdin ou stdout não-TTY, #1526): recusa
  // antes de renderizar o menu do @inquirer, que escreveria escapes ANSI num
  // pipe ou arquivo.
  blockedChangeNameRequiredNoTerminal: (rerun: string) =>
    `Um nome de alteração é obrigatório: não há terminal disponível para escolher uma da lista.\nCorreção: ${rerun}`,
  // Limites de caminho (raízes gerenciadas e fallback copy-then-remove)
  unsupportedFilesystemEntry: (srcPath: string) => `Não é possível arquivar uma entrada de sistema de arquivos não suportada: ${srcPath}`,
  pathOutsideRoot: (managedDir: string) => `Recusando arquivar por um caminho fora da raiz do BR-OpenSpec: ${managedDir}`,
  // Aposentadoria de capabilities (#1302, #1696) e transação de arquivamento
  // (claim do destino, fingerprints, snapshots e rollback).
  changeIsSymlink: (name: string) =>
    `A alteração '${name}' é um link simbólico. Substitua-o por um diretório real antes de arquivar.`,
  archiveBeingCreated: (archiveName: string, claimPath: string) =>
    `O arquivamento '${archiveName}' já está sendo criado. Se nenhum processo de arquivamento estiver em execução, remova a reivindicação obsoleta em ${claimPath} e execute novamente.`,
  expectedDirectoryWhileVerifying: (dir: string) => `Esperava um diretório ao verificar ${dir}.`,
  pathChangedWhileReading: (filePath: string) => `O caminho ${filePath} mudou enquanto o arquivamento o lia.`,
  directoryChangedWhileReading: (dir: string) => `O diretório ${dir} mudou enquanto o arquivamento o lia.`,
  changeContentsChangedDuringFallbackCopy: (src: string, dest: string) =>
    `O conteúdo do diretório da alteração mudou durante a cópia de fallback de ${src} para ${dest}.`,
  couldNotStageBeforeFallback: (src: string, error: string) =>
    `Não foi possível preparar ${src} com segurança antes da cópia de fallback do arquivamento (${error}). Nenhuma cópia de fallback foi tentada.`,
  couldNotRestoreStagedSource: (original: string, staged: string, error: string) =>
    `${original} Não foi possível restaurar a origem preparada em ${staged} (${error}).`,
  copiedButStagedSourceRetained: (src: string, dest: string, staged: string, error: string) =>
    `${src} foi copiado para ${dest}, mas não foi possível remover completamente a origem preparada em ${staged} (${error}). O destino completo foi mantido para recuperação.`,
  retirementAuthorizationChangedBeforeComplete: (file: string) =>
    `A autorização de aposentadoria em ${file} mudou antes que o arquivamento pudesse ser concluído.`,
  specUpdatesResolveToSameTarget: (a: string, b: string, identity: string) =>
    `As atualizações de especificação de '${a}' e '${b}' resolvem para o mesmo alvo ${identity}. Substitua o alias da capability ou combine os deltas antes de arquivar.`,
  rollbackWouldOverwriteConcurrent: (target: string) =>
    `O rollback do arquivamento sobrescreveria uma alteração concorrente em ${target}.`,
  rollbackWouldOverwriteConcurrentRetained: (target: string, displaced: string) =>
    `O rollback do arquivamento sobrescreveria uma alteração concorrente em ${target}. A especificação deslocada foi mantida em ${displaced}.`,
  displacedSpecChangedAfterVerification: 'a especificação deslocada mudou após a verificação da aposentadoria',
  couldNotRemoveRetirementBackup: (backupPath: string, error: string) =>
    `Não foi possível remover o backup de aposentadoria confirmado em ${backupPath} (${error}).`,
  changeRemainsArchivedBackupsRetained: (errors: string) =>
    `${errors} A alteração permanece arquivada e cada backup listado foi mantido para recuperação.`,
  specInputsChangedWhilePreparing: (id: string) =>
    `As entradas de especificação de '${id}' mudaram enquanto o arquivamento preparava a prévia.`,
  retirementAuthorizationChangedAtPrompt: (file: string) =>
    `A autorização de aposentadoria em ${file} mudou enquanto o arquivamento aguardava confirmação.`,
  changeSpecsChangedAtPrompt: 'As especificações da alteração mudaram enquanto o arquivamento aguardava confirmação.',
  deltaChangedAtPrompt: (id: string) => `O delta de '${id}' mudou enquanto o arquivamento aguardava confirmação.`,
  specInputsChangedAtPrompt: (id: string) =>
    `As entradas de especificação de '${id}' mudaram enquanto o arquivamento aguardava confirmação. Nenhum arquivo foi alterado; revise o novo conteúdo e execute novamente.`,
  mainSpecChangedAtPrompt: (id: string) =>
    `A especificação principal '${id}' mudou enquanto o arquivamento aguardava confirmação. Nenhum arquivo foi alterado; revise o novo conteúdo e execute novamente.`,
  // Dica impressa quando só o marcador retire_capabilities está faltando.
  retirementHint: (specName: string, metadataFile: string) =>
    `Esta alteração remove o último requisito que '${specName}' possui. Para aposentar a capability e excluir sua especificação, adicione \`retire_capabilities: true\` ao ${metadataFile} da alteração (ao lado do \`schema:\`, que esse arquivo exige) e execute novamente.`,
  // Sufixo (com espaço inicial) anexado às dicas quando o marcador presente não pode ser honrado.
  retirementMarkerCannotBeHonored: (reason: string) => ` O marcador presente agora não pode ser honrado (${reason}).`,
  // #1696: marcador ausente E conteúdo que a mesclagem não consegue contabilizar.
  retirementBlockedByContent: (specName: string, lines: string) =>
    `Esta alteração remove o último requisito que '${specName}' possui, então a especificação reconstruída fica sem nenhum e não pode ser escrita. Em vez disso, o arquivamento aposenta a capability, mas isso é recusado enquanto a especificação contiver conteúdo que a mesclagem não consegue contabilizar com segurança e que a exclusão do arquivo levaria junto: ${lines}. Mova esse conteúdo para \`## Purpose\` ou para um requisito canônico, ou exclua a especificação manualmente, e execute novamente.`,
  // Marcador declarado, mas a aposentadoria foi recusada por conteúdo não contabilizado.
  retirementRefused: (specName: string, lines: string) =>
    `'${specName}' declara retire_capabilities, mas a especificação contém conteúdo que a mesclagem não consegue contabilizar com segurança e que a exclusão do arquivo levaria junto: ${lines}. Mova esse conteúdo para \`## Purpose\` ou para um requisito canônico, ou exclua a especificação manualmente.`,
  // Sufixo (com vírgula inicial) da lista de linhas bloqueantes quando há mais de 3.
  unaccountedMoreLines: (count: number) => `, e mais ${count} linha(s)`,
  specInputsChangedBeforeApply: (id: string) =>
    `As entradas de especificação de '${id}' mudaram antes que o arquivamento pudesse aplicá-las. Nenhum arquivo foi alterado; revise o novo conteúdo e execute novamente.`,
  specInputsChangedBeforeWrite: (id: string) =>
    `As entradas de especificação de '${id}' mudaram antes que o arquivamento pudesse escrevê-las.`,
  retirementAuthorizationUnavailable: (file: string) => `A autorização de aposentadoria em ${file} não está disponível.`,
  specInputsChangedBeforeRetire: (id: string) =>
    `As entradas de especificação de '${id}' mudaram antes que o arquivamento pudesse aposentá-las.`,
  mainSpecChangedWhileSecuring: (id: string) =>
    `A especificação principal '${id}' mudou enquanto o arquivamento a protegia para a aposentadoria.`,
  couldNotTrackDisplacedSpec: (id: string) =>
    `Não foi possível rastrear a especificação principal deslocada de '${id}' durante a aposentadoria.`,
  // Linha de recuperação impressa logo após "Aposentando <caminho>".
  retirementRecoveryCommand: (pasteablePath: string) =>
    `Se o arquivo estava commitado, restaure-o com: git checkout HEAD -- ${pasteablePath}`,
  retirementRecoveryGuidance: (deletedPath: string) =>
    `O arquivo foi excluído de ${deletedPath}; se estava commitado, restaure-o a partir do histórico desse checkout.`,
  deltaChangedBeforeArchive: (id: string) => `O delta de '${id}' mudou antes que a alteração pudesse ser arquivada.`,
  archivedDeltaChangedDuringMove: (id: string) => `O delta arquivado de '${id}' mudou durante a movimentação final.`,
  activeDeltaChangedDuringFallbackCopy: (id: string) => `O delta ativo de '${id}' mudou durante a cópia de fallback.`,
  rollbackAlsoFailed: (original: string, errors: string) => `${original} O rollback também falhou: ${errors}`,
};

// ═══════════════════════════════════════════════════════════
// Core — Inicializar (src/core/init.ts)
// ═══════════════════════════════════════════════════════════

export const INIT_MESSAGES = {
  welcomeTitle: 'Bem-vindo ao BR-OpenSpec',
  welcomeSubtitle: 'Leve e orientado a especificações',
  setupWillConfigure: 'Esta configuração irá configurar:',
  agentSkills: '  • Agent Skills para sua IA',
  slashCommands: '  • Comandos /opsx:*',
  quickStart: 'Início rápido após a configuração:',
  pressEnter: 'Pressione Enter para continuar...',
  insufficientPermissions: (path: string) => `Permissões insuficientes para escrever em ${path}`,
  invalidProfile: (profile: string) => `Perfil inválido "${profile}". Perfis disponíveis: core, custom`,
  upgradeLegacyPrompt: 'Atualizar e limpar arquivos legados?',
  preservedDeferredGlobalPrompts: 'Prompts globais adiados preservados por falta de skills substitutas:',
  initializationCancelled: 'Inicialização cancelada.',
  skipPromptHint: 'Execute com --force para pular esta pergunta, ou remova manualmente os arquivos legados.',
  cleaningLegacy: 'Limpando arquivos legados...',
  legacyCleaned: 'Arquivos legados limpos',
  noToolsDetected: (tools: string) => `Nenhuma ferramenta detectada e nenhuma flag --tools fornecida. Ferramentas válidas:\n  ${tools}\n\nUse --tools all, --tools none, ou --tools claude,cursor,...`,
  noToolsAvailable: 'Nenhuma ferramenta disponível para geração de skills.',
  selectToolsPrompt: (count: number) => `Selecione as ferramentas para configurar (${count} disponíveis)`,
  selectAtLeastOneTool: 'Selecione pelo menos uma ferramenta',
  atLeastOneToolRequired: 'Pelo menos uma ferramenta deve ser selecionada',
  toolsOptionRequired: 'A opção --tools requer um valor. Use "all", "none", ou uma lista de IDs separada por vírgula.',
  toolsOptionRequiresToolId: 'A opção --tools requer pelo menos um ID de ferramenta quando não usar "all" ou "none".',
  cannotCombineReservedValues: 'Não é possível combinar valores reservados "all" ou "none" com IDs de ferramentas específicos.',
  invalidTools: (invalid: string, available: string) => `Ferramenta(s) inválida(s): ${invalid}. Valores disponíveis: ${available}`,
  unknownTool: (toolId: string, validTools: string) => `Ferramenta desconhecida '${toolId}'. Ferramentas válidas:\n  ${validTools}`,
  toolNoSkillSupport: (toolId: string, validTools: string) => `Ferramenta '${toolId}' não suporta geração de skills.\nFerramentas com suporte a geração de skills:\n  ${validTools}`,
  creatingStructure: 'Criando estrutura do BR-OpenSpec...',
  structureCreated: 'Estrutura do BR-OpenSpec criada',
  settingUp: (name: string) => `Configurando ${name}...`,
  setupComplete: (name: string) => `Configuração concluída para ${name}`,
  setupFailed: (name: string) => `Falha na configuração de ${name}`,
  // Aviso (dim) quando duas ou mais ferramentas selecionadas compartilham a
  // mesma árvore física de skills (`antigravity`, `codex`, `zed` e `agents` em
  // `.agents/skills`): só o dono (`owner`, um id de ferramenta) escreve, com
  // referências que servem a todos os consumidores; as demais continuam
  // escrevendo a própria superfície de comandos.
  sharedSkillsRootOneTree: (names: string, root: string, owner: string) =>
    `${names} compartilham ${root}/skills; escrevendo uma única árvore para ${owner}.`,
  setupCompleteTitle: 'Configuração do BR-OpenSpec Concluída',
  setupIncompleteTitle: 'Configuração do BR-OpenSpec Incompleta',
  // Lançado após o resumo quando alguma ferramenta falhou (exit ≠ 0 para automação).
  setupFailedFor: (names: string) => `A configuração do BR-OpenSpec falhou para: ${names}`,
  created: (names: string) => `Criados: ${names}`,
  refreshed: (names: string) => `Atualizados: ${names}`,
  failed: (errors: string) => `Falhas: ${errors}`,
  commandsSkipped: (tools: string) => `Comandos ignorados para: ${tools} (sem adaptador)`,
  // Ferramentas skills-invocable (Codex): a superfície de comandos é a própria skill.
  commandsSkippedUsesSkills: (tools: string) => `Comandos ignorados para: ${tools} (usa skills)`,
  removedCommands: (count: number) => `Removidos: ${count} arquivos de comando (entrega: skills)`,
  removedSkills: (count: number) => `Removidos: ${count} diretórios de skill (entrega: commands)`,
  // Copilot coding agent (nuvem) — opt-in dos arquivos gerados em .github/.
  copilotCloudFlagIgnored:
    '--copilot-cloud/--no-copilot-cloud foi ignorado porque a ferramenta github-copilot não foi selecionada.',
  copilotCloudPrompt:
    'Configurar os arquivos do Copilot coding agent (nuvem) do GitHub? Isso é para o Copilot coding agent ' +
    'hospedado no GitHub (github.com), não para o Copilot no seu editor. Serão escritos dois arquivos: ' +
    '.github/workflows/copilot-setup-steps.yml e .github/agents/openspec.agent.md.',
  copilotCloudFiles: (files: string) => `Arquivos do Copilot coding agent (nuvem): ${files}`,
  removedCopilotCloudOptOut: (count: number) =>
    `Removidos: ${count} arquivo(s) do Copilot coding agent (nuvem) (opt-out dos arquivos de nuvem)`,
  copilotCloudSkipped:
    "Arquivos do Copilot coding agent (nuvem) ignorados (opt-in). Ative com 'openspec init --copilot-cloud'.",
  skillsAndCommandsCount: (skills: number, commands: number, dirs: string) => `${skills} skills e ${commands} commands em ${dirs}/`,
  skillsCount: (skills: number, dirs: string) => `${skills} skills em ${dirs}/`,
  commandsCount: (commands: number, dirs: string) => `${commands} commands em ${dirs}/`,
  // Variantes para alvos de skills globais (fora do projeto): `dirs` já são caminhos
  // absolutos completos, então não recebem a barra final das chaves acima.
  skillsInDirs: (skills: number, dirs: string) => `${skills} skills em ${dirs}`,
  commandsInDirs: (commands: number, dirs: string) => `${commands} commands em ${dirs}`,
  configCreated: (schema: string) => `Config: openspec/config.yaml (schema: ${schema})`,
  configExists: (name: string) => `Config: openspec/${name} (existe)`,
  configSkipped: 'Config: ignorado (modo não interativo)',
  // Idioma dos artefatos (`init --language`). O bloco gravado no config.yaml
  // fica em inglês (é lido pelos agentes); só os erros são traduzidos.
  languageRequiresValue: 'A opção --language requer um valor não vazio.',
  languageMustBeSingleLine:
    'A opção --language deve ser uma única linha, sem caracteres de controle ou de formatação invisíveis.',
  languageTooLong: (limitKb: string) =>
    `O valor de --language é longo demais para o limite de ${limitKb}KB do contexto de projeto do BR-OpenSpec.`,
  // `reason` já chega prefixado com ": " (ou vazio), como no upstream.
  languageCannotCreateConfig: (reason: string) =>
    `Não é possível criar openspec/config.yaml para --language${reason}`,
  languageConfigNotWritable:
    'Não é possível criar openspec/config.yaml para --language: o destino não tem permissão de escrita.',
  languageDoesNotOverwriteConfig:
    '--language não sobrescreve uma configuração existente do BR-OpenSpec. ' +
    'Em vez disso, adicione a instrução de idioma ao campo context dela.',
  languageConfigWriteFailed: (reason: string) =>
    `Falha ao criar openspec/config.yaml para --language${reason}`,
  gettingStarted: 'Início rápido:',
  startFirstChange: (cmd: string) => `Inicie sua primeira alteração: ${cmd}`,
  // Ferramentas sem superfície de slash (Rovo Dev): a dica vira instrução,
  // já que não há comando a digitar.
  startFirstChangeAskTool: (toolName: string, skillRef: string) =>
    `Inicie sua primeira alteração: peça ao ${toolName} para usar ${skillRef} com "sua ideia"`,
  startFirstChangeWithSkill: (skillRef: string) => `Inicie sua primeira alteração com ${skillRef}`,
  noSkillsOrCommandsGenerated: (names: string, singular: boolean) =>
    `Nenhuma skill nem comando foi gerado para ${names}: a entrega está definida como 'commands', mas ${singular ? 'ela suporta' : 'elas suportam'} apenas skills. ` +
    `Execute 'openspec config set delivery both' para gerar skills.`,
  configureWorkflowsHint: "Execute 'openspec config profile' para configurar seus fluxos de trabalho.",
  learnMore: (url: string) => `Saiba mais: ${url}`,
  feedback: (url: string) => `Feedback:   ${url}`,
  restartIDE: 'Reinicie sua IDE para que os novos comandos tenham efeito.',
  restartIDESkills: 'Reinicie sua IDE para que as novas skills tenham efeito.',
  configuredPreselected: (names: string) => `BR-OpenSpec configurado: ${names} (pré-selecionado)`,
  detectedToolsLabel: (names: string, label: string) => `Diretórios de ferramentas detectados: ${names} (${label})`,
  preselectedFirstTime: 'pré-selecionado para configuração inicial',
  notPreselected: 'não pré-selecionado',
};

// ═══════════════════════════════════════════════════════════
// Comandos — Ferramentas (src/commands/tools.ts)
// ═══════════════════════════════════════════════════════════

export const TOOLS_MESSAGES = {
  notInitialized: 'Este projeto não foi inicializado com o BR-OpenSpec.\n  Execute `openspec init` primeiro.',
  noToolsToAdd: 'Nenhuma ferramenta especificada para adicionar.',
  noToolsToRemove: 'Nenhuma ferramenta especificada para remover.',
  adding: (name: string) => `Adicionando ${name}...`,
  added: (name: string) => `Adicionado ${name}`,
  failedToAdd: (name: string) => `Falha ao adicionar ${name}`,
  addedList: (names: string) => `Adicionados: ${names}`,
  failedList: (items: string) => `Falhas: ${items}`,
  restartIDE: 'Reinicie sua IDE para que os comandos de barra tenham efeito.',
  removing: (name: string) => `Removendo ${name}...`,
  removed: (name: string) => `Removido ${name}`,
  failedToRemove: (name: string) => `Falha ao remover ${name}`,
  removedList: (names: string) => `Removidos: ${names}`,
  removedCounts: (skills: number, commands: number) => `  ${skills} diretório(s) de skill e ${commands} arquivo(s) de comando removidos`,
  // Ferramentas com alvo de skills global (fora do projeto): as skills são
  // compartilhadas entre projetos e não são removidas a partir de um deles.
  globalSkillsKept: (name: string, dir: string) =>
    `  Skills globais de ${name} mantidas em ${dir} (compartilhadas entre projetos); remova-as manualmente se não usar em outros projetos.`,
  // Raiz de skills compartilhada por mais de uma ferramenta (ex.: `.agents/skills`,
  // usada por Codex e agents): só a ferramenta dona da árvore pode removê-la.
  sharedSkillsKept: (name: string, dir: string, owner: string) =>
    `  Skills mantidas em ${dir}: essa raiz é compartilhada e pertence a ${owner}, não a ${name}.`,
  currentlyConfigured: (names: string) => `Configurados atualmente: ${names}`,
  noToolsConfigured: 'Nenhuma ferramenta configurada atualmente.',
  selectToolsToConfigure: (count: number) => `Selecione as ferramentas para configurar (${count} disponíveis)`,
  noChanges: 'Nenhuma alteração.',
  description: 'Adiciona ou remove configurações de IDE/Agente de Código. Exibe uma lista de verificação interativa quando nenhuma flag é fornecida.',
  addOption: 'Adiciona ferramentas (IDs separados por vírgula ou "all")',
  removeOption: 'Remove ferramentas (IDs separados por vírgula ou "all")',
  cannotAddAndRemoveSame: (tools: string) => `Não é possível adicionar e remover as mesmas ferramentas: ${tools}`,
  noFlagNonInteractive: 'Nenhuma flag --add ou --remove foi fornecida e o terminal não é interativo.\n  Use --add <ferramentas> ou --remove <ferramentas> para operar não interativamente.',
  addRemoveRequiresValue: 'A opção --add/--remove requer um valor. Use "all" ou uma lista de IDs de ferramentas separados por vírgula.',
  cannotCombineReserved: 'Não é possível combinar valores reservados "all" ou "none" com IDs de ferramentas específicos.',
  invalidTools: (invalid: string, available: string) => `Ferramenta(s) inválida(s): ${invalid}. Disponíveis: ${available}`,
};

// ═══════════════════════════════════════════════════════════
// Comandos — Configuração (src/commands/config.ts)
// ═══════════════════════════════════════════════════════════

export const CONFIG_MESSAGES = {
  viewAndModify: 'Visualiza e modifica a configuração global do BR-OpenSpec',
  showLocation: 'Mostra o caminho do arquivo de configuração',
  showAllSettings: 'Mostra todas as configurações atuais',
  getValue: 'Obtém um valor específico (raw, scriptável)',
  setValue: 'Define um valor (coerção de tipos automática)',
  removeKey: 'Remove uma chave (reverte para o padrão)',
  resetConfig: 'Restaura a configuração para os padrões',
  openInEditor: 'Abre a configuração no $EDITOR',
  configureProfile: 'Configura o perfil do fluxo de trabalho (seletor interativo ou atalho de preset)',
  schemaDescription: 'Descrição do esquema:',
  selectArtifacts: 'Selecione os artefatos para incluir:',
  setAsDefaultSchema: 'Definir como esquema padrão do projeto?',
  resetConfirm: 'Restaurar todas as configurações para os padrões?',
  whatToConfigure: 'O que você deseja configurar?',
  deliveryMode: 'Modo de entrega (como os fluxos de trabalho são instalados):',
  selectWorkflows: 'Selecione os fluxos de trabalho a tornar disponíveis:',
  applyChangesNow: 'Aplicar alterações a este projeto agora?',
  profileSettings: 'Configurações de perfil:',
  invalidConfigKey: (key: string, reason: string) => `Chave de configuração inválida "${key}".${reason}`,
  useConfigList: 'Use "openspec config list" para ver as chaves disponíveis.',
  passAllowUnknown: 'Passe --allow-unknown para ignorar esta verificação.',
  configKeySegmentNotAllowed: (segment: string) => `O segmento de chave "${segment}" não é permitido`,
  telemetryRequiresNestedKey: 'Defina chaves aninhadas sob telemetry (ex.: telemetry.enabled)',
  unknownTelemetryKey: (key: string) => `Chave de telemetria desconhecida "${key}" (permitidas: enabled)`,
  invalidConfiguration: (error: string) => `Configuração inválida - ${error}`,
  setKeyValue: (key: string, value: string) => `Definido ${key} = ${value}`,
  unsetKey: (key: string) => `Removido ${key} (revertido para o padrão)`,
  keyNotSet: (key: string) => `Chave "${key}" não estava definida`,
  resetAllRequired: 'Erro: A flag --all é obrigatória para reset',
  resetUsage: 'Uso: openspec config reset --all [-y]',
  resetCancelled: 'Reset cancelado.',
  configurationReset: 'Configuração restaurada para os padrões',
  noEditorConfigured: 'Erro: Nenhum editor configurado',
  setEditorEnv: 'Defina a variável de ambiente EDITOR ou VISUAL para o seu editor preferido',
  editorExample: 'Exemplo: export EDITOR=vim',
  configFileNotFound: (path: string) => `Erro: Arquivo de configuração não encontrado em ${path}`,
  invalidJson: (path: string) => `Erro: JSON inválido em ${path}`,
  unableToValidateConfig: (error: string) => `Erro: Não foi possível validar a configuração - ${error}`,
  configUpdated: 'Configuração atualizada. Execute `openspec update` nos seus projetos para aplicar.',
  unknownProfilePreset: (preset: string) => `Erro: Preset de perfil desconhecido "${preset}". Presets disponíveis: core`,
  interactiveModeRequired: 'Modo interativo necessário. Use `openspec config profile core` ou defina a configuração via ambiente/flags.',
  currentProfileSettings: 'Configurações atuais do perfil',
  profileLabel: (profile: string | undefined, source: string) => `  perfil: ${profile ?? '?'} ${source}`,
  deliveryLabel: (delivery: string | undefined, source?: string) => source ? `  entrega: ${delivery ?? '?'} ${source}` : `  Entrega: ${delivery ?? '?'}`,
  workflowsLabel: (summary: string) => `  Fluxos de trabalho: ${summary}`,
  workflowsSelectedCount: (count: number, profile: string) => `${count} selecionados (${profile})`,
  workflowsAdded: (names: string) => `adicionados ${names}`,
  workflowsRemoved: (names: string) => `removidos ${names}`,
  workflowsDiffLabel: (changes: string) => `fluxos de trabalho: ${changes}`,
  workflowLabel: (name: string) => `Fluxo de trabalho: ${name}`,
  coreWorkflowsNote: (workflows: string) => `  fluxos: ${workflows} (do perfil core)`,
  explicitWorkflowsNote: (workflows: string) => `  fluxos: ${workflows} (explícito)`,
  noWorkflowsNote: '  fluxos: (nenhum)',
  deliveryHelp: '  Entrega = onde os fluxos de trabalho são instalados (skills, commands, ou both)',
  workflowsHelp: '  Fluxos de trabalho = quais ações estão disponíveis (propose, explore, apply, etc.)',
  deliveryAndWorkflows: 'Entrega e fluxos de trabalho',
  deliveryAndWorkflowsDesc: 'Atualiza modo de instalação e ações disponíveis juntos',
  deliveryOnly: 'Apenas entrega',
  deliveryOnlyDesc: 'Altera onde os fluxos de trabalho são instalados',
  workflowsOnly: 'Apenas fluxos de trabalho',
  workflowsOnlyDesc: 'Altera quais ações de fluxo de trabalho estão disponíveis',
  keepCurrentSettings: 'Manter configurações atuais (sair)',
  keepCurrentSettingsDesc: 'Sair sem alterar a configuração',
  noConfigChanges: 'Nenhuma alteração na configuração.',
  warningGlobalConfigNotApplied: 'Aviso: A configuração global não foi aplicada a este projeto. Execute `openspec update` para sincronizar.',
  bothSkillsAndCommands: 'Ambos (skills + commands)',
  bothSkillsAndCommandsDesc: 'Instala fluxos de trabalho como skills e comandos de barra',
  skillsOnly: 'Apenas skills',
  skillsOnlyDesc: 'Instala fluxos de trabalho apenas como skills',
  commandsOnly: 'Apenas commands',
  commandsOnlyDesc: 'Instala fluxos de trabalho apenas como comandos de barra',
  currentSuffix: ' [atual]',
  configChanges: 'Alterações na configuração:',
  updateFailed: (reason: string) => `\`openspec update\` falhou: ${reason}. Execute-o manualmente para aplicar as alterações do perfil.`,
  configProfileCancelled: 'Configuração de perfil cancelada.',
  spaceToToggle: 'Espaço para alternar, Enter para confirmar',
  configScopeOption: 'Escopo da configuração (apenas "global" suportado atualmente)',
  forceStringOption: 'Força o valor a ser armazenado como string',
  allowUnknownOption: 'Permite definir chaves desconhecidas',
  resetAllOption: 'Restaura toda a configuração (obrigatório)',
  skipConfirmationOption: 'Ignora prompts de confirmação',
  outputAsJson: 'Saída como JSON',
  // Workflow names
  workflowProposeName: 'Propor alteração',
  workflowProposeDesc: 'Cria proposta, design e tarefas a partir de uma solicitação',
  workflowExploreName: 'Explorar ideias',
  workflowExploreDesc: 'Investiga um problema antes da implementação',
  workflowNewName: 'Nova alteração',
  workflowNewDesc: 'Cria um scaffold de alteração rapidamente',
  workflowContinueName: 'Continuar alteração',
  workflowContinueDesc: 'Retoma o trabalho em uma alteração existente',
  workflowApplyName: 'Aplicar tarefas',
  workflowApplyDesc: 'Implementa as tarefas da alteração atual',
  workflowUpdateName: 'Atualizar alteração',
  workflowUpdateDesc: 'Revisa artefatos de planejamento e os mantém coerentes',
  workflowFastForwardName: 'Avanço rápido',
  workflowFastForwardDesc: 'Executa um fluxo de implementação mais rápido',
  workflowSyncName: 'Sincronizar specs',
  workflowSyncDesc: 'Sincroniza artefatos da alteração com as especificações',
  workflowArchiveName: 'Arquivar alteração',
  workflowArchiveDesc: 'Finaliza e arquiva uma alteração concluída',
  workflowBulkArchiveName: 'Arquivamento em massa',
  workflowBulkArchiveDesc: 'Arquiva múltiplas alterações concluídas juntas',
  workflowVerifyName: 'Verificar alteração',
  workflowVerifyDesc: 'Executa verificações contra uma alteração',
  workflowCodeReviewName: 'Code review',
  workflowCodeReviewDesc: 'Revisa diffs, branches ou arquivos com contexto do projeto',
  workflowOnboardName: 'Onboarding',
  workflowOnboardDesc: 'Fluxo de onboarding guiado para o BR-OpenSpec',
};

// ═══════════════════════════════════════════════════════════
// Comandos — Esquema (src/commands/schema.ts)
// ═══════════════════════════════════════════════════════════

export const SCHEMA_MESSAGES = {
  manageWorkflows: 'Gerencia esquemas de fluxo de trabalho [experimental]',
  showResolve: 'Mostra de onde um esquema é resolvido',
  validateStructure: 'Valida a estrutura de um esquema e seus templates',
  copySchema: 'Copia um esquema existente para o projeto para customização',
  createSchema: 'Cria um novo esquema local para o projeto',
  schemaNotFound: 'schema.yaml não encontrado',
  failedToReadFile: (err: string) => `Falha ao ler o arquivo: ${err}`,
  parseError: (err: string) => `Erro de análise: ${err}`,
  templateNotFound: (template: string, artifact: string) => `Arquivo de template '${template}' não encontrado para o artefato '${artifact}'`,
  noProjectSchemasDir: 'Nenhum diretório de esquemas do projeto encontrado',
  experimentalWarning: 'Nota: Os comandos de esquema são experimentais e podem mudar.',
  listAllSchemasOption: 'Lista todos os esquemas com suas fontes de resolução',
  noSchemasFound: 'Nenhum esquema encontrado.',
  projectSchemasHeader: 'Esquemas do projeto:',
  userSchemasHeader: 'Esquemas do usuário:',
  packageSchemasHeader: 'Esquemas do pacote:',
  shadowsLabel: (sources: string) => ` (sombras: ${sources})`,
  schemaNameRequired: 'Erro: Nome do esquema é obrigatório (ou use --all para listar todos os esquemas)',
  schemaNotFoundError: (name: string) => `Erro: Esquema '${name}' não encontrado`,
  availableSchemas: (schemas: string) => `Esquemas disponíveis: ${schemas}`,
  schemaLabel: (name: string) => `Esquema: ${name}`,
  sourceLabel: (source: string) => `Fonte: ${source}`,
  pathLabel: (path: string) => `Caminho: ${path}`,
  shadowsHeader: 'Sombras:',
  shadowEntry: (source: string, path: string) => `  ${source}: ${path}`,
  verboseOption: 'Mostra etapas detalhadas de validação',
  validatingEntry: (name: string) => `Validando ${name}...`,
  noSchemasInProject: 'Nenhum esquema encontrado no projeto.',
  validationResultsHeader: 'Resultados da Validação:',
  validationStatus: (valid: boolean, name: string) => `  ${valid ? '✓' : '✗'} ${name}`,
  issueLine: (level: string, message: string) => `    ${level}: ${message}`,
  schemaIsValid: (name: string) => `✓ Esquema '${name}' é válido`,
  schemaHasErrors: (name: string) => `✗ Esquema '${name}' tem erros:`,
  forceOption: 'Sobrescreve o destino existente',
  invalidSchemaName: (name: string) => `Nome de esquema inválido '${name}'. Use kebab-case (ex: my-workflow)`,
  schemaNamesKebabCase: 'Nomes de esquema devem ser kebab-case (ex: my-workflow)',
  schemaSourceNotFound: (source: string) => `Esquema '${source}' não encontrado`,
  schemaAlreadyExists: (name: string) => `Esquema '${name}' já existe`,
  suggestionForceOverwrite: 'Use --force para sobrescrever',
  schemaAlreadyExistsAt: (name: string, path: string) => `Erro: Esquema '${name}' já existe em ${path}`,
  removingExistingSchema: (name: string) => `Removendo esquema existente '${name}'...`,
  forkingSchema: (source: string, dest: string) => `Copiando '${source}' para '${dest}'...`,
  forkedSchema: (source: string, dest: string) => `Copiado '${source}' para '${dest}'`,
  sourceLabel2: (path: string, location: string) => `Fonte: ${path} (${location})`,
  destinationLabel: (path: string) => `Destino: ${path}`,
  customizeSchemaAt: 'Agora você pode customizar o esquema em:',
  forkFailed: 'Falha na cópia',
  descriptionOption: 'Descrição do esquema',
  artifactsOption: 'IDs de artefatos separados por vírgula (proposal,specs,design,tasks)',
  defaultSchemaDescription: (name: string) => `Esquema de fluxo de trabalho customizado para ${name}`,
  defaultOption: 'Define como esquema padrão do projeto',
  noDefaultOption: 'Não perguntar para definir como padrão',
  forceOption2: 'Sobrescreve o esquema existente',
  suggestionForkOrForce: 'Use --force para sobrescrever ou "openspec schema fork" para copiar',
  atLeastOneArtifact: 'Erro: Pelo menos um artefato deve ser selecionado',
  unknownArtifact: (id: string) => `Artefato desconhecido '${id}'`,
  validArtifacts: (ids: string) => `Artefatos válidos: ${ids}`,
  creatingSchema: (name: string) => `Criando esquema '${name}'...`,
  schemaCreated: (name: string) => `Criado esquema '${name}'`,
  schemaCreatedAt: (path: string) => `Esquema criado em: ${path}`,
  artifactsLabel: (ids: string) => `Artefatos: ${ids}`,
  setAsDefaultSchemaLabel: 'Definido como esquema padrão do projeto.',
  nextStepsHeader: 'Próximos passos:',
  editSchemaYaml: (path: string) => `  1. Edite ${path}/schema.yaml para customizar artefatos`,
  modifyTemplates: '  2. Modifique templates no diretório do esquema',
  useWithSchema: (name: string) => `  3. Use com: openspec new --schema ${name}`,
  creationFailed: 'Falha na criação',
  outputAsJson: 'Saída como JSON',
  checkingSchemaExists: '  Verificando se schema.yaml existe...',
  parsingYaml: '  Analisando YAML...',
  validatingSchemaStructure: '  Validando estrutura do esquema...',
  checkingTemplateFiles: '  Verificando arquivos de template...',
  dependencyGraphPassed: '  Validação do grafo de dependências passou (via parseSchema)',
  // Limites de caminho (schema validate / schema fork)
  templateOutsideTemplatesDir: (template: string) => `Arquivo de template '${template}' aponta para fora do diretório de templates do esquema`,
  cannotForkLinkedEntry: (entryPath: string, detail?: string) =>
    `Não é possível copiar o esquema com uma entrada vinculada (link) ou não suportada: ${entryPath}${detail ? `: ${detail}` : ''}`,
  cannotForkLinkedCycle: (entryPath: string) => `Não é possível copiar o esquema com um ciclo de diretórios vinculados (links): ${entryPath}`,
  // schema fork — cópia transacional (upstream 8127c7b7)
  cannotForkOntoItself: (source: string) =>
    `Não é possível copiar o esquema '${source}' sobre ele mesmo; escolha um nome de destino diferente`,
  stagedForkInvalid: (source: string, dest: string) =>
    `A cópia preparada de '${source}' não é um esquema válido (a origem pode ter mudado durante a cópia); ` +
    `operação abortada, '${dest}' não foi modificado.`,
  replacingExistingSchema: (dest: string) => `Substituindo esquema existente '${dest}'...`,
  forkDestinationChangedOnDisk: (dest: string, dir: string) =>
    `O esquema '${dest}' em ${dir} mudou em disco enquanto a cópia era preparada. ` +
    `Operação abortada para preservar essas alterações concorrentes; nada foi sobrescrito. ` +
    `Execute a cópia novamente para sobrescrever o conteúdo atual.`,
  forkInstallRestoreFailed: (
    dest: string,
    backupDir: string,
    destinationDir: string,
    restoreMessage: string
  ) =>
    `Falha ao instalar o esquema copiado e não foi possível restaurar o '${dest}' anterior. ` +
    `Seu esquema anterior está preservado em ${backupDir}; mova-o de volta para ${destinationDir} para restaurar. ` +
    `Erro na restauração: ${restoreMessage}`,
  forkBackupKept: (dest: string, backupDir: string) =>
    `Aviso: o '${dest}' anterior mudou durante a cópia e NÃO foi apagado; ` +
    `sua cópia anterior à operação está preservada em ${backupDir}.`,
  // schema init --default — atualização transacional do config (upstream 2fa679f1)
  defaultConfigIsSymlink: (file: string) =>
    `Não é possível definir o esquema padrão: ${file} deve ser um arquivo regular, não um link simbólico`,
  defaultConfigNotRegularFile: (file: string) =>
    `Não é possível definir o esquema padrão: ${file} deve ser um arquivo regular`,
  defaultConfigNotWritable: (pathOrFile: string) =>
    `Não é possível definir o esquema padrão: ${pathOrFile} não tem permissão de escrita`,
  defaultConfigInvalidYaml: (file: string) =>
    `Não é possível definir o esquema padrão: ${file} contém YAML inválido`,
  defaultConfigNotObject: (file: string) =>
    `Não é possível definir o esquema padrão: ${file} deve conter um objeto YAML`,
  generatedSchemaInvalid: (issues: string) => `O esquema gerado falhou na validação: ${issues}`,
  initSchemaChangedOnDisk: (name: string) =>
    `O esquema '${name}' mudou em disco enquanto a inicialização era preparada. ` +
    `Operação abortada para preservar essas alterações concorrentes.`,
  initConfigChangedOnDisk: (file: string) =>
    `${file} mudou em disco enquanto a inicialização era preparada. ` +
    `Operação abortada para preservar essas alterações concorrentes.`,
  initRollbackIncomplete: (errors: string, schemaDir: string, configPath: string | null) =>
    `A inicialização do esquema falhou e a reversão ficou incompleta (${errors}). ` +
    `Backups de recuperação podem ter permanecido ao lado de ${schemaDir} e ` +
    `${configPath ?? 'do arquivo de configuração'}.`,
  initBackupCleanupFailed: (backup: string, message: string) =>
    `Aviso: a inicialização foi concluída, mas o backup em ${backup} não pôde ser removido: ${message}`,
};

// ═══════════════════════════════════════════════════════════
// Comandos — Completions (src/commands/completion.ts)
// ═══════════════════════════════════════════════════════════

export const COMPLETION_MESSAGES = {
  removeConfigConfirm: (path: string) => `Remover a configuração do BR-OpenSpec de ${path}?`,
  pathNotWritable: (targetPath: string) => `Caminho sem permissão de escrita: ${targetPath}`,
  shellNotSupported: (shell: string, supported: string) => `Erro: Shell '${shell}' ainda não é suportado. Suportados atualmente: ${supported}`,
  couldNotDetectShell: 'Erro: Não foi possível detectar o shell automaticamente. Especifique o shell explicitamente.',
  usageCompletion: (operation: string) => `Uso: openspec completion ${operation} [shell]`,
  currentlySupported: (supported: string) => `Suportados atualmente: ${supported}`,
  installingCompletion: (shell: string) => `Instalando script de autocomplete para ${shell}...`,
  installSuccess: (message: string) => `✓ ${message}`,
  installedTo: (path: string) => `  Instalado em: ${path}`,
  backupCreated: (path: string) => `  Backup criado: ${path}`,
  configFileConfigured: (path: string) => `  ${path} configurado automaticamente`,
  restartShell: (cmd: string) => `Reinicie o shell ou execute: ${cmd}`,
  installFailed: (message: string) => `✗ ${message}`,
  failedToInstall: (error: string) => `✗ Falha ao instalar script de autocomplete: ${error}`,
  uninstallCancelled: 'Desinstalação cancelada.',
  uninstallingCompletion: (shell: string) => `Desinstalando script de autocomplete para ${shell}...`,
  uninstallSuccess: (message: string) => `✓ ${message}`,
  uninstallFailed: (message: string) => `✗ ${message}`,
  failedToUninstall: (error: string) => `✗ Falha ao desinstalar script de autocomplete: ${error}`,
  zshScriptRemoved: (path: string) => `Script de autocomplete removido de ${path}`,
  zshConfigRemoved: 'Configuração do BR-OpenSpec removida de ~/.zshrc',
  bashAlreadyInstalled: 'O script de autocomplete já está instalado e atualizado',
  bashAlreadyInstalledDetail: 'O script de autocomplete já está instalado e atualizado.',
  bashAlreadyInstalledHint: 'Se o autocomplete não estiver funcionando, tente: exec bash',
  bashUpdatedWithBackup: 'Script de autocomplete atualizado com sucesso (versão anterior salva em backup)',
  bashUpdated: 'Script de autocomplete atualizado com sucesso',
  bashInstalledWithBashrc: 'Script de autocomplete instalado e .bashrc configurado com sucesso',
  bashInstalled: 'Script de autocomplete instalado com sucesso para Bash',
  bashNotInstalled: 'Script de autocomplete não instalado',
  bashUninstalled: 'Script de autocomplete desinstalado com sucesso',
  bashFailedToInstall: (error: string) => `Falha ao instalar script de autocomplete: ${error}`,
  bashFailedToUninstall: (error: string) => `Falha ao desinstalar script de autocomplete: ${error}`,
  bashScriptInstalled: 'Script de autocomplete instalado com sucesso.',
  bashAddToBashrc: 'Para ativar o autocomplete, adicione o seguinte ao seu arquivo ~/.bashrc:',
  bashSourceComment: '# Carrega os autocompletes do BR-OpenSpec',
  bashThenRestartShell: (cmd: string) => `Depois reinicie o shell ou execute: ${cmd}`,
  zshAlreadyInstalled: 'Script de autocomplete já está instalado (atualizado)',
  zshAlreadyInstalledDetail: 'O script de autocomplete já está instalado e atualizado.',
  zshAlreadyInstalledHint: 'Se o autocomplete não estiver funcionando, tente: exec zsh',
  zshUpdatedWithBackup: 'Script de autocomplete atualizado com sucesso (versão anterior salva em backup)',
  zshUpdated: 'Script de autocomplete atualizado com sucesso',
  zshInstalledOhMyZsh: 'Script de autocomplete instalado com sucesso para Oh My Zsh',
  zshInstalledWithZshrc: 'Script de autocomplete instalado e .zshrc configurado com sucesso',
  zshInstalled: 'Script de autocomplete instalado com sucesso para Zsh',
  zshFailedToInstall: (error: string) => `Falha ao instalar script de autocomplete: ${error}`,
  zshOhMyZshFpathNote: 'Nota: Oh My Zsh normalmente carrega automaticamente os scripts de autocomplete do diretório custom/completions.',
  zshOhMyZshFpathVerify: (dir: string) => `Verifique se ${dir} está no seu fpath executando:`,
  // Uma entrada de fpath por linha, casada como literal: um $ZSH_CUSTOM
  // relocado não precisa conter "custom/completions", e o caminho pode ter
  // caracteres que o grep leria como padrão. quotedDir já vem entre aspas.
  zshOhMyZshFpathGrepCommand: (quotedDir: string) => `  printf '%s\\n' $fpath | grep -F ${quotedDir}`,
  zshOhMyZshFpathRestart: 'Se não for encontrado, o autocomplete pode não funcionar. Reinicie o shell para garantir que as alterações tenham efeito.',
  zshOhMyZshInstalledDir: 'Script de autocomplete instalado no diretório de completions do Oh My Zsh.',
  zshOhMyZshAutoActivate: 'O autocomplete deve ativar automaticamente.',
  zshInstalledDir: 'Script de autocomplete instalado em ~/.zsh/completions/',
  zshAddToZshrc: 'Para ativar o autocomplete, adicione o seguinte ao seu arquivo ~/.zshrc:',
  zshFpathComment: '# Adiciona diretório de completions ao fpath',
  zshCompinitComment: '# Inicializa o sistema de autocomplete',
  zshThenRestartShell: (cmd: string) => `Depois reinicie o shell ou execute: ${cmd}`,
  zshCheckExistingLines: (path: string) => `Verifique se estas linhas já existem em ${path} antes de adicioná-las.`,
  activeChange: 'alteração ativa',
  specification: 'especificação',
  archivedChange: 'alteração arquivada',
  bashCompletionNotDetected: '⚠️  Aviso: pacote bash-completion não detectado',
  bashCompletionRequired: 'O script de autocomplete requer bash-completion para funcionar.',
  installWith: 'Instale-o com:',
  addToBashProfile: 'Depois adicione ao seu ~/.bash_profile:',
  warningSkippingProfile: (path: string, err: string) => `Aviso: Ignorando ${path}: ${err}`,
  warningCouldNotConfigure: (path: string, err: string) => `Aviso: Não foi possível configurar ${path}: ${err}`,
  warningCouldNotRead: (path: string, err: string) => `Aviso: Não foi possível ler ${path}: ${err}`,
  warningStartMarkerWithoutEnd: (path: string) => `Aviso: Marcador de início encontrado mas sem marcador de fim em ${path}`,
  warningCouldNotClean: (path: string, err: string) => `Aviso: Não foi possível limpar ${path}: ${err}`,
  warningCouldNotRemoveLegacy: (path: string, err: string) => `Aviso: Não foi possível remover arquivo legado ${path}: ${err}`,
  powershellCompletionHeader: '# Script de autocompletar PowerShell para a CLI do BR-OpenSpec',
  powershellCompletionNote: '# Gerado automaticamente - não edite manualmente',

  // Fish installer messages
  fishAlreadyInstalled: 'Script de autocomplete já está instalado (atualizado)',
  fishAlreadyInstalledDetail: 'O script de autocomplete já está instalado e atualizado.',
  fishAutoLoadsHint: 'O Fish carrega automaticamente os scripts de autocomplete - devem estar disponíveis imediatamente.',
  fishUpdatedWithBackup: 'Script de autocomplete atualizado com sucesso (versão anterior salva em backup)',
  fishUpdated: 'Script de autocomplete atualizado com sucesso',
  fishInstalled: 'Script de autocomplete instalado com sucesso para Fish',
  fishAutoLoadsDir: 'O Fish carrega automaticamente os scripts de autocomplete de ~/.config/fish/completions/',
  fishAvailableImmediately: 'Os autocompletes estão disponíveis imediatamente - sem necessidade de reiniciar o shell.',
  fishFailedToInstall: (error: string) => `Falha ao instalar script de autocomplete: ${error}`,
  fishNotInstalled: 'Script de autocomplete não está instalado',
  fishUninstalled: 'Script de autocomplete desinstalado com sucesso',
  fishFailedToUninstall: (error: string) => `Falha ao desinstalar script de autocomplete: ${error}`,

  // PowerShell installer messages
  powershellUtf16BEUnsupported: 'Arquivo codificado em UTF-16 BE não é suportado. Salve novamente como UTF-8 ou UTF-16 LE e tente novamente.',
  powershellAlreadyInstalled: 'Script de autocomplete já está instalado (atualizado)',
  powershellAlreadyInstalledDetail: 'O script de autocomplete já está instalado e atualizado.',
  powershellAlreadyInstalledHint: 'Se o autocomplete não estiver funcionando, tente reiniciar o PowerShell ou execute: . $PROFILE',
  powershellUpdatedWithBackup: 'Script de autocomplete atualizado com sucesso (versão anterior salva em backup)',
  powershellUpdated: 'Script de autocomplete atualizado com sucesso',
  powershellInstalledWithProfile: 'Script de autocomplete instalado e perfil do PowerShell configurado com sucesso',
  powershellInstalled: 'Script de autocomplete instalado com sucesso para PowerShell',
  powershellFailedToInstall: (error: string) => `Falha ao instalar script de autocomplete: ${error}`,
  powershellScriptInstalled: 'Script de autocomplete instalado com sucesso.',
  powershellEnableCompletions: (profilePath: string) => `Para ativar o autocomplete, adicione o seguinte ao seu perfil PowerShell (${profilePath}):`,
  powershellSourceComment: '# Carrega os autocompletes do BR-OpenSpec',
  powershellThenRestart: 'Depois reinicie o PowerShell ou execute: . $PROFILE',
  powershellNotInstalled: 'Script de autocomplete não está instalado',
  powershellUninstalled: 'Script de autocomplete desinstalado com sucesso',
  powershellFailedToUninstall: (error: string) => `Falha ao desinstalar script de autocomplete: ${error}`,

  // Zsh installer (missing)
  zshNotInstalled: 'Script de autocomplete não está instalado',
};

// ═══════════════════════════════════════════════════════════
// Dica de autocomplete — primeira execução (src/core/completion-tip.ts)
// ═══════════════════════════════════════════════════════════

export const COMPLETION_TIP_MESSAGES = {
  firstRunTip:
    "Dica: execute 'openspec completion install' para habilitar o autocomplete do shell",
};

// ═══════════════════════════════════════════════════════════
// Comandos — Feedback (src/commands/feedback.ts)
// ═══════════════════════════════════════════════════════════

export const FEEDBACK_MESSAGES = {
  submitFeedback: 'Envia feedback sobre o BR-OpenSpec',
  githubCliNotFound: '⚠️  GitHub CLI não encontrado. Submissão manual necessária.',
  githubAuthRequired: '⚠️  Autenticação do GitHub necessária. Submissão manual necessária.',
  formattedFeedbackHeader: '\n--- FEEDBACK FORMATADO ---',
  titleLabel: (title: string) => `Título: ${title}`,
  labelsFeedback: 'Labels: feedback',
  bodyLabel: '\nCorpo:',
  endFeedback: '\n--- FIM DO FEEDBACK ---\n',
  submitManually: 'Por favor, envie seu feedback manualmente:',
  autoSubmitHint: '\nPara envio automático no futuro: gh auth login',
  feedbackSubmitted: '\n✓ Feedback enviado com sucesso!',
  issueUrl: (url: string) => `URL da Issue: ${url}\n`,
  labelNotApplied: 'Nota: issue criada sem o rótulo \'feedback\' porque o repositório não o define.\n',
  feedbackTitle: (message: string) => `Feedback: ${message}`,
  bodySummaryHeading: '## Resumo',
  bodyDetailsHeading: '## Detalhes',
  submittedVia: 'Enviado via BR-OpenSpec CLI',
  versionLabel: (version: string) => `- Versão: ${version}`,
  platformLabel: (platform: string) => `- Plataforma: ${platform}`,
  timestampLabel: (timestamp: string) => `- Timestamp: ${timestamp}`,
};

// ═══════════════════════════════════════════════════════════
// UI / Tela de boas-vindas (src/ui/welcome-screen.ts)
// ═══════════════════════════════════════════════════════════

export const UI_MESSAGES = {
  welcomeTitle: 'Bem-vindo ao BR-OpenSpec',
  // As linhas desta tela precisam caber em 35 colunas de texto (59 - coluna de
  // arte de 24) para não quebrar e dessincronizar a animação em 60 colunas.
  welcomeSubtitle: 'Leve e orientado a especificações',
  setupWillConfigure: 'Esta configuração irá configurar:',
  agentSkills: '  • Agent Skills para sua IA',
  // Não "comandos /opsx:*": esta tela roda antes da seleção de ferramentas, e
  // ferramentas só-de-skills (Kimi Code, Mistral Vibe, ...) corretamente não
  // recebem arquivos de comando. A grafia exata por ferramenta aparece no
  // "Início rápido" pós-configuração.
  slashCommands: '  • Comandos, se suportados',
  quickStart: 'Início rápido após a configuração:',
  // Os nomes exibidos são os canônicos; cada ferramenta os escreve de um jeito
  // (/opsx-propose, @opsx-propose, $openspec-propose ...) e isso só é conhecido
  // depois da seleção de ferramentas, um prompt adiante.
  spellingVaries: '  (a grafia varia por ferramenta)',
  pressEnter: 'Pressione Enter para continuar...',
};

// ═══════════════════════════════════════════════════════════
// Core — Comandos de onboarding (src/core/onboarding-commands.ts)
// ═══════════════════════════════════════════════════════════

export const ONBOARDING_MESSAGES = {
  // Descrições curtas do menu de início rápido; precisam caber em
  // DESCRIPTION_BUDGET (17) para não quebrar a animação da tela de boas-vindas.
  describePropose: 'Iniciar alteração',
  describeNew: 'Criar alteração',
  describeContinue: 'Próximo artefato',
  describeApply: 'Executar tarefas',
  // Forma neutra que nomeia a skill quando não há uma invocação de comando
  // utilizável (ou quando as ferramentas divergem na sintaxe).
  skillReference: (skillName: string) => `a skill ${skillName}`,
  // Referência dupla gravada dentro dos SKILL.md do Codex: a mesma árvore
  // `.agents/skills` serve ao Codex (`$nome`) e a agentes genéricos (`/nome`).
  // ATENÇÃO: manter em sincronia com a regex de `toLegacyCodexReferences` em
  // src/core/shared/skill-content-equivalence.ts.
  codexDualSkillReference: (skillName: string) =>
    `$${skillName} (Codex) ou /${skillName} (outros agentes)`,
};

// ═══════════════════════════════════════════════════════════
// Prompts — Seleção múltipla com busca (src/prompts/searchable-multi-select.ts)
// e dica de teclas dos prompts do inquirer (src/prompts/keys-help-tip.ts)
// ═══════════════════════════════════════════════════════════

export const PROMPT_MESSAGES = {
  invalid: 'Inválido',
  none: '(nenhum)',
  noneSelected: '(nenhum selecionado)',
  selected: 'Selecionados:',
  search: 'Buscar:',
  typeToFilter: 'digite para filtrar',
  navigate: 'navegar',
  toggle: 'alternar',
  remove: 'remover',
  confirm: 'confirmar',
  noMatches: 'Nenhuma correspondência',
  configured: '(configurado)',
  detected: '(detectado)',
  refresh: '(atualizar)',
  selectedLabel: '(selecionado)',
  // Rótulos da dica de teclas do @inquirer/{checkbox,select} v5
  // (theme.style.keysHelpTip). As ações `navigate`/`select`/`submit`
  // reaproveitam `navigate`, `toggle` e `confirm` acima — a tecla espaço
  // alterna a marcação, como já indicava a dica anterior do checkbox.
  keySpace: 'espaço',
  keyActionAll: 'todos',
  keyActionInvert: 'inverter',
};

// ═══════════════════════════════════════════════════════════
// Utilitários
// ═══════════════════════════════════════════════════════════

export const UTILS_MESSAGES = {
  failedToReadTasks: (path: string, err: unknown) => `Falha ao ler o arquivo de tarefas em ${path}: ${err}`,
};

// ═══════════════════════════════════════════════════════════
// Core — Atualizar (src/core/update.ts)
// ═══════════════════════════════════════════════════════════

export const UPDATE_MESSAGES = {
  noOpenspecDir: "Diretório do BR-OpenSpec não encontrado. Execute 'openspec init' primeiro.",
  noConfiguredTools: 'Nenhuma ferramenta configurada encontrada.',
  runInitHint: 'Execute "openspec init" para configurar ferramentas.',
  // O usuário recusou a migração de um diretório renomeado: não é um projeto
  // desconfigurado — é um configurado que ele optou por deixar no diretório
  // antigo. Dizer "execute init" seria errado.
  nothingToUpdateLegacyOnly: (from: string) =>
    `Nada para atualizar: os arquivos do BR-OpenSpec deste projeto ainda estão em ${from}/, que o BR-OpenSpec não escreve mais.`,
  rerunUpdateAcceptMove: (to: string) =>
    `Execute "openspec update" novamente e aceite a mudança para ${to}/ para retomar as atualizações.`,
  confirmLegacyMove: (description: string, from: string, to: string) =>
    `Mover ${description} de ${from}/ para ${to}/?`,
  // Diz o custo de recusar: o BR-OpenSpec escreve no diretório atual agora, e
  // os arquivos deixados no diretório antigo deixam de ser gerenciados.
  legacyMoveDeclined: (from: string, to: string) =>
    `Mantido no lugar. O BR-OpenSpec agora escreve em ${to}/ e não gerenciará mais ${from}/, então esses arquivos permanecem como estão até que você os mova. Você será perguntado novamente na próxima execução.`,
  forceUpdating: (count: number, tools: string) => `Forçando atualização de ${count} ferramenta(s): ${tools}`,
  updatingTool: (name: string) => `Atualizando ${name}...`,
  updatedTool: (name: string) => `Atualizado ${name}`,
  failedToUpdate: (name: string) => `Falha ao atualizar ${name}`,
  updated: (tools: string, version: string) => `✓ Atualizados: ${tools} (v${version})`,
  failed: (errors: string) => `✗ Falhas: ${errors}`,
  // Ferramentas skills-invocable (Codex): a superfície de comandos é a própria skill.
  commandsSkippedUsesSkills: (tools: string) => `Comandos ignorados para: ${tools} (usa skills)`,
  // Lançado após o resumo quando alguma ferramenta falhou (exit ≠ 0 para automação).
  updateFailedFor: (names: string) => `A atualização do BR-OpenSpec falhou para: ${names}`,
  removedCommands: (count: number) => `Removidos: ${count} arquivos de comando (entrega: skills)`,
  removedSkills: (count: number) => `Removidos: ${count} diretórios de skill (entrega: commands)`,
  noSkillsOrCommandsRemain: (names: string, singular: boolean) =>
    `Não restam skills nem comandos para ${names}: a entrega está definida como 'commands', mas ${singular ? 'ela suporta' : 'elas suportam'} apenas skills. ` +
    `Execute 'openspec config set delivery both' para gerar skills.`,
  removedDeselectedCommands: (count: number) => `Removidos: ${count} arquivos de comando (fluxos de trabalho desselecionados)`,
  removedDeselectedSkills: (count: number) => `Removidos: ${count} diretórios de skill (fluxos de trabalho desselecionados)`,
  // Copilot coding agent (nuvem) — `openspec update` nunca pergunta: só honra a
  // decisão persistida (ou os arquivos gerenciados já presentes).
  removedCopilotCloudOptOut: (count: number) =>
    `Removidos: ${count} arquivo(s) do Copilot coding agent (nuvem) (opt-out dos arquivos de nuvem)`,
  removedCopilotCloudNotConfigured: (count: number) =>
    `Removidos: ${count} arquivo(s) do Copilot coding agent (nuvem) (github-copilot não configurado)`,
  copilotCloudAvailableHint:
    "Os arquivos do Copilot coding agent (nuvem) do GitHub estão disponíveis (opt-in). Ative com 'openspec init --copilot-cloud'.",
  copilotCloudSyncFailed: (message: string) =>
    `Aviso: falha ao sincronizar os arquivos do Copilot coding agent (nuvem): ${message}`,
  gettingStarted: 'Início rápido:',
  learnMore: (url: string) => `Saiba mais: ${url}`,
  restartIDE: 'Reinicie sua IDE para que as alterações tenham efeito.',
  allUpToDate: (count: number, version: string) => `✓ Todas as ${count} ferramenta(s) estão atualizadas (v${version})`,
  toolsList: (tools: string) => `  Ferramentas: ${tools}`,
  useForceHint: 'Use --force para atualizar os arquivos mesmo assim.',
  updatingPlan: (count: number, updates: string) => `Atualizando ${count} ferramenta(s): ${updates}`,
  alreadyUpToDate: (tools: string) => `Já atualizadas: ${tools}`,
  detectedNewTools: (noun: string, names: string, pronoun: string) => `Detectadas novas ${noun}: ${names}. Execute 'openspec init' para adicionar ${pronoun}.`,
  toolNoun: 'ferramenta',
  toolsNoun: 'ferramentas',
  it: 'ela',
  them: 'elas',
  extraWorkflowsNote: (count: number) => `Nota: ${count} fluxos de trabalho extras não estão no perfil (use \`openspec config profile\` para gerenciar)`,
  missingCoreWorkflowsNote: (count: number, list: string) => `Nota: seu perfil personalizado não inclui ${count} ${count === 1 ? 'fluxo de trabalho' : 'fluxos de trabalho'} do core: ${list}`,
  missingCoreWorkflowsHint: (count: number) => `Execute \`openspec config profile\` para adicioná-${count === 1 ? 'lo' : 'los'}, ou \`openspec config profile core\` para usar o conjunto core.`,
  cleaningLegacy: 'Limpando arquivos legados...',
  legacyCleaned: 'Arquivos legados limpos',
  forceLegacyHint: '⚠ Execute com --force para limpar automaticamente arquivos legados, ou execute de forma interativa.',
  upgradeLegacyPrompt: 'Atualizar e limpar arquivos legados?',
  skippingLegacyCleanup: 'Ignorando limpeza de legados. Continuando com a atualização de skills...',
  preservedDeferredGlobalPrompts: 'Prompts globais adiados preservados por falta de skills substitutas:',
  noAdditionalRefreshAfterLegacy: 'Nenhuma atualização adicional necessária após a migração de legados.',
  toolsDetectedFromLegacy: 'Ferramentas detectadas de artefatos legados:',
  setupSkillsFor: (tools: string) => `Configurando skills para: ${tools}`,
  selectToolsNewSkillSystem: 'Selecione as ferramentas para configurar com o novo sistema de skills:',
  skippingToolSetup: 'Ignorando configuração de ferramentas.',
  settingUp: (name: string) => `Configurando ${name}...`,
  setupComplete: (name: string) => `Configuração concluída para ${name}`,
  failedToSetup: (name: string) => `Falha ao configurar ${name}`,
  // Upgrade legado: a raiz de skills compartilhada (ex.: `.agents`) já pertence
  // a outra ferramenta, então nada é gerado para a ferramenta inferida dos
  // artefatos legados. Os nomes vêm de AI_TOOLS[].name (rótulos de ferramenta,
  // não traduzidos).
  skippedSharedSkillRoot: (name: string, skillsDir: string, owner: string) =>
    `${name} ignorado: ${skillsDir}/skills já é gerenciado por outra ferramenta (${owner}).`,
};

// ═══════════════════════════════════════════════════════════
// Core — Verificação de versão da CLI (src/core/version-check.ts)
// ═══════════════════════════════════════════════════════════

export const VERSION_CHECK_MESSAGES = {
  newerCliAvailable: (current: string, latest: string) =>
    `Uma nova versão da CLI do BR-OpenSpec está disponível (v${current} → v${latest}).`,
  runningFrom: (installDir: string) => `  Executando a partir de: ${installDir}`,
  updateProjectDependency: (packageName: string) =>
    `  Atualize a dependência ${packageName} neste projeto.`,
  rerunUpdateHint: '  Depois execute "openspec update" novamente para aplicar os novos fluxos de trabalho.',
  upgradePrompt: (latest: string) => `Atualizar para v${latest} agora?`,
  upgradeIncompleteLine1: 'A atualização não foi concluída. Uma instalação global pode precisar de',
  upgradeIncompleteLine2: 'permissões elevadas ou de um gerenciador de pacotes diferente.',
  upgradeUnconfirmed: 'A atualização terminou, mas nenhum "openspec" pôde ser executado para confirmá-la.',
  upgradeStillReportsOld: (version: string) => `A atualização terminou, mas "openspec" ainda reporta v${version}.`,
  binUnchanged: (binPath: string) => `  O npm reportou sucesso, mas ${binPath} não mudou.`,
  stalePathInstallAnswering: '  Outra instalação anterior no seu PATH está respondendo primeiro.',
  upgradedTo: (version: string) => `✓ Atualizado para v${version}.`,
  filesNotRegenerated: 'Os arquivos de instrução não foram regenerados.',
  runUpdateToRegenerate: '  Execute "openspec update" para aplicar os novos fluxos de trabalho.',
};

// ═══════════════════════════════════════════════════════════
// Utilitários — Progresso de Tarefas (src/utils/task-progress.ts)
// ═══════════════════════════════════════════════════════════

export const TASK_PROGRESS_MESSAGES = {
  noTasks: 'Sem tarefas',
  complete: '✓ Concluído',
  tasksCount: (completed: number, total: number) => `${completed}/${total} tarefas`,
};

// ═══════════════════════════════════════════════════════════
// Utilitários — Sistema de Arquivos (src/utils/file-system.ts)
// ═══════════════════════════════════════════════════════════

export const FILE_SYSTEM_MESSAGES = {
  endMarkerBeforeStart: (filePath: string) => `Estado de marcador inválido em ${filePath}. O marcador final aparece antes do inicial.`,
  invalidMarkerState: (filePath: string, startFound: boolean, endFound: boolean) => `Estado de marcador inválido em ${filePath}. Marcador inicial encontrado: ${startFound}, Marcador final encontrado: ${endFound}`,
  unableToCheckFileExists: (filePath: string, error: string) => `Não foi possível verificar se o arquivo existe em ${filePath}: ${error}`,
  unableToCheckDirExists: (dirPath: string, error: string) => `Não foi possível verificar se o diretório existe em ${dirPath}: ${error}`,
  pathComponentNotDir: (dirPath: string) => `Componente do caminho ${dirPath} existe mas não é um diretório`,
  errorCheckingDir: (dir: string, error: string) => `Erro ao verificar diretório ${dir}: ${error}`,
  unableToDetermineWritePermissions: (filePath: string, error: string) => `Não foi possível determinar permissões de escrita para ${filePath}: ${error}`,
  insufficientPermissions: (dirPath: string, error: string) => `Permissões insuficientes para escrever em ${dirPath}: ${error}`,
  couldNotCleanUpTestFile: (filePath: string, error: string) => `Não foi possível limpar arquivo de teste ${filePath}: ${error}`,
  // Guarda de limites de caminho (assertPathWithin & cia.): um alvo que sai do
  // diretório permitido — lexicalmente ou via link simbólico — é recusado.
  pathOutsideAllowedDirectory: (targetPath: string) => `O caminho está fora do diretório permitido: ${targetPath}`,
  refusingArtifactOutsideProject: (artifactPath: string) => `Recusando gerenciar um artefato fora do projeto: ${artifactPath}`,
  danglingSymbolicLink: (existingPath: string) => `Não foi possível verificar um link simbólico pendente (dangling): ${existingPath}`,
  noExistingParent: (targetPath: string) => `Não foi possível resolver um diretório pai existente para ${targetPath}`,
};

// ═══════════════════════════════════════════════════════════
// Core — Validação (src/core/validation/validator.ts)
// ═══════════════════════════════════════════════════════════

/**
 * Sufixo anexado à orientação (WARNING) de requisito sem SHALL/MUST no corpo.
 * O upstream diz "best practice for English specs"; no fork as palavras-chave
 * normativas continuam em inglês mesmo em specs em português (termos
 * reservados), então o sufixo reforça a recomendação em vez de dispensá-la.
 */
const MISSING_SHALL_OR_MUST_GUIDANCE_SUFFIX =
  ' (boa prática RFC 2119; use as palavras-chave normativas em inglês)';

/**
 * Mensagem para um bloco de requisito cujo corpo não contém SHALL/MUST.
 *
 * `keywordInHeader`: a palavra-chave aparece só no cabeçalho
 * "### Requirement: ..." — aponta a correção exata (#1156/#1280).
 * `guidanceOnly`: um corpo não vazio sem a palavra-chave é orientação
 * (WARNING), não erro (#243) — verbo "deveria" + sufixo RFC 2119. Um corpo
 * ausente continua sendo ERROR ("deve conter"). A frase acionável (tudo após o
 * prefixo) é byte-idêntica entre o caminho de spec principal e o de delta.
 */
const missingShallOrMust = (prefix: string, keywordInHeader: boolean, guidanceOnly: boolean): string => {
  const base = `${prefix} ${guidanceOnly ? 'deveria' : 'deve'} conter SHALL ou MUST`;
  const suffix = guidanceOnly ? MISSING_SHALL_OR_MUST_GUIDANCE_SUFFIX : '';
  return keywordInHeader
    ? `${base} no corpo do requisito, não apenas no cabeçalho. Mova a declaração SHALL/MUST para a linha imediatamente após o cabeçalho "### Requirement: ...".${suffix}`
    : `${base}${suffix}`;
};

export const VALIDATOR_MESSAGES = {
  unknownError: 'Erro desconhecido',
  duplicateRequirementAdded: (name: string) => `Requisito duplicado em ADDED: "${name}"`,
  missingRequirementTextAdded: (name: string) => `ADDED "${name}" está sem texto de requisito`,
  missingShallOrMustAdded: (name: string, keywordInHeader = false, guidanceOnly = false) =>
    missingShallOrMust(`ADDED "${name}"`, keywordInHeader, guidanceOnly),
  missingScenarioAdded: (name: string) => `ADDED "${name}" deve incluir pelo menos um cenário`,
  duplicateRequirementModified: (name: string) => `Requisito duplicado em MODIFIED: "${name}"`,
  missingRequirementTextModified: (name: string) => `MODIFIED "${name}" está sem texto de requisito`,
  missingShallOrMustModified: (name: string, keywordInHeader = false, guidanceOnly = false) =>
    missingShallOrMust(`MODIFIED "${name}"`, keywordInHeader, guidanceOnly),
  missingScenarioModified: (name: string) => `MODIFIED "${name}" deve incluir pelo menos um cenário`,
  missingShallOrMustRequirement: (name: string, keywordInHeader = false, guidanceOnly = false) =>
    missingShallOrMust(`Requirement "${name}"`, keywordInHeader, guidanceOnly),
  skippedHeaderNameless: (header: string, section: string) => `Cabeçalho "### ${header}" em ${section} está sem nome de requisito e é ignorado pela validação. Adicione um nome, ex.: "### Requirement: <nome>".`,
  skippedHeaderNotRequirement: (header: string, section: string) => `Cabeçalho "### ${header}" em ${section} não é um cabeçalho "### Requirement:" e é ignorado pela validação. Use "### Requirement: ${header}" se ele deve ser validado como um requisito.`,
  duplicateRequirementRemoved: (name: string) => `Requisito duplicado em REMOVED: "${name}"`,
  duplicateFromRenamed: (name: string) => `FROM duplicado em RENAMED: "${name}"`,
  duplicateToRenamed: (name: string) => `TO duplicado em RENAMED: "${name}"`,
  requirementInModifiedAndRemoved: (name: string) => `Requisito presente em MODIFIED e REMOVED: "${name}"`,
  requirementInModifiedAndAdded: (name: string) => `Requisito presente em MODIFIED e ADDED: "${name}"`,
  requirementInAddedAndRemoved: (name: string) => `Requisito presente em ADDED e REMOVED: "${name}"`,
  modifiedReferencesOldRenamed: (to: string) => `MODIFIED referencia nome antigo de RENAMED. Use o novo cabeçalho para "${to}"`,
  renamedToCollidesAdded: (to: string) => `RENAMED TO colide com ADDED para "${to}"`,
  requirementInRenamedAndRemoved: (from: string, removedSpelling?: string) =>
    `Requisito presente em RENAMED e REMOVED: "${from}"` +
    (removedSpelling !== undefined ? ` (REMOVED o escreve como "${removedSpelling}")` : ''),
  deltaSectionsEmpty: (sections: string) => `Seções de delta ${sections} foram encontradas, mas nenhuma entrada de requisito foi analisada. Certifique-se de que cada seção inclua pelo menos um bloco "### Requirement:" (REMOVED pode usar sintaxe de lista com marcadores).`,
  noDeltaSectionsFound: 'Nenhuma seção de delta encontrada. Adicione cabeçalhos como "## ADDED Requirements" ou mova notas que não sejam deltas para fora de specs/.',
  rootLevelDeltaSpec: 'Spec de delta encontrado em specs/spec.md. Specs de delta devem ficar sob um caminho de capability (ex.: specs/<capability-path>/spec.md) — um arquivo na raiz de specs/ é ignorado quando a alteração é aplicada ou arquivada.',
  modifiedOmitsCurrentScenarios: (reqName: string, scenarioNames: string) =>
    `MODIFIED "${reqName}" omite cenário(s) que o spec atual ainda tem: ${scenarioNames}. Copie-os para o bloco MODIFIED (um requisito MODIFIED substitui o bloco inteiro, então o archive se recusa a descartá-los).`,
  couldNotReadMainSpec: (specPath: string, code: string) =>
    `Não foi possível ler ${specPath} para verificar os requisitos MODIFIED contra ele (${code}). O archive lê o mesmo arquivo, então corrija o arquivo antes de arquivar.`,
};

// ═══════════════════════════════════════════════════════════
// Core — Validação de numeração de tarefas (src/core/validation/task-numbering.ts)
// ═══════════════════════════════════════════════════════════

export const TASK_NUMBERING_MESSAGES = {
  taskGroupMismatch: (id: string, currentGroup: string, taskGroup: string) =>
    `Tarefa "${id}" está sob o grupo ${currentGroup}, mas seu número inicial aponta para o grupo ${taskGroup}. Mova-a para o grupo ${taskGroup} ou renumere-a.`,
  duplicateTaskId: (id: string, firstDeclaration: string) =>
    `ID de tarefa "${id}" está duplicado; foi declarado pela primeira vez ${firstDeclaration}.`,
  firstDeclaredOnLine: (line: number) => `na linha ${line}`,
  firstDeclaredInFileOnLine: (filePath: string, line: number) => `em ${filePath} na linha ${line}`,
};

// ═══════════════════════════════════════════════════════════
// Comandos — Workflow (src/commands/workflow/*.ts)
// ═══════════════════════════════════════════════════════════

export const WORKFLOW_MESSAGES = {
  // instructions.ts
  generatingInstructions: 'Gerando instruções...',
  missingArtifactArgument: (artifacts: string) => `Argumento obrigatório <artifact> ausente. Artefatos válidos:\n  ${artifacts}`,
  artifactNotFound: (artifactId: string, schemaName: string, artifacts: string) => `Artefato '${artifactId}' não encontrado no esquema '${schemaName}'. Artefatos válidos:\n  ${artifacts}`,
  unmetDependenciesWarning: 'Este artefato possui dependências não satisfeitas. Complete-as primeiro ou prossiga com cautela.',
  artifactSkippedFallback: 'Este artefato está ignorado (skip_specs está definido em .openspec.yaml).',
  skippedDependencyNoFiles: 'Ignorado: a alteração declara skip_specs, então este artefato não tem arquivos para ler.',
  missingDependencies: (deps: string) => `Pendentes: ${deps}`,
  createArtifactTask: (artifactId: string, changeName: string) => `Crie o artefato ${artifactId} para a alteração "${changeName}".`,
  readFilesForContext: 'Leia o conteúdo atual destes arquivos antes de criar este artefato (releia-os do disco mesmo que já os tenha visto antes - podem ter sido editados):',
  writeTo: (filePath: string) => `Escreva em: ${filePath}`,
  unlocksArtifacts: (artifacts: string) => `Completar este artefato habilita: ${artifacts}`,
  generatingApplyInstructions: 'Gerando instruções de aplicação...',
  cannotApplyMissingArtifacts: (artifacts: string) => `Não é possível aplicar esta alteração ainda. Artefatos ausentes: ${artifacts}.\nUse a skill openspec-continue-change para criar os artefatos ausentes primeiro.`,
  missingTrackingFile: (filename: string) => `O arquivo ${filename} está ausente e deve ser criado.\nUse openspec-continue-change para gerar o arquivo de rastreamento.`,
  trackingFileNoTasks: (filename: string) => `O arquivo ${filename} existe mas não contém tarefas a executar.\nAdicione tarefas a ${filename} ou regenere-o com openspec-continue-change.`,
  allTasksComplete: 'Todas as tarefas estão concluídas! Esta alteração está pronta para ser arquivada.\nConsidere executar testes e revisar as alterações antes de arquivar.',
  allArtifactsCompleteProceed: 'Todos os artefatos necessários estão completos. Prossiga com a implementação.',
  readContextAndWorkTasks: 'Leia os arquivos de contexto, trabalhe nas tarefas pendentes, marque como concluído conforme avança.\nPare se encontrar bloqueios ou precisar de esclarecimentos.',
  applyTitle: (changeName: string) => `## Aplicar: ${changeName}`,
  schemaLabel: (schemaName: string) => `Esquema: ${schemaName}`,
  blockedTitle: '### ⚠️ Bloqueado',
  missingArtifactsLabel: (artifacts: string) => `Artefatos ausentes: ${artifacts}`,
  createMissingFirst: 'Use a skill openspec-continue-change para criá-los primeiro.',
  contextFilesTitle: '### Arquivos de Contexto',
  progressTitle: '### Progresso',
  progressComplete: (complete: number, total: number) => `${complete}/${total} concluído`,
  progressCompleteWithCheck: (complete: number, total: number) => `${complete}/${total} concluído ✓`,
  tasksTitle: '### Tarefas',
  instructionTitle: '### Instrução',
  generatingArchiveInputs: 'Carregando entradas de arquivamento...',
  archiveInputsTitle: (changeName: string) => `## Entradas de Arquivamento: ${changeName}`,
  projectContextTitle: '### Contexto do Projeto (entrada de instrução obrigatória)',
  operationGuidanceTitle: '### Orientação da Operação (consultiva)',
  noOperationInputs: 'Nenhum contexto de projeto ou orientação de operação configurado.',
  // new-change.ts
  missingNameArgument: 'Argumento obrigatório <name> ausente',
  creatingChange: (name: string, schema?: string) => `Criando alteração '${name}'${schema ? ` com esquema '${schema}'` : ''}...`,
  createdChange: (name: string, schema: string) => `Alteração '${name}' criada em openspec/changes/${name}/ (esquema: ${schema})`,
  failedToCreateChange: (name: string) => `Falha ao criar alteração '${name}'`,
  // schemas.ts
  availableSchemas: 'Esquemas disponíveis:',
  projectLabel: ' (projeto)',
  userOverrideLabel: ' (substituição de usuário)',
  artifactsLabel: (artifacts: string) => `Artefatos: ${artifacts}`,
  // shared.ts
  noChangesFound: 'Nenhuma alteração encontrada. Crie uma com: openspec new change <nome>',
  missingChangeOption: (available: string) => `Opção obrigatória --change ausente. Alterações disponíveis:\n  ${available}`,
  invalidChangeName: (name: string, error: string) => `Nome de alteração inválido '${name}': ${error}`,
  changeLookupRelativePath: 'Nome de alteração não pode ser um segmento de caminho relativo',
  changeLookupPathSeparator: 'Nome de alteração não pode conter separadores de caminho',
  changeLookupNullChar: 'Nome de alteração não pode conter caracteres nulos',
  changeLookupLeadingDot: 'Nome de alteração não pode começar com ponto',
  changeLookupArchiveReserved: `'archive' é reservado para alterações arquivadas`,
  changeNotFoundNoChanges: (name: string) => `Alteração '${name}' não encontrada. Nenhuma alteração existe. Crie uma com: openspec new change <nome>`,
  changeNotFound: (name: string, available: string) => `Alteração '${name}' não encontrada. Alterações disponíveis:\n  ${available}`,
  schemaNotFound: (name: string, available?: string) => available ? `Esquema '${name}' não encontrado. Esquemas disponíveis:\n  ${available}` : `Esquema '${name}' não encontrado`,
  schemaReadFailed: (path: string, err: string) => `Falha ao ler o esquema em '${path}': ${err}`,
  schemaInvalid: (path: string, err: string) => `Esquema inválido em '${path}': ${err}`,
  schemaParseFailed: (path: string, err: string) => `Falha ao analisar o esquema em '${path}': ${err}`,
  // status.ts
  loadingChangeStatus: 'Carregando status da alteração...',
  noActiveChanges: 'Nenhuma alteração ativa. Crie uma com: openspec new change <nome>',
  changeLabel: (name: string) => `Alteração: ${name}`,
  schemaLabel2: (name: string) => `Esquema: ${name}`,
  progressArtifacts: (done: number, total: number) => `Progresso: ${done}/${total} artefatos concluídos`,
  progressArtifactsSkipped: (done: number, total: number, skipped: number) => `Progresso: ${done}/${total} artefatos concluídos (${skipped} ignorado(s))`,
  allArtifactsComplete: 'Todos os artefatos concluídos!',
  allPlanningArtifactsComplete: 'Todos os artefatos de planejamento concluídos!',
  blockedBy: (deps: string) => ` (bloqueado por: ${deps})`,
  skippedDeclaresSkipSpecs: ' (ignorado: a alteração declara skip_specs)',
  // status.ts — status --all
  allAndChangeMutuallyExclusive: 'As opções --all e --change não podem ser usadas juntas.',
  missingChangeOrAllOption: (available: string) =>
    `Opção obrigatória --change ausente (ou --all para todas as alterações ativas). Alterações disponíveis:\n  ${available}`,
  statusAllChangeFailed: (changeName: string, message: string) => `✗ ${changeName}: ${message}`,
  // templates.ts
  loadingTemplates: 'Carregando templates...',
  schemaLabel3: (name: string) => `Esquema: ${name}`,
  sourceLabel: (source: string) => `Fonte: ${source}`,
  templateOutsideTemplatesDir: (template: string, artifactId: string) =>
    `Template '${template}' do artefato '${artifactId}' aponta para fora do diretório de templates do esquema`,
};


// ═══════════════════════════════════════════════════════════
// Core — Migração (src/core/migration.ts)
// ═══════════════════════════════════════════════════════════

export const MIGRATION_MESSAGES = {
  migrated: (count: number) => `Migrado: perfil customizado com ${count} fluxos de trabalho`,
  newInThisVersion: (reference: string) => `Novo nesta versão: ${reference}. Experimente 'openspec config profile core' para a experiência simplificada.`,
  // Resumo do que uma migração de diretório legado moveu, ex.: "6 skills e 6 comandos".
  skillCount: (count: number) => `${count} skill${count === 1 ? '' : 's'}`,
  commandCount: (count: number) => `${count} comando${count === 1 ? '' : 's'}`,
  migratedToolContent: (description: string, from: string, to: string) => `Migrado(s) ${description}: ${from} → ${to}`,
  // Nomeia arquivos gerenciados que a migração deliberadamente deixou para trás,
  // sem afirmar que a diferença veio de uma edição: a saída de uma versão mais
  // antiga do BR-OpenSpec também diverge. Nada foi sobrescrito; o usuário decide
  // qual cópia manter.
  keptInPlaceNotice: (count: number, from: string, to: string) =>
    `${count === 1 ? 'Mantido' : 'Mantidos'} ${count} ${count === 1 ? 'arquivo' : 'arquivos'} em ${from}/ que ${count === 1 ? 'difere' : 'diferem'} da cópia em ${to}/. ` +
    `Nada foi sobrescrito — compare as duas e exclua a cópia de ${from}/ depois de preservar o que você personalizou.`,
  legacyMigrationNoticeDevin: (from: string, to: string) =>
    `O Windsurf agora é Devin Desktop, e seu diretório de configuração mudou de ${from}/ para ${to}/. ` +
    `O Devin Desktop lê ${from}/ apenas como fallback, e o Devin Local não o lê.`,
  legacyMigrationNoticeGeneric: (from: string, to: string) => `${from}/ é o local anterior desta ferramenta; ${to}/ é o atual.`,
  // Avisos (console.warn) quando um caminho legado resolve para fora do projeto
  // (por link simbólico): nada é movido nem apagado.
  skippingLegacyRootOutsideProject: (root: string) =>
    `Ignorando a migração do diretório legado ${root}/ porque ele resolve para fora deste projeto.`,
  skippingLegacySkillOutsideProject: (legacyRoot: string, dirName: string) =>
    `Ignorando a migração da skill legada ${legacyRoot}/skills/${dirName} porque ela resolve para fora deste projeto.`,
  skippingLegacyCommandOutsideProject: (legacyPath: string) =>
    `Ignorando a migração do arquivo legado ${legacyPath} porque ele resolve para fora deste projeto.`,
};

// ═══════════════════════════════════════════════════════════
// Core — Limpeza de Legados (src/core/legacy-cleanup.ts)
// ═══════════════════════════════════════════════════════════

export const LEGACY_CLEANUP_MESSAGES = {
  failedToModify: (file: string, error: string) => `Falha ao modificar ${file}: ${error}`,
  failedToDeleteDir: (dir: string, error: string) => `Falha ao excluir diretório ${dir}: ${error}`,
  failedToDeleteFile: (file: string, error: string) => `Falha ao excluir ${file}: ${error}`,
  failedToDeleteOpenspecAgents: (error: string) => `Falha ao excluir openspec/AGENTS.md: ${error}`,
  cleanedUpHeader: 'Arquivos legados limpos:',
  removedFile: (file: string) => `  ✓ Removido ${file}`,
  removedFileReplacedBy: (file: string, replacement: string) =>
    `  ✓ Removido ${file} (substituído por ${replacement})`,
  // Rótulo da superfície que substitui os prompts globais gerenciados do Codex.
  codexSkillsReplacementLabel: 'skills do Codex',
  skippedUnmanagedGlobalPrompt: (file: string) => `Prompt global não gerenciado ignorado: ${file}`,
  removedDir: (dir: string) => `  ✓ Removido ${dir}/ (substituído por skills e comandos do BR-OpenSpec)`,
  removedMarkers: (file: string) => `  ✓ Marcadores BR-OpenSpec removidos de ${file}`,
  errorsHeader: 'Erros durante a limpeza:',
  errorItem: (error: string) => `  ⚠ ${error}`,
  explanationReplacedBySkills: 'substituído por skills/',
  explanationReplacedByToolSkills: (toolDir: string) => `substituído por ${toolDir}/skills/`,
  explanationObsoleteWorkflow: 'arquivo de fluxo de trabalho obsoleto',
  explanationRemovingMarkers: 'removendo marcadores BR-OpenSpec',
  upgradeHeader: 'Atualizando para o novo BR-OpenSpec',
  upgradeLine1: 'O BR-OpenSpec agora usa agent skills, o padrão emergente entre agentes de codificação',
  upgradeLine2: 'Isso simplifica sua configuração enquanto mantém tudo funcionando',
  upgradeLine3: 'como antes.',
  // Prompts globais (fora da árvore do projeto) cuja remoção é adiada até que as
  // skills substitutas existam.
  deferredGlobalPromptsHeader: 'Limpeza adiada de prompts globais',
  deferredGlobalPromptsSubheader:
    'Estes prompts globais só serão removidos depois que as skills substitutas correspondentes forem instaladas.',
  deferredGlobalPromptItem: (toolLabel: string, promptPath: string) => `  • ${toolLabel}${promptPath}`,
  filesToRemoveHeader: 'Arquivos a remover',
  filesToRemoveSubheader: 'Nenhum conteúdo do usuário a preservar:',
  filesToUpdateHeader: 'Arquivos a atualizar',
  filesToUpdateSubheader: 'Os marcadores BR-OpenSpec serão removidos, seu conteúdo será preservado:',
  needsAttention: 'Precisa da sua atenção',
  projectMdItem: '  • openspec/project.md',
  projectMdWontDelete: '    Não excluiremos este arquivo. Ele pode conter contexto útil do projeto.',
  projectMdContextLine1: '    O novo openspec/config.yaml tem uma seção "context:" para contexto',
  projectMdContextLine2: '    de planejamento. Isso é incluído em toda solicitação BR-OpenSpec e funciona mais',
  projectMdContextLine3: '    confiavelmente que a abordagem antiga do project.md.',
  projectMdReviewLine1: '    Revise o project.md, mova qualquer conteúdo útil para a seção context',
  projectMdReviewLine2: '    do config.yaml, depois exclua o arquivo quando estiver pronto.',
};

// ═══════════════════════════════════════════════════════════
// Core — Configuração do Projeto (src/core/project-config.ts)
// ═══════════════════════════════════════════════════════════

export const PROJECT_CONFIG_MESSAGES = {
  invalidSchemaField: "Campo 'schema' inválido na configuração (deve ser uma string não vazia)",
  contextTooLarge: (size: string, limit: string) => `Contexto muito grande (${size}KB, limite: ${limit}KB)`,
  ignoringContextField: 'Ignorando campo de contexto',
  invalidContextField: "Campo 'context' inválido na configuração (deve ser string)",
  emptyRulesForArtifact: (artifactId: string) => `Algumas regras para '${artifactId}' são strings vazias, ignorando-as`,
  rulesMustBeArrayOfStrings: (artifactId: string) => `Regras para '${artifactId}' devem ser um array de strings, ignorando as regras deste artefato`,
  invalidRulesField: "Campo 'rules' inválido na configuração (deve ser um objeto)",
  invalidOperationsField: "Campo 'operations' inválido na configuração (deve ser um objeto)",
  unknownOperationId: (operationId: string, supportedIds: string) => `ID de operação desconhecido '${operationId}' na configuração. IDs de operação suportados: ${supportedIds}`,
  invalidOperationEntry: (operationId: string) => `Campo 'operations.${operationId}' inválido na configuração (deve ser um objeto), ignorando esta operação`,
  unknownOperationFields: (operationId: string, fields: string) => `Campo(s) desconhecido(s) em 'operations.${operationId}': ${fields}. Campos suportados: guidance`,
  operationGuidanceMustBeArray: (operationId: string) => `A orientação da operação '${operationId}' deve ser um array de strings, ignorando a orientação desta operação`,
  emptyGuidanceForOperation: (operationId: string) => `Algumas orientações da operação '${operationId}' são strings vazias, ignorando-as`,
  invalidGithubCopilotCloudAgentField: "Campo 'githubCopilot.cloudAgent' inválido na configuração (deve ser booleano)",
  invalidGithubCopilotField: "Campo 'githubCopilot' inválido na configuração (deve ser um objeto)",
};


// ═══════════════════════════════════════════════════════════
// Core — Copilot coding agent (nuvem) (src/core/github-copilot/cloud-agent.ts)
// ═══════════════════════════════════════════════════════════

export const COPILOT_CLOUD_AGENT_MESSAGES = {
  cannotBuildContent: (label: string) =>
    `Não foi possível montar o conteúdo do arquivo do Copilot coding agent: falta ${label}`,
  parentNotDirectory: (candidate: string) => `O caminho pai não é um diretório: ${candidate}`,
  cannotResolveAncestor: (filePath: string) =>
    `Não foi possível resolver um diretório ancestral para: ${filePath}`,
  managedPathNotRegularFile: (filePath: string) =>
    `O caminho gerenciado do Copilot não é um arquivo regular: ${filePath}`,
  conflictingAgentProfiles: (alternatePath: string, agentPath: string) =>
    `Perfis de agente do Copilot em conflito: preserve ${alternatePath} ou ${agentPath}`,
  // Compartilhada por init e update: o arquivo do usuário nunca é sobrescrito,
  // mas ele precisa saber que o passo de instalação não foi adicionado sozinho.
  leftUntouched: (files: string[]) =>
    `Mantido(s) sem alteração: ${files.join(' e ')} (já existia). Adicione manualmente o passo de ` +
    `instalação do BR-OpenSpec para que o Copilot coding agent consiga executar openspec.`,
};

// ═══════════════════════════════════════════════════════════
// Templates — Copilot coding agent (nuvem)
// (src/core/github-copilot/cloud-agent.ts — conteúdo dos arquivos gerados)
//
// ATENÇÃO (regra de manutenção): o reconhecimento de arquivo gerenciado compara
// o conteúdo INTEIRO por igualdade (com CRLF normalizado). Sempre que estes
// textos mudarem, o corpo anterior precisa entrar na lista de legados em
// `getLegacyCopilotCloudFileContents`, senão arquivos gerados por versões
// anteriores do fork passam a ser tratados como "customizados" e nunca mais são
// atualizados nem removidos.
// ═══════════════════════════════════════════════════════════

export const COPILOT_CLOUD_AGENT_TEMPLATE_MESSAGES = {
  managedMarker: 'Gerado pelo BR-OpenSpec para suporte ao Copilot coding agent do GitHub.',

  // Workflow do GitHub Actions. Chaves YAML, nome do job, `actions/checkout@v4`
  // e o nome do workflow ("Copilot Setup Steps", convenção documentada pelo
  // GitHub) ficam como no upstream; só os comentários e os `name:` dos steps
  // são PT-BR.
  setupStepsBody: `name: "Copilot Setup Steps"

# Executa automaticamente quando alterado (para validação) e pode ser disparado manualmente.
on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  # O job DEVE se chamar \`copilot-setup-steps\` para que o Copilot coding agent o reconheça.
  copilot-setup-steps:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: read

    steps:
      - name: Fazer checkout do código
        uses: actions/checkout@v4

      - name: Instalar a CLI do BR-OpenSpec
        run: npm install -g @dynamicworks/br-openspec

      - name: Verificar a CLI do BR-OpenSpec
        run: openspec --version
`,

  // Definição do agente customizado lida pelo Copilot coding agent do GitHub.
  // `managedMarkerBlock` é '' ou o comentário HTML do marcador seguido de duas
  // quebras de linha (o módulo monta as duas variantes).
  agentFileBody: (managedMarkerBlock: string) => `---
name: BR-OpenSpec
description: "Gerencia changes, specs e workflows do BR-OpenSpec usando a CLI openspec. Use este agente para propor changes, explorar ideias, validar artifacts, verificar status e arquivar trabalho concluído."
tools:
  - "execute"
  - "read"
  - "search"
  - "edit"
---

${managedMarkerBlock}# Agente BR-OpenSpec

Você é um agente especializado em gerenciar workflows do BR-OpenSpec. Antes de usar a CLI \`openspec\`, execute \`openspec --version\`. Se ela não estiver disponível, instale com \`npm install -g @dynamicworks/br-openspec\`.

## O que é o BR-OpenSpec?

O BR-OpenSpec é um sistema estruturado de gestão de mudanças para bases de código. Ele organiza o trabalho em **changes** com artifacts de planejamento (proposals, specs, designs, tarefas) que orientam a implementação.

## Comandos disponíveis

### Comandos de CLI compatíveis com agentes (prefira \`--json\` para saída estruturada)

| Command | Finalidade |
|---------|------------|
| \`openspec list [--json]\` | Lista todas as changes e specs |
| \`openspec show <item> [--json]\` | Exibe uma change ou spec específica |
| \`openspec validate [--all] [--json]\` | Valida changes e specs em busca de problemas |
| \`openspec status [--change <name>] [--json]\` | Mostra o progresso dos artifacts de uma change |
| \`openspec instructions [artifact] [--change <name>] [--json]\` | Obtém as instruções do próximo passo de uma change |
| \`openspec templates [--json]\` | Lista os templates disponíveis |
| \`openspec schemas [--json]\` | Lista os schemas de workflow disponíveis |
| \`openspec archive <change> --json [--yes]\` | Arquiva uma change concluída; use \`--yes\` só depois de confirmar que todas as tarefas estão completas |

### Comandos de CLI interativos (use quando o usuário pedir)

| Command | Finalidade |
|---------|------------|
| \`openspec init\` | Inicializa o BR-OpenSpec no projeto |
| \`openspec update\` | Atualiza a configuração e os artifacts do BR-OpenSpec |
| \`openspec view\` | Painel interativo |
| \`openspec config\` | Exibe ou altera configurações |

## Workflow

Quando for solicitado a trabalhar com o BR-OpenSpec, siga este padrão:

1. **Encontre a change**: execute \`openspec list --json\` para ver as changes ativas.
2. **Verifique o progresso**: execute \`openspec status --change <name> --json\` para a change selecionada.
3. **Siga as instruções**: execute \`openspec instructions [artifact] --change <name> --json\` para o próximo artifact.
4. **Valide antes de concluir**: execute \`openspec validate <name> --json\`.

## Criando novas changes

Quando o usuário quiser propor uma nova change:

1. Execute \`openspec new change <name>\`.
2. Execute \`openspec status --change <name> --json\` para ver a sequência de artifacts.
3. Use \`openspec instructions [artifact] --change <name> --json\` antes de criar cada artifact.
4. Execute \`openspec validate <name> --json\` quando os artifacts estiverem completos.

## Diretórios principais

- \`openspec/\` — Diretório raiz do BR-OpenSpec
- \`openspec/changes/\` — Changes ativas com seus artifacts
- \`openspec/config.yaml\` — Configuração do projeto

## Boas práticas

- Sempre use a flag \`--json\` quando precisar interpretar a saída programaticamente
- Execute \`openspec validate\` após criar ou modificar artifacts
- Verifique \`openspec status\` antes de começar o trabalho para entender o estado atual
- Ao arquivar, garanta que todas as tarefas foram concluídas e validadas primeiro
`,
};


// ═══════════════════════════════════════════════════════════
// Templates de Workflow — Nova Change (src/core/templates/workflows/new-change.ts)
// ═══════════════════════════════════════════════════════════

export const NEW_CHANGE_TEMPLATE_MESSAGES = {
  skillDescription: 'Inicie uma nova change do BR-OpenSpec usando o workflow experimental de artifacts. Use quando o usuário quiser criar uma nova funcionalidade, correção ou modificação com uma abordagem estruturada passo a passo.',
  skillInstructions: `Inicie uma nova change usando a abordagem experimental orientada a artifacts.

**Entrada**: A solicitação do usuário deve incluir um nome de change (kebab-case) OU uma descrição do que ele quer construir.

**Passos**

1. **Se nenhuma entrada clara for fornecida, pergunte o que ele quer construir**

   Pergunte ao usuário (de forma aberta, sem opções pré-definidas):
   > "Em qual change você quer trabalhar? Descreva o que quer construir ou corrigir."

   A partir da descrição dele, derive um nome kebab-case (por exemplo, "adicionar autenticação de usuário" → \`add-user-auth\`).

   **IMPORTANTE**: NÃO prossiga sem entender o que o usuário quer construir.

2. **Determine o schema de workflow**

   Use o schema padrão (omitir \`--schema\`) a menos que o usuário solicite explicitamente um workflow diferente.

   **Use um schema diferente apenas se o usuário mencionar:**
   - Um nome de schema específico → use \`--schema <nome>\`
   - "mostrar workflows" ou "quais workflows" → execute \`openspec schemas --json\` e deixe-o escolher

   **Caso contrário**: Omita \`--schema\` para usar o padrão.

3. **Crie o diretório da change**
   \`\`\`bash
   openspec new change "<nome>"
   \`\`\`
   Adicione \`--schema <nome>\` apenas se o usuário solicitou um workflow específico.
   Isso cria uma change com scaffold em \`openspec/changes/<nome>/\` com o schema selecionado.

4. **Mostre o status dos artifacts**
   \`\`\`bash
   openspec status --change "<nome>"
   \`\`\`
   Isso mostra quais artifacts precisam ser criados e quais estão prontos (dependências satisfeitas).

5. **Obtenha instruções para o primeiro artifact**
   O primeiro artifact depende do schema (por exemplo, \`proposal\` para spec-driven).
   Verifique a saída do status para encontrar o primeiro artifact com status "ready".
   \`\`\`bash
   openspec instructions <primeiro-artifact-id> --change "<nome>"
   \`\`\`
   Isso produz o template e contexto para criar o primeiro artifact.

6. **PARE e aguarde direção do usuário**

**Saída**

Após completar os passos, resuma:
- Nome da change e localização
- Schema/workflow sendo usado e sua sequência de artifacts
- Status atual (0/N artifacts completos)
- O template para o primeiro artifact
- Prompt: "Pronto para criar o primeiro artifact? Basta descrever do que se trata esta change e eu elaboro um rascunho, ou peça-me para continuar."

**Guardrails**
- NÃO crie nenhum artifact ainda - apenas mostre as instruções
- NÃO avance além de mostrar o template do primeiro artifact
- Se o nome for inválido (não kebab-case), peça um nome válido
- Se uma change com aquele nome já existir, sugira continuar aquela change em vez disso
- Passe --schema se estiver usando um workflow não padrão`,
  skillCompatibility: 'Requer openspec CLI.',
  opsxDescription: 'Inicie uma nova change usando o workflow experimental de artifacts (OPSX)',
  opsxContent: `Inicie uma nova change usando a abordagem experimental orientada a artifacts.

**Entrada**: O argumento após \`/opsx:new\` é o nome da change (kebab-case), OU uma descrição do que o usuário quer construir.

**Passos**

1. **Se nenhuma entrada for fornecida, pergunte o que ele quer construir**

   Pergunte ao usuário (de forma aberta, sem opções pré-definidas):
   > "Em qual change você quer trabalhar? Descreva o que quer construir ou corrigir."

   A partir da descrição dele, derive um nome kebab-case (por exemplo, "adicionar autenticação de usuário" → \`add-user-auth\`).

   **IMPORTANTE**: NÃO prossiga sem entender o que o usuário quer construir.

2. **Determine o schema de workflow**

   Use o schema padrão (omitir \`--schema\`) a menos que o usuário solicite explicitamente um workflow diferente.

   **Use um schema diferente apenas se o usuário mencionar:**
   - Um nome de schema específico → use \`--schema <nome>\`
   - "mostrar workflows" ou "quais workflows" → execute \`openspec schemas --json\` e deixe-o escolher

   **Caso contrário**: Omita \`--schema\` para usar o padrão.

3. **Crie o diretório da change**
   \`\`\`bash
   openspec new change "<nome>"
   \`\`\`
   Adicione \`--schema <nome>\` apenas se o usuário solicitou um workflow específico.
   Isso cria uma change com scaffold em \`openspec/changes/<nome>/\` com o schema selecionado.

4. **Mostre o status dos artifacts**
   \`\`\`bash
   openspec status --change "<nome>"
   \`\`\`
   Isso mostra quais artifacts precisam ser criados e quais estão prontos (dependências satisfeitas).

5. **Obtenha instruções para o primeiro artifact**
   O primeiro artifact depende do schema. Verifique a saída do status para encontrar o primeiro artifact com status "ready".
   \`\`\`bash
   openspec instructions <primeiro-artifact-id> --change "<nome>"
   \`\`\`
   Isso produz o template e contexto para criar o primeiro artifact.

6. **PARE e aguarde direção do usuário**

**Saída**

Após completar os passos, resuma:
- Nome da change e localização
- Schema/workflow sendo usado e sua sequência de artifacts
- Status atual (0/N artifacts completos)
- O template para o primeiro artifact
- Prompt: "Pronto para criar o primeiro artifact? Execute \`/opsx:continue\` ou apenas descreva do que se trata esta change e eu elaboro um rascunho."

**Guardrails**
- NÃO crie nenhum artifact ainda - apenas mostre as instruções
- NÃO avance além de mostrar o template do primeiro artifact
- Se o nome for inválido (não kebab-case), peça um nome válido
- Se uma change com aquele nome já existir, sugira usar \`/opsx:continue\` em vez disso
- Passe --schema se estiver usando um workflow não padrão`,
};


// ═══════════════════════════════════════════════════════════
// Templates de Workflow — Onboard (src/core/templates/workflows/onboard.ts)
// ═══════════════════════════════════════════════════════════

export const ONBOARD_TEMPLATE_MESSAGES = {
  skillDescription: 'Onboarding guiado para o BR-OpenSpec - percorra um ciclo completo de workflow com narração e trabalho real na codebase.',
  skillCompatibility: 'Requer openspec CLI.',
  opsxDescription: 'Onboarding guiado - percorra um ciclo completo de workflow do BR-OpenSpec com narração',
  instructions: `Guie o usuário através de seu primeiro ciclo completo de workflow do BR-OpenSpec. Esta é uma experiência de ensino - você fará trabalho real na codebase dele enquanto explica cada passo.

---

## Pré-voo

Antes de começar, verifique se o CLI do BR-OpenSpec está instalado. Use o bloco adequado ao SO do usuário:

\`\`\`bash
# Unix/macOS
openspec --version 2>&1 || echo "CLI_NOT_INSTALLED"
\`\`\`

\`\`\`powershell
# Windows (PowerShell)
if (Get-Command openspec -ErrorAction SilentlyContinue) { openspec --version } else { Write-Output "CLI_NOT_INSTALLED" }
\`\`\`

**Se o CLI não estiver instalado:**
> O CLI do BR-OpenSpec não está instalado. Instale-o primeiro, depois volte para \`/opsx:onboard\`.

Pare aqui se não estiver instalado.

---

## Fase 1: Boas-vindas

Exiba:

\`\`\`
## Bem-vindo ao BR-OpenSpec!

Eu vou te guiar através de um ciclo completo de change - da ideia à implementação - usando uma tarefa real na sua codebase. Ao longo do caminho, você aprenderá o workflow fazendo.

**O que faremos:**
1. Escolher uma tarefa pequena e real na sua codebase
2. Explorar o problema brevemente
3. Criar uma change (o container para nosso trabalho)
4. Construir os artifacts: proposal → specs → design → tasks
5. Implementar as tarefas
6. Arquivar a change concluída

**Tempo:** ~15-20 minutos

Vamos começar encontrando algo para trabalhar.
\`\`\`

---

## Fase 2: Seleção de Tarefa

### Análise da Codebase

Escaneie a codebase em busca de pequenas oportunidades de melhoria. Procure por:

1. **Comentários TODO/FIXME** - Pesquise por \`TODO\`, \`FIXME\`, \`HACK\`, \`XXX\` em arquivos de código
2. **Tratamento de erros ausente** - Blocos \`catch\` que engolem erros, operações arriscadas sem try-catch
3. **Funções sem testes** - Relacione \`src/\` com diretórios de teste
4. **Problemas de tipos** - Tipos \`any\` em arquivos TypeScript (\`: any\`, \`as any\`)
5. **Artifacts de debug** - Declarações \`console.log\`, \`console.debug\`, \`debugger\` em código não-debug
6. **Validação ausente** - Handlers de entrada de usuário sem validação

Verifique também a atividade recente do git:
\`\`\`bash
# Unix/macOS
git log --oneline -10 2>/dev/null || echo "Sem histórico git"
# Windows (PowerShell)
# git log --oneline -10 2>$null; if ($LASTEXITCODE -ne 0) { echo "Sem histórico git" }
\`\`\`

### Apresente Sugestões

A partir da sua análise, apresente 3-4 sugestões específicas:

\`\`\`
## Sugestões de Tarefas

Com base no escaneamento da sua codebase, aqui estão algumas boas tarefas iniciais:

**1. [Tarefa mais promissora]**
   Local: \`src/caminho/para/arquivo.ts:42\`
   Escopo: ~1-2 arquivos, ~20-30 linhas
   Por que é boa: [breve razão]

**2. [Segunda tarefa]**
   Local: \`src/outro/arquivo.ts\`
   Escopo: ~1 arquivo, ~15 linhas
   Por que é boa: [breve razão]

**3. [Terceira tarefa]**
   Local: [local]
   Escopo: [estimativa]
   Por que é boa: [breve razão]

**4. Outra coisa?**
   Me diga no que você gostaria de trabalhar.

Qual tarefa te interessa? (Escolha um número ou descreva a sua)
\`\`\`

**Se nada for encontrado:** Volte a perguntar o que o usuário quer construir:
> Não encontrei vitórias rápidas óbvias na sua codebase. Qual é algo pequeno que você vem querendo adicionar ou corrigir?

### Guardrail de Escopo

Se o usuário escolher ou descrever algo muito grande (funcionalidade principal, trabalho de vários dias):

\`\`\`
Essa é uma tarefa valiosa, mas provavelmente maior do que o ideal para sua primeira execução do BR-OpenSpec.

Para aprender o workflow, menor é melhor - permite ver o ciclo completo sem ficar preso em detalhes de implementação.

**Opções:**
1. **Fatiar menor** - Qual é a menor peça útil de [tarefa dele]? Talvez apenas [fatia específica]?
2. **Escolher outra coisa** - Uma das outras sugestões, ou uma tarefa pequena diferente?
3. **Fazer assim mesmo** - Se você realmente quiser encarar isso, podemos. Só saiba que vai demorar mais.

O que você prefere?
\`\`\`

Deixe o usuário sobrepor se insistir - este é um guardrail suave.

---

## Fase 3: Demonstração do Explore

Uma vez que uma tarefa seja selecionada, demonstre brevemente o modo explore:

\`\`\`
Antes de criarmos uma change, deixe-me rapidamente te mostrar o **modo explore** - é como você pensa sobre problemas antes de se comprometer com uma direção.
\`\`\`

Gaste 1-2 minutos investigando o código relevante:
- Leia o(s) arquivo(s) envolvido(s)
- Desenhe um diagrama ASCII rápido se ajudar
- Note quaisquer considerações

\`\`\`
## Exploração Rápida

[Sua breve análise - o que você encontrou, quaisquer considerações]

┌─────────────────────────────────────────┐
│   [Opcional: diagrama ASCII se útil]    │
└─────────────────────────────────────────┘

O modo explore (\`/opsx:explore\`) é para esse tipo de pensamento - investigar antes de implementar. Você pode usá-lo a qualquer momento que precisar pensar sobre um problema.

Agora vamos criar uma change para conter nosso trabalho.
\`\`\`

**PAUSA** - Aguarde confirmação do usuário antes de prosseguir.

---

## Fase 4: Criar a Change

**EXPLIQUE:**
\`\`\`
## Criando uma Change

Uma "change" no BR-OpenSpec é um container para todo o pensamento e planejamento em torno de uma peça de trabalho. Ela fica em \`openspec/changes/<nome>/\` e armazena seus artifacts - proposal, specs, design, tasks.

Deixe-me criar uma para nossa tarefa.
\`\`\`

**FAÇA:** Crie a change com um nome kebab-case derivado:
\`\`\`bash
openspec new change "<nome-derivado>"
\`\`\`

**MOSTRE:**
\`\`\`
Criado: \`openspec/changes/<nome>/\`

A estrutura de pastas:
\`\`\`
openspec/changes/<nome>/
├── proposal.md    ← Por que estamos fazendo isso (vazio, vamos preencher)
├── design.md      ← Como vamos construir (vazio)
├── specs/         ← Requisitos detalhados (vazio)
└── tasks.md       ← Checklist de implementação (vazio)
\`\`\`

Agora vamos preencher o primeiro artifact - a proposal.
\`\`\`

---

## Fase 5: Proposal

**EXPLIQUE:**
\`\`\`
## A Proposal

A proposal captura **por que** estamos fazendo esta change e **o que** ela envolve em alto nível. É o "pitch de elevador" para o trabalho.

Vou elaborar uma com base na nossa tarefa.
\`\`\`

**FAÇA:** Elabore o conteúdo da proposal (ainda não salve):

\`<capability-path>\` é o diretório do spec relativo a \`specs/\` (por exemplo,
\`user-auth\` ou \`identity/user-auth\`). Use o caminho exato existente para capabilities
modificadas. Para capabilities novas, siga a organização de specs já estabelecida no
projeto.

\`\`\`
Aqui está um rascunho de proposal:

---

## Why

[1-2 frases explicando o problema/oportunidade]

## What Changes

[Bullet points do que será diferente]

## Capabilities

### Novas Capabilities
- \`<capability-path>\`: [breve descrição]

### Capabilities Modificadas
<!-- Se modificar comportamento existente -->
- \`<existing-capability-path>\`: [breve descrição]

## Impacto

- \`src/caminho/para/arquivo.ts\`: [o que muda]
- [outros arquivos se aplicável]

---

Isso captura a intenção? Posso ajustar antes de salvá-la.
\`\`\`

**PAUSA** - Aguarde aprovação/feedback do usuário.

Após aprovação, salve a proposal:
\`\`\`bash
openspec instructions proposal --change "<nome>" --json
\`\`\`
Depois escreva o conteúdo em \`openspec/changes/<nome>/proposal.md\`.

\`\`\`
Proposal salva. Este é seu documento de "por que" - você sempre pode voltar e refiná-lo à medida que o entendimento evolui.

Próximo: specs.
\`\`\`

---

## Fase 6: Specs

**EXPLIQUE:**
\`\`\`
## Specs

Os specs definem **o que** estamos construindo em termos precisos e testáveis. Eles usam um formato de requisito/cenário que torna o comportamento esperado cristalino.

Para uma tarefa pequena como esta, talvez precisemos apenas de um arquivo spec.
\`\`\`

**FAÇA:** Crie o arquivo spec:
\`\`\`bash
# Unix/macOS
mkdir -p openspec/changes/<nome>/specs/<capability-path>
# Windows (PowerShell)
# New-Item -ItemType Directory -Force -Path "openspec/changes/<nome>/specs/<capability-path>"
\`\`\`

Elabore o conteúdo do spec:

\`\`\`
Aqui está o spec:

---

## ADDED Requirements

### Requirement: <Nome>

O sistema SHALL <descrição do que o sistema deve fazer>

#### Scenario: <Nome do cenário>

- **WHEN** <condição de gatilho>
- **THEN** <resultado esperado>
- **AND** <resultado adicional se necessário>

---

Este formato - WHEN/THEN/AND - torna os requisitos testáveis. Você pode literalmente lê-los como casos de teste. Os marcadores estruturais (ADDED Requirements, Requirement, Scenario) e as palavras-chave (WHEN/THEN/AND, SHALL/MUST) ficam SEMPRE em inglês — é o protocolo que o parser e o validador reconhecem. Apenas o conteúdo descritivo é escrito em português.
\`\`\`

Salve em \`openspec/changes/<nome>/specs/<capability-path>/spec.md\`.

---

## Fase 7: Design

**EXPLIQUE:**
\`\`\`
## Design

O design captura **como** vamos construir - decisões técnicas, tradeoffs, abordagem.

Para changes pequenas, isto pode ser breve. Tudo bem - nem toda change precisa de discussão profunda de design.
\`\`\`

**FAÇA:** Elabore design.md:

\`\`\`
Aqui está o design:

---

## Contexto

[Contexto breve sobre o estado atual]

## Objetivos / Não-Objetivos

**Objetivos:**
- [O que estamos tentando alcançar]

**Não-Objetivos:**
- [O que está explicitamente fora do escopo]

## Decisões

### Decisão 1: [Decisão-chave]

[Explicação da abordagem e racional]

---

Para uma tarefa pequena, isto captura as decisões-chave sem over-engineering.
\`\`\`

Salve em \`openspec/changes/<nome>/design.md\`.

---

## Fase 8: Tasks

**EXPLIQUE:**
\`\`\`
## Tasks

Finalmente, quebramos o trabalho em tarefas de implementação - checkboxes que impulsionam a fase de apply.

Elas devem ser pequenas, claras e em ordem lógica.
\`\`\`

**FAÇA:** Gere tarefas baseadas nos specs e design:

\`\`\`
Aqui estão as tarefas de implementação:

---

## 1. [Categoria ou arquivo]

- [ ] 1.1 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]
- [ ] 1.2 [Tarefa específica] — verificar: [teste, comando, comportamento observável ou artifact entregue]

## 2. Verificação de Integração

- [ ] 2.1 Verificar [integração mais ampla ou comportamento do sistema] com [teste de ponta a ponta ou resultado observável]

---

Cada checkbox se torna uma unidade de trabalho na fase de apply. Pronto para implementar?
\`\`\`

**PAUSA** - Aguarde o usuário confirmar que está pronto para implementar.

Salve em \`openspec/changes/<nome>/tasks.md\`.

---

## Fase 9: Apply (Implementação)

**EXPLIQUE:**
\`\`\`
## Implementação

Agora implementamos cada tarefa, marcando-as à medida que avançamos. Anunciarei cada uma e ocasionalmente notarei como os specs/design informaram a abordagem.
\`\`\`

**FAÇA:** Para cada tarefa:

1. Anuncie: "Trabalhando na tarefa N: [descrição]"
2. Implemente a mudança na codebase
3. Referencie specs/design naturalmente: "O spec diz X, então estou fazendo Y"
4. Marque como concluída em tasks.md: \`- [ ]\` → \`- [x]\`
5. Breve status: "✓ Tarefa N concluída"

Mantenha a narração leve - não explique cada linha de código.

Após todas as tarefas:

\`\`\`
## Implementação Concluída

Todas as tarefas concluídas:
- [x] Tarefa 1
- [x] Tarefa 2
- [x] ...

A change está implementada! Mais um passo - vamos arquivá-la.
\`\`\`

---

## Fase 10: Archive

**EXPLIQUE:**
\`\`\`
## Arquivamento

Quando uma change está completa, nós a arquivamos. Isso a move de \`openspec/changes/\` para \`openspec/changes/archive/YYYY-MM-DD-<nome>/\`.

As changes arquivadas se tornam o histórico de decisões do seu projeto - você sempre pode encontrá-las depois para entender por que algo foi construído de certa forma.
\`\`\`

**FAÇA:** Arquive a change (\`--yes\` responde às perguntas de confirmação, que você não consegue responder a partir de uma chamada de ferramenta):
\`\`\`bash
openspec archive "<nome>" --yes
\`\`\`

**MOSTRE:**
\`\`\`
Arquivado em: \`openspec/changes/archive/<target-name>/\` (o nome de destino prefixa a data de hoje, a menos que o nome já comece com um prefixo \`YYYY-MM-DD-\` — nesse caso ele é mantido como está, sem segunda data)

A change agora faz parte do histórico do seu projeto. O código está na sua codebase, o registro de decisão está preservado.
\`\`\`

---

## Fase 11: Recapitulação e Próximos Passos

\`\`\`
## Parabéns!

Você acabou de completar um ciclo completo do BR-OpenSpec:

1. **Explore** - Pensou sobre o problema
2. **New** - Criou um container de change
3. **Proposal** - Capturou POR QUE
4. **Specs** - Definiu O QUE em detalhes
5. **Design** - Decidiu COMO
6. **Tasks** - Quebrou em passos
7. **Apply** - Implementou o trabalho
8. **Archive** - Preservou o registro

Este mesmo ritmo funciona para qualquer tamanho de change - uma pequena correção ou uma funcionalidade principal.

---

## Referência de Comandos

**Workflow principal:**

 | Comando           | O que faz                                   |
 |-------------------|---------------------------------------------|
 | \`/opsx:propose\` | Cria uma change e gera todos os artifacts   |
 | \`/opsx:explore\` | Pensa sobre problemas antes/durante o trabalho |
 | \`/opsx:apply\`   | Implementa tarefas de uma change            |
 | \`/opsx:archive\` | Arquiva uma change concluída                |

**Comandos adicionais** (somente se instalados - a disponibilidade depende do seu perfil):

 | Comando            | O que faz                                              |
 |--------------------|--------------------------------------------------------|
 | \`/opsx:new\`      | Inicia uma nova change, passo a passo pelos artifacts  |
 | \`/opsx:continue\` | Continua trabalhando em uma change existente           |
 | \`/opsx:ff\`       | Fast-forward: cria todos os artifacts de uma vez       |
 | \`/opsx:verify\`   | Verifica se implementação corresponde aos artifacts    |

---

## E Agora?

Experimente \`/opsx:propose\` em algo que você realmente quer construir. Você já pegou o ritmo!
\`\`\`

---

## Tratamento de Saída Graciosa

### Usuário quer parar no meio do caminho

Se o usuário disser que precisa parar, quer pausar, ou parecer desengajado:

\`\`\`
Sem problema! Sua change está salva em \`openspec/changes/<nome>/\`.

Para retomar de onde paramos depois:
- \`/opsx:continue <nome>\` - Retoma a criação de artifacts (se instalado; caso contrário \`openspec status --change "<nome>" --json\` mostra o próximo artifact)
- \`/opsx:apply <nome>\` - Pula para implementação (se tasks existirem)

O trabalho não será perdido. Volte quando estiver pronto.
\`\`\`

Saia graciosamente sem pressão.

### Usuário apenas quer a referência de comandos

Se o usuário disser que apenas quer ver os comandos ou pular o tutorial:

\`\`\`
## Referência Rápida do BR-OpenSpec

**Workflow principal:**

 | Comando                  | O que faz                                   |
 |--------------------------|---------------------------------------------|
 | \`/opsx:propose <nome>\` | Cria uma change e gera todos os artifacts   |
 | \`/opsx:explore\`        | Pensa sobre problemas (sem mudanças de código) |
 | \`/opsx:apply <nome>\`   | Implementa tarefas                          |
 | \`/opsx:archive <nome>\` | Arquiva quando concluído                    |

**Comandos adicionais** (somente se instalados - a disponibilidade depende do seu perfil):

 | Comando                   | O que faz                        |
 |---------------------------|----------------------------------|
 | \`/opsx:new <nome>\`      | Inicia uma nova change, passo a passo |
 | \`/opsx:continue <nome>\` | Continua uma change existente    |
 | \`/opsx:ff <nome>\`       | Fast-forward: todos os artifacts de uma vez |
 | \`/opsx:verify <nome>\`   | Verifica implementação           |

Experimente \`/opsx:propose\` para iniciar sua primeira change.
\`\`\`

Saia graciosamente.

---

## Guardrails

- **Siga o padrão EXPLICAR → FAZER → MOSTRAR → PAUSA** nas transições-chave (após explore, após rascunho de proposal, após tasks, após archive)
- **Mantenha a narração leve** durante a implementação - ensine sem pregar
- **Não pule fases** mesmo se a change for pequena - o objetivo é ensinar o workflow
- **Pause para confirmação** nos pontos marcados, mas não exagere nas pausas
- **Trate saídas graciosamente** - nunca pressione o usuário a continuar
- **Use tarefas reais da codebase** - não simule ou use exemplos falsos
- **Ajuste o escopo gentilmente** - guie para tarefas menores mas respeite a escolha do usuário`,
};


// ═══════════════════════════════════════════════════════════
// Templates de Workflow — Verificar Change (src/core/templates/workflows/verify-change.ts)
// ═══════════════════════════════════════════════════════════

export const VERIFY_CHANGE_TEMPLATE_MESSAGES = {
  skillDescription: 'Verifica se a implementação corresponde aos artifacts da change. Use quando o usuário quiser validar que a implementação está completa, correta e coerente antes de arquivar.',
  skillCompatibility: 'Requer openspec CLI.',
  opsxDescription: 'Verifica se a implementação corresponde aos artifacts da change antes de arquivar',
  skillInstructions: `Verifica se uma implementação corresponde aos artifacts da change (specs, tasks, design).

**Entrada**: Opcionalmente especifique um nome de change. Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute \`openspec list --json\` para obter as changes disponíveis e peça ao usuário que selecione uma

   Ao solicitar, mostre as changes que possuem artifact de implementação. Para cada change, execute \`openspec status --change "<nome>" --json\` e use os IDs de artifacts e \`contextFiles\` (via \`openspec instructions apply --change "<nome>" --json\`) para identificar qual artifact rastreia a implementação — não fixe \`tasks\`.

   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, \`/opsx:verify <outra>\`).

2. **Verifique o status para entender o schema**
   \`\`\`bash
   openspec status --change "<nome>" --json
   \`\`\`
   Analise o JSON para entender:
   - \`schemaName\`: O workflow sendo usado (por exemplo, "spec-driven")
   - Quais artifacts existem para esta change

3. **Obtenha o diretório da change e carregue os artifacts**

   \`\`\`bash
   openspec instructions apply --change "<nome>" --json
   \`\`\`

   Isso retorna o diretório da change e \`contextFiles\` (artifact ID -> array de caminhos de arquivos concretos). Leia todos os artifacts disponíveis de \`contextFiles\`.

4. **Inicialize a estrutura do relatório de verificação**

   Crie uma estrutura de relatório com três dimensões:
   - **Completeness**: Acompanhe tasks e cobertura de specs
   - **Correctness**: Acompanhe implementação de requisitos e cobertura de cenários
   - **Coherence**: Acompanhe aderência ao design e consistência de padrões

   Cada dimensão pode ter issues CRITICAL, WARNING ou SUGGESTION.

5. **Verifique Completeness**

   **Conclusão de Tasks**:
   - Se \`contextFiles.tasks\` existir, leia cada caminho de arquivo nele
   - Analise checkboxes: \`- [ ]\` (incompleto) vs \`- [x]\` (concluído)
   - Conte tasks concluídas vs total
   - Se houver tasks incompletas:
     - Adicione issue CRITICAL para cada task incompleta
     - Recomendação: "Complete task: <descrição>" ou "Mark as done if already implemented"

   **Cobertura de Specs**:
   - Use \`contextFiles\` e \`artifactPaths\` do status/instructions para localizar delta specs — não assuma caminhos fixos
   - Extraia todos os requisitos (marcados com "### Requirement:")
   - Para cada requisito:
     - Procure no codebase por evidências objetivas de implementação (símbolos, testes, endpoints)
     - Não classifique como CRITICAL apenas por busca heurística de palavras-chave inconclusiva
     - Se houver evidência clara de que o requisito não foi implementado: issue CRITICAL
     - Se a análise for inconclusiva: registre WARNING ou SUGGESTION conforme o risco de falso positivo
     - Recomendação: "Implement requirement X: <descrição>" ou "Verify requirement X manually: <descrição>"

6. **Verifique Correctness**

   **Mapeamento de Implementação de Requisitos**:
   - Para cada requisito dos delta specs:
     - Procure no codebase por evidências de implementação
     - Se encontrado, anote os caminhos de arquivo e intervalos de linha
     - Avalie se a implementação corresponde à intenção do requisito
     - Se divergência for detectada:
       - Adicione WARNING: "Implementation may diverge from spec: <detalhes>"
       - Recomendação: "Review <arquivo>:<linhas> contra requirement X"

   **Cobertura de Cenários**:
   - Para cada cenário nos delta specs (marcado com "#### Scenario:"):
     - Verifique se as condições são tratadas no código
     - Verifique se existem testes cobrindo o cenário
     - Se o cenário parecer não coberto:
       - Adicione WARNING: "Scenario not covered: <nome do cenário>"
       - Recomendação: "Add test or implementation for scenario: <descrição>"

7. **Verifique Coherence**

   **Aderência ao Design**:
   - Se \`contextFiles.design\` existir:
     - Extraia decisões-chave (procure por seções como "Decision:", "Approach:", "Architecture:")
     - Verifique se a implementação segue essas decisões
     - Se contradição for detectada:
       - Adicione WARNING: "Design decision not followed: <decisão>"
       - Recomendação: "Update implementation or revise design.md to match reality"
   - Se não houver design.md: Pule a verificação de aderência ao design, anote "No design.md to verify against"

   **Consistência de Padrões de Código**:
   - Revise o novo código quanto à consistência com os padrões do projeto
   - Verifique nomenclatura de arquivos, estrutura de diretórios, estilo de código
   - Se houver desvios significativos:
     - Adicione SUGGESTION: "Code pattern deviation: <detalhes>"
     - Recomendação: "Consider following project pattern: <exemplo>"

8. **Gere o Relatório de Verificação**

   **Scorecard de Resumo**:
   \`\`\`
   ## Verification Report: <nome-change>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   \`\`\`

   **Issues por Prioridade**:

   1. **CRITICAL** (Deve corrigir antes de arquivar):
      - Tasks incompletas
      - Implementações de requisitos ausentes
      - Cada uma com recomendação específica e acionável

   2. **WARNING** (Deveria corrigir):
      - Divergências de spec/design
      - Cobertura de cenário ausente
      - Cada uma com recomendação específica

   3. **SUGGESTION** (Bom corrigir):
      - Inconsistências de padrão
      - Melhorias menores
      - Cada uma com recomendação específica

   **Avaliação Final**:
   - Se houver issues CRITICAL: "X critical issue(s) found. Fix before archiving."
   - Se houver apenas warnings: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - Se tudo estiver claro: "All checks passed. Ready for archive."

**Heurísticas de Verificação**

- **Completeness**: Foque em itens de checklist objetivos (checkboxes, lista de requisitos)
- **Correctness**: Use busca por palavras-chave, análise de caminhos de arquivo, inferência razoável — não exija certeza perfeita
- **Coherence**: Procure inconsistências gritantes, não seja meticuloso com estilo
- **False Positives**: Quando incerto, prefira SUGGESTION ao invés de WARNING, WARNING ao invés de CRITICAL
- **Actionability**: Cada issue deve ter uma recomendação específica com referências de arquivo/linha quando aplicável

**Degradação Graciosa**

- Se apenas tasks.md existir: verifique apenas a conclusão de tasks, pule verificações de spec/design
- Se tasks + specs existirem: verifique completeness e correctness, pule design
- Se todos os artifacts existirem: verifique as três dimensões
- Sempre anote quais verificações foram puladas e por quê

**Formato de Saída**

Use markdown claro com:
- Tabela para scorecard de resumo
- Listas agrupadas para issues (CRITICAL/WARNING/SUGGESTION)
- Referências de código no formato: \`arquivo.ts:123\`
- Recomendações específicas e acionáveis
- Sem sugestões vagas como "consider reviewing"`,
  opsxContent: `Verifica se uma implementação corresponde aos artifacts da change (specs, tasks, design).

**Entrada**: Opcionalmente especifique um nome de change após \`/opsx:verify\` (por exemplo, \`/opsx:verify add-auth\`). Se omitido, verifique se pode ser inferido do contexto da conversa. Se vago ou ambíguo, você DEVE solicitar as changes disponíveis.

**Passos**

1. **Selecione a change**

   Se um nome for fornecido, use-o. Caso contrário:
   - Infira do contexto da conversa se o usuário mencionou uma change
   - Selecione automaticamente se existir apenas uma change ativa
   - Se ambíguo, execute \`openspec list --json\` para obter as changes disponíveis e peça ao usuário que selecione uma

   Ao solicitar, mostre as changes que possuem artifact de implementação. Para cada change, execute \`openspec status --change "<nome>" --json\` e use os IDs de artifacts e \`contextFiles\` (via \`openspec instructions apply --change "<nome>" --json\`) para identificar qual artifact rastreia a implementação — não fixe \`tasks\`.

   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   Sempre anuncie: "Usando change: <nome>" e como substituir (por exemplo, \`/opsx:verify <outra>\`).

2. **Verifique o status para entender o schema**
   \`\`\`bash
   openspec status --change "<nome>" --json
   \`\`\`
   Analise o JSON para entender:
   - \`schemaName\`: O workflow sendo usado (por exemplo, "spec-driven")
   - Quais artifacts existem para esta change

3. **Obtenha o diretório da change e carregue os artifacts**

   \`\`\`bash
   openspec instructions apply --change "<nome>" --json
   \`\`\`

   Isso retorna o diretório da change e \`contextFiles\` (artifact ID -> array de caminhos de arquivos concretos). Leia todos os artifacts disponíveis de \`contextFiles\`.

4. **Inicialize a estrutura do relatório de verificação**

   Crie uma estrutura de relatório com três dimensões:
   - **Completeness**: Acompanhe tasks e cobertura de specs
   - **Correctness**: Acompanhe implementação de requisitos e cobertura de cenários
   - **Coherence**: Acompanhe aderência ao design e consistência de padrões

   Cada dimensão pode ter issues CRITICAL, WARNING ou SUGGESTION.

5. **Verifique Completeness**

   **Conclusão de Tasks**:
   - Se \`contextFiles.tasks\` existir, leia cada caminho de arquivo nele
   - Analise checkboxes: \`- [ ]\` (incompleto) vs \`- [x]\` (concluído)
   - Conte tasks concluídas vs total
   - Se houver tasks incompletas:
     - Adicione issue CRITICAL para cada task incompleta
     - Recomendação: "Complete task: <descrição>" ou "Mark as done if already implemented"

   **Cobertura de Specs**:
   - Use \`contextFiles\` e \`artifactPaths\` do status/instructions para localizar delta specs — não assuma caminhos fixos
   - Extraia todos os requisitos (marcados com "### Requirement:")
   - Para cada requisito:
     - Procure no codebase por evidências objetivas de implementação (símbolos, testes, endpoints)
     - Não classifique como CRITICAL apenas por busca heurística de palavras-chave inconclusiva
     - Se houver evidência clara de que o requisito não foi implementado: issue CRITICAL
     - Se a análise for inconclusiva: registre WARNING ou SUGGESTION conforme o risco de falso positivo
     - Recomendação: "Implement requirement X: <descrição>" ou "Verify requirement X manually: <descrição>"

6. **Verifique Correctness**

   **Mapeamento de Implementação de Requisitos**:
   - Para cada requisito dos delta specs:
     - Procure no codebase por evidências de implementação
     - Se encontrado, anote os caminhos de arquivo e intervalos de linha
     - Avalie se a implementação corresponde à intenção do requisito
     - Se divergência for detectada:
       - Adicione WARNING: "Implementation may diverge from spec: <detalhes>"
       - Recomendação: "Review <arquivo>:<linhas> contra requirement X"

   **Cobertura de Cenários**:
   - Para cada cenário nos delta specs (marcado com "#### Scenario:"):
     - Verifique se as condições são tratadas no código
     - Verifique se existem testes cobrindo o cenário
     - Se o cenário parecer não coberto:
       - Adicione WARNING: "Scenario not covered: <nome do cenário>"
       - Recomendação: "Add test or implementation for scenario: <descrição>"

7. **Verifique Coherence**

   **Aderência ao Design**:
   - Se \`contextFiles.design\` existir:
     - Extraia decisões-chave (procure por seções como "Decision:", "Approach:", "Architecture:")
     - Verifique se a implementação segue essas decisões
     - Se contradição for detectada:
       - Adicione WARNING: "Design decision not followed: <decisão>"
       - Recomendação: "Update implementation or revise design.md to match reality"
   - Se não houver design.md: Pule a verificação de aderência ao design, anote "No design.md to verify against"

   **Consistência de Padrões de Código**:
   - Revise o novo código quanto à consistência com os padrões do projeto
   - Verifique nomenclatura de arquivos, estrutura de diretórios, estilo de código
   - Se houver desvios significativos:
     - Adicione SUGGESTION: "Code pattern deviation: <detalhes>"
     - Recomendação: "Consider following project pattern: <exemplo>"

8. **Gere o Relatório de Verificação**

   **Scorecard de Resumo**:
   \`\`\`
   ## Verification Report: <nome-change>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   \`\`\`

   **Issues por Prioridade**:

   1. **CRITICAL** (Deve corrigir antes de arquivar):
      - Tasks incompletas
      - Implementações de requisitos ausentes
      - Cada uma com recomendação específica e acionável

   2. **WARNING** (Deveria corrigir):
      - Divergências de spec/design
      - Cobertura de cenário ausente
      - Cada uma com recomendação específica

   3. **SUGGESTION** (Bom corrigir):
      - Inconsistências de padrão
      - Melhorias menores
      - Cada uma com recomendação específica

   **Avaliação Final**:
   - Se houver issues CRITICAL: "X critical issue(s) found. Fix before archiving."
   - Se houver apenas warnings: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - Se tudo estiver claro: "All checks passed. Ready for archive."

**Heurísticas de Verificação**

- **Completeness**: Foque em itens de checklist objetivos (checkboxes, lista de requisitos)
- **Correctness**: Use busca por palavras-chave, análise de caminhos de arquivo, inferência razoável — não exija certeza perfeita
- **Coherence**: Procure inconsistências gritantes, não seja meticuloso com estilo
- **False Positives**: Quando incerto, prefira SUGGESTION ao invés de WARNING, WARNING ao invés de CRITICAL
- **Actionability**: Cada issue deve ter uma recomendação específica com referências de arquivo/linha quando aplicável

**Degradação Graciosa**

- Se apenas tasks.md existir: verifique apenas a conclusão de tasks, pule verificações de spec/design
- Se tasks + specs existirem: verifique completeness e correctness, pule design
- Se todos os artifacts existirem: verifique as três dimensões
- Sempre anote quais verificações foram puladas e por quê

**Formato de Saída**

Use markdown claro com:
- Tabela para scorecard de resumo
- Listas agrupadas para issues (CRITICAL/WARNING/SUGGESTION)
- Referências de código no formato: \`arquivo.ts:123\`
- Recomendações específicas e acionáveis
- Sem sugestões vagas como "consider reviewing"`,
};

// ═══════════════════════════════════════════════════════════
// Templates de Workflow — Code Review (src/core/templates/workflows/code-review.ts)
// ═══════════════════════════════════════════════════════════

export const CODE_REVIEW_TEMPLATE_MESSAGES = {
  skillDescription: 'Realiza code review genérico e consciente do projeto. Use quando o usuário quiser revisar um diff, branch, PR, working tree ou conjunto de arquivos antes de mesclar ou continuar.',
  skillCompatibility: 'Requer acesso aos arquivos do projeto. Git é recomendado para revisar diffs e branches.',
  opsxDescription: 'Revisa diffs, branches, PRs ou arquivos usando contexto do projeto',
  instructions: `Realize um code review rigoroso, genérico e consciente do projeto. Seu objetivo é encontrar problemas reais antes do merge — não validar superficialmente, não comentar estilo, não elogiar.

**Entrada**: Opcionalmente especifique o alvo após \`/opsx:code-review\`: branch, PR, diff, working tree, staged changes, caminho de arquivo ou descrição de escopo. Se omitido, descubra o alvo com segurança.

**Postura**

- Você está revisando, não implementando. Não edite arquivos a menos que o usuário peça explicitamente para corrigir.
- Aja como um revisor sênior cético: assuma que existe um bug até o código provar o contrário, e fundamente cada finding com evidência concreta no código.
- Priorize nesta ordem: correção/regressões → segurança/privacidade → perda ou corrupção de dados → quebra de contrato/compatibilidade → concorrência → comportamento cross-platform → testes ausentes → performance → manutenibilidade.
- Estilo e preferência pessoal só viram finding se tiverem impacto concreto (ex.: legibilidade que esconde um bug, violação de um padrão real do projeto).
- Findings primeiro, com evidência. Resumo depois.
- Calibre a profundidade ao tamanho do diff; em diffs grandes, revise por blocos e priorize as áreas de maior risco.
- Sinalize incerteza explicitamente. Nunca invente número de linha, nome de símbolo ou comportamento que você não verificou.

**Passos**

1. **Determine o alvo da review**

   Use o argumento do usuário quando existir. Caso contrário, descubra com segurança:
   - Confirme se há Git: \`git rev-parse --is-inside-work-tree\`.
   - Inspecione o estado local: \`git status --short\`, \`git diff\` (unstaged) e \`git diff --staged\`.
   - Para revisar um branch contra a base: identifique a base provável (ex.: \`git merge-base HEAD origin/main\`) e use \`git diff <base>...HEAD\`.
   - Para um PR, prefira \`gh pr diff <numero>\` quando o \`gh\` estiver disponível.
   - Se não houver Git, peça arquivos ou escopo explícitos ao usuário.
   - Se o alvo continuar ambíguo, pergunte ao usuário o que revisar.

   Não assuma review do repositório inteiro sem confirmação. Leia o diff completo (com contexto de linha) antes de julgar.

2. **Entenda a intenção antes de criticar**

   Antes de procurar defeitos, articule o que a mudança tenta fazer e por quê (a partir do título do PR/branch, mensagens de commit, artifacts OpenSpec ou do próprio diff). Um bom review compara o que o código faz com o que deveria fazer; sem a intenção, você só consegue revisar sintaxe.

3. **Colete contexto do projeto**

   Leia apenas os arquivos relevantes, priorizando:
   - \`README.md\`, \`README_*.md\` e docs de contribuição
   - \`AGENTS.md\`, instruções de agentes e skills existentes do projeto
   - \`openspec/config.yaml\` e docs de arquitetura/ADRs quando existirem
   - specs vivas em \`openspec/specs/\` quando relacionadas ao alvo
   - testes vizinhos ao código alterado (para entender o contrato esperado)
   - manifests e configs de stack (\`package.json\`, lockfiles, \`tsconfig.json\`, configs de lint/test/build, CI etc.)

   Aplique as instruções encontradas. Em caso de conflito, prefira a orientação mais específica do repositório.

4. **Entenda a stack e os comandos de verificação**

   Infira linguagem, framework, package manager e comandos úteis a partir dos arquivos locais.

   Exemplos:
   - Node/TypeScript: scripts de \`package.json\`, lockfile e \`tsconfig.json\`
   - Python: \`pyproject.toml\`, \`requirements*.txt\`, configs de pytest/ruff/mypy
   - Go/Rust: \`go.mod\`, \`Cargo.toml\` e scripts de CI

5. **Inclua contexto OpenSpec quando existir**

   Se houver uma change relacionada:
   - Execute \`openspec status --change "<nome>" --json\` e leia apenas os caminhos em \`artifactPaths\` (ou \`contextFiles\` via \`openspec instructions apply\`)
   - Não assuma \`proposal.md\`, \`design.md\`, \`tasks.md\` ou delta specs fixos
   - Verifique se o diff preserva a intenção dos artifacts
   - Não transforme esta review em \`/opsx:verify\`; use os artifacts apenas como contexto adicional para revisar o código.

6. **Revise o código em profundidade**

   Método para cada mudança: leia além do diff (o código ao redor, chamadores e implementações chamadas), rastreie de onde vêm os dados e para onde vão, e teste mentalmente entradas adversárias (vazio, nulo, zero, negativo, muito grande, unicode, concorrente). Não confie no nome de uma função — confirme o que ela faz.

   Procure, por categoria:
   - **Correção e lógica**: regressões, edge cases e limites (off-by-one), condições invertidas ou incompletas, \`switch\` sem \`break\`/default, retorno/await faltando, suposições falsas sobre a entrada.
   - **Dados e estado**: mutação de estado compartilhado, ordem de operações, idempotência, transações e atomicidade, invalidação de cache, lifecycle e limpeza de recursos.
   - **Concorrência**: race conditions, \`await\`/lock faltando, reentrância, deadlock, escrita concorrente.
   - **Segurança e privacidade**: injeção (SQL/command/path/template), validação e sanitização de entrada não confiável, authn/authz, segredos hardcoded, dados sensíveis vazando em logs/erros, deserialização insegura, SSRF/path traversal.
   - **Erros e resiliência**: erros engolidos, mensagens que vazam dados, ausência de rollback, retries/timeouts, recursos não liberados em caminho de erro.
   - **Contratos e compatibilidade**: mudança em API pública, assinatura, schema ou formato persistido; migrações reversíveis; compatibilidade retroativa e versionamento.
   - **Cross-platform**: separador de caminho, case sensitivity, line endings, shell e encoding quando filesystem/processo estiverem envolvidos.
   - **Performance**: N+1, complexidade quadrática, I/O ou alocação dentro de loop — reporte apenas quando o impacto for plausível.
   - **Testes**: cenários novos/quebráveis cobertos, testes negativos e de borda, testes frágeis ou que não exercitam de fato o código.
   - **Dependências**: nova dependência justificada, versão e licença sãs, risco de supply chain.
   - **Consistência com o projeto**: aderência a padrões, convenções e decisões reais do repositório (incluindo, quando aplicável, mensagens centralizadas/i18n em vez de texto hardcoded).

7. **Valide quando for seguro**

   Rode verificações focadas e proporcionais (typecheck, lint, testes do escopo afetado) quando forem seguras. Não rode comandos destrutivos, dependentes de serviços externos ou desproporcionalmente caros sem explicar/confirmar. Reporte o que rodou e o que pulou (e por quê).

8. **Sugira contexto durável do projeto**

   Se o projeto não tiver orientação durável suficiente para reviews (nenhum \`AGENTS.md\`, skill do projeto, docs de contribuição ou contexto em \`openspec/config.yaml\`):
   - Sugira criar ou enriquecer uma skill/contexto do projeto para futuras reviews, indicando um local concreto (ex.: \`AGENTS.md\` ou uma skill do projeto) e os pontos que ela deveria registrar (padrões, comandos de validação, armadilhas).
   - Explique brevemente o benefício.
   - Peça confirmação antes de escrever qualquer arquivo.

**Formato de Saída**

Se houver findings, comece por eles, ordenados por severidade. Para cada finding:

\`\`\`text
Findings
- [CRITICAL] caminho/arquivo.ext:123 — Título curto e específico
  Evidência: o que no código causa o problema (cite o trecho/símbolo)
  Impacto: o que quebra na prática e sob qual condição
  Correção: ação concreta e mínima
  Confiança: alta | média | baixa (se < alta, diga a suposição)
\`\`\`

Depois inclua, de forma breve:
- alvo revisado
- contexto/instruções considerados
- validações executadas
- validações não executadas e por quê
- risco residual ou perguntas abertas

Se não houver findings, diga claramente que nenhum problema foi encontrado e ainda informe as validações não executadas.

**Regras de Severidade**

- **CRITICAL**: bug provável, perda/corrupção de dados, falha de segurança, quebra de contrato, build/test claramente quebrado.
- **WARNING**: risco real mas dependente de condição, cobertura ausente para comportamento importante, inconsistência que pode virar regressão.
- **SUGGESTION**: melhoria útil, baixa urgência, refino de manutenção.

**Guardrails**

- Não altere arquivos durante uma review pura.
- Todo finding precisa de evidência concreta; sem evidência, não reporte.
- Não reporte o que linter/typecheck/formatter já pegam automaticamente — foque no que essas ferramentas não veem.
- Não duplique o mesmo finding; agrupe ocorrências do mesmo problema.
- Prefira poucos findings fortes a muitos comentários especulativos.
- Não encha a saída com elogios genéricos.
- Use referências no formato \`arquivo:linha\`; quando não houver linha exata, cite o menor escopo verificável.
- Se a informação for incerta, diga o que verificou e qual suposição está fazendo — e marque a confiança.`,
};

// ═══════════════════════════════════════════════════════════
// Telemetry (src/telemetry/index.ts)
// ═══════════════════════════════════════════════════════════

export const TELEMETRY_MESSAGES = {
  firstRunNotice: "Aviso: o BR-OpenSpec coleta estatísticas de uso anônimas. Para optar por não participar, defina OPENSPEC_TELEMETRY=0 ou execute 'openspec config set telemetry.enabled false'",
};

// ═══════════════════════════════════════════════════════════
// Parser — Change Parser (src/core/parsers/change-parser.ts)
// ═══════════════════════════════════════════════════════════

export const CHANGE_PARSER_MESSAGES = {
  mustHaveWhySection: 'A alteração deve ter uma seção Why',
  mustHaveWhatChangesSection: 'A alteração deve ter uma seção What Changes',
  addRequirement: (text: string) => `Adicionar requisito: ${text}`,
  modifyRequirement: (text: string) => `Modificar requisito: ${text}`,
  removeRequirement: (text: string) => `Remover requisito: ${text}`,
  renameRequirement: (from: string, to: string) => `Renomear requisito de "${from}" para "${to}"`,
};

// ═══════════════════════════════════════════════════════════
// Core — Parsers (src/core/parsers/spec-structure.ts)
// ═══════════════════════════════════════════════════════════

export const SPEC_STRUCTURE_MESSAGES = {
  deltaHeader: (header: string) =>
    `O spec principal contém o cabeçalho de delta "${header}". ` +
    'Cabeçalhos de delta só são válidos dentro de openspec/changes/<name>/specs/<capability-path>/spec.md ' +
    'e truncam a seção ## Requirements analisada.',
  requirementOutsideRequirements: (header: string) =>
    `O cabeçalho de requisito "${header}" aparece fora da seção principal ## Requirements. ` +
    'Specs principais só analisam requisitos dentro dessa seção, então este requisito está atualmente invisível para validate, list e archive.',
  duplicateRequirement: (header: string, previousLine: number) =>
    `O cabeçalho de requisito "${header}" duplica o requisito declarado na linha ${previousLine}. ` +
    'Nomes de requisito devem ser únicos para que atualizações de spec não descartem um bloco ao atualizar outro.',
};

// ═══════════════════════════════════════════════════════════
// Core — Specs Apply (src/core/specs-apply.ts)
// ═══════════════════════════════════════════════════════════

/**
 * Metades do Purpose placeholder que o `openspec archive` grava no spec
 * principal que cria quando o delta introduziu a capability sem um
 * `## Purpose` utilizável. O nome da alteração vai entre as duas. Mantidas aqui
 * (única definição) e re-exportadas por `src/core/validation/constants.ts`,
 * para que o validador reconheça o placeholder pela mesma definição que o
 * produz: uma segunda grafia copiada à mão deixaria de casar no dia em que o
 * texto mudasse, e um check que não casa nada parece um check que não achou
 * nada. Alterar este texto exige atualizar o marcador de abertura em
 * `src/core/validation/purpose-placeholder.ts` (`A definir`).
 */
const SKELETON_PURPOSE_PREFIX = 'A definir - criado ao arquivar alteração ';
const SKELETON_PURPOSE_SUFFIX = '. Atualize o Purpose após o arquivamento.';

export const SPECS_APPLY_MESSAGES = {
  duplicateInSection: (specName: string, section: string, reqName: string) =>
    `${specName} validação falhou - requisito duplicado em ${section} para cabeçalho "### Requirement: ${reqName}"`,
  duplicateFromInRenamed: (specName: string, reqName: string) =>
    `${specName} validação falhou - FROM duplicado em RENAMED para cabeçalho "### Requirement: ${reqName}"`,
  duplicateToInRenamed: (specName: string, reqName: string) =>
    `${specName} validação falhou - TO duplicado em RENAMED para cabeçalho "### Requirement: ${reqName}"`,
  renamedModifiedMustReferenceNew: (specName: string, toName: string) =>
    `${specName} validação falhou - quando existe um rename, MODIFIED deve referenciar o NOVO cabeçalho "### Requirement: ${toName}"`,
  renamedToCollidesWithAdded: (specName: string, toName: string) =>
    `${specName} validação falhou - cabeçalho RENAMED TO colide com ADDED para "### Requirement: ${toName}"`,
  requirementInMultipleSections: (specName: string, sectionA: string, sectionB: string, reqName: string) =>
    `${specName} validação falhou - requisito presente em múltiplas seções (${sectionA} e ${sectionB}) para cabeçalho "### Requirement: ${reqName}"`,
  noDeltaOperations: (capability: string) =>
    `Análise de delta não encontrou operações para ${capability}. Forneça seções ADDED/MODIFIED/REMOVED/RENAMED no spec da change.`,
  targetSpecNotExists: (specName: string) =>
    `${specName}: spec alvo não existe; somente requisitos ADDED são permitidos para specs novos. Operações MODIFIED e RENAMED requerem um spec existente.`,
  targetSpecStructurallyInvalid: (specName: string, details: string) =>
    `${specName}: spec alvo é estruturalmente inválido e não pode ser atualizado até ser corrigido:\n${details}`,
  renamedFailedSourceNotFound: (specName: string, reqName: string) =>
    `${specName} RENAMED falhou para cabeçalho "### Requirement: ${reqName}" - origem não encontrada`,
  renamedFailedSourceNotFoundNearMiss: (specName: string, reqName: string, nearMissName: string) =>
    `${specName} RENAMED falhou para cabeçalho "### Requirement: ${reqName}" - origem não encontrada, mas "### Requirement: ${nearMissName}" existe; corrija o cabeçalho para corresponder exatamente`,
  renamedFailedTargetExists: (specName: string, reqName: string) =>
    `${specName} RENAMED falhou para cabeçalho "### Requirement: ${reqName}" - destino já existe`,
  modifiedFailedNotFound: (specName: string, reqName: string) =>
    `${specName} MODIFIED falhou para cabeçalho "### Requirement: ${reqName}" - não encontrado`,
  modifiedFailedHeaderMismatch: (specName: string, reqName: string) =>
    `${specName} MODIFIED falhou para cabeçalho "### Requirement: ${reqName}" - incompatibilidade de cabeçalho no conteúdo`,
  modifiedFailedMissingScenarios: (specName: string, reqName: string, scenarioNames: string[]) =>
    `${specName} MODIFIED falhou para cabeçalho "### Requirement: ${reqName}" - o spec atual contém cenário(s) ausentes no bloco modificado: ${scenarioNames.map(name => `"${name}"`).join(', ')}. Atualize o spec da change antes de arquivar para evitar perder cenários.`,
  addedFailedAlreadyExists: (specName: string, reqName: string) =>
    `${specName} ADDED falhou para cabeçalho "### Requirement: ${reqName}" - já existe`,
  applyingChangesTo: (specPath: string) => `Aplicando alterações em openspec/specs/${specPath}/spec.md:`,
  countAdded: (n: number) => `  + ${n} adicionado(s)`,
  countModified: (n: number) => `  ~ ${n} modificado(s)`,
  countRemoved: (n: number) => `  - ${n} removido(s)`,
  countRenamed: (n: number) => `  → ${n} renomeado(s)`,
  skeletonPurposePrefix: SKELETON_PURPOSE_PREFIX,
  skeletonPurposeSuffix: SKELETON_PURPOSE_SUFFIX,
  skeletonPurpose: (changeName: string) =>
    `${SKELETON_PURPOSE_PREFIX}${changeName}${SKELETON_PURPOSE_SUFFIX}`,
  warning: (message: string) => `⚠️  Aviso: ${message}`,
  deltaPurposeIgnoredExisting: (specName: string, targetPath: string) =>
    `${specName} - Purpose do delta ignorado; ${specName} já possui um. Edite ${targetPath} diretamente para alterá-lo.`,
  deltaPurposeIgnoredUnreadable: (specName: string) =>
    `${specName} - Purpose do delta ignorado (deixaria o novo spec ilegível); o Purpose placeholder foi escrito em seu lugar.`,
  carriedPurposeTooBrief: (specName: string, minLength: number) =>
    `${specName} - Purpose carregado tem menos de ${minLength} caracteres; openspec validate --strict o reporta como muito breve.`,
  removedRequirementsIgnoredNewSpec: (specName: string, count: number) =>
    `${specName} - ${count} requisito(s) REMOVED ignorado(s) para nova spec (nada a remover).`,
  removedAlreadySynced: (specName: string, reqName: string) =>
    `${specName} - requisito REMOVED "${reqName}" não está no spec atual; tratando como já removido.`,
  absorbedNoteGoesWithRequirement: (specName: string, heading: string, reqName: string) =>
    `${specName} - "${heading}" está dentro do requisito "${reqName}" e vai com ele. Mova-o para sob seu próprio requisito, ou para acima de \`## Requirements\`, para mantê-lo.`,
  removedFailedNotFoundNearMiss: (specName: string, reqName: string, nearMissName: string) =>
    `${specName} REMOVED falhou para cabeçalho "### Requirement: ${reqName}" - não encontrado, mas "### Requirement: ${nearMissName}" existe; corrija o cabeçalho para corresponder exatamente`,
  renamedRemovedConflict: (specName: string, fromName: string, removedSpelling?: string) =>
    `${specName} validação falhou - requisito presente em múltiplas seções (RENAMED e REMOVED) para cabeçalho "### Requirement: ${fromName}"` +
    (removedSpelling !== undefined ? ` (REMOVED o escreve como "${removedSpelling}")` : ''),
  // Aposentadoria de capability (retireSpec, #1302): exclusão do spec.md
  // principal quando o delta removeu o último requisito.
  deferredRetirementRequiresVerification: 'A aposentadoria adiada requer verificação do arquivo deslocado.',
  retireCouldNotVerifyBeforeDeletion: (id: string, target: string, error: string) =>
    `Não foi possível aposentar a capability '${id}': não foi possível verificar ${target} antes da exclusão (${error}).`,
  retireCouldNotVerifyInside: (id: string, target: string, dir: string, error: string) =>
    `Não foi possível aposentar a capability '${id}': não foi possível verificar que ${target} está dentro de ${dir} (${error}).`,
  retireResolvesOutside: (id: string, target: string, dir: string) =>
    `Não foi possível aposentar a capability '${id}': ${target} resolve fora de ${dir}. Remova o arquivo externo manualmente, ou substitua o link simbólico e execute novamente.`,
  concurrentFileAppearedWhileRetiring: (target: string) =>
    `Um arquivo concorrente apareceu em ${target} enquanto o arquivamento o aposentava.`,
  concurrentFileOccupiesTargetRetained: (error: string, target: string, displaced: string) =>
    `${error} Um arquivo concorrente agora ocupa ${target}; o spec deslocado foi mantido em ${displaced}.`,
  retireFailedToDelete: (id: string, target: string, error: string) =>
    `Não foi possível aposentar a capability '${id}': falha ao excluir ${target} (${error}). Remova-o manualmente e execute o arquivamento novamente.`,
  retiringSpec: (nominalPath: string) => `Aposentando ${nominalPath}: todos os requisitos removidos.`,
};

// ═══════════════════════════════════════════════════════════
// Core — Project Config (src/core/project-config.ts)
// ═══════════════════════════════════════════════════════════

export const PROJECT_CONFIG_SUGGEST_MESSAGES = {
  configNotValidYaml: 'openspec/config.yaml não é um objeto YAML válido',
  configFailedToParse: 'Falha ao analisar openspec/config.yaml:',
  unknownArtifactId: (artifactId: string, validIds: string) =>
    `ID de artefato desconhecido nas regras: "${artifactId}". Não corresponde a nenhum artefato em nenhum schema disponível. IDs de artefato conhecidos: ${validIds}`,
  schemaNotFound: (schemaName: string) => `Schema '${schemaName}' não encontrado em openspec/config.yaml\n\n`,
  didYouMean: 'Você quis dizer algum destes?\n',
  schemaType: (isBuiltIn: boolean) => isBuiltIn ? 'nativo' : 'local do projeto',
  availableSchemas: 'Schemas disponíveis:\n',
  builtInSchemas: (schemas: string) => `  Nativos: ${schemas}\n`,
  projectLocalSchemas: (schemas: string) => `  Locais do projeto: ${schemas}\n`,
  noProjectLocalSchemas: '  Locais do projeto: (nenhum encontrado)\n',
  fixSuggestion: (invalidName: string) => `\nCorreção: Edite openspec/config.yaml e altere 'schema: ${invalidName}' para um nome de schema válido`,
};

// ═══════════════════════════════════════════════════════════
// Core — Shared / skill-paths (src/core/shared/skill-paths.ts)
// ═══════════════════════════════════════════════════════════

export const SKILL_PATHS_MESSAGES = {
  toolDoesNotSupportSkills: (toolValue: string) => `A ferramenta '${toolValue}' não suporta geração de skills.`,
};

// ═══════════════════════════════════════════════════════════
// Core — Tools Manager (src/core/tools-manager.ts)
// ═══════════════════════════════════════════════════════════

export const TOOLS_MANAGER_MESSAGES = {
  toolDoesNotSupportSkills: (toolValue: string) => `A ferramenta '${toolValue}' não suporta geração de skills.`,
};

// ═══════════════════════════════════════════════════════════
// Core — Artifact Graph (src/core/artifact-graph/)
// ═══════════════════════════════════════════════════════════

export const ARTIFACT_GRAPH_MESSAGES = {
  invalidSchema: (errors: string) => `Schema inválido: ${errors}`,
  duplicateArtifactId: (id: string) => `ID de artefato duplicado: ${id}`,
  invalidDependencyReference: (artifactId: string, ref: string) =>
    `Referência de dependência inválida no artefato '${artifactId}': '${ref}' não existe`,
  cyclicDependency: (cycle: string) => `Dependência cíclica detectada: ${cycle}`,
  templateNotFound: (path: string) => `Template não encontrado: ${path}`,
  failedToReadTemplate: (error: string) => `Falha ao ler template: ${error}`,
  linkedDirectoryCycle: (currentDir: string) =>
    `Não é possível resolver as saídas do artefato por um ciclo de diretórios vinculados (links): ${currentDir}`,
  // Mensagens Zod de schema.yaml: o nome técnico do campo (generates, template,
  // apply.tracks) fica como está para casar com o YAML do usuário.
  fieldRequired: (field: string) => `O campo ${field} é obrigatório`,
  fieldMustBeRelativePath: (field: string) => `O campo ${field} deve ser um caminho relativo dentro do diretório permitido`,
  artifactNotFound: (artifactId: string, schemaName: string) =>
    `Artefato '${artifactId}' não encontrado no schema '${schemaName}'`,
  // Aviso anexado às instruções de um artefato ignorado via skip_specs.
  // Também vai no payload JSON, para que agentes dirigindo a CLI com --json
  // vejam o mesmo sinal de não-criar da saída de texto.
  skipSpecsInstructionsWarning:
    'Esta alteração declara skip_specs: true em .openspec.yaml (sem mudanças de comportamento no nível de spec), então este artefato está ignorado.\n' +
    'Não crie arquivos de spec - eles conflitam com esse marcador. Se os requisitos agora mudam, remova skip_specs do .openspec.yaml e execute este comando novamente.',
};

// ═══════════════════════════════════════════════════════════
// Utils — Change Metadata (src/utils/change-metadata.ts)
// ═══════════════════════════════════════════════════════════

export const CHANGE_METADATA_MESSAGES = {
  failedToWriteMetadata: (error: string) => `Falha ao escrever metadados: ${error}`,
  failedToReadMetadata: (error: string) => `Falha ao ler metadados: ${error}`,
  invalidMetadata: (error: string) => `Metadados inválidos: ${error}`,
  invalidYaml: (error: string) => `YAML inválido no arquivo de metadados: ${error}`,
  unknownSchema: (schema: string, available: string) =>
    `Schema desconhecido '${schema}'. Disponíveis: ${available}`,
  // Razões pelas quais os marcadores booleanos skip_specs/retire_capabilities
  // não podem ser honrados (readBooleanMarker); embutidas na mensagem de
  // validação correspondente e nas dicas do archive. Caracteres de controle
  // são substituídos na fonte (unhonorable), pois cada razão cita algo que o
  // autor escreveu.
  markerMetadataUnreadable: (error: string) => `o arquivo de metadados não pode ser lido (${error})`,
  markerNotValidYaml: 'o arquivo não é um YAML válido',
  markerUnknownSchema: (schema: string) => `schema: esquema desconhecido '${schema}'`,
};

// ═══════════════════════════════════════════════════════════
// Utils — Change Utils (src/utils/change-utils.ts)
// ═══════════════════════════════════════════════════════════

export const CHANGE_UTILS_MESSAGES = {
  changeAlreadyExists: (name: string, dir: string) => `A alteração '${name}' já existe em ${dir}`,
  nameEmpty: 'O nome da alteração não pode estar vazio',
  nameTooLong: 'O nome da alteração é muito longo (máximo de 200 caracteres)',
  nameMustBeLowercase: 'O nome da alteração deve ser minúsculo (use kebab-case)',
  nameNoSpaces: 'O nome da alteração não pode conter espaços (use hífens)',
  nameNoUnderscores: 'O nome da alteração não pode conter underscores (use hífens)',
  nameNoStartHyphen: 'O nome da alteração não pode começar com hífen',
  nameNoEndHyphen: 'O nome da alteração não pode terminar com hífen',
  nameNoConsecutiveHyphens: 'O nome da alteração não pode conter hífens consecutivos',
  nameOnlyAllowedChars: 'O nome da alteração pode conter apenas letras minúsculas, números e hífens',
  nameKebabCase: 'O nome da alteração deve seguir a convenção kebab-case (ex: add-auth, refactor-db)',
};

// ═══════════════════════════════════════════════════════════
// Core — Identificadores (src/core/id.ts)
// ═══════════════════════════════════════════════════════════

export const ID_MESSAGES = {
  mustNotBeEmpty: (label: string) => `${label} não pode estar vazio`,
  mustNotBe: (label: string, value: string) => `${label} não pode ser '${value}'`,
  mustNotContainPathSeparators: (label: string) => `${label} não pode conter separadores de caminho`,
  // Rótulo passado a folderStyleNameProblem pelo archive.
  changeNameLabel: 'O nome da alteração',
};

// ═══════════════════════════════════════════════════════════
// Core — Completions Factory (src/core/completions/factory.ts)
// ═══════════════════════════════════════════════════════════

export const COMPLETIONS_FACTORY_MESSAGES = {
  unsupportedShell: (shell: string) => `Shell não suportado: ${shell}`,
};

// ═══════════════════════════════════════════════════════════
// Core — Adaptadores de comando (src/core/command-generation/adapters/*)
// ═══════════════════════════════════════════════════════════

export const COMMAND_ADAPTER_MESSAGES = {
  // Linha injetada no corpo do comando gerado logo após `**Entrada**:` para
  // ferramentas que só substituem argumentos onde há um placeholder explícito
  // (Command Code, Pi, OpenCode). O placeholder é literal da ferramenta
  // (`$ARGUMENTS`, `$@`) e nunca é traduzido.
  providedArguments: (placeholder: string) => `**Argumentos fornecidos**: ${placeholder}`,
};

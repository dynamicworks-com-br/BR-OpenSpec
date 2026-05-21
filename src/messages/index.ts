/**
 * Catálogo centralizado de mensagens do BR-OpenSpec em Português Brasileiro.
 *
 * Este módulo reúne todas as mensagens exibidas ao usuário para facilitar
 * manutenção, revisão e consistência linguística.
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
  instructions: 'Exibe instruções enriquecidas para criar um artefato ou aplicar tarefas',
  templates: 'Mostra os caminhos dos templates resolvidos para todos os artefatos de um esquema',
  schemas: 'Lista os esquemas de fluxo de trabalho disponíveis com descrições',
  new: 'Cria novos itens',
  newChange: 'Cria um novo diretório de alteração',
  // Opções globais
  noColor: 'Desativa cores na saída',
  tools: (availableToolIds: string) => `Configura ferramentas de IA não interativamente. Use "all", "none" ou uma lista separada por vírgula: ${availableToolIds}`,
  force: 'Limpa arquivos legados automaticamente sem perguntar',
  profile: 'Sobrescreve o perfil da configuração global (core ou custom)',

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
  requirementsOnlyDeprecated: 'A flag --requirements-only está descontinuada; use --deltas-only em vez disso.',
  noItemsFound: 'Nenhum item encontrado.',
  selectChangeToValidate: 'Selecione uma alteração para validar',
  changeIsValid: (name: string) => `Alteração "${name}" é válida`,
  changeHasIssues: (name: string) => `Alteração "${name}" tem problemas`,
  nextSteps: 'Próximos passos:',
  ensureDeltasInSpecs: 'Certifique-se de que a alteração tenha deltas em specs/: use os cabeçalhos ## ADDED/MODIFIED/REMOVED/RENAMED Requirements',
  eachRequirementNeedsScenario: 'Cada requisito DEVE incluir pelo menos um bloco #### Scenario:',
  debugParsedDeltas: 'Depure os deltas analisados: openspec change show <id> --json --deltas-only',
  unableToRead: '(não foi possível ler)',
  tasks: (completed: number, total: number) => `[tarefas ${completed}/${total}]`,
  deltas: (count: number) => `[deltas ${count}]`,
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
  removedRequirementsIgnored: (specName: string, count: number) => `⚠️  Aviso: ${specName} - ${count} requisito(s) REMOVED ignorado(s) para nova spec (nada a remover).`,
};

// ═══════════════════════════════════════════════════════════
// Core — Inicializar (src/core/init.ts)
// ═══════════════════════════════════════════════════════════

export const INIT_MESSAGES = {
  welcomeTitle: 'Bem-vindo ao BR-OpenSpec',
  welcomeSubtitle: 'Um framework leve orientado a especificações',
  setupWillConfigure: 'Esta configuração irá configurar:',
  agentSkills: '  • Agent Skills para ferramentas de IA',
  slashCommands: '  • Comandos /opsx:*',
  quickStart: 'Início rápido após a configuração:',
  cmdNewChange: 'Criar uma alteração',
  cmdContinue: 'Próximo artefato',
  cmdApply: 'Implementar tarefas',
  pressEnter: 'Pressione Enter para selecionar ferramentas...',
  insufficientPermissions: (path: string) => `Permissões insuficientes para escrever em ${path}`,
  invalidProfile: (profile: string) => `Perfil inválido "${profile}". Perfis disponíveis: core, custom`,
  upgradeLegacyPrompt: 'Atualizar e limpar arquivos legados?',
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
  setupCompleteTitle: 'Configuração do BR-OpenSpec Concluída',
  created: (names: string) => `Criados: ${names}`,
  refreshed: (names: string) => `Atualizados: ${names}`,
  failed: (errors: string) => `Falhas: ${errors}`,
  commandsSkipped: (tools: string) => `Comandos ignorados para: ${tools} (sem adaptador)`,
  removedCommands: (count: number) => `Removidos: ${count} arquivos de comando (entrega: skills)`,
  removedSkills: (count: number) => `Removidos: ${count} diretórios de skill (entrega: commands)`,
  skillsAndCommandsCount: (skills: number, commands: number, dirs: string) => `${skills} skills e ${commands} commands em ${dirs}/`,
  skillsCount: (skills: number, dirs: string) => `${skills} skills em ${dirs}/`,
  commandsCount: (commands: number, dirs: string) => `${commands} commands em ${dirs}/`,
  configCreated: (schema: string) => `Config: openspec/config.yaml (schema: ${schema})`,
  configExists: (name: string) => `Config: openspec/${name} (existe)`,
  configSkipped: 'Config: ignorado (modo não interativo)',
  gettingStarted: 'Início rápido:',
  startFirstChangePropose: (cmd: string) => `Inicie sua primeira alteração: ${cmd}`,
  startFirstChangeNew: (cmd: string) => `Inicie sua primeira alteração: ${cmd}`,
  configureWorkflowsHint: "Execute 'openspec config profile' para configurar seus fluxos de trabalho.",
  learnMore: (url: string) => `Saiba mais: ${url}`,
  feedback: (url: string) => `Feedback:   ${url}`,
  restartIDE: 'Reinicie sua IDE para que os comandos de barra tenham efeito.',
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
  updateFailed: '`openspec update` falhou. Execute-o manualmente para aplicar as alterações do perfil.',
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
};

// ═══════════════════════════════════════════════════════════
// Comandos — Completions (src/commands/completion.ts)
// ═══════════════════════════════════════════════════════════

export const COMPLETION_MESSAGES = {
  removeConfigConfirm: (path: string) => `Remover a configuração do BR-OpenSpec de ${path}?`,
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
  feedbackTitle: (message: string) => `Feedback: ${message}`,
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
  welcomeSubtitle: 'Um framework leve orientado a especificações',
  setupWillConfigure: 'Esta configuração irá configurar:',
  agentSkills: '  • Agent Skills para ferramentas de IA',
  slashCommands: '  • Comandos /opsx:*',
  quickStart: 'Início rápido após a configuração:',
  cmdNewChange: 'Criar uma alteração',
  cmdContinue: 'Próximo artefato',
  cmdApply: 'Implementar tarefas',
  pressEnter: 'Pressione Enter para selecionar ferramentas...',
};

// ═══════════════════════════════════════════════════════════
// Prompts — Seleção múltipla com busca (src/prompts/searchable-multi-select.ts)
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
  forceUpdating: (count: number, tools: string) => `Forçando atualização de ${count} ferramenta(s): ${tools}`,
  updatingTool: (name: string) => `Atualizando ${name}...`,
  updatedTool: (name: string) => `Atualizado ${name}`,
  failedToUpdate: (name: string) => `Falha ao atualizar ${name}`,
  updated: (tools: string, version: string) => `✓ Atualizados: ${tools} (v${version})`,
  failed: (errors: string) => `✗ Falhas: ${errors}`,
  removedCommands: (count: number) => `Removidos: ${count} arquivos de comando (entrega: skills)`,
  removedSkills: (count: number) => `Removidos: ${count} diretórios de skill (entrega: commands)`,
  removedDeselectedCommands: (count: number) => `Removidos: ${count} arquivos de comando (fluxos de trabalho desselecionados)`,
  removedDeselectedSkills: (count: number) => `Removidos: ${count} diretórios de skill (fluxos de trabalho desselecionados)`,
  gettingStarted: 'Início rápido:',
  cmdNew: '  /opsx:new       Iniciar uma nova alteração',
  cmdContinue: '  /opsx:continue  Criar o próximo artefato',
  cmdApply: '  /opsx:apply     Implementar tarefas',
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
  cleaningLegacy: 'Limpando arquivos legados...',
  legacyCleaned: 'Arquivos legados limpos',
  forceLegacyHint: '⚠ Execute com --force para limpar automaticamente arquivos legados, ou execute de forma interativa.',
  upgradeLegacyPrompt: 'Atualizar e limpar arquivos legados?',
  skippingLegacyCleanup: 'Ignorando limpeza de legados. Continuando com a atualização de skills...',
  toolsDetectedFromLegacy: 'Ferramentas detectadas de artefatos legados:',
  setupSkillsFor: (tools: string) => `Configurando skills para: ${tools}`,
  selectToolsNewSkillSystem: 'Selecione as ferramentas para configurar com o novo sistema de skills:',
  skippingToolSetup: 'Ignorando configuração de ferramentas.',
  settingUp: (name: string) => `Configurando ${name}...`,
  setupComplete: (name: string) => `Configuração concluída para ${name}`,
  failedToSetup: (name: string) => `Falha ao configurar ${name}`,
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
};

// ═══════════════════════════════════════════════════════════
// Core — Validação (src/core/validation/validator.ts)
// ═══════════════════════════════════════════════════════════

export const VALIDATOR_MESSAGES = {
  unknownError: 'Erro desconhecido',
  duplicateRequirementAdded: (name: string) => `Requisito duplicado em ADDED: "${name}"`,
  missingRequirementTextAdded: (name: string) => `ADDED "${name}" está sem texto de requisito`,
  missingShallOrMustAdded: (name: string) => `ADDED "${name}" deve conter SHALL ou MUST`,
  missingScenarioAdded: (name: string) => `ADDED "${name}" deve incluir pelo menos um cenário`,
  duplicateRequirementModified: (name: string) => `Requisito duplicado em MODIFIED: "${name}"`,
  missingRequirementTextModified: (name: string) => `MODIFIED "${name}" está sem texto de requisito`,
  missingShallOrMustModified: (name: string) => `MODIFIED "${name}" deve conter SHALL ou MUST`,
  missingScenarioModified: (name: string) => `MODIFIED "${name}" deve incluir pelo menos um cenário`,
  duplicateRequirementRemoved: (name: string) => `Requisito duplicado em REMOVED: "${name}"`,
  duplicateFromRenamed: (name: string) => `FROM duplicado em RENAMED: "${name}"`,
  duplicateToRenamed: (name: string) => `TO duplicado em RENAMED: "${name}"`,
  requirementInModifiedAndRemoved: (name: string) => `Requisito presente em MODIFIED e REMOVED: "${name}"`,
  requirementInModifiedAndAdded: (name: string) => `Requisito presente em MODIFIED e ADDED: "${name}"`,
  requirementInAddedAndRemoved: (name: string) => `Requisito presente em ADDED e REMOVED: "${name}"`,
  modifiedReferencesOldRenamed: (to: string) => `MODIFIED referencia nome antigo de RENAMED. Use o novo cabeçalho para "${to}"`,
  renamedToCollidesAdded: (to: string) => `RENAMED TO colide com ADDED para "${to}"`,
  deltaSectionsEmpty: (sections: string) => `Seções de delta ${sections} foram encontradas, mas nenhuma entrada de requisito foi analisada. Certifique-se de que cada seção inclua pelo menos um bloco "### Requirement:" (REMOVED pode usar sintaxe de lista com marcadores).`,
  noDeltaSectionsFound: 'Nenhuma seção de delta encontrada. Adicione cabeçalhos como "## ADDED Requirements" ou mova notas que não sejam deltas para fora de specs/.',
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
  missingDependencies: (deps: string) => `Pendentes: ${deps}`,
  createArtifactTask: (artifactId: string, changeName: string) => `Crie o artefato ${artifactId} para a alteração "${changeName}".`,
  readFilesForContext: 'Leia estes arquivos para contexto antes de criar este artefato:',
  writeTo: (filePath: string) => `Escreva em: ${filePath}`,
  unlocksArtifacts: (artifacts: string) => `Completar este artefato habilita: ${artifacts}`,
  generatingApplyInstructions: 'Gerando instruções de aplicação...',
  cannotApplyMissingArtifacts: (artifacts: string) => `Não é possível aplicar esta alteração ainda. Artefatos ausentes: ${artifacts}.\nUse a skill openspec-continue-change para criar os artefatos ausentes primeiro.`,
  missingTrackingFile: (filename: string) => `O arquivo ${filename} está ausente e deve ser criado.\nUse openspec-continue-change para gerar o arquivo de rastreamento.`,
  trackingFileNoTasks: (filename: string) => `O arquivo ${filename} existe mas não contém tarefas.\nAdicione tarefas a ${filename} ou regenere-o com openspec-continue-change.`,
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
  allArtifactsComplete: 'Todos os artefatos concluídos!',
  blockedBy: (deps: string) => ` (bloqueado por: ${deps})`,
  // templates.ts
  loadingTemplates: 'Carregando templates...',
  schemaLabel3: (name: string) => `Esquema: ${name}`,
  sourceLabel: (source: string) => `Fonte: ${source}`,
};


// ═══════════════════════════════════════════════════════════
// Core — Migração (src/core/migration.ts)
// ═══════════════════════════════════════════════════════════

export const MIGRATION_MESSAGES = {
  migrated: (count: number) => `Migrado: perfil customizado com ${count} fluxos de trabalho`,
  newInThisVersion: "Novo nesta versão: /opsx:propose. Experimente 'openspec config profile core' para a experiência simplificada.",
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
  removedDir: (dir: string) => `  ✓ Removido ${dir}/ (substituído por /opsx:*)`,
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

   Use a ferramenta **AskUserQuestion** (aberta, sem opções pré-definidas) para perguntar:
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

   Use a ferramenta **AskUserQuestion** (aberta, sem opções pré-definidas) para perguntar:
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

Antes de começar, verifique se o CLI do BR-OpenSpec está instalado:

\`\`\`bash
# Unix/macOS
openspec --version 2>&1 || echo "CLI_NOT_INSTALLED"
# Windows (PowerShell)
# if (Get-Command openspec -ErrorAction SilentlyContinue) { openspec --version } else { echo "CLI_NOT_INSTALLED" }
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

\`\`\`
Aqui está um rascunho de proposal:

---

## Por Que

[1-2 frases explicando o problema/oportunidade]

## O Que Muda

[Bullet points do que será diferente]

## Capabilities

### Novas Capabilities
- \`<nome-capability>\`: [breve descrição]

### Capabilities Modificadas
<!-- Se modificar comportamento existente -->

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
mkdir -p openspec/changes/<nome>/specs/<nome-capability>
# Windows (PowerShell)
# New-Item -ItemType Directory -Force -Path "openspec/changes/<nome>/specs/<nome-capability>"
\`\`\`

Elabore o conteúdo do spec:

\`\`\`
Aqui está o spec:

---

## Requisitos ADICIONADOS

### Requisito: <Nome>

<Descrição do que o sistema deve fazer>

#### Cenário: <Nome do cenário>

- **QUANDO** <condição de gatilho>
- **ENTÃO** <resultado esperado>
- **E** <resultado adicional se necessário>

---

Este formato - QUANDO/ENTÃO/E - torna os requisitos testáveis. Você pode literalmente lê-los como casos de teste.
\`\`\`

Salve em \`openspec/changes/<nome>/specs/<capability>/spec.md\`.

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

- [ ] 1.1 [Tarefa específica]
- [ ] 1.2 [Tarefa específica]

## 2. Verificar

- [ ] 2.1 [Etapa de verificação]

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

**FAÇA:**
\`\`\`bash
openspec archive "<nome>"
\`\`\`

**MOSTRE:**
\`\`\`
Arquivado em: \`openspec/changes/archive/YYYY-MM-DD-<nome>/\`

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

**Comandos adicionais:**

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
- \`/opsx:continue <nome>\` - Retoma a criação de artifacts
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

**Comandos adicionais:**

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

1. **Se nenhum nome de change for fornecido, solicite a seleção**

   Execute \`openspec list --json\` para obter as changes disponíveis. Use a ferramenta **AskUserQuestion** para permitir que o usuário selecione.

   Mostre as changes que possuem tarefas de implementação (o artifact tasks existe).
   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   **IMPORTANTE**: NÃO adivinhe ou selecione automaticamente uma change. Sempre deixe o usuário escolher.

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
   - Se delta specs existirem em \`openspec/changes/<nome>/specs/\`:
     - Extraia todos os requisitos (marcados com "### Requirement:")
     - Para cada requisito:
       - Procure no codebase por palavras-chave relacionadas ao requisito
       - Avalie se a implementação provavelmente existe
     - Se requisitos parecerem não implementados:
       - Adicione issue CRITICAL: "Requirement not found: <nome do requisito>"
       - Recomendação: "Implement requirement X: <descrição>"

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

1. **Se nenhum nome de change for fornecido, solicite a seleção**

   Execute \`openspec list --json\` para obter as changes disponíveis. Use a ferramenta **AskUserQuestion** para permitir que o usuário selecione.

   Mostre as changes que possuem tarefas de implementação (o artifact tasks existe).
   Inclua o schema usado para cada change, se disponível.
   Marque as changes com tarefas incompletas como "(Em Progresso)".

   **IMPORTANTE**: NÃO adivinhe ou selecione automaticamente uma change. Sempre deixe o usuário escolher.

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
   - Se delta specs existirem em \`openspec/changes/<nome>/specs/\`:
     - Extraia todos os requisitos (marcados com "### Requirement:")
     - Para cada requisito:
       - Procure no codebase por palavras-chave relacionadas ao requisito
       - Avalie se a implementação provavelmente existe
     - Se requisitos parecerem não implementados:
       - Adicione issue CRITICAL: "Requirement not found: <nome do requisito>"
       - Recomendação: "Implement requirement X: <descrição>"

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
// Telemetry (src/telemetry/index.ts)
// ═══════════════════════════════════════════════════════════

export const TELEMETRY_MESSAGES = {
  firstRunNotice: 'Aviso: o BR-OpenSpec coleta estatísticas de uso anônimas. Para optar por não participar, defina OPENSPEC_TELEMETRY=0',
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
// Core — Specs Apply (src/core/specs-apply.ts)
// ═══════════════════════════════════════════════════════════

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
  renamedFailedTargetExists: (specName: string, reqName: string) =>
    `${specName} RENAMED falhou para cabeçalho "### Requirement: ${reqName}" - destino já existe`,
  removedFailedNotFound: (specName: string, reqName: string) =>
    `${specName} REMOVED falhou para cabeçalho "### Requirement: ${reqName}" - não encontrado`,
  modifiedFailedNotFound: (specName: string, reqName: string) =>
    `${specName} MODIFIED falhou para cabeçalho "### Requirement: ${reqName}" - não encontrado`,
  modifiedFailedHeaderMismatch: (specName: string, reqName: string) =>
    `${specName} MODIFIED falhou para cabeçalho "### Requirement: ${reqName}" - incompatibilidade de cabeçalho no conteúdo`,
  addedFailedAlreadyExists: (specName: string, reqName: string) =>
    `${specName} ADDED falhou para cabeçalho "### Requirement: ${reqName}" - já existe`,
  applyingChangesTo: (specPath: string) => `Aplicando alterações em openspec/specs/${specPath}/spec.md:`,
  wouldApplyChangesTo: (specPath: string) => `Aplicaria alterações em openspec/specs/${specPath}/spec.md:`,
  countAdded: (n: number) => `  + ${n} adicionado(s)`,
  countModified: (n: number) => `  ~ ${n} modificado(s)`,
  countRemoved: (n: number) => `  - ${n} removido(s)`,
  countRenamed: (n: number) => `  → ${n} renomeado(s)`,
  skeletonPurpose: (changeName: string) => `A definir - criado ao arquivar alteração ${changeName}. Atualize o Purpose após o arquivamento.`,
  changeNotFound: (changeName: string) => `Alteração '${changeName}' não encontrada.`,
  validationErrorsInRebuiltSpec: (specName: string, errors: string) =>
    `Erros de validação na especificação reconstruída para ${specName}:\n${errors}`,
};

// ═══════════════════════════════════════════════════════════
// Core — Project Config (src/core/project-config.ts)
// ═══════════════════════════════════════════════════════════

export const PROJECT_CONFIG_SUGGEST_MESSAGES = {
  configNotValidYaml: 'openspec/config.yaml não é um objeto YAML válido',
  configFailedToParse: 'Falha ao analisar openspec/config.yaml:',
  unknownArtifactId: (artifactId: string, schemaName: string, validIds: string) =>
    `ID de artefato desconhecido nas regras: "${artifactId}". IDs válidos para o schema "${schemaName}": ${validIds}`,
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
  artifactNotFound: (artifactId: string, schemaName: string) =>
    `Artefato '${artifactId}' não encontrado no schema '${schemaName}'`,
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
};

// ═══════════════════════════════════════════════════════════
// Utils — Change Utils (src/utils/change-utils.ts)
// ═══════════════════════════════════════════════════════════

export const CHANGE_UTILS_MESSAGES = {
  changeAlreadyExists: (name: string, dir: string) => `A alteração '${name}' já existe em ${dir}`,
  nameEmpty: 'O nome da alteração não pode estar vazio',
  nameMustBeLowercase: 'O nome da alteração deve ser minúsculo (use kebab-case)',
  nameNoSpaces: 'O nome da alteração não pode conter espaços (use hífens)',
  nameNoUnderscores: 'O nome da alteração não pode conter underscores (use hífens)',
  nameNoStartHyphen: 'O nome da alteração não pode começar com hífen',
  nameNoEndHyphen: 'O nome da alteração não pode terminar com hífen',
  nameNoConsecutiveHyphens: 'O nome da alteração não pode conter hífens consecutivos',
  nameOnlyAllowedChars: 'O nome da alteração pode conter apenas letras minúsculas, números e hífens',
  nameMustStartWithLetter: 'O nome da alteração deve começar com uma letra',
  nameKebabCase: 'O nome da alteração deve seguir a convenção kebab-case (ex: add-auth, refactor-db)',
};

// ═══════════════════════════════════════════════════════════
// Core — Completions Factory (src/core/completions/factory.ts)
// ═══════════════════════════════════════════════════════════

export const COMPLETIONS_FACTORY_MESSAGES = {
  unsupportedShell: (shell: string) => `Shell não suportado: ${shell}`,
};

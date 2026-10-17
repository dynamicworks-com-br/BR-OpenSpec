# ai-tool-paths Specification

## Purpose
Define AI tool path metadata used to generate OpenSpec skills and commands in tool-specific directories.

## Requirements
### Requirement: AIToolOption skillsDir field

The `AIToolOption` interface SHALL include an optional `skillsDir` field for skill generation path configuration.

#### Scenario: Interface includes skillsDir field

- **WHEN** a tool entry is defined in `AI_TOOLS` that supports skill generation
- **THEN** it SHALL include a `skillsDir` field specifying the project-local base directory (e.g., `.claude`)

#### Scenario: Skills path follows Agent Skills spec

- **WHEN** generating skills for a tool with `skillsDir: '.claude'`
- **THEN** skills SHALL be written to `<projectRoot>/<skillsDir>/skills/`
- **AND** the `/skills` suffix is appended per Agent Skills specification

### Requirement: Path configuration for supported tools

The `AI_TOOLS` array SHALL include `skillsDir` for tools that support the Agent Skills specification.

#### Scenario: Claude Code paths defined

- **WHEN** looking up the `claude` tool
- **THEN** `skillsDir` SHALL be `.claude`

#### Scenario: Cursor paths defined

- **WHEN** looking up the `cursor` tool
- **THEN** `skillsDir` SHALL be `.cursor`

#### Scenario: Devin Desktop paths defined

- **WHEN** looking up the `devin` tool
- **THEN** `skillsDir` SHALL be `.devin`

#### Scenario: Legacy Windsurf tool ID

- **WHEN** initializing with `openspec init --tools windsurf`
- **THEN** the `windsurf` alias SHALL resolve to `devin`
- **AND** when skill delivery is enabled, skills SHALL be generated under `.devin/skills/`, not `.windsurf/skills/`

#### Scenario: Kimi Code paths defined

- **WHEN** looking up the `kimi` tool
- **THEN** `skillsDir` SHALL be `.kimi-code`
- **AND** OpenSpec-managed skills remaining under the legacy `.kimi/skills` directory SHALL be migrated to `.kimi-code/skills` during init and update, preserving user files

#### Scenario: Hermes Agent paths defined

- **WHEN** a ferramenta `hermes` é consultada
- **THEN** `skillsDir` SHALL ser `.hermes`
- **AND** `setupNote` SHALL explicar que o diretório `.hermes/skills` do projeto precisa ser adicionado a `skills.external_dirs` em `~/.hermes/config.yaml`
- **AND** `openspec init` e `openspec update` SHALL exibir a nota sempre que `hermes` estiver configurado

#### Scenario: DeepSeek Harness paths defined

- **WHEN** a ferramenta `dsh` é consultada
- **THEN** `skillsDir` SHALL ser `.dsh`
- **AND** a detecção automática SHALL exigir que `.dsh` seja um diretório
- **AND** o BR-OpenSpec SHALL gravar as skills do dsh em `<projectRoot>/.dsh/skills/` usando junção de caminhos nativa da plataforma

#### Scenario: Grok Build paths defined

- **WHEN** a ferramenta `grok` é consultada
- **THEN** `skillsDir` SHALL ser `.grok`

#### Scenario: Warp paths and detection defined

- **WHEN** a ferramenta `warp` é consultada
- **THEN** `skillsDir` SHALL ser `.warp`
- **AND** `detectionPaths` SHALL incluir `.warp` e `WARP.md`

#### Scenario: Warp invokes skills without command files

- **WHEN** os fluxos da ferramenta `warp` são gerados com a entrega definida como `commands`
- **THEN** as skills SHALL permanecer instaladas em `.warp/skills/`
- **AND** nenhum adaptador de comando e nenhum arquivo de comando SHALL ser exigidos
- **AND** cada skill SHALL ser invocável diretamente pelo nome `/openspec-*`


#### Scenario: Tools without skillsDir

- **WHEN** a tool has no `skillsDir` defined
- **THEN** skill generation SHALL error with message indicating the tool is not supported

### Requirement: Cross-platform path handling

The system SHALL handle paths correctly across operating systems.

#### Scenario: Path construction on Windows

- **WHEN** constructing skill paths on Windows
- **THEN** the system SHALL use `path.join()` for all path construction
- **AND** SHALL NOT hardcode forward slashes

#### Scenario: Path construction on Unix

- **WHEN** constructing skill paths on macOS or Linux
- **THEN** the system SHALL use `path.join()` for consistency


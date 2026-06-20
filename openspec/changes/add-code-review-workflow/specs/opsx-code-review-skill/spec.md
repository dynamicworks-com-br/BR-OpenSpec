## ADDED Requirements

### Requirement: Code Review Workflow Invocation
The system SHALL provide an `/opsx:code-review` workflow that performs project-aware code review against a user-selected target.

#### Scenario: Review target provided by user
- **WHEN** the user invokes `/opsx:code-review` with a branch, diff, pull request reference, file path, or explicit scope
- **THEN** the agent reviews that target
- **AND** the agent states the target it reviewed in the final report

#### Scenario: Review target omitted
- **WHEN** the user invokes `/opsx:code-review` without a target
- **THEN** the agent inspects local Git state to identify staged changes, unstaged changes, or the current branch diff
- **AND** if the target remains ambiguous, asks the user which target to review

#### Scenario: Repository has no Git metadata
- **WHEN** the workflow runs in a directory without Git metadata
- **THEN** the agent asks the user for explicit files or scope
- **AND** does not assume a full-repository review unless the user confirms it

### Requirement: Project Context Discovery
The code-review workflow SHALL collect project-specific review guidance before analyzing code.

#### Scenario: Standard guidance files exist
- **WHEN** files such as `README.md`, `AGENTS.md`, `openspec/config.yaml`, docs, CI workflows, package manifests, or language config files exist
- **THEN** the agent reads the relevant files before producing findings
- **AND** applies instructions from those files to the review

#### Scenario: OpenSpec change appears related
- **WHEN** an OpenSpec change is named by the user or can be confidently linked to the reviewed diff
- **THEN** the agent reads that change's proposal, design, specs, and tasks when available
- **AND** uses them as additional review context

#### Scenario: No durable project guidance found
- **WHEN** the agent cannot find project-specific review guidance
- **THEN** it suggests creating or enriching a project skill/context file for future reviews
- **AND** asks before writing any new guidance file

### Requirement: Stack-Aware Review Preparation
The code-review workflow SHALL infer the project's stack and validation commands from local files.

#### Scenario: Package and config files are present
- **WHEN** files such as `package.json`, lockfiles, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or CI definitions are present
- **THEN** the agent identifies relevant languages, frameworks, package managers, and validation commands
- **AND** reports which checks it ran or intentionally skipped

#### Scenario: Validation command is unsafe or expensive
- **WHEN** a validation command may be destructive, external-service dependent, or disproportionately expensive
- **THEN** the agent does not run it automatically
- **AND** explains the reason in the review report

### Requirement: Review Findings Format
The code-review workflow SHALL produce a findings-first report focused on actionable risks.

#### Scenario: Findings discovered
- **WHEN** the review finds issues
- **THEN** the report lists findings before any summary
- **AND** orders findings by severity
- **AND** includes file and line references where applicable
- **AND** explains the concrete risk and recommended fix

#### Scenario: No findings discovered
- **WHEN** the review finds no issues
- **THEN** the report clearly states that no issues were found
- **AND** notes any tests or validation that were not run

#### Scenario: Review priorities
- **WHEN** analyzing code
- **THEN** the agent prioritizes correctness bugs, regressions, security/privacy risks, data loss, cross-platform behavior, and missing tests over style preferences
- **AND** avoids vague recommendations that cannot be acted on

### Requirement: Non-Mutating Default Behavior
The code-review workflow SHALL not modify project files during review unless the user explicitly asks for changes.

#### Scenario: User asks only for review
- **WHEN** the user invokes `/opsx:code-review` without asking for fixes
- **THEN** the agent does not edit code
- **AND** limits output to review findings, validation notes, and recommended next steps

#### Scenario: User asks to fix findings
- **WHEN** the user explicitly asks the agent to implement fixes after or during review
- **THEN** the agent may make code changes
- **AND** follows normal project implementation and validation rules

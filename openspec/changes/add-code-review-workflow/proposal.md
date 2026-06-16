## Why

BR-OpenSpec already provides `/opsx:verify` for checking an implementation against a specific change's artifacts, but users also need a broader code-review workflow that works on a working tree, staged diff, branch, pull request, or explicit file set.

Today that review step is left to each agent's generic behavior. This means project instructions may be missed, stack-specific validation may be guessed, and reviews can focus on style instead of concrete correctness risks.

Adding a generated code-review workflow gives every supported tool a consistent, project-aware review posture while keeping it generic enough for brownfield projects that may not have an OpenSpec change for every diff.

## What Changes

- Add a `code-review` workflow to the available workflow catalog.
- Generate an `openspec-code-review` skill and `/opsx:code-review` command for selected tools.
- Define review instructions that:
  - identify the review target from user arguments, Git state, or explicit files;
  - read project guidance such as `README.md`, `AGENTS.md`, OpenSpec config, docs, CI, and package/config files;
  - infer stack and validation commands from local files;
  - optionally use related OpenSpec change artifacts when present;
  - suggest creating or enriching a project-specific skill/context file when no durable guidance exists;
  - report findings first, prioritized by severity with file/line references.
- Update workflow selection metadata, detection lists, docs, specs, and tests to include the new workflow.

## Capabilities

### New Capabilities

- `opsx-code-review-skill`: Project-aware generic code review workflow for changed code, branches, PRs, or explicit files.

### Modified Capabilities

- `profiles`: Adds `code-review` to selectable custom workflows.
- `command-generation`: Generates matching skill and command artifacts for the new workflow.
- `cli-config`: Shows the new workflow in profile selection.
- `ai-tool-paths`: Documents the new generated skill and command ID.

## Impact

- `src/core/templates/workflows/code-review.ts` - new workflow template.
- `src/messages/index.ts` - pt-BR template text and workflow labels.
- `src/core/profiles.ts` - add workflow ID.
- `src/core/shared/skill-generation.ts` and `src/core/shared/tool-detection.ts` - register skill/command.
- `src/core/profile-sync-drift.ts` and `src/core/tools-manager.ts` - explicit workflow-to-skill mapping.
- `src/core/templates/skill-templates.ts` - export template helpers.
- `src/commands/config.ts` - workflow selection metadata.
- `docs/` and `openspec/specs/` - document generated artifact counts/lists.
- `test/` - update workflow catalog and generation tests.

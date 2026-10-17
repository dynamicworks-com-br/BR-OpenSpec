# Contributing

Thanks for helping improve BR-OpenSpec (`@dynamicworks/br-openspec`).

The user-facing CLI is Brazilian Portuguese. Strings that a person reads in the terminal live in `src/messages/index.ts`. Spec and change structure stays in English: `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`, and the RFC 2119 / Gherkin keywords (`MUST`, `SHALL`, `WHEN`, `THEN`, and the rest). See [AGENTS.md](AGENTS.md#reserved-english-terms-never-translate).

## 1. Open a discussion or an issue first

Every change starts here, including small ones.

- [Start a discussion](https://github.com/dynamicworks-com-br/BR-OpenSpec/discussions) if it affects BR-OpenSpec's core design.
- [Open an issue](https://github.com/dynamicworks-com-br/BR-OpenSpec/issues) for bugs and everything else.

This is so we can agree on the approach before you spend time building. PRs without a linked issue or a prior discussion may be closed.

## 2. Decide whether it needs a change proposal

A bug fix, a typo, or a small improvement goes straight to a PR.

A new feature, a significant refactor, or anything that changes BR-OpenSpec's architecture needs a BR-OpenSpec change proposal first, so we can align on intent and goals before implementation begins. Open it as a PR containing only `openspec/changes/<name>/` and wait for it to be approved before you write the code.

When writing a proposal, keep the BR-OpenSpec philosophy in mind: we serve a wide variety of users across different coding agents, models, and use cases. Changes should work well for everyone.

If you are not sure which side of the line your change falls on, ask in the discussion or issue from step 1.

## 3. Make your change

You need Node.js 20.19 or newer and pnpm 9.

```bash
pnpm install
pnpm build              # tests run against the build output
pnpm test
pnpm exec tsc --noEmit
pnpm lint
```

Those four commands are what CI runs, so a green local run means a green CI run.

Run `pnpm changeset` if your change affects users, and commit the file it generates.

### Keep the CLI's startup fast

Editors and agents run the CLI many times, and each call pays for every module it loads before the command runs. A command loads only the command definitions and its own code:

- **Definitions** (name, options, help text) go in `src/cli/index.ts` or `src/cli/commands/<name>.ts`. Import nothing heavy there: no zod, yaml, tinyglobby, ora, and no other command's code.
- **The command's code** goes in `src/commands/<name>.ts` or `src/core/`, loaded inside the action with `await import()`.

When `test/cli-e2e/startup-modules.test.ts` is present, it checks which modules each command loads and fails if a definition starts pulling in an implementation. When you add a command, add it to that test's list.

## 4. Open the PR

- Branch off `main` in your fork of [dynamicworks-com-br/BR-OpenSpec](https://github.com/dynamicworks-com-br/BR-OpenSpec).
- Title it as a conventional commit: `type(scope): subject`, for example `fix(archive): keep authored Purpose`.
- Link what you opened in step 1: `Closes #123` for an issue, or a link to the discussion when there is no issue.
- If a coding agent wrote the code, say which agent and model, and confirm you tested it. AI-generated code is welcome when it has been verified.

Maintainers are listed in [MAINTAINERS.md](MAINTAINERS.md).

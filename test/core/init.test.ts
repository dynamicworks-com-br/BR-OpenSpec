import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../src/core/init.js';
import { saveGlobalConfig, getGlobalConfig } from '../../src/core/global-config.js';

const { confirmMock, showWelcomeScreenMock, searchableMultiSelectMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
  searchableMultiSelectMock: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
}));

vi.mock('../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

vi.mock('../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: searchableMultiSelectMock,
}));

describe('InitCommand', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-init-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid reading real config
    configTempDir = path.join(os.tmpdir(), `openspec-config-init-${randomUUID()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;

    // Mock console.log to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('execute with --tools flag', () => {
    it('should create OpenSpec directory structure', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const openspecPath = path.join(testDir, 'openspec');
      expect(await directoryExists(openspecPath)).toBe(true);
      expect(await directoryExists(path.join(openspecPath, 'specs'))).toBe(true);
      expect(await directoryExists(path.join(openspecPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(openspecPath, 'changes', 'archive'))).toBe(true);
    });

    it('should create config.yaml with default schema', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, 'openspec', 'config.yaml');
      expect(await fileExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('schema: spec-driven');
    });

    it('should create core profile skills for Claude Code by default', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Core profile: propose, explore, apply, update, sync, archive
      const coreSkillNames = [
        'openspec-propose',
        'openspec-explore',
        'openspec-apply-change',
        'openspec-update-change',
        'openspec-sync-specs',
        'openspec-archive-change',
      ];

      for (const skillName of coreSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(true);

        const content = await fs.readFile(skillFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }

      // Non-core skills should NOT be created
      const nonCoreSkillNames = [
        'openspec-new-change',
        'openspec-continue-change',
        'openspec-ff-change',
        'openspec-bulk-archive-change',
        'openspec-verify-change',
        'openspec-code-review',
      ];

      for (const skillName of nonCoreSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(false);
      }
    });

    it('should create core profile commands for Claude Code by default', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Core profile: propose, explore, apply, sync, archive
      const coreCommandNames = [
        'opsx/propose.md',
        'opsx/explore.md',
        'opsx/apply.md',
        'opsx/sync.md',
        'opsx/archive.md',
      ];

      for (const cmdName of coreCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(true);
      }

      // Non-core commands should NOT be created
      const nonCoreCommandNames = [
        'opsx/new.md',
        'opsx/continue.md',
        'opsx/ff.md',
        'opsx/bulk-archive.md',
        'opsx/verify.md',
        'opsx/code-review.md',
      ];

      for (const cmdName of nonCoreCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(false);
      }
    });

    it('should not write generated artifacts through a linked tool directory outside the project', async () => {
      const outsideDir = path.join(configTempDir, 'outside-claude');
      await fs.mkdir(outsideDir, { recursive: true });
      await fs.symlink(
        outsideDir,
        path.join(testDir, '.claude'),
        process.platform === 'win32' ? 'junction' : 'dir'
      );

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(testDir)).rejects.toThrow(
        'A configuração do BR-OpenSpec falhou para: Claude Code'
      );

      expect(await fs.readdir(outsideDir)).toEqual([]);
      expect((await fs.lstat(path.join(testDir, '.claude'))).isSymbolicLink()).toBe(true);
      expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain(
        'Configuração do BR-OpenSpec Incompleta'
      );
    });

    it.skipIf(process.platform === 'win32')('should not overwrite a generated artifact symlink outside the project', async () => {
      const outsideFile = path.join(configTempDir, 'outside-skill.md');
      const originalContent = 'keep me\n';
      await fs.writeFile(outsideFile, originalContent);
      const skillFile = path.join(
        testDir,
        '.claude',
        'skills',
        'openspec-propose',
        'SKILL.md'
      );
      await fs.mkdir(path.dirname(skillFile), { recursive: true });
      await fs.symlink(outsideFile, skillFile, 'file');

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(testDir)).rejects.toThrow(
        'A configuração do BR-OpenSpec falhou para: Claude Code'
      );

      expect(await fs.readFile(outsideFile, 'utf-8')).toBe(originalContent);
      expect((await fs.lstat(skillFile)).isSymbolicLink()).toBe(true);
    });

    it('should create skills in Cursor skills directory', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.cursor', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should route the retired windsurf id to Devin Desktop', async () => {
      // Windsurf was rebranded to Devin Desktop; `--tools windsurf` still
      // resolves so an existing setup script keeps working, but it configures
      // the current tool and writes the current directory.
      const initCommand = new InitCommand({ tools: 'windsurf', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.devin', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
      expect(
        await fileExists(path.join(testDir, '.windsurf', 'skills', 'openspec-explore', 'SKILL.md'))
      ).toBe(false);
    });

    it('should support Kimi Code as an adapterless skills-only tool', async () => {
      saveGlobalConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'both',
      });

      const initCommand = new InitCommand({ tools: 'kimi', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.kimi-code', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const commandsDir = path.join(testDir, '.kimi-code', 'commands');
      expect(await directoryExists(commandsDir)).toBe(false);

      const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
      expect(
        logCalls.some(
          (entry) => entry.includes('Comandos ignorados para: kimi') && entry.includes('(sem adaptador)'),
        ),
      ).toBe(true);
    });

    it('should support the shared agents target as an adapterless skills-only tool', async () => {
      saveGlobalConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'both',
      });

      const initCommand = new InitCommand({ tools: 'agents', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.agents', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const commandsDir = path.join(testDir, '.agents', 'commands');
      expect(await directoryExists(commandsDir)).toBe(false);

      const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
      expect(
        logCalls.some(
          (entry) => entry.includes('Comandos ignorados para: agents') && entry.includes('(sem adaptador)'),
        ),
      ).toBe(true);
    });

    it('should migrate OpenSpec skills from legacy .kimi to .kimi-code during init', async () => {
      const legacySkillDir = path.join(testDir, '.kimi', 'skills', 'openspec-explore');
      await fs.mkdir(legacySkillDir, { recursive: true });
      await fs.writeFile(
        path.join(legacySkillDir, 'SKILL.md'),
        `---\nname: openspec-explore\nmetadata:\n  author: openspec\n  version: "0.9"\n---\n\nOld instructions content\n`
      );
      await fs.writeFile(path.join(testDir, '.kimi', 'config.toml'), 'user config');

      const initCommand = new InitCommand({ tools: 'kimi', force: true });
      await initCommand.execute(testDir);

      // Regenerated in the new location, legacy managed skill removed
      const newSkill = path.join(testDir, '.kimi-code', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(newSkill)).toBe(true);
      expect(await directoryExists(legacySkillDir)).toBe(false);

      // User files under .kimi are preserved
      expect(await fileExists(path.join(testDir, '.kimi', 'config.toml'))).toBe(true);
    });

    it('should create skills for multiple tools at once', async () => {
      const initCommand = new InitCommand({ tools: 'claude,cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'openspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should select all tools with --tools all option', async () => {
      const initCommand = new InitCommand({ tools: 'all', force: true });

      await initCommand.execute(testDir);

      // Check a few representative tools
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'openspec-explore', 'SKILL.md');
      const devinSkill = path.join(testDir, '.devin', 'skills', 'openspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
      expect(await fileExists(devinSkill)).toBe(true);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const initCommand = new InitCommand({ tools: 'none', force: true });

      await initCommand.execute(testDir);

      // Should create OpenSpec structure but no skills
      const openspecPath = path.join(testDir, 'openspec');
      expect(await directoryExists(openspecPath)).toBe(true);

      // No tool-specific directories should be created
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      expect(await directoryExists(claudeSkillsDir)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const initCommand = new InitCommand({ tools: 'invalid-tool', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Ferramenta\(s\) inválida\(s\): invalid-tool/);
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const initCommand = new InitCommand({ tools: 'claude, cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'openspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const initCommand = new InitCommand({ tools: 'all,claude', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(
        /Não é possível combinar valores reservados "all" ou "none" com IDs de ferramentas específicos/
      );
    });

    it('should not create config.yaml if it already exists', async () => {
      // Pre-create config.yaml
      const openspecDir = path.join(testDir, 'openspec');
      await fs.mkdir(openspecDir, { recursive: true });
      const configPath = path.join(openspecDir, 'config.yaml');
      const existingContent = 'schema: custom-schema\n';
      await fs.writeFile(configPath, existingContent);

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toBe(existingContent);
    });

    it('should handle non-existent target directory', async () => {
      const newDir = path.join(testDir, 'new-project');
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(newDir);

      const openspecPath = path.join(newDir, 'openspec');
      expect(await directoryExists(openspecPath)).toBe(true);
    });

    it('should work in extend mode (re-running init)', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      // Run init again with a different tool
      const initCommand2 = new InitCommand({ tools: 'cursor', force: true });
      await initCommand2.execute(testDir);

      // Both tools should have skills
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'openspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should refresh skills on re-run for the same tool', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const originalContent = await fs.readFile(skillFile, 'utf-8');

      // Modify the file
      await fs.writeFile(skillFile, '# Modified content\n');

      // Run init again
      const initCommand2 = new InitCommand({ tools: 'claude', force: true });
      await initCommand2.execute(testDir);

      const newContent = await fs.readFile(skillFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });

  describe('skill content validation', () => {
    it('should generate valid SKILL.md with YAML frontmatter', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should have YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: openspec-explore');
      expect(content).toContain('description:');
      expect(content).toContain('license:');
      expect(content).toContain('compatibility:');
      expect(content).toContain('metadata:');
      expect(content).toMatch(/---\n\n/); // End of frontmatter
    });

    it('should include explore mode instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('Entre no modo explore');
      expect(content).toContain('parceiro de pensamento');
    });

    it('should include propose skill instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('name: openspec-propose');
    });

    it('should include apply-change skill instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('name: openspec-apply-change');
    });

    it('should embed generatedBy version in skill files', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should contain generatedBy field with a version string
      expect(content).toMatch(/generatedBy:\s*["']?\d+\.\d+\.\d+["']?/);
    });
  });

  describe('command generation', () => {
    it('should generate Claude Code commands with correct format', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
      const content = await fs.readFile(cmdFile, 'utf-8');

      // Claude commands use YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name:');
      expect(content).toContain('description:');
    });

    it('should generate Cursor commands with correct format', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.cursor', 'commands', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toMatch(/^---\n/);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for insufficient permissions', async () => {
      // Mock the permission check to fail
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      const originalWriteFile = fs.writeFile;
      vi.spyOn(fs, 'writeFile').mockImplementation(
        async (filePath: any, ...args: any[]) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('.openspec-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile.call(fs, filePath, ...args);
        }
      );

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(/Permissões insuficientes/);
    });

    it('should throw error in non-interactive mode without --tools flag and no detected tools', async () => {
      const initCommand = new InitCommand({ interactive: false });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Nenhuma ferramenta detectada e nenhuma flag --tools/);
    });
  });

  describe('tool-specific adapters', () => {
    it('should generate Gemini CLI commands as TOML files', async () => {
      const initCommand = new InitCommand({ tools: 'gemini', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.gemini', 'commands', 'opsx', 'explore.toml');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toContain('description =');
      expect(content).toContain('prompt =');
    });

    it('should generate Devin workflows for the retired windsurf id', async () => {
      const initCommand = new InitCommand({ tools: 'windsurf', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.devin', 'workflows', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });

    it('should generate Devin Desktop workflows that reference the hyphen form Devin registers', async () => {
      const initCommand = new InitCommand({ tools: 'devin', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.devin', 'workflows', 'opsx-apply.md');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toMatch(/^---\nname: "/);
      expect(content).toContain('category: "Workflow"');
      // Devin discovers `.devin/workflows/opsx-apply.md` as `/opsx-apply`.
      expect(content).toContain('/opsx-');
      expect(content).not.toContain('/opsx:');
    });

    it('should generate Devin Desktop skills that reference skills, not workflows', async () => {
      const initCommand = new InitCommand({ tools: 'devin', force: true });
      await initCommand.execute(testDir);

      // The Devin Local agent has no workflows, so skill bodies must point at
      // `/openspec-*` skills, which both Devin agents accept.
      const skillFile = path.join(testDir, '.devin', 'skills', 'openspec-apply-change', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const content = await fs.readFile(skillFile, 'utf-8');
      expect(content).toContain('/openspec-apply-change');
      expect(content).not.toContain('/opsx:');
      expect(content).not.toContain('/opsx-');
    });

    it('should generate Continue prompt files', async () => {
      const initCommand = new InitCommand({ tools: 'continue', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.continue', 'prompts', 'opsx-explore.prompt');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toContain('name: "opsx-explore"');
      expect(content).toContain('invokable: true');
    });

    it('should generate Cline workflow files', async () => {
      const initCommand = new InitCommand({ tools: 'cline', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.clinerules', 'workflows', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });

    it('should generate GitHub Copilot prompt files', async () => {
      const initCommand = new InitCommand({ tools: 'github-copilot', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.github', 'prompts', 'opsx-explore.prompt.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });
  });
});

describe('InitCommand - profile and detection features', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-init-profile-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid polluting real config
    configTempDir = path.join(os.tmpdir(), `openspec-config-test-${randomUUID()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should use --profile flag to override global config', async () => {
    // Set global config to custom profile
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new', 'apply'],
    });

    // Override with --profile core
    const initCommand = new InitCommand({ tools: 'claude', force: true, profile: 'core' });
    await initCommand.execute(testDir);

    // Core profile skills should be created
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(true);

    // Non-core skills (from the custom profile) should NOT be created
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'openspec-new-change', 'SKILL.md');
    expect(await fileExists(newChangeSkill)).toBe(false);
  });

  it('should reject invalid --profile values', async () => {
    const initCommand = new InitCommand({
      tools: 'claude',
      force: true,
      profile: 'invalid-profile',
    });

    await expect(initCommand.execute(testDir)).rejects.toThrow(
      /Perfil inválido "invalid-profile"/
    );
  });

  it('should use detected tools in non-interactive mode when no --tools flag', async () => {
    // Create a .claude directory to simulate detected tool
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

    const initCommand = new InitCommand({ interactive: false, force: true });
    await initCommand.execute(testDir);

    // Should have used claude (detected)
    const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });

  it('should auto-cleanup legacy artifacts in non-interactive mode without --force', async () => {
    // Create legacy OpenCode command files (singular 'command' path)
    const legacyDir = path.join(testDir, '.opencode', 'command');
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(path.join(legacyDir, 'opsx-propose.md'), 'legacy content');

    // Run init in non-interactive mode without --force
    const initCommand = new InitCommand({ tools: 'opencode' });
    await initCommand.execute(testDir);

    // Legacy files should be cleaned up automatically
    expect(await fileExists(path.join(legacyDir, 'opsx-propose.md'))).toBe(false);

    // New commands should be at the correct plural path
    const newCommandsDir = path.join(testDir, '.opencode', 'commands');
    expect(await directoryExists(newCommandsDir)).toBe(true);
  });

  it('should preselect configured tools but not directory-detected tools in extend mode', async () => {
    // Simulate existing OpenSpec project (extend mode).
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });

    // Configured with OpenSpec
    const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'openspec-explore');
    await fs.mkdir(claudeSkillDir, { recursive: true });
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), 'configured');

    // Directory detected only (not configured with OpenSpec)
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['claude']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean; detected?: boolean }> }];

    const claude = choices.find((choice) => choice.value === 'claude');
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(claude?.preSelected).toBe(true);
    expect(githubCopilot?.preSelected).toBe(false);
    expect(githubCopilot?.detected).toBe(true);
  });

  it('should preselect detected tools for first-time interactive setup', async () => {
    // First-time init: no openspec/ directory and no configured OpenSpec skills.
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['github-copilot']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean }> }];
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(githubCopilot?.preSelected).toBe(true);
  });

  it('should respect custom profile from global config', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Custom profile skills should be created
    const exploreSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'openspec-new-change', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(true);
    expect(await fileExists(newChangeSkill)).toBe(true);

    // Non-selected skills should NOT be created
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(false);
  });

  it('should migrate commands-only extend mode to custom profile without injecting propose', async () => {
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md'), '# explore\n');

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const config = getGlobalConfig();
    expect(config.profile).toBe('custom');
    expect(config.delivery).toBe('commands');
    expect(config.workflows).toEqual(['explore']);

    const exploreCommand = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    const proposeCommand = path.join(testDir, '.claude', 'commands', 'opsx', 'propose.md');
    expect(await fileExists(exploreCommand)).toBe(true);
    expect(await fileExists(proposeCommand)).toBe(false);

    const exploreSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'openspec-propose', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(false);
    expect(await fileExists(proposeSkill)).toBe(false);
  });

  it('should not prompt for confirmation when applying custom profile in interactive init', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);

    await initCommand.execute(testDir);

    expect(showWelcomeScreenMock).toHaveBeenCalled();
    // The welcome screen must be handed the profile's workflows, otherwise it
    // advertises commands this profile never installs.
    expect(showWelcomeScreenMock).toHaveBeenCalledWith(['explore', 'new'], { animate: true });
    expect(confirmMock).not.toHaveBeenCalled();

    const exploreSkill = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'openspec-new-change', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(true);
    expect(await fileExists(newChangeSkill)).toBe(true);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    expect(logCalls.some((entry) => entry.includes('Applying custom profile'))).toBe(false);
  });

  it('should respect delivery=skills setting (no commands)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);

    // Skill content should reference skills, not commands that were never generated
    const skillContent = await fs.readFile(skillFile, 'utf-8');
    expect(skillContent).not.toContain('/opsx:');
    expect(skillContent).not.toContain('/opsx-');
    expect(skillContent).toContain('/openspec-');

    // update-change references several other workflows; a command missing
    // from the reference map would leave a raw /opsx: reference behind
    const updateSkillContent = await fs.readFile(
      path.join(testDir, '.claude', 'skills', 'openspec-update-change', 'SKILL.md'),
      'utf-8'
    );
    expect(updateSkillContent).not.toContain('/opsx:');
    expect(updateSkillContent).not.toContain('/opsx-');
    expect(updateSkillContent).toContain('/openspec-');
  });

  it('should use skill references for adapterless tools under default delivery (#1155)', async () => {
    // Kimi Code has no command adapter: commands are skipped even when
    // delivery is 'both', so generated skills must not reference /opsx:*
    const initCommand = new InitCommand({ tools: 'kimi', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.kimi-code', 'skills', 'openspec-apply-change', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    const skillContent = await fs.readFile(skillFile, 'utf-8');
    expect(skillContent).not.toContain('/opsx:');
    expect(skillContent).not.toContain('/opsx-');
    // Kimi Code documents /skill:<name> invocations (docs/supported-tools.md)
    expect(skillContent).toContain('/skill:openspec-');

    // The getting-started hint must point at the skill, not a missing command
    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHint = logCalls.find((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHint).toContain('/skill:openspec-propose');
    expect(startHint).not.toContain('/opsx:propose');
  });

  it('should print a configuration correction, not a dead hint, when delivery=commands generates nothing (adapterless tool)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'commands',
    });

    const initCommand = new InitCommand({ tools: 'kimi', force: true });
    await initCommand.execute(testDir);

    // Kimi has no command adapter and delivery excludes skills: nothing is generated
    expect(await fileExists(path.join(testDir, '.kimi-code', 'skills', 'openspec-explore', 'SKILL.md'))).toBe(false);
    expect(await fileExists(path.join(testDir, '.kimi-code', 'commands'))).toBe(false);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    // No invocation hint may be shown — neither /opsx:* nor a skill reference exists
    expect(logCalls.some((entry) => entry.includes('Inicie sua primeira alteração'))).toBe(false);
    const correction = logCalls.find((entry) => entry.includes('Nenhuma skill nem comando foi gerado'));
    expect(correction).toBeTruthy();
    expect(correction).toContain("openspec config set delivery both");
    // Nothing was generated, so there is nothing an IDE restart would pick up
    expect(logCalls.some((entry) => entry.includes('Reinicie sua IDE'))).toBe(false);
  });

  it('should print one usable hint per invocation syntax when adapterless tools disagree', async () => {
    // kimi documents /skill:<name>, vibe documents /<name> — every advertised
    // instruction must be usable by the tool it is labeled for
    const initCommand = new InitCommand({ tools: 'kimi,vibe', force: true });
    await initCommand.execute(testDir);

    // Each tool's own skill files still use its documented syntax
    const kimiSkill = await fs.readFile(
      path.join(testDir, '.kimi-code', 'skills', 'openspec-apply-change', 'SKILL.md'),
      'utf-8'
    );
    const vibeSkill = await fs.readFile(
      path.join(testDir, '.vibe', 'skills', 'openspec-apply-change', 'SKILL.md'),
      'utf-8'
    );
    expect(kimiSkill).toContain('/skill:openspec-');
    expect(vibeSkill).toContain('/openspec-');
    expect(vibeSkill).not.toContain('/skill:');

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHints = logCalls.filter((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHints).toHaveLength(2);
    const kimiHint = startHints.find((entry) => entry.includes('Kimi Code'));
    const vibeHint = startHints.find((entry) => entry.includes('Mistral Vibe'));
    expect(kimiHint).toContain('/skill:openspec-propose');
    expect(vibeHint).toContain('/openspec-propose');
    expect(vibeHint).not.toContain('/skill:');
    for (const hint of startHints) {
      expect(hint).not.toContain('/opsx:');
    }
  });

  it('should print a per-tool correction when an adapter-backed tool masks an adapterless one (delivery=commands, claude+kimi)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'commands',
    });

    const initCommand = new InitCommand({ tools: 'claude,kimi', force: true });
    await initCommand.execute(testDir);

    // Claude gets commands; kimi (no adapter, delivery excludes skills) gets nothing
    expect(await fileExists(path.join(testDir, '.claude', 'commands', 'opsx', 'propose.md'))).toBe(true);
    expect(await fileExists(path.join(testDir, '.kimi-code'))).toBe(false);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    // The /opsx: hint is correct for Claude, but Kimi must not be left with
    // a dead instruction: the correction names it even though another tool
    // generated commands
    const startHints = logCalls.filter((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHints).toHaveLength(1);
    expect(startHints[0]).toContain('/opsx:propose');
    const correction = logCalls.find((entry) => entry.includes('Nenhuma skill nem comando foi gerado para'));
    expect(correction).toContain('Kimi Code');
    expect(correction).not.toContain('Claude');
    expect(correction).toContain("openspec config set delivery both");
    expect(logCalls.some((entry) => entry.includes('/skill:openspec-'))).toBe(false);
  });

  it('should label per-tool hints when adapter-backed and adapterless tools are mixed (claude+kimi)', async () => {
    // Claude gets /opsx:* commands; kimi only gets skills invoked as
    // /skill:openspec-*. A single unlabeled /opsx: hint would be unusable
    // for the Kimi user, so each tool gets its own labeled instruction.
    const initCommand = new InitCommand({ tools: 'claude,kimi', force: true });
    await initCommand.execute(testDir);

    expect(await fileExists(path.join(testDir, '.claude', 'commands', 'opsx', 'propose.md'))).toBe(true);
    expect(await fileExists(path.join(testDir, '.kimi-code', 'skills', 'openspec-propose', 'SKILL.md'))).toBe(true);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHints = logCalls.filter((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHints).toHaveLength(2);
    const claudeHint = startHints.find((entry) => entry.includes('Claude Code'));
    const kimiHint = startHints.find((entry) => entry.includes('Kimi Code'));
    expect(claudeHint).toContain('/opsx:propose');
    expect(kimiHint).toContain('/skill:openspec-propose');
    expect(kimiHint).not.toContain('/opsx:');
  });

  it('should keep /opsx: command hints for adapter-backed tools under default delivery', async () => {
    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-apply-change', 'SKILL.md');
    const skillContent = await fs.readFile(skillFile, 'utf-8');
    expect(skillContent).toContain('/opsx:');

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHint = logCalls.find((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHint).toContain('/opsx:propose');
  });

  it('should use skill references for opencode in skills-only delivery', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand = new InitCommand({ tools: 'opencode', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.opencode', 'skills', 'openspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Skills-only must win over the hyphen transform: no /opsx: or /opsx- references
    const skillContent = await fs.readFile(skillFile, 'utf-8');
    expect(skillContent).not.toContain('/opsx:');
    expect(skillContent).not.toContain('/opsx-');
    expect(skillContent).toContain('/openspec-');
  });

  it('should respect delivery=commands setting (no skills)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'commands',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should NOT exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(false);

    // Commands should exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(true);
  });

  it('should remove commands on re-init when delivery changes to skills', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'both',
    });

    const initCommand1 = new InitCommand({ tools: 'claude', force: true });
    await initCommand1.execute(testDir);

    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(true);

    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand2 = new InitCommand({ tools: 'claude', force: true });
    await initCommand2.execute(testDir);

    expect(await fileExists(cmdFile)).toBe(false);

    const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });

  it('should print the hyphen command hint for filename-invoked tools (claude+qwen)', async () => {
    const initCommand = new InitCommand({ tools: 'claude,qwen', force: true });
    await initCommand.execute(testDir);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHints = logCalls.filter((entry) => entry.includes('Inicie sua primeira alteração'));
    // Qwen invoca comandos pelo nome do arquivo (/opsx-propose), então não
    // pode compartilhar a linha /opsx:propose do Claude
    expect(startHints).toHaveLength(2);
    const claudeHint = startHints.find((entry) => entry.includes('Claude Code'));
    const qwenHint = startHints.find((entry) => entry.includes('Qwen Code'));
    expect(claudeHint).toContain('/opsx:propose');
    expect(qwenHint).toContain('/opsx-propose');
    expect(qwenHint).not.toContain('/opsx:propose');
  });

  it('should print the $-prefixed skill hint for codex under skills delivery', async () => {
    // Codex CLI invokes skills as $<name> — a /<name> form it does not
    // recognize — so under skills-only delivery both the generated skills and
    // the hint must use the $ form (no prompt files are written).
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand = new InitCommand({ tools: 'codex', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.codex', 'skills', 'openspec-apply-change', 'SKILL.md');
    const skillContent = await fs.readFile(skillFile, 'utf-8');
    expect(skillContent).not.toContain('/opsx:');
    expect(skillContent).toContain('$openspec-');

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHint = logCalls.find((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHint).toContain('$openspec-propose');
  });

  it('should print the @-prefixed prompt hint for amazon-q (prompt library, no slash surface)', async () => {
    // Amazon Q loads .amazonq/prompts/opsx-<id>.md into its prompt library,
    // invoked as @opsx-<id>. It registers no slash command under any spelling,
    // so neither the hint, the generated prompts, the skills, nor the restart
    // line may name one.
    const initCommand = new InitCommand({ tools: 'amazon-q', force: true });
    await initCommand.execute(testDir);

    const promptFile = path.join(testDir, '.amazonq', 'prompts', 'opsx-apply.md');
    const skillFile = path.join(testDir, '.amazonq', 'skills', 'openspec-apply-change', 'SKILL.md');
    for (const file of [promptFile, skillFile]) {
      expect(await fileExists(file)).toBe(true);
      const content = await fs.readFile(file, 'utf-8');
      expect(content).toContain('@opsx-apply');
      expect(content).not.toContain('/opsx:');
      expect(content).not.toContain('/opsx-');
    }

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHint = logCalls.find((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHint).toContain('@opsx-propose');
    expect(startHint).not.toContain('/opsx-propose');
    expect(startHint).not.toContain('/opsx:propose');

    // Commands were generated, but they are not slash commands.
    const restartHint = logCalls.find((entry) => entry.includes('Reinicie sua IDE'));
    expect(restartHint).toContain('Reinicie sua IDE para que os novos comandos tenham efeito.');
    expect(restartHint).not.toContain('comandos de barra');
  });

  it('should reference commands by the names each tool registers (cursor+claude)', async () => {
    // Cursor registers commands by filename (.cursor/commands/opsx-apply.md ->
    // /opsx-apply) while Claude namespaces them under opsx/ (-> /opsx:apply).
    // Command bodies, skills and the onboarding hint must each follow the tool
    // they are written for.
    const initCommand = new InitCommand({ tools: 'cursor,claude', force: true });
    await initCommand.execute(testDir);

    const read = (...segments: string[]) => fs.readFile(path.join(testDir, ...segments), 'utf-8');

    const cursorCommand = await read('.cursor', 'commands', 'opsx-apply.md');
    // A body cross-reference, not the frontmatter name, which already
    // carried the hyphen form before this behaviour existed.
    expect(cursorCommand).toContain('/opsx-archive');
    expect(cursorCommand).not.toContain('/opsx:');

    const cursorSkill = await read('.cursor', 'skills', 'openspec-apply-change', 'SKILL.md');
    expect(cursorSkill).not.toContain('/opsx:');

    // Claude's namespaced commands are unchanged
    const claudeCommand = await read('.claude', 'commands', 'opsx', 'apply.md');
    expect(claudeCommand).toContain('/opsx:archive');
    expect(claudeCommand).not.toContain('/opsx-');

    const claudeSkill = await read('.claude', 'skills', 'openspec-apply-change', 'SKILL.md');
    expect(claudeSkill).not.toContain('/opsx-');

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    const startHints = logCalls.filter((entry) => entry.includes('Inicie sua primeira alteração'));
    expect(startHints.find((entry) => entry.includes('Cursor'))).toContain('/opsx-propose');
    expect(startHints.find((entry) => entry.includes('Claude Code'))).toContain('/opsx:propose');
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

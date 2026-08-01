import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { getAvailableTools } from '../../src/core/available-tools.js';

describe('available-tools', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('getAvailableTools', () => {
    it('should return empty array when no tool directories exist', () => {
      const tools = getAvailableTools(testDir);
      expect(tools).toEqual([]);
    });

    it('should detect a single tool directory', async () => {
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools).toHaveLength(1);
      expect(tools[0].value).toBe('claude');
      expect(tools[0].name).toBe('Claude Code');
      expect(tools[0].skillsDir).toBe('.claude');
    });

    it('should detect multiple tool directories', async () => {
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.windsurf'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('claude');
      expect(toolValues).toContain('cursor');
      // Windsurf was rebranded to Devin Desktop, so .windsurf detects as devin
      expect(toolValues).toContain('devin');
      expect(tools).toHaveLength(3);
    });

    it('should detect Devin Desktop when .devin directory exists', async () => {
      await fs.mkdir(path.join(testDir, '.devin'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('devin');

      const devinTool = tools.find((t) => t.value === 'devin');
      expect(devinTool).toBeDefined();
      expect(devinTool?.name).toBe('Devin Desktop (formerly Windsurf)');
      expect(devinTool?.skillsDir).toBe('.devin');
    });

    it('should detect Devin Desktop from the legacy .windsurf directory', async () => {
      // The rebrand moved the config dir; a project set up before it still has
      // only .windsurf/, and that user must still be recognized.
      await fs.mkdir(path.join(testDir, '.windsurf'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools.map((t) => t.value)).toContain('devin');
      expect(tools.find((t) => t.value === 'devin')?.skillsDir).toBe('.devin');
    });

    it('should not detect Devin Desktop when neither .devin nor .windsurf exists', async () => {
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools.map((t) => t.value)).not.toContain('devin');
    });

    it('should detect kimi directory', async () => {
      await fs.mkdir(path.join(testDir, '.kimi'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('kimi');
      expect(tools).toHaveLength(1);
    });

    it('should ignore files that are not directories', async () => {
      // Create a file named .claude instead of a directory
      await fs.writeFile(path.join(testDir, '.claude'), 'not a directory');

      const tools = getAvailableTools(testDir);
      expect(tools).toEqual([]);
    });

    it('should only return tools that have a skillsDir property', async () => {
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools.map((t) => t.value)).toContain('claude');
      // The filter's contract: nothing without a skillsDir can ever be returned.
      expect(tools.filter((t) => !t.skillsDir)).toEqual([]);
    });

    it('should detect the shared agents target from .agents/skills', async () => {
      await fs.mkdir(path.join(testDir, '.agents', 'skills'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('agents');
    });

    it('should not detect the shared agents target from a bare .agents directory', async () => {
      // Frameworks use `.agents/` for more than skills (rules, subagent definitions).
      // The bare root therefore says nothing about whether this project keeps agent
      // skills in the shared location, so it must not select the target.
      await fs.mkdir(path.join(testDir, '.agents', 'some-other-framework'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools.map((t) => t.value)).not.toContain('agents');
    });

    it('should return full AIToolOption objects', async () => {
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });

      const tools = getAvailableTools(testDir);
      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        name: 'Cursor',
        value: 'cursor',
        available: true,
        skillsDir: '.cursor',
      });
    });

    it('should handle paths with spaces', async () => {
      const spacedDir = path.join(testDir, 'path with spaces');
      await fs.mkdir(spacedDir, { recursive: true });
      await fs.mkdir(path.join(spacedDir, '.claude'), { recursive: true });

      const tools = getAvailableTools(spacedDir);
      expect(tools).toHaveLength(1);
      expect(tools[0].value).toBe('claude');
    });

    it('should not detect GitHub Copilot from bare .github directory', async () => {
      // .github/ exists in virtually every GitHub repo (for workflows, issue templates, etc.)
      // A bare .github/ directory should NOT trigger Copilot detection
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).not.toContain('github-copilot');
    });

    it('should detect GitHub Copilot when copilot-instructions.md exists', async () => {
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('github-copilot');
    });

    it('should detect GitHub Copilot when .github/prompts directory exists', async () => {
      await fs.mkdir(path.join(testDir, '.github', 'prompts'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('github-copilot');
    });

    it('should detect GitHub Copilot when .github/agents directory exists', async () => {
      await fs.mkdir(path.join(testDir, '.github', 'agents'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('github-copilot');
    });

    it('should detect GitHub Copilot when .github/skills directory exists', async () => {
      await fs.mkdir(path.join(testDir, '.github', 'skills'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('github-copilot');
    });

    it('should detect GitHub Copilot when copilot-setup-steps.yml exists', async () => {
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.github', 'workflows', 'copilot-setup-steps.yml'), '');

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('github-copilot');
    });

    it('should still use skillsDir detection for tools without detectionPaths', async () => {
      // Claude Code has no detectionPaths, so .claude/ directory should still work
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('claude');
    });

    it('should detect Mistral Vibe when .vibe directory exists', async () => {
      // Mistral Vibe uses skillsDir: '.vibe' without detectionPaths
      // This test ensures path semantics do not drift for Vibe skill detection
      await fs.mkdir(path.join(testDir, '.vibe'), { recursive: true });

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('vibe');

      const vibeTool = tools.find((t) => t.value === 'vibe');
      expect(vibeTool).toBeDefined();
      expect(vibeTool?.name).toBe('Mistral Vibe');
      expect(vibeTool?.skillsDir).toBe('.vibe');
    });
  });
});

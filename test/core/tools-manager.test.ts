import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock global config so tests don't depend on real config file
const mockGlobalConfig = vi.hoisted(() => ({
  current: { profile: 'core', delivery: 'both' } as { profile: string; delivery: string },
}));

vi.mock('../../src/core/global-config.js', () => ({
  getGlobalConfig: vi.fn(() => mockGlobalConfig.current),
  saveGlobalConfig: vi.fn(),
}));

import {
  addTool,
  removeTool,
  getCurrentToolIds,
  getEligibleTools,
  resolveToolsArg,
  removeOpenSpecSkillDirs,
  removeOpenSpecCommandFiles,
} from '../../src/core/tools-manager.js';
import { AI_TOOLS } from '../../src/core/config.js';
import { SKILL_NAMES, toolSupportsSkills } from '../../src/core/shared/index.js';
import { readSharedSkillTarget } from '../../src/core/shared-skill-target.js';

// Helper utilities
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
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

describe('tools-manager', () => {
  let testDir: string;
  let configTempDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-tm-test-'));
    configTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-config-tm-'));
    process.env.XDG_CONFIG_HOME = configTempDir;
    // O alvo de skills do MiniMax Code sai do home do usuário: isolar para não
    // enxergar (nem escrever em) `~/.minimax` da máquina.
    vi.stubEnv('HOME', path.join(testDir, 'home'));
    vi.stubEnv('USERPROFILE', path.join(testDir, 'home'));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    mockGlobalConfig.current = { profile: 'core', delivery: 'both' };
    vi.unstubAllEnvs();
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addTool
  // ─────────────────────────────────────────────────────────────────────────

  describe('addTool', () => {
    it('creates skill files for claude', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      // Core profile includes 'propose', 'explore', 'apply', 'archive'
      const expectedSkillDirs = [
        'openspec-propose',
        'openspec-explore',
        'openspec-apply-change',
        'openspec-archive-change',
      ];
      for (const dirName of expectedSkillDirs) {
        const skillFile = path.join(testDir, '.claude', 'skills', dirName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(true);
      }
    });

    it('creates the skillsDir if it does not exist', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'cursor')!;
      expect(await directoryExists(path.join(testDir, '.cursor'))).toBe(false);

      await addTool(testDir, tool);

      expect(await directoryExists(path.join(testDir, '.cursor'))).toBe(true);
    });

    it('creates command files for claude', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const commandFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
      expect(await fileExists(commandFile)).toBe(true);
    });

    it('skill files have valid YAML frontmatter', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('generatedBy:');
    });

    it('throws for a tool without any skill target', async () => {
      const tool = AI_TOOLS.find((t) => !toolSupportsSkills(t));
      if (!tool) return; // Skip if every tool supports skills

      await expect(addTool(testDir, tool)).rejects.toThrow(
        /não suporta geração de skills/
      );
    });

    it('writes MiniMax Code skills to the user-home target, not the project', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'minimax-code')!;
      await addTool(testDir, tool);

      const globalSkill = path.join(
        testDir,
        'home',
        '.minimax',
        'skills',
        'openspec-explore',
        'SKILL.md'
      );
      expect(await fileExists(globalSkill)).toBe(true);
      expect(await directoryExists(path.join(testDir, '.minimax'))).toBe(false);
    });

    it('takes ownership of the shared .agents tree', async () => {
      // `codex` e `agents` escrevem na mesma raiz física `.agents/skills`, que
      // guarda uma única variante de cada skill: quem escreve por último vira o
      // dono, senão o próximo `update` reverteria o conteúdo em silêncio.
      const agents = AI_TOOLS.find((t) => t.value === 'agents')!;
      const codex = AI_TOOLS.find((t) => t.value === 'codex')!;

      await addTool(testDir, agents);
      expect(readSharedSkillTarget(testDir, '.agents')).toBe('agents');

      await addTool(testDir, codex);

      expect(readSharedSkillTarget(testDir, '.agents')).toBe('codex');
      expect(getCurrentToolIds(testDir).has('codex')).toBe(true);
      expect(getCurrentToolIds(testDir).has('agents')).toBe(false);
    });

    it('hands the shared .agents tree back to agents', async () => {
      const agents = AI_TOOLS.find((t) => t.value === 'agents')!;
      const codex = AI_TOOLS.find((t) => t.value === 'codex')!;

      await addTool(testDir, codex);
      expect(readSharedSkillTarget(testDir, '.agents')).toBe('codex');

      await addTool(testDir, agents);

      expect(readSharedSkillTarget(testDir, '.agents')).toBe('agents');
      expect(getCurrentToolIds(testDir).has('agents')).toBe(true);
      expect(getCurrentToolIds(testDir).has('codex')).toBe(false);
    });

    it('is idempotent: re-running overwrites existing files', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const skillFile = path.join(testDir, '.claude', 'skills', 'openspec-explore', 'SKILL.md');
      await fs.writeFile(skillFile, '# Modified\n');

      await addTool(testDir, tool);

      const content = await fs.readFile(skillFile, 'utf-8');
      expect(content).not.toBe('# Modified\n');
      expect(content).toMatch(/^---\n/);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // removeTool
  // ─────────────────────────────────────────────────────────────────────────

  describe('removeTool', () => {
    it('removes OpenSpec skill dirs for a configured tool', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const skillDir = path.join(testDir, '.claude', 'skills', 'openspec-explore');
      expect(await directoryExists(skillDir)).toBe(true);

      await removeTool(testDir, tool);

      expect(await directoryExists(skillDir)).toBe(false);
    });

    it('removes OpenSpec command files for a configured tool', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const commandFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
      expect(await fileExists(commandFile)).toBe(true);

      await removeTool(testDir, tool);

      expect(await fileExists(commandFile)).toBe(false);
    });

    it('leaves the skillsDir itself intact', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const dotClaudeDir = path.join(testDir, '.claude');
      await removeTool(testDir, tool);

      expect(await directoryExists(dotClaudeDir)).toBe(true);
    });

    it('leaves non-OpenSpec files in the tool directory intact', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      // Add a custom non-OpenSpec file
      const customFile = path.join(testDir, '.claude', 'my-custom-prompt.md');
      await fs.writeFile(customFile, '# My custom prompt\n');

      await removeTool(testDir, tool);

      expect(await fileExists(customFile)).toBe(true);
    });

    it('returns correct removal counts', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const counts = await removeTool(testDir, tool);

      // Core profile creates 4 skills (propose, explore, apply, archive)
      expect(counts.removedSkillCount).toBeGreaterThan(0);
      expect(counts.removedCommandCount).toBeGreaterThan(0);
    });

    it('is safe on unconfigured tool (no-op)', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      const counts = await removeTool(testDir, tool);
      expect(counts.removedSkillCount).toBe(0);
      expect(counts.removedCommandCount).toBe(0);
    });

    it('drops the shared root marker when the owner is removed', async () => {
      // Sem largar o marcador, "só marcador" ainda conta como configurado e o
      // próximo `update` recriaria as skills que o usuário acabou de remover.
      const codex = AI_TOOLS.find((t) => t.value === 'codex')!;
      await addTool(testDir, codex);
      expect(readSharedSkillTarget(testDir, '.agents')).toBe('codex');

      const counts = await removeTool(testDir, codex);

      expect(counts.removedSkillCount).toBeGreaterThan(0);
      expect(readSharedSkillTarget(testDir, '.agents')).toBeUndefined();
      expect(
        await fileExists(path.join(testDir, '.agents', 'skills', '.openspec-target'))
      ).toBe(false);
      expect(getCurrentToolIds(testDir).has('codex')).toBe(false);
    });

    it('keeps a shared root owned by another tool: removing codex spares agents', async () => {
      const agents = AI_TOOLS.find((t) => t.value === 'agents')!;
      const codex = AI_TOOLS.find((t) => t.value === 'codex')!;
      await addTool(testDir, agents);

      const skillFile = path.join(testDir, '.agents', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const counts = await removeTool(testDir, codex);

      expect(counts.removedSkillCount).toBe(0);
      expect(counts.keptSharedSkillsDir).toBe(path.join(testDir, '.agents', 'skills'));
      expect(counts.keptSharedSkillsOwner).toBe('agents');
      expect(await fileExists(skillFile)).toBe(true);
      expect(readSharedSkillTarget(testDir, '.agents')).toBe('agents');
      expect(getCurrentToolIds(testDir).has('agents')).toBe(true);
    });

    it('keeps a shared root owned by another tool: removing agents spares codex', async () => {
      const agents = AI_TOOLS.find((t) => t.value === 'agents')!;
      const codex = AI_TOOLS.find((t) => t.value === 'codex')!;
      await addTool(testDir, codex);

      const skillFile = path.join(testDir, '.agents', 'skills', 'openspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const counts = await removeTool(testDir, agents);

      expect(counts.removedSkillCount).toBe(0);
      expect(counts.keptSharedSkillsDir).toBe(path.join(testDir, '.agents', 'skills'));
      expect(counts.keptSharedSkillsOwner).toBe('codex');
      expect(await fileExists(skillFile)).toBe(true);
      expect(readSharedSkillTarget(testDir, '.agents')).toBe('codex');
      expect(getCurrentToolIds(testDir).has('codex')).toBe(true);
    });

    it('keeps global MiniMax Code skills, which are shared across projects', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'minimax-code')!;
      await addTool(testDir, tool);

      const globalSkill = path.join(
        testDir,
        'home',
        '.minimax',
        'skills',
        'openspec-explore',
        'SKILL.md'
      );
      expect(await fileExists(globalSkill)).toBe(true);

      const counts = await removeTool(testDir, tool);

      expect(counts.removedSkillCount).toBe(0);
      expect(counts.keptGlobalSkillsDir).toBe(path.join(testDir, 'home', '.minimax', 'skills'));
      expect(await fileExists(globalSkill)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // removeOpenSpecSkillDirs
  // ─────────────────────────────────────────────────────────────────────────

  describe('removeOpenSpecSkillDirs', () => {
    it('only removes openspec-* named dirs', async () => {
      const skillsDir = path.join(testDir, 'skills');
      await fs.mkdir(path.join(skillsDir, 'openspec-explore'), { recursive: true });
      await fs.mkdir(path.join(skillsDir, 'my-custom-skill'), { recursive: true });

      await removeOpenSpecSkillDirs(testDir, skillsDir);

      expect(await directoryExists(path.join(skillsDir, 'openspec-explore'))).toBe(false);
      expect(await directoryExists(path.join(skillsDir, 'my-custom-skill'))).toBe(true);
    });

    it('does not delete through a tool directory linked outside the project', async () => {
      // Guarda de caminho (Lote 0): um `.claude` que é link para fora do
      // projeto não pode ser usado para apagar skills fora dele.
      const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-tm-outside-'));
      const outsideSkill = path.join(outsideDir, 'skills', 'openspec-explore');
      await fs.mkdir(outsideSkill, { recursive: true });
      await fs.writeFile(path.join(outsideSkill, 'SKILL.md'), 'keep me');

      try {
        await fs.symlink(
          outsideDir,
          path.join(testDir, '.claude'),
          process.platform === 'win32' ? 'junction' : 'dir'
        );

        const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
        await expect(removeTool(testDir, tool)).rejects.toThrow('fora do diretório permitido');

        expect(await fileExists(path.join(outsideSkill, 'SKILL.md'))).toBe(true);
      } finally {
        await fs.rm(outsideDir, { recursive: true, force: true });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Codex: somente skills (o adapter de prompts globais foi aposentado)
  // ─────────────────────────────────────────────────────────────────────────

  describe('codex (skills-only)', () => {
    it('writes codex skills and no global prompts, even under commands delivery', async () => {
      mockGlobalConfig.current = { profile: 'core', delivery: 'commands' };

      const tool = AI_TOOLS.find((t) => t.value === 'codex')!;
      await addTool(testDir, tool);

      // O Codex lê a raiz canônica compartilhada `.agents/skills`.
      expect(
        await fileExists(path.join(testDir, '.agents', 'skills', 'openspec-propose', 'SKILL.md'))
      ).toBe(true);
      expect(
        await fileExists(path.join(testDir, '.codex', 'skills', 'openspec-propose', 'SKILL.md'))
      ).toBe(false);
      expect(
        await fileExists(path.join(process.env.CODEX_HOME!, 'prompts', 'opsx-propose.md'))
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getCurrentToolIds
  // ─────────────────────────────────────────────────────────────────────────

  describe('getCurrentToolIds', () => {
    it('returns empty set when no tools are configured', () => {
      const ids = getCurrentToolIds(testDir);
      expect(ids.size).toBe(0);
    });

    it('returns configured tool IDs after addTool', async () => {
      const tool = AI_TOOLS.find((t) => t.value === 'claude')!;
      await addTool(testDir, tool);

      const ids = getCurrentToolIds(testDir);
      expect(ids.has('claude')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getEligibleTools
  // ─────────────────────────────────────────────────────────────────────────

  describe('getEligibleTools', () => {
    it('returns only tools with a project-local or global skill target', () => {
      const eligible = getEligibleTools();
      for (const tool of eligible) {
        expect(toolSupportsSkills(tool)).toBe(true);
      }
      expect(eligible.map((tool) => tool.value)).toContain('minimax-code');
    });

    it('includes common tools like claude and cursor', () => {
      const eligible = getEligibleTools();
      const ids = eligible.map((t) => t.value);
      expect(ids).toContain('claude');
      expect(ids).toContain('cursor');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // resolveToolsArg
  // ─────────────────────────────────────────────────────────────────────────

  describe('resolveToolsArg', () => {
    it('"all" returns every eligible tool', () => {
      const all = resolveToolsArg('all');
      const eligible = getEligibleTools().map((t) => t.value);
      expect(all).toEqual(eligible);
    });

    it('"none" returns empty array', () => {
      expect(resolveToolsArg('none')).toEqual([]);
    });

    it('comma-separated list is parsed correctly', () => {
      expect(resolveToolsArg('claude,cursor')).toEqual(['claude', 'cursor']);
    });

    it('whitespace around IDs is trimmed', () => {
      expect(resolveToolsArg(' claude , cursor ')).toEqual(['claude', 'cursor']);
    });

    it('deduplicates IDs', () => {
      expect(resolveToolsArg('claude,claude')).toEqual(['claude']);
    });

    it('throws for unknown tool IDs', () => {
      expect(() => resolveToolsArg('totally-unknown-tool')).toThrow(/Ferramenta\(s\) inválida\(s\)/);
    });

    it('throws when mixing "all" with specific IDs', () => {
      expect(() => resolveToolsArg('all,claude')).toThrow(/Não é possível combinar/);
    });

    it('throws for empty string', () => {
      expect(() => resolveToolsArg('')).toThrow();
    });
  });
});

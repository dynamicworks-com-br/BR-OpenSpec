import os from 'os';
import path from 'path';

import { AI_TOOLS, type AIToolOption } from '../config.js';
import { SKILL_PATHS_MESSAGES } from '../../messages/index.js';

export type SkillCapableTool = AIToolOption & (
  | { skillsDir: string }
  | { globalSkillsDir: string }
);

export function toolSupportsSkills(tool: AIToolOption): tool is SkillCapableTool {
  return Boolean(tool.skillsDir || tool.globalSkillsDir);
}

export function getSkillCapableTools(): SkillCapableTool[] {
  return AI_TOOLS.filter(toolSupportsSkills);
}

export function hasGlobalSkillTarget(tool: AIToolOption): boolean {
  return Boolean(tool.globalSkillsDir);
}

export function resolveToolSkillsDir(
  projectRoot: string,
  tool: SkillCapableTool,
  options: { homeDir?: string } = {}
): string {
  if (tool.globalSkillsDir) {
    const homeDir = options.homeDir ?? process.env.USERPROFILE ?? process.env.HOME ?? os.homedir();
    return path.join(homeDir, tool.globalSkillsDir, 'skills');
  }

  if (tool.skillsDir) {
    return path.join(projectRoot, tool.skillsDir, 'skills');
  }

  throw new Error(SKILL_PATHS_MESSAGES.toolDoesNotSupportSkills(tool.value));
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { claudeAdapter } from '../src/core/command-generation/adapters/claude.js';
import { AI_TOOLS } from '../src/core/config.js';
import { formatProjectMdMigrationHint } from '../src/core/legacy-cleanup.js';
import { CORE_WORKFLOWS } from '../src/core/profiles.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'pt-BR', 'supported-tools.md'), 'utf-8');
const OPSX = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'pt-BR', 'opsx.md'), 'utf-8');
const MIGRATION = fs.readFileSync(
  path.join(REPO_ROOT, 'docs', 'pt-BR', 'migration-guide.md'),
  'utf-8'
);

describe('setup documentation', () => {
  it('matches the AI-assisted project.md migration guidance', () => {
    const hint = formatProjectMdMigrationHint();
    const claims = [
      'Revise openspec/project.md e migre o conteúdo útil para',
      'Mantenha o contexto conciso',
      'criação de artefatos, apply e archive',
      'regras dos artefatos correspondentes',
      'entrada de operations correspondente',
      'Deixe de fora material genérico',
      'desatualizado ou verboso',
      'Não exclua o project.md',
    ];

    expect(MIGRATION).toContain('Este arquivo não é excluído automaticamente');
    for (const claim of claims) {
      expect(hint, claim).toContain(claim);
    }
    expect(hint).toContain('Revise o config.yaml e então exclua o project.md quando estiver pronto.');
    expect(MIGRATION).toContain('**Exclua o project.md** depois de ter movido tudo o que é útil.');
  });

  it('keeps the Claude Code paths and recovery commands aligned with BR-OpenSpec', () => {
    const claude = AI_TOOLS.find((tool) => tool.value === 'claude');
    const claudeCommandPath = claudeAdapter.getFilePath('<id>').split(path.sep).join('/');

    expect(claude?.skillsDir).toBeDefined();
    expect(TOOLS).toContain(`\`${claude?.skillsDir}/skills/openspec-*/SKILL.md\``);
    expect(TOOLS).toContain(`\`${claudeCommandPath}\``);
    expect(TOOLS).toContain('openspec update');
    expect(TOOLS).toContain('`/openspec-propose`');
  });

  it('lists every workflow in the core profile', () => {
    for (const workflow of CORE_WORKFLOWS) {
      expect(OPSX).toContain(`\`${workflow}\``);
    }
  });
});

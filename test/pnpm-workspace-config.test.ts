import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const projectRoot = process.cwd();

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

function readYaml(relativePath: string): Record<string, any> {
  return parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

describe('pnpm workspace configuration', () => {
  it('keeps root build approval aligned and security overrides single-sourced', () => {
    const packageJson = readJson('package.json');
    const lockfile = readYaml('pnpm-lock.yaml');
    const workspace = readYaml('pnpm-workspace.yaml');
    const esbuildVersions = Object.keys(lockfile.packages)
      .filter((key) => key.startsWith('esbuild@'))
      .map((key) => key.slice('esbuild@'.length));

    expect(workspace.packages).toEqual(['.']);
    expect(esbuildVersions).toHaveLength(1);
    // pnpm 9.15.9 (packageManager) reads overrides and onlyBuiltDependencies from
    // package.json. allowBuilds and workspace-level overrides are pnpm 10 and are
    // ignored here, so a frozen install would drift if they were the only copy.
    expect(workspace.allowBuilds).toBeUndefined();
    expect(workspace.overrides).toBeUndefined();
    expect(packageJson.pnpm.onlyBuiltDependencies).toEqual(['esbuild']);
    expect(packageJson.pnpm.overrides).toEqual(lockfile.overrides);
  });

  // Os testes de website/ do upstream foram omitidos: este fork não tem website/.

  it('includes install policy changes in Nix and security validation', () => {
    const flake = fs.readFileSync(path.join(projectRoot, 'flake.nix'), 'utf8');
    const ci = fs.readFileSync(path.join(projectRoot, '.github/workflows/ci.yml'), 'utf8');
    const security = fs.readFileSync(
      path.join(projectRoot, '.github/workflows/security.yml'),
      'utf8'
    );

    expect(flake).toContain('./pnpm-workspace.yaml');
    expect(ci).toContain("- 'pnpm-workspace.yaml'");
    expect(security).toContain("- 'pnpm-workspace.yaml'");
  });
});

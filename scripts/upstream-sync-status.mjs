#!/usr/bin/env node
/**
 * Relatório de status da sincronização com o upstream (ferramenta de manutenção).
 *
 * Lê o marcador .upstream-sync.json, busca o upstream e lista os commits novos
 * desde o último ponto sincronizado, classificando cada um como STABLE (Bloco A,
 * deve ser portado e traduzido) ou WORKSPACE (subsistema beta, adiado).
 *
 * NÃO é publicado no npm (o package.json só inclui scripts/postinstall.js).
 * Uso: node scripts/upstream-sync-status.mjs [--no-fetch]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// execFileSync com array de argumentos: nenhum shell é invocado, então não há
// risco de injeção a partir dos valores do marcador ou da saída do git.
const git = (args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

// Caminhos que pertencem ao subsistema workspace beta (adiado nas sincronizações).
const WORKSPACE_RE = /workspace|context-store|context_store|initiative|planning-home|open-surface|legacy-state|foundation|registry|collections/i;

function loadMarker() {
  try {
    return JSON.parse(readFileSync(join(repoRoot, '.upstream-sync.json'), 'utf8'));
  } catch (err) {
    console.error('✖ Não foi possível ler .upstream-sync.json:', err.message);
    process.exit(1);
  }
}

function main() {
  const marker = loadMarker();
  const remote = marker.upstreamRemote || 'upstream';
  const branch = marker.upstreamBranch || 'main';
  const from = marker.lastSyncedCommit;
  const ref = `${remote}/${branch}`;

  if (!process.argv.includes('--no-fetch')) {
    process.stdout.write(`→ git fetch ${remote} --tags ...\n`);
    try { git(['fetch', remote, '--tags']); } catch {
      console.error(`✖ Falha ao buscar o remote "${remote}". Configure-o com:`);
      console.error(`  git remote add ${remote} https://github.com/${marker.upstreamRepo}.git`);
      process.exit(1);
    }
  }

  const tip = git(['rev-parse', ref]);
  const tipTag = git(['tag', '--points-at', ref]).split('\n').filter(Boolean).join(', ') || '(sem tag)';

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(` Status de sincronização — ${marker.upstreamRepo}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log(` Último sync:   ${marker.lastSyncedVersion}  (${from.slice(0, 8)})  em ${marker.lastSyncedDate}`);
  console.log(` Upstream tip:  ${tipTag}  (${tip.slice(0, 8)})`);

  if (tip === from) {
    console.log('\n✓ Nada novo. O fork já está sincronizado com o tip do upstream.\n');
    return;
  }

  const commits = git(['rev-list', '--reverse', `${from}..${ref}`]).split('\n').filter(Boolean);
  const rows = commits.map((sha) => {
    const subject = git(['show', '-s', '--format=%s', sha]);
    const files = git(['show', '--name-only', '--format=', sha]);
    const isWorkspace = files.split('\n').some((f) => f && WORKSPACE_RE.test(f));
    return { sha: sha.slice(0, 8), subject, kind: isWorkspace ? 'WORKSPACE' : 'STABLE' };
  });

  const stable = rows.filter((r) => r.kind === 'STABLE');
  const workspace = rows.filter((r) => r.kind === 'WORKSPACE');

  console.log(`\n ${commits.length} commit(s) novo(s): ${stable.length} STABLE · ${workspace.length} WORKSPACE (beta, adiado)\n`);
  for (const r of rows) {
    const tag = r.kind === 'STABLE' ? '  STABLE   ' : '  workspace';
    console.log(` ${tag} ${r.sha}  ${r.subject}`);
  }

  console.log('\n──────────────────────────────────────────────────────────────');
  console.log(' Próximo passo: portar e traduzir os commits STABLE (Bloco A),');
  console.log(' commit a commit por tema. NÃO faça `git merge`. Os WORKSPACE');
  console.log(' ficam adiados (ver §9 do plano de sync). Ao terminar, atualize');
  console.log(' .upstream-sync.json e crie a tag synced/upstream-<versão>.');
  console.log('──────────────────────────────────────────────────────────────\n');
}

main();

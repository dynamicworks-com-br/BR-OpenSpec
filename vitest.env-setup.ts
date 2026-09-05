/**
 * Setup por arquivo de teste (roda dentro de cada worker do Vitest).
 *
 * Rede de segurança destrutiva: a limpeza de artefatos legados varre o
 * diretório global de prompts do Codex (`$CODEX_HOME/prompts`, ou
 * `~/.codex/prompts` quando a variável não está definida) e remove os prompts
 * `opsx-*.md` da lista de permissões. Sem isolamento, qualquer teste que rode
 * `init`/`update` apagaria os prompts REAIS da máquina do desenvolvedor.
 *
 * Cada arquivo de teste ganha o seu próprio `CODEX_HOME` temporário; testes que
 * precisam de um diretório específico continuam livres para sobrescrever a
 * variável (e restaurá-la) por conta própria.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-vitest-codex-home-'));
process.env.CODEX_HOME = codexHome;

process.on('exit', () => {
  try {
    fs.rmSync(codexHome, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup.
  }
});

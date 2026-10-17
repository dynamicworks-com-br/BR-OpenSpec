import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Isolates real git invocations from the host's gitconfig (signing, hooks,
 * templates) and provides a deterministic commit identity.
 */
export function isolatedGitEnv(tempDir: string): NodeJS.ProcessEnv {
  const emptyConfig = path.join(tempDir, 'gitconfig-empty');
  if (!fs.existsSync(emptyConfig)) {
    fs.writeFileSync(emptyConfig, '');
  }
  return {
    GIT_CONFIG_GLOBAL: emptyConfig,
    GIT_CONFIG_SYSTEM: emptyConfig,
    GIT_AUTHOR_NAME: 'OpenSpec Tester',
    GIT_AUTHOR_EMAIL: 'tester@example.com',
    GIT_COMMITTER_NAME: 'OpenSpec Tester',
    GIT_COMMITTER_EMAIL: 'tester@example.com',
  };
}

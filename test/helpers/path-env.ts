import * as path from 'node:path';

function pathEnvKey(env: NodeJS.ProcessEnv): string {
  return Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
}

/** Prepends a directory to the env's PATH without adding a second case-variant key. */
export function withPrependedPathEnv(
  baseEnv: NodeJS.ProcessEnv,
  dir: string
): NodeJS.ProcessEnv {
  const baseHasPathKey = Object.keys(baseEnv).some(
    (key) => key.toLowerCase() === 'path'
  );
  const key = baseHasPathKey ? pathEnvKey(baseEnv) : pathEnvKey(process.env);
  return {
    ...baseEnv,
    [key]: prependPathValue(dir, baseEnv[key] ?? process.env[key]),
  };
}

function prependPathValue(dir: string, currentPath: string | undefined): string {
  return currentPath ? `${dir}${path.delimiter}${currentPath}` : dir;
}

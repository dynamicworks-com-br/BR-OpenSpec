import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useKeypressMock } = vi.hoisted(() => ({
  useKeypressMock: vi.fn(),
}));

vi.mock('@inquirer/core', () => ({
  createPrompt: vi.fn((view) => async (config: Record<string, never>) => {
    let keypressHandler: ((key: { name: string; ctrl: boolean }) => void) | undefined;
    useKeypressMock.mockImplementation((handler) => {
      keypressHandler = handler;
    });

    return new Promise<void>((resolve) => {
      view(config, resolve);
      keypressHandler?.({ name: 'return', ctrl: false });
    });
  }),
  isEnterKey: vi.fn((key) => key.name === 'return'),
  useKeypress: useKeypressMock,
}));

describe('welcome screen', () => {
  const originalNoColor = process.env.NO_COLOR;
  const originalStdinIsTTY = process.stdin.isTTY;
  const originalStdoutIsTTY = process.stdout.isTTY;
  const originalColumns = process.stdout.columns;

  beforeEach(() => {
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'columns', { value: 100, configurable: true });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    useKeypressMock.mockClear();
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
    Object.defineProperty(process.stdin, 'isTTY', { value: originalStdinIsTTY, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: originalStdoutIsTTY, configurable: true });
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, configurable: true });
    vi.restoreAllMocks();
  });

  it('uses an Inquirer prompt to wait for Enter', async () => {
    const { showWelcomeScreen } = await import('../../src/ui/welcome-screen.js');

    await showWelcomeScreen();

    expect(useKeypressMock).toHaveBeenCalledOnce();
  });

  it('waits for Enter on the static path too (NO_COLOR)', async () => {
    // Static rendering still waits for the Enter the prompt line asks for;
    // otherwise the keystroke falls through into the tool picker (#1462).
    process.env.NO_COLOR = '1';
    const written: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      written.push(String(chunk));
      return true;
    });
    const { showWelcomeScreen } = await import('../../src/ui/welcome-screen.js');

    await showWelcomeScreen();

    expect(useKeypressMock).toHaveBeenCalledOnce();
    expect(written.join('')).toContain('Pressione Enter');
    // No cursor-up repaints: the frame is drawn exactly once.
    expect(written.join('')).not.toMatch(/\x1b\[\d+A/);
  });

  it('drops the Pressione Enter line when there is no TTY to wait on', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    const written: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      written.push(String(chunk));
      return true;
    });
    const { showWelcomeScreen } = await import('../../src/ui/welcome-screen.js');

    await showWelcomeScreen();

    // Nothing to wait on: no keypress listener, and no line asking for one.
    expect(useKeypressMock).not.toHaveBeenCalled();
    expect(written.join('')).not.toContain('Pressione Enter');
  });
});

import { describe, it, expect } from 'vitest';
import { ptBrKeysHelpTip } from '../../src/prompts/keys-help-tip.js';

function strip(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\[[0-9;]*m/g, '');
}

describe('ptBrKeysHelpTip', () => {
  it('traduz as teclas e ações padrão do checkbox', () => {
    const tip = strip(
      ptBrKeysHelpTip([
        ['↑↓', 'navigate'],
        ['space', 'select'],
        ['a', 'all'],
        ['i', 'invert'],
        ['⏎', 'submit'],
      ])
    );

    expect(tip).toBe(
      '↑↓ navegar • espaço alternar • a todos • i inverter • ⏎ confirmar'
    );
  });

  it('mantém teclas e ações desconhecidas sem tradução', () => {
    const tip = strip(ptBrKeysHelpTip([['tab', 'complete']]));

    expect(tip).toBe('tab complete');
  });

  it('traduz o par de teclas do select', () => {
    const tip = strip(
      ptBrKeysHelpTip([
        ['↑↓', 'navigate'],
        ['⏎', 'submit'],
      ])
    );

    expect(tip).toBe('↑↓ navegar • ⏎ confirmar');
  });
});

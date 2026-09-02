import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOpsxExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getExploreSkillTemplate();
const command = getOpsxExploreCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body. Ported from upstream's
// test/core/templates/explore.test.ts with string assertions translated
// to match the fork's PT-BR template prose.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function newChangeTransition(body: string, label: string): string {
  const start = body.indexOf('### Quando não existe change');
  const end = body.indexOf('### Quando existe change');

  expect(start, label).toBeGreaterThanOrEqual(0);
  expect(end, label).toBeGreaterThan(start);

  return body.slice(start, end);
}

function occurrenceCount(body: string, value: string): number {
  return body.split(value).length - 1;
}

// Upstream matches `/[^\x00-\x7F]/` here. The fork's fenced examples are
// narrated in PT-BR, so their prose legitimately carries Latin-1 accents
// ("Usuário", "Coordenação", "Restrições-chave"). #983 is about *diagram*
// glyphs whose rendered width is ambiguous, so match only those classes:
// box-drawing U+2500-U+257F, blocks U+2580-U+259F, geometric shapes and
// triangular arrowheads U+25A0-U+25FF, arrows U+2190-U+21FF, bullets
// U+2022/U+2023/U+25E6 and check/cross dingbats U+2713-U+2718.
const DIAGRAM_GLYPH = /[\u2190-\u21FF\u2500-\u25FF\u2022\u2023\u2713-\u2718]/;

function fencedBlockLines(body: string): Array<[number, string]> {
  const lines: Array<[number, string]> = [];
  let inFence = false;

  body.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      lines.push([index + 1, line]);
    }
  });

  return lines;
}

describe('explore templates', () => {
  // Regression for #696: explore never loaded the project's declared
  // context, so it reasoned without the tech stack, conventions, and
  // rules every artifact-creating workflow already receives.
  it('loads project context from the OpenSpec config at startup (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec/config.yaml');
      expect(body, label).toContain('`context`: background do projeto');
      expect(body, label).toContain('`rules`: indexadas por id de artifact');
    }
  });

  it('resolves the config through the reported root rather than assuming a repo-local path (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec list --json');
      expect(body, label).toContain('<root.path>/openspec/config.yaml');
      expect(body, label).toContain('root.path');
    }
  });

  // resolveConfigFilePath() probes config.yaml then config.yml, and
  // `openspec init` leaves a .yml project on .yml forever - naming only
  // .yaml would silently skip context for those projects.
  it('accepts config.yml as well as config.yaml (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('config.yml');
      expect(body, label).toContain('pule isto se nenhum dos dois arquivos existir');
    }
  });

  // `rules` is Record<artifactId, string[]>; explore holds no artifact at
  // startup, so the guidance must not invite blanket application.
  it('scopes rules to the artifact they are keyed to (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'as entradas de um artifact se aplicam apenas quando você escreve aquele artifact'
      );
    }
  });

  // House style across instructions.ts and the sibling workflow templates
  // forbids leaking context/rules into the artifact, not just the chat.
  it('treats project context as constraints that must not leak into output (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('restrições para você seguir');
      expect(body, label).toContain(
        'NÃO as copie para a conversa nem para nenhum artifact que você criar'
      );
    }
  });

  // Regression for #1715: explore treated answers to design questions as
  // consent and started writing artifacts (or ran `openspec new change`)
  // on its own. Read-only work stays free; the first write-capable action
  // must be announced and confirmed in a separate user message.
  it('requires separate confirmation before any file-writing action (#1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Antes da primeira ação capaz de escrever');
      expect(body, label).toContain('nomeie os artifacts ou arquivos que você alteraria');
      expect(body, label).toContain('faça uma pergunta direta de sim/não');
      expect(body, label).toContain('aguarde a confirmação do usuário em uma mensagem separada');
      expect(body, label).toContain(
        'Responder a perguntas de design ou de esclarecimento nunca é consentimento para escrever'
      );
      expect(body, label).toContain('executar comandos ou ferramentas somente leitura sem confirmação');
      expect(body, label).toContain(
        'A confirmação cobre apenas o escopo que você descreveu; pergunte de novo antes de ampliá-lo'
      );
    }
  });

  it('treats workflow configuration and write-capable commands as changes (#1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'criar ou editar schemas, templates ou `openspec/config.yaml` é uma change'
      );
      expect(body, label).toContain(
        'incluindo `openspec new change` ou outro comando que escreva arquivos'
      );
      expect(body, label).toContain(
        'Criar ou atualizar artifacts de change do BR-OpenSpec dentro do escopo confirmado está ok, escrever qualquer outra coisa não'
      );
    }
  });

  it('scaffolds a new change before capturing exploration artifacts (#668, #720)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain('openspec new change "<nome>"');
      expect(transition, label).toContain(
        'Nunca crie um diretório de change novo sob `openspec/changes/` à mão'
      );
      expect(transition, label).toContain('`.openspec.yaml`');
    }
  });

  // Fork-specific replacement for upstream's "retains the selected store
  // throughout the capture transition": the stores subsystem is deferred (D1),
  // so no `--store` clause may leak into the templates before the flag exists.
  it('does not mention --store while the stores subsystem is deferred (fork)', () => {
    for (const [label, body] of bodies) {
      expect(newChangeTransition(body, label), label).not.toContain('--store');
      expect(body, label).not.toContain('--store');
    }
  });

  it('continues an accepted transition through the requested artifact (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain('openspec status --change "<nome>" --json');
      expect(transition, label).toContain(
        'openspec instructions "<artifact-id>" --change "<nome>" --json'
      );
      expect(transition, label).toContain('Capture o(s) artifact(s) que o usuário solicitou');
      expect(transition, label).toContain(
        'sem pedir que ele invoque outro comando de workflow'
      );
      expect(transition, label).toContain(
        'processe os artifacts solicitados em ordem de dependência'
      );
      expect(transition, label).toContain(
        'Após criar cada artifact, reexecute `openspec status --change "<nome>" --json`'
      );
      expect(transition, label).toContain(
        'Se o `instruction` delegar a criação a uma skill ou comando específico'
      );
      expect(transition, label).toContain('Verifique se a saída concreta escolhida existe');
    }
  });

  it('keeps the seamless capture steps ordered (#668, #720)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const scaffold = transition.indexOf('1. Execute `openspec new change "<nome>"`');
      const initialStatus = transition.indexOf(
        '2. Execute `openspec status --change "<nome>" --json`'
      );
      const readyInstructions = transition.indexOf(
        'Para cada artifact solicitado que estiver `ready`, execute `openspec instructions'
      );
      const verifyOutput = transition.indexOf('Verifique se a saída concreta escolhida existe');
      const refreshStatus = transition.indexOf(
        'Após criar cada artifact, reexecute `openspec status'
      );

      expect(scaffold, label).toBeGreaterThanOrEqual(0);
      expect(initialStatus, label).toBeGreaterThan(scaffold);
      expect(readyInstructions, label).toBeGreaterThan(initialStatus);
      expect(verifyOutput, label).toBeGreaterThan(readyInstructions);
      expect(refreshStatus, label).toBeGreaterThan(verifyOutput);
      expect(occurrenceCount(transition, 'openspec new change "<nome>"'), label).toBe(1);
      expect(
        occurrenceCount(transition, 'openspec status --change "<nome>" --json'),
        label
      ).toBe(2);
      expect(
        occurrenceCount(transition, 'openspec instructions "<artifact-id>"'),
        label
      ).toBe(2);
      expect(
        occurrenceCount(transition, 'openspec instructions "<prerequisite-id>"'),
        label
      ).toBe(1);
      expect(
        occurrenceCount(transition, 'Verifique se a saída concreta escolhida existe'),
        label
      ).toBe(1);
      expect(
        occurrenceCount(transition, 'Após criar cada artifact, reexecute `openspec status'),
        label
      ).toBe(1);
    }
  });

  // Regression for #983: the worked examples drew boxes and tables with
  // Unicode box-drawing, arrow, and marker glyphs. Agents copy those
  // examples verbatim, and on terminals that render the glyphs
  // double-width the right border of every padded box drifted loose.
  it('draws every fenced example without Unicode diagram glyphs (#983)', () => {
    for (const [label, body] of bodies) {
      const offenders = fencedBlockLines(body)
        .filter(([, line]) => DIAGRAM_GLYPH.test(line))
        .map(([lineNumber, line]) => `${lineNumber}: ${line}`);

      expect(offenders, `${label} fenced examples must not use Unicode diagram glyphs`).toEqual([]);
    }
  });

  it('tells the agent to draw with ASCII and says why (#983)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('**Desenhe apenas com ASCII puro**');
      expect(body, label).toContain('renderizados com larguras diferentes');
      expect(body, label).toContain('Mantenha todo caractere de diagrama em ASCII');
    }
  });

  it('stops after scaffolding when the user requests only a new change (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      expect(transition, label).toContain(
        'Se ele pediu apenas para iniciar uma change, pare após o scaffold e mostre o status dela'
      );
    }
  });

  it('uses dependency context and artifact constraints during capture (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        'Leia os arquivos de dependências concluídos listados em `dependencies`'
      );
      expect(transition, label).toContain('aplique `context` e `rules` como restrições');
      expect(transition, label).toContain('sem copiá-los para o artifact');
    }
  });

  it('handles conditional prerequisites without deadlocking capture (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const requestedInstructions = transition.indexOf(
        'Para cada artifact solicitado que estiver `ready`, execute `openspec instructions'
      );
      const evaluateRequestedCondition = transition.indexOf(
        'Antes de criar um artifact solicitado, avalie qualquer condição presente no próprio `instruction`'
      );
      const inspectPrerequisite = transition.indexOf(
        'execute `openspec instructions "<prerequisite-id>"'
      );
      const evaluateCondition = transition.indexOf(
        'avalie essa condição contra a change explorada'
      );
      const recordSkip = transition.indexOf(
        'registre que o pulou deliberadamente somente quando a condição não se aplicar'
      );
      const requireExpansion = transition.indexOf(
        'Se a condição se aplicar, ou se o pré-requisito não for condicional'
      );
      const approvalGuard = transition.indexOf(
        'Não crie um pré-requisito não solicitado sem a aprovação do usuário'
      );

      expect(transition, label).toContain(
        'execute `openspec instructions "<prerequisite-id>" --change "<nome>" --json` para esse pré-requisito, esteja ele `ready` ou `blocked`'
      );
      expect(transition, label).toContain(
        'registre que o pulou deliberadamente quando a condição não se aplicar'
      );
      expect(transition, label).toContain(
        'registre que o pulou deliberadamente somente quando a condição não se aplicar'
      );
      expect(transition, label).toContain(
        'Se a condição se aplicar, ou se o pré-requisito não for condicional, trate-o como um pré-requisito normal'
      );
      expect(transition, label).toContain('Não crie um pré-requisito não solicitado');
      expect(transition, label).toContain(
        'deliberadamente pulado porque o próprio `instruction` dele declarava uma condição que não se aplicava'
      );
      expect(transition, label).toContain('lembre-se dele e não o reconsidere');
      expect(transition, label).toContain('Dependências são facilitadoras, não portões');
      expect(transition, label).toContain(
        'execute `openspec instructions "<artifact-id>" --change "<nome>" --json` apesar do status blocked'
      );
      expect(transition, label).toContain(
        'somente quando esses skips condicionais registrados forem suas únicas dependências faltantes'
      );
      expect(transition, label).toContain('não pode ser pulado condicionalmente');
      expect(requestedInstructions, label).toBeGreaterThanOrEqual(0);
      expect(evaluateRequestedCondition, label).toBeGreaterThan(requestedInstructions);
      expect(inspectPrerequisite, label).toBeGreaterThan(evaluateRequestedCondition);
      expect(evaluateCondition, label).toBeGreaterThan(inspectPrerequisite);
      expect(recordSkip, label).toBeGreaterThan(evaluateCondition);
      expect(requireExpansion, label).toBeGreaterThan(recordSkip);
      expect(approvalGuard, label).toBeGreaterThan(requireExpansion);
    }
  });

  // #1459: the capture table must key on the full spec path, not a bare name.
  it('preserves nested capability paths in the capture table (#1459)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '`<capability-path>` é o diretório do spec relativo a `specs/`'
      );
      expect(body, label).toContain('`specs/<capability-path>/spec.md`');
      expect(body, label).toContain(
        'Preserve o caminho completo de uma capability existente'
      );
      expect(body, label).not.toContain('`specs/<capability>/spec.md`');
    }
  });

  // #720: the guardrail list must forbid hand-made change directories too.
  it('forbids manual change scaffolding in the guardrails (#720)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('**Não faça scaffold de changes manualmente**');
      expect(body, label).toContain(
        'Sempre use `openspec new change "<nome>"` para que os metadados obrigatórios'
      );
    }
  });

  // #720: the opening IMPORTANT paragraph must point at the scaffold step.
  it('points a new change at the scaffold step up front (#720)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'Para uma change nova, faça o scaffold dela primeiro, conforme descrito abaixo.'
      );
    }
  });
});

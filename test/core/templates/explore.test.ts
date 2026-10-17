import { describe, expect, it } from 'vitest';

import {
  getSkillReferenceTransformer,
  transformCommandInvocations,
  transformToCodexCompatibleSkillReferences,
  transformToSkillReferences,
} from '../../../src/utils/command-references.js';
import { CommandAdapterRegistry } from '../../../src/core/command-generation/registry.js';
import {
  formatCommandInvocation,
  getInvocationForAdapter,
} from '../../../src/core/command-generation/invocation.js';
import { AI_TOOLS } from '../../../src/core/config.js';
import {
  generateSkillContent,
  getCommandContents,
  getCommandTemplates,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { generateCommands } from '../../../src/core/command-generation/generator.js';
import { getProfileWorkflows } from '../../../src/core/profiles.js';

// Bodies as generated with every workflow installed. Profile-dependent
// handoffs are covered separately below.
const skill = getSkillTemplates().find(e => e.workflowId === 'explore')!.template;
const command = getCommandTemplates().find(e => e.id === 'explore')!.template;

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
  it('guides planning without forcing an interview on open-ended exploration (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Quando o usuário estiver planejando uma change');
      expect(body, label).toContain('Para uma discussão aberta, siga a conversa');
      expect(body, label).toContain('Pare de perguntar quando o usuário tiver clareza suficiente');
      expect(body, label).toContain('Deixe-o pausar, mudar de direção ou adiar uma decisão');
      expect(body, label).not.toContain('Relentless Interview Mode');
    }
  });

  it('investigates repository facts before asking while acknowledging missing evidence (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Antes de fazer uma pergunta factual, siga a descoberta de contexto abaixo');
      expect(body, label).toContain('artifacts relevantes do BR-OpenSpec, código-fonte, testes, docs e configuração');
      expect(body, label).toContain('Não peça ao usuário para repetir fatos que você pode verificar');
      expect(body, label).toContain('Se a evidência estiver ausente, conflitante ou inacessível');
      expect(body, label).toContain('peça apenas o esclarecimento necessário para prosseguir');
    }
  });

  it('resolves blocking decisions first and revisits dependent assumptions (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Resolva a próxima decisão bloqueante antes dos detalhes que dependem dela');
      expect(body, label).toContain('Revisite suposições posteriores quando uma resposta anterior mudar');
      expect(body, label).toContain('Pule ramos que não importam para este objetivo');
    }
  });

  it('asks one focused question and recommends only when evidence supports a choice (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Faça uma pergunta focada de cada vez');
      expect(body, label).toContain('Agrupe perguntas somente se o usuário pedir um lote');
      expect(body, label).toContain('explique brevemente por que ela importa e qual decisão ela destrava');
      expect(body, label).toContain('Quando a evidência sustentar uma recomendação');
      expect(body, label).toContain('Não invente intenção, prioridades ou restrições externas');
    }
  });

  it('keeps decisions in the conversation without accepting defaults or authorizing writes (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Acompanhe decisões na conversa');
      expect(body, label).toContain('Separe decisões confirmadas de defaults propostos e de perguntas em aberto');
      expect(body, label).toContain('Silêncio não é aceitação');
      expect(body, label).toContain('Aceitar uma resposta ou um lote de recomendações não é permissão para escrever');
      expect(body, label).toContain('Mantenha a confirmação de escrita em arquivo separada das perguntas de descoberta');
    }
  });

  it('delivers the same planning guidance exactly once in both templates (#1017)', () => {
    const sections = bodies.map(([label, body]) => {
      const heading = '## Planejando uma Change';
      expect(occurrenceCount(body, heading), label).toBe(1);
      const start = body.indexOf(heading);
      const end = body.indexOf('\n---', start);
      expect(end, label).toBeGreaterThan(start);
      return body.slice(start, end);
    });

    expect(sections[0]).toBe(sections[1]);
  });

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

  // Regression for #1828: the #1715 write-confirmation rule named
  // `openspec new change` as something that needs a separate yes/no, while
  // the capture branch told the agent to transition "seamlessly" into
  // running it. Both readings were defensible, so the same request either
  // wrote files immediately or stopped and asked. The rule now resolves the
  // conflict in one direction: an explicit capture request IS the
  // confirmation, for the scope that request names.
  it('treats an explicit capture request as the write confirmation (#1828)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'Uma solicitação explícita do usuário para capturar a exploração como uma change nova é ela mesma essa confirmação'
      );
      // Scoped to change artifacts, so the carve-out cannot reach the
      // workflow configuration #1715 reported an agent editing.
      expect(body, label).toContain(
        'cobrindo a change e os artifacts de change que a solicitação nomeia'
      );
    }
  });

  it('keeps the strict rule for a capture the agent proposed itself (#1828)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'Essa regra governa `openspec new change` sempre que você é quem propõe a captura'
      );
      // The guardrail points at the capture transition rather than restating
      // the contract a third time, so the three sites cannot drift apart.
      expect(body, label).toContain(
        'a própria solicitação de captura do usuário é a exceção, tratada na transição de captura acima'
      );
    }
  });

  it('states the carve-out at the head of the capture branch, before the scaffold step (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const carveOut = transition.indexOf(
        'essa solicitação é a confirmação exigida acima'
      );
      const scaffold = transition.indexOf('1. Execute `openspec new change "<nome>"`');

      expect(carveOut, label).toBeGreaterThanOrEqual(0);
      expect(scaffold, label).toBeGreaterThan(carveOut);
      expect(transition, label).toContain(
        'a criação dos artifacts de change que a solicitação nomeia, e nada mais'
      );
    }
  });

  // A yes to an offer the agent made looks identical to a user-initiated
  // capture request at the point the decision is made, so the discriminator
  // has to live in the branch, not only in the guardrail 190 lines below it.
  it('carries the agent-proposed discriminator in the branch itself (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        'Isso vale somente quando a solicitação é dele'
      );
      expect(transition, label).toContain(
        'um sim a uma oferta que você fez confirma apenas o escopo que a própria oferta nomeou'
      );
    }
  });

  // "Do not ask for a second confirmation" would have contradicted step 2,
  // nine lines below it, which requires asking before expanding the capture.
  // Narrow the licence to re-asking for what was already asked for.
  it('does not license skipping the asks the capture steps still require (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        'Não pergunte de novo o que ele já pediu; pergunte antes de qualquer coisa além disso'
      );
      expect(transition, label).not.toContain('Do not ask for a second confirmation');
      expect(transition, label).toContain('pergunte antes de expandir a captura');
      expect(transition, label).toContain(
        'Não crie um pré-requisito não solicitado sem a aprovação do usuário'
      );
    }
  });

  // The carve-out must not become a blanket write permit: #1715's guarantee
  // survives only if everything outside the requested scope still stops.
  it('keeps the carve-out scoped to what the request named (#1828, #1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'A confirmação cobre apenas o escopo que você descreveu; pergunte de novo antes de ampliá-lo'
      );
      expect(body, label).toContain(
        'Responder a perguntas de design ou de esclarecimento nunca é consentimento para escrever'
      );
      expect(body, label).toContain(
        'Aceitar uma resposta ou um lote de recomendações não é permissão para escrever'
      );
      expect(body, label).toContain(
        'criar ou editar schemas, templates ou `openspec/config.yaml` é uma change'
      );
    }
  });

  // #1828 was not a missing sentence. It was a second, contradictory sentence
  // elsewhere in the same body, and no `toContain` assertion can see one of
  // those: every pinned string stays present while the new sentence reverses
  // it. So invert the check. Collect EVERY sentence that couples consent
  // language to the capture topic and require each to be one the resolution
  // sanctions, which surfaces a gate added anywhere in the body - Guardrails,
  // "Planning a Change", either capture branch.
  //
  // Limits worth knowing: this is lexical. A sentence that reverses the
  // resolution without using any consent word - redefining what counts as
  // "requested", or suspending the carve-out on a condition - is invisible
  // here and stays a review responsibility.
  const CONSENT_WORDS =
    /\b(confirma(?:ção|ções|r|do|da)?|sim\/não|aprova(?:ção|r|do|da)?|permissão|consentimento)\b/i;
  const CAPTURE_WORDS = /(openspec new change|scaffold|captur|capaz de escrever|primeira ação)/i;

  const SANCTIONED_CONSENT = [
    // The stance paragraph: the rule, then the carve-out.
    /Você PODE criar ou atualizar artifacts de change do BR-OpenSpec .* dentro de um escopo confirmado/,
    /Antes da primeira ação capaz de escrever, nomeie os artifacts ou arquivos que você alteraria/,
    /Uma solicitação explícita do usuário para capturar a exploração como uma change nova é ela mesma essa confirmação/,
    // The capture branch: the carve-out and both of its fences.
    /essa solicitação é a confirmação exigida acima/,
    /Isso vale somente quando a solicitação é dele/,
    /um sim a uma oferta que você fez confirma apenas o escopo que a própria oferta nomeou/,
    /Não pergunte de novo o que ele já pediu/,
    /Não crie um pré-requisito não solicitado sem a aprovação do usuário/,
    // The guardrail: the rule, and a pointer back to the branch.
    /Antes da primeira ação capaz de escrever - incluindo `openspec new change`/,
    /Essa regra governa `openspec new change` sempre que você é quem propõe a captura/,
    /A confirmação cobre apenas o escopo que você descreveu/,
    /Essa confirmação cobre apenas o escopo descrito/,
    /Responder a perguntas de design ou de esclarecimento nunca é consentimento para escrever/,
    /Respostas a perguntas de design ou de esclarecimento nunca são consentimento para escrever/,
    /Aceitar uma resposta ou um lote de recomendações não é permissão para escrever/,
  ];

  // The `--store` reminder repeats on five steps and says "confirmed" only to
  // mean "the store id you already resolved", which is not a consent rule.
  const STORE_REMINDER =
    /\(append the confirmed `--store "<id>"` only for a registered standalone store\)/g;

  function consentSentences(body: string, requireCaptureTopic: boolean): string[] {
    return body
      .replace(STORE_REMINDER, '')
      .split(/(?<=[.:;])\s+/)
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter(
        (sentence) =>
          CONSENT_WORDS.test(sentence) &&
          (!requireCaptureTopic || CAPTURE_WORDS.test(sentence))
      );
  }

  it('couples consent to capture only where the resolution sanctions it (#1828)', () => {
    for (const [label, body] of bodies) {
      const unsanctioned = consentSentences(body, true).filter(
        (sentence) => !SANCTIONED_CONSENT.some((allowed) => allowed.test(sentence))
      );

      expect(unsanctioned, `${label} must add no unsanctioned consent rule`).toEqual([]);
    }
  });

  // Inside the capture branch, drop the topic filter entirely: a gate written
  // there is about the capture whether or not it says so. Without this, a bare
  // "get a fresh yes/no before running anything" inserted above step 1 reads as
  // off-topic and reinstates #1828 with the suite green.
  it('adds no confirmation gate of its own inside the capture branch (#1828)', () => {
    for (const [label, body] of bodies) {
      const unsanctioned = consentSentences(
        newChangeTransition(body, label),
        false
      ).filter((sentence) => !SANCTIONED_CONSENT.some((allowed) => allowed.test(sentence)));

      expect(unsanctioned, `${label} capture branch must carry no gate`).toEqual([]);
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
        'Se o instruction delegar a criação a uma skill ou comando específico'
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
        'faça o scaffold dela primeiro, conforme descrito abaixo.'
      );
    }
  });
});

// Regression for #869: explore refused to implement and told the agent to
// "create a change proposal" without ever naming the workflow that does it.
// With no named exit, agents answered the discovery questions and then went
// straight to writing code - the failure two reporters hit through Copilot.
describe('explore handoff to the propose workflow (#869)', () => {
  it('names the propose workflow when the user asks for implementation', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'aponte-o para `/opsx:propose`, que transforma a discussão em uma change'
      );
      expect(body, label).toContain('O trabalho acontece a partir dessa change, nunca a partir do modo explore');
      expect(body, label).not.toContain(
        'remind them to exit explore mode first and create a change proposal'
      );
    }
  });

  it('names the propose workflow where discovery ends', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '**Fluir para uma proposal**: "Pronto para começar? Execute `/opsx:propose` e isto vira uma change."'
      );
      expect(body, label).not.toContain('I can create a change proposal');
    }
  });

  it('pairs the do-not-implement guardrail with the handoff', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'Quando o usuário estiver pronto para construir, nomeie o handoff em vez de começar: `/opsx:propose` transforma a discussão em uma change, e o trabalho acontece lá'
      );
    }
  });

  it('offers the handoff as a next step in the closing summary', () => {
    expect(skill.instructions).toContain('- Transforme isto em uma change: `/opsx:propose`');
    expect(skill.instructions).not.toContain('- Create a change proposal');
  });

  // The reference has to be the canonical `/opsx:<id>` form of a known
  // command id, or the per-tool transformers leave it as written and the
  // skill advertises an invocation no tool registers (#727, #1307).
  it('writes the reference so per-tool rendering rewrites it', () => {
    for (const [label, body] of bodies) {
      const rendered = transformToSkillReferences(body);
      expect(rendered, label).toContain('/openspec-propose');
      expect(rendered, label).not.toContain('/opsx:propose');
    }
  });
});

// The handoff is only useful if every tool renders it as an invocation that
// tool actually registers. These assertions walk the real registries rather
// than a hand-picked few, so a new adapter or a changed invocation shape
// cannot quietly leave explore advertising a command nobody answers to
// (the #727 / #1307 failure mode).
describe('explore handoff renders for every delivery surface (#869)', () => {
  // Both workflows explore hands off to. Each is a `CORE_WORKFLOWS` member,
  // so naming them does not advertise anything the default profile omits.
  const HANDOFF_IDS = ['propose', 'apply'] as const;

  function canonicalCount(body: string, commandId: string): number {
    return occurrenceCount(body, `/opsx:${commandId}`);
  }

  it('names both handoff workflows in both bodies before any rendering', () => {
    for (const [label, body] of bodies) {
      for (const commandId of HANDOFF_IDS) {
        expect(canonicalCount(body, commandId), `${label} ${commandId}`).toBeGreaterThan(0);
      }
    }
  });

  it('rewrites every reference for each registered command adapter', () => {
    const adapters = CommandAdapterRegistry.getAll();
    expect(adapters.length).toBeGreaterThan(0);

    for (const adapter of adapters) {
      const invocation = getInvocationForAdapter(adapter);

      for (const [label, body] of bodies) {
        const rendered = transformCommandInvocations(body, invocation);

        for (const commandId of HANDOFF_IDS) {
          const expected = formatCommandInvocation(invocation, commandId);
          const where = `${adapter.toolId} ${label} ${commandId}`;

          // Every canonical reference became this tool's spelling. Counting
          // rather than substring-matching catches a partial rewrite, and it
          // holds for the namespaced tools whose spelling is the canonical one.
          expect(occurrenceCount(rendered, expected), where).toBe(
            canonicalCount(body, commandId)
          );
        }
      }
    }
  });

  it('rewrites every reference for each skills-only tool', () => {
    for (const tool of AI_TOOLS) {
      const transform = getSkillReferenceTransformer(tool.value);

      for (const [label, body] of bodies) {
        const rendered = transform(body);

        expect(rendered, `${tool.value} ${label}`).not.toContain('/opsx:');
        expect(occurrenceCount(rendered, 'openspec-propose'), `${tool.value} ${label}`).toBe(
          canonicalCount(body, 'propose')
        );
        expect(
          occurrenceCount(rendered, 'openspec-apply-change'),
          `${tool.value} ${label}`
        ).toBe(canonicalCount(body, 'apply'));
      }
    }
  });

  it('keeps the handoff readable on the shared .agents tree Codex writes', () => {
    for (const [label, body] of bodies) {
      const rendered = transformToCodexCompatibleSkillReferences(body);

      expect(rendered, label).not.toContain('/opsx:');
      expect(
        occurrenceCount(rendered, '$openspec-propose (Codex) ou /openspec-propose (outros agentes)'),
        label
      ).toBe(canonicalCount(body, 'propose'));
      expect(
        occurrenceCount(
          rendered,
          '$openspec-apply-change (Codex) ou /openspec-apply-change (outros agentes)'
        ),
        label
      ).toBe(canonicalCount(body, 'apply'));
    }
  });
});

// Regression for #869: the seamless capture path let explore scaffold a
// change and write artifacts, then said nothing about what came next. An
// agent holding a fresh proposal inside explore mode has an obvious wrong
// next move, which is the one the issue reported.
describe('explore capture path names where the work continues (#869)', () => {
  it('ends the capture by naming propose and apply', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        'Quando a captura solicitada terminar, pare ali e nomeie onde o trabalho continua'
      );
      expect(transition, label).toContain('`/opsx:propose` escreve os artifacts de planejamento restantes');
      expect(transition, label).toContain('`/opsx:apply` implementa a change quando as tarefas existirem');
    }
  });

  it('says that capturing artifacts is not permission to implement them', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      expect(transition, label).toContain(
        'Capturar artifacts nunca começa a implementá-los'
      );
    }
  });
});

// A custom profile can install explore without propose or apply. Explore must
// then not name a handoff to a workflow that was never generated; the agent
// would be sent to a command nobody answers to. Checked through the same
// registries init and update call, on both delivery surfaces.
describe('explore handoffs follow the installed workflow set (#869)', () => {
  const PROFILES: Array<[string, string[], Array<'propose' | 'apply'>]> = [
    ['explore only', ['explore'], ['propose', 'apply']],
    ['explore + propose without apply', ['explore', 'propose'], ['apply']],
  ];

  function exploreSkillBody(workflows: string[]): string {
    const entry = getSkillTemplates(workflows).find(e => e.workflowId === 'explore');
    expect(entry).toBeDefined();
    return entry!.template.instructions;
  }

  function exploreCommandBody(workflows: string[]): string {
    const entry = getCommandContents(workflows).find(e => e.id === 'explore');
    expect(entry).toBeDefined();
    return entry!.body;
  }

  it.each(PROFILES)('%s: generated skills never name a missing workflow', (_name, workflows, missing) => {
    const body = exploreSkillBody(workflows);
    for (const tool of AI_TOOLS) {
      const content = generateSkillContent(
        getSkillTemplates(workflows).find(e => e.workflowId === 'explore')!.template,
        'TEST',
        getSkillReferenceTransformer(tool.value)
      );
      for (const id of missing) {
        const skillName = id === 'propose' ? 'openspec-propose' : 'openspec-apply-change';
        expect(content, `${tool.value} ${id}`).not.toContain(skillName);
      }
    }
    for (const id of missing) {
      expect(body).not.toContain(`/opsx:${id}`);
      expect(transformToCodexCompatibleSkillReferences(body)).not.toMatch(
        new RegExp(`openspec-${id}`)
      );
    }
    expect(body).not.toContain('[[opsx:');
  });

  it.each(PROFILES)('%s: generated commands never name a missing workflow', (_name, workflows, missing) => {
    const contents = getCommandContents(workflows);
    for (const adapter of CommandAdapterRegistry.getAll()) {
      const invocation = getInvocationForAdapter(adapter);
      const explore = generateCommands(contents, adapter).find(c =>
        c.fileContent.includes('Entre no modo explore')
      );
      expect(explore, adapter.toolId).toBeDefined();
      for (const id of missing) {
        expect(explore!.fileContent, `${adapter.toolId} ${id}`).not.toContain(
          formatCommandInvocation(invocation, id)
        );
        expect(explore!.fileContent, `${adapter.toolId} ${id}`).not.toContain(`/opsx:${id}`);
      }
      expect(explore!.fileContent, adapter.toolId).not.toContain('[[opsx:');
    }
    expect(exploreCommandBody(workflows)).not.toContain('[[opsx:');
  });

  it.each(PROFILES)('%s: explore still names a way forward', (_name, workflows) => {
    for (const body of [exploreSkillBody(workflows), exploreCommandBody(workflows)]) {
      expect(body).toContain('Capturar artifacts nunca começa a implementá-los');
      expect(body).toContain('O trabalho acontece a partir dessa change, nunca a partir do modo explore');
    }
  });

  it('keeps both named handoffs when propose and apply are installed (core profile)', () => {
    const core = getProfileWorkflows('core');
    for (const body of [exploreSkillBody([...core]), exploreCommandBody([...core])]) {
      expect(body).toContain('aponte-o para `/opsx:propose`');
      expect(body).toContain('`/opsx:apply` implementa a change quando as tarefas existirem');
    }
  });
});

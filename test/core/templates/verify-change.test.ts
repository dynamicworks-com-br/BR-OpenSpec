import { describe, expect, it } from 'vitest';

import {
  getOpsxVerifyCommandTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getVerifyChangeSkillTemplate();
const command = getOpsxVerifyCommandTemplate();

const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

describe('verify-change templates', () => {
  it('finds spec and design artifacts by output path, not by hardcoded artifact id', () => {
    for (const [label, body] of bodies) {
      expect(body, label).not.toContain('`contextFiles.specs`');
      expect(body, label).not.toContain('`contextFiles.design`');
      expect(body, label).toContain('`artifactPaths.<id>.outputPath`');
      expect(body, label).toContain('sob `specs/`');
      expect(body, label).toContain('`contextFiles.<id>`');
      expect(body, label).toContain('seja ou termine em `design.md`');
    }
  });

  it('keeps active no-task changes eligible for ambiguous selection', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('mostre todas as changes ativas retornadas pela lista');
      expect(body, label).toContain('incluindo changes com `status: "no-tasks"`');
      expect(body, label).not.toContain(
        'show changes that have implementation tasks (tasks artifact exists)'
      );
    }
  });

  it('prefers schema-aware apply task fields without assuming a tasks artifact id', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('campos de topo `tasks` e `progress`');
      expect(body, label).toContain('configuração `apply.tracks` do schema');
      expect(body, label).toContain('agregados de cada arquivo concreto legível casado');
      expect(body, label).toContain('independentemente do ID do artifact rastreado');
      expect(body, label).toContain('não infira o rastreamento a partir de uma chave de `contextFiles`');
    }
  });

  it('marks partial tracking evidence as not verified', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Se `unavailableTrackingFiles` não estiver vazio');
      expect(body, label).toContain('inclua cada caminho indisponível e a razão');
      expect(body, label).toContain('não infira conclusão a partir dos campos parciais `tasks` e `progress`');
    }
  });


  it('does not lose incomplete checkboxes omitted from the task list', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Se `progress.remaining` for maior que 0');
      expect(body, label).toContain('checkboxes incompletos sem descrição');
      expect(body, label).toContain('Não infira conclusão apenas a partir das tarefas listadas');
    }
  });

  it('requires usable evidence rather than just existing artifact paths', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('não puderem ser lidos ou não contiverem requisitos, cenários ou decisões de design utilizáveis');
      expect(body, label).toContain('Continue as verificações sustentadas pela evidência restante');
      expect(body, label).toContain('um conjunto de entrada parcialmente verificado não é uma verificação totalmente verificada');
      expect(body, label).toContain('Se as mudanças de implementação não puderem ser identificadas, marque **Code Pattern Consistency** como not verified');
    }
  });

  it('does not mistake apply readiness for verification or execute apply instructions', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Trate `state` e `instruction` do apply como contexto, não como veredito de verificação');
      expect(body, label).toContain('Não implemente tarefas nem arquive a change durante a verificação');
    }
  });

  it('preserves optional artifacts and the existing archive workflow', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('A verificação é consultiva');
      expect(body, label).toContain('`skip_specs: true`');
      expect(body, label).toContain('schemas sem rastreamento de tarefas');
      expect(body, label).toContain('Não exija nem invente artifacts opcionais ou omitidos de propósito');
      expect(body, label).toContain('Marque como **Not applicable** as verificações que o schema não define, ou artifacts que o status reporta como ignorados de propósito');
      expect(body, label).toContain('Exclua-as das contagens de verificações puladas e da avaliação de prontidão para arquivar');
      expect(body, label).toContain('Se `taskTrackingConfigured` for false, reporte **Task Completion** como not applicable');
      expect(body, label).toContain('Se `taskTrackingConfigured` for true e `tasks` estiver vazio, marque **Task Completion** como not verified');
      expect(body, label).toContain('`Not verified` descreve um limite deste relatório, não um novo pré-requisito de arquivamento');
      expect(body, label).toContain('O archive mantém as próprias verificações e o comportamento de confirmação do usuário');
    }
  });

  it('preserves task-only verification without dropping checks supported by other artifacts', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Se apenas evidência de tarefas estiver disponível para as verificações aplicáveis, verifique somente a conclusão das tarefas');
      expect(body, label).toContain('incluindo **Code Pattern Consistency**, como not verified');
      expect(body, label).toContain('Com outros artifacts de apoio, **Code Pattern Consistency** ainda roda');
    }
  });

  it('covers warning and suggestion outcomes without claiming all checks passed', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('Se não houver issues CRITICAL, houver um ou mais warnings e nenhuma verificação foi pulada');
      expect(body, label).toContain('Se houver apenas suggestions e nenhuma verificação foi pulada');
      expect(body, label).toContain('Inclua a contagem de suggestions quando for diferente de zero');
    }
  });

  it('maps missing supporting artifacts to every check they prevent', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'marque **Spec Coverage**, **Requirement Implementation Mapping** e **Scenario Coverage** como not verified'
      );
      expect(body, label).toContain('marque **Design Adherence** como not verified');
      expect(body, label).toContain('**Code Pattern Consistency** ainda roda');
    }
  });

  it('never reports a skipped check as passing or archive-ready', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('`Not verified (<razão>)` para cada verificação pulada');
      expect(body, label).toContain('Nunca pontue uma verificação pulada como aprovada');
      expect(body, label).toContain('Trate toda verificação not verified ou parcialmente verificada como pulada na avaliação final');
      expect(body, label).toContain('Se alguma verificação foi pulada e não houver issues CRITICAL');
      expect(body, label).toContain(
        'Se alguma verificação foi pulada, nomeie também cada verificação pulada e a razão'
      );
      expect(body, label).toContain('não afirme prontidão');
      expect(body, label).toContain('Se não houver issues e nenhuma verificação foi pulada');
    }
  });
});

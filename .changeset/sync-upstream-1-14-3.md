---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec (pós-v1.11.0 `d0071d73` → `@fission-ai/openspec@1.14.3` `c794978f`). A versão do fork permanece 2.3.0 até o PR de versionamento.

### Novos recursos

- **`openspec list --archived` e `--all`** — lista alterações arquivadas e, no JSON, inclui a raiz real do projeto. `--archived` e `--all` só valem ao listar alterações.
- **`openspec version`** — informa a versão instalada, a origem e se há atualização. `--upgrade` não faz parte deste porte.
- **Alterações aninhadas** — um diretório que só agrupa outras alterações não é listado, visualizado, arquivado nem tratado como alteração. O archive recusa com diagnóstico de máquina (`archive_change_is_namespace_folder`).
- **`openspec archive --json`** — um único documento no stdout: sucesso com `specsUpdated` e avisos, ou `archive: null` com `status` quando a limpeza da aposentadoria ou uma falha anterior à mutação impede um sucesso silencioso.
- **Avisos no apply** — uma alteração pronta sem deltas de spec e sem `skip_specs: true` é avisada, assim como um delta escrito fora de `specs/<capability>/spec.md`. O rastreamento de tarefas segue cada arquivo concreto de `apply.tracks`, inclusive globs, e registra arquivos ilegíveis em vez de descartar o restante.
- **Próximo passo no status** — o texto e o JSON (`nextSteps`) nomeiam o mesmo comando. Instruções de artefato glob incluem `resolvedOutputPath` e `existingOutputPaths`.
- **Init** — diretórios vazios de specs e archive ganham `.gitkeep`; o seletor de ferramentas aceita aliases; o sucesso nomeia os workflows que o perfil deixou de fora; a dica de reinício da IDE só aparece quando faz diferença.

### Correções

- **Caminhos** — um symlink de spec que sai do projeto é recusado em validate/show/list. O nome de alteração e o id de spec são validados segmento a segmento. O relativo do delta arquivado é medido antes da movimentação, então um `changes/` ou `specs/` linkado não acusa delta alterado.
- **Apply bloqueado** — a cadeia de pré-requisitos ausentes é nomeada na ordem de construção, sem apontar para um workflow que o perfil não instalou.
- **Instruções** — tags do envelope de artefato são escapadas. O placeholder de Purpose `A definir` conta como placeholder do archive.
- **Completions** — o zsh completa nomes de schema. A dica de instalação grava o arquivo temporário de forma atômica.

### Fora deste porte

O subsistema de stores (workspace, planning home, doctor, `--store`) continua adiado. Website, docs-lab, changesets e changelog do upstream não foram importados. O publish segue com `NPM_TOKEN`. O gerenciador permanece pnpm 9 e o Vitest permanece na linha 3.

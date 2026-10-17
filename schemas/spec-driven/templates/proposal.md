## Why

<!-- Explique a motivação desta mudança. Qual problema ela resolve? Por que agora? -->

## What Changes

<!-- Descreva o que vai mudar. Seja específico sobre novas capacidades, modificações ou remoções. -->

## Capabilities

### New Capabilities
<!-- Capacidades sendo introduzidas. Use kebab-case nos segmentos de caminho que você
     introduzir (ex.: user-auth ou identity/user-auth), seguindo a organização de specs
     já existente no projeto. Cada uma cria specs/<capability-path>/spec.md. -->
- `<capability-path>`: <descrição breve do que esta capacidade abrange>

### Modified Capabilities
<!-- Capacidades existentes cujos REQUIREMENTS estão mudando (não apenas a implementação).
     Liste aqui somente se o comportamento em nível de spec mudar. Cada uma precisa de um arquivo de spec delta.
     Use o caminho exato existente em openspec/specs/. Deixe vazio se nenhum requisito mudar.
     Uma change sem nenhuma capacidade (refatoração pura, ferramental, docs)
     deve definir `skip_specs: true` em seu .openspec.yaml - openspec validate rejeita
     uma change com zero deltas sem esse marcador. Não invente um requisito só para
     satisfazer a validação. -->
- `<existing-capability-path>`: <qual requisito está mudando>

## Impact

<!-- Código, APIs, dependências e sistemas afetados -->

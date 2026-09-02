# BR-OpenSpec Scripts

Utility scripts for BR-OpenSpec maintenance and development.

## update-flake.sh

Updates `flake.nix` pnpm dependency hash automatically.

**When to use**: After updating dependencies (`pnpm install`, `pnpm update`).

**Usage**:
```bash
./scripts/update-flake.sh
```

**What it does**:
1. Reads version from `package.json` (dynamically used by `flake.nix`)
2. Automatically determines the correct pnpm dependency hash
3. Updates the hash in `flake.nix`
4. Verifies the build succeeds

**Example workflow**:
```bash
# After dependency updates
pnpm install
./scripts/update-flake.sh
git add flake.nix
git commit -m "chore: update flake.nix dependency hash"
```

## regen-parity-hashes.mjs

Recalcula os hashes de referência fixados em
`test/core/templates/skill-templates-parity.test.ts`.

**Quando usar**: após qualquer alteração intencional em templates de workflow, e
após um rebase de branch que edite templates — duas branches que tocam templates
diferentes colidem no mesmo mapa de hashes, e editar manualmente hashes de 64
caracteres durante um conflito é onde acontecem erros de transcrição.

**Uso**:
```bash
pnpm build && pnpm generate:skills && pnpm regen:parity-hashes
pnpm vitest run test/core/templates/skill-templates-parity.test.ts
```

**O que faz**:
1. Recusa rodar se `dist/` não existir ou for mais antigo que `src/` — os hashes
   vêm do build, enquanto o teste de paridade lê `src/`, então regenerar contra
   um build desatualizado grava hashes que o teste rejeita em seguida
2. Recalcula cada hash fixado a partir do `dist/` compilado
3. Reescreve o mapa in place e imprime quais entradas mudaram
4. Sai com código não-zero, sem escrever nada, se não conseguir explicar cada
   hash fixado: um rótulo sem export correspondente (template renomeado ou
   removido), ou uma linha de hash que os padrões não reconhecem. Ambos ficariam
   desatualizados enquanto a execução reportasse sucesso, então "nada a
   atualizar" sempre significa o que diz.

As quebras de linha sobrevivem intactas, então um checkout CRLF é seguro —
`test/**` não tem atributo `text eol=lf`, então o arquivo chega com CRLF no
Windows.

O teste de paridade recalcula os mesmos hashes de forma independente, então este
script não consegue produzir um valor errado silenciosamente. Sempre rode o
teste depois; ele, e não este script, é a autoridade.

A reescrita vive em `parity-hash-shared.mjs` para que suas proteções possam ser
exercitadas contra entradas fabricadas — veja
`test/core/templates/parity-hash-shared.test.ts`. Um teste que rodasse este
script de verdade reescreveria o próprio arquivo de teste de paridade do
repositório no meio da suíte.

**Nota BR-OpenSpec**: no fork, alterações em templates também exigem regenerar a
distribuição skills.sh — por isso o `pnpm generate:skills` no fluxo acima, antes
da regeneração dos hashes (ver "skills.sh distribution" no AGENTS.md). Rode
também `pnpm vitest run test/core/templates/skillssh-parity.test.ts` para
confirmar a paridade dos skills gerados.

## pack-version-check.mjs

Validates package version consistency before publishing.

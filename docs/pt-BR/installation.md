# Instalação

## Pré-requisitos

- **Node.js 20.19.0 ou superior** — Verifique sua versão: `node --version`

## Gerenciadores de Pacotes

### npm

```bash
npm install -g @dynamicworks/br-openspec@latest
```

### pnpm

```bash
pnpm add -g @dynamicworks/br-openspec@latest
```

### yarn

```bash
yarn global add @dynamicworks/br-openspec@latest
```

### bun

O Bun consegue instalar o BR-OpenSpec globalmente, mas o BR-OpenSpec atualmente roda sobre o Node.js.
Você ainda precisa ter o Node.js 20.19.0 ou superior disponível no `PATH`.

```bash
bun add -g @dynamicworks/br-openspec@latest
```

## Nix

> **Nota:** O Nix requer features experimentais habilitadas. Adicione `experimental-features = nix-command flakes` ao seu `~/.config/nix/nix.conf` ou use as flags `--extra-experimental-features nix-command --extra-experimental-features flakes` em cada comando.

Execute o BR-OpenSpec diretamente sem instalação:

```bash
nix run github:dynamicworks-com-br/BR-OpenSpec -- init
```

Ou instale no seu perfil:

```bash
nix profile install github:dynamicworks-com-br/BR-OpenSpec
```

Ou adicione ao seu ambiente de desenvolvimento em `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    openspec.url = "github:dynamicworks-com-br/BR-OpenSpec";
  };

  outputs = { nixpkgs, openspec, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [ openspec.packages.x86_64-linux.default ];
    };
  };
}
```

## Verificar Instalação

```bash
openspec --version
```

## Atualizando

Atualize o pacote, depois atualize os arquivos gerados de cada projeto:

```bash
npm install -g @dynamicworks/br-openspec@latest   # ou equivalente em pnpm/yarn/bun
openspec update                                   # rode dentro de cada projeto
```

`openspec update` regenera os arquivos de skill e comando para as ferramentas que você configurou, de modo que seus slash commands fiquem em dia com a versão instalada. Ele também verifica se uma CLI mais nova foi publicada e oferece a atualização, já que atualizar é o que disponibiliza os novos fluxos de trabalho em primeiro lugar — veja [Referência da CLI](cli.md#openspec-update).

## Desinstalando

Não existe um comando `openspec uninstall`, porque o BR-OpenSpec é apenas um pacote global mais alguns arquivos no seu projeto. Removê-lo são alguns passos manuais, e nada aqui toca no seu código-fonte.

**1. Remova o pacote global:**

```bash
npm uninstall -g @dynamicworks/br-openspec
pnpm remove -g @dynamicworks/br-openspec
yarn global remove @dynamicworks/br-openspec
bun remove -g @dynamicworks/br-openspec
```

**2. Remova o BR-OpenSpec de um projeto (opcional).** Delete o diretório `openspec/` se você não quiser mais suas specs e mudanças:

```bash
# Unix/macOS/Linux
rm -rf openspec/
```

```powershell
# Windows (PowerShell)
Remove-Item -Recurse -Force .\openspec
```

Pense antes de fazer isso: `openspec/specs/` e `openspec/changes/archive/` são seu registro de como o sistema se comporta e por que mudou. Se você puder querer esse histórico, mantenha a pasta (ou mantenha-a no git) mesmo depois de desinstalar.

**3. Remova os arquivos gerados das ferramentas de IA (opcional).** O BR-OpenSpec escreve arquivos de skill e comando em diretórios por ferramenta como `.claude/skills/openspec-*/`, `.cursor/commands/opsx-*` e assim por diante. Delete as skills `openspec-*` e os comandos `opsx-*` das ferramentas que você configurou. Os caminhos exatos por ferramenta estão listados em [Ferramentas Suportadas](supported-tools.md).

Se você também tem blocos de marcação do BR-OpenSpec em arquivos como `CLAUDE.md` ou `AGENTS.md`, remova esses blocos manualmente; seu próprio conteúdo nesses arquivos é seu para manter.

## Próximos Passos

Após instalar, inicialize o BR-OpenSpec no seu projeto:

```bash
cd seu-projeto
openspec init
```

Veja [Primeiros Passos](getting-started.md) para um guia completo.

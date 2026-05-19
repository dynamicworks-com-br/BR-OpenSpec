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

## Próximos Passos

Após instalar, inicialize o BR-OpenSpec no seu projeto:

```bash
cd your-project
openspec init
```

Veja [Primeiros Passos](../getting-started.md) para um guia completo.

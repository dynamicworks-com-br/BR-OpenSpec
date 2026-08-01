# Instalação

## Pré-requisitos

- **Node.js 20.19.0 ou superior** — Verifique sua versão: `node --version`

## Instale com seu assistente de IA

Não quer fazer isso manualmente? Cole o prompt abaixo em qualquer assistente de código que consiga rodar comandos de shell — Claude Code, Codex, Cursor, Gemini CLI, Copilot e as demais [ferramentas suportadas](supported-tools.md). Ele instala a CLI, inicializa este projeto e reporta o que realmente aconteceu.

Os passos manuais abaixo são a fonte da verdade — o prompt apenas os executa por você. Se o seu assistente parar e te devolver algo, é por design: ele pede permissão antes de qualquer ação privilegiada e nunca edita seus arquivos de inicialização do shell. Conclua essas partes você mesmo com [Gerenciadores de Pacotes](#gerenciadores-de-pacotes) e [Solução de Problemas](troubleshooting.md).

```text
Instale o BR-OpenSpec neste projeto e configure-o para mim. Siga estes passos
em ordem, e pare onde um passo mandar você parar.

1. RUNTIME. Rode `node --version`. O BR-OpenSpec precisa de Node.js 20.19.0 ou
   superior. Se o Node estiver ausente ou for mais antigo, avise e pare — não
   instale o Node, não troque de versão nem reconfigure meu gerenciador de
   versões por mim.

2. INSTALAÇÃO. Use o gerenciador de pacotes que já estiver no meu PATH, de
   preferência o npm:
     npm install -g @dynamicworks/br-openspec@latest
     pnpm add -g @dynamicworks/br-openspec@latest
     bun add -g @dynamicworks/br-openspec@latest
     yarn global add @dynamicworks/br-openspec@latest   (somente Yarn 1.x)
   Não escolha com base no lockfile deste projeto — uma instalação global não
   tem nada a ver com como as dependências deste repositório são instaladas.
   Se nenhum desses quatro estiver disponível, pare e me avise — não improvise
   uma instalação. (Se eu estiver no Nix, aponte-me para a seção Nix da
   documentação de instalação do BR-OpenSpec.)
   Mostre-me o comando exato e espere minha confirmação antes de rodá-lo; isso
   instala software fora do projeto, e eu posso preferir que outro gerenciador
   de pacotes cuide dele.
   Pare e me pergunte de novo se a instalação precisar de sudo ou direitos de
   administrador, falhar com erro de permissão, ou reportar que o diretório bin
   global está ausente ou não configurado. Nunca edite meus arquivos de
   inicialização do shell (.bashrc, .zshrc, .profile, fish, perfil do
   PowerShell), e nunca rode um comando de setup que os edite por mim —
   mostre-me a mudança e deixe que eu a faça.

3. PATH. Rode `openspec --version`. Se o comando não for encontrado, ele pode
   apenas estar fora do PATH deste shell: diga-me onde o gerenciador de pacotes
   o instalou e como adicionar esse diretório ao PATH do meu shell e do meu SO,
   e então pare até eu confirmar. Se ele imprimir uma versão mais antiga do que
   a que a instalação acabou de reportar, uma cópia anterior está fazendo
   shadow no PATH — informe as duas versões em vez de continuar. Se eu uso um
   gerenciador de versões, avise em vez de editar o PATH em volta dele: com nvm
   ou fnm a CLI fica atrelada à versão do Node que estava ativa quando você a
   instalou, e com asdf ou volta pode ser preciso regerar um shim.

4. INICIALIZAÇÃO. Pergunte-me qual(is) ferramenta(s) de codificação com IA eu
   uso e mapeie cada uma para um id do `openspec init --help` (Copilot é
   `github-copilot`, Zoo Code é `roocode`). `--tools` aceita uma lista separada
   por vírgulas, então nomeie todas elas.
   `openspec init --tools <ids>` apaga sobras de versões antigas do BR-OpenSpec
   automaticamente, sem perguntar — incluindo arquivos de prompt `opsx-*.md` no
   meu diretório home (o Codex os guarda em ~/.codex/prompts). Antes de rodar,
   procure por elas: pastas `.../commands/openspec/`, blocos de marcação do
   BR-OpenSpec em arquivos como CLAUDE.md ou AGENTS.md, e prompts `opsx-*.md`
   no diretório home. Liste o que encontrar e espere meu sinal verde; se não
   encontrar nada, diga isso e siga em frente sem perguntar. Uma pasta
   `openspec/` existente não é problema — o init a atualiza e deixa minhas
   specs e mudanças intactas.
   Confirme também que estou na pasta certa: o init cria `openspec/` onde quer
   que rode, inclusive dentro de um pacote de monorepo.
   Então rode: openspec init --tools <ids>

5. RELATÓRIO. Não presuma o que deveria existir — diga-me o que o init
   realmente imprimiu: quantas skills e/ou comandos ele criou e onde, a linha
   do arquivo de config, qualquer nota de configuração pendente e o que
   reiniciar ou recarregar. Algumas ferramentas são somente-skills e
   corretamente criam zero arquivos de comando, então comandos ausentes não são
   falha por si só. Se o init disse que nada foi gerado, repasse a correção que
   ele sugeriu em vez de tentar de novo. Termine me dizendo como invocar o
   BR-OpenSpec na minha ferramenta, e pegue a grafia exata dos arquivos que o
   init criou em vez da linha de resumo dele: a pontuação varia por ferramenta
   (/opsx:propose em algumas, /opsx-propose em outras, @opsx-propose no
   Amazon Q), e ferramentas que recebem skills em vez de comandos são invocadas
   pelo nome da skill (/openspec-propose, ou $openspec-propose no Codex, ou
   /skill:openspec-propose no Kimi Code).
```

Nada no prompt é específico de fornecedor: são instruções simples mais os mesmos comandos documentados nesta página. Funciona no macOS, Linux e Windows, e ele para de propósito em vez de improvisar quando um passo precisa da sua permissão. Seu assistente precisa conseguir rodar comandos de shell — algumas integrações de IDE não conseguem.

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

O Yarn 2 e superior (Berry) removeu o comando `global`. Nessas versões, instale o BR-OpenSpec com npm, pnpm ou bun — uma CLI global não precisa usar o mesmo gerenciador de pacotes do seu projeto.

### deno

O Deno às vezes tem problemas para interpretar a tag @latest, mas podemos especificar uma versão na instalação inicial.
Se isso acontecer, tente trocar a tag @latest pela versão, algo como `@^2.2.0`

```bash
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@dynamicworks/br-openspec@latest
# ou
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@dynamicworks/br-openspec@^2.2.0
```

Nota: se algum subcomando lançar ferramentas externas, como config edit, feedback ou workspace open, pode ser necessário um --allow-run=<programa> com escopo.

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

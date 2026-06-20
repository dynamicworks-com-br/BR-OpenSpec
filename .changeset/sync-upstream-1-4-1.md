---
"@dynamicworks/br-openspec": minor
---

Sincroniza com o upstream Fission-AI/OpenSpec v1.4.1.

### Novos recursos

- **Suporte ao Mistral Vibe** — o `openspec init` passa a configurar o Mistral Vibe como ferramenta baseada em skills usando `.vibe/skills/`.
- **Workflow de sync no perfil padrão** — o perfil `core` agora inclui o workflow de sincronização, então novas instalações já geram as skills e os comandos `/opsx:sync`.

### Correções

- **Cabeçalhos de requisito sem distinção de maiúsculas/minúsculas** — os cabeçalhos `### Requirement:` passam a ser interpretados independentemente da capitalização (e sem espaço após `###`), evitando falhas de parsing.
- **Conclusão de comandos no zsh com Oh My Zsh** — o tab completion deixa de duplicar o `compinit` sob o Oh My Zsh; a auto-configuração do `.zshrc` ocorre apenas no Zsh padrão.
- **Resolução de caminhos de dados global** — separadores de caminho determinísticos por plataforma (Windows/POSIX) em `getGlobalDataDir`.

### Outros

- **Dicas de validação mais claras** — quando um requisito tem SHALL/MUST apenas no cabeçalho, o `openspec validate` indica mover a palavra-chave para o corpo do requisito.
- **Integração de ferramentas alinhada** — o rótulo do Kimi acompanha o upstream (`Kimi CLI`) e as listas de ferramentas de IA (docs EN/PT-BR) ficam consistentes.

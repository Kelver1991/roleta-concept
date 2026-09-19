# Roleta Concept

Roleta de temas e acompanhamento dos vídeos por consultor, adaptada para celular.

Site: https://kelver1991.github.io/roleta-concept/

## Uso

1. Digite ou escolha o nome do consultor e gire a roleta. O nome, tema e data são salvos juntos.
2. Quando receber o vídeo, abra **Histórico e pendentes** e escolha **Abrir para avaliar**.
3. Preencha as cinco notas e o feedback. As alterações são salvas automaticamente; **Salvar e continuar depois** permite confirmar o rascunho.
4. Toque em **Concluir avaliação** para incluir a nota na média do consultor. Alterar notas ou feedback de uma avaliação concluída exige concluí-la novamente.

O ranking considera apenas avaliações concluídas e usa o mês do sorteio como período. Nomes com diferenças apenas de espaços ou maiúsculas são agrupados. Cada sorteio é um registro separado. Abrir um novo ciclo preserva os registros antigos.

## Armazenamento

Os registros ficam no `localStorage` do aparelho e navegador usados. Não são enviados ao GitHub nem sincronizados entre dispositivos. Evite navegação privada. Limpar dados do navegador pode apagar o histórico.

Em **Cópia de segurança**, baixe um backup JSON. A restauração acrescenta registros ausentes; registros com o mesmo identificador não são sobrescritos. Para transferir uma versão completa e atualizada, restaure em um navegador sem registros existentes.

A versão anterior mantinha apenas o ciclo de temas, sem nomes e avaliações. Esse ciclo é preservado na atualização, mas não é possível reconstruir registros antigos sem essas informações.

## Validação

Com Node.js, Playwright e Chrome instalados: `node verify-records.cjs`. Também é possível apontar `PLAYWRIGHT_MODULE` para uma instalação existente do Playwright.

Os testes cobrem retomada, isolamento de avaliações, notas zero, médias, migração do ciclo, backup, restauração, conflito entre abas, falhas de armazenamento e larguras de celular. Safari em iPhone físico deve ser validado no aparelho.

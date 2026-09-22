CANTUS DEI - AJUSTE V6.2

ALTERAÇÕES

1. QUEM VAI SERVIR
Foi retirada a confirmação individual de presença da tela da celebração.

Agora a seção "Quem vai servir?" serve apenas para:
- marcar os músicos da escala
- salvar a escala junto com a celebração

Não aparecem mais:
- Confirmar presença
- Não poderei participar
- status PENDENTE na edição da celebração

O banco pode continuar mantendo o campo de confirmação internamente,
mas ele não participa mais desse fluxo visual.

2. PUBLICAÇÃO E LINKS
Foi reforçado o fluxo após clicar em "Publicar celebração".

Antes de redirecionar ao calendário o sistema grava temporariamente:
- ID da celebração
- URL pública
- token
- grupo

Ao abrir o calendário, a tela recupera a URL por:
1. state da navegação
2. localStorage
3. tokenPublico salvo na celebração

Assim o painel "Celebração publicada com sucesso" deve aparecer
mesmo se o reload/listagem da API demorar.

O painel mostra:
- link público
- copiar link
- WhatsApp
- modo palco
- QR Code

Ao publicar, o calendário também rola automaticamente para o topo
para que o painel de compartilhamento fique visível.

COMO APLICAR

1. Extraia este ZIP na raiz:
D:\GitHub\cantus-dei

2. Execute:
python APLICAR-AJUSTE-V6-2.py

3. Depois:
npm run build

4. Se passar:
git add .
git commit -m "Remove confirmacao da escala e reforca links de publicacao"
git push origin main

Não precisa executar SQL.
Não altera Neon.
Não precisa alterar Render manualmente.

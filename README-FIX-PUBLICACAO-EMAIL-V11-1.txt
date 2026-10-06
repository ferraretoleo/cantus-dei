CANTUS DEI - FIX V11.1

Problema:
a celebração era publicada no banco, mas a rota aguardava o Gmail terminar
todos os envios antes de responder ao navegador. Se o SMTP demorasse,
a tela ficava presa em "Publicando...".

Correção:
- publicação responde imediatamente ao frontend
- envio de e-mail continua em segundo plano no Render
- falha de SMTP não bloqueia a publicação
- timeouts adicionados ao SMTP:
  - conexão: 10s
  - saudação: 10s
  - socket: 15s

Não precisa SQL.
Não altera frontend.
Não altera Cloudflare Cron.

Aplicar:

cd D:\GitHub\cantus-dei
python APLICAR-FIX-PUBLICACAO-EMAIL-V11-1.py
npm run build

Se passar:

git add .
git commit -m "Desacopla email da publicacao"
git push origin main

Depois teste uma publicação.
A tela deve sair de "Publicando..." normalmente.
O e-mail pode chegar alguns segundos depois.

Se o e-mail falhar, consulte os logs do Render.

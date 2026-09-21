CANTUS DEI - FIX FAILED TO FETCH AO EXCLUIR GRUPO

SINTOMA
Ao clicar em "Excluir este grupo", o navegador mostra:

Failed to fetch

DIAGNOSTICO
A chamada DELETE não chegou ao Render.
O frontend precisa realizar um preflight CORS antes do DELETE.

A API foi ajustada para permitir explicitamente:

GET
HEAD
POST
PUT
PATCH
DELETE
OPTIONS

E os headers:

Content-Type
Authorization

IMPORTANTE - RENDER

Na variável CORS_ORIGIN, use os endereços reais do frontend separados por vírgula.

Para o ambiente atual:

https://app.cantus-dei.workers.dev,https://site.cantus-dei.workers.dev,http://localhost:5173

Não coloque barra "/" no final.

APLICAÇÃO

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Corrige CORS para exclusao de grupos"
git push origin main

4. No Render:
Environment > CORS_ORIGIN

Defina:

https://app.cantus-dei.workers.dev,https://site.cantus-dei.workers.dev,http://localhost:5173

5. Aguarde o deploy do Render.

6. Atualize o Cantus Dei com Ctrl+F5 e teste novamente.

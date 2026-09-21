CANTUS DEI - CORREÇÃO DELETE SEM BODY

ERRO:
Body cannot be empty when content-type is set to 'application/json'

CAUSA:
O helper apps/web/src/lib/api.ts adicionava:

Content-Type: application/json

em todas as chamadas, inclusive DELETE sem body.

O Fastify interpreta isso como uma requisição JSON e espera conteúdo no corpo.

CORREÇÃO:
Content-Type só é enviado quando realmente existe body.

ARQUIVO ALTERADO:
apps/web/src/lib/api.ts

COMO APLICAR:

1. Extraia sobre:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Corrige DELETE sem body no helper da API"
git push origin main

4. Aguarde o deploy do Cloudflare.

Não precisa alterar:
- Render
- Neon
- banco
- variáveis de ambiente

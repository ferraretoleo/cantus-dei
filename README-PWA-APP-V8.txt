CANTUS DEI - ÍCONE PWA DA APLICAÇÃO V8

Este pacote altera a APLICAÇÃO principal Cantus Dei:
https://app.cantus-dei.workers.dev

Não é o site de divulgação.

ARQUIVOS NOVOS
apps/web/public/manifest.webmanifest
apps/web/public/sw.js
apps/web/public/cantus-icon-192-v8.png
apps/web/public/cantus-icon-512-v8.png
apps/web/public/apple-touch-icon-v8.png
apps/web/public/favicon-32-v8.png

ALTERADO
apps/web/index.html

APLICAÇÃO
1. Extraia o ZIP na raiz:
D:\GitHub\cantus-dei

2. Execute:
python APLICAR-PWA-ICONE-APP-V8.py

3. Build:
npm run build

4. Se passar:
git add .
git commit -m "Adiciona icone PWA na aplicacao Cantus Dei"
git push origin main

COMPORTAMENTO
Android/Chrome:
- Instalar app / Adicionar à tela inicial usa o novo ícone.
- O manifest e o service worker foram versionados como V8.

iPhone/iPad:
- Novas instalações usam o novo apple-touch-icon.
- O iOS normalmente não atualiza o ícone de um atalho já existente.
- Nesses casos, remova o atalho antigo e adicione novamente pelo Safari.

Não precisa SQL.
Não altera a API do Render.
A mudança é somente no frontend Vite/Cloudflare.

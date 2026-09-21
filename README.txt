CANTUS DEI - MOMENTOS LITÚRGICOS

Esta fase adiciona:

- Lista dos 12 momentos litúrgicos padrão
- Momentos personalizados por grupo
- Vínculo de uma música com um ou vários momentos
- Tela de administração dos momentos
- Seleção dos momentos dentro do cadastro/edição da música
- Validação no backend para impedir vínculo com momentos de outro grupo

ARQUIVOS

apps/api/src/routes/momentos.ts
apps/api/src/server.ts
apps/web/src/pages/MomentosLiturgicos.tsx
apps/web/src/pages/Musicas.tsx
apps/web/src/components/GroupHeader.tsx
apps/web/src/App.tsx
database/002_seed_momentos.sql

COMO APLICAR

1. Extraia o ZIP na raiz:
D:\GitHub\cantus-dei

2. No Neon SQL Editor, execute:
database/002_seed_momentos.sql

Este SQL é idempotente. Ele só cria os momentos padrão que estiverem faltando.

3. Rode os builds:

npm run build -w @cantus-dei/shared
npm run build -w @cantus-dei/api
npm run build -w @cantus-dei/web

4. Se tudo passar:

git add .
git commit -m "Adiciona momentos liturgicos e vinculo com musicas"
git push origin main

ROTAS NOVAS

GET    /grupos/:id/momentos
POST   /grupos/:id/momentos
DELETE /grupos/:id/momentos/:momentoId

GET    /grupos/:id/musicas/:musicaId/momentos
PUT    /grupos/:id/musicas/:musicaId/momentos

PRÓXIMA FASE

Calendário de Missas
Criação da celebração
Seleção do repertório por momento litúrgico
Escala dos músicos

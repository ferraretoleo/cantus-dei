CORREÇÃO MASTER COMPLETA

O erro do Render ocorre porque:
apps/api/src/routes/master.ts usa users.perfilGlobal
mas apps/api/src/db/schema.ts ainda não tinha essa coluna.

Este pacote corrige também toda a integração necessária para o MASTER funcionar.

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. No Neon execute:
database\003_master_global.sql

3. No Render adicione:
MASTER_EMAIL=SEU_EMAIL_DE_LOGIN

4. Localmente execute:
npm run build

5. Se passar:
git add .
git commit -m "Corrige e conclui perfil global MASTER"
git push origin main

6. Depois que Render e Cloudflare publicarem:
saia do sistema e entre novamente.

O login cujo e-mail for igual a MASTER_EMAIL será promovido automaticamente para MASTER.

A tela /master permitirá:
- visualizar usuários
- promover usuários para MASTER
- remover MASTER de outros usuários
- impedir remoção do próprio MASTER

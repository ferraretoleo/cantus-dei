CANTUS DEI - EXCLUSÕES MASTER + CASCATA

IMPLEMENTADO

MASTER GLOBAL pode:
- excluir usuários
- excluir grupos
- excluir paróquias

REGRAS

1. EXCLUIR PARÓQUIA
Ao excluir uma paróquia:
- exclui a própria paróquia
- exclui os grupos daquela paróquia
- exclui integrantes desses grupos
- exclui convites
- exclui músicas
- exclui momentos
- exclui missas
- exclui repertórios
- exclui escalas

As demais paróquias permanecem intactas.

2. EXCLUIR GRUPO
Ao excluir um grupo:
- exclui somente aquele grupo
- exclui tudo que pertence àquele grupo
- NÃO exclui a paróquia
- NÃO exclui os demais grupos da paróquia

3. EXCLUIR USUÁRIO
Ao excluir um usuário:
- exclui a conta
- exclui vínculos com paróquias
- exclui vínculos com grupos
- exclui participações em escalas

NÃO exclui:
- paróquias
- grupos
- missas
- repertórios

Missas e convites criados pelo usuário permanecem no histórico,
mas o campo criado_por/convidado_por passa a NULL.

4. PROTEÇÃO DO MASTER
O usuário MASTER atualmente logado não pode excluir a própria conta.

CONFIRMAÇÕES NA INTERFACE

Paróquia:
- exige digitar exatamente o nome da paróquia

Grupo:
- exige digitar exatamente o nome do grupo

Usuário:
- exige digitar exatamente o e-mail do usuário

ORDEM DE INSTALAÇÃO

1. Faça backup do Neon.

2. No Neon SQL Editor execute:
database/005_exclusoes_master_cascade.sql

3. Extraia este pacote por cima de:
D:\GitHub\cantus-dei

4. Execute:
npm run build

5. Se passar:
git add .
git commit -m "Adiciona exclusoes MASTER com cascata segura"
git push origin main

6. Aguarde o deploy do Render e Cloudflare.

ARQUIVOS ALTERADOS

- apps/api/src/db/schema.ts
- apps/api/src/routes/master.ts
- apps/web/src/pages/MasterAdmin.tsx
- database/005_exclusoes_master_cascade.sql

CANTUS DEI - EXCLUSÃO DE GRUPOS

PERMISSÕES

Pode excluir um grupo:
- MASTER global
- RESPONSAVEL pelo grupo

Não pode excluir:
- COORDENADOR
- MUSICO
- usuário comum que não seja responsável pelo grupo

SEGURANÇA

Antes da exclusão, a interface exige que o usuário digite exatamente
o nome do grupo.

A exclusão é definitiva.

A estrutura atual do banco já possui ON DELETE CASCADE nas principais
relações do grupo, portanto não é necessário executar SQL.

MASTER

Na tela Administração MASTER foi adicionada uma seção:
Grupos cadastrados

O MASTER pode visualizar e excluir qualquer grupo.

RESPONSAVEL

Na página principal do grupo aparece:
Zona de atenção > Excluir este grupo

COMO APLICAR

1. Extraia por cima de:
D:\GitHub\cantus-dei

2. Execute:
npm run build

3. Se passar:
git add .
git commit -m "Permite MASTER e responsavel excluir grupos"
git push origin main

Não precisa alterar Neon nem variáveis de ambiente.

CANTUS DEI - EDIÇÃO DE USUÁRIOS V9

Sem remover ou alterar os fluxos existentes.

MASTER GLOBAL
Pode editar qualquer usuário:
- nome
- e-mail
- telefone
- senha

ADMINISTRADOR DA PARÓQUIA
Pode editar apenas usuários vinculados à paróquia administrada:
- nome
- e-mail
- telefone
- senha

SEGURANÇA
- Admin local não pode editar uma conta MASTER GLOBAL.
- E-mail permanece único.
- Senha só muda quando o campo "Nova senha" for preenchido.
- Nova senha com mínimo de 8 caracteres.
- Senhas continuam protegidas por Argon2.

IMPORTANTE
A conta do usuário é global no Cantus Dei.
Se o mesmo usuário estiver em mais de uma paróquia, corrigir nome/e-mail/telefone/senha
altera a identidade dessa conta no sistema inteiro.
O administrador local, porém, só consegue iniciar essa alteração para usuários
vinculados à sua própria paróquia.

NÃO PRECISA SQL.

ARQUIVOS ALTERADOS PELO SCRIPT
apps/api/src/routes/master.ts
apps/api/src/routes/paroquias.ts
apps/web/src/pages/MasterAdmin.tsx
apps/web/src/pages/ParoquiaAdmin.tsx

COMO APLICAR
cd D:\GitHub\cantus-dei
python APLICAR-EDICAO-USUARIOS-V9.py
npm run build

Se passar:
git add .
git commit -m "Permite editar dados dos usuarios"
git push origin main

CANTUS DEI - CONVITE COM CADASTRO DO MÚSICO

NOVO FLUXO

MÚSICO NOVO
1. Recebe o link do convite.
2. Abre o convite.
3. Vê ministério, paróquia e papel proposto.
4. Informa:
   - nome
   - e-mail, se o convite foi criado apenas por telefone
   - telefone
   - senha
   - confirmação da senha
5. Clica "Criar acesso e aceitar convite".
6. O sistema:
   - cria o usuário
   - associa à paróquia como MEMBRO
   - associa ao grupo com o papel do convite
   - marca o convite como ACEITO
   - gera login automaticamente
   - seleciona a paróquia
   - leva para o Dashboard
7. O ministério já aparece no Dashboard.

USUÁRIO JÁ CADASTRADO
- não cria nova conta
- não redefine senha
- deve entrar com a conta existente
- abre o convite e clica "Aceitar convite"
- passa a pertencer à paróquia e ao grupo

SEGURANÇA
Se o convite tiver e-mail definido:
- uma conta existente só pode aceitar se estiver logada com o mesmo e-mail
- usuário novo é criado usando exatamente o e-mail do convite
- não é possível trocar o e-mail do convite na tela

ARQUIVOS ALTERADOS
- apps/api/src/routes/invites.ts
- apps/web/src/pages/AceitarConvite.tsx

BANCO
Não precisa executar SQL.

APLICAÇÃO

Extraia por cima de:
D:\GitHub\cantus-dei

Execute:
npm run build

Se passar:
git add .
git commit -m "Permite cadastro do musico ao aceitar convite"
git push origin main

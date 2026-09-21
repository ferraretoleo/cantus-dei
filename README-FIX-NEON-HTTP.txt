CANTUS DEI - CORREÇÃO NEON HTTP

ERRO CORRIGIDO:
No transactions support in neon-http driver

CAUSA:
O projeto usa drizzle-orm/neon-http.
Esse driver não suporta db.transaction(async tx => ...) no formato usado.

A correção remove db.transaction() de todos os locais onde ainda existia:

- criação de grupo
- aceite de convite
- vínculo música x momentos
- repertório da missa
- escala da missa

Na criação de grupo foi incluído rollback compensatório:
se o vínculo do RESPONSAVEL falhar depois de criar o grupo,
o grupo recém-criado é removido.

COMO APLICAR

1. Extraia sobre:
D:\GitHub\cantus-dei

2. Rode:
npm run build

3. Se passar:
git add .
git commit -m "Corrige transacoes incompatíveis com Neon HTTP"
git push origin main

4. Aguarde o Render publicar novamente.

NÃO PRECISA:
- alterar Neon
- executar SQL
- mudar variáveis
- alterar Cloudflare

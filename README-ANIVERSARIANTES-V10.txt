CANTUS DEI - ANIVERSARIANTES V10

Funcionalidade:
- adiciona data de aniversário/nascimento ao cadastro e edição de usuários
- MASTER GLOBAL pode visualizar/editar em qualquer usuário
- ADMIN_PAROQUIA pode visualizar/editar apenas usuários vinculados à sua paróquia
- Dashboard mostra aniversariantes da semana, filtrados exclusivamente pela paróquia atualmente selecionada
- semana considerada: segunda-feira até domingo

Independência de dados:
A data pertence à conta global da pessoa. Porém, o Dashboard consulta somente paroquia_membros da paróquia ativa. Se o usuário estiver em mais de uma paróquia, aparecerá somente nos dashboards das paróquias onde estiver vinculado.

Banco:
Execute primeiro database/007_data_nascimento.sql no Neon.

Aplicação:
cd D:\GitHub\cantus-dei
python APLICAR-ANIVERSARIANTES-V10.py
npm run build

Se passar:
git add .
git commit -m "Adiciona aniversariantes da semana"
git push origin main

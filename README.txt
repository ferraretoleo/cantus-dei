CANTUS DEI - DASHBOARD APÓS CRIAR GRUPO + NAVEGAÇÃO

ALTERAÇÕES

1. NOVO GRUPO
Depois de criar um grupo:
- não entra automaticamente no grupo
- retorna para /dashboard
- o Dashboard recarrega a lista e mostra o novo grupo

2. DENTRO DO GRUPO
Todos os usuários possuem link "Dashboard".

O botão aparece:
- na barra principal
- na navegação mobile

3. PERMISSÕES ADMINISTRATIVAS

MASTER e ADMIN_PAROQUIA veem:
- Dashboard
- Início
- Calendário
- Músicas
- Momentos
- Integrantes
- Convites
- Admin. Paróquia

Usuário comum vê:
- Dashboard
- Início
- Calendário
- Músicas
- Momentos

4. IDENTIFICAÇÃO
No cabeçalho:
- MASTER aparece como MASTER
- administrador da paróquia aparece como ADMIN PARÓQUIA
- demais usuários mostram o papel no grupo

APLICAÇÃO

Extraia por cima de:
D:\GitHub\cantus-dei

Depois:
npm run build

Se passar:
git add .
git commit -m "Ajusta retorno ao dashboard e permissoes no grupo"
git push origin main

Não precisa executar SQL.
Não altera banco.
Não altera API.

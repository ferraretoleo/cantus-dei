CANTUS DEI - FLUXO DE PARÓQUIA V3

CORREÇÃO DO FLUXO MULTI-PARÓQUIA

O problema da versão anterior era que existia a estrutura de paróquias,
mas faltava o conceito de "paróquia ativa" depois do login e faltava
uma administração operacional da paróquia.

NOVO FLUXO

LOGIN
  ↓
ESCOLHER PARÓQUIA
  ↓
DASHBOARD DA PARÓQUIA

O mesmo login pode acessar várias paróquias.

MASTER GLOBAL

Ao fazer login, o MASTER também vê a tela de paróquias.
Ele enxerga todas as paróquias do sistema.

Em uma paróquia selecionada, o MASTER pode:
- criar grupos
- cadastrar músicos
- associar usuários já existentes à paróquia
- associar integrantes aos grupos
- definir RESPONSAVEL, COORDENADOR ou MUSICO
- informar instrumento e voz
- acessar qualquer grupo da paróquia
- continuar acessando Administração Global

Também foi criado o botão:
"Associar meu usuário a esta paróquia"

Isso permite ao MASTER entrar formalmente na paróquia e depois se
associar a qualquer grupo.

ADMIN_PAROQUIA

Pode:
- criar grupos
- cadastrar novos músicos
- associar usuário existente usando o mesmo e-mail
- colocar usuários nos grupos
- definir papel no grupo
- informar instrumento e voz
- acessar e administrar os grupos da paróquia

MEMBRO

Depois do login:
- escolhe a paróquia
- vê apenas os grupos daquela paróquia em que participa
- vê apenas a agenda correspondente à paróquia escolhida
- pode trocar de paróquia sem sair da conta

DASHBOARD

Passa a respeitar a paróquia ativa.

O topo apresenta:
- nome da paróquia
- Administrar paróquia, quando permitido
- Trocar paróquia
- Sair

A agenda mensal é filtrada por paróquia.

Os grupos mostrados na lateral também são filtrados por paróquia.

CADASTRO DE MÚSICOS

Tela:
Dashboard > Administrar paróquia

Novo usuário:
- nome
- e-mail
- telefone
- senha inicial
- papel na paróquia

Se o e-mail já existe no Cantus Dei:
- não cria outra conta
- apenas associa a conta existente à paróquia
- a senha pode ficar vazia

ASSOCIAÇÃO A GRUPO

Na mesma tela:
- selecione o grupo
- selecione um membro da paróquia
- escolha MUSICO, COORDENADOR ou RESPONSAVEL
- informe instrumento
- informe voz
- clique Associar ao grupo

INSTALAÇÃO

1. NÃO EXECUTE NOVO SQL.
Esta atualização utiliza as tabelas criadas anteriormente:
- paroquias
- paroquia_membros
- grupos.paroquia_id

2. Extraia o ZIP por cima de:
D:\GitHub\cantus-dei

3. Execute:
npm run build

4. Se passar:
git add .
git commit -m "Corrige fluxo de acesso por paroquia e cadastro de musicos"
git push origin main

5. Aguarde Render e Cloudflare publicarem.

6. Faça logout e login novamente.

7. O primeiro passo depois do login será escolher a paróquia.

ARQUIVOS ALTERADOS

API
- apps/api/src/routes/paroquias.ts
- apps/api/src/routes/groups.ts
- apps/api/src/routes/dashboard.ts
- apps/api/src/plugins/group-guard.ts

FRONTEND
- apps/web/src/contexts/AuthContext.tsx
- apps/web/src/pages/Login.tsx
- apps/web/src/pages/SelecionarParoquia.tsx
- apps/web/src/pages/Dashboard.tsx
- apps/web/src/pages/ParoquiaAdmin.tsx
- apps/web/src/pages/NovoGrupo.tsx
- apps/web/src/App.tsx

CANTUS DEI - MULTI-PARÓQUIA + NOVO DASHBOARD

OBJETIVO
Criar independência real por paróquia.

MODELO DE ACESSO

MASTER GLOBAL
- cria paróquias
- associa usuários às paróquias
- define ADMIN_PAROQUIA ou MEMBRO
- continua podendo nomear outros MASTER
- continua podendo excluir grupos

ADMIN_PAROQUIA
- pode criar grupos somente nas paróquias onde é administrador
- o grupo nasce vinculado à paroquia_id
- torna-se RESPONSAVEL pelo grupo criado

MEMBRO
- pertence à paróquia
- pode participar de vários grupos dentro dela
- pode pertencer a várias paróquias usando o MESMO LOGIN

GRUPO
- pertence obrigatoriamente a uma paróquia

TODOS OS DADOS
- músicas -> grupo -> paróquia
- momentos especiais -> grupo -> paróquia
- missas -> grupo -> paróquia
- repertório -> missa -> grupo -> paróquia
- escala -> missa -> grupo -> paróquia
- convites -> grupo -> paróquia

CADASTRO DE NOVO USUÁRIO
A tela de cadastro agora exige a escolha de uma paróquia existente.

ACEITE DE CONVITE
Se o músico aceitar um convite de grupo de outra paróquia:
- ele é automaticamente associado à nova paróquia como MEMBRO
- o mesmo login passa a ter vínculo com ambas as paróquias

DASHBOARD
O Dashboard foi reorganizado:

ESQUERDA
- Agenda mensal das missas dos grupos em que o usuário participa
- status da celebração
- indicação da escala/confirmação
- mês anterior e próximo mês

DIREITA
- Grupos/ministérios do músico

ABAIXO
- Salmo em destaque
- Atalho rápido
- Paróquias vinculadas

NOVO GRUPO
O botão aparece somente quando o usuário é ADMIN_PAROQUIA em pelo menos uma paróquia.

MIGRAÇÃO DOS DADOS ATUAIS
O arquivo:
database/004_multitenant_paroquias.sql

- cria paroquias
- cria paroquia_membros
- converte as paróquias antigas gravadas nos grupos
- vincula todos os membros atuais às respectivas paróquias
- transforma RESPONSAVEL atual em ADMIN_PAROQUIA
- adiciona paroquia_id obrigatório aos grupos
- não apaga os grupos, músicas, missas ou escalas atuais

ORDEM CORRETA DE INSTALAÇÃO

1. FAÇA BACKUP DO NEON.

2. No Neon SQL Editor execute:
database/004_multitenant_paroquias.sql

3. Extraia este ZIP por cima de:
D:\GitHub\cantus-dei

4. Execute:
npm run build

5. Se o build passar:
git add .
git commit -m "Implementa independencia por paroquia e novo dashboard"
git push origin main

6. Aguarde Render e Cloudflare publicarem.

IMPORTANTE
Execute o SQL ANTES de publicar a nova API, porque o novo código espera as tabelas:
- paroquias
- paroquia_membros
e a coluna:
- grupos.paroquia_id

NÃO É NECESSÁRIO
- criar novo banco
- criar novo projeto Neon
- alterar DATABASE_URL
- alterar CORS
- alterar MASTER_EMAIL

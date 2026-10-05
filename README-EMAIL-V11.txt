CANTUS DEI V11 - AVISOS POR E-MAIL

FUNCIONALIDADES

1. AO PUBLICAR UMA CELEBRAÇÃO
Cada músico presente na escala recebe um e-mail com:
- paróquia
- ministério
- tipo de celebração
- data e hora
- local
- serviço/instrumento quando informado
- botão para abrir o link público da celebração

O envio acontece somente depois da publicação gerar o link público.

O sistema grava cada envio em email_envios.
Se a mesma celebração for publicada novamente:
- quem já recebeu não recebe novamente
- um novo músico que foi incluído depois recebe normalmente

2. E-MAIL DIÁRIO
Todos os músicos vinculados a grupos ativos da paróquia recebem:
- Salmo em destaque do dia
- aniversariantes DO DIA daquela paróquia, quando houver

Se não houver aniversariantes:
- o e-mail contém somente o Salmo em destaque

INDEPENDÊNCIA DE DADOS
Cada e-mail diário é montado por paróquia.
Os aniversariantes são buscados somente entre os membros vinculados àquela paróquia.
Um músico em duas paróquias pode receber um e-mail separado de cada uma.

3. AGENDAMENTO SEM CUSTO
Foi incluído um pequeno Cloudflare Worker com Cron Trigger.

Horário:
07:00 da manhã no horário de Brasília
Cron Cloudflare:
0 10 * * *
(Cloudflare Cron usa UTC)

PASSO 1 - BANCO NEON

Execute:
database/008_email_envios.sql

PASSO 2 - APLICAÇÃO

Extraia o ZIP na raiz:
D:\GitHub\cantus-dei

Execute:
python APLICAR-EMAIL-V11.py

Depois instale as novas dependências:
npm install

Build:
npm run build

Se passar:
git add .
git commit -m "Adiciona avisos por email"
git push origin main

PASSO 3 - VARIÁVEIS NO RENDER

No serviço da API adicione:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=SEU_GMAIL
SMTP_PASS=SUA_SENHA_DE_APP
SMTP_FROM_NAME=Cantus Dei
SMTP_FROM_EMAIL=SEU_GMAIL
DAILY_EMAIL_SECRET=CRIE_UMA_CHAVE_GRANDE_E_ALEATORIA

Exemplo de DAILY_EMAIL_SECRET:
use uma string aleatória de pelo menos 40 caracteres.
NÃO coloque essa chave no GitHub.

PASSO 4 - CRON NO CLOUDFLARE

Entre na pasta:

cd cloudflare-email-cron

Instale:
npm install

Faça login, se necessário:
npx wrangler login

Cadastre o mesmo segredo usado no Render:
npx wrangler secret put DAILY_EMAIL_SECRET

Quando solicitado, cole o valor de DAILY_EMAIL_SECRET.

Publique:
npm run deploy

O arquivo wrangler.toml já aponta para:
https://cantus-dei-api.onrender.com

Se sua URL da API for outra, altere API_URL antes do deploy.

IMPORTANTE SOBRE RENDER FREE

Se o serviço Render estiver dormindo, a primeira chamada diária pode demorar
enquanto o serviço acorda. O Cloudflare Worker aguarda a resposta.

GMAIL

Use a SENHA DE APP criada na conta Google.
Não use a senha normal da conta.

O projeto não guarda a senha no banco e não envia credenciais ao frontend.
SMTP fica somente no backend Render.

ARQUIVOS
- database/008_email_envios.sql
- APLICAR-EMAIL-V11.py
- email.ts
- psalms.ts
- jobs.ts
- cloudflare-email-cron/*

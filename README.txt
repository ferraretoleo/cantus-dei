CANTUS DEI - REMOÇÃO DO AUTO CADASTRO PÚBLICO V7.3

ALTERAÇÕES

1. LOGIN
Foi removido:

Ainda não participa? Criar conta

2. ROTA /registrar
Mesmo que alguém tente acessar diretamente:

https://app.cantus-dei.workers.dev/registrar

o sistema redireciona para:

/login

3. FLUXO DE ACESSO MANTIDO

MASTER GLOBAL
- cria/libera os administradores de paróquia

ADMIN_PAROQUIA / RESPONSÁVEL DO MINISTÉRIO
- usam o fluxo de convite para novos músicos

MÚSICO CONVIDADO
- acessa o link do convite
- cria a senha
- fica associado à paróquia e ao ministério

Ou seja, foi removido apenas o cadastro espontâneo/público.

COMO APLICAR

1. Extraia este ZIP na raiz:
D:\GitHub\cantus-dei

2. Execute:
python APLICAR-REMOVE-AUTO-CADASTRO-V7-3.py

3. Depois:
npm run build

4. Se passar:
git add .
git commit -m "Remove auto cadastro publico"
git push origin main

Não precisa executar SQL.
Não altera API nem Neon.

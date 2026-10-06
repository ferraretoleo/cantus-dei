CANTUS DEI V11.4 - GMAIL API NO RENDER FREE

CAUSA DO ETIMEDOUT

O erro:
ETIMEDOUT / command CONN

não é senha errada.

O Render Free bloqueia tráfego de saída nas portas SMTP:
25
465
587

Por isso smtp.gmail.com nunca consegue conectar no plano gratuito.

SOLUÇÃO SEM CUSTO

Usar Gmail API via HTTPS, porta 443.

Isso funciona no Render Free e mantém a mesma conta Gmail.

A aplicação passa a usar Gmail API automaticamente quando estas variáveis
estiverem configuradas:

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GMAIL_SENDER

O SMTP antigo fica como fallback caso no futuro você use um Render pago.

PASSO 1 - GOOGLE CLOUD

1. Acesse Google Cloud Console.
2. Crie um projeto, por exemplo:
   Cantus Dei
3. APIs e serviços > Biblioteca.
4. Ative:
   Gmail API
5. APIs e serviços > Tela de consentimento OAuth.
6. Configure como "Externo".
7. Adicione sua própria conta Gmail como usuário de teste.
8. Crie credencial:
   OAuth Client ID
9. Tipo:
   Desktop app
10. Copie:
    Client ID
    Client Secret

PASSO 2 - GERAR O REFRESH TOKEN

No pacote existe:
GERAR-REFRESH-TOKEN-GMAIL.ps1

Abra o arquivo e substitua:

$CLIENT_ID = "COLE_SEU_CLIENT_ID"
$CLIENT_SECRET = "COLE_SEU_CLIENT_SECRET"

Depois execute no PowerShell:

powershell -ExecutionPolicy Bypass -File .\GERAR-REFRESH-TOKEN-GMAIL.ps1

Abra a URL exibida.
Autorize sua conta Gmail.

O navegador será redirecionado para localhost e pode mostrar erro de página.
Isso é normal.

Na barra de endereço haverá:
?code=...

Copie somente o conteúdo do parâmetro code.

Cole no PowerShell.

O script mostrará:
REFRESH TOKEN

Copie esse valor.

PASSO 3 - RENDER

Na API do Cantus Dei adicione:

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GMAIL_SENDER=seuemail@gmail.com

Mantenha:

SMTP_FROM_NAME=Cantus Dei

As antigas:
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS

podem permanecer, mas a Gmail API terá prioridade.

PASSO 4 - APLICAR O CÓDIGO

cd D:\GitHub\cantus-dei

python APLICAR-GMAIL-API-V11-4.py

npm run build

Se passar:

git add .
git commit -m "Usa Gmail API para envio de emails"
git push origin main

PASSO 5 - TESTAR

Depois do deploy, abra uma celebração PUBLICADA e use:
Enviar por e-mail

O envio agora será:
Render -> HTTPS 443 -> Gmail API

e não:
Render -> SMTP 587 -> Gmail

NÃO PRECISA SQL.
NÃO ALTERA OS E-MAILS EXISTENTES.
NÃO ALTERA O CRON.
NÃO ALTERA O FRONTEND.

A mesma função enviarEmail() continua sendo usada por:
- aviso de músico escalado
- envio manual da publicação
- Salmo diário
- aniversariantes do dia

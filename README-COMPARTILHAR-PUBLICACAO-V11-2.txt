CANTUS DEI - V11.2
LINKS DE PUBLICAÇÃO + ENVIO MANUAL POR E-MAIL

Ao abrir uma celebração que já está PUBLICADA, a tela passa a mostrar:

- link público da celebração
- Abrir publicação
- Copiar link
- Compartilhar usando o recurso nativo do celular/navegador
- WhatsApp
- campo para informar um e-mail
- botão "Enviar por e-mail"

O envio por e-mail utiliza o mesmo Gmail/SMTP já configurado no Render.

SEGURANÇA

A rota de envio manual respeita as permissões da celebração.
Somente usuário com acesso de RESPONSAVEL, incluindo os acessos superiores já
tratados pelo guard do sistema, pode disparar o envio.

A celebração precisa estar PUBLICADA e possuir token público.

NÃO PRECISA SQL.
NÃO ALTERA O CRON DIÁRIO.
NÃO ALTERA O ENVIO AUTOMÁTICO PARA OS MÚSICOS ESCALADOS.

ARQUIVOS ALTERADOS

apps/api/src/routes/missas.ts
apps/web/src/pages/MissaEditor.tsx

COMO APLICAR

cd D:\GitHub\cantus-dei

python APLICAR-COMPARTILHAR-PUBLICACAO-V11-2.py

npm run build

Se passar:

git add .
git commit -m "Adiciona compartilhamento de celebracao publicada"
git push origin main

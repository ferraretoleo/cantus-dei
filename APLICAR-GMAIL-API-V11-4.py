from pathlib import Path

p=Path("apps/api/src/services/email.ts")
t=p.read_text(encoding="utf-8")

new = r"""import nodemailer from 'nodemailer';

function required(name:string) {
  const value=process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }
  return value;
}

function gmailApiConfigurada() {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_REFRESH_TOKEN?.trim() &&
    process.env.GMAIL_SENDER?.trim()
  );
}

function smtpConfigurado() {
  return !!(
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  );
}

function transporter() {
  const port=Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host:process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure:
      (process.env.SMTP_SECURE || '').toLowerCase()==='true' ||
      port===465,
    auth:{
      user:required('SMTP_USER'),
      pass:required('SMTP_PASS')
    },
    connectionTimeout:10000,
    greetingTimeout:10000,
    socketTimeout:15000
  });
}

export function emailConfigurado() {
  return gmailApiConfigurada() || smtpConfigurado();
}

function base64Url(value:string) {
  return Buffer
    .from(value,'utf8')
    .toString('base64')
    .replace(/\+/g,'-')
    .replace(/\//g,'_')
    .replace(/=+$/,'');
}

function encodeHeader(value:string) {
  return `=?UTF-8?B?${Buffer.from(value,'utf8').toString('base64')}?=`;
}

async function accessTokenGmail() {
  const body=new URLSearchParams({
    client_id:required('GOOGLE_CLIENT_ID'),
    client_secret:required('GOOGLE_CLIENT_SECRET'),
    refresh_token:required('GOOGLE_REFRESH_TOKEN'),
    grant_type:'refresh_token'
  });

  const response=await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method:'POST',
      headers:{
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body
    }
  );

  const data=await response.json() as {
    access_token?:string;
    error?:string;
    error_description?:string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Falha ao obter token Gmail: ${
        data.error_description ||
        data.error ||
        response.status
      }`
    );
  }

  return data.access_token;
}

async function enviarViaGmailApi({
  para,
  assunto,
  html,
  texto
}:{
  para:string;
  assunto:string;
  html:string;
  texto:string;
}) {
  const sender=required('GMAIL_SENDER');
  const fromName=
    process.env.SMTP_FROM_NAME?.trim() ||
    'Cantus Dei';

  const boundary=
    `cantus_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const mime=[
    `From: ${encodeHeader(fromName)} <${sender}>`,
    `To: ${para}`,
    `Subject: ${encodeHeader(assunto)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    texto,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
    ''
  ].join('\r\n');

  const token=await accessTokenGmail();

  const response=await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${token}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        raw:base64Url(mime)
      })
    }
  );

  const data=await response.json() as {
    id?:string;
    error?:{
      message?:string;
    };
  };

  if (!response.ok) {
    throw new Error(
      `Falha Gmail API: ${
        data.error?.message ||
        response.status
      }`
    );
  }

  return data;
}

export async function enviarEmail({
  para,
  assunto,
  html,
  texto
}:{
  para:string;
  assunto:string;
  html:string;
  texto:string;
}) {
  // Render Free bloqueia portas SMTP 25/465/587.
  // Por isso, quando Gmail API está configurada,
  // ela é sempre a primeira opção e usa HTTPS/443.
  if (gmailApiConfigurada()) {
    return enviarViaGmailApi({
      para,
      assunto,
      html,
      texto
    });
  }

  if (!smtpConfigurado()) {
    throw new Error(
      'Nenhum provedor de e-mail configurado.'
    );
  }

  const fromEmail=
    process.env.SMTP_FROM_EMAIL?.trim() ||
    required('SMTP_USER');

  const fromName=
    process.env.SMTP_FROM_NAME?.trim() ||
    'Cantus Dei';

  return transporter().sendMail({
    from:`"${fromName}" <${fromEmail}>`,
    to:para,
    subject:assunto,
    text:texto,
    html
  });
}

export function escaparHtml(value:string) {
  return value
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

export function layoutEmail({
  titulo,
  conteudo
}:{
  titulo:string;
  conteudo:string;
}) {
  return `
  <!doctype html>
  <html lang="pt-BR">
    <body style="margin:0;background:#0b0c0e;font-family:Arial,sans-serif;color:#f1eadc">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px">
        <div style="border:1px solid #3d3424;border-radius:18px;background:#141518;padding:28px">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d5ae62;font-weight:700">
            Cantus Dei
          </div>
          <h1 style="font-size:28px;margin:10px 0 22px;color:#f1eadc">${titulo}</h1>
          ${conteudo}
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #2a2c31;color:#9f9a91;font-size:12px">
            Cantus Dei · Música a serviço da Igreja
          </div>
        </div>
      </div>
    </body>
  </html>`;
}
"""

p.write_text(new,encoding="utf-8")
print("Gmail API configurada como transporte prioritário.")

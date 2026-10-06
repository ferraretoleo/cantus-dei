import nodemailer from 'nodemailer';

function required(name:string) {
  const value=process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }
  return value;
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
  return !!(
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  );
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

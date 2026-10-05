import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  emailEnvios,
  grupoMembros,
  grupos,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

import {
  emailConfigurado,
  enviarEmail,
  escaparHtml,
  layoutEmail
} from '../services/email.js';

import {
  hojeSaoPaulo,
  salmoDoDiaServidor
} from '../services/psalms.js';

function segredoValido(header:string|undefined) {
  const esperado=process.env.DAILY_EMAIL_SECRET?.trim();
  return !!esperado && header===esperado;
}

async function jaEnviado(chave:string) {
  const [row]=await db
    .select({ id:emailEnvios.id })
    .from(emailEnvios)
    .where(eq(emailEnvios.chave,chave))
    .limit(1);

  return !!row;
}

async function registrarEnvio(
  chave:string,
  tipo:string,
  destinatario:string
) {
  await db
    .insert(emailEnvios)
    .values({
      chave,
      tipo,
      destinatario
    })
    .onConflictDoNothing({
      target:emailEnvios.chave
    });
}

function pausa(ms:number) {
  return new Promise(resolve=>setTimeout(resolve,ms));
}

export async function jobRoutes(app:FastifyInstance) {
  app.post('/jobs/email-diario',async(request,reply)=>{
    const secret=request.headers['x-job-secret'];

    if (
      typeof secret!=='string' ||
      !segredoValido(secret)
    ) {
      return reply.code(401).send({
        error:'UNAUTHORIZED'
      });
    }

    if (!emailConfigurado()) {
      return reply.code(503).send({
        error:'SMTP_NOT_CONFIGURED',
        message:'SMTP não configurado.'
      });
    }

    const hoje=hojeSaoPaulo();
    const mmdd=
      `${String(hoje.mes).padStart(2,'0')}-${String(hoje.dia).padStart(2,'0')}`;

    const salmo=salmoDoDiaServidor();

    const listaParoquias=await db
      .select({
        id:paroquias.id,
        nome:paroquias.nome,
        cidade:paroquias.cidade
      })
      .from(paroquias)
      .where(eq(paroquias.ativo,true))
      .orderBy(asc(paroquias.nome));

    let enviados=0;
    let ignorados=0;
    let falhas=0;

    for (const paroquia of listaParoquias) {
      const musicos=await db
        .selectDistinct({
          userId:users.id,
          nome:users.nome,
          email:users.email
        })
        .from(grupoMembros)
        .innerJoin(
          grupos,
          eq(grupos.id,grupoMembros.grupoId)
        )
        .innerJoin(
          users,
          eq(users.id,grupoMembros.userId)
        )
        .where(
          and(
            eq(grupos.paroquiaId,paroquia.id),
            eq(grupos.ativo,true),
            eq(grupoMembros.ativo,true),
            eq(users.ativo,true)
          )
        )
        .orderBy(asc(users.nome));

      if (!musicos.length) continue;

      const membros=await db
        .select({
          nome:users.nome,
          dataNascimento:users.dataNascimento
        })
        .from(paroquiaMembros)
        .innerJoin(
          users,
          eq(users.id,paroquiaMembros.userId)
        )
        .where(
          and(
            eq(paroquiaMembros.paroquiaId,paroquia.id),
            eq(paroquiaMembros.ativo,true),
            eq(users.ativo,true)
          )
        )
        .orderBy(asc(users.nome));

      const aniversariantes=membros.filter(m=>
        !!m.dataNascimento &&
        m.dataNascimento.slice(5)===mmdd
      );

      const aniversarioHtml=aniversariantes.length
        ? `
          <div style="margin-top:24px;padding:18px;border:1px solid #3d3424;border-radius:14px;background:#191713">
            <div style="color:#d5ae62;font-weight:700;margin-bottom:10px">🎂 Aniversariantes de hoje</div>
            ${aniversariantes.map(a=>
              `<div style="margin-top:6px">${escaparHtml(a.nome)}</div>`
            ).join('')}
          </div>`
        : '';

      const aniversarioTexto=aniversariantes.length
        ? `\n\nAniversariantes de hoje:\n${aniversariantes.map(a=>`- ${a.nome}`).join('\n')}`
        : '';

      for (const musico of musicos) {
        const chave=
          `diario:${hoje.chave}:paroquia:${paroquia.id}:user:${musico.userId}`;

        if (await jaEnviado(chave)) {
          ignorados++;
          continue;
        }

        const html=layoutEmail({
          titulo:`Bom dia, ${escaparHtml(musico.nome)}!`,
          conteudo:`
            <p style="line-height:1.7;color:#d8d1c7">
              Destaque do dia para os músicos de
              <strong>${escaparHtml(paroquia.nome)}</strong>.
            </p>

            <div style="margin-top:22px;padding:20px;border-radius:14px;background:#0f1012;border:1px solid #2c2d31">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#d5ae62">
                Salmo em destaque · ${escaparHtml(salmo.tema)}
              </div>
              <div style="font-size:22px;line-height:1.5;margin-top:12px;color:#f1eadc">
                “${escaparHtml(salmo.texto)}”
              </div>
              <div style="margin-top:12px;color:#d5ae62;font-weight:700">
                ${escaparHtml(salmo.referencia)}
              </div>
            </div>

            ${aniversarioHtml}
          `
        });

        const texto=
          `Cantus Dei\n\nBom dia, ${musico.nome}!\n\n`+
          `Salmo em destaque (${salmo.tema}):\n`+
          `“${salmo.texto}”\n${salmo.referencia}`+
          aniversarioTexto;

        try {
          await enviarEmail({
            para:musico.email,
            assunto:`Cantus Dei · Salmo em destaque · ${paroquia.nome}`,
            html,
            texto
          });

          await registrarEnvio(
            chave,
            'DIARIO',
            musico.email
          );

          enviados++;
          await pausa(200);
        } catch (error) {
          falhas++;
          app.log.error({
            error,
            userId:musico.userId,
            paroquiaId:paroquia.id
          },'Falha no e-mail diário');
        }
      }
    }

    return {
      ok:true,
      data:hoje.chave,
      enviados,
      ignorados,
      falhas
    };
  });
}

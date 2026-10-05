import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { and, asc, eq, isNull } from 'drizzle-orm';

import {
  confirmacaoSchema,
  escalaSchema,
  missaSchema,
  repertorioSchema
} from '@cantus-dei/shared';

import { db } from '../db/client.js';

import {
  emailEnvios,
  grupos,
  missaEscala,
  missaMusicas,
  missas,
  momentos,
  musicas,
  paroquias,
  users
} from '../db/schema.js';

import {
  emailConfigurado,
  enviarEmail,
  escaparHtml,
  layoutEmail
} from '../services/email.js';

export async function missaRoutes(app: FastifyInstance) {
  app.get(
    '/grupos/:id/missas',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep)
    },
    async request => {
      const grupoId =
        (request.params as { id: string }).id;

      return db
        .select()
        .from(missas)
        .where(
          and(
            eq(missas.grupoId, grupoId),
            isNull(missas.deletedAt)
          )
        )
        .orderBy(asc(missas.dataHora));
    }
  );

  app.post(
    '/grupos/:id/missas',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const grupoId =
        (request.params as { id: string }).id;

      const parsed =
        missaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message:
            'Dados da celebração inválidos.'
        });
      }

      const [missa] =
        await db
          .insert(missas)
          .values({
            grupoId,
            dataHora:
              new Date(parsed.data.dataHora),
            local:
              parsed.data.local,
            tipoCelebracao:
              parsed.data.tipoCelebracao,
            tempoLiturgico:
              parsed.data.tempoLiturgico || null,
            observacoes:
              parsed.data.observacoes || null,
            criadoPor:
              request.user.sub
          })
          .returning();

      return reply
        .code(201)
        .send(missa);
    }
  );

  app.get(
    '/grupos/:id/missas/:missaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep)
    },
    async (request, reply) => {
      const {
        id: grupoId,
        missaId
      } = request.params as {
        id: string;
        missaId: string;
      };

      const [missa] =
        await db
          .select()
          .from(missas)
          .where(
            and(
              eq(missas.id, missaId),
              eq(missas.grupoId, grupoId),
              isNull(missas.deletedAt)
            )
          )
          .limit(1);

      if (!missa) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message:
            'Celebração não encontrada.'
        });
      }

      const repertorio =
        await db
          .select({
            id: missaMusicas.id,
            ordem: missaMusicas.ordem,
            momentoId: momentos.id,
            momentoNome: momentos.nome,
            musicaId: musicas.id,
            titulo: musicas.titulo,
            autorCompositor:
              musicas.autorCompositor,
            tomOriginal:
              musicas.tomOriginal,
            tomDaExecucao:
              missaMusicas.tomDaExecucao,
            observacao:
              missaMusicas.observacao,
            letra: musicas.letra,
            cifra: musicas.cifra,
            notacaoAbc:
              musicas.notacaoAbc
          })
          .from(missaMusicas)
          .innerJoin(
            musicas,
            eq(
              musicas.id,
              missaMusicas.musicaId
            )
          )
          .innerJoin(
            momentos,
            eq(
              momentos.id,
              missaMusicas.momentoId
            )
          )
          .where(
            eq(
              missaMusicas.missaId,
              missaId
            )
          )
          .orderBy(
            asc(momentos.ordemLiturgica),
            asc(missaMusicas.ordem)
          );

      const escala =
        await db
          .select({
            userId: users.id,
            nome: users.nome,
            instrumentoVoz:
              missaEscala.instrumentoVoz,
            confirmacao:
              missaEscala.confirmacao
          })
          .from(missaEscala)
          .innerJoin(
            users,
            eq(
              users.id,
              missaEscala.userId
            )
          )
          .where(
            eq(
              missaEscala.missaId,
              missaId
            )
          );

      return {
        missa,
        repertorio,
        escala
      };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const {
        id: grupoId,
        missaId
      } = request.params as {
        id: string;
        missaId: string;
      };

      const parsed =
        missaSchema
          .partial()
          .safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos.'
        });
      }

      const values: {
        dataHora?: Date;
        local?: string;
        tipoCelebracao?: string;
        tempoLiturgico?: string | null;
        observacoes?: string | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date()
      };

      if (parsed.data.dataHora) {
        values.dataHora =
          new Date(
            parsed.data.dataHora
          );
      }

      if (
        parsed.data.local !== undefined
      ) {
        values.local =
          parsed.data.local;
      }

      if (
        parsed.data.tipoCelebracao !==
        undefined
      ) {
        values.tipoCelebracao =
          parsed.data.tipoCelebracao;
      }

      if (
        parsed.data.tempoLiturgico !==
        undefined
      ) {
        values.tempoLiturgico =
          parsed.data.tempoLiturgico ||
          null;
      }

      if (
        parsed.data.observacoes !==
        undefined
      ) {
        values.observacoes =
          parsed.data.observacoes ||
          null;
      }

      const [missa] =
        await db
          .update(missas)
          .set(values)
          .where(
            and(
              eq(missas.id, missaId),
              eq(missas.grupoId, grupoId),
              isNull(missas.deletedAt)
            )
          )
          .returning();

      if (!missa) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message:
            'Celebração não encontrada.'
        });
      }

      return missa;
    }
  );

  app.delete(
    '/grupos/:id/missas/:missaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const {
        id: grupoId,
        missaId
      } = request.params as {
        id: string;
        missaId: string;
      };

      const [missa] =
        await db
          .update(missas)
          .set({
            deletedAt:
              new Date(),
            status:
              'ARQUIVADA',
            updatedAt:
              new Date()
          })
          .where(
            and(
              eq(missas.id, missaId),
              eq(missas.grupoId, grupoId),
              isNull(missas.deletedAt)
            )
          )
          .returning({
            id: missas.id
          });

      if (!missa) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message:
            'Celebração não encontrada.'
        });
      }

      return {
        ok: true
      };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId/repertorio',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const missaId =
        (
          request.params as {
            missaId: string
          }
        ).missaId;

      const parsed =
        repertorioSchema
          .safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message:
            'Repertório inválido.'
        });
      }

      await db
        .delete(missaMusicas)
        .where(
          eq(
            missaMusicas.missaId,
            missaId
          )
        );

      if (
        parsed.data.itens.length
      ) {
        await db
          .insert(missaMusicas)
          .values(
            parsed.data.itens.map(
              (item, index) => ({
                missaId,
                musicaId:
                  item.musicaId,
                momentoId:
                  item.momentoId,
                ordem:
                  index + 1,
                tomDaExecucao:
                  item.tomDaExecucao ||
                  null,
                observacao:
                  item.observacao ||
                  null
              })
            )
          );
      }

      return {
        ok: true
      };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId/escala',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const missaId =
        (
          request.params as {
            missaId: string
          }
        ).missaId;

      const parsed =
        escalaSchema
          .safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message:
            'Escala inválida.'
        });
      }

      await db
        .delete(missaEscala)
        .where(
          eq(
            missaEscala.missaId,
            missaId
          )
        );

      if (
        parsed.data.itens.length
      ) {
        await db
          .insert(missaEscala)
          .values(
            parsed.data.itens.map(
              item => ({
                missaId,
                userId:
                  item.userId,
                instrumentoVoz:
                  item.instrumentoVoz ||
                  null
              })
            )
          );
      }

      return {
        ok: true
      };
    }
  );

  app.post(
    '/grupos/:id/missas/:missaId/publicar',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request, reply) => {
      const {
        id: grupoId,
        missaId
      } = request.params as {
        id: string;
        missaId: string;
      };

      const [missaAtual] =
        await db
          .select()
          .from(missas)
          .where(
            and(
              eq(missas.id, missaId),
              eq(missas.grupoId, grupoId),
              isNull(missas.deletedAt)
            )
          )
          .limit(1);

      if (!missaAtual) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message:
            'Celebração não encontrada.'
        });
      }

      const repertorioAtual =
        await db
          .select({
            id: missaMusicas.id
          })
          .from(missaMusicas)
          .where(
            eq(
              missaMusicas.missaId,
              missaId
            )
          );

      const escalaAtual =
        await db
          .select({
            userId: missaEscala.userId,
            nome: users.nome,
            email: users.email,
            instrumentoVoz: missaEscala.instrumentoVoz
          })
          .from(missaEscala)
          .innerJoin(
            users,
            eq(users.id,missaEscala.userId)
          )
          .where(
            eq(
              missaEscala.missaId,
              missaId
            )
          );

      const pendencias:string[]=[];

      if (
        !missaAtual.dataHora
      ) {
        pendencias.push(
          'data e hora'
        );
      }

      if (
        !missaAtual.local?.trim()
      ) {
        pendencias.push(
          'local'
        );
      }

      if (
        !missaAtual.tipoCelebracao
          ?.trim()
      ) {
        pendencias.push(
          'tipo de celebração'
        );
      }

      if (
        repertorioAtual.length===0
      ) {
        pendencias.push(
          'repertório'
        );
      }

      if (
        escalaAtual.length===0
      ) {
        pendencias.push(
          'escala de músicos'
        );
      }

      if (
        pendencias.length
      ) {
        return reply.code(400).send({
          error:
            'CELEBRATION_INCOMPLETE',
          message:
            `Antes de publicar, complete: ${pendencias.join(', ')}.`
        });
      }

      const token =
        missaAtual.tokenPublico ||
        crypto
          .randomBytes(24)
          .toString('hex');

      const [missa] =
        await db
          .update(missas)
          .set({
            status:
              'PUBLICADA',
            tokenPublico:
              token,
            publicadoEm:
              new Date(),
            updatedAt:
              new Date()
          })
          .where(
            and(
              eq(missas.id, missaId),
              eq(missas.grupoId, grupoId)
            )
          )
          .returning();

      const base =
        process.env.PUBLIC_BASE_URL ||
        'http://localhost:5173';

      const publicUrl=
        `${base}/celebracao/${token}`;

      let emailsEnviados=0;
      let emailsIgnorados=0;
      let emailsFalharam=0;

      if (emailConfigurado()) {
        const [grupoInfo]=await db
          .select({
            grupoNome:grupos.nome,
            paroquiaNome:paroquias.nome
          })
          .from(grupos)
          .innerJoin(
            paroquias,
            eq(paroquias.id,grupos.paroquiaId)
          )
          .where(eq(grupos.id,grupoId))
          .limit(1);

        const dt=new Intl.DateTimeFormat('pt-BR',{
          timeZone:'America/Sao_Paulo',
          dateStyle:'full',
          timeStyle:'short'
        }).format(missa.dataHora);

        for (const musico of escalaAtual) {
          const chave=
            `escala:missa:${missaId}:user:${musico.userId}`;

          const [jaFoi]=await db
            .select({ id:emailEnvios.id })
            .from(emailEnvios)
            .where(eq(emailEnvios.chave,chave))
            .limit(1);

          if (jaFoi) {
            emailsIgnorados++;
            continue;
          }

          const html=layoutEmail({
            titulo:'Você foi escalado para uma celebração',
            conteudo:`
              <p style="line-height:1.7;color:#d8d1c7">
                Olá, <strong>${escaparHtml(musico.nome)}</strong>.
                Você foi escalado para servir em uma celebração do Cantus Dei.
              </p>

              <div style="margin-top:20px;padding:18px;border:1px solid #2c2d31;border-radius:14px;background:#0f1012">
                <div><strong>Paróquia:</strong> ${escaparHtml(grupoInfo?.paroquiaNome || '')}</div>
                <div style="margin-top:8px"><strong>Ministério:</strong> ${escaparHtml(grupoInfo?.grupoNome || '')}</div>
                <div style="margin-top:8px"><strong>Celebração:</strong> ${escaparHtml(missa.tipoCelebracao)}</div>
                <div style="margin-top:8px"><strong>Data:</strong> ${escaparHtml(dt)}</div>
                <div style="margin-top:8px"><strong>Local:</strong> ${escaparHtml(missa.local)}</div>
                ${musico.instrumentoVoz
                  ? `<div style="margin-top:8px"><strong>Serviço:</strong> ${escaparHtml(musico.instrumentoVoz)}</div>`
                  : ''}
              </div>

              <div style="margin-top:24px">
                <a href="${publicUrl}"
                   style="display:inline-block;background:#d5ae62;color:#111;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:700">
                  Abrir celebração publicada
                </a>
              </div>
            `
          });

          const texto=
            `Cantus Dei\n\nOlá, ${musico.nome}.\n`+
            `Você foi escalado para ${missa.tipoCelebracao}.\n`+
            `${dt}\n${missa.local}\n\n`+
            `Acesse: ${publicUrl}`;

          try {
            await enviarEmail({
              para:musico.email,
              assunto:`Cantus Dei · Você foi escalado · ${missa.tipoCelebracao}`,
              html,
              texto
            });

            await db
              .insert(emailEnvios)
              .values({
                chave,
                tipo:'EMAIL_ESCALA',
                destinatario:musico.email
              })
              .onConflictDoNothing({
                target:emailEnvios.chave
              });

            emailsEnviados++;
          } catch (error) {
            emailsFalharam++;
            app.log.error({
              error,
              missaId,
              userId:musico.userId
            },'Falha ao enviar e-mail de escala');
          }
        }
      }

      return {
        token,
        publicUrl,
        missa,
        emails:{
          enviados:emailsEnviados,
          ignorados:emailsIgnorados,
          falhas:emailsFalharam
        }
      };
    }
  );

  app.post(
    '/grupos/:id/missas/:missaId/confirmar',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep
        )
    },
    async (request, reply) => {
      const missaId =
        (
          request.params as {
            missaId: string
          }
        ).missaId;

      const parsed =
        confirmacaoSchema
          .safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error:
            'VALIDATION_ERROR',
          message:
            'Confirmação inválida.'
        });
      }

      const [item] =
        await db
          .update(missaEscala)
          .set({
            confirmacao:
              parsed.data.confirmacao,
            respondidoEm:
              new Date(),
            updatedAt:
              new Date()
          })
          .where(
            and(
              eq(
                missaEscala.missaId,
                missaId
              ),
              eq(
                missaEscala.userId,
                request.user.sub
              )
            )
          )
          .returning();

      if (!item) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message:
            'Você não está escalado nesta celebração.'
        });
      }

      return item;
    }
  );
}

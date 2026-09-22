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
  missaEscala,
  missaMusicas,
  missas,
  momentos,
  musicas,
  users
} from '../db/schema.js';

export async function missaRoutes(app: FastifyInstance) {
  app.get(
    '/grupos/:id/missas',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async request => {
      const grupoId = (request.params as { id: string }).id;

      return db
        .select()
        .from(missas)
        .where(
          and(
            eq(missas.grupoId, grupoId),
            isNull(missas.deletedAt)
          )
        )
        .orderBy(missas.dataHora);
    }
  );

  app.post(
    '/grupos/:id/missas',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const grupoId = (request.params as { id: string }).id;
      const parsed = missaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados da celebração inválidos.'
        });
      }

      const [missa] = await db
        .insert(missas)
        .values({
          grupoId,
          dataHora: new Date(parsed.data.dataHora),
          local: parsed.data.local,
          tipoCelebracao: parsed.data.tipoCelebracao,
          tempoLiturgico: parsed.data.tempoLiturgico || null,
          observacoes: parsed.data.observacoes || null,
          criadoPor: request.user.sub
        })
        .returning();

      return reply.code(201).send(missa);
    }
  );

  app.get(
    '/grupos/:id/missas/:missaId',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const { id: grupoId, missaId } = request.params as {
        id: string;
        missaId: string;
      };

      const [missa] = await db
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
          message: 'Celebração não encontrada.'
        });
      }

      const repertorio = await db
        .select({
          id: missaMusicas.id,
          ordem: missaMusicas.ordem,
          momentoId: momentos.id,
          momentoNome: momentos.nome,
          musicaId: musicas.id,
          titulo: musicas.titulo,
          autorCompositor: musicas.autorCompositor,
          tomOriginal: musicas.tomOriginal,
          tomDaExecucao: missaMusicas.tomDaExecucao,
          observacao: missaMusicas.observacao,
          letra: musicas.letra,
          cifra: musicas.cifra,
          notacaoAbc: musicas.notacaoAbc
        })
        .from(missaMusicas)
        .innerJoin(musicas, eq(musicas.id, missaMusicas.musicaId))
        .innerJoin(momentos, eq(momentos.id, missaMusicas.momentoId))
        .where(eq(missaMusicas.missaId, missaId))
        .orderBy(
          asc(momentos.ordemLiturgica),
          asc(missaMusicas.ordem)
        );

      const escala = await db
        .select({
          userId: users.id,
          nome: users.nome,
          instrumentoVoz: missaEscala.instrumentoVoz,
          confirmacao: missaEscala.confirmacao
        })
        .from(missaEscala)
        .innerJoin(users, eq(users.id, missaEscala.userId))
        .where(eq(missaEscala.missaId, missaId));

      return { missa, repertorio, escala };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const { id: grupoId, missaId } = request.params as {
        id: string;
        missaId: string;
      };

      const parsed = missaSchema.partial().safeParse(request.body);

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
        values.dataHora = new Date(parsed.data.dataHora);
      }
      if (parsed.data.local !== undefined) {
        values.local = parsed.data.local;
      }
      if (parsed.data.tipoCelebracao !== undefined) {
        values.tipoCelebracao = parsed.data.tipoCelebracao;
      }
      if (parsed.data.tempoLiturgico !== undefined) {
        values.tempoLiturgico = parsed.data.tempoLiturgico || null;
      }
      if (parsed.data.observacoes !== undefined) {
        values.observacoes = parsed.data.observacoes || null;
      }

      const [missa] = await db
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
          message: 'Celebração não encontrada.'
        });
      }

      return missa;
    }
  );

  app.delete(
    '/grupos/:id/missas/:missaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async request => {
      const { id: grupoId, missaId } = request.params as {
        id: string;
        missaId: string;
      };

      await db
        .update(missas)
        .set({
          deletedAt: new Date(),
          status: 'ARQUIVADA',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(missas.id, missaId),
            eq(missas.grupoId, grupoId)
          )
        );

      return { ok: true };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId/repertorio',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const missaId = (request.params as { missaId: string }).missaId;
      const parsed = repertorioSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Repertório inválido.'
        });
      }

      await db
        .delete(missaMusicas)
        .where(eq(missaMusicas.missaId, missaId));

      if (parsed.data.itens.length) {
        await db.insert(missaMusicas).values(
          parsed.data.itens.map((item, index) => ({
            missaId,
            musicaId: item.musicaId,
            momentoId: item.momentoId,
            ordem: index + 1,
            tomDaExecucao: item.tomDaExecucao || null,
            observacao: item.observacao || null
          }))
        );
      }

      return { ok: true };
    }
  );

  app.put(
    '/grupos/:id/missas/:missaId/escala',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const missaId = (request.params as { missaId: string }).missaId;
      const parsed = escalaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Escala inválida.'
        });
      }

      await db
        .delete(missaEscala)
        .where(eq(missaEscala.missaId, missaId));

      if (parsed.data.itens.length) {
        await db.insert(missaEscala).values(
          parsed.data.itens.map(item => ({
            missaId,
            userId: item.userId,
            instrumentoVoz: item.instrumentoVoz || null
          }))
        );
      }

      return { ok: true };
    }
  );

  app.post(
    '/grupos/:id/missas/:missaId/publicar',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const { id: grupoId, missaId } = request.params as {
        id: string;
        missaId: string;
      };

      const token = crypto.randomBytes(24).toString('hex');

      const [missa] = await db
        .update(missas)
        .set({
          status: 'PUBLICADA',
          tokenPublico: token,
          publicadoEm: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(missas.id, missaId),
            eq(missas.grupoId, grupoId)
          )
        )
        .returning();

      if (!missa) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Celebração não encontrada.'
        });
      }

      const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

      return {
        token,
        publicUrl: `${base}/celebracao/${token}`
      };
    }
  );

  app.post(
    '/grupos/:id/missas/:missaId/confirmar',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const missaId = (request.params as { missaId: string }).missaId;
      const parsed = confirmacaoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Confirmação inválida.'
        });
      }

      const [item] = await db
        .update(missaEscala)
        .set({
          confirmacao: parsed.data.confirmacao,
          respondidoEm: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(missaEscala.missaId, missaId),
            eq(missaEscala.userId, request.user.sub)
          )
        )
        .returning();

      if (!item) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Você não está escalado nesta celebração.'
        });
      }

      return item;
    }
  );
}

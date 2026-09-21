import type { FastifyInstance } from 'fastify';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/client.js';
import {
  momentos,
  musicaMomentos,
  musicas
} from '../db/schema.js';

const createMomentoSchema = z.object({
  nome: z.string().min(2).max(120),
  ordemLiturgica: z.number().int().min(1).max(999).optional()
});

const updateMusicaMomentosSchema = z.object({
  momentoIds: z.array(z.string().uuid()).max(30)
});

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export async function momentoRoutes(app: FastifyInstance) {
  app.get(
    '/grupos/:id/momentos',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async request => {
      const grupoId = (request.params as { id: string }).id;

      return db
        .select({
          id: momentos.id,
          nome: momentos.nome,
          slug: momentos.slug,
          ordemLiturgica: momentos.ordemLiturgica,
          grupoId: momentos.grupoId
        })
        .from(momentos)
        .where(
          or(
            isNull(momentos.grupoId),
            eq(momentos.grupoId, grupoId)
          )
        )
        .orderBy(
          asc(momentos.ordemLiturgica),
          asc(momentos.nome)
        );
    }
  );

  app.post(
    '/grupos/:id/momentos',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const grupoId = (request.params as { id: string }).id;
      const parsed = createMomentoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do momento litúrgico inválidos.',
          details: parsed.error.flatten()
        });
      }

      const slug = slugify(parsed.data.nome);

      if (!slug) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Nome inválido.'
        });
      }

      const [existente] = await db
        .select({ id: momentos.id })
        .from(momentos)
        .where(
          and(
            eq(momentos.grupoId, grupoId),
            eq(momentos.slug, slug)
          )
        )
        .limit(1);

      if (existente) {
        return reply.code(409).send({
          error: 'CONFLICT',
          message: 'Este momento personalizado já existe.'
        });
      }

      let ordem = parsed.data.ordemLiturgica;

      if (!ordem) {
        const personalizados = await db
          .select({ ordem: momentos.ordemLiturgica })
          .from(momentos)
          .where(eq(momentos.grupoId, grupoId))
          .orderBy(asc(momentos.ordemLiturgica));

        ordem =
          personalizados.length > 0
            ? Math.max(...personalizados.map(item => item.ordem)) + 1
            : 100;
      }

      const [momento] = await db
        .insert(momentos)
        .values({
          grupoId,
          nome: parsed.data.nome.trim(),
          slug,
          ordemLiturgica: ordem
        })
        .returning();

      return reply.code(201).send(momento);
    }
  );

  app.delete(
    '/grupos/:id/momentos/:momentoId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const { id: grupoId, momentoId } = request.params as {
        id: string;
        momentoId: string;
      };

      const [momento] = await db
        .select({
          id: momentos.id,
          grupoId: momentos.grupoId
        })
        .from(momentos)
        .where(eq(momentos.id, momentoId))
        .limit(1);

      if (!momento || momento.grupoId !== grupoId) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Momento personalizado não encontrado.'
        });
      }

      await db
        .delete(musicaMomentos)
        .where(eq(musicaMomentos.momentoId, momentoId));

      await db
        .delete(momentos)
        .where(
          and(
            eq(momentos.id, momentoId),
            eq(momentos.grupoId, grupoId)
          )
        );

      return { ok: true };
    }
  );

  app.get(
    '/grupos/:id/musicas/:musicaId/momentos',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const { id: grupoId, musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      const [musica] = await db
        .select({ id: musicas.id })
        .from(musicas)
        .where(
          and(
            eq(musicas.id, musicaId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .limit(1);

      if (!musica) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      const itens = await db
        .select({
          id: momentos.id,
          nome: momentos.nome,
          slug: momentos.slug,
          ordemLiturgica: momentos.ordemLiturgica,
          grupoId: momentos.grupoId
        })
        .from(musicaMomentos)
        .innerJoin(
          momentos,
          eq(momentos.id, musicaMomentos.momentoId)
        )
        .where(eq(musicaMomentos.musicaId, musicaId))
        .orderBy(asc(momentos.ordemLiturgica));

      return itens;
    }
  );

  app.put(
    '/grupos/:id/musicas/:musicaId/momentos',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const { id: grupoId, musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      const parsed = updateMusicaMomentosSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Seleção de momentos inválida.',
          details: parsed.error.flatten()
        });
      }

      const [musica] = await db
        .select({ id: musicas.id })
        .from(musicas)
        .where(
          and(
            eq(musicas.id, musicaId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .limit(1);

      if (!musica) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      const ids = [...new Set(parsed.data.momentoIds)];

      if (ids.length > 0) {
        const validos = await db
          .select({ id: momentos.id })
          .from(momentos)
          .where(
            and(
              inArray(momentos.id, ids),
              or(
                isNull(momentos.grupoId),
                eq(momentos.grupoId, grupoId)
              )
            )
          );

        if (validos.length !== ids.length) {
          return reply.code(400).send({
            error: 'INVALID_MOMENT',
            message: 'Um ou mais momentos não pertencem a este grupo.'
          });
        }
      }

      await db.transaction(async tx => {
        await tx
          .delete(musicaMomentos)
          .where(eq(musicaMomentos.musicaId, musicaId));

        if (ids.length > 0) {
          await tx.insert(musicaMomentos).values(
            ids.map(momentoId => ({
              musicaId,
              momentoId
            }))
          );
        }
      });

      return { ok: true };
    }
  );
}

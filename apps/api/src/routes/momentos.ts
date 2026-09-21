import type { FastifyInstance } from 'fastify';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import { momentoSchema } from '@cantus-dei/shared';
import { z } from 'zod';
import { db } from '../db/client.js';
import { momentos, musicaMomentos, musicas } from '../db/schema.js';

const vinculoSchema = z.object({
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
        .select()
        .from(momentos)
        .where(
          or(
            isNull(momentos.grupoId),
            eq(momentos.grupoId, grupoId)
          )
        )
        .orderBy(asc(momentos.ordemLiturgica), asc(momentos.nome));
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
      const parsed = momentoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Momento inválido.'
        });
      }

      const atuais = await db
        .select({ ordem: momentos.ordemLiturgica })
        .from(momentos)
        .where(eq(momentos.grupoId, grupoId));

      const ordem =
        parsed.data.ordemLiturgica ??
        (atuais.length
          ? Math.max(...atuais.map(x => x.ordem)) + 1
          : 100);

      const [momento] = await db
        .insert(momentos)
        .values({
          grupoId,
          nome: parsed.data.nome.trim(),
          slug: slugify(parsed.data.nome),
          ordemLiturgica: ordem
        })
        .returning();

      return reply.code(201).send(momento);
    }
  );

  app.get(
    '/grupos/:id/musicas/:musicaId/momentos',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async request => {
      const { musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      return db
        .select({
          id: momentos.id,
          nome: momentos.nome,
          slug: momentos.slug,
          ordemLiturgica: momentos.ordemLiturgica,
          grupoId: momentos.grupoId
        })
        .from(musicaMomentos)
        .innerJoin(momentos, eq(momentos.id, musicaMomentos.momentoId))
        .where(eq(musicaMomentos.musicaId, musicaId))
        .orderBy(asc(momentos.ordemLiturgica));
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

      const parsed = vinculoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Seleção inválida.'
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

      if (ids.length) {
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
            message: 'Momento inválido.'
          });
        }
      }

      await db
        .delete(musicaMomentos)
        .where(eq(musicaMomentos.musicaId, musicaId));

      if (ids.length) {
        await db.insert(musicaMomentos).values(
          ids.map(momentoId => ({
            musicaId,
            momentoId
          }))
        );
      }

      return { ok: true };
    }
  );
}

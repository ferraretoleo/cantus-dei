import type { FastifyInstance } from 'fastify';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import { musicaSchema } from '@cantus-dei/shared';
import { db } from '../db/client.js';
import { musicas } from '../db/schema.js';

export async function musicRoutes(app: FastifyInstance) {
  app.get(
    '/grupos/:id/musicas',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async request => {
      const grupoId = (request.params as { id: string }).id;
      const { q } = request.query as { q?: string };

      return db
        .select()
        .from(musicas)
        .where(
          and(
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt),
            q?.trim()
              ? ilike(musicas.titulo, `%${q.trim()}%`)
              : undefined
          )
        )
        .orderBy(musicas.titulo);
    }
  );

  // Todos os integrantes ativos do ministério podem cadastrar músicas.
  app.post(
    '/grupos/:id/musicas',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const grupoId = (request.params as { id: string }).id;
      const parsed = musicaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados da música inválidos.'
        });
      }

      const [musica] = await db
        .insert(musicas)
        .values({
          grupoId,
          ...parsed.data,
          videoUrl: parsed.data.videoUrl || null
        })
        .returning();

      return reply.code(201).send(musica);
    }
  );

  // Edição continua sob responsabilidade da coordenação/responsável.
  app.put(
    '/grupos/:id/musicas/:musicaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL', 'COORDENADOR']
        )
    },
    async (request, reply) => {
      const { id: grupoId, musicaId } =
        request.params as {
          id: string;
          musicaId: string;
        };

      const parsed =
        musicaSchema.partial().safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados da música inválidos.'
        });
      }

      const [musica] = await db
        .update(musicas)
        .set({
          ...parsed.data,
          ...(parsed.data.videoUrl !== undefined
            ? {
                videoUrl:
                  parsed.data.videoUrl || null
              }
            : {}),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(musicas.id, musicaId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .returning();

      if (!musica) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      return musica;
    }
  );

  app.delete(
    '/grupos/:id/musicas/:musicaId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL', 'COORDENADOR']
        )
    },
    async (request, reply) => {
      const { id: grupoId, musicaId } =
        request.params as {
          id: string;
          musicaId: string;
        };

      const [musica] = await db
        .update(musicas)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(musicas.id, musicaId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .returning({
          id: musicas.id
        });

      if (!musica) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      return {
        ok: true
      };
    }
  );
}

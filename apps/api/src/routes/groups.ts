import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { createConviteSchema, createGrupoSchema } from '@cantus-dei/shared';
import { db } from '../db/client.js';
import {
  convites,
  grupoMembros,
  grupos,
  users
} from '../db/schema.js';

export async function groupRoutes(app: FastifyInstance) {
  app.get('/me/grupos', { preHandler: app.authenticate }, async request => {
    return db
      .select({
        id: grupos.id,
        nome: grupos.nome,
        slug: grupos.slug,
        paroquia: grupos.paroquia,
        cidade: grupos.cidade,
        corTema: grupos.corTema,
        papel: grupoMembros.papel
      })
      .from(grupoMembros)
      .innerJoin(grupos, eq(grupos.id, grupoMembros.grupoId))
      .where(
        and(
          eq(grupoMembros.userId, request.user.sub),
          eq(grupoMembros.ativo, true),
          eq(grupos.ativo, true)
        )
      );
  });

  app.post('/grupos', { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = createGrupoSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos'
      });
    }

    return db.transaction(async tx => {
      const [grupo] = await tx
        .insert(grupos)
        .values(parsed.data)
        .returning();

      await tx.insert(grupoMembros).values({
        grupoId: grupo.id,
        userId: request.user.sub,
        papel: 'RESPONSAVEL'
      });

      return reply.code(201).send({
        ...grupo,
        papel: 'RESPONSAVEL'
      });
    });
  });

  app.get(
    '/grupos/:id/membros',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async request => {
      const id = (request.params as { id: string }).id;

      return db
        .select({
          userId: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          papel: grupoMembros.papel,
          instrumento: grupoMembros.instrumento,
          voz: grupoMembros.voz
        })
        .from(grupoMembros)
        .innerJoin(users, eq(users.id, grupoMembros.userId))
        .where(
          and(
            eq(grupoMembros.grupoId, id),
            eq(grupoMembros.ativo, true)
          )
        );
    }
  );

  app.post(
    '/grupos/:id/convites',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL'])
    },
    async (request, reply) => {
      const parsed = createConviteSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos'
        });
      }

      const grupoId = (request.params as { id: string }).id;
      const token = crypto.randomBytes(32).toString('base64url');

      const [convite] = await db
        .insert(convites)
        .values({
          grupoId,
          ...parsed.data,
          token,
          convidadoPor: request.user.sub,
          expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })
        .returning();

      const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

      return reply.code(201).send({
        ...convite,
        acceptUrl: `${base}/convites/${token}`
      });
    }
  );
}

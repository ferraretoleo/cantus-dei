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

    let grupoCriadoId: string | null = null;

    try {
      const [grupo] = await db
        .insert(grupos)
        .values(parsed.data)
        .returning();

      grupoCriadoId = grupo.id;

      await db.insert(grupoMembros).values({
        grupoId: grupo.id,
        userId: request.user.sub,
        papel: 'RESPONSAVEL'
      });

      return reply.code(201).send({
        ...grupo,
        papel: 'RESPONSAVEL'
      });
    } catch (error) {
      if (grupoCriadoId) {
        try {
          await db
            .delete(grupos)
            .where(eq(grupos.id, grupoCriadoId));
        } catch {
          // preserva o erro original
        }
      }

      throw error;
    }
  });

  app.delete(
    '/grupos/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const grupoId = (request.params as { id: string }).id;

      const [usuario] = await db
        .select({
          perfilGlobal: users.perfilGlobal
        })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1);

      if (!usuario) {
        return reply.code(401).send({
          error: 'UNAUTHORIZED',
          message: 'Usuário não encontrado.'
        });
      }

      let autorizado = usuario.perfilGlobal === 'MASTER';

      if (!autorizado) {
        const [membro] = await db
          .select({
            papel: grupoMembros.papel
          })
          .from(grupoMembros)
          .where(
            and(
              eq(grupoMembros.grupoId, grupoId),
              eq(grupoMembros.userId, request.user.sub),
              eq(grupoMembros.ativo, true)
            )
          )
          .limit(1);

        autorizado = membro?.papel === 'RESPONSAVEL';
      }

      if (!autorizado) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Somente o MASTER global ou o RESPONSÁVEL pelo grupo pode excluí-lo.'
        });
      }

      const [grupo] = await db
        .select({
          id: grupos.id,
          nome: grupos.nome
        })
        .from(grupos)
        .where(eq(grupos.id, grupoId))
        .limit(1);

      if (!grupo) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Grupo não encontrado.'
        });
      }

      await db
        .delete(grupos)
        .where(eq(grupos.id, grupoId));

      return {
        ok: true,
        id: grupo.id,
        nome: grupo.nome
      };
    }
  );

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

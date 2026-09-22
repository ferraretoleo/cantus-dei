import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import {
  associarParoquiaSchema,
  createParoquiaSchema
} from '@cantus-dei/shared';
import { z } from 'zod';

import { db } from '../db/client.js';
import {
  grupos,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

const perfilSchema = z.object({
  perfilGlobal: z.enum(['USUARIO', 'MASTER'])
});

async function requireMaster(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await request.jwtVerify();

  const [usuario] = await db
    .select({
      id: users.id,
      perfilGlobal: users.perfilGlobal
    })
    .from(users)
    .where(eq(users.id, request.user.sub))
    .limit(1);

  if (!usuario || usuario.perfilGlobal !== 'MASTER') {
    return reply.code(403).send({
      error: 'FORBIDDEN',
      message: 'Acesso exclusivo para usuário MASTER.'
    });
  }
}

export async function masterRoutes(app: FastifyInstance) {
  app.get(
    '/master/usuarios',
    { preHandler: requireMaster },
    async () => {
      return db
        .select({
          id: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          perfilGlobal: users.perfilGlobal,
          ativo: users.ativo,
          createdAt: users.createdAt
        })
        .from(users)
        .orderBy(asc(users.nome));
    }
  );

  app.delete(
    '/master/usuarios/:userId',
    { preHandler: requireMaster },
    async (request, reply) => {
      const { userId } = request.params as {
        userId: string;
      };

      if (userId === request.user.sub) {
        return reply.code(400).send({
          error: 'SELF_DELETE',
          message: 'Você não pode excluir o próprio usuário MASTER.'
        });
      }

      const [usuario] = await db
        .select({
          id: users.id,
          nome: users.nome,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!usuario) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Usuário não encontrado.'
        });
      }

      await db
        .delete(users)
        .where(eq(users.id, userId));

      return {
        ok: true,
        usuario
      };
    }
  );

  app.get(
    '/master/paroquias',
    { preHandler: requireMaster },
    async () => {
      return db
        .select({
          id: paroquias.id,
          nome: paroquias.nome,
          cidade: paroquias.cidade,
          endereco: paroquias.endereco,
          ativo: paroquias.ativo,
          createdAt: paroquias.createdAt
        })
        .from(paroquias)
        .orderBy(asc(paroquias.nome));
    }
  );

  app.post(
    '/master/paroquias',
    { preHandler: requireMaster },
    async (request, reply) => {
      const parsed = createParoquiaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados da paróquia inválidos.'
        });
      }

      const [paroquia] = await db
        .insert(paroquias)
        .values({
          nome: parsed.data.nome.trim(),
          cidade: parsed.data.cidade.trim(),
          endereco: parsed.data.endereco || null
        })
        .returning();

      return reply.code(201).send(paroquia);
    }
  );

  app.delete(
    '/master/paroquias/:id',
    { preHandler: requireMaster },
    async (request, reply) => {
      const paroquiaId = (request.params as {
        id: string;
      }).id;

      const [paroquia] = await db
        .select({
          id: paroquias.id,
          nome: paroquias.nome,
          cidade: paroquias.cidade
        })
        .from(paroquias)
        .where(eq(paroquias.id, paroquiaId))
        .limit(1);

      if (!paroquia) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Paróquia não encontrada.'
        });
      }

      await db
        .delete(paroquias)
        .where(eq(paroquias.id, paroquiaId));

      return {
        ok: true,
        paroquia
      };
    }
  );

  app.get(
    '/master/paroquias/:id/membros',
    { preHandler: requireMaster },
    async request => {
      const paroquiaId = (request.params as {
        id: string;
      }).id;

      return db
        .select({
          userId: users.id,
          nome: users.nome,
          email: users.email,
          papel: paroquiaMembros.papel,
          ativo: paroquiaMembros.ativo
        })
        .from(paroquiaMembros)
        .innerJoin(
          users,
          eq(users.id, paroquiaMembros.userId)
        )
        .where(
          eq(
            paroquiaMembros.paroquiaId,
            paroquiaId
          )
        )
        .orderBy(asc(users.nome));
    }
  );

  app.post(
    '/master/paroquias/:id/membros',
    { preHandler: requireMaster },
    async (request, reply) => {
      const paroquiaId = (request.params as {
        id: string;
      }).id;

      const parsed =
        associarParoquiaSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Vínculo inválido.'
        });
      }

      const [paroquia] = await db
        .select({
          id: paroquias.id
        })
        .from(paroquias)
        .where(
          and(
            eq(paroquias.id, paroquiaId),
            eq(paroquias.ativo, true)
          )
        )
        .limit(1);

      if (!paroquia) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Paróquia não encontrada.'
        });
      }

      await db
        .insert(paroquiaMembros)
        .values({
          paroquiaId,
          userId: parsed.data.userId,
          papel: parsed.data.papel,
          ativo: true
        })
        .onConflictDoUpdate({
          target: [
            paroquiaMembros.paroquiaId,
            paroquiaMembros.userId
          ],
          set: {
            papel: parsed.data.papel,
            ativo: true,
            updatedAt: new Date()
          }
        });

      return {
        ok: true
      };
    }
  );

  app.delete(
    '/master/paroquias/:id/membros/:userId',
    { preHandler: requireMaster },
    async request => {
      const {
        id,
        userId
      } = request.params as {
        id: string;
        userId: string;
      };

      await db
        .delete(paroquiaMembros)
        .where(
          and(
            eq(paroquiaMembros.paroquiaId, id),
            eq(paroquiaMembros.userId, userId)
          )
        );

      return {
        ok: true
      };
    }
  );

  app.get(
    '/master/grupos',
    { preHandler: requireMaster },
    async () => {
      return db
        .select({
          id: grupos.id,
          nome: grupos.nome,
          paroquia: paroquias.nome,
          cidade: paroquias.cidade,
          slug: grupos.slug,
          ativo: grupos.ativo,
          createdAt: grupos.createdAt
        })
        .from(grupos)
        .innerJoin(
          paroquias,
          eq(paroquias.id, grupos.paroquiaId)
        )
        .orderBy(
          asc(paroquias.nome),
          asc(grupos.nome)
        );
    }
  );

  app.put(
    '/master/usuarios/:userId/perfil',
    { preHandler: requireMaster },
    async (request, reply) => {
      const { userId } = request.params as {
        userId: string;
      };

      const parsed = perfilSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Perfil inválido.'
        });
      }

      if (
        userId === request.user.sub &&
        parsed.data.perfilGlobal !== 'MASTER'
      ) {
        return reply.code(400).send({
          error: 'SELF_DEMOTION',
          message: 'Você não pode remover seu próprio perfil MASTER.'
        });
      }

      const [usuario] = await db
        .update(users)
        .set({
          perfilGlobal: parsed.data.perfilGlobal,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          nome: users.nome,
          email: users.email,
          perfilGlobal: users.perfilGlobal
        });

      if (!usuario) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Usuário não encontrado.'
        });
      }

      return usuario;
    }
  );
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/client.js';
import { users } from '../db/schema.js';

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

  app.put(
    '/master/usuarios/:userId/perfil',
    { preHandler: requireMaster },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
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

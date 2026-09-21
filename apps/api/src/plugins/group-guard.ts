import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { grupoMembros } from '../db/schema.js';

export type Papel = 'RESPONSAVEL' | 'COORDENADOR' | 'MUSICO';

export default fp(async app => {
  app.decorate(
    'requireGroupAccess',
    async function (
      request: FastifyRequest,
      reply: FastifyReply,
      allowed?: Papel[]
    ) {
      await app.authenticate(request);

      const params = request.params as Record<string, string>;
      const grupoId = params.id || params.grupoId;

      if (!grupoId) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          message: 'grupo_id ausente'
        });
      }

      const [membro] = await db
        .select({ papel: grupoMembros.papel })
        .from(grupoMembros)
        .where(
          and(
            eq(grupoMembros.grupoId, grupoId),
            eq(grupoMembros.userId, request.user.sub),
            eq(grupoMembros.ativo, true)
          )
        )
        .limit(1);

      if (!membro) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Sem acesso a este grupo.'
        });
      }

      if (allowed && !allowed.includes(membro.papel)) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Permissão insuficiente.'
        });
      }

      request.groupAccess = {
        grupoId,
        papel: membro.papel
      };
    }
  );
});

declare module 'fastify' {
  interface FastifyRequest {
    groupAccess?: {
      grupoId: string;
      papel: Papel;
    };
  }

  interface FastifyInstance {
    requireGroupAccess(
      request: FastifyRequest,
      reply: FastifyReply,
      allowed?: Papel[]
    ): Promise<unknown>;
  }
}

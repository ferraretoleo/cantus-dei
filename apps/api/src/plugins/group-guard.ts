import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  grupoMembros,
  grupos,
  paroquiaMembros,
  users
} from '../db/schema.js';

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

      const [usuario] = await db
        .select({
          perfilGlobal: users.perfilGlobal
        })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1);

      if (usuario?.perfilGlobal === 'MASTER') {
        request.groupAccess = {
          grupoId,
          papel: 'RESPONSAVEL'
        };
        return;
      }

      const [adminParoquia] = await db
        .select({
          papel: paroquiaMembros.papel
        })
        .from(grupos)
        .innerJoin(
          paroquiaMembros,
          and(
            eq(paroquiaMembros.paroquiaId, grupos.paroquiaId),
            eq(paroquiaMembros.userId, request.user.sub),
            eq(paroquiaMembros.ativo, true)
          )
        )
        .where(
          and(
            eq(grupos.id, grupoId),
            eq(paroquiaMembros.papel, 'ADMIN_PAROQUIA')
          )
        )
        .limit(1);

      if (adminParoquia) {
        request.groupAccess = {
          grupoId,
          papel: 'RESPONSAVEL'
        };
        return;
      }

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

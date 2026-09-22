import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from 'fastify';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/client.js';
import {
  paroquias,
  users
} from '../db/schema.js';

const logoSchema=z.object({
  logoData:z
    .string()
    .max(
      750_000,
      'A imagem da logo ficou muito grande.'
    )
    .refine(
      value=>
        /^data:image\/(png|jpeg|jpg|webp);base64,/i
          .test(value),
      'Formato de imagem inválido.'
    )
});

async function requireMaster(
  request:FastifyRequest,
  reply:FastifyReply
) {
  await request.jwtVerify();

  const [usuario]=await db
    .select({
      perfilGlobal:users.perfilGlobal
    })
    .from(users)
    .where(
      eq(
        users.id,
        request.user.sub
      )
    )
    .limit(1);

  if (
    usuario?.perfilGlobal!=='MASTER'
  ) {
    return reply.code(403).send({
      error:'FORBIDDEN',
      message:
        'Apenas o administrador MASTER pode alterar a identidade visual da paróquia.'
    });
  }
}

export async function parishBrandRoutes(
  app:FastifyInstance
) {
  app.get(
    '/public/paroquias/:id/brand',
    async(request,reply)=>{
      const paroquiaId=
        (
          request.params as {
            id:string
          }
        ).id;

      const [paroquia]=await db
        .select({
          id:paroquias.id,
          nome:paroquias.nome,
          cidade:paroquias.cidade,
          logoData:paroquias.logoData
        })
        .from(paroquias)
        .where(
          eq(
            paroquias.id,
            paroquiaId
          )
        )
        .limit(1);

      if (!paroquia) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:
            'Paróquia não encontrada.'
        });
      }

      return paroquia;
    }
  );

  app.put(
    '/master/paroquias/:id/logo',
    {
      preHandler:requireMaster
    },
    async(request,reply)=>{
      const paroquiaId=
        (
          request.params as {
            id:string
          }
        ).id;

      const parsed=
        logoSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]
              ?.message ||
            'Logo inválida.'
        });
      }

      const [paroquia]=await db
        .update(paroquias)
        .set({
          logoData:
            parsed.data.logoData,
          updatedAt:
            new Date()
        })
        .where(
          eq(
            paroquias.id,
            paroquiaId
          )
        )
        .returning({
          id:paroquias.id,
          nome:paroquias.nome,
          cidade:paroquias.cidade,
          logoData:paroquias.logoData
        });

      if (!paroquia) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:
            'Paróquia não encontrada.'
        });
      }

      return paroquia;
    }
  );

  app.delete(
    '/master/paroquias/:id/logo',
    {
      preHandler:requireMaster
    },
    async(request,reply)=>{
      const paroquiaId=
        (
          request.params as {
            id:string
          }
        ).id;

      await db
        .update(paroquias)
        .set({
          logoData:null,
          updatedAt:new Date()
        })
        .where(
          eq(
            paroquias.id,
            paroquiaId
          )
        );

      return {
        ok:true
      };
    }
  );
}

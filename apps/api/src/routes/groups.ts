import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  createConviteSchema,
  createGrupoSchema
} from '@cantus-dei/shared';
import { db } from '../db/client.js';
import {
  convites,
  grupoMembros,
  grupos,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

const adicionarMembroSchema=z.object({
  userId:z.string().uuid(),
  papel:z.enum([
    'RESPONSAVEL',
    'COORDENADOR',
    'MUSICO'
  ]).default('MUSICO'),
  instrumento:z.string().max(80).optional().nullable(),
  voz:z.string().max(30).optional().nullable()
});

export async function groupRoutes(app:FastifyInstance) {
  app.get(
    '/me/grupos',
    { preHandler:app.authenticate },
    async request=>{
      const { paroquiaId }=
        request.query as {
          paroquiaId?:string
        };

      if (!paroquiaId) {
        return [];
      }

      const [usuario]=await db
        .select({
          perfilGlobal:users.perfilGlobal
        })
        .from(users)
        .where(eq(users.id,request.user.sub))
        .limit(1);

      const [vinculoParoquia]=await db
        .select({
          papel:paroquiaMembros.papel
        })
        .from(paroquiaMembros)
        .where(
          and(
            eq(paroquiaMembros.paroquiaId,paroquiaId),
            eq(paroquiaMembros.userId,request.user.sub),
            eq(paroquiaMembros.ativo,true)
          )
        )
        .limit(1);

      const acessoTotal=
        usuario?.perfilGlobal==='MASTER' ||
        vinculoParoquia?.papel==='ADMIN_PAROQUIA';

      if (acessoTotal) {
        return db
          .select({
            id:grupos.id,
            nome:grupos.nome,
            slug:grupos.slug,
            corTema:grupos.corTema,
            papel:grupoMembros.papel,
            paroquiaId:paroquias.id,
            paroquia:paroquias.nome,
            cidade:paroquias.cidade
          })
          .from(grupos)
          .innerJoin(
            paroquias,
            eq(paroquias.id,grupos.paroquiaId)
          )
          .leftJoin(
            grupoMembros,
            and(
              eq(grupoMembros.grupoId,grupos.id),
              eq(grupoMembros.userId,request.user.sub),
              eq(grupoMembros.ativo,true)
            )
          )
          .where(
            and(
              eq(grupos.paroquiaId,paroquiaId),
              eq(grupos.ativo,true),
              eq(paroquias.ativo,true)
            )
          );
      }

      return db
        .select({
          id:grupos.id,
          nome:grupos.nome,
          slug:grupos.slug,
          corTema:grupos.corTema,
          papel:grupoMembros.papel,
          paroquiaId:paroquias.id,
          paroquia:paroquias.nome,
          cidade:paroquias.cidade
        })
        .from(grupoMembros)
        .innerJoin(
          grupos,
          eq(grupos.id,grupoMembros.grupoId)
        )
        .innerJoin(
          paroquias,
          eq(paroquias.id,grupos.paroquiaId)
        )
        .where(
          and(
            eq(grupoMembros.userId,request.user.sub),
            eq(grupoMembros.ativo,true),
            eq(grupos.paroquiaId,paroquiaId),
            eq(grupos.ativo,true),
            eq(paroquias.ativo,true)
          )
        );
    }
  );

  app.post(
    '/grupos',
    { preHandler:app.authenticate },
    async(request,reply)=>{
      const parsed=createGrupoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:'Dados inválidos'
        });
      }

      const [usuario]=await db
        .select({
          perfilGlobal:users.perfilGlobal
        })
        .from(users)
        .where(eq(users.id,request.user.sub))
        .limit(1);

      let autorizado=
        usuario?.perfilGlobal==='MASTER';

      if (!autorizado) {
        const [vinculo]=await db
          .select({
            papel:paroquiaMembros.papel
          })
          .from(paroquiaMembros)
          .where(
            and(
              eq(
                paroquiaMembros.paroquiaId,
                parsed.data.paroquiaId
              ),
              eq(
                paroquiaMembros.userId,
                request.user.sub
              ),
              eq(paroquiaMembros.ativo,true)
            )
          )
          .limit(1);

        autorizado=
          vinculo?.papel==='ADMIN_PAROQUIA';
      }

      if (!autorizado) {
        return reply.code(403).send({
          error:'FORBIDDEN',
          message:'Somente MASTER ou administrador da paróquia pode criar grupos.'
        });
      }

      const [paroquia]=await db
        .select({
          id:paroquias.id,
          nome:paroquias.nome,
          cidade:paroquias.cidade
        })
        .from(paroquias)
        .where(
          and(
            eq(paroquias.id,parsed.data.paroquiaId),
            eq(paroquias.ativo,true)
          )
        )
        .limit(1);

      if (!paroquia) {
        return reply.code(400).send({
          error:'INVALID_PARISH',
          message:'Paróquia inválida.'
        });
      }

      let grupoCriadoId:string|null=null;

      try {
        const [grupo]=await db
          .insert(grupos)
          .values({
            nome:parsed.data.nome,
            paroquiaId:parsed.data.paroquiaId,
            slug:parsed.data.slug,
            corTema:parsed.data.corTema
          })
          .returning();

        grupoCriadoId=grupo.id;

        await db
          .insert(grupoMembros)
          .values({
            grupoId:grupo.id,
            userId:request.user.sub,
            papel:'RESPONSAVEL'
          });

        return reply.code(201).send({
          ...grupo,
          papel:'RESPONSAVEL',
          paroquia:paroquia.nome,
          cidade:paroquia.cidade
        });
      } catch(error) {
        if (grupoCriadoId) {
          try {
            await db
              .delete(grupos)
              .where(eq(grupos.id,grupoCriadoId));
          } catch {}
        }

        throw error;
      }
    }
  );

  app.get(
    '/grupos/:id/membros',
    {
      preHandler:(req,rep)=>
        app.requireGroupAccess(req,rep)
    },
    async request=>{
      const id=
        (request.params as {id:string}).id;

      return db
        .select({
          userId:users.id,
          nome:users.nome,
          email:users.email,
          telefone:users.telefone,
          papel:grupoMembros.papel,
          instrumento:grupoMembros.instrumento,
          voz:grupoMembros.voz
        })
        .from(grupoMembros)
        .innerJoin(
          users,
          eq(users.id,grupoMembros.userId)
        )
        .where(
          and(
            eq(grupoMembros.grupoId,id),
            eq(grupoMembros.ativo,true)
          )
        );
    }
  );

  // Lista pessoas da paróquia que ainda não estão no ministério.
  app.get(
    '/grupos/:id/candidatos',
    {
      preHandler:(req,rep)=>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async(request,reply)=>{
      const grupoId=
        (request.params as {id:string}).id;

      const [grupo]=await db
        .select({
          paroquiaId:grupos.paroquiaId
        })
        .from(grupos)
        .where(eq(grupos.id,grupoId))
        .limit(1);

      if (!grupo) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:'Ministério não encontrado.'
        });
      }

      const pessoas=await db
        .select({
          userId:users.id,
          nome:users.nome,
          email:users.email,
          telefone:users.telefone
        })
        .from(paroquiaMembros)
        .innerJoin(
          users,
          eq(users.id,paroquiaMembros.userId)
        )
        .where(
          and(
            eq(
              paroquiaMembros.paroquiaId,
              grupo.paroquiaId
            ),
            eq(paroquiaMembros.ativo,true),
            eq(users.ativo,true)
          )
        );

      const atuais=await db
        .select({
          userId:grupoMembros.userId
        })
        .from(grupoMembros)
        .where(
          and(
            eq(grupoMembros.grupoId,grupoId),
            eq(grupoMembros.ativo,true)
          )
        );

      const idsAtuais=
        new Set(atuais.map(x=>x.userId));

      return pessoas.filter(
        pessoa=>!idsAtuais.has(pessoa.userId)
      );
    }
  );

  // Responsável do ministério, ADMIN_PAROQUIA ou MASTER podem adicionar integrante.
  app.post(
    '/grupos/:id/membros',
    {
      preHandler:(req,rep)=>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async(request,reply)=>{
      const grupoId=
        (request.params as {id:string}).id;

      const parsed=
        adicionarMembroSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:'Dados do integrante inválidos.'
        });
      }

      const [grupo]=await db
        .select({
          paroquiaId:grupos.paroquiaId
        })
        .from(grupos)
        .where(eq(grupos.id,grupoId))
        .limit(1);

      if (!grupo) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:'Ministério não encontrado.'
        });
      }

      const [vinculo]=await db
        .select({
          userId:paroquiaMembros.userId
        })
        .from(paroquiaMembros)
        .where(
          and(
            eq(
              paroquiaMembros.paroquiaId,
              grupo.paroquiaId
            ),
            eq(
              paroquiaMembros.userId,
              parsed.data.userId
            ),
            eq(paroquiaMembros.ativo,true)
          )
        )
        .limit(1);

      if (!vinculo) {
        return reply.code(400).send({
          error:'NOT_PARISH_MEMBER',
          message:'O integrante precisa estar vinculado à paróquia.'
        });
      }

      await db
        .insert(grupoMembros)
        .values({
          grupoId,
          userId:parsed.data.userId,
          papel:parsed.data.papel,
          instrumento:parsed.data.instrumento||null,
          voz:parsed.data.voz||null,
          ativo:true
        })
        .onConflictDoUpdate({
          target:[
            grupoMembros.grupoId,
            grupoMembros.userId
          ],
          set:{
            papel:parsed.data.papel,
            instrumento:parsed.data.instrumento||null,
            voz:parsed.data.voz||null,
            ativo:true,
            updatedAt:new Date()
          }
        });

      return {
        ok:true
      };
    }
  );

  app.post(
    '/grupos/:id/convites',
    {
      preHandler:(req,rep)=>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async(request,reply)=>{
      const parsed=
        createConviteSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:'Dados inválidos'
        });
      }

      const grupoId=
        (request.params as {id:string}).id;

      const token=
        crypto.randomBytes(32).toString('base64url');

      const [convite]=await db
        .insert(convites)
        .values({
          grupoId,
          ...parsed.data,
          token,
          convidadoPor:request.user.sub,
          expiraEm:new Date(
            Date.now()+7*24*60*60*1000
          )
        })
        .returning();

      const base=
        process.env.PUBLIC_BASE_URL ||
        'http://localhost:5173';

      return reply.code(201).send({
        ...convite,
        acceptUrl:`${base}/convites/${token}`
      });
    }
  );

  app.delete(
    '/grupos/:id',
    { preHandler:app.authenticate },
    async(request,reply)=>{
      const grupoId=
        (request.params as {id:string}).id;

      const [usuario]=await db
        .select({
          perfilGlobal:users.perfilGlobal
        })
        .from(users)
        .where(eq(users.id,request.user.sub))
        .limit(1);

      let autorizado=
        usuario?.perfilGlobal==='MASTER';

      if (!autorizado) {
        const [membro]=await db
          .select({
            papel:grupoMembros.papel
          })
          .from(grupoMembros)
          .where(
            and(
              eq(grupoMembros.grupoId,grupoId),
              eq(
                grupoMembros.userId,
                request.user.sub
              ),
              eq(grupoMembros.ativo,true)
            )
          )
          .limit(1);

        autorizado=
          membro?.papel==='RESPONSAVEL';
      }

      if (!autorizado) {
        return reply.code(403).send({
          error:'FORBIDDEN',
          message:'Sem permissão para excluir este grupo.'
        });
      }

      await db
        .delete(grupos)
        .where(eq(grupos.id,grupoId));

      return {
        ok:true
      };
    }
  );
}

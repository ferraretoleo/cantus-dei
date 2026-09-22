import type { FastifyInstance } from 'fastify';
import { and, eq, gt } from 'drizzle-orm';
import argon2 from 'argon2';
import { z } from 'zod';

import { db } from '../db/client.js';
import {
  convites,
  grupoMembros,
  grupos,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

const aceitarNovoUsuarioSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255).optional(),
  telefone: z.string().max(30).optional().nullable(),
  senha: z.string().min(8).max(128)
});

export async function inviteRoutes(app:FastifyInstance) {
  app.get('/convites/:token',async(request,reply)=>{
    const token=(request.params as {token:string}).token;

    const [convite]=await db.select({
      token:convites.token,
      status:convites.status,
      expiraEm:convites.expiraEm,
      papelProposto:convites.papelProposto,
      email:convites.email,
      telefone:convites.telefone,
      grupoId:grupos.id,
      grupoNome:grupos.nome,
      paroquiaId:paroquias.id,
      paroquia:paroquias.nome,
      cidade:paroquias.cidade
    }).from(convites)
      .innerJoin(grupos,eq(grupos.id,convites.grupoId))
      .innerJoin(paroquias,eq(paroquias.id,grupos.paroquiaId))
      .where(eq(convites.token,token))
      .limit(1);

    if (!convite) {
      return reply.code(404).send({
        error:'NOT_FOUND',
        message:'Convite não encontrado.'
      });
    }

    return convite;
  });

  app.post('/convites/:token/aceitar-novo',
    async(request,reply)=>{
      const token=(request.params as {token:string}).token;
      const parsed=aceitarNovoUsuarioSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:'Preencha nome, e-mail válido e uma senha com pelo menos 8 caracteres.'
        });
      }

      const [convite]=await db.select({
        id:convites.id,
        email:convites.email,
        telefone:convites.telefone,
        grupoId:convites.grupoId,
        papelProposto:convites.papelProposto,
        paroquiaId:grupos.paroquiaId,
        grupoNome:grupos.nome,
        grupoSlug:grupos.slug,
        paroquiaNome:paroquias.nome,
        cidade:paroquias.cidade
      }).from(convites)
        .innerJoin(grupos,eq(grupos.id,convites.grupoId))
        .innerJoin(paroquias,eq(paroquias.id,grupos.paroquiaId))
        .where(and(
          eq(convites.token,token),
          eq(convites.status,'PENDENTE'),
          gt(convites.expiraEm,new Date())
        ))
        .limit(1);

      if (!convite) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:'Convite inválido, expirado ou já utilizado.'
        });
      }

      const email=(convite.email || parsed.data.email || '')
        .trim()
        .toLowerCase();

      if (!email) {
        return reply.code(400).send({
          error:'EMAIL_REQUIRED',
          message:'Informe um e-mail para criar sua conta.'
        });
      }

      const [existente]=await db.select({
        id:users.id
      }).from(users)
        .where(eq(users.email,email))
        .limit(1);

      if (existente) {
        return reply.code(409).send({
          error:'ACCOUNT_EXISTS',
          message:'Já existe uma conta com este e-mail. Entre com sua conta e aceite o convite.'
        });
      }

      const senhaHash=await argon2.hash(parsed.data.senha);
      let userId:string|null=null;

      try {
        const [user]=await db.insert(users).values({
          nome:parsed.data.nome.trim(),
          email,
          telefone:parsed.data.telefone || convite.telefone || null,
          senhaHash,
          perfilGlobal:'USUARIO'
        }).returning({
          id:users.id,
          nome:users.nome,
          email:users.email,
          perfilGlobal:users.perfilGlobal
        });

        userId=user.id;

        await db.insert(paroquiaMembros).values({
          paroquiaId:convite.paroquiaId,
          userId:user.id,
          papel:'MEMBRO',
          ativo:true
        }).onConflictDoUpdate({
          target:[
            paroquiaMembros.paroquiaId,
            paroquiaMembros.userId
          ],
          set:{
            ativo:true,
            updatedAt:new Date()
          }
        });

        await db.insert(grupoMembros).values({
          grupoId:convite.grupoId,
          userId:user.id,
          papel:convite.papelProposto,
          ativo:true
        }).onConflictDoUpdate({
          target:[
            grupoMembros.grupoId,
            grupoMembros.userId
          ],
          set:{
            papel:convite.papelProposto,
            ativo:true,
            updatedAt:new Date()
          }
        });

        await db.update(convites)
          .set({
            status:'ACEITO',
            updatedAt:new Date()
          })
          .where(eq(convites.id,convite.id));

        const authToken=app.jwt.sign(
          {
            sub:user.id,
            email:user.email
          },
          {
            expiresIn:'12h'
          }
        );

        return reply.code(201).send({
          ok:true,
          token:authToken,
          user,
          paroquia:{
            id:convite.paroquiaId,
            nome:convite.paroquiaNome,
            cidade:convite.cidade,
            papel:'MEMBRO'
          },
          grupo:{
            id:convite.grupoId,
            nome:convite.grupoNome,
            slug:convite.grupoSlug,
            paroquia:convite.paroquiaNome,
            cidade:convite.cidade,
            papel:convite.papelProposto
          }
        });
      } catch(error) {
        if (userId) {
          try {
            await db.delete(users)
              .where(eq(users.id,userId));
          } catch {}
        }

        throw error;
      }
    }
  );

  app.post('/convites/:token/aceitar',
    { preHandler:app.authenticate },
    async(request,reply)=>{
      const token=(request.params as {token:string}).token;

      const [convite]=await db.select({
        id:convites.id,
        email:convites.email,
        grupoId:convites.grupoId,
        papelProposto:convites.papelProposto,
        paroquiaId:grupos.paroquiaId
      }).from(convites)
        .innerJoin(grupos,eq(grupos.id,convites.grupoId))
        .where(and(
          eq(convites.token,token),
          eq(convites.status,'PENDENTE'),
          gt(convites.expiraEm,new Date())
        ))
        .limit(1);

      if (!convite) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:'Convite inválido ou expirado.'
        });
      }

      if (convite.email) {
        const [usuario]=await db.select({
          email:users.email
        }).from(users)
          .where(eq(users.id,request.user.sub))
          .limit(1);

        if (
          !usuario ||
          usuario.email.toLowerCase() !== convite.email.toLowerCase()
        ) {
          return reply.code(403).send({
            error:'WRONG_ACCOUNT',
            message:'Este convite foi enviado para outro e-mail. Entre com a conta correspondente.'
          });
        }
      }

      await db.insert(paroquiaMembros).values({
        paroquiaId:convite.paroquiaId,
        userId:request.user.sub,
        papel:'MEMBRO',
        ativo:true
      }).onConflictDoUpdate({
        target:[
          paroquiaMembros.paroquiaId,
          paroquiaMembros.userId
        ],
        set:{
          ativo:true,
          updatedAt:new Date()
        }
      });

      await db.insert(grupoMembros).values({
        grupoId:convite.grupoId,
        userId:request.user.sub,
        papel:convite.papelProposto
      }).onConflictDoUpdate({
        target:[
          grupoMembros.grupoId,
          grupoMembros.userId
        ],
        set:{
          papel:convite.papelProposto,
          ativo:true,
          updatedAt:new Date()
        }
      });

      await db.update(convites)
        .set({
          status:'ACEITO',
          updatedAt:new Date()
        })
        .where(eq(convites.id,convite.id));

      return {
        ok:true,
        grupoId:convite.grupoId,
        paroquiaId:convite.paroquiaId
      };
    });
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import argon2 from 'argon2';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/client.js';
import {
  grupoMembros,
  grupos,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

const novoUsuarioSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255),
  telefone: z.string().max(30).optional().nullable(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  senha: z.string().min(8).max(128).optional(),
  papel: z.enum(['ADMIN_PAROQUIA', 'MEMBRO']).default('MEMBRO')
});

const membroGrupoSchema = z.object({
  userId: z.string().uuid(),
  papel: z.enum(['RESPONSAVEL', 'COORDENADOR', 'MUSICO']).default('MUSICO'),
  instrumento: z.string().max(80).optional().nullable(),
  voz: z.string().max(30).optional().nullable()
});

const usuarioUpdateSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255),
  telefone: z.string().max(30).optional().nullable(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  senha: z.string().min(8).max(128).optional()
});

async function podeAdministrarParoquia(
  request: FastifyRequest,
  reply: FastifyReply,
  paroquiaId: string
) {
  await request.jwtVerify();

  const [usuario] = await db
    .select({
      perfilGlobal: users.perfilGlobal
    })
    .from(users)
    .where(eq(users.id, request.user.sub))
    .limit(1);

  if (usuario?.perfilGlobal === 'MASTER') {
    return true;
  }

  const [vinculo] = await db
    .select({
      papel: paroquiaMembros.papel
    })
    .from(paroquiaMembros)
    .where(
      and(
        eq(paroquiaMembros.paroquiaId, paroquiaId),
        eq(paroquiaMembros.userId, request.user.sub),
        eq(paroquiaMembros.ativo, true)
      )
    )
    .limit(1);

  if (vinculo?.papel !== 'ADMIN_PAROQUIA') {
    reply.code(403).send({
      error: 'FORBIDDEN',
      message: 'Acesso exclusivo para administrador da paróquia.'
    });
    return false;
  }

  return true;
}

export async function paroquiaRoutes(app: FastifyInstance) {
  app.get('/public/paroquias', async () => {
    return db
      .select({
        id: paroquias.id,
        nome: paroquias.nome,
        cidade: paroquias.cidade
      })
      .from(paroquias)
      .where(eq(paroquias.ativo, true))
      .orderBy(asc(paroquias.nome), asc(paroquias.cidade));
  });

  app.get('/me/paroquias', { preHandler: app.authenticate }, async request => {
    const [usuario] = await db
      .select({
        perfilGlobal: users.perfilGlobal
      })
      .from(users)
      .where(eq(users.id, request.user.sub))
      .limit(1);

    if (usuario?.perfilGlobal === 'MASTER') {
      const lista = await db
        .select({
          id: paroquias.id,
          nome: paroquias.nome,
          cidade: paroquias.cidade,
          endereco: paroquias.endereco
        })
        .from(paroquias)
        .where(eq(paroquias.ativo, true))
        .orderBy(asc(paroquias.nome));

      return lista.map(p => ({
        ...p,
        papel: 'MASTER' as const
      }));
    }

    return db
      .select({
        id: paroquias.id,
        nome: paroquias.nome,
        cidade: paroquias.cidade,
        endereco: paroquias.endereco,
        papel: paroquiaMembros.papel
      })
      .from(paroquiaMembros)
      .innerJoin(
        paroquias,
        eq(paroquias.id, paroquiaMembros.paroquiaId)
      )
      .where(
        and(
          eq(paroquiaMembros.userId, request.user.sub),
          eq(paroquiaMembros.ativo, true),
          eq(paroquias.ativo, true)
        )
      )
      .orderBy(asc(paroquias.nome));
  });

  app.get(
    '/paroquias/:id/membros',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const paroquiaId = (request.params as { id: string }).id;

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      return db
        .select({
          userId: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          dataNascimento: users.dataNascimento,
          perfilGlobal: users.perfilGlobal,
          papel: paroquiaMembros.papel,
          ativo: paroquiaMembros.ativo
        })
        .from(paroquiaMembros)
        .innerJoin(
          users,
          eq(users.id, paroquiaMembros.userId)
        )
        .where(
          and(
            eq(paroquiaMembros.paroquiaId, paroquiaId),
            eq(paroquiaMembros.ativo, true)
          )
        )
        .orderBy(asc(users.nome));
    }
  );

  app.post(
    '/paroquias/:id/usuarios',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const paroquiaId = (request.params as { id: string }).id;

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      const parsed = novoUsuarioSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do músico inválidos.'
        });
      }

      const email = parsed.data.email.toLowerCase();

      let [usuario] = await db
        .select({
          id: users.id,
          nome: users.nome,
          email: users.email
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let criado = false;

      if (!usuario) {
        if (!parsed.data.senha) {
          return reply.code(400).send({
            error: 'PASSWORD_REQUIRED',
            message: 'Informe uma senha inicial para criar um novo usuário.'
          });
        }

        const senhaHash = await argon2.hash(parsed.data.senha);

        [usuario] = await db
          .insert(users)
          .values({
            nome: parsed.data.nome,
            email,
            telefone: parsed.data.telefone || null,
            dataNascimento: parsed.data.dataNascimento || null,
            senhaHash,
            perfilGlobal: 'USUARIO'
          })
          .returning({
            id: users.id,
            nome: users.nome,
            email: users.email
          });

        criado = true;
      }

      await db
        .insert(paroquiaMembros)
        .values({
          paroquiaId,
          userId: usuario.id,
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

      return reply.code(criado ? 201 : 200).send({
        ...usuario,
        criado,
        papel: parsed.data.papel
      });
    }
  );

  app.put(
    '/paroquias/:id/usuarios/:userId',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id: paroquiaId, userId } = request.params as {
        id: string;
        userId: string;
      };

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      const parsed = usuarioUpdateSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do usuário inválidos.'
        });
      }

      const [solicitante] = await db
        .select({ perfilGlobal: users.perfilGlobal })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1);

      const [vinculo] = await db
        .select({
          userId: paroquiaMembros.userId,
          perfilGlobal: users.perfilGlobal
        })
        .from(paroquiaMembros)
        .innerJoin(users, eq(users.id, paroquiaMembros.userId))
        .where(
          and(
            eq(paroquiaMembros.paroquiaId, paroquiaId),
            eq(paroquiaMembros.userId, userId),
            eq(paroquiaMembros.ativo, true)
          )
        )
        .limit(1);

      if (!vinculo) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Usuário não está vinculado a esta paróquia.'
        });
      }

      if (
        vinculo.perfilGlobal === 'MASTER' &&
        solicitante?.perfilGlobal !== 'MASTER'
      ) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Administrador local não pode alterar um usuário MASTER.'
        });
      }

      const email = parsed.data.email.trim().toLowerCase();

      const [emailExistente] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailExistente && emailExistente.id !== userId) {
        return reply.code(409).send({
          error: 'EMAIL_IN_USE',
          message: 'Este e-mail já está cadastrado para outro usuário.'
        });
      }

      const alteracoes: {
        nome: string;
        email: string;
        telefone: string | null;
        dataNascimento: string | null;
        updatedAt: Date;
        senhaHash?: string;
      } = {
        nome: parsed.data.nome.trim(),
        email,
        telefone: parsed.data.telefone?.trim() || null,
        dataNascimento: parsed.data.dataNascimento || null,
        updatedAt: new Date()
      };

      if (parsed.data.senha) {
        alteracoes.senhaHash = await argon2.hash(parsed.data.senha);
      }

      const [usuario] = await db
        .update(users)
        .set(alteracoes)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          perfilGlobal: users.perfilGlobal
        });

      return usuario;
    }
  );

  app.get(
    '/paroquias/:id/grupos',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const paroquiaId = (request.params as { id: string }).id;

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      return db
        .select({
          id: grupos.id,
          nome: grupos.nome,
          slug: grupos.slug,
          corTema: grupos.corTema,
          ativo: grupos.ativo
        })
        .from(grupos)
        .where(
          and(
            eq(grupos.paroquiaId, paroquiaId),
            eq(grupos.ativo, true)
          )
        )
        .orderBy(asc(grupos.nome));
    }
  );

  app.get(
    '/paroquias/:id/grupos/:grupoId/membros',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id: paroquiaId, grupoId } = request.params as {
        id: string;
        grupoId: string;
      };

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      return db
        .select({
          userId: users.id,
          nome: users.nome,
          email: users.email,
          papel: grupoMembros.papel,
          instrumento: grupoMembros.instrumento,
          voz: grupoMembros.voz
        })
        .from(grupoMembros)
        .innerJoin(
          users,
          eq(users.id, grupoMembros.userId)
        )
        .innerJoin(
          grupos,
          eq(grupos.id, grupoMembros.grupoId)
        )
        .where(
          and(
            eq(grupoMembros.grupoId, grupoId),
            eq(grupos.paroquiaId, paroquiaId),
            eq(grupoMembros.ativo, true)
          )
        )
        .orderBy(asc(users.nome));
    }
  );

  app.post(
    '/paroquias/:id/grupos/:grupoId/membros',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id: paroquiaId, grupoId } = request.params as {
        id: string;
        grupoId: string;
      };

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      const parsed = membroGrupoSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do integrante inválidos.'
        });
      }

      const [grupo] = await db
        .select({
          id: grupos.id
        })
        .from(grupos)
        .where(
          and(
            eq(grupos.id, grupoId),
            eq(grupos.paroquiaId, paroquiaId),
            eq(grupos.ativo, true)
          )
        )
        .limit(1);

      if (!grupo) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Grupo não pertence a esta paróquia.'
        });
      }

      const [membroParoquia] = await db
        .select({
          userId: paroquiaMembros.userId
        })
        .from(paroquiaMembros)
        .where(
          and(
            eq(paroquiaMembros.paroquiaId, paroquiaId),
            eq(paroquiaMembros.userId, parsed.data.userId),
            eq(paroquiaMembros.ativo, true)
          )
        )
        .limit(1);

      if (!membroParoquia) {
        return reply.code(400).send({
          error: 'NOT_PARISH_MEMBER',
          message: 'O usuário precisa pertencer à paróquia antes de entrar no grupo.'
        });
      }

      await db
        .insert(grupoMembros)
        .values({
          grupoId,
          userId: parsed.data.userId,
          papel: parsed.data.papel,
          instrumento: parsed.data.instrumento || null,
          voz: parsed.data.voz || null,
          ativo: true
        })
        .onConflictDoUpdate({
          target: [
            grupoMembros.grupoId,
            grupoMembros.userId
          ],
          set: {
            papel: parsed.data.papel,
            instrumento: parsed.data.instrumento || null,
            voz: parsed.data.voz || null,
            ativo: true,
            updatedAt: new Date()
          }
        });

      return { ok: true };
    }
  );

  app.delete(
    '/paroquias/:id/grupos/:grupoId/membros/:userId',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id: paroquiaId, grupoId, userId } = request.params as {
        id: string;
        grupoId: string;
        userId: string;
      };

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      await db
        .delete(grupoMembros)
        .where(
          and(
            eq(grupoMembros.grupoId, grupoId),
            eq(grupoMembros.userId, userId)
          )
        );

      return { ok: true };
    }
  );
}

import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { loginSchema, registerSchema } from '@cantus-dei/shared';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

function deveSerMaster(email: string) {
  const masterEmail = process.env.MASTER_EMAIL?.trim().toLowerCase();
  return !!masterEmail && email.toLowerCase() === masterEmail;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/registrar', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos'
      });
    }

    const email = parsed.data.email.toLowerCase();

    const existente = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existente.length) {
      return reply.code(409).send({
        error: 'CONFLICT',
        message: 'E-mail já cadastrado.'
      });
    }

    const senhaHash = await argon2.hash(parsed.data.senha);

    const [user] = await db
      .insert(users)
      .values({
        nome: parsed.data.nome,
        email,
        telefone: parsed.data.telefone,
        senhaHash,
        perfilGlobal: deveSerMaster(email) ? 'MASTER' : 'USUARIO'
      })
      .returning({
        id: users.id,
        nome: users.nome,
        email: users.email,
        perfilGlobal: users.perfilGlobal
      });

    const token = app.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '12h' }
    );

    return reply.code(201).send({ user, token });
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos'
      });
    }

    const email = parsed.data.email.toLowerCase();

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (
      !user ||
      !user.ativo ||
      !(await argon2.verify(user.senhaHash, parsed.data.senha))
    ) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'E-mail ou senha inválidos.'
      });
    }

    if (deveSerMaster(email) && user.perfilGlobal !== 'MASTER') {
      const [promovido] = await db
        .update(users)
        .set({
          perfilGlobal: 'MASTER',
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();

      user = promovido;
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '12h' }
    );

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfilGlobal: user.perfilGlobal
      }
    };
  });
}

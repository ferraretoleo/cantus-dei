import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { loginSchema, registerSchema } from '@cantus-dei/shared';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/registrar', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Dados inválidos', details: parsed.error.flatten() });
    const existente = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (existente.length) return reply.code(409).send({ error: 'CONFLICT', message: 'E-mail já cadastrado.' });
    const senhaHash = await argon2.hash(parsed.data.senha);
    const [user] = await db.insert(users).values({ ...parsed.data, email: parsed.data.email.toLowerCase(), senhaHash }).returning({ id: users.id, nome: users.nome, email: users.email });
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '12h' });
    return reply.code(201).send({ user, token });
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Dados inválidos', details: parsed.error.flatten() });
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user?.senhaHash || !user.ativo || !(await argon2.verify(user.senhaHash, parsed.data.senha)))
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '12h' });
    return { token, user: { id: user.id, nome: user.nome, email: user.email } };
  });
}

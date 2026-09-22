import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { paroquiaMembros, paroquias } from '../db/schema.js';

export async function paroquiaRoutes(app: FastifyInstance) {
  app.get('/public/paroquias', async () => {
    return db.select({
      id: paroquias.id,
      nome: paroquias.nome,
      cidade: paroquias.cidade
    }).from(paroquias)
      .where(eq(paroquias.ativo,true))
      .orderBy(asc(paroquias.nome),asc(paroquias.cidade));
  });

  app.get('/me/paroquias', { preHandler: app.authenticate }, async request => {
    return db.select({
      id: paroquias.id,
      nome: paroquias.nome,
      cidade: paroquias.cidade,
      endereco: paroquias.endereco,
      papel: paroquiaMembros.papel
    }).from(paroquiaMembros)
      .innerJoin(paroquias,eq(paroquias.id,paroquiaMembros.paroquiaId))
      .where(and(
        eq(paroquiaMembros.userId,request.user.sub),
        eq(paroquiaMembros.ativo,true),
        eq(paroquias.ativo,true)
      ))
      .orderBy(asc(paroquias.nome));
  });
}

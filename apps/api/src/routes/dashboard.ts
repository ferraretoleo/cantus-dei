import type { FastifyInstance } from 'fastify';
import { and, asc, eq, gte, lt, isNull } from 'drizzle-orm';
import { db } from '../db/client.js';
import { grupoMembros, grupos, missaEscala, missas, paroquias } from '../db/schema.js';

function intervaloMes(valor?: string) {
  const agora = new Date();
  const m = valor?.match(/^(\d{4})-(\d{2})$/);
  const ano = m ? Number(m[1]) : agora.getFullYear();
  const mes = m ? Number(m[2])-1 : agora.getMonth();
  return {
    inicio: new Date(Date.UTC(ano,mes,1,0,0,0)),
    fim: new Date(Date.UTC(ano,mes+1,1,0,0,0))
  };
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/me/agenda', { preHandler: app.authenticate }, async request => {
    const { mes } = request.query as { mes?: string };
    const { inicio,fim } = intervaloMes(mes);

    return db.select({
      missaId: missas.id,
      dataHora: missas.dataHora,
      local: missas.local,
      tipoCelebracao: missas.tipoCelebracao,
      status: missas.status,
      grupoId: grupos.id,
      grupoNome: grupos.nome,
      grupoSlug: grupos.slug,
      paroquiaId: paroquias.id,
      paroquiaNome: paroquias.nome,
      cidade: paroquias.cidade,
      confirmacao: missaEscala.confirmacao,
      instrumentoVoz: missaEscala.instrumentoVoz
    }).from(grupoMembros)
      .innerJoin(grupos,eq(grupos.id,grupoMembros.grupoId))
      .innerJoin(paroquias,eq(paroquias.id,grupos.paroquiaId))
      .innerJoin(missas,and(
        eq(missas.grupoId,grupos.id),
        isNull(missas.deletedAt),
        gte(missas.dataHora,inicio),
        lt(missas.dataHora,fim)
      ))
      .leftJoin(missaEscala,and(
        eq(missaEscala.missaId,missas.id),
        eq(missaEscala.userId,request.user.sub)
      ))
      .where(and(
        eq(grupoMembros.userId,request.user.sub),
        eq(grupoMembros.ativo,true),
        eq(grupos.ativo,true),
        eq(paroquias.ativo,true)
      ))
      .orderBy(asc(missas.dataHora));
  });
}

import type { FastifyInstance } from 'fastify';
import { and, asc, eq, gte, isNull, lt } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  grupoMembros,
  grupos,
  missaEscala,
  missas,
  paroquiaMembros,
  paroquias,
  users
} from '../db/schema.js';

function intervaloMes(valor?: string) {
  const agora = new Date();
  const match = valor?.match(/^(\d{4})-(\d{2})$/);

  const ano = match ? Number(match[1]) : agora.getFullYear();
  const mes = match ? Number(match[2]) - 1 : agora.getMonth();

  return {
    inicio: new Date(Date.UTC(ano, mes, 1, 0, 0, 0)),
    fim: new Date(Date.UTC(ano, mes + 1, 1, 0, 0, 0))
  };
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/me/agenda', { preHandler: app.authenticate }, async request => {
    const { mes, paroquiaId } = request.query as {
      mes?: string;
      paroquiaId?: string;
    };

    if (!paroquiaId) {
      return [];
    }

    const { inicio, fim } = intervaloMes(mes);

    const [usuario] = await db
      .select({ perfilGlobal: users.perfilGlobal })
      .from(users)
      .where(eq(users.id, request.user.sub))
      .limit(1);

    const [vinculoParoquia] = await db
      .select({ papel: paroquiaMembros.papel })
      .from(paroquiaMembros)
      .where(
        and(
          eq(paroquiaMembros.paroquiaId, paroquiaId),
          eq(paroquiaMembros.userId, request.user.sub),
          eq(paroquiaMembros.ativo, true)
        )
      )
      .limit(1);

    const acessoTotal =
      usuario?.perfilGlobal === 'MASTER' ||
      vinculoParoquia?.papel === 'ADMIN_PAROQUIA';

    if (acessoTotal) {
      return db
        .select({
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
        })
        .from(missas)
        .innerJoin(
          grupos,
          eq(grupos.id, missas.grupoId)
        )
        .innerJoin(
          paroquias,
          eq(paroquias.id, grupos.paroquiaId)
        )
        .leftJoin(
          missaEscala,
          and(
            eq(missaEscala.missaId, missas.id),
            eq(missaEscala.userId, request.user.sub)
          )
        )
        .where(
          and(
            eq(grupos.paroquiaId, paroquiaId),
            eq(grupos.ativo, true),
            isNull(missas.deletedAt),
            gte(missas.dataHora, inicio),
            lt(missas.dataHora, fim)
          )
        )
        .orderBy(asc(missas.dataHora));
    }

    return db
      .select({
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
      })
      .from(grupoMembros)
      .innerJoin(
        grupos,
        eq(grupos.id, grupoMembros.grupoId)
      )
      .innerJoin(
        paroquias,
        eq(paroquias.id, grupos.paroquiaId)
      )
      .innerJoin(
        missas,
        and(
          eq(missas.grupoId, grupos.id),
          isNull(missas.deletedAt),
          gte(missas.dataHora, inicio),
          lt(missas.dataHora, fim)
        )
      )
      .leftJoin(
        missaEscala,
        and(
          eq(missaEscala.missaId, missas.id),
          eq(missaEscala.userId, request.user.sub)
        )
      )
      .where(
        and(
          eq(grupoMembros.userId, request.user.sub),
          eq(grupoMembros.ativo, true),
          eq(grupos.paroquiaId, paroquiaId),
          eq(grupos.ativo, true)
        )
      )
      .orderBy(asc(missas.dataHora));
  });
}

import type { FastifyInstance } from 'fastify';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  grupos,
  missaEscala,
  missaMusicas,
  missas,
  momentos,
  musicas,
  paroquias,
  users
} from '../db/schema.js';

export async function publicRoutes(app:FastifyInstance) {
  app.get('/public/missas/:token',async(request,reply)=>{
    const token=(request.params as {token:string}).token;

    const [base]=await db.select({
      missaId:missas.id,
      grupoId:grupos.id,
      grupoNome:grupos.nome,
      paroquia:paroquias.nome,
      cidade:paroquias.cidade,
      corTema:grupos.corTema,
      dataHora:missas.dataHora,
      local:missas.local,
      tipoCelebracao:missas.tipoCelebracao,
      tempoLiturgico:missas.tempoLiturgico,
      observacoes:missas.observacoes
    }).from(missas)
      .innerJoin(grupos,eq(grupos.id,missas.grupoId))
      .innerJoin(paroquias,eq(paroquias.id,grupos.paroquiaId))
      .where(eq(missas.tokenPublico,token))
      .limit(1);

    if (!base) {
      return reply.code(404).send({
        error:'NOT_FOUND',
        message:'Celebração pública não encontrada.'
      });
    }

    const repertorio=await db.select({
      id:missaMusicas.id,
      ordem:missaMusicas.ordem,
      momentoNome:momentos.nome,
      titulo:musicas.titulo,
      autorCompositor:musicas.autorCompositor,
      tomOriginal:musicas.tomOriginal,
      tomDaExecucao:missaMusicas.tomDaExecucao,
      observacao:missaMusicas.observacao,
      letra:musicas.letra,
      cifra:musicas.cifra,
      notacaoAbc:musicas.notacaoAbc
    }).from(missaMusicas)
      .innerJoin(musicas,eq(musicas.id,missaMusicas.musicaId))
      .innerJoin(momentos,eq(momentos.id,missaMusicas.momentoId))
      .where(eq(missaMusicas.missaId,base.missaId))
      .orderBy(asc(momentos.ordemLiturgica),asc(missaMusicas.ordem));

    const escala=await db.select({
      nome:users.nome,
      instrumentoVoz:missaEscala.instrumentoVoz
    }).from(missaEscala)
      .innerJoin(users,eq(users.id,missaEscala.userId))
      .where(eq(missaEscala.missaId,base.missaId));

    return { celebracao:base,repertorio,escala };
  });
}

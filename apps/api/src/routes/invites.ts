import type { FastifyInstance } from 'fastify';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { convites, grupoMembros, grupos } from '../db/schema.js';

export async function inviteRoutes(app: FastifyInstance) {
  app.get('/convites/:token', async (request, reply) => {
    const token = (request.params as { token: string }).token;

    const [convite] = await db
      .select({
        token: convites.token,
        status: convites.status,
        expiraEm: convites.expiraEm,
        papelProposto: convites.papelProposto,
        grupoId: grupos.id,
        grupoNome: grupos.nome,
        paroquia: grupos.paroquia,
        cidade: grupos.cidade
      })
      .from(convites)
      .innerJoin(grupos, eq(grupos.id, convites.grupoId))
      .where(eq(convites.token, token))
      .limit(1);

    if (!convite) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: 'Convite não encontrado.'
      });
    }

    return convite;
  });

  app.post(
    '/convites/:token/aceitar',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const token = (request.params as { token: string }).token;

      return db.transaction(async tx => {
        const [convite] = await tx
          .select()
          .from(convites)
          .where(
            and(
              eq(convites.token, token),
              eq(convites.status, 'PENDENTE'),
              gt(convites.expiraEm, new Date())
            )
          )
          .limit(1);

        if (!convite) {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Convite inválido ou expirado.'
          });
        }

        await tx
          .insert(grupoMembros)
          .values({
            grupoId: convite.grupoId,
            userId: request.user.sub,
            papel: convite.papelProposto
          })
          .onConflictDoUpdate({
            target: [grupoMembros.grupoId, grupoMembros.userId],
            set: {
              papel: convite.papelProposto,
              ativo: true,
              updatedAt: new Date()
            }
          });

        await tx
          .update(convites)
          .set({
            status: 'ACEITO',
            updatedAt: new Date()
          })
          .where(eq(convites.id, convite.id));

        return {
          ok: true,
          grupoId: convite.grupoId
        };
      });
    }
  );
}

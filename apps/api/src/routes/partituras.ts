import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

import { db } from '../db/client.js';
import { musicas, partituras } from '../db/schema.js';
import { r2, r2BucketName } from '../lib/r2.js';

const tipoSchema = z.enum(['PDF', 'IMAGEM', 'MIDI', 'MUSICXML']);

const presignSchema = z.object({
  nomeArquivo: z.string().min(1).max(255),
  mime: z.string().min(1).max(120),
  tamanho: z.number().int().positive().max(25 * 1024 * 1024),
  tipo: tipoSchema
});

const registrarSchema = z.object({
  arquivoKey: z.string().min(1),
  tipo: tipoSchema,
  instrumento: z.string().min(1).max(80).default('Geral'),
  tom: z.string().max(20).optional().nullable(),
  versao: z.string().max(80).optional().nullable(),
  tamanho: z.number().int().positive().optional().nullable(),
  mime: z.string().max(120).optional().nullable()
});

function sanitizeFileName(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

async function musicaDoGrupo(grupoId: string, musicaId: string) {
  const [musica] = await db
    .select({ id: musicas.id })
    .from(musicas)
    .where(
      and(
        eq(musicas.id, musicaId),
        eq(musicas.grupoId, grupoId),
        isNull(musicas.deletedAt)
      )
    )
    .limit(1);

  return musica;
}

export async function partituraRoutes(app: FastifyInstance) {
  app.get(
    '/grupos/:id/musicas/:musicaId/partituras',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const { id: grupoId, musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      if (!(await musicaDoGrupo(grupoId, musicaId))) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      return db
        .select()
        .from(partituras)
        .where(eq(partituras.musicaId, musicaId))
        .orderBy(partituras.createdAt);
    }
  );

  app.post(
    '/grupos/:id/musicas/:musicaId/partituras/presign',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const { id: grupoId, musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      if (!(await musicaDoGrupo(grupoId, musicaId))) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      const parsed = presignSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Arquivo inválido.',
          details: parsed.error.flatten()
        });
      }

      const nomeSeguro = sanitizeFileName(parsed.data.nomeArquivo);
      const key = `${grupoId}/${musicaId}/${crypto.randomUUID()}-${nomeSeguro}`;

      const command = new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        ContentType: parsed.data.mime
      });

      const uploadUrl = await getSignedUrl(r2, command, {
        expiresIn: 600
      });

      return {
        uploadUrl,
        key,
        expiresIn: 600
      };
    }
  );

  app.post(
    '/grupos/:id/musicas/:musicaId/partituras',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const { id: grupoId, musicaId } = request.params as {
        id: string;
        musicaId: string;
      };

      if (!(await musicaDoGrupo(grupoId, musicaId))) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Música não encontrada.'
        });
      }

      const parsed = registrarSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados da partitura inválidos.',
          details: parsed.error.flatten()
        });
      }

      if (!parsed.data.arquivoKey.startsWith(`${grupoId}/${musicaId}/`)) {
        return reply.code(400).send({
          error: 'INVALID_KEY',
          message: 'Arquivo não pertence a esta música.'
        });
      }

      const [partitura] = await db
        .insert(partituras)
        .values({
          musicaId,
          tipo: parsed.data.tipo,
          instrumento: parsed.data.instrumento,
          tom: parsed.data.tom || null,
          versao: parsed.data.versao || null,
          arquivoKey: parsed.data.arquivoKey,
          tamanho: parsed.data.tamanho || null,
          mime: parsed.data.mime || null,
          enviadoPor: request.user.sub
        })
        .returning();

      return reply.code(201).send(partitura);
    }
  );

  app.get(
    '/grupos/:id/partituras/:partituraId/url',
    { preHandler: (req, rep) => app.requireGroupAccess(req, rep) },
    async (request, reply) => {
      const { id: grupoId, partituraId } = request.params as {
        id: string;
        partituraId: string;
      };

      const [registro] = await db
        .select({
          id: partituras.id,
          arquivoKey: partituras.arquivoKey,
          mime: partituras.mime
        })
        .from(partituras)
        .innerJoin(musicas, eq(musicas.id, partituras.musicaId))
        .where(
          and(
            eq(partituras.id, partituraId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .limit(1);

      if (!registro) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Partitura não encontrada.'
        });
      }

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: r2BucketName,
          Key: registro.arquivoKey
        }),
        { expiresIn: 900 }
      );

      return {
        url,
        expiresIn: 900,
        mime: registro.mime
      };
    }
  );

  app.delete(
    '/grupos/:id/partituras/:partituraId',
    {
      preHandler: (req, rep) =>
        app.requireGroupAccess(req, rep, ['RESPONSAVEL', 'COORDENADOR'])
    },
    async (request, reply) => {
      const { id: grupoId, partituraId } = request.params as {
        id: string;
        partituraId: string;
      };

      const [registro] = await db
        .select({
          id: partituras.id,
          arquivoKey: partituras.arquivoKey
        })
        .from(partituras)
        .innerJoin(musicas, eq(musicas.id, partituras.musicaId))
        .where(
          and(
            eq(partituras.id, partituraId),
            eq(musicas.grupoId, grupoId),
            isNull(musicas.deletedAt)
          )
        )
        .limit(1);

      if (!registro) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Partitura não encontrada.'
        });
      }

      await r2.send(
        new DeleteObjectCommand({
          Bucket: r2BucketName,
          Key: registro.arquivoKey
        })
      );

      await db
        .delete(partituras)
        .where(eq(partituras.id, partituraId));

      return { ok: true };
    }
  );
}

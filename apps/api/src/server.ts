import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import authPlugin from './plugins/auth.js';
import groupGuard from './plugins/group-guard.js';

import { authRoutes } from './routes/auth.js';
import { groupRoutes } from './routes/groups.js';
import { inviteRoutes } from './routes/invites.js';
import { musicRoutes } from './routes/musics.js';
import { momentoRoutes } from './routes/momentos.js';
import { missaRoutes } from './routes/missas.js';
import { publicRoutes } from './routes/public.js';
import { masterRoutes } from './routes/master.js';

const app = Fastify({ logger: true });

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: corsOrigins.length ? corsOrigins : false,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
});

await app.register(authPlugin);
await app.register(groupGuard);

await app.register(authRoutes);
await app.register(groupRoutes);
await app.register(inviteRoutes);
await app.register(musicRoutes);
await app.register(momentoRoutes);
await app.register(missaRoutes);
await app.register(publicRoutes);
await app.register(masterRoutes);

app.get('/health', async () => ({
  status: 'ok',
  service: 'cantus-dei-api'
}));

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;

  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : 'Erro interno do servidor.';

  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
    message: statusCode >= 500
      ? 'Erro interno do servidor.'
      : message
  });
});

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: '0.0.0.0'
});

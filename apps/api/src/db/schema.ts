import {
  boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp,
  unique, uuid, varchar
} from 'drizzle-orm/pg-core';

export const papelGrupoEnum = pgEnum('papel_grupo', ['RESPONSAVEL','COORDENADOR','MUSICO']);
export const papelParoquiaEnum = pgEnum('papel_paroquia', ['ADMIN_PAROQUIA','MEMBRO']);
export const perfilGlobalEnum = pgEnum('perfil_global', ['USUARIO','MASTER']);
export const conviteStatusEnum = pgEnum('convite_status', ['PENDENTE','ACEITO','EXPIRADO','CANCELADO']);
export const missaStatusEnum = pgEnum('missa_status', ['RASCUNHO','PUBLICADA','ARQUIVADA']);
export const confirmacaoEnum = pgEnum('confirmacao_status', ['PENDENTE','CONFIRMADO','AUSENTE']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 120 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  telefone: varchar('telefone', { length: 30 }),
  perfilGlobal: perfilGlobalEnum('perfil_global').default('USUARIO').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps
});

export const paroquias = pgTable('paroquias', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 160 }).notNull(),
  cidade: varchar('cidade', { length: 120 }).notNull(),
  endereco: varchar('endereco', { length: 240 }),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps
}, t => [unique('paroquias_nome_cidade_unq').on(t.nome,t.cidade)]);

export const paroquiaMembros = pgTable('paroquia_membros', {
  paroquiaId: uuid('paroquia_id').notNull().references(() => paroquias.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  papel: papelParoquiaEnum('papel').default('MEMBRO').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps
}, t => [primaryKey({ columns: [t.paroquiaId,t.userId] })]);

export const grupos = pgTable('grupos', {
  id: uuid('id').defaultRandom().primaryKey(),
  paroquiaId: uuid('paroquia_id').notNull().references(() => paroquias.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  corTema: varchar('cor_tema', { length: 7 }).default('#D5AE62').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  ...timestamps
}, t => [index('grupos_paroquia_idx').on(t.paroquiaId)]);

export const grupoMembros = pgTable('grupo_membros', {
  grupoId: uuid('grupo_id').notNull().references(() => grupos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  papel: papelGrupoEnum('papel').notNull(),
  instrumento: varchar('instrumento', { length: 80 }),
  voz: varchar('voz', { length: 30 }),
  ativo: boolean('ativo').default(true).notNull(),
  entrouEm: timestamp('entrou_em', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps
}, t => [primaryKey({ columns: [t.grupoId,t.userId] })]);

export const convites = pgTable('convites', {
  id: uuid('id').defaultRandom().primaryKey(),
  grupoId: uuid('grupo_id').notNull().references(() => grupos.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  telefone: varchar('telefone', { length: 30 }),
  papelProposto: papelGrupoEnum('papel_proposto').notNull(),
  token: varchar('token', { length: 100 }).notNull().unique(),
  expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
  status: conviteStatusEnum('status').default('PENDENTE').notNull(),
  convidadoPor: uuid('convidado_por').notNull().references(() => users.id),
  ...timestamps
});

export const momentos = pgTable('momentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 120 }).notNull(),
  ordemLiturgica: integer('ordem_liturgica').notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  grupoId: uuid('grupo_id').references(() => grupos.id, { onDelete: 'cascade' }),
  ...timestamps
}, t => [unique('momentos_grupo_slug_unq').on(t.grupoId,t.slug)]);

export const musicas = pgTable('musicas', {
  id: uuid('id').defaultRandom().primaryKey(),
  grupoId: uuid('grupo_id').notNull().references(() => grupos.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 220 }).notNull(),
  autorCompositor: varchar('autor_compositor', { length: 220 }),
  tomOriginal: varchar('tom_original', { length: 20 }),
  andamentoBpm: integer('andamento_bpm'),
  tempoCompasso: varchar('tempo_compasso', { length: 20 }),
  letra: text('letra'),
  cifra: text('cifra'),
  notacaoAbc: text('notacao_abc'),
  videoUrl: text('video_url'),
  tags: text('tags').array().default([]),
  observacoes: text('observacoes'),
  compartilhada: boolean('compartilhada').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps
}, t => [index('musicas_grupo_titulo_idx').on(t.grupoId,t.titulo)]);

export const musicaMomentos = pgTable('musica_momentos', {
  musicaId: uuid('musica_id').notNull().references(() => musicas.id, { onDelete: 'cascade' }),
  momentoId: uuid('momento_id').notNull().references(() => momentos.id, { onDelete: 'cascade' })
}, t => [primaryKey({ columns: [t.musicaId,t.momentoId] })]);

export const missas = pgTable('missas', {
  id: uuid('id').defaultRandom().primaryKey(),
  grupoId: uuid('grupo_id').notNull().references(() => grupos.id, { onDelete: 'cascade' }),
  dataHora: timestamp('data_hora', { withTimezone: true }).notNull(),
  local: varchar('local', { length: 180 }).notNull(),
  tipoCelebracao: varchar('tipo_celebracao', { length: 80 }).notNull(),
  tempoLiturgico: varchar('tempo_liturgico', { length: 40 }),
  observacoes: text('observacoes'),
  status: missaStatusEnum('status').default('RASCUNHO').notNull(),
  tokenPublico: varchar('token_publico', { length: 64 }).unique(),
  publicadoEm: timestamp('publicado_em', { withTimezone: true }),
  criadoPor: uuid('criado_por').notNull().references(() => users.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps
}, t => [index('missas_grupo_data_idx').on(t.grupoId,t.dataHora)]);

export const missaMusicas = pgTable('missa_musicas', {
  id: uuid('id').defaultRandom().primaryKey(),
  missaId: uuid('missa_id').notNull().references(() => missas.id, { onDelete: 'cascade' }),
  musicaId: uuid('musica_id').notNull().references(() => musicas.id),
  momentoId: uuid('momento_id').notNull().references(() => momentos.id),
  ordem: integer('ordem').notNull(),
  tomDaExecucao: varchar('tom_da_execucao', { length: 20 }),
  observacao: text('observacao'),
  ...timestamps
});

export const missaEscala = pgTable('missa_escala', {
  missaId: uuid('missa_id').notNull().references(() => missas.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  instrumentoVoz: varchar('instrumento_voz', { length: 100 }),
  confirmacao: confirmacaoEnum('confirmacao').default('PENDENTE').notNull(),
  respondidoEm: timestamp('respondido_em', { withTimezone: true }),
  ...timestamps
}, t => [primaryKey({ columns: [t.missaId,t.userId] })]);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE papel_grupo AS ENUM ('RESPONSAVEL','COORDENADOR','MUSICO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE convite_status AS ENUM ('PENDENTE','ACEITO','EXPIRADO','CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE missa_status AS ENUM ('RASCUNHO','PUBLICADA','ARQUIVADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE confirmacao_status AS ENUM ('PENDENTE','CONFIRMADO','AUSENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(120) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  telefone varchar(30),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(120) NOT NULL,
  paroquia varchar(160) NOT NULL,
  cidade varchar(120) NOT NULL,
  slug varchar(80) NOT NULL UNIQUE,
  cor_tema varchar(7) NOT NULL DEFAULT '#7C3AED',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  papel papel_grupo NOT NULL,
  instrumento varchar(80),
  voz varchar(30),
  ativo boolean NOT NULL DEFAULT true,
  entrou_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, user_id)
);

CREATE TABLE IF NOT EXISTS convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  email varchar(255),
  telefone varchar(30),
  papel_proposto papel_grupo NOT NULL,
  token varchar(100) NOT NULL UNIQUE,
  expira_em timestamptz NOT NULL,
  status convite_status NOT NULL DEFAULT 'PENDENTE',
  convidado_por uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS momentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(120) NOT NULL,
  ordem_liturgica integer NOT NULL,
  slug varchar(120) NOT NULL,
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS musicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  titulo varchar(220) NOT NULL,
  autor_compositor varchar(220),
  tom_original varchar(20),
  andamento_bpm integer,
  tempo_compasso varchar(20),
  letra text,
  cifra text,
  notacao_abc text,
  video_url text,
  tags text[] DEFAULT '{}',
  observacoes text,
  compartilhada boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE musicas ADD COLUMN IF NOT EXISTS notacao_abc text;

CREATE TABLE IF NOT EXISTS musica_momentos (
  musica_id uuid NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  momento_id uuid NOT NULL REFERENCES momentos(id) ON DELETE CASCADE,
  PRIMARY KEY (musica_id, momento_id)
);

CREATE TABLE IF NOT EXISTS missas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  data_hora timestamptz NOT NULL,
  local varchar(180) NOT NULL,
  tipo_celebracao varchar(80) NOT NULL,
  tempo_liturgico varchar(40),
  observacoes text,
  status missa_status NOT NULL DEFAULT 'RASCUNHO',
  token_publico varchar(64) UNIQUE,
  publicado_em timestamptz,
  criado_por uuid NOT NULL REFERENCES users(id),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missa_musicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  missa_id uuid NOT NULL REFERENCES missas(id) ON DELETE CASCADE,
  musica_id uuid NOT NULL REFERENCES musicas(id),
  momento_id uuid NOT NULL REFERENCES momentos(id),
  ordem integer NOT NULL,
  tom_da_execucao varchar(20),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missa_escala (
  missa_id uuid NOT NULL REFERENCES missas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instrumento_voz varchar(100),
  confirmacao confirmacao_status NOT NULL DEFAULT 'PENDENTE',
  respondido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (missa_id, user_id)
);

CREATE INDEX IF NOT EXISTS musicas_grupo_titulo_idx ON musicas(grupo_id, titulo);
CREATE INDEX IF NOT EXISTS missas_grupo_data_idx ON missas(grupo_id, data_hora);

INSERT INTO momentos (id, nome, ordem_liturgica, slug, grupo_id)
SELECT gen_random_uuid(), v.nome, v.ordem, v.slug, NULL
FROM (
  VALUES
    ('Entrada', 1, 'entrada'),
    ('Ato Penitencial (Perdão)', 2, 'ato-penitencial'),
    ('Glória', 3, 'gloria'),
    ('Salmo Responsorial', 4, 'salmo-responsorial'),
    ('Aclamação ao Evangelho', 5, 'aclamacao-evangelho'),
    ('Ofertório', 6, 'ofertorio'),
    ('Santo', 7, 'santo'),
    ('Cordeiro de Deus', 8, 'cordeiro-de-deus'),
    ('Comunhão', 9, 'comunhao'),
    ('Ação de Graças (Pós-comunhão)', 10, 'acao-de-gracas'),
    ('Ave Maria / Mariana', 11, 'mariana'),
    ('Final', 12, 'final')
) AS v(nome, ordem, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM momentos m
  WHERE m.slug = v.slug AND m.grupo_id IS NULL
);

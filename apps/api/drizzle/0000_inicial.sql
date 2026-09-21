CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE papel_grupo AS ENUM ('RESPONSAVEL','COORDENADOR','MUSICO');
CREATE TYPE convite_status AS ENUM ('PENDENTE','ACEITO','EXPIRADO','CANCELADO');
CREATE TYPE partitura_tipo AS ENUM ('PDF','IMAGEM','MIDI','MUSICXML');
CREATE TYPE missa_status AS ENUM ('RASCUNHO','PUBLICADA','ARQUIVADA');
CREATE TYPE confirmacao_status AS ENUM ('PENDENTE','CONFIRMADO','AUSENTE');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome varchar(120) NOT NULL,
  email varchar(255) NOT NULL UNIQUE, senha_hash text, telefone varchar(30), avatar_url text,
  ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome varchar(120) NOT NULL, paroquia varchar(160) NOT NULL,
  cidade varchar(120) NOT NULL, slug varchar(80) NOT NULL UNIQUE, cor_tema varchar(7) NOT NULL DEFAULT '#7C3AED',
  ativo boolean NOT NULL DEFAULT true, deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE grupo_membros (
  grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  papel papel_grupo NOT NULL, instrumento varchar(80), voz varchar(30), ativo boolean NOT NULL DEFAULT true,
  entrou_em timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id,user_id)
);
CREATE INDEX grupo_membros_user_ativo_idx ON grupo_membros(user_id,ativo);
CREATE TABLE convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  email varchar(255), telefone varchar(30), papel_proposto papel_grupo NOT NULL, token varchar(100) NOT NULL UNIQUE,
  expira_em timestamptz NOT NULL, status convite_status NOT NULL DEFAULT 'PENDENTE', convidado_por uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT convite_destino_chk CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);
CREATE INDEX convites_grupo_status_idx ON convites(grupo_id,status);
CREATE TABLE momentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome varchar(120) NOT NULL, ordem_liturgica integer NOT NULL,
  slug varchar(120) NOT NULL, grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(grupo_id,slug)
);
CREATE UNIQUE INDEX momentos_globais_slug_unq ON momentos(slug) WHERE grupo_id IS NULL;
CREATE TABLE musicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  titulo varchar(220) NOT NULL, autor_compositor varchar(220), tom_original varchar(20), andamento_bpm integer,
  tempo_compasso varchar(20), letra text, cifra text, video_url text, tags text[] NOT NULL DEFAULT '{}', observacoes text,
  compartilhada boolean NOT NULL DEFAULT false, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX musicas_grupo_titulo_idx ON musicas(grupo_id,titulo);
CREATE TABLE musica_momentos (
  musica_id uuid NOT NULL REFERENCES musicas(id) ON DELETE CASCADE, momento_id uuid NOT NULL REFERENCES momentos(id) ON DELETE CASCADE,
  PRIMARY KEY(musica_id,momento_id)
);
CREATE TABLE partituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), musica_id uuid NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  tipo partitura_tipo NOT NULL, instrumento varchar(80) NOT NULL DEFAULT 'Geral', tom varchar(20), versao varchar(80), arquivo_key text NOT NULL,
  tamanho integer, mime varchar(120), enviado_por uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE missas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), grupo_id uuid NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  data_hora timestamptz NOT NULL, local varchar(180) NOT NULL, tipo_celebracao varchar(80) NOT NULL, tempo_liturgico varchar(40), observacoes text,
  status missa_status NOT NULL DEFAULT 'RASCUNHO', token_publico varchar(64) UNIQUE, publicado_em timestamptz,
  criado_por uuid NOT NULL REFERENCES users(id), deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX missas_grupo_data_idx ON missas(grupo_id,data_hora);
CREATE TABLE missa_musicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), missa_id uuid NOT NULL REFERENCES missas(id) ON DELETE CASCADE,
  musica_id uuid NOT NULL REFERENCES musicas(id), momento_id uuid NOT NULL REFERENCES momentos(id), ordem integer NOT NULL,
  tom_da_execucao varchar(20), partitura_id uuid REFERENCES partituras(id), observacao text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(missa_id,momento_id,ordem)
);
CREATE TABLE missa_escala (
  missa_id uuid NOT NULL REFERENCES missas(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instrumento_voz varchar(100), confirmacao confirmacao_status NOT NULL DEFAULT 'PENDENTE', respondido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(missa_id,user_id)
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE papel_paroquia AS ENUM ('ADMIN_PAROQUIA','MEMBRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS paroquias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(160) NOT NULL,
  cidade varchar(120) NOT NULL,
  endereco varchar(240),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT paroquias_nome_cidade_unq UNIQUE(nome,cidade)
);

CREATE TABLE IF NOT EXISTS paroquia_membros (
  paroquia_id uuid NOT NULL REFERENCES paroquias(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  papel papel_paroquia NOT NULL DEFAULT 'MEMBRO',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(paroquia_id,user_id)
);

ALTER TABLE grupos ADD COLUMN IF NOT EXISTS paroquia_id uuid;

INSERT INTO paroquias(nome,cidade)
SELECT DISTINCT trim(paroquia), trim(cidade)
FROM grupos
WHERE paroquia IS NOT NULL AND trim(paroquia) <> ''
  AND cidade IS NOT NULL AND trim(cidade) <> ''
ON CONFLICT(nome,cidade) DO NOTHING;

UPDATE grupos g
SET paroquia_id=p.id
FROM paroquias p
WHERE g.paroquia_id IS NULL
  AND lower(trim(p.nome))=lower(trim(g.paroquia))
  AND lower(trim(p.cidade))=lower(trim(g.cidade));

INSERT INTO paroquia_membros(paroquia_id,user_id,papel,ativo)
SELECT DISTINCT
  g.paroquia_id,
  gm.user_id,
  CASE WHEN gm.papel='RESPONSAVEL'::papel_grupo
       THEN 'ADMIN_PAROQUIA'::papel_paroquia
       ELSE 'MEMBRO'::papel_paroquia END,
  true
FROM grupo_membros gm
JOIN grupos g ON g.id=gm.grupo_id
WHERE g.paroquia_id IS NOT NULL
ON CONFLICT(paroquia_id,user_id) DO UPDATE SET
  papel=CASE
    WHEN EXCLUDED.papel='ADMIN_PAROQUIA'::papel_paroquia
      THEN 'ADMIN_PAROQUIA'::papel_paroquia
    ELSE paroquia_membros.papel
  END,
  ativo=true,
  updated_at=now();

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM grupos WHERE paroquia_id IS NULL) THEN
    RAISE EXCEPTION 'Existem grupos sem paroquia_id; corrija-os antes de concluir.';
  END IF;
END $$;

ALTER TABLE grupos ALTER COLUMN paroquia_id SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE grupos ADD CONSTRAINT grupos_paroquia_id_fk
  FOREIGN KEY(paroquia_id) REFERENCES paroquias(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS grupos_paroquia_idx ON grupos(paroquia_id);
CREATE INDEX IF NOT EXISTS paroquia_membros_user_idx ON paroquia_membros(user_id);

ALTER TABLE grupos ALTER COLUMN paroquia DROP NOT NULL;
ALTER TABLE grupos ALTER COLUMN cidade DROP NOT NULL;

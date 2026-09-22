-- CANTUS DEI - Exclusões administrativas seguras

-- USUÁRIO:
-- preserva missas/convites históricos, mas remove vínculos e escalas.
ALTER TABLE convites
  ALTER COLUMN convidado_por DROP NOT NULL;

ALTER TABLE missas
  ALTER COLUMN criado_por DROP NOT NULL;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'convites'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%convidado_por%'
  LOOP
    EXECUTE format('ALTER TABLE convites DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE convites
  ADD CONSTRAINT convites_convidado_por_users_id_fk
  FOREIGN KEY (convidado_por)
  REFERENCES users(id)
  ON DELETE SET NULL;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'missas'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%criado_por%'
  LOOP
    EXECUTE format('ALTER TABLE missas DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE missas
  ADD CONSTRAINT missas_criado_por_users_id_fk
  FOREIGN KEY (criado_por)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- GRUPO:
-- reforça cascata nas referências diretas de repertório.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'missa_musicas'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%musica_id%'
  LOOP
    EXECUTE format('ALTER TABLE missa_musicas DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE missa_musicas
  ADD CONSTRAINT missa_musicas_musica_id_musicas_id_fk
  FOREIGN KEY (musica_id)
  REFERENCES musicas(id)
  ON DELETE CASCADE;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'missa_musicas'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%momento_id%'
  LOOP
    EXECUTE format('ALTER TABLE missa_musicas DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE missa_musicas
  ADD CONSTRAINT missa_musicas_momento_id_momentos_id_fk
  FOREIGN KEY (momento_id)
  REFERENCES momentos(id)
  ON DELETE CASCADE;

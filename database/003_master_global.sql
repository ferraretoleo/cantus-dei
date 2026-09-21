DO $$ BEGIN
  CREATE TYPE perfil_global AS ENUM ('USUARIO', 'MASTER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS perfil_global perfil_global NOT NULL DEFAULT 'USUARIO';

-- Depois troque pelo e-mail real do seu login:
-- UPDATE users
-- SET perfil_global = 'MASTER',
--     updated_at = now()
-- WHERE lower(email) = lower('SEU_EMAIL_DE_LOGIN');

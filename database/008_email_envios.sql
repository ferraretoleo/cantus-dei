CREATE TABLE IF NOT EXISTS email_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave varchar(255) NOT NULL UNIQUE,
  tipo varchar(40) NOT NULL,
  destinatario varchar(255) NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_envios_tipo_idx
  ON email_envios(tipo);

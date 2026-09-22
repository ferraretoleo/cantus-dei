-- CANTUS DEI - Logo da paróquia
-- Armazena a imagem como Data URL/Base64 em TEXT.
-- Mantém o projeto sem dependência de R2/S3.

ALTER TABLE paroquias
  ADD COLUMN IF NOT EXISTS logo_data TEXT;

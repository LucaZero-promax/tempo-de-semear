-- Tempo de Semear | Itapecuru Mirim - MA
-- Execute este script no Neon usando um usuário com permissão para criar extensões/tabelas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE perfil_usuario AS ENUM ('ADMINISTRADOR', 'OPERADOR');
CREATE TYPE status_beneficio AS ENUM ('AGUARDANDO_RETIRADA', 'ENTREGUE');

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(160) NOT NULL,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(180) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil perfil_usuario NOT NULL DEFAULT 'OPERADOR',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuario VARCHAR(80);
UPDATE usuarios SET usuario = split_part(email, '@', 1) WHERE usuario IS NULL;
ALTER TABLE usuarios ALTER COLUMN usuario SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_usuario_uidx ON usuarios(LOWER(usuario));

CREATE TABLE IF NOT EXISTS agricultores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo VARCHAR(180) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  data_nascimento DATE,
  telefone VARCHAR(20),
  comunidade VARCHAR(140) NOT NULL,
  protocolo VARCHAR(60) NOT NULL UNIQUE,
  caf_dap VARCHAR(80),
  status status_beneficio NOT NULL DEFAULT 'AGUARDANDO_RETIRADA',
  data_entrega TIMESTAMPTZ,
  observacoes TEXT,
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cpf_apenas_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT entrega_coerente CHECK ((status = 'ENTREGUE' AND data_entrega IS NOT NULL) OR (status = 'AGUARDANDO_RETIRADA' AND data_entrega IS NULL))
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id UUID,
  detalhes JSONB,
  ip VARCHAR(64),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agricultores_comunidade_idx ON agricultores(comunidade);
CREATE INDEX IF NOT EXISTS agricultores_status_idx ON agricultores(status);
CREATE INDEX IF NOT EXISTS logs_auditoria_usuario_idx ON logs_auditoria(usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS agricultores_nome_normalizado_uidx ON agricultores (LOWER(BTRIM(nome_completo)));

CREATE OR REPLACE FUNCTION atualizar_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_atualizado_em ON usuarios;
CREATE TRIGGER usuarios_atualizado_em BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();
DROP TRIGGER IF EXISTS agricultores_atualizado_em ON agricultores;
CREATE TRIGGER agricultores_atualizado_em BEFORE UPDATE ON agricultores FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

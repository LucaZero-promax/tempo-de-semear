import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { existsSync, readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  const envLine = readFileSync('.env.local', 'utf8').split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='));
  if (envLine) process.env.DATABASE_URL = envLine.slice('DATABASE_URL='.length);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuario VARCHAR(80)`;
await sql`UPDATE usuarios SET usuario = split_part(email, '@', 1) WHERE usuario IS NULL`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS usuarios_usuario_uidx ON usuarios(LOWER(usuario))`;

async function saveUser(usuario, nome, email, senha, perfil) {
  const senhaHash = await bcrypt.hash(senha, 12);
  await sql`
    INSERT INTO usuarios (usuario, nome, email, senha_hash, perfil, ativo)
    VALUES (${usuario}, ${nome}, ${email}, ${senhaHash}, ${perfil}::perfil_usuario, true)
    ON CONFLICT (email) DO UPDATE SET
      usuario = EXCLUDED.usuario,
      nome = EXCLUDED.nome,
      senha_hash = EXCLUDED.senha_hash,
      perfil = EXCLUDED.perfil,
      ativo = true,
      atualizado_em = NOW()
  `;
}

await saveUser('lukas2020', 'Lukas Administrador', 'lukas2020@itapecurumirim.ma.gov.br', 'lukas2020', 'ADMINISTRADOR');
await saveUser('12345', 'Operador de Teste', '12345@itapecurumirim.ma.gov.br', '1234', 'OPERADOR');
console.log('Administrador e operador temporários criados/atualizados.');

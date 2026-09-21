import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { existsSync, readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  const envLine = readFileSync('.env.local', 'utf8').split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='));
  if (envLine) process.env.DATABASE_URL = envLine.slice('DATABASE_URL='.length);
}

const email = process.env.ADMIN_EMAIL || 'admin.teste@itapecurumirim.ma.gov.br';
const password = process.env.ADMIN_PASSWORD || 'Semear@2026!';
const name = process.env.ADMIN_NAME || 'Administrador de Teste';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada. Crie .env.local antes de executar este comando.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await bcrypt.hash(password, 12);
await sql`
  INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
  VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, 'ADMINISTRADOR', true)
  ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    senha_hash = EXCLUDED.senha_hash,
    perfil = 'ADMINISTRADOR',
    ativo = true,
    atualizado_em = NOW()
`;

console.log(`Usuário administrador criado/atualizado: ${email}`);
console.log('Senha temporária definida pela variável ADMIN_PASSWORD ou pelo valor padrão do ambiente de desenvolvimento.');

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const envLine = readFileSync('.env.local', 'utf8').split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='));
const databaseUrl = envLine?.slice('DATABASE_URL='.length);
if (!databaseUrl || databaseUrl.includes('COLE_A_CONNECTION')) {
  console.error('DATABASE_URL ausente ou ainda não configurada.');
  process.exit(1);
}

try {
  const sql = neon(databaseUrl);
  const result = await sql`SELECT 1 AS ok`;
  console.log(result[0]?.ok === 1 ? 'Conexão com o Neon OK.' : 'Resposta inesperada do Neon.');
} catch (error) {
  console.error(`Falha na conexão com o Neon: ${error.message}`);
  process.exit(1);
}

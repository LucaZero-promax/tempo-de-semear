import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { database } from '../../../../lib/db';
import { createSession } from '../../../../lib/security';

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ erro: 'Banco de dados não configurado. Adicione DATABASE_URL no arquivo .env.local e reinicie o servidor.' }, { status: 503 });
  }
  try {
    const { email, senha } = await request.json();
    const sql = database();
    const rows = await sql`SELECT id, nome, perfil, senha_hash FROM usuarios WHERE email = ${String(email).trim().toLowerCase()} AND ativo = true LIMIT 1`;
    const user = rows[0] as { id: string; nome: string; perfil: string; senha_hash: string } | undefined;
    if (!user || !(await bcrypt.compare(String(senha), user.senha_hash))) return NextResponse.json({ erro: 'E-mail ou senha inválidos.' }, { status: 401 });
    const token = await createSession({ id: user.id, nome: user.nome, perfil: user.perfil });
    const response = NextResponse.json({ ok: true });
    response.cookies.set('tempo-session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 8, path: '/' });
    return response;
  } catch (error) {
    console.error('Falha no login:', error);
    return NextResponse.json({ erro: 'Não foi possível conectar ao banco de dados. Verifique DATABASE_URL.' }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { database } from '../../../lib/db';
import { readSession } from '../../../lib/security';

async function adminSession(request: NextRequest) {
  const token = request.cookies.get('tempo-session')?.value;
  if (!token) return null;
  try {
    const session = await readSession(token);
    return session.perfil === 'ADMINISTRADOR' ? session : null;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const session = await adminSession(request);
  if (!session) return NextResponse.json({ erro: 'Apenas administradores podem consultar usuários.' }, { status: 403 });
  const sql = database();
  const usuarios = await sql`SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome`;
  return NextResponse.json({ usuarios });
}

export async function POST(request: NextRequest) {
  const session = await adminSession(request);
  if (!session) return NextResponse.json({ erro: 'Apenas administradores podem criar usuários.' }, { status: 403 });
  const { nome, email, senha, perfil = 'OPERADOR' } = await request.json();
  if (!nome || !email || !senha || senha.length < 8 || !['OPERADOR', 'ADMINISTRADOR'].includes(perfil)) {
    return NextResponse.json({ erro: 'Informe nome, e-mail, senha com no mínimo 8 caracteres e perfil válido.' }, { status: 400 });
  }
  const sql = database();
  const senhaHash = await bcrypt.hash(senha, 12);
  try {
    const usuarios = await sql`INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (${nome.trim()}, ${email.trim().toLowerCase()}, ${senhaHash}, ${perfil}::perfil_usuario) RETURNING id, nome, email, perfil, ativo`;
    await sql`INSERT INTO logs_auditoria (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (${session.id}, 'CRIACAO', 'usuarios', ${usuarios[0].id}, ${JSON.stringify({ perfil })})`;
    return NextResponse.json(usuarios[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('usuarios_email_key')) return NextResponse.json({ erro: 'Este e-mail já está cadastrado.' }, { status: 409 });
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const session = await adminSession(request);
  if (!session) return NextResponse.json({ erro: 'Apenas administradores podem alterar usuários.' }, { status: 403 });
  const { id, ativo } = await request.json();
  if (!id || typeof ativo !== 'boolean') return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  if (id === session.id && !ativo) return NextResponse.json({ erro: 'Você não pode desativar seu próprio acesso.' }, { status: 400 });
  const sql = database();
  const usuarios = await sql`UPDATE usuarios SET ativo = ${ativo} WHERE id = ${id} RETURNING id, nome, email, perfil, ativo`;
  if (!usuarios[0]) return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 });
  await sql`INSERT INTO logs_auditoria (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (${session.id}, 'ALTERACAO_ATIVO', 'usuarios', ${id}, ${JSON.stringify({ ativo })})`;
  return NextResponse.json(usuarios[0]);
}

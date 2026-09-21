import { NextRequest, NextResponse } from 'next/server';
import { database, isValidCpf, onlyDigits } from '../../../lib/db';
import { readSession } from '../../../lib/security';

async function authenticated(request: NextRequest) {
  const token = request.cookies.get('tempo-session')?.value;
  if (!token) return null;
  try { return await readSession(token); } catch { return null; }
}

export async function GET(request: NextRequest) {
  const session = await authenticated(request);
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  const search = request.nextUrl.searchParams.get('busca') || '';
  const status = request.nextUrl.searchParams.get('status');
  const comunidade = request.nextUrl.searchParams.get('comunidade');
  const sql = database();
  const rows = await sql`SELECT id, nome_completo, cpf, comunidade, protocolo, caf_dap, status, data_entrega FROM agricultores WHERE (nome_completo ILIKE ${`%${search}%`} OR cpf LIKE ${`%${onlyDigits(search)}%`} OR protocolo ILIKE ${`%${search}%`}) AND (${status || null}::text IS NULL OR status = (${status || null})::status_beneficio) AND (${comunidade || null}::text IS NULL OR comunidade = (${comunidade || null})::text) ORDER BY criado_em DESC LIMIT 100`;
  return NextResponse.json({ agricultores: rows });
}

export async function POST(request: NextRequest) {
  const session = await authenticated(request);
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  const body = await request.json();
  if (!body.nome_completo || !isValidCpf(body.cpf) || !body.comunidade || !body.protocolo) return NextResponse.json({ erro: 'Informe nome, CPF válido, comunidade e protocolo.' }, { status: 400 });
  const sql = database();
  const duplicate = await sql`SELECT id, nome_completo, comunidade, protocolo FROM agricultores WHERE LOWER(BTRIM(nome_completo)) = LOWER(BTRIM(${body.nome_completo})) OR cpf = ${onlyDigits(body.cpf)} OR protocolo = ${body.protocolo} LIMIT 1`;
  if (duplicate[0]) {
    return NextResponse.json({ erro: 'Este agricultor já possui cadastro ou os dados informados já estão em uso.', duplicado: duplicate[0] }, { status: 409 });
  }
  let rows;
  try {
    rows = await sql`INSERT INTO agricultores (nome_completo, cpf, comunidade, protocolo, caf_dap, telefone, criado_por) VALUES (${body.nome_completo.trim()}, ${onlyDigits(body.cpf)}, ${body.comunidade.trim()}, ${body.protocolo.trim()}, ${body.caf_dap || null}, ${body.telefone || null}, ${session.id}) RETURNING id, nome_completo, comunidade, protocolo, status`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('agricultores_nome_normalizado_uidx')) {
      return NextResponse.json({ erro: 'Outro operador acabou de cadastrar este nome. Atualize a lista antes de tentar novamente.' }, { status: 409 });
    }
    throw error;
  }
  await sql`INSERT INTO logs_auditoria (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (${session.id}, 'CRIACAO', 'agricultores', ${rows[0].id}, ${JSON.stringify({ protocolo: body.protocolo })})`;
  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await authenticated(request);
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  const { id, status } = await request.json();
  if (!id || !['ENTREGUE', 'AGUARDANDO_RETIRADA'].includes(status)) {
    return NextResponse.json({ erro: 'Status inválido.' }, { status: 400 });
  }
  const sql = database();
  const rows = await sql`UPDATE agricultores SET status = ${status}::status_beneficio, data_entrega = CASE WHEN ${status} = 'ENTREGUE' THEN NOW() ELSE NULL END WHERE id = ${id} RETURNING id, nome_completo, comunidade, protocolo, status, data_entrega`;
  if (!rows[0]) return NextResponse.json({ erro: 'Agricultor não encontrado.' }, { status: 404 });
  await sql`INSERT INTO logs_auditoria (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (${session.id}, 'ATUALIZACAO_STATUS', 'agricultores', ${id}, ${JSON.stringify({ status })})`;
  return NextResponse.json(rows[0]);
}

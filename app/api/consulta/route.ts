import { NextResponse } from 'next/server';
import { database, isValidCpf, onlyDigits } from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { cpf } = await request.json();
    if (!isValidCpf(cpf || '')) return NextResponse.json({ encontrado: false }, { status: 400 });
    const sql = database();
    const rows = await sql`SELECT nome_completo, comunidade, status, protocolo FROM agricultores WHERE cpf = ${onlyDigits(cpf)} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ encontrado: false });
    const record = rows[0] as { nome_completo: string; comunidade: string; status: string; protocolo: string };
    const name = record.nome_completo.split(' ');
    const maskedName = name.length > 1 ? `${name[0]} ${name[name.length - 1][0]}.` : `${name[0][0]}.`;
    return NextResponse.json({ encontrado: true, nome: maskedName, comunidade: record.comunidade, status: record.status, protocolo: record.protocolo });
  } catch {
    return NextResponse.json({ encontrado: false, erro: 'Serviço indisponível' }, { status: 503 });
  }
}

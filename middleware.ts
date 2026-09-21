import { NextRequest, NextResponse } from 'next/server';
import { readSession } from './lib/security';

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/painel')) return NextResponse.next();
  const token = request.cookies.get('tempo-session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));
  try {
    await readSession(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = { matcher: ['/painel/:path*'] };

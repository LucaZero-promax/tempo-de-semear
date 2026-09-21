import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'desenvolvimento-tempo-de-semear');

export async function createSession(payload: { id: string; perfil: string; nome: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret);
}

export async function readSession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { id: string; perfil: string; nome: string };
}

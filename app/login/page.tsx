'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Sprout } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  async function login(event: FormEvent) { event.preventDefault(); setEnviando(true); setErro(''); const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) }); const data = await response.json(); if (!response.ok) setErro(data.erro); else router.push('/painel'); setEnviando(false); }
  return <main className="login-page"><div className="login-aside"><a className="back-link" href="/"><ArrowLeft size={16} /> Voltar ao portal</a><div className="login-message"><span className="eyebrow"><span /> GESTÃO PÚBLICA</span><h1>O trabalho no campo começa <em>com organização.</em></h1><p>Acesse o ambiente seguro para acompanhar os beneficiários e as entregas do programa.</p></div><small>Tempo de Semear · Itapecuru Mirim</small></div><div className="login-content"><div className="login-box"><span className="brand-mark"><Sprout size={22} /></span><div className="section-kicker">ÁREA RESTRITA</div><h2>Bem-vindo de volta</h2><p className="muted">Entre com suas credenciais de gestor.</p><form onSubmit={login}><label>E-mail institucional<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nome@itapecurumirim.ma.gov.br" required /></label><label>Senha<input type="password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Digite sua senha" required /></label>{erro && <div className="form-error">{erro}</div>}<button className="full-button" type="submit" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar no painel'} <ArrowRight size={17} /></button></form><div className="login-note"><Lock size={15} /> Ambiente protegido e monitorado</div></div></div></main>;
}

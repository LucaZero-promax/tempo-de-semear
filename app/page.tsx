'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, MapPin, Search, ShieldCheck, Sprout } from 'lucide-react';

type Resultado = { encontrado: boolean; nome?: string; comunidade?: string; status?: string; protocolo?: string };

export default function HomePage() {
  const [cpf, setCpf] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function consultar(event: React.FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setResultado(null);
    try {
      const response = await fetch('/api/consulta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf }) });
      setResultado(await response.json());
    } catch {
      setResultado({ encontrado: false });
    } finally { setCarregando(false); }
  }

  return <main>
    <header className="topbar"><div className="topbar-inner"><div className="brand"><span className="brand-mark"><Sprout size={20} /></span><span><b>Tempo de</b><strong>Semear</strong></span></div><div className="header-meta"><span className="status-dot" /> Portal oficial <a href="/login">Área restrita <ArrowRight size={14} /></a></div></div></header>
    <section className="hero"><div className="hero-glow" /><div className="hero-inner"><div className="eyebrow"><span /> PROGRAMA ESTADUAL</div><h1>Mais sementes para<br /><em>novas colheitas.</em></h1><p>Consulte de forma rápida e segura o status do seu benefício do programa Tempo de Semear em Itapecuru Mirim.</p><a className="hero-link" href="#consulta">Consultar meu benefício <ArrowRight size={16} /></a></div><div className="hero-stamp"><span>ITAPECURU</span><b>MIRIM</b><small>MARANHÃO · MA</small></div></section>
    <section id="consulta" className="consult-section"><div className="section-intro"><div className="section-kicker">CONSULTA PÚBLICA</div><h2>Encontre seu benefício</h2><p>Tenha seu CPF em mãos. Seus dados são protegidos e nenhuma informação pessoal é exibida publicamente.</p></div><div className="consult-card"><div className="card-icon"><Search size={22} /></div><form onSubmit={consultar}><label htmlFor="cpf">Digite seu CPF</label><div className="input-row"><input id="cpf" inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={cpf} onChange={event => setCpf(event.target.value)} required /><button type="submit" disabled={carregando}>{carregando ? 'Consultando...' : 'Consultar'} <ArrowRight size={17} /></button></div><small>Consulta protegida · acesso somente com CPF</small></form></div>{resultado && <div className={`result-card ${resultado.encontrado ? 'success' : 'not-found'}`}>{resultado.encontrado ? <><CheckCircle2 size={26} /><div><b>Benefício localizado</b><p>{resultado.nome} · {resultado.comunidade}</p><span>{resultado.status === 'ENTREGUE' ? 'Benefício entregue' : 'Aguardando retirada'} · Protocolo {resultado.protocolo}</span></div></> : <><ShieldCheck size={26} /><div><b>Não encontramos um benefício</b><p>Confira o CPF informado ou procure a Secretaria Municipal de Agricultura.</p></div></>}</div>}</section>
    <section className="info-band"><div><MapPin size={20} /><b>Atendimento local</b><span>Itapecuru Mirim · Maranhão</span></div><div><ShieldCheck size={20} /><b>Seus dados protegidos</b><span>Consulta em conformidade com a LGPD</span></div><div><Lock size={20} /><b>Canal oficial</b><span>Informações atualizadas pela gestão</span></div></section>
    <footer><div className="footer-brand"><span className="brand-mark"><Sprout size={17} /></span><span><b>Tempo de</b><strong>Semear</strong></span></div><span>Programa estadual · Itapecuru Mirim - MA</span><a href="/login">Acesso de gestores <ArrowRight size={14} /></a></footer>
  </main>;
}

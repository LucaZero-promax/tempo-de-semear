'use client';

import { BarChart3, FileText, LogOut, Sprout, Users } from 'lucide-react';
import Link from 'next/link';

export function PainelShell({ children, active = 'visao-geral' }: { children: React.ReactNode; active?: string }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return <main className="dashboard"><aside className="sidebar"><div className="sidebar-brand"><span className="brand-mark"><Sprout size={19} /></span><span><b>Tempo de</b><strong>Semear</strong></span></div><div className="sidebar-label">MENU PRINCIPAL</div><nav><Link className={active === 'visao-geral' ? 'active' : ''} href="/painel"><BarChart3 size={17} /> Visão geral</Link><Link className={active === 'agricultores' ? 'active' : ''} href="/painel/agricultores"><Users size={17} /> Agricultores</Link><Link className={active === 'relatorios' ? 'active' : ''} href="/painel/relatorios"><FileText size={17} /> Relatórios</Link><Link className={active === 'usuarios' ? 'active' : ''} href="/painel/usuarios"><Users size={17} /> Usuários e operadores</Link></nav><div className="sidebar-footer"><span className="user-avatar">AS</span><div><b>Admin Secretaria</b><small>Administrador</small></div><button onClick={logout} title="Sair"><LogOut size={16} /></button></div></aside><section className="dashboard-main"><header className="dashboard-header"><div><span className="section-kicker">GESTÃO OPERACIONAL</span><h1>{active === 'agricultores' ? 'Agricultores' : active === 'usuarios' ? 'Usuários e operadores' : active === 'relatorios' ? 'Relatórios' : 'Visão geral'}</h1></div><div className="header-user"><span className="status-dot" /> Sistema online</div></header>{children}</section></main>;
}

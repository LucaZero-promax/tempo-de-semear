'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Download, FileText, Filter, LogOut, Menu, Plus, Search, Sprout, Users, X } from 'lucide-react';

type Agricultor = { id: string; nome_completo: string; comunidade: string; protocolo: string; status: 'ENTREGUE' | 'AGUARDANDO_RETIRADA'; };
type Formulario = { nome_completo: string; cpf: string; comunidade: string; protocolo: string; caf_dap: string; telefone: string; };
type Usuario = { id: string; nome: string; email: string; perfil: 'OPERADOR' | 'ADMINISTRADOR'; ativo: boolean; };
type FormularioUsuario = { nome: string; email: string; senha: string; perfil: 'OPERADOR' | 'ADMINISTRADOR'; };

const initialForm: Formulario = { nome_completo: '', cpf: '', comunidade: '', protocolo: '', caf_dap: '', telefone: '' };
const initialUserForm: FormularioUsuario = { nome: '', email: '', senha: '', perfil: 'OPERADOR' };

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Agricultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<Formulario>(initialForm);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [userForm, setUserForm] = useState<FormularioUsuario>(initialUserForm);

  async function loadRows() {
    setLoading(true);
    const params = new URLSearchParams({ busca: query });
    if (status) params.set('status', status);
    const response = await fetch(`/api/agricultores?${params}`);
    if (response.status === 401) { window.location.href = '/login'; return; }
    if (!response.ok) { setError('Não foi possível carregar os agricultores.'); setLoading(false); return; }
    const data = await response.json();
    setRows(data.agricultores || []);
    setLoading(false);
  }

  useEffect(() => { loadRows(); }, [status]);

  async function loadUsers() {
    const response = await fetch('/api/usuarios');
    if (response.status === 403) { setError('Apenas administradores podem gerenciar usuários.'); return; }
    const data = await response.json();
    setUsers(data.usuarios || []);
    setShowUsers(true);
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) });
    const data = await response.json();
    if (!response.ok) { setError(data.erro || 'Não foi possível criar o usuário.'); return; }
    setUserForm(initialUserForm);
    setShowUserForm(false);
    setSuccess('Usuário criado com sucesso.');
    await loadUsers();
  }

  async function toggleUser(user: Usuario) {
    const response = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, ativo: !user.ativo }) });
    const data = await response.json();
    if (!response.ok) { setError(data.erro || 'Não foi possível atualizar o usuário.'); return; }
    setUsers(current => current.map(item => item.id === data.id ? data : item));
  }

  async function createAgricultor(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const duplicateResponse = await fetch(`/api/agricultores?busca=${encodeURIComponent(form.nome_completo.trim())}`);
    if (duplicateResponse.ok) {
      const duplicateData = await duplicateResponse.json();
      const sameName = duplicateData.agricultores?.find((item: Agricultor) => item.nome_completo.trim().toLowerCase() === form.nome_completo.trim().toLowerCase());
      if (sameName) {
        setError(`Já existe um cadastro para "${sameName.nome_completo}" na comunidade ${sameName.comunidade}, protocolo ${sameName.protocolo}. Confira os dados antes de continuar.`);
        setSaving(false);
        return;
      }
    }
    const response = await fetch('/api/agricultores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setError(data.erro || 'Não foi possível cadastrar o agricultor.'); setSaving(false); return; }
    setForm(initialForm);
    setShowForm(false);
    setSuccess('Agricultor cadastrado com sucesso.');
    setSaving(false);
    await loadRows();
  }

  async function updateStatus(id: string, nextStatus: Agricultor['status']) {
    setError('');
    const response = await fetch('/api/agricultores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) { setError('Não foi possível atualizar o status.'); return; }
    await loadRows();
  }

  function exportCsv() {
    const csv = ['Nome,Comunidade,Protocolo,Status', ...rows.map(row => [row.nome_completo, row.comunidade, row.protocolo, row.status].map(value => `"${value.replaceAll('"', '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'beneficiarios-tempo-de-semear.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }
  const delivered = rows.filter(row => row.status === 'ENTREGUE').length;
  const pending = rows.filter(row => row.status === 'AGUARDANDO_RETIRADA').length;
  const updateField = (field: keyof Formulario, value: string) => setForm(current => ({ ...current, [field]: value }));

  return <main className="dashboard">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}><div className="sidebar-brand"><span className="brand-mark"><Sprout size={19} /></span><span><b>Tempo de</b><strong>Semear</strong></span><button className="close-menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div><div className="sidebar-label">MENU PRINCIPAL</div><nav><a className="active" href="#visao-geral"><BarChart3 size={17} /> Visão geral</a><a href="#beneficiarios"><Users size={17} /> Agricultores</a><button className="sidebar-link" onClick={exportCsv}><FileText size={17} /> Relatórios</button><button className="sidebar-link" onClick={loadUsers}><Users size={17} /> Usuários e operadores</button></nav><div className="sidebar-footer"><span className="user-avatar">AS</span><div><b>Admin Secretaria</b><small>Administrador</small></div><button onClick={logout} title="Sair"><LogOut size={16} /></button></div></aside>
    <section className="dashboard-main"><header className="dashboard-header"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div><span className="section-kicker">GESTÃO OPERACIONAL</span><h1>Visão geral</h1></div><div className="header-user"><span className="status-dot" /> Sistema online</div></header>
      <div className="dashboard-content" id="visao-geral"><div className="welcome"><div><h2>Acompanhamento do programa</h2><p>Dados reais carregados do banco Neon</p></div><div className="welcome-actions"><button className="outline-button" onClick={exportCsv}><Download size={16} /> Exportar relatório</button><button className="primary-button" onClick={() => { setShowForm(true); setError(''); }}><Plus size={16} /> Novo cadastro</button></div></div>
        {success && <div className="success-message"><CheckCircle2 size={16} /> {success}</div>}
        <div className="stats"><div className="stat-card"><span className="stat-icon blue"><Users size={19} /></span><small>REGISTROS EXIBIDOS</small><strong>{rows.length}</strong><span className="stat-foot">Resultado da consulta</span></div><div className="stat-card"><span className="stat-icon green"><CheckCircle2 size={19} /></span><small>ENTREGUES</small><strong>{delivered}</strong><span className="stat-foot positive">Status atualizado</span></div><div className="stat-card"><span className="stat-icon amber"><FileText size={19} /></span><small>PENDENTES</small><strong>{pending}</strong><span className="stat-foot">Aguardando retirada</span></div></div>
        <div className="table-panel" id="beneficiarios"><div className="panel-heading"><div><h3>Beneficiários cadastrados</h3><p>Consulte e atualize os registros cadastrados</p></div><button className="filter-button" onClick={loadRows}><Filter size={15} /> Atualizar</button></div><div className="table-tools"><div className="search-input"><Search size={16} /><input placeholder="Buscar por nome, comunidade ou protocolo" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && loadRows()} /></div><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option><option value="AGUARDANDO_RETIRADA">Pendentes</option><option value="ENTREGUE">Entregues</option></select></div>{error && !showForm && !showUserForm && <div className="form-error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>BENEFICIÁRIO</th><th>COMUNIDADE</th><th>PROTOCOLO</th><th>STATUS</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={5}>Carregando registros...</td></tr> : rows.length === 0 ? <tr><td colSpan={5}>Nenhum beneficiário encontrado.</td></tr> : rows.map(row => <tr key={row.id}><td><b>{row.nome_completo}</b></td><td>{row.comunidade}</td><td className="protocol">{row.protocolo}</td><td><span className={`badge ${row.status === 'ENTREGUE' ? 'delivered' : 'pending'}`}>{row.status === 'ENTREGUE' ? 'Entregue' : 'Aguardando retirada'}</span></td><td><button className="row-action" onClick={() => updateStatus(row.id, row.status === 'ENTREGUE' ? 'AGUARDANDO_RETIRADA' : 'ENTREGUE')}>{row.status === 'ENTREGUE' ? 'Reabrir' : 'Marcar entregue'}</button></td></tr>)}</tbody></table></div><div className="table-footer">Exibindo {rows.length} registros <a onClick={loadRows}>Atualizar <span>↻</span></a></div></div>
        {showUsers && <div className="table-panel users-panel"><div className="panel-heading"><div><h3>Usuários e operadores</h3><p>Contas autorizadas a acessar o sistema</p></div><button className="primary-button" onClick={() => { setShowUserForm(true); setError(''); }}><Plus size={15} /> Novo usuário</button></div><div className="table-wrap"><table><thead><tr><th>NOME</th><th>E-MAIL</th><th>PERFIL</th><th>STATUS</th><th /></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><b>{user.nome}</b></td><td>{user.email}</td><td>{user.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Operador'}</td><td><span className={`badge ${user.ativo ? 'delivered' : 'pending'}`}>{user.ativo ? 'Ativo' : 'Inativo'}</span></td><td><button className="row-action" onClick={() => toggleUser(user)}>{user.ativo ? 'Desativar' : 'Ativar'}</button></td></tr>)}</tbody></table></div></div>}
      </div></section>
    {showForm && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-farmer-title"><div className="modal-header"><div><span className="section-kicker">NOVO REGISTRO</span><h2 id="new-farmer-title">Cadastrar agricultor</h2><p>Preencha os dados do beneficiário do programa.</p></div><button className="modal-close" onClick={() => setShowForm(false)} aria-label="Fechar"><X size={19} /></button></div><form className="registration-form" onSubmit={createAgricultor}><label>Nome completo *<input value={form.nome_completo} onChange={event => updateField('nome_completo', event.target.value)} required /></label><div className="form-grid"><label>CPF *<input inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={event => updateField('cpf', event.target.value)} required /></label><label>Telefone<input inputMode="tel" value={form.telefone} onChange={event => updateField('telefone', event.target.value)} /></label></div><label>Comunidade / povoado *<input value={form.comunidade} onChange={event => updateField('comunidade', event.target.value)} placeholder="Ex.: São José dos Matos" required /></label><div className="form-grid"><label>Número do protocolo *<input value={form.protocolo} onChange={event => updateField('protocolo', event.target.value)} placeholder="TS-2026-00001" required /></label><label>CAF / DAP<input value={form.caf_dap} onChange={event => updateField('caf_dap', event.target.value)} /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cadastro'} <CheckCircle2 size={16} /></button></div></form></div></div>}
    {showUserForm && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-user-title"><div className="modal-header"><div><span className="section-kicker">ACESSO RESTRITO</span><h2 id="new-user-title">Criar usuário</h2><p>Cadastre um operador ou administrador.</p></div><button className="modal-close" onClick={() => setShowUserForm(false)} aria-label="Fechar"><X size={19} /></button></div><form className="registration-form" onSubmit={createUser}><label>Nome completo *<input value={userForm.nome} onChange={event => setUserForm(current => ({ ...current, nome: event.target.value }))} required /></label><label>E-mail institucional *<input type="email" value={userForm.email} onChange={event => setUserForm(current => ({ ...current, email: event.target.value }))} required /></label><div className="form-grid"><label>Senha temporária *<input type="password" minLength={8} value={userForm.senha} onChange={event => setUserForm(current => ({ ...current, senha: event.target.value }))} required /></label><label>Perfil<select value={userForm.perfil} onChange={event => setUserForm(current => ({ ...current, perfil: event.target.value as FormularioUsuario['perfil'] }))}><option value="OPERADOR">Operador</option><option value="ADMINISTRADOR">Administrador</option></select></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowUserForm(false)}>Cancelar</button><button type="submit" className="primary-button">Criar usuário <CheckCircle2 size={16} /></button></div></form></div></div>}
  </main>;
}

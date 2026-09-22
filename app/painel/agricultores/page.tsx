'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Filter, Plus, Search } from 'lucide-react';
import { PainelShell } from '../components/PainelShell';

type Agricultor = { id: string; nome_completo: string; comunidade: string; protocolo: string; status: 'ENTREGUE' | 'AGUARDANDO_RETIRADA'; };
type Formulario = { nome_completo: string; cpf: string; comunidade: string; protocolo: string; caf_dap: string; telefone: string; };
const initialForm: Formulario = { nome_completo: '', cpf: '', comunidade: '', protocolo: '', caf_dap: '', telefone: '' };

export default function AgricultoresPage() {
  const [rows, setRows] = useState<Agricultor[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadRows() {
    const params = new URLSearchParams({ busca: query });
    if (status) params.set('status', status);
    const response = await fetch(`/api/agricultores?${params}`);
    if (response.status === 401) { window.location.href = '/login'; return; }
    const data = await response.json();
    setRows(data.agricultores || []);
  }
  useEffect(() => { loadRows(); }, [status]);

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('');
    const response = await fetch('/api/agricultores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.erro || 'Não foi possível salvar.'); setSaving(false); return; }
    setForm(initialForm); setShowForm(false); setMessage('Agricultor cadastrado com sucesso.'); setSaving(false); await loadRows();
  }

  async function updateStatus(id: string, nextStatus: Agricultor['status']) {
    const response = await fetch('/api/agricultores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) });
    if (response.ok) await loadRows();
  }
  const field = (name: keyof Formulario, value: string) => setForm(current => ({ ...current, [name]: value }));
  return <PainelShell active="agricultores"><div className="dashboard-content page-content"><div className="page-heading"><div><span className="section-kicker">BASE DE BENEFICIÁRIOS</span><h2>Cadastro de agricultores</h2><p>Consulte, cadastre e atualize os beneficiários do programa.</p></div><button className="primary-button" onClick={() => { setShowForm(true); setMessage(''); }}><Plus size={16} /> Novo cadastro</button></div>{message && <div className="success-message"><CheckCircle2 size={16} /> {message}</div>}<div className="table-panel"><div className="table-tools"><div className="search-input"><Search size={16} /><input placeholder="Buscar nome, comunidade ou protocolo" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && loadRows()} /></div><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option><option value="AGUARDANDO_RETIRADA">Pendentes</option><option value="ENTREGUE">Entregues</option></select><button className="filter-button" onClick={loadRows}><Filter size={15} /> Buscar</button></div><div className="table-wrap"><table><thead><tr><th>BENEFICIÁRIO</th><th>COMUNIDADE</th><th>PROTOCOLO</th><th>STATUS</th><th /></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={5}>Nenhum agricultor encontrado.</td></tr> : rows.map(row => <tr key={row.id}><td><b>{row.nome_completo}</b></td><td>{row.comunidade}</td><td className="protocol">{row.protocolo}</td><td><span className={`badge ${row.status === 'ENTREGUE' ? 'delivered' : 'pending'}`}>{row.status === 'ENTREGUE' ? 'Entregue' : 'Aguardando retirada'}</span></td><td><button className="row-action" onClick={() => updateStatus(row.id, row.status === 'ENTREGUE' ? 'AGUARDANDO_RETIRADA' : 'ENTREGUE')}>{row.status === 'ENTREGUE' ? 'Reabrir' : 'Marcar entregue'}</button></td></tr>)}</tbody></table></div></div></div>{showForm && <div className="modal-backdrop"><div className="modal-card"><div className="modal-header"><div><span className="section-kicker">NOVO REGISTRO</span><h2>Cadastrar agricultor</h2><p>Os campos com * são obrigatórios.</p></div><button className="modal-close" onClick={() => setShowForm(false)}>×</button></div><form className="registration-form" onSubmit={save}><label>Nome completo *<input value={form.nome_completo} onChange={event => field('nome_completo', event.target.value)} required /></label><div className="form-grid"><label>CPF *<input value={form.cpf} onChange={event => field('cpf', event.target.value)} required /></label><label>Telefone<input value={form.telefone} onChange={event => field('telefone', event.target.value)} /></label></div><label>Comunidade / povoado *<input value={form.comunidade} onChange={event => field('comunidade', event.target.value)} required /></label><div className="form-grid"><label>Protocolo *<input value={form.protocolo} onChange={event => field('protocolo', event.target.value)} required /></label><label>CAF / DAP<input value={form.caf_dap} onChange={event => field('caf_dap', event.target.value)} /></label></div>{message && <div className="form-error">{message}</div>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cadastro'}</button></div></form></div></div>}</PainelShell>;
}

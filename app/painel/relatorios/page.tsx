'use client';

import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { PainelShell } from '../components/PainelShell';

type Agricultor = { nome_completo: string; comunidade: string; protocolo: string; status: string; };

export default function RelatoriosPage() {
  const [rows, setRows] = useState<Agricultor[]>([]);
  useEffect(() => { fetch('/api/agricultores?busca=').then(response => response.json()).then(data => setRows(data.agricultores || [])); }, []);
  function download() { const csv = ['Nome,Comunidade,Protocolo,Status', ...rows.map(row => [row.nome_completo, row.comunidade, row.protocolo, row.status].map(value => `"${value.replaceAll('"', '""')}"`).join(','))].join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'relatorio-tempo-de-semear.csv'; link.click(); URL.revokeObjectURL(link.href); }
  return <PainelShell active="relatorios"><div className="dashboard-content page-content"><div className="page-heading"><div><span className="section-kicker">PRESTAÇÃO DE CONTAS</span><h2>Relatórios</h2><p>Exporte os registros atuais para análise e acompanhamento.</p></div></div><div className="report-grid"><div className="report-card"><span className="report-icon"><FileText size={21} /></span><h3>Beneficiários cadastrados</h3><p>{rows.length} registros disponíveis no banco de dados.</p><button className="primary-button" onClick={download}><Download size={16} /> Baixar CSV</button></div></div></div></PainelShell>;
}

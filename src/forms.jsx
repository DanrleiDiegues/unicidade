// Formulários oficiais da gestão de frotas (modelos da Prefeitura de Chácara).
// Cada formulário pertence a uma etapa do funil e marca a tarefa ligada a ele quando é concluído.
import { useState } from 'react';
import { Printer, Check } from 'lucide-react';
import { Modal, fmtDate } from './ui';

export const GRAVIDADE = [
  ['baixa', 'O veículo pode continuar circulando normalmente'],
  ['media', 'O veículo deve ter uso restrito'],
  ['alta', 'O veículo deve ser IMOBILIZADO imediatamente'],
];
const ACESSORIOS = ['Bagagito', 'Calota', 'Chave de roda', 'Triângulo', 'Macaco', 'Farol auxiliar', 'Manual', 'Extintor', 'Alarme',
  'Chave principal', 'Chave reserva', 'Tapetes', 'Rádio AM/FM', 'CD player', 'Kit multimídia', 'Auto falante', 'Giroflex', 'Cartão GFS',
  'Tacógrafo', 'Antena', 'Capota fibra', 'Capota marítima', 'Chave seg. estepe', 'Porta escada', 'Quebra sol', 'Retrovisor interno',
  'Forro de porta', 'Forro de teto', 'Forro do porta-malas', 'Banco dianteiro', 'Banco traseiro', 'Encosto banco tras.', 'Protetor de cárter', 'Placa veicular', 'Difusor de ar'];

// type: text | date | time | number | money | textarea | radio | checks | sign | sna | tires
export const FORMS = [
  { key: 'smc', code: '01', stage: 0, title: 'Solicitação de Manutenção Corretiva (SMC)', sections: [
    { title: 'Identificação', fields: [['numero', 'Nº da SMC'], ['data', 'Data', 'date'], ['setor', 'Setor solicitante'], ['motorista', 'Motorista'], ['hodometro', 'Hodômetro (km)', 'number']] },
    { title: 'Descrição do defeito', fields: [['defeito', 'Descrição do defeito', 'textarea'], ['gravidade', 'Classificação da gravidade', 'radio', GRAVIDADE]] },
    { title: 'Assinaturas', fields: [['ass_motorista', 'Motorista', 'sign'], ['ass_chefe', 'Chefe do setor', 'sign']] },
    { title: 'Uso exclusivo da gestão de frotas', fields: [['recebido', 'Recebido em', 'date'], ['gestor', 'Gestor'], ['encaminhado', 'Encaminhado para', 'radio', [['vistoria', 'Vistoria'], ['os', 'OS direta'], ['devolvido', 'Devolvido']]], ['obs', 'Observações', 'textarea'], ['ass_ucgf', 'Gestor da UCGF', 'sign']] },
  ] },
  { key: 'checklist', code: '03', stage: 1, title: 'Checklist de inspeção do veículo', sections: [
    { title: 'Dados', fields: [['condicao', 'Veículo', 'radio', [['novo', 'Novo'], ['usado', 'Usado']]], ['km', 'Km', 'number'], ['data', 'Data', 'date'], ['hora', 'Hora', 'time'], ['crlv', 'Documento original (CRLV) no veículo?', 'radio', [['sim', 'Sim'], ['nao', 'Não']]], ['exercicio', 'Exercício do CRLV'], ['combustivel', 'Nível de combustível', 'radio', [['E', 'Reserva'], ['1/4', '1/4'], ['1/2', '1/2'], ['3/4', '3/4'], ['F', 'Cheio']]], ['sujo', 'Devolvido excessivamente sujo?', 'radio', [['sim', 'Sim'], ['nao', 'Não']]]] },
    { title: 'Pneus', fields: [['pneus', 'Pneus', 'tires']] },
    { title: 'Avarias na lataria', fields: [['avarias', 'Local e tipo (1 arranhado, 2 amassado, 3 piques, 4 trincado, 5 quebrado, 6 falta). Ex.: porta dianteira esquerda: 2', 'textarea']] },
    { title: 'Acessórios e equipamentos', fields: [['acessorios', 'S = sim, existente · N = inexistente · A = avariado', 'sna', ACESSORIOS]] },
    { title: 'Observações e assinaturas', fields: [['obs', 'Observações', 'textarea'], ['ass_condutor', 'Condutor', 'sign'], ['ass_entrega', 'Responsável pela entrega', 'sign']] },
  ] },
  { key: 'oficina', code: '02', stage: 2, title: 'Oficina credenciada · entrada, orçamento e diagnóstico', sections: [
    { title: 'Entrada na oficina', fields: [['oficina', 'Oficina credenciada'], ['entrada', 'Entrada do veículo', 'date'], ['hora', 'Horário', 'time']] },
    { title: 'Previsão de orçamento', fields: [['itens', 'Itens (descrição e valor, um por linha)', 'textarea'], ['mao_obra', 'Mão de obra (R$)', 'money'], ['pecas', 'Troca de peças (R$)', 'money']] },
    { title: 'Diagnóstico técnico', fields: [['diagnostico', 'Diagnóstico técnico', 'textarea'], ['ass_mecanico', 'Mecânico', 'sign']] },
  ] },
  { key: 'recebimento', code: '02', stage: 4, title: 'Termo de recebimento e conferência do serviço', sections: [
    { title: 'Conferência (comissão de frotas e fiscal de contrato)', fields: [['conferencia', 'Conferência', 'checks', ['Todos os serviços da OS foram executados integralmente', 'O defeito relatado foi sanado', 'Peças substituídas foram apresentadas/entregues e etiquetadas para armazenamento']]] },
    { title: 'Saída da oficina', fields: [['saida', 'Saída do veículo', 'date'], ['hora', 'Horário de saída', 'time'], ['hodometro', 'Hodômetro no recebimento (km)', 'number'], ['encerramento', 'Data de encerramento', 'date']] },
    { title: 'Assinaturas', fields: [['ass_motorista', 'Motorista', 'sign'], ['ass_chefe', 'Chefe do setor', 'sign'], ['ass_gestor', 'Gestor da frota', 'sign'], ['ass_comissao', 'Membro da comissão', 'sign'], ['ass_fiscal', 'Fiscal de contratos', 'sign']] },
  ] },
];
export const formLabel = (f) => `Formulário ${f.code} · ${f.title}`;

const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Field({ f, v, set, ro }) {
  const [k, label, type = 'text', opts] = f;
  const val = v[k];
  if (type === 'textarea') return <label className="f">{label}<textarea className="input" rows={3} disabled={ro} value={val || ''} onChange={(e) => set(k, e.target.value)} /></label>;
  if (type === 'radio') return (
    <div className="f"><span>{label}</span><div className="chips">{opts.map(([ov, ol]) => (
      <button type="button" key={ov} disabled={ro} className={`badge ${val === ov ? 'on' : 'soon'}`} style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => set(k, ov)}>{val === ov ? '● ' : '○ '}{ol}</button>))}</div></div>);
  if (type === 'checks') return (
    <div className="f"><span>{label}</span>{opts.map((o, i) => (
      <label key={i} style={{ display: 'flex', gap: 8, color: 'var(--text)' }}><input type="checkbox" disabled={ro} checked={!!val?.[i]} onChange={(e) => set(k, { ...(val || {}), [i]: e.target.checked })} />{o}</label>))}</div>);
  if (type === 'sign') return (
    <label className="f">{label}<div style={{ display: 'flex', gap: 8 }}>
      <input className="input" placeholder="Nome" disabled={ro} value={val?.nome || ''} onChange={(e) => set(k, { ...(val || {}), nome: e.target.value })} />
      <button type="button" disabled={ro} className={`btn sm ${val?.ok ? 'primary' : ''}`} onClick={() => set(k, { ...(val || {}), ok: !val?.ok, em: new Date().toISOString() })}>{val?.ok ? <><Check size={14} />Assinado</> : 'Assinar'}</button>
    </div></label>);
  if (type === 'sna') return (
    <div className="f"><span>{label}</span><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>{opts.map((o) => (
      <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text)', fontSize: 13 }}>
        {['S', 'N', 'A'].map((x) => <button type="button" key={x} disabled={ro} className={`badge ${val?.[o] === x ? 'on' : 'soon'}`} style={{ cursor: 'pointer', padding: '2px 7px' }} onClick={() => set(k, { ...(val || {}), [o]: x })}>{x}</button>)}<span>{o}</span></div>))}</div></div>);
  if (type === 'tires') return (
    <div className="f">{['Dianteiro', 'Traseiro', 'Estepe'].map((p) => (
      <div key={p} style={{ display: 'grid', gridTemplateColumns: '90px auto 1fr', gap: 8, alignItems: 'center', color: 'var(--text)' }}>
        <span>{p}</span>
        <div className="chips">{['Bom', 'Médio', 'Ruim'].map((q) => <button type="button" key={q} disabled={ro} className={`badge ${val?.[p]?.estado === q ? 'on' : 'soon'}`} style={{ cursor: 'pointer' }} onClick={() => set(k, { ...(val || {}), [p]: { ...(val?.[p] || {}), estado: q } })}>{q}</button>)}</div>
        <input className="input" placeholder="Marca" disabled={ro} value={val?.[p]?.marca || ''} onChange={(e) => set(k, { ...(val || {}), [p]: { ...(val?.[p] || {}), marca: e.target.value } })} />
      </div>))}</div>);
  return <label className="f">{label}<input className="input" type={type === 'money' ? 'number' : type} disabled={ro} value={val || ''} onChange={(e) => set(k, e.target.value)} /></label>;
}

export function FormModal({ form, order, vehicle, tenant, editable, onSave, onClose }) {
  const saved = order.forms?.[form.key] || {};
  const [v, setV] = useState(saved.data || {});
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }));
  const ro = !editable;
  return (
    <Modal title={formLabel(form)} onClose={onClose}>
      <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{vehicle?.plate} · {vehicle?.model}{saved.done && ` · concluído em ${fmtDate(saved.at)}`}</div>
      <div className="form">
        {form.sections.map((s) => (
          <fieldset key={s.title} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, display: 'grid', gap: 10 }}>
            <legend style={{ padding: '0 6px', fontWeight: 600, fontSize: 13 }}>{s.title}</legend>
            {s.fields.map((f) => <Field key={f[0]} f={f} v={v} set={set} ro={ro} />)}
          </fieldset>
        ))}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" onClick={() => printForm(form, v, order, vehicle, tenant)}><Printer size={14} />Imprimir</button>
          {editable && <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn sm" onClick={() => onSave(v, false)}>Salvar rascunho</button>
            <button type="button" className="btn primary sm" onClick={() => onSave(v, true)}><Check size={14} />Concluir formulário</button>
          </div>}
        </div>
      </div>
    </Modal>
  );
}

// Impressão no modelo da prefeitura (brasão, cabeçalho e campos de assinatura).
export function printForm(form, v, order, vehicle, tenant) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const show = ([k, label, type, opts]) => {
    const x = v[k];
    if (type === 'radio') return opts.map(([ov, ol]) => `${x === ov ? '(X)' : '( )'} ${esc(ol)}`).join('<br>');
    if (type === 'checks') return opts.map((o, i) => `${x?.[i] ? '(X)' : '( )'} ${esc(o)}`).join('<br>');
    if (type === 'sign') return `${esc(x?.nome)}${x?.ok ? ' — assinado digitalmente em ' + fmtDate(x.em) : ''}<div class="sig"></div>`;
    if (type === 'sna') return `<div class="sna">${opts.map((o) => `<span>[${x?.[o] || ' '}] ${esc(o)}</span>`).join('')}</div>`;
    if (type === 'tires') return ['Dianteiro', 'Traseiro', 'Estepe'].map((p) => `${p}: ${esc(x?.[p]?.estado || '___')} · marca ${esc(x?.[p]?.marca || '______')}`).join('<br>');
    if (type === 'money') return brl(x);
    if (type === 'date') return x ? fmtDate(x) : '____/____/______';
    return esc(x).replace(/\n/g, '<br>') || '&nbsp;';
  };
  const logo = tenant?.logo_url ? new URL(tenant.logo_url, location.href).href : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(formLabel(form))}</title><style>
  body{font:12px Arial,sans-serif;margin:24px;color:#111} .hd{display:flex;gap:14px;align-items:center;border-bottom:2px solid #111;padding-bottom:8px}
  .hd img{height:64px} h1{font-size:16px;margin:0} h2{font-size:13px;margin:0} table{width:100%;border-collapse:collapse;margin-top:10px}
  td,th{border:1px solid #333;padding:6px;vertical-align:top} th{background:#eee;text-align:center} .lb{width:32%;font-weight:bold}
  .sig{border-bottom:1px solid #333;height:22px;margin-top:6px} .sna{columns:3;font-size:11px} .sna span{display:block}
  </style></head><body><div class="hd">${logo ? `<img src="${logo}">` : ''}<div><h1>PREFEITURA MUNICIPAL DE ${esc((tenant?.name || '').toUpperCase())}</h1><h2>ESTADO DE MINAS GERAIS</h2></div></div>
  <table><tr><th colspan="2">${esc(form.title.toUpperCase())} — FORMULÁRIO ${form.code}</th></tr>
  <tr><td class="lb">Placa / Modelo</td><td>${esc(vehicle?.plate)} · ${esc(vehicle?.model)}</td></tr>
  <tr><td class="lb">Ocorrência</td><td>${esc(order.title)}</td></tr>
  ${form.sections.map((s) => `<tr><th colspan="2">${esc(s.title.toUpperCase())}</th></tr>${s.fields.map((f) => `<tr><td class="lb">${esc(f[1])}</td><td>${show(f)}</td></tr>`).join('')}`).join('')}
  </table><script>window.onload=()=>setTimeout(()=>print(),300)</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

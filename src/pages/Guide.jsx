// Minitutorial lateral: passos curtos para cada perfil. Pode ser recolhido.
import { useState } from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';

const GUIDES = {
  gestor: [
    ['Abra uma OS', 'Clique em "Abrir OS", escolha o veículo e descreva o defeito. Ela vai para a coluna 1. Solicitação.'],
    ['Acompanhe pelo kanban', 'Cada coluna é uma etapa. Clique no cartão para ver tarefas, formulários e histórico.'],
    ['Conclua as tarefas', 'Marque as tarefas da etapa. Só depois o botão "Avançar etapa" é liberado.'],
    ['Preencha os formulários', '01 na Solicitação, 03 na Vistoria, 02 no Orçamento e no Recebimento. Ao concluir, a tarefa se marca sozinha.'],
    ['Imprima para assinar', 'Em cada formulário, "Imprimir" gera a folha com o brasão para as assinaturas em papel.'],
    ['Use os filtros', 'Busque por placa, nº da OS ou problema, e filtre por secretaria e prioridade.'],
    ['Registre saídas', 'Na aba Movimentações, registre a saída do veículo e depois a devolução com o km.'],
  ],
  motorista: [
    ['Abra uma OS', 'Viu um defeito? Clique em "Abrir OS", escolha o veículo e descreva o problema.'],
    ['Informe a gravidade', 'Diga se o veículo pode rodar, deve ter uso restrito ou precisa ficar parado.'],
    ['Acompanhe', 'Seus cartões mostram em que etapa está cada OS, da Solicitação ao Pagamento.'],
  ],
};

export default function Guide({ kind = 'gestor' }) {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('uc-guide') !== 'off'; } catch { return true; } });
  const toggle = (v) => { setOpen(v); try { localStorage.setItem('uc-guide', v ? 'on' : 'off'); } catch { /* ignore */ } };
  if (!open) return <button className="btn guide-fab" onClick={() => toggle(true)}><BookOpen size={16} />Como usar</button>;
  return (
    <aside className="glass guide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ display: 'flex', gap: 8, alignItems: 'center' }}><BookOpen size={16} />Como usar</b>
        <button className="btn ghost sm" style={{ border: 0 }} onClick={() => toggle(false)} aria-label="Fechar tutorial"><X size={14} /></button>
      </div>
      <ol>
        {GUIDES[kind].map(([t, d]) => (
          <li key={t}><b>{t}</b><span>{d}</span></li>
        ))}
      </ol>
      <small className="muted" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><ChevronRight size={12} />OS marcadas com "(exemplo)" são só para treinar.</small>
    </aside>
  );
}

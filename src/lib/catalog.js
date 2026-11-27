// Catálogo de módulos da plataforma. Novos módulos entram aqui e ganham uma rota em App.jsx.
export const MODULES = [
  { key: 'frotas', name: 'UNIfrotas', desc: 'Veículos, abastecimento e manutenção', icon: 'Truck', ready: true },
  { key: 'saude', name: 'UNIsaúde', desc: 'Unidades, atendimentos e farmácia', icon: 'HeartPulse' },
  { key: 'educacao', name: 'UNIeducação', desc: 'Escolas, matrículas e merenda', icon: 'GraduationCap' },
  { key: 'infra', name: 'UNInfra', desc: 'Obras, vias e iluminação pública', icon: 'Construction' },
  { key: 'financas', name: 'UNIfinanças', desc: 'Orçamento, despesas e receitas', icon: 'Landmark' },
  { key: 'social', name: 'UNIsocial', desc: 'Assistência social e programas', icon: 'HandHeart' },
  { key: 'mapa', name: 'UNImapa', desc: 'Mapa da cidade, prédios, clima e IBGE', icon: 'Map', ready: true },
  { key: 'ia', name: 'UNIagente', desc: 'Agente de IA sobre todos os dados', icon: 'Sparkles' },
];

// Papéis. 'geral' vê tudo da cidade; 'motorista' só registra e acompanha ocorrências no UNIfrotas.
// Novos papéis (ex.: 'saude') usam o mesmo formato: lista de módulos que podem ver.
// Perfil "geral" (prefeito, vice e assessoria do gabinete) vê tudo, inclusive os extras (Visão geral, Mapa, Cidadãos).
// Os demais perfis veem só o(s) módulo(s) UNIxxx da sua área.
export const ROLES = {
  geral: { label: 'Gabinete do prefeito', modules: ['*'] }, // prefeito, vice e assessoria
  motorista: { label: 'Motorista', modules: ['frotas'] },
  saude: { label: 'Saúde', modules: ['saude'] },
  educacao: { label: 'Educação', modules: ['educacao'] },
};
export const isGeral = (role) => role === 'geral';

// Funil de manutenção: 6 etapas. Os 23 status do Frota Chácara (Django) viraram tarefas dentro delas.
export const STAGES = [
  { name: 'Solicitação', tasks: ['Formulário 01 (SMC) preenchido', 'Autorização do secretário da pasta'] },
  { name: 'Vistoria e OS', tasks: ['Formulário 03 (checklist de inspeção) preenchido', 'OS autorizada pela gestão da frota', 'Diagnóstico da oficina (serviços e peças)'] },
  { name: 'Orçamento', tasks: ['Formulário 02 (entrada, orçamento e diagnóstico) preenchido', 'Análise da comissão: necessidade, quantidades, valores e mão de obra', 'Aprovado pela comissão'] },
  { name: 'Execução', tasks: ['AF de serviço emitida', 'AF de peças emitida', 'Serviço executado (início, fim e o que foi feito)'] },
  { name: 'Recebimento', tasks: ['Formulário 02 (termo de recebimento e conferência) preenchido', 'Peças substituídas entregues', 'Relatório fotográfico (antes e depois)'] },
  { name: 'Pagamento', tasks: ['Liquidação (nota fiscal e valor)', 'Pagamento ao fornecedor'] },
];
// Tarefa marcada automaticamente quando cada formulário é concluído
export const FORM_TASK = { smc: STAGES[0].tasks[0], checklist: STAGES[1].tasks[0], oficina: STAGES[2].tasks[0], recebimento: STAGES[4].tasks[0] };

export const VEHICLE_TYPES = ['Ônibus', 'Carro do gabinete', 'Ambulância', 'Caminhão', 'Van', 'Máquina', 'Outro'];
export const VEHICLE_STATUS = { disponivel: 'Disponível', em_uso: 'Em uso', manutencao: 'Em manutenção', indisponivel: 'Indisponível', baixado: 'Baixado' };
export const MAINT_TYPES = ['Corretiva', 'Preventiva', 'Revisão', 'Troca de peça', 'Outra'];

export const canSee = (role, moduleKey) => {
  const m = ROLES[role]?.modules || [];
  return m.includes('*') || m.includes(moduleKey);
};

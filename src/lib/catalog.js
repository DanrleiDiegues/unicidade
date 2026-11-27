// Catálogo de módulos da plataforma. Novos módulos entram aqui e ganham uma rota em App.jsx.
export const MODULES = [
  { key: 'frotas', name: 'UNIfrotas', desc: 'Veículos, abastecimento e manutenção', icon: 'Truck', ready: true },
  { key: 'saude', name: 'UNIsaúde', desc: 'Unidades, atendimentos e farmácia', icon: 'HeartPulse' },
  { key: 'educacao', name: 'UNIeducação', desc: 'Escolas, matrículas e merenda', icon: 'GraduationCap' },
  { key: 'infra', name: 'UNInfra', desc: 'Obras, vias e iluminação pública', icon: 'Construction' },
  { key: 'financas', name: 'UNIfinanças', desc: 'Orçamento, despesas e receitas', icon: 'Landmark' },
  { key: 'social', name: 'UNIsocial', desc: 'Assistência social e programas', icon: 'HandHeart' },
  { key: 'mapa', name: 'UNImapa', desc: 'Mapa 3D e gestão do território', icon: 'Map' },
  { key: 'ia', name: 'UNIagente', desc: 'Agente de IA sobre todos os dados', icon: 'Sparkles' },
];

// Papéis. 'geral' vê tudo da cidade; 'motorista' só registra e acompanha ocorrências no UNIfrotas.
// Novos papéis (ex.: 'saude') usam o mesmo formato: lista de módulos que podem ver.
export const ROLES = {
  geral: { label: 'Gestão geral', modules: ['*'] },
  motorista: { label: 'Motorista', modules: ['frotas'] },
};

// Funil de manutenção: 6 etapas. Os 23 status do Frota Chácara (Django) viraram tarefas dentro delas.
export const STAGES = [
  { name: 'Solicitação', tasks: ['Defeito descrito com fotos', 'Autorização do secretário da pasta'] },
  { name: 'Vistoria e OS', tasks: ['Vistoria inicial (diagnóstico e recomendação)', 'Ordem de Serviço emitida (nº da OS)', 'Diagnóstico da oficina (serviços e peças)'] },
  { name: 'Orçamento', tasks: ['Orçamento de serviço anexado', 'Orçamento de peças anexado', 'Análise da comissão: necessidade, quantidades, valores e mão de obra', 'Aprovado pela comissão'] },
  { name: 'Execução', tasks: ['AF de serviço emitida', 'AF de peças emitida', 'Serviço executado (início, fim e o que foi feito)'] },
  { name: 'Recebimento', tasks: ['Peças substituídas entregues', 'Relatório fotográfico (antes e depois)', 'Recebimento pela comissão (serviço, peças, documentos e teste)'] },
  { name: 'Pagamento', tasks: ['Liquidação (nota fiscal e valor)', 'Pagamento ao fornecedor'] },
];

export const VEHICLE_TYPES = ['Ônibus', 'Carro do gabinete', 'Ambulância', 'Caminhão', 'Van', 'Máquina', 'Outro'];
export const VEHICLE_STATUS = { disponivel: 'Disponível', em_uso: 'Em uso', manutencao: 'Em manutenção', indisponivel: 'Indisponível', baixado: 'Baixado' };
export const MAINT_TYPES = ['Corretiva', 'Preventiva', 'Revisão', 'Troca de peça', 'Outra'];

export const canSee = (role, moduleKey) => {
  const m = ROLES[role]?.modules || [];
  return m.includes('*') || m.includes(moduleKey);
};

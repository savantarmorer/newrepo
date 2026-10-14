import type { PerfilPublico } from '../perfil/types';

export type StatusProjeto = 'planejamento' | 'ativo' | 'concluido' | 'cancelado';
export type StatusTarefa = 'a_fazer' | 'fazendo' | 'feito';

export interface Projeto {
  id: string;
  titulo: string;
  descricao_md: string;
  causa: string;
  nucleo_id: string | null;
  coordenador_id: string;
  status: StatusProjeto;
  meta_financeira: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  capa_url: string | null;
  oculto: boolean;
  created_at: string;
  nucleo?: { cidade: string; estado: string } | null;
  coordenador?: PerfilPublico;
  resumo?: ResumoCaixa;
}

export interface ResumoCaixa {
  projeto_id: string;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  lancamentos: number;
}

export interface Tarefa {
  id: string;
  projeto_id: string;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  criado_por: string | null;
  status: StatusTarefa;
  prazo: string | null;
  horas_estimadas: number | null;
  created_at: string;
  responsavel?: PerfilPublico;
  projeto?: { titulo: string } | null;
}

export interface RegistroHoras {
  id: string;
  profile_id: string;
  projeto_id: string;
  tarefa_id: string | null;
  horas: number;
  descricao: string;
  confirmado_por: string | null;
  confirmado_em: string | null;
  recusado_em: string | null;
  created_at: string;
  autor?: PerfilPublico;
}

export interface Lancamento {
  id: string;
  projeto_id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria: string;
  comprovante_url: string | null;
  lancado_por: string | null;
  estorno_de: string | null;
  doacao_id: string | null;
  data: string;
  created_at: string;
  autor?: PerfilPublico;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  nucleo_id: string | null;
  projeto_id: string | null;
  criado_por: string;
  local_nome: string | null;
  endereco: string | null;
  inicio: string;
  fim: string;
  vagas: number | null;
  created_at: string;
  nucleo?: { cidade: string; estado: string } | null;
  projeto?: { titulo: string } | null;
}

export type StatusRsvp = 'vou' | 'talvez' | 'nao_vou';

export interface Rsvp {
  evento_id: string;
  profile_id: string;
  status: StatusRsvp;
  presente: boolean;
  checkin_em: string | null;
  perfil?: PerfilPublico;
}

export interface CobrancaPix {
  doacao_id: string;
  pix_copia_cola: string;
  qr_code_base64: string | null;
  expira_em: string;
  valor: number;
  simulado: boolean;
}

export const ROTULO_STATUS_PROJETO: Record<StatusProjeto, string> = {
  planejamento: 'Em planejamento', ativo: 'Ativo', concluido: 'Concluído', cancelado: 'Cancelado',
};
export const ROTULO_STATUS_TAREFA: Record<StatusTarefa, string> = { a_fazer: 'A fazer', fazendo: 'Fazendo', feito: 'Feito' };

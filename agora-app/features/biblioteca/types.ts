import type { PerfilPublico } from '../perfil/types';

export interface Tema {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
}

export interface Topico {
  id: string;
  tema_id: string;
  autor_id: string;
  titulo: string;
  corpo_md: string;
  fixado: boolean;
  trancado: boolean;
  status: 'aberto' | 'resolvido' | 'arquivado';
  oculto: boolean;
  editado_em: string | null;
  ultima_atividade_em: string;
  created_at: string;
  tema?: { nome: string; slug: string } | null;
  respostas?: { count: number }[];
  autor?: PerfilPublico;
}

export interface Resposta {
  id: string;
  topico_id: string;
  autor_id: string;
  corpo_md: string;
  resposta_pai_id: string | null;
  marcada_como_util: boolean;
  oculto: boolean;
  editado_em: string | null;
  excluido_em: string | null;
  created_at: string;
  autor?: PerfilPublico;
  filhos?: Resposta[];
}

export type StatusArtigo = 'rascunho' | 'em_revisao' | 'publicado' | 'recusado';

export interface Artigo {
  id: string;
  tema_id: string;
  criado_por: string;
  titulo: string;
  resumo: string | null;
  corpo_md: string;
  capa_url: string | null;
  status: StatusArtigo;
  rodada_revisao: number;
  topico_origem_id: string | null;
  publicado_em: string | null;
  oculto: boolean;
  created_at: string;
  updated_at: string;
  tema?: { nome: string; slug: string } | null;
}

export interface Autoria {
  profile_id: string;
  papel: 'autor' | 'coautor' | 'revisor';
  perfil?: PerfilPublico;
}

export interface Revisao {
  id: string;
  artigo_id: string;
  revisor_id: string;
  rodada: number;
  parecer: 'aprovar' | 'pedir_mudancas' | 'recusar';
  comentario: string;
  created_at: string;
  revisor?: PerfilPublico;
}

export interface Trilha {
  id: string;
  titulo: string;
  descricao: string | null;
  tema_id: string | null;
  curador_id: string;
  nivel_dificuldade: number;
  capa_url: string | null;
  publicada: boolean;
  destaque: boolean;
  publicada_em: string | null;
  created_at: string;
  tema?: { nome: string; slug: string } | null;
  trilha_itens?: { count: number }[];
}

export interface ItemTrilha {
  artigo_id: string;
  ordem: number;
  artigo: { id: string; titulo: string; resumo: string | null; corpo_md: string } | null;
}

export const ROTULO_STATUS_ARTIGO: Record<StatusArtigo, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  publicado: 'Publicado',
  recusado: 'Recusado',
};

export const ROTULO_DIFICULDADE: Record<number, string> = { 1: 'Introdutória', 2: 'Intermediária', 3: 'Avançada' };

import { dados, rpc, supabase } from '@/lib/supabase';
import type { MeuPerfil, Nucleo } from '../perfil/types';
import type { Tema } from '../biblioteca/types';

/** Admins leem a tabela profiles completa (inclui nome real de quem usa pseudônimo). */
export async function listarMembros(termo: string): Promise<MeuPerfil[]> {
  let q = supabase.from('profiles').select('*').is('excluido_em', null).order('nome_exibicao').limit(60);
  const t = termo.trim();
  if (t) q = q.or(`nome_exibicao.ilike.%${t}%,pseudonimo.ilike.%${t}%,cidade.ilike.%${t}%`);
  return dados(q);
}

export async function atualizarMembro(id: string, campos: Partial<Pick<MeuPerfil, 'papel' | 'status_assinatura' | 'assinatura_valida_ate' | 'nucleo_id' | 'suspenso_ate'>>) {
  return dados(supabase.from('profiles').update(campos).eq('id', id).select('id').single());
}

export async function salvarTema(t: Partial<Tema> & { nome: string; slug: string }) {
  const { id, ...campos } = t;
  if (id) return dados(supabase.from('temas').update(campos).eq('id', id));
  return dados(supabase.from('temas').insert(campos));
}

export async function salvarNucleo(n: Partial<Nucleo> & { cidade: string; estado: string }) {
  const { id, ...campos } = n;
  if (id) return dados(supabase.from('nucleos').update(campos).eq('id', id));
  return dados(supabase.from('nucleos').insert(campos));
}

export async function listarConfiguracoes(): Promise<{ chave: string; valor: unknown; descricao: string | null }[]> {
  return dados(supabase.from('configuracoes').select('chave, valor, descricao').order('chave'));
}

export async function salvarConfiguracao(chave: string, valor: unknown) {
  return dados(supabase.from('configuracoes').update({ valor }).eq('chave', chave));
}

export interface Metricas {
  membros_ativos: number;
  membros_total: number;
  artigos_publicados: number;
  artigos_em_revisao: number;
  horas_confirmadas: number;
  denuncias_abertas: number;
  propostas_em_votacao: number;
  projetos: { id: string; titulo: string; status: string; arrecadado: number; gasto: number; saldo: number }[];
}

export async function metricas(): Promise<Metricas> {
  return rpc('metricas_admin');
}

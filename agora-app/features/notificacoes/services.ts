import { dados, meuId, supabase } from '@/lib/supabase';

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

export async function listarNotificacoes(antes?: string | null): Promise<Notificacao[]> {
  const id = await meuId();
  let q = supabase.from('notificacoes').select('id, tipo, titulo, corpo, link, lida, created_at').eq('profile_id', id).order('created_at', { ascending: false }).limit(30);
  if (antes) q = q.lt('created_at', antes);
  return dados(q);
}

export async function contarNaoLidas(): Promise<number> {
  const id = await meuId();
  const { count } = await supabase.from('notificacoes').select('id', { count: 'exact', head: true }).eq('profile_id', id).eq('lida', false);
  return count ?? 0;
}

export async function marcarLida(id: string) {
  await dados(supabase.from('notificacoes').update({ lida: true }).eq('id', id));
}

export async function marcarTodasLidas() {
  const id = await meuId();
  await dados(supabase.from('notificacoes').update({ lida: true }).eq('profile_id', id).eq('lida', false));
}

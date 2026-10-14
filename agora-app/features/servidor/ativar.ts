import { queryClient } from '@/lib/queryClient';
import { conectarSupabase } from '@/lib/supabase';
import { resolverServidor, type Servidor } from '@/lib/servidor';
import { useServidor } from '@/stores/servidor';
import { useSessao } from '@/stores/sessao';

/** Na abertura do app: decide o servidor (salvo > build > Supabase local em dev). */
export async function iniciarServidor() {
  const servidor = await resolverServidor();
  if (servidor) conectarSupabase(servidor);
  else useSessao.getState().definir(null);
  useServidor.getState().definir(servidor);
}

/** Troca de servidor sem reiniciar o app: novo cliente, cache limpo, sessão relida. */
export function ativarServidor(servidor: Servidor) {
  conectarSupabase(servidor);
  queryClient.clear();
  useSessao.setState({ sessao: null, carregando: true });
  useServidor.getState().definir(servidor);
}

/** Monta o link de convite que configura o app de outra pessoa (QR Code no painel admin). */
export function linkDeConvite(servidor: Pick<Servidor, 'url' | 'chave'>) {
  return `agora://servidor?url=${encodeURIComponent(servidor.url)}&chave=${encodeURIComponent(servidor.chave)}`;
}

/** Aceita o link agora://servidor?url=…&chave=… (lido de QR Code ou colado) ou JSON {url, chave}. */
export function lerConvite(texto: string): { url: string; chave: string } | null {
  const t = texto.trim();
  try {
    if (t.startsWith('{')) {
      const j = JSON.parse(t) as { url?: unknown; chave?: unknown };
      if (typeof j.url === 'string' && typeof j.chave === 'string') return { url: j.url, chave: j.chave };
      return null;
    }
    const consulta = t.includes('?') ? t.slice(t.indexOf('?') + 1) : '';
    const params = new URLSearchParams(consulta);
    const url = params.get('url');
    const chave = params.get('chave');
    return url && chave ? { url, chave } : null;
  } catch {
    return null;
  }
}

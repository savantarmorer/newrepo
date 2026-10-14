import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { mensagemDeErro } from './erros';
import type { Servidor } from './servidor';

let clienteAtual: SupabaseClient | null = null;

/** Cria o cliente para o servidor escolhido. Cada servidor guarda a própria sessão. */
export function conectarSupabase(servidor: Servidor): SupabaseClient {
  clienteAtual?.auth.stopAutoRefresh();
  clienteAtual?.removeAllChannels();
  const prefixo = servidor.url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');
  clienteAtual = createClient(servidor.url, servidor.chave, {
    auth: {
      storage: AsyncStorage,
      storageKey: `sb-${prefixo}-auth`,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  });
  return clienteAtual;
}

export const supabaseConectado = () => clienteAtual !== null;

/**
 * Ponto único de acesso ao Supabase. Encaminha para o cliente do servidor atual, então
 * trocar de servidor (tela "Servidor") não exige reiniciar o app.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_alvo, prop) {
    if (!clienteAtual) throw new Error('Servidor da Ágora ainda não configurado.');
    const valor = Reflect.get(clienteAtual, prop, clienteAtual) as unknown;
    return typeof valor === 'function' ? (valor as (...a: unknown[]) => unknown).bind(clienteAtual) : valor;
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (!clienteAtual) return;
    if (estado === 'active') clienteAtual.auth.startAutoRefresh();
    else clienteAtual.auth.stopAutoRefresh();
  });
}

type Resposta = { data: unknown; error: PostgrestError | null };

/** Desembrulha uma resposta do Supabase, lançando erro em português.
 *  O tipo T é declarado por quem chama (o cliente não é tipado pelo schema). */
export async function dados<T>(consulta: PromiseLike<Resposta>): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw new Error(mensagemDeErro(error));
  return data as T;
}

/** Igual a `dados`, mas aceita nulo (ex.: .maybeSingle()). */
export async function dadosOuNulo<T>(consulta: PromiseLike<Resposta>): Promise<T | null> {
  const { data, error } = await consulta;
  if (error) throw new Error(mensagemDeErro(error));
  return (data ?? null) as T | null;
}

export async function rpc<T>(nome: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(nome, args);
  if (error) throw new Error(mensagemDeErro(error));
  return data as T;
}

export async function meuId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Sua sessão expirou. Entre novamente.');
  return id;
}

/** Chama uma Edge Function com o JWT do usuário. */
export async function chamarFuncao<T>(nome: string, corpo?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nome, { body: corpo ?? {} });
  if (error) {
    let detalhe = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const j = (await ctx.json()) as { erro?: string };
        if (j?.erro) detalhe = j.erro;
      } catch {
        /* corpo não-JSON */
      }
    }
    throw new Error(detalhe);
  }
  return data as T;
}

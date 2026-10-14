import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type PostgrestError } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { env } from './env';
import { mensagemDeErro } from './erros';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey || 'chave-ausente', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
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

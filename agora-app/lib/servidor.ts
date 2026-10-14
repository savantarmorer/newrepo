/**
 * Qual backend Supabase o app usa. Ordem de prioridade:
 *  1. o servidor escolhido no próprio app (tela "Servidor", guardado no aparelho);
 *  2. o embutido no build (EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY);
 *  3. em desenvolvimento, o Supabase local (`supabase start`) no mesmo computador do Metro —
 *     o celular o alcança pelo IP da rede local que o Expo já usa para o bundle.
 * Sem nenhum deles, o app abre a tela de configuração em vez de quebrar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { env } from './env';

export type OrigemServidor = 'app' | 'build' | 'desenvolvimento';
export interface Servidor {
  url: string;
  chave: string;
  origem: OrigemServidor;
}

const CHAVE_ARMAZENAMENTO = 'agora.servidor.v1';

/** Chave anon pública e padrão do `supabase start` (projeto local de demonstração, não é segredo). */
export const CHAVE_ANON_SUPABASE_LOCAL =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/** Host do computador que serve o bundle (ex.: 192.168.0.12) — só existe em desenvolvimento. */
function hostDoMetro(): string | null {
  const uri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo
      ?.debuggerHost;
  if (!uri) return Platform.OS === 'web' ? '127.0.0.1' : null;
  return uri.split(':')[0] || null;
}

export function normalizarUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/(rest|auth)\/v1$/i, '');
}

export function servidorDoBuild(): Servidor | null {
  if (env.supabaseUrl && env.supabaseAnonKey) {
    return { url: normalizarUrl(env.supabaseUrl), chave: env.supabaseAnonKey, origem: 'build' };
  }
  if (__DEV__) {
    const host = hostDoMetro();
    if (host) {
      return {
        url: env.supabaseUrl ? normalizarUrl(env.supabaseUrl) : `http://${host}:54321`,
        chave: env.supabaseAnonKey || CHAVE_ANON_SUPABASE_LOCAL,
        origem: 'desenvolvimento',
      };
    }
  }
  return null;
}

export async function servidorSalvo(): Promise<Servidor | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    const s = JSON.parse(bruto) as Partial<Servidor>;
    if (typeof s.url === 'string' && typeof s.chave === 'string' && s.url && s.chave) {
      return { url: s.url, chave: s.chave, origem: 'app' };
    }
  } catch {
    /* armazenamento corrompido: ignora */
  }
  return null;
}

export async function resolverServidor(): Promise<Servidor | null> {
  return (await servidorSalvo()) ?? servidorDoBuild();
}

export async function salvarServidor(url: string, chave: string): Promise<Servidor> {
  const s: Servidor = { url: normalizarUrl(url), chave: chave.trim(), origem: 'app' };
  await AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ url: s.url, chave: s.chave }));
  return s;
}

export async function esquecerServidor(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_ARMAZENAMENTO);
}

/**
 * Confere se o endereço responde e se é mesmo um backend da Ágora (migrações aplicadas):
 * chama a função pública `estatisticas_publicas`, liberada para visitantes.
 */
export async function testarServidor(url: string, chave: string): Promise<void> {
  const base = normalizarUrl(url);
  if (!/^https?:\/\/[^/\s]+/i.test(base)) throw new Error('Endereço inválido. Ex.: https://abcd.supabase.co');
  if (chave.trim().length < 20) throw new Error('Cole a chave pública (anon) completa do projeto.');
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), 10_000);
  let resposta: Response;
  try {
    resposta = await fetch(`${base}/rest/v1/rpc/estatisticas_publicas`, {
      method: 'POST',
      headers: { apikey: chave.trim(), Authorization: `Bearer ${chave.trim()}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: controle.signal,
    });
  } catch {
    throw new Error(
      base.startsWith('http://')
        ? 'Não foi possível conectar. Confira se o computador e o celular estão na mesma rede e se o `supabase start` está rodando.'
        : 'Não foi possível conectar ao servidor. Confira o endereço e sua internet.',
    );
  } finally {
    clearTimeout(tempo);
  }
  if (resposta.status === 401 || resposta.status === 403) throw new Error('O servidor recusou a chave. Use a chave pública "anon".');
  if (resposta.status === 404) throw new Error('Servidor encontrado, mas sem o banco da Ágora. Aplique as migrações (README).');
  if (!resposta.ok) throw new Error(`O servidor respondeu com erro ${resposta.status}.`);
}

/** Lê um link de configuração: agora://servidor?url=...&chave=... */
export function servidorDoLink(params: { url?: string | string[]; chave?: string | string[] }) {
  const um = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';
  return { url: um(params.url), chave: um(params.chave) };
}

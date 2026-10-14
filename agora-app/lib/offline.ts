import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cópia local dos artigos salvos — leitura garantida sem internet, independente
 * do cache do TanStack Query (que pode ser descartado).
 */
const CHAVE = 'agora-artigos-offline-v1';

export interface ArtigoOffline {
  id: string;
  titulo: string;
  resumo: string | null;
  corpo_md: string;
  autores: string[];
  publicado_em: string | null;
  salvo_em: string;
}

async function ler(): Promise<Record<string, ArtigoOffline>> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Record<string, ArtigoOffline>) : {};
  } catch {
    return {};
  }
}

export async function guardarArtigoOffline(a: Omit<ArtigoOffline, 'salvo_em'>) {
  const todos = await ler();
  todos[a.id] = { ...a, salvo_em: new Date().toISOString() };
  await AsyncStorage.setItem(CHAVE, JSON.stringify(todos));
}

export async function removerArtigoOffline(id: string) {
  const todos = await ler();
  delete todos[id];
  await AsyncStorage.setItem(CHAVE, JSON.stringify(todos));
}

export async function artigoOffline(id: string): Promise<ArtigoOffline | null> {
  return (await ler())[id] ?? null;
}

export async function listarArtigosOffline(): Promise<ArtigoOffline[]> {
  return Object.values(await ler()).sort((a, b) => b.salvo_em.localeCompare(a.salvo_em));
}

export async function limparOffline() {
  await AsyncStorage.removeItem(CHAVE);
}

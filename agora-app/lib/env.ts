/**
 * Variáveis públicas do app (prefixo EXPO_PUBLIC_). NUNCA coloque chaves secretas
 * aqui: tudo que começa com EXPO_PUBLIC_ vai embutido no bundle do aplicativo.
 */
function ler(nome: string, valor: string | undefined, padrao?: string): string {
  if (valor && valor.length > 0) return valor;
  if (padrao !== undefined) return padrao;
  console.warn(`[Ágora] variável ${nome} não definida — veja o README (seção Variáveis de ambiente).`);
  return '';
}

export const env = {
  /** Servidor embutido no build. Vazio = o app pede o endereço na primeira abertura (ver lib/servidor.ts). */
  supabaseUrl: ler('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL, ''),
  supabaseAnonKey: ler('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, ''),
  /** Client ID público da thirdweb (carteira embutida + paymaster) */
  thirdwebClientId: ler('EXPO_PUBLIC_THIRDWEB_CLIENT_ID', process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID, ''),
  /** base-sepolia | base | polygon-amoy | polygon */
  rede: ler('EXPO_PUBLIC_REDE', process.env.EXPO_PUBLIC_REDE, 'base-sepolia'),
  /** Página web opcional para exportar a chave da carteira embutida */
  urlExportarChave: ler('EXPO_PUBLIC_URL_EXPORTAR_CHAVE', process.env.EXPO_PUBLIC_URL_EXPORTAR_CHAVE, ''),
  /** Habilita o login por senha (contas de teste do seed) */
  loginPorSenha: ler('EXPO_PUBLIC_LOGIN_SENHA', process.env.EXPO_PUBLIC_LOGIN_SENHA, 'true') === 'true',
};

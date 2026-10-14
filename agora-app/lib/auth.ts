import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { mensagemDeErro } from './erros';

WebBrowser.maybeCompleteAuthSession();

/** URL de retorno do login (deep link agora://auth/callback; no web, a origem atual) */
export const urlRetorno = () => Linking.createURL('auth/callback');

export async function entrarComLinkMagico(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: urlRetorno() },
  });
  if (error) throw new Error(mensagemDeErro(error));
}

export async function entrarComSenha(email: string, senha: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
}

export async function entrarComGoogle() {
  const redirectTo = urlRetorno();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error(error ? mensagemDeErro(error) : 'Não foi possível abrir o Google.');
  const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (resultado.type === 'success') await concluirLoginPorUrl(resultado.url);
}

/** Troca o código PKCE (ou tokens) presentes na URL de retorno por uma sessão. */
export async function concluirLoginPorUrl(url: string) {
  const { queryParams } = Linking.parse(url);
  const fragmento = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
  const erroDescricao = (queryParams?.error_description as string) ?? fragmento?.get('error_description');
  if (erroDescricao) throw new Error(decodeURIComponent(erroDescricao));
  const codigo = queryParams?.code as string | undefined;
  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (error) throw new Error(mensagemDeErro(error));
    return;
  }
  const access = fragmento?.get('access_token');
  const refresh = fragmento?.get('refresh_token');
  if (access && refresh) {
    const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    if (error) throw new Error(mensagemDeErro(error));
  }
}

export async function sair() {
  await supabase.auth.signOut();
}

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';
import { ErroHttp, variavel } from './http.ts';

/** Cliente com service_role: ignora RLS. Use só depois de checar permissões. */
export function admin(): SupabaseClient {
  return createClient(variavel('SUPABASE_URL'), variavel('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente "como o usuário" (RLS vale) + o usuário autenticado. */
export async function usuario(req: Request): Promise<{ cliente: SupabaseClient; user: User }> {
  const auth = req.headers.get('Authorization');
  if (!auth) throw new ErroHttp(401, 'Não autenticado');
  const cliente = createClient(variavel('SUPABASE_URL'), variavel('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await cliente.auth.getUser();
  if (error || !data.user) throw new ErroHttp(401, 'Sessão inválida');
  return { cliente, user: data.user };
}

/** Garante que a chamada veio do agendador (service_role) e não de um app. */
export function exigirServico(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  if (auth !== `Bearer ${variavel('SUPABASE_SERVICE_ROLE_KEY')}`) throw new ErroHttp(403, 'Restrito ao agendador');
}

/** Membro com assinatura ativa (admins sempre) */
export async function exigirMembroAtivo(cliente: SupabaseClient) {
  const { data, error } = await cliente.rpc('pode_ler');
  if (error || data !== true) throw new ErroHttp(403, 'Disponível apenas para membros com assinatura ativa');
}

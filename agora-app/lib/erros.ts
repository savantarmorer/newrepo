import type { PostgrestError } from '@supabase/supabase-js';

/** Converte erros do Postgres/PostgREST em mensagens humanas em português. */
export function mensagemDeErro(erro: PostgrestError | Error | { message?: string; code?: string }): string {
  const codigo = 'code' in erro ? erro.code : undefined;
  const msg = erro.message ?? '';
  if (codigo === '42501' || /row-level security/i.test(msg)) {
    if (/row-level security/i.test(msg)) return 'Você não tem permissão para isso (ainda). Veja os níveis no seu perfil.';
    return msg || 'Você não tem permissão para isso.';
  }
  if (codigo === '23505') return 'Esse registro já existe.';
  if (codigo === '23514') {
    if (/bloqueio_justificado/.test(msg)) return 'O bloqueio exige uma justificativa de pelo menos 200 caracteres.';
    return 'Algum campo está fora do formato esperado.';
  }
  if (codigo === 'P0429') return msg;
  if (codigo === 'PGRST116') return 'Não encontramos o que você procurou.';
  if (/Failed to fetch|Network request failed/i.test(msg)) return 'Sem conexão. Tente novamente quando estiver on-line.';
  if (/JWT expired/i.test(msg)) return 'Sua sessão expirou. Entre novamente.';
  return msg || 'Algo deu errado. Tente de novo.';
}

export function textoDoErro(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Algo deu errado. Tente de novo.';
}

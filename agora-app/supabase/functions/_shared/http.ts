// Utilitários HTTP comuns das Edge Functions da Ágora.
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-assinatura-webhook',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

export function erro(mensagem: string, status = 400): Response {
  return json({ erro: mensagem }, status);
}

export class ErroHttp extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

/** Envolve o handler: CORS, JSON e erros padronizados. */
export function servir(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof ErroHttp) return erro(e.message, e.status);
      console.error(e);
      return erro(e instanceof Error ? e.message : 'Erro interno', 500);
    }
  });
}

export function variavel(nome: string, obrigatoria = true): string {
  const v = Deno.env.get(nome) ?? '';
  if (!v && obrigatoria) throw new ErroHttp(500, `Variável de ambiente ${nome} não configurada`);
  return v;
}

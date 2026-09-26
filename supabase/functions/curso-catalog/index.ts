import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import catalog from './aulas.json' with { type: 'json' };

const resources = {
  planilha: {
    file: 'planilha-de-cruzamento.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  bonus: { file: 'materiais-bonus.pdf', type: 'application/pdf' },
  documento: { file: 'documento-completo-curso.md', type: 'text/markdown; charset=utf-8' }
} as const;

const allowedOrigins = new Set([
  'https://iuripiragibe.net',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

function cors(origin: string | null): HeadersInit {
  const allowed = origin && allowedOrigins.has(origin) ? origin : 'https://iuripiragibe.net';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'private, no-store',
    'Vary': 'Origin, Authorization'
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = cors(origin);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405, headers });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'authentication_required' }, { status: 401, headers });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: 'service_misconfigured' }, { status: 503, headers });
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const [{ data: userData, error: userError }, { data: allowed, error: accessError }] =
    await Promise.all([
      client.auth.getUser(authorization.slice(7)),
      client.rpc('curso_jip_pode_ler_catalogo')
    ]);

  if (userError || !userData.user) {
    return Response.json({ error: 'invalid_session' }, { status: 401, headers });
  }
  if (accessError || allowed !== true) {
    return Response.json({ error: 'course_access_required' }, { status: 403, headers });
  }

  const resourceKey = new URL(request.url).searchParams.get('resource') as keyof typeof resources | null;
  if (resourceKey) {
    const resource = resources[resourceKey];
    if (!resource) return Response.json({ error: 'resource_not_found' }, { status: 404, headers });
    const bytes = await Deno.readFile(new URL(`./resources/${resource.file}`, import.meta.url));
    return new Response(bytes, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': resource.type,
        'Content-Disposition': `attachment; filename="${resource.file}"`,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  return Response.json(catalog, { status: 200, headers });
});

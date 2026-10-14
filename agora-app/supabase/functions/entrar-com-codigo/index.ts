// Entrar no app com um código gerado pelo bot do Discord (/agora app ou /menu › Entrar no app).
// Recebe { codigo }, consome o código (uso único, 15 min) e devolve um token de login de uso
// único para a conta dona do código; o app troca esse token por uma sessão com verifyOtp.
// Chamado sem sessão (a pessoa ainda não entrou), por isso verify_jwt = false no config.toml.
import { admin } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';

const INVALIDO = 'Código inválido ou vencido. Gere outro no Discord com /agora app (vale 15 minutos e só uma vez).';

async function sha256(texto: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

servir(async (req) => {
  if (req.method !== 'POST') throw new ErroHttp(405, 'Use POST');
  const { codigo } = await req.json().catch(() => ({}));
  // Aceita "abcd-efgh", "ABCD EFGH" etc.
  const normalizado = String(codigo ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalizado.length !== 8) throw new ErroHttp(400, INVALIDO);

  const db = admin();
  const { data: perfilId, error } = await db.rpc('usar_codigo_login', { p_hash: await sha256(normalizado) });
  if (error) throw new ErroHttp(500, error.message);
  if (!perfilId) {
    // Atraso fixo: torna tentativas em massa inúteis (o espaço de códigos já é de ~10¹²)
    await new Promise((r) => setTimeout(r, 800));
    throw new ErroHttp(400, INVALIDO);
  }

  const { data: usuario, error: erroUsuario } = await db.auth.admin.getUserById(perfilId as string);
  if (erroUsuario || !usuario.user?.email) throw new ErroHttp(500, 'Conta sem login disponível. Fale com a administração.');
  const { data: link, error: erroLink } = await db.auth.admin.generateLink({ type: 'magiclink', email: usuario.user.email });
  if (erroLink || !link.properties?.hashed_token) throw new ErroHttp(500, erroLink?.message ?? 'Não foi possível abrir a sessão.');
  return json({ token_hash: link.properties.hashed_token });
});

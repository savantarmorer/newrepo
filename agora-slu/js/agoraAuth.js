// Helpers client-side de autenticação e gamificação — Ágora (SLU)
// Reaproveita o mesmo projeto Supabase do AMOQ (mesma SUPABASE_URL/ANON_KEY).
// Requer <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// carregado ANTES deste arquivo.

const SUPABASE_URL = 'https://fveslvzjjixzpwiqcydz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tUHMDyn291B9RBJ10tlXJQ_aPJkHKxX';

// Endereço da API Node responsável pela sincronização com o bot do Discord.
// Definido em config.js (carregado antes deste arquivo em toda página) — ver SETUP_INTEGRACOES.md.
export const AGORA_API_URL = window.AGORA_API_URL || 'http://localhost:4000';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Graus da Ágora (Manifesto do Avatar — Seção 3)
export const GRAUS = [
  { grau: 0, nome: 'Neófito',        xpMin: 0,    canal: '#portal-de-entrada' },
  { grau: 1, nome: 'Adepto',         xpMin: 100,  canal: '#hall-dos-iniciados' },
  { grau: 2, nome: 'Mestre da Obra', xpMin: 500,  canal: '#hall-das-lendas' },
  { grau: 3, nome: 'Conselheiro',    xpMin: 2000, canal: '#conselho-supremo' },
];

export function calcularGrau(xp) {
  let atual = GRAUS[0];
  for (const g of GRAUS) if (xp >= g.xpMin) atual = g;
  return atual;
}

export function proximoGrau(xp) {
  return GRAUS.find(g => g.xpMin > xp) || null;
}

// ── Sessão ────────────────────────────────────────────────────────────
export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// Protege uma página: redireciona para login.html se não houver sessão.
// Uso: const session = await requireAuth();
export async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession();
  if (!session) {
    window.location.href = `${redirectTo}?next=${encodeURIComponent(location.pathname)}`;
    return null;
  }
  return session;
}

// ── Login OAuth ──────────────────────────────────────────────────────
export async function signInWithDiscord() {
  return sb.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: new URL('dashboard.html', location.href).toString() },
  });
}

export async function signInWithGoogle() {
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('dashboard.html', location.href).toString() },
  });
}

export async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ── Perfil ───────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await sb.from('agora_profiles').select('*').eq('id', userId).single();
  if (error) { console.warn('agora_profiles:', error.message); return null; }
  return data;
}

export async function getDiscordSync(userId) {
  const { data } = await sb.from('agora_discord_sync').select('*').eq('user_id', userId).maybeSingle();
  return data || null;
}

// Registra o login do dia e atualiza a streak (RPC definida na migração SQL)
export async function registrarLoginDiario(userId) {
  const { data, error } = await sb.rpc('registrar_login_agora', { uid: userId });
  if (error) { console.warn('registrar_login_agora:', error.message); return null; }
  return data;
}

// Dispara a sincronização de cargos/atividade do Discord via API server-side
// (o token do bot nunca fica exposto no navegador).
export async function sincronizarDiscord() {
  const session = await getSession();
  if (!session) throw new Error('Sessão expirada.');
  const res = await fetch(`${AGORA_API_URL}/api/discord/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Falha na sincronização (HTTP ${res.status})`);
  }
  return res.json();
}

// ── Terminal ARG ─────────────────────────────────────────────────────
export async function obterProgressoARG() {
  const { data, error } = await sb.rpc('obter_progresso_arg');
  if (error) { console.warn('obter_progresso_arg:', error.message); return []; }
  return data || [];
}

export async function resolverPuzzleARG(userId, puzzleId, resposta) {
  const { data, error } = await sb.rpc('resolver_puzzle_arg', { uid: userId, p_puzzle_id: puzzleId, p_resposta: resposta });
  if (error) throw new Error(error.message);
  return data;
}

// ── Governança ───────────────────────────────────────────────────────
export async function votarDecreto(userId, decreeId, escolha) {
  const { data, error } = await sb.rpc('votar_decreto', { uid: userId, p_decree_id: decreeId, p_escolha: escolha });
  if (error) throw new Error(error.message);
  return data;
}

export async function obterTallyDecreto(decreeId) {
  const { data, error } = await sb.rpc('obter_tally_decreto', { p_decree_id: decreeId });
  if (error) { console.warn('obter_tally_decreto:', error.message); return []; }
  return data || [];
}

// ── Missões ──────────────────────────────────────────────────────────
export async function concluirMissao(userId, missionId) {
  const { data, error } = await sb.rpc('concluir_missao', { uid: userId, p_mission_id: missionId });
  if (error) throw new Error(error.message);
  return data;
}

// ── Prévia real do Discord (canais e mensagens) ─────────────────────
export async function fetchDiscordChannels() {
  const res = await fetch(`${AGORA_API_URL}/api/discord/channels`);
  if (!res.ok) throw new Error(`Falha ao carregar canais do Discord (HTTP ${res.status})`);
  return res.json();
}

export async function fetchDiscordMessages() {
  const res = await fetch(`${AGORA_API_URL}/api/discord/messages`);
  if (!res.ok) throw new Error(`Falha ao carregar mensagens do Discord (HTTP ${res.status})`);
  return res.json();
}

// ── Nav dinâmica ─────────────────────────────────────────────────────
// Preenche o slot de login/perfil na barra de navegação (elemento com id="navAuthSlot").
export async function montarNavAuth() {
  const slot = document.getElementById('navAuthSlot');
  if (!slot) return;
  const session = await getSession();
  if (!session) {
    slot.innerHTML = `<a href="login.html" class="btn btn-primary" style="font-size:var(--text-xs); padding:var(--space-2) var(--space-4);">Entrar</a>`;
    return;
  }
  const profile = await getProfile(session.user.id);
  const grau = calcularGrau(profile?.xp || 0);
  slot.innerHTML = `<a href="dashboard.html" class="btn btn-secondary" style="font-size:var(--text-xs); padding:var(--space-2) var(--space-4);">${grau.nome} · ${profile?.xp ?? 0} XP</a>`;
}

// Helpers client-side de autenticação e gamificação — Ágora (SLU)
// Reaproveita o mesmo projeto Supabase do AMOQ (mesma SUPABASE_URL/ANON_KEY).
// Requer <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// carregado ANTES deste arquivo.

const SUPABASE_URL = 'https://fveslvzjjixzpwiqcydz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tUHMDyn291B9RBJ10tlXJQ_aPJkHKxX';

// Endereço da API responsável pela sincronização com o bot do Discord.
// Em produção (Netlify), a API roda no MESMO domínio — deixe AGORA_API_URL
// em branco em config.js. Para testar com server/server.js localmente,
// defina AGORA_API_URL = 'http://localhost:4000' em config.js.
export const AGORA_API_URL = window.AGORA_API_URL || '';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Registra no feed global de atividade toda vez que um login de verdade
// acontece. SIGNED_IN só dispara numa autenticação nova de fato (retorno
// do OAuth, signInWithPassword) — nunca em INITIAL_SESSION, que é o que
// dispara ao só navegar entre páginas com uma sessão já existente. Isso
// evita lotar o feed com uma entrada por page view.
sb.auth.onAuthStateChange((event, session) => {
  if (event !== 'SIGNED_IN' || !session) return;
  const provider = session.user.app_metadata?.provider || 'email';
  sb.rpc('registrar_atividade_login', { uid: session.user.id, p_provider: provider })
    .then(({ error }) => { if (error) console.warn('registrar_atividade_login:', error.message); });
});

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

// O Supabase devolve falhas de OAuth (provedor não habilitado, e-mail já
// registrado com outro provedor, acesso negado no Discord, etc.) como
// ?error=...&error_description=... — às vezes na querystring (fluxo PKCE),
// às vezes no hash (fluxo implícito). Como o redirectTo do login aponta
// direto para dashboard.html (não para login.html), esse erro chega em
// QUALQUER página protegida, não só na tela de login.
export function lerErroOAuthDaURL() {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(location.search);
  const bruto = hashParams.get('error_description') || searchParams.get('error_description')
    || hashParams.get('error') || searchParams.get('error');
  return bruto ? decodeURIComponent(bruto.replace(/\+/g, ' ')) : null;
}

// Se a URL trouxe um retorno de OAuth (?code=... da PKCE, ou #access_token=...
// do fluxo implícito), o supabase-js processa isso de forma assíncrona ao
// inicializar. Chamar getSession() logo de cara pode vencer essa corrida e
// retornar null mesmo com o login tendo funcionado. Esta função espera o
// evento SIGNED_IN (até 4s) quando detecta que há um retorno pendente na URL.
async function aguardarSessaoDoRetornoOAuth() {
  const temRetornoPendente = location.search.includes('code=') || location.hash.includes('access_token');
  if (!temRetornoPendente) return null;

  return new Promise(resolve => {
    let resolvido = false;
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session && !resolvido) {
        resolvido = true;
        sub.subscription.unsubscribe();
        resolve(session);
      }
    });
    setTimeout(() => {
      if (!resolvido) { resolvido = true; sub.subscription.unsubscribe(); resolve(null); }
    }, 4000);
  });
}

// Protege uma página: redireciona para login.html se não houver sessão.
// Uso: const session = await requireAuth();
export async function requireAuth(redirectTo = 'login.html') {
  const erroOAuth = lerErroOAuthDaURL();
  if (erroOAuth) {
    window.location.href = `${redirectTo}?next=${encodeURIComponent(location.pathname)}&erro=${encodeURIComponent(erroOAuth)}`;
    return null;
  }

  const tinhaRetornoPendente = location.search.includes('code=') || location.hash.includes('access_token');
  let session = await getSession();
  if (!session) session = await aguardarSessaoDoRetornoOAuth();
  if (!session) {
    const motivo = tinhaRetornoPendente ? '&motivo=timeout_oauth' : '';
    window.location.href = `${redirectTo}?next=${encodeURIComponent(location.pathname)}${motivo}`;
    return null;
  }
  return session;
}

// ── Login OAuth ──────────────────────────────────────────────────────
export async function signInWithDiscord() {
  return sb.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: new URL('perfil.html', location.href).toString() },
  });
}

export async function signInWithGoogle() {
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('perfil.html', location.href).toString() },
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
  const res = await fetch(`${AGORA_API_URL}/api/agora/discord/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Falha na sincronização (HTTP ${res.status})`);
  }
  return res.json();
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

// Admin: abre um novo decreto/votação. horasDuracao define quando fecha_em vence.
export async function criarDecreto(userId, { titulo, descricao, quorumMin, horasDuracao }) {
  const { data, error } = await sb.rpc('criar_decreto', {
    uid: userId, p_titulo: titulo, p_descricao: descricao, p_quorum_min: quorumMin, p_horas_duracao: horasDuracao,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Admin: encerra um decreto manualmente definindo o status final.
export async function definirStatusDecreto(userId, decreeId, status) {
  const { data, error } = await sb.rpc('definir_status_decreto', { uid: userId, p_decree_id: decreeId, p_status: status });
  if (error) throw new Error(error.message);
  return data;
}

// ── Investigações (arquivos/documentos analisados coletivamente) ──────
export async function listarInvestigacoes() {
  const { data, error } = await sb.from('agora_investigacoes').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Qualquer iniciado autenticado pode adicionar um novo arquivo/documento à investigação.
export async function adicionarInvestigacao(userId, { codigo, titulo, descricao, encontradoEm, categoria, seloRef }) {
  const { data, error } = await sb.from('agora_investigacoes').insert({
    codigo, titulo, descricao, encontrado_em: encontradoEm, categoria: categoria || 'geral',
    selo_ref: seloRef || 'seal-umbra-kael', criado_por: userId,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listarNotasInvestigacao(investigacaoId) {
  const { data, error } = await sb.from('agora_investigacao_notas').select('*')
    .eq('investigacao_id', investigacaoId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function registrarNotaInvestigacao(userId, investigacaoId, autorNome, nota) {
  const { error } = await sb.from('agora_investigacao_notas').insert({
    investigacao_id: investigacaoId, user_id: userId, autor_nome: autorNome, nota,
  });
  if (error) throw new Error(error.message);
}

// Admin: muda o status de uma investigação (em_analise/decifrado/confirmado)
export async function atualizarStatusInvestigacao(userId, investigacaoId, status) {
  const { data, error } = await sb.rpc('atualizar_status_investigacao', {
    uid: userId, p_investigacao_id: investigacaoId, p_status: status,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Métrica de atividade coletiva para a landing page (notas + fichas Pró-Vida)
export async function contarAtividadeInvestigativa() {
  const [notas, fichas] = await Promise.all([
    sb.from('agora_investigacao_notas').select('id', { count: 'exact', head: true }),
    sb.from('agora_provida_fichas').select('id', { count: 'exact', head: true }),
  ]);
  return (notas.count || 0) + (fichas.count || 0);
}

// ── Ficha de Análise — Material Pró-Vida ──────────────────────────────
export async function enviarFichaProvida(userId, ficha) {
  const { data, error } = await sb.rpc('enviar_ficha_provida', { uid: userId, p_ficha: ficha });
  if (error) throw new Error(error.message);
  return data;
}

export async function listarFichasProvida() {
  const { data, error } = await sb.from('agora_provida_fichas').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ── Atividade coletiva (ledger de XP) ──────────────────────────────────
// antesDe: paginação por cursor (timestamp da última linha já carregada).
// fonteTipo: filtro opcional (login | missao | tarefa | investigacao_nota |
// ficha_provida | evento_rsvp | chamada_rsvp | codex_nota | voto_decreto).
export async function obterAtividadeRecente(limite = 20, antesDe = null, fonteTipo = null) {
  const { data, error } = await sb.rpc('obter_atividade_recente', {
    p_limite: limite, p_antes_de: antesDe, p_fonte_tipo: fonteTipo,
  });
  if (error) { console.warn('obter_atividade_recente:', error.message); return []; }
  return data || [];
}

// ── Mensagens de erro amigáveis ────────────────────────────────────────
// Traduz erros técnicos (Postgres/Supabase) para algo que um humano
// não-técnico entende. O erro original sempre fica no console para debug.
const MENSAGENS_ERRO_CONHECIDAS = [
  [/JWT|token/i, 'Sua sessão expirou. Atualize a página e entre de novo.'],
  [/duplicate key|unique constraint/i, 'Isso já foi registrado antes — não dá pra duplicar.'],
  [/violates foreign key/i, 'Esse item não existe mais (pode ter sido removido por um administrador).'],
  [/permission denied|row-level security/i, 'Você não tem permissão para fazer isso.'],
  [/Failed to fetch|NetworkError|network/i, 'Sem conexão com o servidor. Confira sua internet e tente de novo.'],
];
export function mensagemAmigavel(error, contexto = 'ação') {
  const bruta = error?.message || String(error || '');
  console.error(`[agora] erro em "${contexto}":`, error);
  for (const [padrao, amigavel] of MENSAGENS_ERRO_CONHECIDAS) {
    if (padrao.test(bruta)) return amigavel;
  }
  return `Não foi possível concluir esta ${contexto} agora. Tente de novo em instantes.`;
}

// ── Notificações ─────────────────────────────────────────────────────
// Sem estado de "lido" no servidor: o cliente guarda em localStorage o
// timestamp da última vez que abriu o sino, por usuário.
const NOTIF_LASTSEEN_KEY = uid => `agora_notif_lastseen_${uid}`;

export async function obterNotificacoes(userId, limite = 15) {
  const { data, error } = await sb.from('agora_notificacoes').select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false }).limit(limite);
  if (error) { console.warn('agora_notificacoes:', error.message); return []; }
  return data || [];
}

export function obterUltimaVisualizacaoNotificacoes(userId) {
  return localStorage.getItem(NOTIF_LASTSEEN_KEY(userId));
}

export function marcarNotificacoesVistas(userId) {
  localStorage.setItem(NOTIF_LASTSEEN_KEY(userId), new Date().toISOString());
}

// ── Novo Æon ─────────────────────────────────────────────────────────
export async function enviarPedidoAeon(userId, { nome, email, telefone, expressao }) {
  const { error } = await sb.from('agora_aeon_applications').insert({
    user_id: userId, nome, email, telefone, expressao: expressao || null,
  });
  if (error) throw new Error(error.message);
}

export async function obterMeuPedidoAeon(userId) {
  const { data } = await sb.from('agora_aeon_applications').select('*').eq('user_id', userId).maybeSingle();
  return data || null;
}

// ── Missões ──────────────────────────────────────────────────────────
export async function concluirMissao(userId, missionId) {
  const { data, error } = await sb.rpc('concluir_missao', { uid: userId, p_mission_id: missionId });
  if (error) throw new Error(error.message);
  return data;
}

// ── Quadro de Tarefas dos Voluntários ────────────────────────────────
export async function reivindicarTarefa(userId, taskId) {
  const { data, error } = await sb.rpc('reivindicar_tarefa', { uid: userId, p_task_id: taskId });
  if (error) throw new Error(error.message);
  return data;
}

export async function concluirTarefa(userId, taskId) {
  const { data, error } = await sb.rpc('concluir_tarefa', { uid: userId, p_task_id: taskId });
  if (error) throw new Error(error.message);
  return data;
}

export async function liberarTarefa(userId, taskId) {
  const { data, error } = await sb.rpc('liberar_tarefa', { uid: userId, p_task_id: taskId });
  if (error) throw new Error(error.message);
  return data;
}

// ── Prévia real do Discord (canais e mensagens) ─────────────────────
export async function fetchDiscordChannels() {
  const res = await fetch(`${AGORA_API_URL}/api/agora/discord/channels`);
  if (!res.ok) throw new Error(`Falha ao carregar canais do Discord (HTTP ${res.status})`);
  return res.json();
}

export async function fetchDiscordMessages() {
  const res = await fetch(`${AGORA_API_URL}/api/agora/discord/messages`);
  if (!res.ok) throw new Error(`Falha ao carregar mensagens do Discord (HTTP ${res.status})`);
  return res.json();
}

// ── Nav dinâmica ─────────────────────────────────────────────────────
// Preenche o slot de login/perfil na barra de navegação (elemento com id="navAuthSlot")
// com um menu de perfil (Meu Painel / Sair), acessível em qualquer página.
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
  const nomeExibicao = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email;

  const notificacoes = await obterNotificacoes(session.user.id);
  const ultimaVista = obterUltimaVisualizacaoNotificacoes(session.user.id);
  const naoLidas = ultimaVista ? notificacoes.filter(n => n.created_at > ultimaVista).length : notificacoes.length;

  slot.innerHTML = `
    <div class="nav-auth-row">
      <div class="nav-profile">
        <button class="nav-bell-btn" id="navBellBtn" type="button" title="Notificações">
          🔔${naoLidas > 0 ? `<span class="nav-bell-badge">${naoLidas > 9 ? '9+' : naoLidas}</span>` : ''}
        </button>
        <div class="nav-bell-menu" id="navBellMenu">
          ${notificacoes.length ? notificacoes.map(n => `
            <a class="notif-item" href="${n.link || '#'}">
              ${n.mensagem}
              <span class="quando">${new Date(n.created_at).toLocaleString('pt-BR')}</span>
            </a>
          `).join('') : '<div class="notif-empty">Nenhuma notificação ainda.</div>'}
        </div>
      </div>
      <div class="nav-profile">
        <button class="nav-profile-btn" id="navProfileBtn" type="button">
          ${grau.nome} · ${profile?.xp ?? 0} XP <span class="caret">▾</span>
        </button>
        <div class="nav-profile-menu" id="navProfileMenu">
          <div style="padding: var(--space-3) var(--space-4); color: var(--color-text-muted); font-size: var(--text-xs);">
            Conectado como<br><strong style="color:#fff;">${nomeExibicao}</strong>
          </div>
          <hr class="divider">
          <a href="perfil.html">Meu Perfil</a>
          <a href="dashboard.html">Meu Painel</a>
          <a href="dashboard.html#hall">Hall das Lendas</a>
          ${profile?.is_admin ? '<a href="admin.html">Painel Admin</a>' : ''}
          <hr class="divider">
          <button class="sair" id="navSignOutBtn" type="button">Sair do Círculo</button>
        </div>
      </div>
    </div>`;

  const bellBtn = document.getElementById('navBellBtn');
  const bellMenu = document.getElementById('navBellMenu');
  bellBtn.addEventListener('click', e => {
    e.stopPropagation();
    bellMenu.classList.toggle('open');
    if (bellMenu.classList.contains('open')) {
      marcarNotificacoesVistas(session.user.id);
      bellBtn.querySelector('.nav-bell-badge')?.remove();
    }
  });

  const btn = document.getElementById('navProfileBtn');
  const menu = document.getElementById('navProfileMenu');
  btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', () => { menu.classList.remove('open'); bellMenu.classList.remove('open'); });
  document.getElementById('navSignOutBtn').addEventListener('click', signOut);
}

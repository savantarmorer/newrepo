// Helpers compartilhados pelas Netlify Functions da Ágora (agora-discord-*).
// Mesmo domínio do site (iuripiragibe.net) — sem CORS, sem host separado.

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_ROLE_GRAU_MAP,
  DISCORD_PREVIEW_CHANNEL_ID,
  DISCORD_ANNOUNCE_CHANNEL_ID,
  DISCORD_GRAU_ROLE_IDS,
  DISCORD_PUBLIC_KEY,
} = process.env;

export const ENV = { SUPABASE_URL, SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_PREVIEW_CHANNEL_ID, DISCORD_ANNOUNCE_CHANNEL_ID, DISCORD_PUBLIC_KEY };

// Mapeamento grau (0-3) -> ID do cargo real do Discord, para a escrita
// bidirecional (site ganha XP -> Discord recebe o cargo).
export const GRAU_ROLE_IDS = (() => {
  try { return JSON.parse(DISCORD_GRAU_ROLE_IDS || '{}'); }
  catch { return {}; }
})();

export const ROLE_GRAU_MAP = (() => {
  try { return JSON.parse(DISCORD_ROLE_GRAU_MAP || '{}'); }
  catch { return { 'Conselheiro': 3, 'Mestre da Obra': 2, 'Adepto': 1, 'Neófito': 0 }; }
})();

export async function supaFetch(path, opts = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

export async function getSupabaseUser(accessToken) {
  const res = await supaFetch('/auth/v1/user', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return res.json();
}

const DISCORD_API = 'https://discord.com/api/v10';
const VIEW_CHANNEL_BIT = 1024n; // 0x400

function botHeaders() {
  return { Authorization: `Bot ${DISCORD_BOT_TOKEN}` };
}

export async function discordGet(path) {
  const res = await fetch(`${DISCORD_API}${path}`, { headers: botHeaders() });
  if (!res.ok) throw new Error(`Discord API ${path} → HTTP ${res.status}`);
  return res.json();
}

export async function getGuildMember(discordId) {
  const res = await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordId}`, { headers: botHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao consultar membro no Discord (HTTP ${res.status})`);
  return res.json();
}

export function isChannelPublic(channel) {
  const overwrite = (channel.permission_overwrites || []).find(o => o.id === DISCORD_GUILD_ID && o.type === 0);
  if (!overwrite) return true;
  const deny = BigInt(overwrite.deny || '0');
  return (deny & VIEW_CHANNEL_BIT) === 0n;
}

export function calcularGrauPorCargos(roleNames) {
  let maior = 0;
  for (const nome of roleNames) {
    const g = ROLE_GRAU_MAP[nome];
    if (typeof g === 'number' && g > maior) maior = g;
  }
  return maior;
}

// Anúncio cerimonial no Discord (site → Discord). Silencioso se
// DISCORD_ANNOUNCE_CHANNEL_ID não estiver configurado ou se falhar —
// nunca deve quebrar o fluxo principal que a chamou.
export async function postAnnouncement(content) {
  if (!DISCORD_ANNOUNCE_CHANNEL_ID || !DISCORD_BOT_TOKEN) return;
  try {
    await fetch(`${DISCORD_API}/channels/${DISCORD_ANNOUNCE_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error('[agora] postAnnouncement falhou:', err.message);
  }
}

// Atribui (e remove os graus anteriores) o cargo real do Discord
// correspondente a um grau — usado quando o XP sobe pelo SITE e precisa
// refletir no Discord (direção inversa da sincronização normal).
export async function syncGrauRole(discordId, novoGrau) {
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) return;
  const alvoRoleId = GRAU_ROLE_IDS[String(novoGrau)];
  if (!alvoRoleId) return; // grau sem cargo mapeado — nada a fazer

  try {
    // Remove cargos de graus diferentes que o membro tenha (evita acumular Neófito + Conselheiro etc.)
    const outrosRoleIds = Object.entries(GRAU_ROLE_IDS)
      .filter(([g]) => g !== String(novoGrau))
      .map(([, id]) => id);

    await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${alvoRoleId}`, {
      method: 'PUT',
      headers: botHeaders(),
    });

    for (const roleId of outrosRoleIds) {
      await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: botHeaders(),
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[agora] syncGrauRole falhou:', err.message);
  }
}

// Chama a RPC resolver_puzzle_arg via service role — usada pelo comando
// /enigma do Discord, onde já validamos a identidade via discord_id vinculado
// (não há um JWT de usuário disponível numa interação de bot).
export async function resolverPuzzleServerSide(userId, puzzleId, resposta) {
  const res = await supaFetch('/rest/v1/rpc/resolver_puzzle_arg', {
    method: 'POST',
    body: JSON.stringify({ uid: userId, p_puzzle_id: puzzleId, p_resposta: resposta }),
  });
  return res.json();
}

export function checkEnv(required) {
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Variáveis de ambiente ausentes no Netlify: ${missing.join(', ')}`);
}

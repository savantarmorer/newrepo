// API mínima da Ágora — sincroniza dados do servidor Discord com o Supabase.
// O token do bot e a service key ficam SOMENTE aqui (nunca no navegador).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_ROLE_GRAU_MAP,
  PORT = 4000,
  ALLOWED_ORIGIN = '*',
} = process.env;

for (const [key, val] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID })) {
  if (!val) console.warn(`[agora-api] AVISO: variável de ambiente ${key} não configurada — ver server/.env.example`);
}

const ROLE_GRAU_MAP = (() => {
  try { return JSON.parse(DISCORD_ROLE_GRAU_MAP || '{}'); }
  catch { return { 'Conselheiro': 3, 'Mestre da Obra': 2, 'Adepto': 1, 'Neófito': 0 }; }
})();

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));

// ── Supabase REST helpers (service role — ignora RLS) ──────────────────
async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function getSupabaseUser(accessToken) {
  const res = await supaFetch('/auth/v1/user', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return res.json();
}

// ── Discord REST helpers (bot token — nunca exposto ao cliente) ───────
const DISCORD_API = 'https://discord.com/api/v10';
let cachedRoles = null;
let cachedRolesAt = 0;

async function getGuildRoles() {
  if (cachedRoles && Date.now() - cachedRolesAt < 5 * 60 * 1000) return cachedRoles;
  const res = await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/roles`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Falha ao ler cargos do servidor (HTTP ${res.status})`);
  cachedRoles = await res.json();
  cachedRolesAt = Date.now();
  return cachedRoles;
}

async function getGuildMember(discordId) {
  const res = await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordId}`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });
  if (res.status === 404) return null; // usuário logado mas não está (mais) no servidor
  if (!res.ok) throw new Error(`Falha ao consultar membro no Discord (HTTP ${res.status})`);
  return res.json();
}

function calcularGrauPorCargos(roleNames) {
  let maior = 0;
  for (const nome of roleNames) {
    const g = ROLE_GRAU_MAP[nome];
    if (typeof g === 'number' && g > maior) maior = g;
  }
  return maior;
}

// ── Rota principal ──────────────────────────────────────────────────
app.post('/api/discord/sync', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Token de sessão ausente.' });

    const user = await getSupabaseUser(accessToken);
    if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });

    const discordIdentity = (user.identities || []).find(i => i.provider === 'discord');
    if (!discordIdentity) {
      return res.status(400).json({ error: 'Esta conta ainda não está vinculada ao Discord. Entre novamente escolhendo "Entrar com Discord".' });
    }
    const discordId = discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub;

    const [member, roles] = await Promise.all([getGuildMember(discordId), getGuildRoles()]);
    if (!member) {
      return res.status(404).json({ error: 'Você não foi encontrado no servidor da Ágora. Entre no Discord oficial primeiro.' });
    }

    const roleNameById = Object.fromEntries(roles.map(r => [r.id, r.name]));
    const roleNames = (member.roles || []).map(id => roleNameById[id]).filter(Boolean);

    const discordAvatar = member.avatar
      ? `https://cdn.discordapp.com/guilds/${DISCORD_GUILD_ID}/users/${discordId}/avatars/${member.avatar}.png`
      : member.user?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png`
        : null;

    const syncRow = {
      user_id: user.id,
      discord_id: discordId,
      discord_username: member.user?.global_name || member.user?.username || null,
      discord_avatar: discordAvatar,
      roles: roleNames,
      nickname: member.nick || null,
      joined_guild_at: member.joined_at || null,
      synced_at: new Date().toISOString(),
    };

    await supaFetch('/rest/v1/agora_discord_sync?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(syncRow),
    });

    // Atualiza o grau do perfil se os cargos do Discord indicarem um grau maior
    const grauPorCargo = calcularGrauPorCargos(roleNames);
    const profileRes = await supaFetch(`/rest/v1/agora_profiles?id=eq.${user.id}&select=grau`);
    const [profileAtual] = await profileRes.json();
    let profile = profileAtual;
    if (profileAtual && grauPorCargo > (profileAtual.grau || 0)) {
      const patchRes = await supaFetch(`/rest/v1/agora_profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ grau: grauPorCargo }),
      });
      [profile] = await patchRes.json();
    }

    res.json({ discord: syncRow, profile });
  } catch (err) {
    console.error('[agora-api] /api/discord/sync', err);
    res.status(500).json({ error: err.message || 'Erro interno na sincronização.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, guild: Boolean(DISCORD_GUILD_ID) }));

app.listen(PORT, () => {
  console.log(`[agora-api] rodando em http://localhost:${PORT}`);
});

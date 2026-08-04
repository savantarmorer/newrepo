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
  DISCORD_PREVIEW_CHANNEL_ID,
  DISCORD_ANNOUNCE_CHANNEL_ID,
  DISCORD_EVENTS_SYNC_MINUTES,
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
const VIEW_CHANNEL_BIT = 1024n; // 0x400

function botHeaders() {
  return { Authorization: `Bot ${DISCORD_BOT_TOKEN}` };
}

async function discordGet(path) {
  const res = await fetch(`${DISCORD_API}${path}`, { headers: botHeaders() });
  if (!res.ok) throw new Error(`Discord API ${path} → HTTP ${res.status}`);
  return res.json();
}

// Um canal é considerado público se o cargo @everyone (id === guild id) não
// tem VIEW_CHANNEL explicitamente negado nos permission_overwrites.
function isChannelPublic(channel) {
  const overwrite = (channel.permission_overwrites || []).find(o => o.id === DISCORD_GUILD_ID && o.type === 0);
  if (!overwrite) return true;
  const deny = BigInt(overwrite.deny || '0');
  return (deny & VIEW_CHANNEL_BIT) === 0n;
}

let cachedRoles = null, cachedRolesAt = 0;
async function getGuildRoles() {
  if (cachedRoles && Date.now() - cachedRolesAt < 5 * 60 * 1000) return cachedRoles;
  cachedRoles = await discordGet(`/guilds/${DISCORD_GUILD_ID}/roles`);
  cachedRolesAt = Date.now();
  return cachedRoles;
}

async function getGuildMember(discordId) {
  const res = await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordId}`, { headers: botHeaders() });
  if (res.status === 404) return null; // usuário logado mas não está (mais) no servidor
  if (!res.ok) throw new Error(`Falha ao consultar membro no Discord (HTTP ${res.status})`);
  return res.json();
}

let cachedChannels = null, cachedChannelsAt = 0;
async function getPublicChannelTree() {
  if (cachedChannels && Date.now() - cachedChannelsAt < 5 * 60 * 1000) return cachedChannels;

  const all = await discordGet(`/guilds/${DISCORD_GUILD_ID}/channels`);
  const CHANNEL_TYPE_LABEL = { 0: 'text', 2: 'voice', 5: 'announcement', 13: 'stage', 15: 'forum' };
  const visible = all.filter(c => CHANNEL_TYPE_LABEL[c.type] !== undefined && isChannelPublic(c));
  const categories = all.filter(c => c.type === 4 && isChannelPublic(c));

  const byCategory = new Map(categories.map(cat => [cat.id, { id: cat.id, name: cat.name, position: cat.position, channels: [] }]));
  const uncategorized = { id: null, name: null, position: -1, channels: [] };

  for (const ch of visible) {
    const entry = { id: ch.id, name: ch.name, type: CHANNEL_TYPE_LABEL[ch.type], position: ch.position };
    const bucket = ch.parent_id && byCategory.has(ch.parent_id) ? byCategory.get(ch.parent_id) : uncategorized;
    bucket.channels.push(entry);
  }

  const groups = [...byCategory.values(), ...(uncategorized.channels.length ? [uncategorized] : [])]
    .sort((a, b) => a.position - b.position);
  for (const g of groups) g.channels.sort((a, b) => a.position - b.position);

  cachedChannels = { guildId: DISCORD_GUILD_ID, groups };
  cachedChannelsAt = Date.now();
  return cachedChannels;
}

let cachedChannelName = null;
let cachedMessages = null, cachedMessagesAt = 0;
async function getPreviewMessages() {
  if (!DISCORD_PREVIEW_CHANNEL_ID) return { configured: false, messages: [] };
  if (cachedMessages && Date.now() - cachedMessagesAt < 20 * 1000) return cachedMessages;

  const [raw, channel] = await Promise.all([
    discordGet(`/channels/${DISCORD_PREVIEW_CHANNEL_ID}/messages?limit=15`),
    cachedChannelName ? Promise.resolve({ name: cachedChannelName }) : discordGet(`/channels/${DISCORD_PREVIEW_CHANNEL_ID}`),
  ]);
  cachedChannelName = channel.name;

  const messages = raw
    .filter(m => m.content || m.attachments?.length)
    .reverse()
    .map(m => ({
      id: m.id,
      author: m.member?.nick || m.author?.global_name || m.author?.username || 'Iniciado',
      bot: Boolean(m.author?.bot),
      avatar: m.author?.avatar ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png` : null,
      content: m.content,
      hasAttachment: Boolean(m.attachments?.length),
      timestamp: m.timestamp,
    }));

  cachedMessages = { configured: true, channelName: cachedChannelName, messages };
  cachedMessagesAt = Date.now();
  return cachedMessages;
}

const NOME_GRAU = ['Neófito', 'Adepto', 'Mestre da Obra', 'Conselheiro'];

// Anúncio cerimonial no Discord (site → Discord). Silencioso se
// DISCORD_ANNOUNCE_CHANNEL_ID não estiver configurado ou se falhar.
async function postAnnouncement(content) {
  if (!DISCORD_ANNOUNCE_CHANNEL_ID) return;
  try {
    await fetch(`${DISCORD_API}/channels/${DISCORD_ANNOUNCE_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: { ...botHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error('[agora-api] postAnnouncement falhou:', err.message);
  }
}

function calcularGrauPorCargos(roleNames) {
  let maior = 0;
  for (const nome of roleNames) {
    const g = ROLE_GRAU_MAP[nome];
    if (typeof g === 'number' && g > maior) maior = g;
  }
  return maior;
}

// ── Sincronização automática dos Scheduled Events do Discord ──────────
async function syncDiscordEvents() {
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) return;
  try {
    const events = await discordGet(`/guilds/${DISCORD_GUILD_ID}/scheduled-events`);
    for (const ev of events) {
      const row = {
        discord_event_id: ev.id,
        titulo: ev.name,
        descricao: ev.description || null,
        data_inicio: ev.scheduled_start_time,
        data_fim: ev.scheduled_end_time || null,
        local: ev.entity_metadata?.location || 'Discord da Ágora',
        status: ev.status === 1 ? 'agendado' : ev.status === 2 ? 'ativo' : ev.status === 3 ? 'concluido' : 'cancelado',
        synced_at: new Date().toISOString(),
      };
      await supaFetch('/rest/v1/agora_discord_events?on_conflict=discord_event_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(row),
      });
    }
    console.log(`[agora-api] Sincronização automática: ${events.length} evento(s) do Discord.`);
  } catch (err) {
    console.error('[agora-api] syncDiscordEvents falhou:', err.message);
  }
}

// ── Rotas ────────────────────────────────────────────────────────────
app.post('/api/agora/discord/sync', async (req, res) => {
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
      await postAnnouncement(`⚜️ **${syncRow.nickname || syncRow.discord_username || 'Um Iniciado'}** ascendeu ao grau de **${NOME_GRAU[grauPorCargo] || 'Iniciado'}** na Grande Obra.`);
    }

    res.json({ discord: syncRow, profile });
  } catch (err) {
    console.error('[agora-api] /api/discord/sync', err);
    res.status(500).json({ error: err.message || 'Erro interno na sincronização.' });
  }
});

// Lista pública de categorias/canais reais do servidor (não expõe canais privados)
app.get('/api/agora/discord/channels', async (_req, res) => {
  try {
    res.json(await getPublicChannelTree());
  } catch (err) {
    console.error('[agora-api] /api/discord/channels', err);
    res.status(500).json({ error: err.message || 'Falha ao ler canais do Discord.' });
  }
});

// Prévia (quase) ao vivo das últimas mensagens de um canal público configurado.
// Requer DISCORD_PREVIEW_CHANNEL_ID e a Message Content Intent ativada no bot.
app.get('/api/agora/discord/messages', async (_req, res) => {
  try {
    res.json(await getPreviewMessages());
  } catch (err) {
    console.error('[agora-api] /api/discord/messages', err);
    res.status(500).json({ error: err.message || 'Falha ao ler mensagens do Discord.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, guild: Boolean(DISCORD_GUILD_ID) }));

app.listen(PORT, () => {
  console.log(`[agora-api] rodando em http://localhost:${PORT}`);

  // Sincronização automática de eventos: roda ao subir e depois periodicamente.
  syncDiscordEvents();
  const minutes = Number(DISCORD_EVENTS_SYNC_MINUTES) || 10;
  setInterval(syncDiscordEvents, minutes * 60 * 1000);
});

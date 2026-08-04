import { json, discordGet, isChannelPublic, ENV, checkEnv } from './_agoraShared.js';

const CHANNEL_TYPE_LABEL = { 0: 'text', 2: 'voice', 5: 'announcement', 13: 'stage', 15: 'forum' };

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});

  try {
    checkEnv(['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID']);

    const all = await discordGet(`/guilds/${ENV.DISCORD_GUILD_ID}/channels`);
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

    return json(200, { guildId: ENV.DISCORD_GUILD_ID, groups });
  } catch (err) {
    console.error('[agora-discord-channels]', err);
    return json(500, { error: err.message || 'Falha ao ler canais do Discord.' });
  }
}

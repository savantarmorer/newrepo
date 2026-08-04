import { json, discordGet, ENV, checkEnv } from './_agoraShared.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});

  try {
    if (!ENV.DISCORD_PREVIEW_CHANNEL_ID) return json(200, { configured: false, messages: [] });
    checkEnv(['DISCORD_BOT_TOKEN']);

    const [raw, channel] = await Promise.all([
      discordGet(`/channels/${ENV.DISCORD_PREVIEW_CHANNEL_ID}/messages?limit=15`),
      discordGet(`/channels/${ENV.DISCORD_PREVIEW_CHANNEL_ID}`),
    ]);

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

    return json(200, { configured: true, channelName: channel.name, messages });
  } catch (err) {
    console.error('[agora-discord-messages]', err);
    return json(500, { error: err.message || 'Falha ao ler mensagens do Discord.' });
  }
}

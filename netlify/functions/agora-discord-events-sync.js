// Função agendada (ver netlify.toml) — roda sozinha a cada 10 minutos.
// Também pode ser chamada manualmente via GET para depuração.
import { json, supaFetch, discordGet, ENV, checkEnv } from './_agoraShared.js';

const STATUS_MAP = { 1: 'agendado', 2: 'ativo', 3: 'concluido', 4: 'cancelado' };

export async function handler(event) {
  try {
    checkEnv(['AGORA_SUPABASE_URL', 'AGORA_SUPABASE_SERVICE_KEY', 'DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID']);

    const events = await discordGet(`/guilds/${ENV.DISCORD_GUILD_ID}/scheduled-events`);
    for (const ev of events) {
      const row = {
        discord_event_id: ev.id,
        titulo: ev.name,
        descricao: ev.description || null,
        data_inicio: ev.scheduled_start_time,
        data_fim: ev.scheduled_end_time || null,
        local: ev.entity_metadata?.location || 'Discord da Ágora',
        status: STATUS_MAP[ev.status] || 'cancelado',
        synced_at: new Date().toISOString(),
      };
      await supaFetch('/rest/v1/agora_discord_events?on_conflict=discord_event_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(row),
      });
    }

    console.log(`[agora-discord-events-sync] ${events.length} evento(s) sincronizado(s).`);
    if (event?.httpMethod) return json(200, { ok: true, total: events.length });
  } catch (err) {
    console.error('[agora-discord-events-sync]', err);
    if (event?.httpMethod) return json(500, { error: err.message });
  }
}

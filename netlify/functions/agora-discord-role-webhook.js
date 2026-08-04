// Chamado pelo Supabase Database Webhook em UPDATE de agora_profiles.
// Fecha o ciclo site → Discord: quando o grau sobe por XP ganho no site
// (Terminal ARG, Missões, Tarefas), o cargo real do Discord é atualizado.
// Configuração do webhook: Supabase Dashboard → Database → Webhooks.
import { json, supaFetch, syncGrauRole } from './_agoraShared.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });

  try {
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;
    if (secret) {
      const auth = event.headers.authorization || event.headers.Authorization || '';
      if (auth !== `Bearer ${secret}`) return json(401, { error: 'Não autorizado.' });
    }

    const payload = JSON.parse(event.body || '{}');
    if (payload.table !== 'agora_profiles' || payload.type !== 'UPDATE') return json(200, { skipped: true });

    const { record, old_record: oldRecord } = payload;
    if (!record || record.grau === oldRecord?.grau) return json(200, { skipped: true });

    const syncRes = await supaFetch(`/rest/v1/agora_discord_sync?user_id=eq.${record.id}&select=discord_id`);
    const [sync] = await syncRes.json();
    if (!sync?.discord_id) return json(200, { skipped: true, reason: 'Usuário sem Discord vinculado.' });

    await syncGrauRole(sync.discord_id, record.grau);
    return json(200, { ok: true });
  } catch (err) {
    console.error('[agora-discord-role-webhook]', err);
    return json(500, { error: err.message });
  }
}

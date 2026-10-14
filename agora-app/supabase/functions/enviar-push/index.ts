// Envia por Expo Push as notificações ainda não enviadas. Chamado a cada minuto (pg_cron).
import { admin, exigirServico } from '../_shared/supabase.ts';
import { json, servir } from '../_shared/http.ts';

interface Pendente { id: string; profile_id: string; titulo: string; corpo: string | null; link: string | null }

servir(async (req) => {
  exigirServico(req);
  const db = admin();
  const { data: pendentes } = await db.from('notificacoes').select('id, profile_id, titulo, corpo, link')
    .is('push_enviado_em', null).order('created_at').limit(500);
  if (!pendentes?.length) return json({ enviados: 0 });

  const perfis = [...new Set(pendentes.map((p: Pendente) => p.profile_id))];
  const { data: dispositivos } = await db.from('dispositivos_push').select('token, profile_id').in('profile_id', perfis);
  const mensagens = (pendentes as Pendente[]).flatMap((n) =>
    (dispositivos ?? []).filter((d) => d.profile_id === n.profile_id).map((d) => ({
      to: d.token, title: n.titulo, body: n.corpo ?? undefined, data: { link: n.link }, sound: null, channelId: 'padrao',
    })),
  );

  let enviados = 0;
  const invalidos: string[] = [];
  for (let i = 0; i < mensagens.length; i += 100) {
    const lote = mensagens.slice(i, i + 100);
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(Deno.env.get('EXPO_ACCESS_TOKEN') ? { Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` } : {}) },
      body: JSON.stringify(lote),
    });
    const resp = (await r.json()) as { data?: { status: string; details?: { error?: string } }[] };
    resp.data?.forEach((t, j) => {
      if (t.status === 'ok') enviados++;
      else if (t.details?.error === 'DeviceNotRegistered') invalidos.push(lote[j]!.to);
    });
  }
  if (invalidos.length) await db.from('dispositivos_push').delete().in('token', invalidos);
  // Marca todas como processadas (inclusive de quem não tem aparelho registrado)
  await db.from('notificacoes').update({ push_enviado_em: new Date().toISOString() }).in('id', pendentes.map((p: Pendente) => p.id));
  return json({ processadas: pendentes.length, enviados, tokens_removidos: invalidos.length });
});

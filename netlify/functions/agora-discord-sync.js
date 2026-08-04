import { json, supaFetch, getSupabaseUser, discordGet, getGuildMember, calcularGrauPorCargos, postAnnouncement, syncGrauRole, ENV, checkEnv } from './_agoraShared.js';

const NOME_GRAU = ['Neófito', 'Adepto', 'Mestre da Obra', 'Conselheiro'];

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });

  try {
    checkEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID']);

    const auth = event.headers.authorization || event.headers.Authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!accessToken) return json(401, { error: 'Token de sessão ausente.' });

    const user = await getSupabaseUser(accessToken);
    if (!user) return json(401, { error: 'Sessão inválida ou expirada.' });

    const discordIdentity = (user.identities || []).find(i => i.provider === 'discord');
    if (!discordIdentity) {
      return json(400, { error: 'Esta conta ainda não está vinculada ao Discord. Entre novamente escolhendo "Entrar com Discord".' });
    }
    const discordId = discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub;

    const [member, roles] = await Promise.all([getGuildMember(discordId), discordGet(`/guilds/${ENV.DISCORD_GUILD_ID}/roles`)]);
    if (!member) {
      return json(404, { error: 'Você não foi encontrado no servidor da Ágora. Entre no Discord oficial primeiro.' });
    }

    const roleNameById = Object.fromEntries(roles.map(r => [r.id, r.name]));
    const roleNames = (member.roles || []).map(id => roleNameById[id]).filter(Boolean);

    const discordAvatar = member.avatar
      ? `https://cdn.discordapp.com/guilds/${ENV.DISCORD_GUILD_ID}/users/${discordId}/avatars/${member.avatar}.png`
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

      const nomeGrau = NOME_GRAU[grauPorCargo] || 'Iniciado';
      const nomeExibicao = syncRow.nickname || syncRow.discord_username || 'Um Iniciado';
      // Aguardado (não fire-and-forget): funções serverless podem ser
      // congeladas assim que a resposta é enviada, cortando chamadas pendentes.
      await Promise.all([
        postAnnouncement(`⚜️ **${nomeExibicao}** ascendeu ao grau de **${nomeGrau}** na Grande Obra.`),
        syncGrauRole(discordId, grauPorCargo),
      ]);
    }

    return json(200, { discord: syncRow, profile });
  } catch (err) {
    console.error('[agora-discord-sync]', err);
    return json(500, { error: err.message || 'Erro interno na sincronização.' });
  }
}

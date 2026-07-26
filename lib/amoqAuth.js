// Helpers server-side para Supabase Auth + perfis AMOQ
import { atribuirDemon, calcularGrau, GOETIA_72 } from './goetia.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // service role key

async function supa(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, opts);
  if (res.status === 204 || res.status === 201) return null;
  return res.json();
}

// Verifica um access_token e retorna o user ou null
export async function getUser(accessToken) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Busca o perfil AMOQ do usuário, criando-o se não existir.
// Se demon_nome estiver em branco (criado pelo trigger SQL), preenche a partir do array estático.
export async function getOrCreateProfile(userId) {
  const rows = await supa(`profiles?id=eq.${userId}&select=*`);

  if (rows && rows.length > 0) {
    const p = rows[0];
    // Preenche demon_nome/rank se ausentes (perfil criado pelo trigger SQL)
    if (p.demon_num && !p.demon_nome) {
      const demon = GOETIA_72.find(d => d.num === p.demon_num) || GOETIA_72[0];
      p.demon_nome = demon.nome;
      p.demon_rank = demon.rank;
      // Persiste o preenchimento
      await supa(`profiles?id=eq.${userId}`, 'PATCH', {
        demon_nome: demon.nome,
        demon_rank: demon.rank,
      });
    }
    return p;
  }

  // Cria perfil com demônio atribuído deterministicamente
  const demon = atribuirDemon(userId);
  const profile = {
    id: userId,
    xp: 0,
    grau: 1,
    demon_num: demon.num,
    demon_nome: demon.nome,
    demon_rank: demon.rank,
  };
  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(profile),
  });
  return profile;
}

// Registra a visualização de um documento e concede XP (único por usuário+doc)
export async function recordView(userId, documentId, documentName, documentTema) {
  // Insere com ignore em conflito (unique user_id+document_id)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/document_views`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      document_id: documentId,
      document_name: documentName,
      document_tema: documentTema,
      xp_earned: 10,
    }),
  });

  // 201 = novo registro inserido; outro = já existia (duplicata ignorada)
  const isNew = res.status === 201;
  let profile = await getOrCreateProfile(userId);

  if (isNew) {
    const novoXP = (profile.xp || 0) + 10;
    const novoGrau = calcularGrau(novoXP);
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ xp: novoXP, grau: novoGrau }),
    });
    return { xpGanho: 10, totalXP: novoXP, grau: novoGrau, novo: true };
  }

  return { xpGanho: 0, totalXP: profile.xp || 0, grau: profile.grau || 1, novo: false };
}

// Retorna estatísticas completas de atividade do usuário
export async function getProfileStats(userId) {
  // Busca todas as visualizações do usuário (sem limit para stats)
  const views = await supa(`document_views?user_id=eq.${userId}&select=document_id,document_name,document_tema,viewed_at,xp_earned&order=viewed_at.desc`);
  const all = Array.isArray(views) ? views : [];

  // Total de documentos únicos
  const totalDocs = all.length;

  // Contagem por tema
  const temaContagem = {};
  for (const v of all) {
    const t = v.document_tema || 'Outros';
    temaContagem[t] = (temaContagem[t] || 0) + 1;
  }
  const temasExplorados = Object.keys(temaContagem).length;
  const temaFavorito = Object.entries(temaContagem).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Dias distintos ativos
  const dias = new Set(all.map(v => v.viewed_at?.substring(0, 10)));
  const diasAtivo = dias.size;

  // Últimos 20 documentos
  const recentDocs = all.slice(0, 20).map(v => ({
    document_id:   v.document_id,
    document_name: v.document_name,
    document_tema: v.document_tema,
    viewed_at:     v.viewed_at,
    xp_earned:     v.xp_earned,
  }));

  return { totalDocs, temaContagem, temasExplorados, temaFavorito, diasAtivo, recentDocs };
}

// Toggle bookmark (insere ou remove)
export async function toggleBookmark(userId, documentId, documentName, documentTema) {
  // Verifica se já existe
  const existing = await supa(`bookmarks?user_id=eq.${userId}&document_id=eq.${encodeURIComponent(documentId)}&select=id`);
  if (Array.isArray(existing) && existing.length > 0) {
    // Remove
    await supa(`bookmarks?user_id=eq.${userId}&document_id=eq.${encodeURIComponent(documentId)}`, 'DELETE');
    return { action: 'removed' };
  }
  // Adiciona
  await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ user_id: userId, document_id: documentId, document_name: documentName, document_tema: documentTema }),
  });
  return { action: 'added' };
}

// Lista todos os bookmarks do usuário
export async function getBookmarks(userId) {
  const rows = await supa(`bookmarks?user_id=eq.${userId}&select=document_id,document_name,document_tema,added_at&order=added_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

const SUPABASE_URL = 'https://fveslvzjjixzpwiqcydz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tUHMDyn291B9RBJ10tlXJQ_aPJkHKxX';
const TEACHER_FALLBACK = 'iuri@piragibe.com.br';
const LS = {
  pauta: 'jip-pauta',
  progress: 'jip-progress',
  exercises: 'jip-exercicios'
};

export const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function toast(msg) {
  document.querySelector('.jip-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'jip-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

export async function getSession() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export function redirectTo() {
  return `${location.origin}/jornalismo/app.html#/sala`;
}

export async function sendMagicLink(email) {
  if (!sb) throw new Error('Supabase indisponível');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo() }
  });
  if (error) throw error;
}

export async function signInOAuth(provider) {
  if (!sb) throw new Error('Supabase indisponível');
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo() }
  });
  if (error) throw error;
}

export async function signOut() {
  await sb?.auth.signOut();
  location.hash = '#/entrar';
}

export async function ensureEnrolled(session) {
  if (!sb || !session) return;
  await sb.from('curso_jip_inscricoes').upsert({ user_id: session.user.id });
}

export async function isTeacher(session) {
  const email = session?.user?.email?.toLowerCase() || '';
  if (email === TEACHER_FALLBACK) return true;
  if (!sb || !session) return false;
  const { data } = await sb.from('curso_jip_professores').select('email').eq('email', email).maybeSingle();
  return Boolean(data);
}

function readLs(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
}

export async function loadState(session) {
  const local = {
    pauta: readLs(LS.pauta, { titulo: '', dados: {} }),
    progress: readLs(LS.progress, []),
    exercises: readLs(LS.exercises, {})
  };
  if (!sb || !session) return { ...local, cloud: false };
  try {
    await ensureEnrolled(session);
    const uid = session.user.id;
    const [p, g, e] = await Promise.all([
      sb.from('curso_jip_pautas').select('*').eq('user_id', uid).maybeSingle(),
      sb.from('curso_jip_progresso').select('aula_id').eq('user_id', uid),
      sb.from('curso_jip_exercicios').select('aula_id, payload').eq('user_id', uid)
    ]);
    const exercises = {};
    for (const row of e.data || []) exercises[row.aula_id] = row.payload;
    return {
      pauta: p.data || local.pauta,
      progress: (g.data || []).map((r) => r.aula_id),
      exercises: Object.keys(exercises).length ? exercises : local.exercises,
      cloud: !p.error && !g.error
    };
  } catch {
    return { ...local, cloud: false };
  }
}

export async function savePauta(session, pauta) {
  localStorage.setItem(LS.pauta, JSON.stringify(pauta));
  if (!sb || !session) return false;
  const { error } = await sb.from('curso_jip_pautas').upsert({
    user_id: session.user.id,
    titulo: pauta.titulo || '',
    dados: pauta.dados || {},
    updated_at: new Date().toISOString()
  });
  return !error;
}

export async function saveExercise(session, aulaId, payload) {
  const all = readLs(LS.exercises, {});
  all[aulaId] = payload;
  localStorage.setItem(LS.exercises, JSON.stringify(all));
  if (!sb || !session) return false;
  const { error } = await sb.from('curso_jip_exercicios').upsert({
    user_id: session.user.id,
    aula_id: aulaId,
    payload,
    submitted_at: new Date().toISOString()
  });
  return !error;
}

export async function markDone(session, aulaId) {
  const list = readLs(LS.progress, []);
  if (!list.includes(aulaId)) {
    list.push(aulaId);
    localStorage.setItem(LS.progress, JSON.stringify(list));
  }
  if (!sb || !session) return false;
  const { error } = await sb.from('curso_jip_progresso').upsert({
    user_id: session.user.id,
    aula_id: aulaId,
    completed_at: new Date().toISOString()
  });
  return !error;
}

export async function loadTurma() {
  if (!sb) return [];
  const { data, error } = await sb
    .from('curso_jip_pautas')
    .select('user_id, titulo, dados, updated_at');
  if (error) return [];
  return data || [];
}

export async function sendFeedback(session, userId, aulaId, comentario, status) {
  if (!sb || !session) throw new Error('Só na nuvem');
  const { error } = await sb.from('curso_jip_feedback').insert({
    user_id: userId,
    aula_id: aulaId,
    mentor_email: session.user.email,
    comentario,
    status
  });
  if (error) throw error;
}

export function exportDossie(pauta, exercises, aulas) {
  const lines = ['# Dossiê — Jornalismo Investigativo na Prática', '', `Pauta: ${pauta.titulo || '(sem título)'}`, ''];
  lines.push('## Campos cumulativos', '');
  lines.push('```json', JSON.stringify(pauta.dados || {}, null, 2), '```', '');
  for (const aula of aulas) {
    const ex = exercises[aula.id];
    if (!ex) continue;
    lines.push(`## Exercício ${aula.id} — ${aula.title}`, '', ex.texto || JSON.stringify(ex, null, 2), '');
  }
  return lines.join('\n');
}

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
  const pending = location.search.includes('code=') || location.hash.includes('access_token');
  if (pending) {
    await new Promise((resolve) => {
      let done = false;
      const { data: sub } = sb.auth.onAuthStateChange((_e, sess) => {
        if (sess && !done) {
          done = true;
          sub.subscription.unsubscribe();
          resolve(sess);
        }
      });
      setTimeout(() => {
        if (!done) {
          done = true;
          sub.subscription.unsubscribe();
          resolve(null);
        }
      }, 4000);
    });
  }
  const { data } = await sb.auth.getSession();
  if (!data.session) return null;
  const { data: fresh } = await sb.auth.getUser();
  if (fresh?.user) data.session.user = fresh.user;
  return data.session;
}

export function redirectTo() {
  return `${location.origin}/jornalismo/app.html#/inicio`;
}

export function displayName(session) {
  const u = session?.user;
  if (!u) return 'Aluno';
  const meta = u.user_metadata || {};
  return meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Aluno');
}

export function initials(session) {
  const n = displayName(session).trim();
  const parts = n.split(/\s+/);
  const letters = (parts[0]?.[0] || 'A') + (parts[1]?.[0] || '');
  return letters.toUpperCase();
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
  location.reload();
}

export async function ensureEnrolled(session) {
  if (!sb || !session) return;
  await sb.from('curso_jip_inscricoes').upsert({ user_id: session.user.id });
}

export function sessionEmails(session) {
  const u = session?.user;
  if (!u) return [];
  const raw = [
    u.email,
    u.user_metadata?.email,
    u.app_metadata?.email,
    ...(u.identities || []).flatMap((i) => [i.identity_data?.email, i.email])
  ];
  return [...new Set(raw.filter(Boolean).map((e) => String(e).trim().toLowerCase()))];
}

export async function isTeacher(session) {
  const emails = sessionEmails(session);
  if (emails.includes(TEACHER_FALLBACK)) return true;
  if (!sb || !session || !emails.length) return false;
  const { data } = await sb.from('curso_jip_professores').select('email');
  const allowed = (data || []).map((r) => String(r.email).toLowerCase());
  return emails.some((e) => allowed.includes(e));
}

function readLs(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
}

export async function loadState(session) {
  const empty = { pauta: { titulo: '', dados: {} }, progress: [], exercises: {}, cloud: false };
  if (!session) return empty;
  const local = {
    pauta: readLs(LS.pauta, { titulo: '', dados: {} }),
    progress: readLs(LS.progress, []),
    exercises: readLs(LS.exercises, {})
  };
  if (!sb) return { ...local, cloud: false };
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

export async function hasPaidAccess(session, isTeacherFlag) {
  if (!session) return false;
  if (isTeacherFlag) return true;
  if (!sb) return false;
  const { data: rpc, error: rpcErr } = await sb.rpc('curso_jip_tem_acesso');
  if (!rpcErr && rpc === true) return true;
  const emails = sessionEmails(session);
  if (!emails.length) return false;
  const { data, error } = await sb.from('curso_jip_alunos').select('email');
  if (error || !data) return false;
  const allowed = data.map((r) => String(r.email).toLowerCase());
  return emails.some((e) => allowed.includes(e));
}

export async function grantAluno(email, fonte = 'manual') {
  if (!sb) throw new Error('Supabase indisponível');
  const { error } = await sb.from('curso_jip_alunos').upsert({
    email: email.trim().toLowerCase(),
    fonte
  });
  if (error) throw error;
}

export async function listAlunos() {
  if (!sb) return [];
  const { data, error } = await sb.from('curso_jip_alunos').select('email, fonte, created_at').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
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

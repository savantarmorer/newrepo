const SUPABASE_URL = 'https://fveslvzjjixzpwiqcydz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tUHMDyn291B9RBJ10tlXJQ_aPJkHKxX';
const TEACHER_EMAIL = 'iuri@piragibe.com.br';

export const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) || null;

const redirectUrl = () => `${location.origin}/jornalismo/app.html#/inicio`;

export function sessionEmails(session) {
  const user = session?.user;
  if (!user) return [];
  const values = [
    user.email,
    user.user_metadata?.email,
    ...(user.identities || []).flatMap((identity) => [
      identity.email,
      identity.identity_data?.email
    ])
  ];
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim().toLowerCase()))];
}

export function displayName(session, profile) {
  const user = session?.user;
  return profile?.codinome
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Repórter';
}

export function friendlyAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (message.includes('password')) {
    return 'Não foi possível autenticar. Revise os dados e tente novamente.';
  }
  if (message.includes('email')) {
    return 'Não foi possível concluir. Revise o e-mail e tente novamente.';
  }
  return 'Não foi possível concluir a autenticação. Tente novamente.';
}

export async function getSession() {
  if (!sb) return null;
  const pending = location.search.includes('code=') || location.hash.includes('access_token');
  if (pending) {
    await new Promise((resolve) => {
      let done = false;
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        if (session && !done) {
          done = true;
          sub.subscription.unsubscribe();
          resolve(session);
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
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  const { data: fresh } = await sb.auth.getUser();
  if (fresh?.user) data.session.user = fresh.user;
  return data.session;
}

export function watchAuth(callback) {
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInPassword(email, password) {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp({ email, password, codinome }) {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl(),
      data: { codinome: codinome || null }
    }
  });
  if (error) throw error;
  return data;
}

export async function sendMagicLink(email) {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl(), shouldCreateUser: false }
  });
  if (error) throw error;
}

export async function signInGoogle() {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl() }
  });
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/jornalismo/app.html#/redefinir`
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  if (!sb) throw new Error('Serviço de autenticação indisponível.');
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  if (sb) await sb.auth.signOut();
}

export async function accessState(session) {
  if (!sb || !session) return { paid: false, teacher: false };
  const emails = sessionEmails(session);
  const teacher = emails.includes(TEACHER_EMAIL);
  if (teacher) return { paid: true, teacher: true };
  const { data, error } = await sb.rpc('curso_jip_tem_acesso');
  return { paid: !error && data === true, teacher: false };
}

export async function fetchPrivateCatalog(session) {
  if (!session?.access_token) throw new Error('Sessão ausente.');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/curso-catalog`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || 'catalog_unavailable');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function downloadResource(session, key, filename) {
  if (!session?.access_token) throw new Error('Sessão ausente.');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/curso-catalog?resource=${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('download_unavailable');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function loadWorkspace(session) {
  if (!sb || !session) throw new Error('Sessão ausente.');
  const userId = session.user.id;
  await sb.from('curso_jip_inscricoes').upsert({ user_id: userId });
  const [profile, pauta, progress, exercises, evidence] = await Promise.all([
    sb.from('curso_jip_perfis').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('curso_jip_pautas').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('curso_jip_progresso').select('aula_id').eq('user_id', userId),
    sb.from('curso_jip_exercicios').select('aula_id,payload').eq('user_id', userId),
    sb.from('curso_jip_evidencias').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  ]);
  const firstError = [profile, pauta, progress, exercises, evidence].find((result) => result.error)?.error;
  if (firstError) throw firstError;
  return {
    profile: profile.data,
    pauta: pauta.data || { titulo: '', dados: {} },
    progress: (progress.data || []).map((row) => row.aula_id),
    exercises: Object.fromEntries((exercises.data || []).map((row) => [row.aula_id, row.payload])),
    evidence: evidence.data || []
  };
}

export async function saveProfile(session, profile) {
  const { data, error } = await sb.from('curso_jip_perfis').upsert({
    user_id: session.user.id,
    codinome: profile.codinome || null,
    vertente: profile.vertente,
    opsec_score: profile.opsec_score,
    onboarding_completed: profile.onboarding_completed,
    updated_at: new Date().toISOString()
  }).select().single();
  if (error) throw error;
  return data;
}

export async function savePauta(session, pauta) {
  const { data, error } = await sb.from('curso_jip_pautas').upsert({
    user_id: session.user.id,
    titulo: pauta.titulo,
    dados: pauta.dados,
    updated_at: new Date().toISOString()
  }).select().single();
  if (error) throw error;
  return data;
}

export async function saveExercise(session, lessonId, payload) {
  const { error } = await sb.from('curso_jip_exercicios').upsert({
    user_id: session.user.id,
    aula_id: lessonId,
    payload,
    submitted_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function markComplete(session, lessonId) {
  const { error } = await sb.from('curso_jip_progresso').upsert({
    user_id: session.user.id,
    aula_id: lessonId,
    completed_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function addEvidence(session, evidence) {
  const { data, error } = await sb.from('curso_jip_evidencias').insert({
    user_id: session.user.id,
    titulo: evidence.titulo,
    tipo: evidence.tipo,
    fonte_url: evidence.fonte_url || null,
    observacao: evidence.observacao || '',
    relacionada_a: evidence.relacionada_a || null,
    status: evidence.status
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvidence(session, evidenceId) {
  const { error } = await sb.from('curso_jip_evidencias')
    .delete()
    .eq('id', evidenceId)
    .eq('user_id', session.user.id);
  if (error) throw error;
}

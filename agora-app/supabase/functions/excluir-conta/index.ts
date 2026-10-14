// Exclusão de conta (LGPD): anonimiza perfil e conteúdo público, preserva votos e
// lançamentos de caixa como "Membro removido", e remove o login (soft delete no Auth).
import { admin, usuario } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';

servir(async (req) => {
  const { user } = await usuario(req);
  const db = admin();
  const { error } = await db.rpc('anonimizar_conta', { p_uid: user.id });
  if (error) throw new ErroHttp(500, error.message);
  // soft delete: apaga e-mail/identidades e impede novo login, mantendo o id referenciado
  const { error: erroAuth } = await db.auth.admin.deleteUser(user.id, true);
  if (erroAuth) throw new ErroHttp(500, erroAuth.message);
  return json({ ok: true });
});

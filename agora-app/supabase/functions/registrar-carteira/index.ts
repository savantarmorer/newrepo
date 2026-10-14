// Vincula um endereço à conta do membro. Exige assinatura de uma mensagem que contém o
// id do usuário e um horário recente. Funciona com EOAs e smart accounts (ERC-1271/6492).
import { getAddress, isAddress } from 'npm:viem@2';
import { admin, exigirMembroAtivo, usuario } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';
import { clientes, lerConfig } from '../_shared/chain.ts';

servir(async (req) => {
  const { cliente, user } = await usuario(req);
  await exigirMembroAtivo(cliente);
  const { endereco, mensagem, assinatura, tipo, conta_dona } = await req.json();
  if (!isAddress(endereco)) throw new ErroHttp(400, 'Endereço inválido');
  if (!['embutida', 'externa'].includes(tipo)) throw new ErroHttp(400, 'Tipo inválido');

  const esperado = `Ágora: vincular a carteira ${String(endereco).toLowerCase()} à minha conta ${user.id} em `;
  if (typeof mensagem !== 'string' || !mensagem.startsWith(esperado)) throw new ErroHttp(400, 'Mensagem de vínculo inválida');
  const quando = Date.parse(mensagem.slice(esperado.length));
  if (!Number.isFinite(quando) || Math.abs(Date.now() - quando) > 10 * 60_000) throw new ErroHttp(400, 'Assinatura expirada; tente de novo');

  const db = admin();
  const cfg = await lerConfig(db);
  const { publico } = clientes(cfg);
  const valida = await publico.verifyMessage({ address: getAddress(endereco), message: mensagem, signature: assinatura });
  if (!valida) throw new ErroHttp(401, 'Assinatura não confere com o endereço');

  const { data: outro } = await db.from('carteiras').select('profile_id').eq('endereco', endereco.toLowerCase()).maybeSingle();
  if (outro && outro.profile_id !== user.id) throw new ErroHttp(409, 'Este endereço já pertence a outro membro');

  const { error } = await db.from('carteiras').upsert({
    profile_id: user.id, endereco: endereco.toLowerCase(), tipo,
    conta_dona: conta_dona && isAddress(conta_dona) ? conta_dona.toLowerCase() : null,
    sbt_token_id: null, sbt_nivel: null, verificada_em: new Date().toISOString(),
  });
  if (error) throw new ErroHttp(400, error.message);
  // O selo (SBT) é emitido pela função agendada sincronizar-sbt em até 15 minutos.
  return json({ ok: true, sbt: 'pendente' });
});

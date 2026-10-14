// Cria uma cobrança Pix para doação a um projeto (ou consulta o status de uma).
// POST { projeto_id, valor, anonima }  → { doacao_id, pix_copia_cola, qr_code_base64, expira_em, valor, simulado }
// POST { consultar: doacao_id }        → { status }
import { admin, exigirMembroAtivo, usuario } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';
import { provedorPagamento } from '../_shared/pagamentos.ts';

servir(async (req) => {
  const { cliente, user } = await usuario(req);
  await exigirMembroAtivo(cliente);
  const corpo = await req.json();
  const db = admin();

  if (corpo.consultar) {
    const { data } = await db.from('doacoes').select('status').eq('id', corpo.consultar).maybeSingle();
    if (!data) throw new ErroHttp(404, 'Doação não encontrada');
    return json({ status: data.status });
  }

  const valor = Math.round(Number(corpo.valor) * 100) / 100;
  if (!Number.isFinite(valor) || valor < 1 || valor > 50_000) throw new ErroHttp(400, 'Valor entre R$ 1,00 e R$ 50.000,00');
  const anonima = corpo.anonima === true;

  const { data: projeto } = await db.from('projetos').select('id, titulo, status').eq('id', corpo.projeto_id).maybeSingle();
  if (!projeto || !['ativo', 'planejamento'].includes(projeto.status)) throw new ErroHttp(400, 'Projeto não aceita doações');

  // Limite simples: 10 doações/hora por pessoa (as anônimas contam no log de chamadas)
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from('doacoes').select('id', { count: 'exact', head: true }).eq('doador_id', user.id).gte('created_at', desde);
  if ((count ?? 0) >= 10) throw new ErroHttp(429, 'Muitas doações em pouco tempo. Tente mais tarde.');

  const provedor = provedorPagamento();
  const { data: doacao, error } = await db
    .from('doacoes')
    .insert({ projeto_id: projeto.id, doador_id: anonima ? null : user.id, valor, anonima, gateway: provedor.nome })
    .select('id')
    .single();
  if (error) throw new ErroHttp(400, error.message);

  try {
    const cobranca = await provedor.criarCobrancaPix({
      doacaoId: doacao.id,
      valor,
      descricao: `Doação Ágora · ${projeto.titulo}`.slice(0, 120),
      pagador: anonima ? null : { email: user.email },
    });
    await db.from('doacoes').update({ gateway_ref: cobranca.gatewayRef, pix_copia_cola: cobranca.pixCopiaCola, expira_em: cobranca.expiraEm }).eq('id', doacao.id);
    return json({
      doacao_id: doacao.id,
      pix_copia_cola: cobranca.pixCopiaCola,
      qr_code_base64: cobranca.qrCodeBase64,
      expira_em: cobranca.expiraEm,
      valor,
      simulado: provedor.nome === 'mock',
    });
  } catch (e) {
    await db.from('doacoes').update({ status: 'falhou' }).eq('id', doacao.id);
    throw e;
  }
});

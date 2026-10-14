// Fecha a época semanal de recompensas: calcula créditos (SQL preparar_epoca), gera a
// árvore Merkle (formato StandardMerkleTree da OpenZeppelin), guarda as provas e publica
// a raiz no DistribuidorRecompensas. Agendado toda segunda-feira (pg_cron).
import { StandardMerkleTree } from 'npm:@openzeppelin/merkle-tree@1.0.8';
import { admin, exigirServico } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';
import { abiDistribuidor, clientes, lerConfig } from '../_shared/chain.ts';

servir(async (req) => {
  exigirServico(req);
  const db = admin();
  const cfg = await lerConfig(db);
  const { publico, carteira } = clientes(cfg, true);

  const epoca = Number(await publico.readContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'proximaEpoca' }));
  const fim = Number(await publico.readContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'fimDaEpoca', args: [BigInt(epoca)] }));
  if (Date.now() / 1000 < fim) return json({ ok: true, aguardando: `época ${epoca} termina em ${new Date(fim * 1000).toISOString()}` });
  const inicio = new Date((fim - 7 * 86400) * 1000).toISOString();

  // Reaproveita uma época já preparada que falhou na publicação
  const { data: existente } = await db.from('epocas_recompensa').select('id, status').eq('id', epoca).maybeSingle();
  if (!existente) {
    const { error } = await db.rpc('preparar_epoca', { p_epoca: epoca, p_inicio: inicio, p_fim: new Date(fim * 1000).toISOString() });
    if (error) throw new ErroHttp(500, error.message);
  } else if (existente.status === 'publicada') {
    return json({ ok: true, ja_publicada: epoca });
  }

  const { data: creditos } = await db.from('creditos_drc').select('profile_id, endereco, valor_wei').eq('epoca_id', epoca).order('profile_id');
  if (!creditos?.length) {
    // Época vazia: publica raiz neutra para manter a sequência on-chain
    const raizVazia = ('0x' + '11'.repeat(32)) as `0x${string}`;
    const tx = await carteira!.writeContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'publicarEpoca', args: [BigInt(epoca), raizVazia, 0n] });
    await db.from('epocas_recompensa').update({ status: 'publicada', merkle_root: raizVazia, tx_hash: tx, publicada_em: new Date().toISOString() }).eq('id', epoca);
    return json({ ok: true, epoca, beneficiarios: 0, tx });
  }

  const valores = creditos.map((c) => [c.endereco, String(c.valor_wei)] as [string, string]);
  const arvore = StandardMerkleTree.of(valores, ['address', 'uint256']);
  const provas = [...arvore.entries()].map(([i, v]) => ({
    profile_id: creditos.find((c) => c.endereco === v[0])!.profile_id,
    indice: i,
    prova: arvore.getProof(i),
  }));
  await db.rpc('registrar_provas_epoca', { p_epoca: epoca, p_root: arvore.root, p_provas: provas });

  const total = creditos.reduce((s, c) => s + BigInt(c.valor_wei), 0n);
  const teto = await publico.readContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'tetoDaEpoca', args: [BigInt(epoca)] });
  if (total > teto) throw new ErroHttp(500, `Total ${total} acima do teto on-chain ${teto}: ajuste configuracoes.drc.teto_por_epoca`);

  try {
    const tx = await carteira!.writeContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'publicarEpoca', args: [BigInt(epoca), arvore.root as `0x${string}`, total] });
    await publico.waitForTransactionReceipt({ hash: tx });
    await db.from('epocas_recompensa').update({ status: 'publicada', tx_hash: tx, publicada_em: new Date().toISOString() }).eq('id', epoca);
    for (const c of creditos) {
      await db.rpc('notificar', { p_profile: c.profile_id, p_tipo: 'recompensa', p_titulo: 'Recompensas prontas para resgate',
        p_corpo: 'Sua parte da época semanal de Dracma já pode ser resgatada na Carteira.', p_link: '/perfil/carteira', p_chave: `epoca:${epoca}` });
    }
    return json({ ok: true, epoca, beneficiarios: creditos.length, total: total.toString(), raiz: arvore.root, tx });
  } catch (e) {
    await db.from('epocas_recompensa').update({ status: 'falhou' }).eq('id', epoca);
    throw e;
  }
});

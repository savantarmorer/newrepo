// Relayer de resgate: envia o claim pelo membro, pagando o gas com a chave do backend.
// Os DRC vão sempre para o endereço da folha Merkle (o contrato garante).
import { admin, exigirMembroAtivo, usuario } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';
import { abiDistribuidor, clientes, lerConfig } from '../_shared/chain.ts';

servir(async (req) => {
  const { cliente, user } = await usuario(req);
  await exigirMembroAtivo(cliente);
  const { epocas } = (await req.json()) as { epocas: number[] };
  if (!Array.isArray(epocas) || !epocas.length || epocas.length > 20) throw new ErroHttp(400, 'Informe de 1 a 20 épocas');
  const db = admin();
  const cfg = await lerConfig(db);
  const { publico, carteira } = clientes(cfg, true);
  const { data: creditos } = await db.from('creditos_drc').select('epoca_id, endereco, valor_wei, prova')
    .eq('profile_id', user.id).in('epoca_id', epocas).is('resgatado_tx', null).not('prova', 'is', null);
  if (!creditos?.length) throw new ErroHttp(404, 'Nada a resgatar nessas épocas');

  const txs: string[] = [];
  for (const c of creditos) {
    const ja = await publico.readContract({ address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'resgatado', args: [BigInt(c.epoca_id), c.endereco] });
    if (ja) continue;
    const tx = await carteira!.writeContract({
      address: cfg.distribuidor!, abi: abiDistribuidor, functionName: 'resgatar',
      args: [BigInt(c.epoca_id), c.endereco, BigInt(c.valor_wei), c.prova as `0x${string}`[]],
    });
    await publico.waitForTransactionReceipt({ hash: tx });
    await db.from('creditos_drc').update({ resgatado_tx: tx, resgatado_em: new Date().toISOString() }).eq('profile_id', user.id).eq('epoca_id', c.epoca_id);
    txs.push(tx);
  }
  return json({ ok: true, tx: txs[txs.length - 1] ?? null, transacoes: txs });
});

// Indexador: lê eventos dos contratos e espelha no Supabase para leitura rápida no app.
// Transferências, delegações, propostas/votos do Governor e resgates do Distribuidor.
// Agendado a cada 2 minutos; processa no máximo LOTE blocos por chamada.
import type { Address } from 'npm:viem@2';
import { admin, exigirServico } from '../_shared/supabase.ts';
import { json, servir } from '../_shared/http.ts';
import { abiGovernor, clientes, ESTADOS, eventos, lerConfig, MODOS } from '../_shared/chain.ts';

const LOTE = 5_000n;
const minus = (a: Address | string) => a.toLowerCase();

servir(async (req) => {
  exigirServico(req);
  const db = admin();
  const cfg = await lerConfig(db);
  const { publico } = clientes(cfg);

  const { data: estado } = await db.from('indexador_estado').select('ultimo_bloco').eq('chave', 'principal').maybeSingle();
  const atual = await publico.getBlockNumber();
  const de = BigInt(estado?.ultimo_bloco ?? cfg.bloco_implantacao ?? Number(atual - 1000n)) + 1n;
  const ate = de + LOTE > atual ? atual : de + LOTE;
  if (de > ate) return json({ ok: true, em_dia: true });

  const blocos = new Map<bigint, string>();
  const quando = async (n: bigint) => {
    if (!blocos.has(n)) blocos.set(n, new Date(Number((await publico.getBlock({ blockNumber: n })).timestamp) * 1000).toISOString());
    return blocos.get(n)!;
  };

  // ---- token: transferências e delegações
  const [transfers, delegacoes] = await Promise.all([
    publico.getLogs({ address: cfg.token!, event: eventos.transfer, fromBlock: de, toBlock: ate }),
    publico.getLogs({ address: cfg.token!, event: eventos.delegado, fromBlock: de, toBlock: ate }),
  ]);
  if (transfers.length) {
    await db.from('movimentos_drc').upsert(await Promise.all(transfers.map(async (l) => ({
      tx_hash: l.transactionHash, log_index: l.logIndex, de: minus(l.args.from!), para: minus(l.args.to!),
      valor_wei: l.args.value!.toString(), bloco: Number(l.blockNumber), ocorrido_em: await quando(l.blockNumber!),
    }))));
  }
  for (const l of delegacoes) {
    await db.from('delegacoes').upsert({ delegante: minus(l.args.delegator!), delegado: minus(l.args.toDelegate!), bloco: Number(l.blockNumber), tx_hash: l.transactionHash, atualizado_em: new Date().toISOString() });
  }

  // ---- distribuidor: resgates
  const resgates = await publico.getLogs({ address: cfg.distribuidor!, event: eventos.resgate, fromBlock: de, toBlock: ate });
  for (const l of resgates) {
    await db.from('creditos_drc').update({ resgatado_tx: l.transactionHash, resgatado_em: await quando(l.blockNumber!) })
      .eq('epoca_id', Number(l.args.epoca)).eq('endereco', minus(l.args.conta!)).is('resgatado_tx', null);
  }

  // ---- governor: propostas e votos
  const [criadas, votos] = await Promise.all([
    publico.getLogs({ address: cfg.governor!, event: eventos.propostaCriada, fromBlock: de, toBlock: ate }),
    publico.getLogs({ address: cfg.governor!, event: eventos.voto, fromBlock: de, toBlock: ate }),
  ]);
  for (const l of criadas) {
    const a = l.args;
    const vinculo = a.description!.match(/^\[agora:([0-9a-f-]{36})\]/i)?.[1] ?? null;
    if (vinculo) {
      // remove placeholders do seed ligados à mesma proposta do app
      await db.from('propostas_onchain').delete().eq('proposta_id_app', vinculo).neq('proposal_id', a.proposalId!.toString()).is('tx_criacao', null);
    }
    await db.from('propostas_onchain').upsert({
      proposal_id: a.proposalId!.toString(), proposta_id_app: vinculo, proponente: minus(a.proposer!), descricao: a.description!,
      acoes: a.targets!.map((t, i) => ({ alvo: minus(t), funcao: a.calldatas![i]!.slice(0, 10), args: [a.calldatas![i]] })),
      bloco_snapshot: Number(a.voteStart), bloco_fim: Number(a.voteEnd), tx_criacao: l.transactionHash,
    });
  }
  for (const l of votos) {
    await db.from('votos_onchain').upsert({
      proposal_id: l.args.proposalId!.toString(), eleitor: minus(l.args.voter!), suporte: l.args.support!, peso: l.args.weight!.toString(),
      motivo: l.args.reason || null, tx_hash: l.transactionHash, bloco: Number(l.blockNumber),
    });
  }

  // ---- atualiza estado/placar de toda proposta não finalizada
  const { data: abertas } = await db.from('propostas_onchain').select('proposal_id, proposta_id_app, estado')
    .in('estado', ['pendente', 'ativa', 'aprovada', 'na_fila']);
  for (const p of abertas ?? []) {
    const id = BigInt(p.proposal_id);
    try {
      const [estadoNum, placar, modo, eta] = await Promise.all([
        publico.readContract({ address: cfg.governor!, abi: abiGovernor, functionName: 'state', args: [id] }),
        publico.readContract({ address: cfg.governor!, abi: abiGovernor, functionName: 'proposalVotes', args: [id] }),
        publico.readContract({ address: cfg.governor!, abi: abiGovernor, functionName: 'modoDaProposta', args: [id] }),
        publico.readContract({ address: cfg.governor!, abi: abiGovernor, functionName: 'proposalEta', args: [id] }),
      ]);
      const novo = ESTADOS[Number(estadoNum)];
      const { data: linha } = await db.from('propostas_onchain').select('bloco_snapshot').eq('proposal_id', p.proposal_id).single();
      const quorum = linha?.bloco_snapshot && BigInt(linha.bloco_snapshot) < atual
        ? (await publico.readContract({ address: cfg.governor!, abi: abiGovernor, functionName: 'quorum', args: [BigInt(linha.bloco_snapshot)] })).toString()
        : null;
      await db.from('propostas_onchain').update({
        estado: novo, votos_contra: placar[0].toString(), votos_favor: placar[1].toString(), abstencoes: placar[2].toString(),
        quorum, modo_voto: MODOS[Number(modo)], eta: eta > 0n ? new Date(Number(eta) * 1000).toISOString() : null, atualizado_em: new Date().toISOString(),
      }).eq('proposal_id', p.proposal_id);
      // espelha o status na proposta do app (debate/contexto)
      if (p.proposta_id_app && novo !== p.estado) {
        const status = novo === 'ativa' || novo === 'pendente' ? 'votacao'
          : ['aprovada', 'na_fila', 'executada'].includes(novo) ? 'aprovada'
          : novo === 'cancelada' ? 'retirada' : 'rejeitada';
        await db.from('propostas').update({ status }).eq('id', p.proposta_id_app);
      }
    } catch (e) {
      console.warn('proposta', p.proposal_id, e);
    }
  }
  const execucoes = await publico.getLogs({ address: cfg.governor!, event: eventos.executada, fromBlock: de, toBlock: ate });
  for (const l of execucoes) {
    await db.from('propostas_onchain').update({ estado: 'executada', tx_execucao: l.transactionHash }).eq('proposal_id', l.args.proposalId!.toString());
  }

  await db.from('indexador_estado').upsert({ chave: 'principal', ultimo_bloco: Number(ate), atualizado_em: new Date().toISOString() });
  return json({ ok: true, de: de.toString(), ate: ate.toString(), transfers: transfers.length, propostas: criadas.length, votos: votos.length, resgates: resgates.length });
});

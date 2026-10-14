// Mantém o selo de reputação (SBT) espelhando o nível do app:
//  - emite para carteiras vinculadas de membros ativos que ainda não têm selo
//  - atualiza o nível quando ele muda
//  - revoga de contas excluídas
import { admin, exigirServico } from '../_shared/supabase.ts';
import { json, servir } from '../_shared/http.ts';
import { abiSbt, clientes, lerConfig } from '../_shared/chain.ts';

servir(async (req) => {
  exigirServico(req);
  const db = admin();
  const cfg = await lerConfig(db);
  const { publico, carteira } = clientes(cfg, true);
  const { data: linhas } = await db.from('carteiras')
    .select('profile_id, endereco, sbt_token_id, sbt_nivel, perfil:profiles(nivel, status_assinatura, excluido_em)');
  const resultado = { emitidos: 0, atualizados: 0, revogados: 0, erros: 0 };

  for (const l of linhas ?? []) {
    const p = l.perfil as unknown as { nivel: number; status_assinatura: string; excluido_em: string | null } | null;
    if (!p) continue;
    const end = l.endereco as `0x${string}`;
    try {
      if (p.excluido_em && l.sbt_token_id) {
        const tx = await carteira!.writeContract({ address: cfg.reputacao_sbt!, abi: abiSbt, functionName: 'revogar', args: [end] });
        await publico.waitForTransactionReceipt({ hash: tx });
        await db.from('carteiras').update({ sbt_token_id: null, sbt_nivel: null, sbt_atualizado_em: new Date().toISOString() }).eq('profile_id', l.profile_id);
        resultado.revogados++;
      } else if (!l.sbt_token_id && !p.excluido_em && p.status_assinatura === 'ativo') {
        const existente = await publico.readContract({ address: cfg.reputacao_sbt!, abi: abiSbt, functionName: 'tokenDe', args: [end] });
        if (existente === 0n) {
          const tx = await carteira!.writeContract({ address: cfg.reputacao_sbt!, abi: abiSbt, functionName: 'emitir', args: [end, p.nivel] });
          await publico.waitForTransactionReceipt({ hash: tx });
        }
        const id = await publico.readContract({ address: cfg.reputacao_sbt!, abi: abiSbt, functionName: 'tokenDe', args: [end] });
        await db.from('carteiras').update({ sbt_token_id: id.toString(), sbt_nivel: p.nivel, sbt_atualizado_em: new Date().toISOString() }).eq('profile_id', l.profile_id);
        resultado.emitidos++;
      } else if (l.sbt_token_id && l.sbt_nivel !== p.nivel && !p.excluido_em) {
        const tx = await carteira!.writeContract({ address: cfg.reputacao_sbt!, abi: abiSbt, functionName: 'atualizarNivel', args: [end, p.nivel] });
        await publico.waitForTransactionReceipt({ hash: tx });
        await db.from('carteiras').update({ sbt_nivel: p.nivel, sbt_atualizado_em: new Date().toISOString() }).eq('profile_id', l.profile_id);
        resultado.atualizados++;
      }
    } catch (e) {
      console.error('SBT', l.endereco, e);
      resultado.erros++;
    }
  }
  return json(resultado);
});

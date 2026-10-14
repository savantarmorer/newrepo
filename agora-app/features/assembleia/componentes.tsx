import { router } from 'expo-router';
import { View } from 'react-native';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Contagem } from '@/components/Contagem';
import type { EtapaLinha } from '@/components/LinhaDoTempo';
import { Texto } from '@/components/Texto';
import { formatarData, formatarDRC, tempoRelativo } from '@/lib/formatos';
import { ROTULO_ESTADO_ONCHAIN, ROTULO_STATUS, ROTULO_TIPO, type Proposta, type PropostaOnchain } from './types';

export function ChipNatureza({ natureza }: { natureza: 'comunitaria' | 'onchain' }) {
  return natureza === 'onchain'
    ? <ChipTema rotulo="On-chain · poder de voto em DRC" icone="link" tom="dourado" />
    : <ChipTema rotulo="Comunitária · 1 pessoa = 1 voto" icone="users" tom="secundaria" />;
}

export function CardProposta({ p }: { p: Proposta }) {
  return (
    <Card onPress={() => router.push(`/assembleia/proposta/${p.id}`)} rotulo={`Proposta ${p.titulo}`} plano destaque={p.status === 'votacao' ? 'primaria' : undefined}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <ChipTema rotulo={ROTULO_TIPO[p.tipo]} />
        {p.escopo ? <ChipTema rotulo={`Núcleo ${p.escopo.cidade}`} icone="map-pin" /> : null}
        {p.natureza === 'onchain' ? <ChipTema rotulo="On-chain" icone="link" tom="dourado" /> : null}
        {p.rodada > 1 ? <ChipTema rotulo={`Rodada ${p.rodada}`} tom="primaria" /> : null}
      </View>
      <Texto variante="subtitulo" style={{ fontSize: 21, lineHeight: 26 }}>{p.oculto ? 'Removida pela moderação' : p.titulo}</Texto>
      <Texto variante="legenda" cor="secundario" style={{ marginTop: 4 }}>
        {p.autor?.nome_publico} · {ROTULO_STATUS[p.status]}
        {p.status === 'debate' && p.debate_ate ? ' · votação em ' : ''}
        {p.status === 'votacao' && p.votacao_ate ? ' · encerra em ' : ''}
      </Texto>
      {p.status === 'debate' ? <Contagem ate={p.debate_ate} variante="corpoForte" cor="primaria" /> : null}
      {p.status === 'votacao' ? <Contagem ate={p.votacao_ate} variante="corpoForte" cor="primaria" /> : null}
      {['aprovada', 'rejeitada', 'retirada'].includes(p.status) && p.votacao_ate ? <Texto variante="legenda" cor="sutil">Encerrada em {formatarData(p.votacao_ate)}</Texto> : null}
    </Card>
  );
}

export function CardPropostaOnchain({ p }: { p: PropostaOnchain }) {
  const titulo = p.descricao.replace(/^\[agora:[0-9a-f-]+\]\s*/i, '');
  return (
    <Card onPress={() => router.push(`/assembleia/onchain/${p.proposal_id}`)} rotulo={`Proposta on-chain ${titulo}`} plano destaque="dourado">
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <ChipTema rotulo={ROTULO_ESTADO_ONCHAIN[p.estado]} icone="link" tom="dourado" />
        {p.modo_voto ? <ChipTema rotulo={`Modo ${p.modo_voto}`} /> : null}
      </View>
      <Texto variante="corpoForte">{titulo}</Texto>
      <Texto variante="legenda" cor="secundario">A favor {formatarDRC(p.votos_favor)} · Contra {formatarDRC(p.votos_contra)} · atualizado {tempoRelativo(p.atualizado_em)}</Texto>
    </Card>
  );
}

/** Linha do tempo do ciclo: rascunho → debate → votação → resultado */
export function etapasProposta(p: Proposta): EtapaLinha[] {
  const ordem = ['rascunho', 'debate', 'votacao', 'resultado'];
  const atual = p.status === 'rascunho' ? 0 : p.status === 'debate' ? 1 : p.status === 'votacao' ? 2 : 3;
  const est = (i: number): EtapaLinha['estado'] => (i < atual ? 'feito' : i === atual ? (atual === 3 ? 'feito' : 'atual') : 'futuro');
  const resultado = p.status === 'aprovada' ? 'Aprovada' : p.status === 'rejeitada' ? 'Rejeitada' : p.status === 'retirada' ? 'Retirada pelo autor' : 'Resultado';
  void ordem;
  return [
    { titulo: 'Rascunho', estado: est(0), detalhe: 'O autor escreve e revisa' },
    { titulo: p.rodada > 1 ? `Debate (rodada ${p.rodada})` : 'Debate', estado: est(1), detalhe: p.debate_ate ? `até ${formatarData(p.debate_ate)}` : 'mínimo de 5 dias' },
    { titulo: 'Votação', estado: est(2), detalhe: p.votacao_ate ? `até ${formatarData(p.votacao_ate)}` : 'mínimo de 3 dias' },
    { titulo: resultado, estado: p.status === 'rejeitada' || p.status === 'retirada' ? 'alerta' : est(3), detalhe: atual === 3 ? 'Registrada no arquivo de decisões' : undefined },
  ];
}

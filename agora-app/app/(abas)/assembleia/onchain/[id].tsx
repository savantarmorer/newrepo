import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BarraProgresso } from '@/components/BarraProgresso';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { Carregando, Erro } from '@/components/Estados';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { usePropostasOnchain, useVotosOnchain } from '@/features/assembleia/hooks';
import { ROTULO_ESTADO_ONCHAIN } from '@/features/assembleia/types';
import { useConfigOnchain, useMinhaCarteira } from '@/features/carteira/hooks';
import { useCarteiraConectada } from '@/features/carteira/useCarteiraConectada';
import { lerPoderDeVoto, votarOnchain } from '@/features/carteira/wallet';
import { textoDoErro } from '@/lib/erros';
import { encurtarEndereco, formatarDataHora, formatarDRC } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

const SUPORTE = ['Contra', 'A favor', 'Abstenção'];

export default function PropostaOnchainTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTema();
  const lista = usePropostasOnchain();
  const votos = useVotosOnchain(id);
  const { data: cfg } = useConfigOnchain();
  const { data: carteira } = useMinhaCarteira();
  const { disponivel, conectar } = useCarteiraConectada();
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState<number | null>(null);
  const p = lista.data?.find((x) => x.proposal_id === id);
  const poder = useQuery({
    queryKey: ['onchain', 'poder', id, carteira?.endereco],
    queryFn: () => lerPoderDeVoto(cfg!.governor!, carteira!.endereco, BigInt(p!.bloco_snapshot!)),
    enabled: disponivel && !!cfg?.governor && !!carteira && !!p?.bloco_snapshot,
  });

  if (lista.isLoading) return <Carregando />;
  if (!p) return <Erro erro="Proposta on-chain não encontrada no espelho." aoTentar={lista.refetch} />;
  const titulo = p.descricao.replace(/^\[agora:[0-9a-f-]+\]\s*/i, '');
  const favor = BigInt(p.votos_favor || '0');
  const contra = BigInt(p.votos_contra || '0');
  const total = favor + contra;
  const jaVotei = !!carteira && votos.data?.some((v) => v.eleitor.toLowerCase() === carteira.endereco);

  async function votar(suporte: 0 | 1 | 2) {
    if (!cfg?.governor) return toast.erro('Endereço do Governor não configurado.');
    setEnviando(suporte);
    try {
      await conectar.mutateAsync({});
      const tx = await votarOnchain(cfg.governor, p!.proposal_id, suporte, motivo.trim());
      toast.sucesso('Voto enviado (gas patrocinado). Ele aparece aqui em instantes.');
      void tx;
      votos.refetch();
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setEnviando(null);
    }
  }

  return (
    <Tela aoAtualizar={() => { lista.refetch(); votos.refetch(); }} atualizando={lista.isRefetching}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <ChipTema rotulo={ROTULO_ESTADO_ONCHAIN[p.estado]} icone="link" tom="dourado" />
        {p.modo_voto ? <ChipTema rotulo={`Modo de voto: ${p.modo_voto}`} /> : null}
      </View>
      <Texto variante="titulo">{titulo}</Texto>
      {p.proposta_id_app ? <Texto variante="legenda" cor="primaria" onPress={() => router.push(`/assembleia/proposta/${p.proposta_id_app}`)}>Ver debate e contexto na Assembleia ›</Texto> : null}
      <Card plano style={{ gap: 6 }}>
        <Texto variante="secao" cor="secundario">Placar (poder de voto)</Texto>
        <BarraProgresso valor={total > 0n ? Number((favor * 1000n) / total) / 1000 : 0} cor={c.secundaria} rotulo="Proporção a favor" altura={10} />
        <Texto>A favor {formatarDRC(p.votos_favor)} · Contra {formatarDRC(p.votos_contra)} · Abstenção {formatarDRC(p.abstencoes)}</Texto>
        {p.quorum ? <Texto variante="legenda" cor="secundario">Quórum: {formatarDRC(p.quorum)} DRC de participação (a favor + abstenção)</Texto> : null}
        {p.eta ? <Texto variante="legenda" cor="secundario">Execução pelo Timelock a partir de {formatarDataHora(p.eta)}</Texto> : null}
        {p.bloco_snapshot ? <Texto variante="legenda" cor="sutil">Snapshot no bloco {p.bloco_snapshot} · votação até o bloco {p.bloco_fim}</Texto> : null}
      </Card>
      <Secao titulo="O que será executado">
        {p.acoes.map((a, i) => (
          <Card key={i} plano><Texto variante="corpoForte">{a.funcao}</Texto><Texto variante="legenda" cor="secundario">{a.alvo} · {JSON.stringify(a.args)}</Texto></Card>
        ))}
      </Secao>
      {p.estado === 'ativa' ? (
        <Secao titulo="Seu voto on-chain">
          {!disponivel ? (
            <Card plano><Texto variante="legenda">Votar on-chain exige o app instalado (build EAS) com a carteira embutida configurada. No Expo Go você pode acompanhar, mas não assinar.</Texto></Card>
          ) : !carteira ? (
            <Botao titulo="Ativar minha carteira" onPress={() => router.push('/perfil/carteira')} />
          ) : jaVotei ? (
            <Card destaque="secundaria" plano><Texto>Você já votou nesta proposta.</Texto></Card>
          ) : (
            <>
              <Texto variante="legenda" cor="secundario">Seu poder de voto no snapshot: {poder.data !== undefined ? formatarDRC(poder.data.toString()) : '…'}{poder.data === 0n ? ' — no modo híbrido é preciso ter o selo de reputação (SBT) e DRC delegados.' : ''}</Texto>
              <Campo rotulo="Motivo (opcional, fica público)" value={motivo} onChangeText={setMotivo} />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Botao titulo="A favor" icone="thumbs-up" carregando={enviando === 1} onPress={() => votar(1)} />
                <Botao titulo="Contra" icone="thumbs-down" variante="secundario" carregando={enviando === 0} onPress={() => votar(0)} />
                <Botao titulo="Abster" variante="fantasma" carregando={enviando === 2} onPress={() => votar(2)} />
              </View>
              <Texto variante="legenda" cor="sutil">Um toque assina e envia; o gas é patrocinado pela Ágora.</Texto>
            </>
          )}
        </Secao>
      ) : null}
      <Secao titulo={`Votos registrados (${votos.data?.length ?? 0})`}>
        {votos.data?.map((v) => <ItemLista key={v.eleitor} titulo={encurtarEndereco(v.eleitor)} subtitulo={`${SUPORTE[v.suporte]} · poder ${formatarDRC(v.peso)}${v.motivo ? ` · “${v.motivo}”` : ''}`} />)}
      </Secao>
      {cfg?.explorador && p.tx_criacao ? <Botao titulo="Ver no explorador de blocos" icone="external-link" variante="fantasma" onPress={() => WebBrowser.openBrowserAsync(`${cfg.explorador}/tx/${p.tx_criacao}`)} /> : null}
    </Tela>
  );
}

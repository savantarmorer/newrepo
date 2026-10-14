import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando } from '@/components/Estados';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useConfigOnchain, useDelegacao, useMeusCreditos, useMinhaCarteira, useMovimentos, useSaldoPendente } from '@/features/carteira/hooks';
import { resgatarViaRelayer } from '@/features/carteira/services';
import { useCarteiraConectada } from '@/features/carteira/useCarteiraConectada';
import { lerSaldo, lerVotos, resgatar } from '@/features/carteira/wallet';
import { NOMES_NIVEIS } from '@/lib/constantes';
import { textoDoErro } from '@/lib/erros';
import { encurtarEndereco, formatarData, formatarDRC, formatarNumero } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

/**
 * Carteira — Dracma (DRC) é reconhecimento por contribuição e poder de voto na
 * governança. Não há compra, venda, preço ou cotação no app.
 */
export default function Carteira() {
  const { c } = useTema();
  const qc = useQueryClient();
  const { data: cfg } = useConfigOnchain();
  const carteira = useMinhaCarteira();
  const creditos = useMeusCreditos();
  const pendente = useSaldoPendente();
  const movimentos = useMovimentos(carteira.data?.endereco);
  const delegacao = useDelegacao(carteira.data?.endereco);
  const { disponivel, conectar } = useCarteiraConectada();
  const [resgatando, setResgatando] = useState(false);
  const saldoOnchain = useQuery({
    queryKey: ['carteira', 'saldo-onchain', carteira.data?.endereco],
    queryFn: async () => ({ saldo: await lerSaldo(cfg!.token!, carteira.data!.endereco), votos: await lerVotos(cfg!.token!, carteira.data!.endereco) }),
    enabled: disponivel && !!cfg?.token && !!carteira.data,
  });

  if (carteira.isLoading) return <Carregando />;

  // Saldo espelhado (indexador) para quando não há leitura direta da blockchain
  const end = carteira.data?.endereco;
  const saldoEspelho = (movimentos.data ?? []).reduce((s, m) => s + (m.para === end ? BigInt(m.valor_wei) : 0n) - (m.de === end ? BigInt(m.valor_wei) : 0n), 0n);
  const saldo = saldoOnchain.data?.saldo ?? saldoEspelho;
  const prontos = (creditos.data ?? []).filter((x) => !x.resgatado_tx && x.prova && x.epoca?.status === 'publicada');
  const totalProntos = prontos.reduce((s, x) => s + BigInt(x.valor_wei), 0n);
  const atualizar = () => qc.invalidateQueries({ queryKey: ['carteira'] });

  async function resgatarTudo() {
    setResgatando(true);
    try {
      if (disponivel && cfg?.distribuidor && end) {
        await conectar.mutateAsync({});
        for (const x of prontos) await resgatar(cfg.distribuidor, x.epoca_id, end, x.valor_wei, x.prova!);
      } else {
        await resgatarViaRelayer(prontos.map((x) => x.epoca_id));
      }
      toast.sucesso('Resgate enviado! Sem custo de gas para você.');
      atualizar();
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setResgatando(false);
    }
  }

  if (!carteira.data) {
    return (
      <Tela>
        <EstadoVazio
          ilustracao="templo"
          titulo="Ative sua carteira"
          descricao="Sua carteira é criada automaticamente a partir do seu login — sem frase-semente. Com ela você recebe Dracma (DRC) pelas contribuições verificadas e vota nas decisões on-chain."
          acao={disponivel ? { titulo: 'Criar minha carteira', onPress: () => conectar.mutateAsync({ vincular: true }).then(() => toast.sucesso('Carteira ativada! O selo de reputação será emitido em instantes.')).catch((e) => toast.erro(textoDoErro(e))) } : undefined}
        />
        {!disponivel ? <Card plano><Texto variante="legenda">A carteira embutida precisa do app instalado (build EAS) e do EXPO_PUBLIC_THIRDWEB_CLIENT_ID. No Expo Go você vê seus créditos pendentes abaixo.</Texto></Card> : null}
        <Card plano>
          <Texto variante="secao" cor="secundario">Créditos acumulados</Texto>
          <Texto variante="numero">{formatarNumero(pendente.data ?? 0)} DRC</Texto>
          <Texto variante="legenda" cor="secundario">Viram resgatáveis no fechamento semanal da época, quando você tiver carteira com selo e assinatura ativa.</Texto>
        </Card>
      </Tela>
    );
  }

  return (
    <Tela aoAtualizar={() => { atualizar(); saldoOnchain.refetch(); }} atualizando={carteira.isRefetching}>
      <Card plano style={{ gap: 6 }}>
        <Texto variante="secao" cor="secundario">Saldo</Texto>
        <Texto variante="display" style={{ fontSize: 36 }}>{formatarDRC(saldo.toString())} <Texto variante="subtitulo" cor="secundario">DRC</Texto></Texto>
        {saldoOnchain.data ? <Texto variante="legenda" cor="secundario">Votos delegados a você: {formatarDRC(saldoOnchain.data.votos.toString())}</Texto> : <Texto variante="legenda" cor="sutil">Saldo do espelho do indexador.</Texto>}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <ChipTema rotulo={encurtarEndereco(end)} icone="copy" onPress={async () => { await Clipboard.setStringAsync(end!); toast.sucesso('Endereço copiado.'); }} />
          {carteira.data.sbt_nivel ? <ChipTema rotulo={`Selo · ${NOMES_NIVEIS[carteira.data.sbt_nivel]}`} icone="hexagon" tom="dourado" /> : <ChipTema rotulo="Selo sendo emitido…" tom="primaria" />}
          <ChipTema rotulo={carteira.data.tipo === 'embutida' ? 'Carteira embutida' : 'Carteira externa'} />
        </View>
      </Card>

      <Card plano destaque={totalProntos > 0n ? 'dourado' : undefined} style={{ gap: 6 }}>
        <Texto variante="secao" cor="secundario">Recompensas</Texto>
        <Texto>Prontas para resgate: <Texto variante="corpoForte">{formatarDRC(totalProntos.toString())} DRC</Texto></Texto>
        <Texto variante="legenda" cor="secundario">A creditar na próxima época: {formatarNumero(pendente.data ?? 0)} DRC</Texto>
        {totalProntos > 0n ? <Botao titulo="Resgatar" icone="download" carregando={resgatando} onPress={resgatarTudo} /> : null}
        <Texto variante="legenda" cor="sutil">Resgate sem custo de gas: a Ágora patrocina a transação.</Texto>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Botao titulo="Enviar DRC" icone="send" variante="secundario" desabilitado={!disponivel} onPress={() => router.push('/perfil/carteira/enviar')} />
        <Botao titulo="Delegar votos" icone="users" variante="secundario" desabilitado={!disponivel} onPress={() => router.push('/perfil/carteira/delegar')} />
        {cfg?.explorador ? <Botao titulo="Explorador" icone="external-link" variante="fantasma" onPress={() => WebBrowser.openBrowserAsync(`${cfg.explorador}/address/${end}`)} /> : null}
      </View>
      <Texto variante="legenda" cor="secundario">Delegação atual: {delegacao.data ? (delegacao.data === end ? 'você mesma(o)' : encurtarEndereco(delegacao.data)) : 'automática para você mesma(o)'}</Texto>

      <Secao titulo="Histórico de recompensas">
        {(creditos.data ?? []).length ? creditos.data!.map((x) => (
          <ItemLista key={x.epoca_id} icone="award" titulo={`Época ${x.epoca_id} · ${formatarDRC(x.valor_wei)} DRC`} subtitulo={`${x.epoca ? `${formatarData(x.epoca.inicio)}–${formatarData(x.epoca.fim)}` : ''} · ${x.resgatado_tx ? 'resgatado' : x.prova ? 'pronto para resgate' : 'aguardando publicação'}`} />
        )) : <Texto cor="sutil">Suas recompensas semanais aparecerão aqui.</Texto>}
      </Secao>
      <Secao titulo="Movimentações">
        {(movimentos.data ?? []).map((m) => (
          <ItemLista key={`${m.tx_hash}-${m.log_index}`} icone={m.para === end ? 'arrow-down-left' : 'arrow-up-right'} titulo={`${m.para === end ? '+' : '−'}${formatarDRC(m.valor_wei)} DRC`} subtitulo={`${m.de === '0x0000000000000000000000000000000000000000' ? 'Recompensa' : m.para === end ? `de ${encurtarEndereco(m.de)}` : `para ${encurtarEndereco(m.para)}`} · ${formatarData(m.ocorrido_em)}`}
            onPress={cfg?.explorador ? () => WebBrowser.openBrowserAsync(`${cfg.explorador}/tx/${m.tx_hash}`) : undefined} />
        ))}
        {!movimentos.data?.length ? <Texto cor="sutil">Nenhuma movimentação ainda.</Texto> : null}
      </Secao>
      <Botao titulo="Opções avançadas" variante="fantasma" onPress={() => router.push('/perfil/carteira/avancado')} />
      <View style={{ height: 1, backgroundColor: c.fundo }} />
    </Tela>
  );
}

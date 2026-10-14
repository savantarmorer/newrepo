import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando, Erro } from '@/components/Estados';
import { GraficoBarras } from '@/components/GraficoBarras';
import { Icone } from '@/components/Icone';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useCaixa, useCaixaMensal, useProjeto } from '@/features/mutirao/hooks';
import type { Lancamento } from '@/features/mutirao/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { formatarData, formatarMoeda } from '@/lib/formatos';
import { urlAssinada } from '@/lib/upload';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

function LinhaLancamento({ l, estornado, podeEstornar }: { l: Lancamento; estornado: boolean; podeEstornar: boolean }) {
  const { c } = useTema();
  const entrada = l.tipo === 'entrada';
  return (
    <Card plano style={{ padding: 12, opacity: estornado ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Icone nome={entrada ? 'arrow-down-left' : 'arrow-up-right'} cor={entrada ? c.secundaria : c.primaria} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoForte" style={{ textDecorationLine: estornado ? 'line-through' : 'none' }}>{l.descricao}</Texto>
          <Texto variante="legenda" cor="secundario">{formatarData(l.data)} · {l.categoria} · {l.doacao_id ? 'automático (Pix)' : l.autor?.nome_publico ?? 'Membro removido'}</Texto>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {l.estorno_de ? <ChipTema rotulo="Estorno" tom="dourado" /> : null}
            {estornado ? <ChipTema rotulo="Estornado" tom="primaria" /> : null}
            {l.comprovante_url ? (
              <ChipTema rotulo="Ver comprovante" icone="paperclip" onPress={async () => {
                try {
                  await WebBrowser.openBrowserAsync(await urlAssinada(l.comprovante_url!));
                } catch (e) {
                  toast.erro(textoDoErro(e));
                }
              }} />
            ) : null}
            {podeEstornar && !estornado && !l.estorno_de && !l.doacao_id ? (
              <ChipTema rotulo="Estornar" icone="corner-up-left" onPress={() => router.push({ pathname: '/mutirao/projeto/lancar', params: { projeto: l.projeto_id, estorno: l.id } })} />
            ) : null}
          </View>
        </View>
        <Texto variante="corpoForte" style={{ color: entrada ? c.secundaria : c.primaria }}>{entrada ? '+' : '−'}{formatarMoeda(l.valor)}</Texto>
      </View>
    </Card>
  );
}

/** Caixa transparente: todo membro vê; só a coordenação lança; nada se apaga. */
export default function Caixa() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { data: perfil } = useMeuPerfil();
  const projeto = useProjeto(id);
  const caixa = useCaixa(id);
  const mensal = useCaixaMensal(id);
  if (caixa.isLoading || projeto.isLoading) return <Carregando />;
  if (caixa.error) return <Erro erro={caixa.error} aoTentar={caixa.refetch} />;
  const p = projeto.data?.projeto;
  const coordeno = !!p && (p.coordenador_id === perfil?.id || perfil?.papel === 'admin');
  const lista = caixa.data ?? [];
  const estornados = new Set(lista.filter((l) => l.estorno_de).map((l) => l.estorno_de));

  return (
    <Tela aoAtualizar={() => { caixa.refetch(); mensal.refetch(); projeto.refetch(); }} atualizando={caixa.isRefetching}>
      <Texto variante="subtitulo">{p?.titulo}</Texto>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card plano style={{ flex: 1 }}>
          <Texto variante="legenda" cor="secundario">Saldo</Texto>
          <Texto variante="numero" style={{ fontSize: 24 }} cor={Number(p?.resumo?.saldo ?? 0) >= 0 ? 'secundaria' : 'perigo'}>{formatarMoeda(p?.resumo?.saldo)}</Texto>
        </Card>
        <Card plano style={{ flex: 1 }}>
          <Texto variante="legenda" cor="secundario">Entradas / saídas</Texto>
          <Texto variante="corpoForte" cor="secundaria">{formatarMoeda(p?.resumo?.total_entradas)}</Texto>
          <Texto variante="corpoForte" cor="primaria">{formatarMoeda(p?.resumo?.total_saidas)}</Texto>
        </Card>
      </View>
      {mensal.data?.length ? (
        <Card plano><GraficoBarras dados={mensal.data.map((m) => ({ mes: m.mes, entradas: Number(m.entradas), saidas: Number(m.saidas) }))} largura={width - 64} /></Card>
      ) : null}
      {coordeno && podeNivel(perfil, 4) ? <Botao titulo="Novo lançamento" icone="plus" onPress={() => router.push({ pathname: '/mutirao/projeto/lancar', params: { projeto: id } })} /> : null}
      <Card plano style={{ padding: 12 }}>
        <Texto variante="legenda" cor="secundario">🔒 Lançamentos não podem ser editados nem apagados. Correções são feitas por estorno justificado, que fica visível aqui.</Texto>
      </Card>
      <Secao titulo={`Lançamentos (${lista.length})`}>
        {lista.length ? lista.map((l) => <LinhaLancamento key={l.id} l={l} estornado={estornados.has(l.id)} podeEstornar={coordeno && podeNivel(perfil, 4)} />) : (
          <EstadoVazio ilustracao="maos" titulo="Caixa sem movimentação" descricao="Doações via Pix entram aqui automaticamente." acao={{ titulo: 'Fazer a primeira doação', onPress: () => router.push({ pathname: '/mutirao/doar', params: { projeto: id } }) }} />
        )}
      </Secao>
    </Tela>
  );
}

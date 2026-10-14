import { View } from 'react-native';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMetricas } from '@/features/admin/hooks';
import { formatarMoeda, formatarNumero } from '@/lib/formatos';

export default function Metricas() {
  const { data, isLoading, error, refetch, isRefetching } = useMetricas();
  if (isLoading) return <Carregando />;
  if (error || !data) return <Erro erro={error} aoTentar={refetch} />;
  const cards = [
    { rotulo: 'Membros ativos', valor: formatarNumero(data.membros_ativos), detalhe: `de ${formatarNumero(data.membros_total)} cadastrados` },
    { rotulo: 'Artigos publicados', valor: formatarNumero(data.artigos_publicados), detalhe: `${data.artigos_em_revisao} em revisão` },
    { rotulo: 'Horas de voluntariado', valor: `${formatarNumero(data.horas_confirmadas)}h`, detalhe: 'confirmadas' },
    { rotulo: 'Denúncias abertas', valor: formatarNumero(data.denuncias_abertas), detalhe: `${data.propostas_em_votacao} propostas em votação` },
  ];
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {cards.map((c) => (
          <Card key={c.rotulo} plano style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Texto variante="legenda" cor="secundario">{c.rotulo}</Texto>
            <Texto variante="numero">{c.valor}</Texto>
            <Texto variante="legenda" cor="sutil">{c.detalhe}</Texto>
          </Card>
        ))}
      </View>
      <Secao titulo="Arrecadado e gasto por projeto">
        {data.projetos.map((p) => (
          <Card key={p.id} plano style={{ padding: 12 }}>
            <Texto variante="corpoForte">{p.titulo}</Texto>
            <Texto variante="legenda" cor="secundario">Arrecadado {formatarMoeda(p.arrecadado)} · Gasto {formatarMoeda(p.gasto)} · Saldo {formatarMoeda(p.saldo)}</Texto>
          </Card>
        ))}
      </Secao>
    </Tela>
  );
}

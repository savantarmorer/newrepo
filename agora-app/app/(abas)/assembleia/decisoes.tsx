import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Campo } from '@/components/Campo';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { MarkdownView } from '@/components/MarkdownView';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useDecisoes } from '@/features/assembleia/hooks';
import { ROTULO_TIPO } from '@/features/assembleia/types';
import { formatarDataLonga } from '@/lib/formatos';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Arquivo pesquisável e imutável de todas as decisões */
export default function Decisoes() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useDecisoes();
  const [busca, setBusca] = useState('');
  const lista = useMemo(() => {
    const t = normalizar(busca.trim());
    return (data ?? []).filter((d) => !t || normalizar(`${d.proposta?.titulo ?? ''} ${d.resumo_md}`).includes(t));
  }, [data, busca]);
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <Texto cor="secundario">Cada decisão é registrada uma única vez e nunca pode ser alterada — nem por administradores.</Texto>
      <Campo rotulo="Buscar no arquivo" value={busca} onChangeText={setBusca} placeholder="Palavra-chave" />
      {isLoading ? <SkeletonLista /> : error ? <Erro erro={error} aoTentar={refetch} /> : lista.length ? lista.map((d) => (
        <Card key={d.id} plano destaque={d.id === id ? 'dourado' : d.resultado === 'aprovada' ? 'secundaria' : d.resultado === 'bloqueada' ? 'perigo' : undefined} onPress={() => router.push(`/assembleia/proposta/${d.proposta_id}`)} rotulo={`Decisão sobre ${d.proposta?.titulo}`}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <ChipTema rotulo={d.resultado === 'aprovada' ? 'Aprovada' : d.resultado === 'bloqueada' ? 'Bloqueada' : 'Rejeitada'} tom={d.resultado === 'aprovada' ? 'secundaria' : 'primaria'} />
            {d.proposta ? <ChipTema rotulo={ROTULO_TIPO[d.proposta.tipo]} /> : null}
            {d.rodada > 1 ? <ChipTema rotulo={`Rodada ${d.rodada}`} /> : null}
          </View>
          <Texto variante="corpoForte">{d.proposta?.titulo}</Texto>
          <MarkdownView texto={d.resumo_md} />
          <Texto variante="legenda" cor="secundario">{d.votos_favor} a favor · {d.votos_contra} contra · {d.abstencoes} abst. · {d.bloqueios} bloqueios · {formatarDataLonga(d.registrada_em)}</Texto>
        </Card>
      )) : <EstadoVazio ilustracao="urna" titulo={busca ? 'Nada encontrado' : 'Nenhuma decisão registrada'} descricao={busca ? 'Tente outra palavra.' : 'As decisões aparecem aqui ao fim de cada votação.'} />}
    </Tela>
  );
}

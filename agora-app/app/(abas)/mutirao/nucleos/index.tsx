import { router } from 'expo-router';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { ItemLista } from '@/components/ItemLista';
import { Secao } from '@/components/Secao';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { useNucleos } from '@/features/perfil/hooks';

export default function Nucleos() {
  const { data, isLoading, error, refetch, isRefetching } = useNucleos();
  const porEstado = (data ?? []).reduce<Record<string, NonNullable<typeof data>>>((acc, n) => {
    (acc[n.estado] ??= []).push(n);
    return acc;
  }, {});
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      {isLoading ? <SkeletonLista /> : error ? <Erro erro={error} aoTentar={refetch} /> : Object.keys(porEstado).length ? (
        Object.entries(porEstado).map(([uf, lista]) => (
          <Secao key={uf} titulo={uf}>
            {lista.map((n) => <ItemLista key={n.id} icone="map-pin" titulo={n.cidade} subtitulo={n.descricao ?? undefined} onPress={() => router.push(`/mutirao/nucleos/${n.id}`)} />)}
          </Secao>
        ))
      ) : (
        <EstadoVazio titulo="Nenhum núcleo ainda" descricao="Núcleos locais são criados pela administração a pedido dos membros de uma cidade." />
      )}
    </Tela>
  );
}

import { router } from 'expo-router';
import { Botao } from '@/components/Botao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { CardArtigo } from '@/features/biblioteca/componentes';
import { useMeusArtigos } from '@/features/biblioteca/hooks';

export default function MeusArtigos() {
  const { data, isLoading, error, refetch, isRefetching } = useMeusArtigos();
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <Botao titulo="Novo artigo" icone="plus" onPress={() => router.push('/biblioteca/artigo/editor')} />
      {isLoading ? <SkeletonLista /> : error ? <Erro erro={error} aoTentar={refetch} /> : data?.length ? (
        data.map((a) => <CardArtigo key={a.id} a={a} compacto />)
      ) : (
        <EstadoVazio ilustracao="livro" titulo="Você ainda não escreveu artigos" descricao="Comece por um tópico que rendeu boa conversa e use “Transformar em artigo”." acao={{ titulo: 'Escrever agora', onPress: () => router.push('/biblioteca/artigo/editor') }} />
      )}
    </Tela>
  );
}

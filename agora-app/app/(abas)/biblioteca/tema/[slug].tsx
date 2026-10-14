import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { ListaPaginada } from '@/components/ListaPaginada';
import { Segmentos } from '@/components/Segmentos';
import { SkeletonLista } from '@/components/Skeleton';
import { Texto } from '@/components/Texto';
import { CardArtigo, CardTopico, CardTrilha } from '@/features/biblioteca/componentes';
import { useArtigos, useTema as useTemaBiblioteca, useTopicos, useTrilhas } from '@/features/biblioteca/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { useTema } from '@/theme/ThemeProvider';

type Aba = 'topicos' | 'artigos' | 'trilhas';

export default function TelaTema() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { c, espaco } = useTema();
  const [aba, setAba] = useState<Aba>('topicos');
  const { data: tema, error } = useTemaBiblioteca(slug);
  const { data: perfil } = useMeuPerfil();
  const topicos = useTopicos({ temaId: tema?.id }, !!tema && aba === 'topicos');
  const artigos = useArtigos({ temaId: tema?.id });
  const trilhas = useTrilhas({ temaId: tema?.id });

  if (error) return <Erro erro={error} />;

  const cabecalho = (
    <View style={{ gap: espaco.md, marginBottom: espaco.sm }}>
      {tema?.descricao ? <Texto cor="secundario">{tema.descricao}</Texto> : null}
      <Segmentos
        opcoes={[{ valor: 'topicos', rotulo: 'Tópicos' }, { valor: 'artigos', rotulo: 'Artigos' }, { valor: 'trilhas', rotulo: 'Trilhas' }]}
        valor={aba}
        aoMudar={(v) => setAba(v as Aba)}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <Stack.Screen options={{ title: tema?.nome ?? 'Tema' }} />
      {aba === 'topicos' ? (
        <ListaPaginada
          cabecalho={cabecalho}
          dados={topicos.data?.pages.flatMap((p) => p.itens) ?? []}
          chave={(t) => t.id}
          render={({ item }) => <CardTopico t={item} />}
          aoAtualizar={() => topicos.refetch()}
          atualizando={topicos.isRefetching}
          aoFim={() => topicos.hasNextPage && topicos.fetchNextPage()}
          carregandoMais={topicos.isFetchingNextPage}
          vazio={topicos.isLoading ? <SkeletonLista /> : (
            <EstadoVazio
              titulo="Nenhum tópico aqui ainda"
              descricao="Comece a conversa: uma boa pergunta já é uma contribuição."
              acao={podeNivel(perfil, 2) ? { titulo: 'Criar tópico', onPress: () => router.push({ pathname: '/biblioteca/topico/novo', params: { tema: tema?.id } }) } : undefined}
            />
          )}
        />
      ) : aba === 'artigos' ? (
        <ListaPaginada
          cabecalho={cabecalho}
          dados={artigos.data?.pages.flatMap((p) => p.itens) ?? []}
          chave={(a) => a.id}
          render={({ item }) => <CardArtigo a={item} />}
          aoAtualizar={() => artigos.refetch()}
          atualizando={artigos.isRefetching}
          aoFim={() => artigos.hasNextPage && artigos.fetchNextPage()}
          carregandoMais={artigos.isFetchingNextPage}
          vazio={artigos.isLoading ? <SkeletonLista /> : (
            <EstadoVazio ilustracao="livro" titulo="Nenhum artigo publicado" descricao="Tópicos ricos podem virar artigos revisados por curadores." acao={podeNivel(perfil, 2) ? { titulo: 'Escrever artigo', onPress: () => router.push({ pathname: '/biblioteca/artigo/editor', params: { tema: tema?.id } }) } : undefined} />
          )}
        />
      ) : (
        <ListaPaginada
          cabecalho={cabecalho}
          dados={trilhas.data ?? []}
          chave={(t) => t.id}
          render={({ item }) => <CardTrilha t={item} />}
          aoAtualizar={() => trilhas.refetch()}
          atualizando={trilhas.isRefetching}
          vazio={trilhas.isLoading ? <SkeletonLista /> : (
            <EstadoVazio ilustracao="livro" titulo="Nenhuma trilha ainda" descricao="Que tal montar a primeira?" acao={podeNivel(perfil, 3) ? { titulo: 'Montar trilha', onPress: () => router.push('/biblioteca/trilha/montar') } : undefined} />
          )}
        />
      )}
    </View>
  );
}

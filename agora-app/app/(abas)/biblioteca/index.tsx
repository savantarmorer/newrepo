import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Secao } from '@/components/Secao';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { CardArtigo, CardTopico, CardTrilha } from '@/features/biblioteca/componentes';
import { useArtigos, useTemas, useTopicos, useTrilhas, useTrilhasEmAndamento } from '@/features/biblioteca/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { useTema } from '@/theme/ThemeProvider';

/** Início da Biblioteca — ordem cronológica ou por curadoria, nunca por engajamento. */
export default function BibliotecaInicio() {
  const { espaco } = useTema();
  const { data: perfil } = useMeuPerfil();
  const { data: temas } = useTemas();
  const andamento = useTrilhasEmAndamento();
  const destaques = useTrilhas({ destaque: true });
  const artigos = useArtigos({});
  const temaIds = (temas ?? []).filter((t) => perfil?.interesses?.includes(t.slug)).map((t) => t.id);
  const topicos = useTopicos({ temaIds }, !!temas);
  const atualizando = andamento.isRefetching || artigos.isRefetching || topicos.isRefetching;
  const atualizar = () => {
    andamento.refetch();
    destaques.refetch();
    artigos.refetch();
    topicos.refetch();
  };

  return (
    <Tela aoAtualizar={atualizar} atualizando={atualizando}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
        <Botao titulo="Temas" icone="grid" variante="secundario" compacto onPress={() => router.push('/biblioteca/temas')} />
        <Botao titulo="Acervo" icone="archive" variante="secundario" compacto onPress={() => router.push('/biblioteca/acervo')} />
        {podeNivel(perfil, 2) ? <Botao titulo="Novo tópico" icone="edit-3" variante="secundario" compacto onPress={() => router.push('/biblioteca/topico/novo')} /> : null}
        {podeNivel(perfil, 2) ? <Botao titulo="Meus artigos" icone="file-text" variante="secundario" compacto onPress={() => router.push('/biblioteca/meus-artigos')} /> : null}
        {podeNivel(perfil, 3) ? <Botao titulo="Fila de revisão" icone="check-square" variante="secundario" compacto onPress={() => router.push('/biblioteca/revisao')} /> : null}
        {podeNivel(perfil, 3) ? <Botao titulo="Montar trilha" icone="map" variante="secundario" compacto onPress={() => router.push('/biblioteca/trilha/montar')} /> : null}
      </ScrollView>

      {andamento.data?.length ? (
        <Secao titulo="Continue de onde parou">
          {andamento.data.map((a) => <CardTrilha key={a.trilha.id} t={a.trilha} feitos={a.feitos} total={a.total} />)}
        </Secao>
      ) : null}

      <Secao titulo="Trilhas em destaque">
        {destaques.isLoading ? <SkeletonLista itens={1} /> : destaques.data?.length ? (
          destaques.data.map((t) => <CardTrilha key={t.id} t={t} />)
        ) : (
          <EstadoVazio
            ilustracao="livro"
            titulo="Nenhuma trilha em destaque"
            descricao="Trilhas reúnem artigos numa ordem pensada para aprender."
            acao={podeNivel(perfil, 3) ? { titulo: 'Montar a primeira', onPress: () => router.push('/biblioteca/trilha/montar') } : undefined}
          />
        )}
      </Secao>

      <Secao titulo="Artigos recentes" acao={{ rotulo: 'Ver por tema', onPress: () => router.push('/biblioteca/temas') }}>
        {artigos.isLoading ? <SkeletonLista itens={2} /> : (artigos.data?.pages[0]?.itens ?? []).slice(0, 4).map((a) => <CardArtigo key={a.id} a={a} />)}
        {!artigos.isLoading && !artigos.data?.pages[0]?.itens.length ? (
          <EstadoVazio ilustracao="livro" titulo="A estante está vazia" descricao="Que tal transformar uma boa discussão no primeiro artigo?" />
        ) : null}
      </Secao>

      <Secao titulo={temaIds.length ? 'Tópicos ativos nos seus temas' : 'Tópicos ativos'}>
        {topicos.isLoading ? <SkeletonLista itens={3} /> : (topicos.data?.pages[0]?.itens ?? []).slice(0, 6).map((t) => <CardTopico key={t.id} t={t} />)}
        {!topicos.isLoading && !topicos.data?.pages[0]?.itens.length ? (
          <EstadoVazio
            titulo="Silêncio na praça"
            descricao="Nenhum tópico nos seus temas ainda. Abra a primeira conversa!"
            acao={podeNivel(perfil, 2) ? { titulo: 'Criar tópico', onPress: () => router.push('/biblioteca/topico/novo') } : { titulo: 'Explorar temas', onPress: () => router.push('/biblioteca/temas') }}
          />
        ) : null}
      </Secao>
      <View style={{ height: 8 }} />
    </Tela>
  );
}

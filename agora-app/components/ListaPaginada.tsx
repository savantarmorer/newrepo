import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, type ListRenderItem } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';

interface Props<T> {
  dados: T[];
  render: ListRenderItem<T>;
  chave: (item: T) => string;
  aoAtualizar: () => void;
  atualizando: boolean;
  aoFim?: () => void;
  carregandoMais?: boolean;
  vazio?: ReactElement;
  cabecalho?: ReactElement;
}

/** Lista com pull-to-refresh e paginação por cursor (sem rolagem infinita automática no feed:
 *  a próxima página só carrega quando a pessoa chega ao fim da lista). */
export function ListaPaginada<T>({ dados, render, chave, aoAtualizar, atualizando, aoFim, carregandoMais, vazio, cabecalho }: Props<T>) {
  const { c, espaco } = useTema();
  return (
    <FlatList
      data={dados}
      renderItem={render}
      keyExtractor={chave}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.gigante }}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={c.primaria} colors={[c.primaria]} />}
      onEndReachedThreshold={0.3}
      onEndReached={aoFim}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={vazio}
      ListFooterComponent={carregandoMais ? <View style={{ padding: 16 }}><ActivityIndicator color={c.primaria} /></View> : null}
    />
  );
}

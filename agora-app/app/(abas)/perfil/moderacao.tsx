import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { ListaPaginada } from '@/components/ListaPaginada';
import { Texto } from '@/components/Texto';
import { logPublico, ROTULO_ACAO, ROTULO_ITEM, rotaDoItem } from '@/features/moderacao/services';
import { formatarDataHora } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';

/** Toda ação de moderação é pública para os membros (transparência). */
export default function LogModeracao() {
  const { c } = useTema();
  const q = useInfiniteQuery({
    queryKey: ['moderacao', 'log'],
    queryFn: ({ pageParam }) => logPublico(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (u) => (u.length === 30 ? u[u.length - 1]!.criado_em : null),
  });
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <ListaPaginada
        cabecalho={<Texto cor="secundario" style={{ marginBottom: 8 }}>Quem moderou, o quê e por quê. Quem denunciou nunca é exposto.</Texto>}
        dados={q.data?.pages.flat() ?? []}
        chave={(r) => r.id}
        render={({ item }) => {
          const rota = rotaDoItem(item.item_tipo, item.item_id);
          return (
            <Card plano onPress={rota ? () => router.push(rota as never) : undefined} rotulo={`${ROTULO_ACAO[item.acao]} em ${ROTULO_ITEM[item.item_tipo]}`}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <ChipTema rotulo={ROTULO_ACAO[item.acao]} tom={item.acao === 'ocultar' || item.acao === 'suspender' ? 'primaria' : 'secundaria'} />
                <ChipTema rotulo={ROTULO_ITEM[item.item_tipo]} />
              </View>
              <Texto>{item.motivo}</Texto>
              <Texto variante="legenda" cor="sutil">{item.moderador_nome ?? 'Moderação'} · {formatarDataHora(item.criado_em)}</Texto>
            </Card>
          );
        }}
        aoAtualizar={() => q.refetch()}
        atualizando={q.isRefetching}
        aoFim={() => q.hasNextPage && q.fetchNextPage()}
        carregandoMais={q.isFetchingNextPage}
        vazio={<EstadoVazio titulo="Nenhuma ação de moderação" descricao="Sinal de uma praça saudável." />}
      />
    </View>
  );
}

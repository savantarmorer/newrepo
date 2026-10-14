import { router } from 'expo-router';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { EstadoVazio } from '@/components/EstadoVazio';
import { ListaPaginada } from '@/components/ListaPaginada';
import { Texto } from '@/components/Texto';
import { useMarcarLidas, useNotificacoes } from '@/features/notificacoes/hooks';
import { tempoRelativo } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';

export default function Notificacoes() {
  const { c } = useTema();
  const q = useNotificacoes();
  const marcar = useMarcarLidas();
  const lista = q.data?.pages.flat() ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <ListaPaginada
        cabecalho={lista.some((n) => !n.lida) ? <Botao titulo="Marcar todas como lidas" compacto variante="fantasma" onPress={() => marcar.mutate(undefined)} /> : undefined}
        dados={lista}
        chave={(n) => n.id}
        render={({ item: n }) => (
          <Card plano destaque={n.lida ? undefined : 'primaria'} onPress={() => {
            if (!n.lida) marcar.mutate(n.id);
            if (n.link?.startsWith('/')) router.push(n.link as never);
          }} rotulo={`${n.lida ? '' : 'Não lida. '}${n.titulo}`}>
            <Texto variante={n.lida ? 'corpo' : 'corpoForte'}>{n.titulo}</Texto>
            {n.corpo ? <Texto variante="legenda" cor="secundario">{n.corpo}</Texto> : null}
            <Texto variante="legenda" cor="sutil">{tempoRelativo(n.created_at)}</Texto>
          </Card>
        )}
        aoAtualizar={() => q.refetch()}
        atualizando={q.isRefetching}
        aoFim={() => q.hasNextPage && q.fetchNextPage()}
        carregandoMais={q.isFetchingNextPage}
        vazio={<EstadoVazio ilustracao="sino" titulo="Tudo em silêncio" descricao="Você só recebe avisos sobre o que é seu ou precisa da sua ação. Nada de “você pode ter perdido”." acao={{ titulo: 'Escolher notificações', onPress: () => router.push('/perfil/notificacoes-config') }} />}
      />
    </View>
  );
}

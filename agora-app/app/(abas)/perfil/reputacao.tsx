import { View } from 'react-native';
import { Card } from '@/components/Card';
import { EstadoVazio } from '@/components/EstadoVazio';
import { ListaPaginada } from '@/components/ListaPaginada';
import { Texto } from '@/components/Texto';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { useHistoricoReputacao } from '@/features/reputacao/hooks';
import { ROTULOS_ACAO_REPUTACAO } from '@/lib/constantes';
import { formatarData } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';

/** Histórico de pontos — só no perfil, sem ranking nem placar público */
export default function Reputacao() {
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const q = useHistoricoReputacao(perfil?.id);
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <ListaPaginada
        cabecalho={<Texto cor="secundario" style={{ marginBottom: 8 }}>Pontos vêm de contribuições verificáveis e são calculados pelo banco de dados — ninguém edita à mão. Não existe ranking.</Texto>}
        dados={q.data?.pages.flat() ?? []}
        chave={(e) => e.id}
        render={({ item }) => (
          <Card plano style={{ padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Texto>{ROTULOS_ACAO_REPUTACAO[item.acao] ?? item.acao}</Texto>
                <Texto variante="legenda" cor="sutil">{formatarData(item.criado_em)}</Texto>
              </View>
              <Texto variante="corpoForte" cor={item.pontos >= 0 ? 'secundaria' : 'perigo'}>{item.pontos >= 0 ? '+' : ''}{item.pontos}</Texto>
            </View>
          </Card>
        )}
        aoAtualizar={() => q.refetch()}
        atualizando={q.isRefetching}
        aoFim={() => q.hasNextPage && q.fetchNextPage()}
        carregandoMais={q.isFetchingNextPage}
        vazio={<EstadoVazio titulo="Nenhum ponto ainda" descricao="Responda tópicos, participe de mutirões, revise artigos — tudo conta." />}
      />
    </View>
  );
}

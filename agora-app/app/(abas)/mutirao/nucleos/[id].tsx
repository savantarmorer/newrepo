import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando, Erro } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { CardEvento, CardProjeto } from '@/features/mutirao/componentes';
import { useNucleo } from '@/features/mutirao/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { plural } from '@/lib/formatos';

export default function TelaNucleo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: perfil } = useMeuPerfil();
  const q = useNucleo(id);
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Núcleo não encontrado'} />;
  const { nucleo, coordenador, totalMembros, membros, projetos, eventos } = q.data;
  const coordeno = nucleo.coordenador_id === perfil?.id || perfil?.papel === 'admin';
  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Stack.Screen options={{ title: nucleo.cidade }} />
      <Texto variante="titulo">{nucleo.cidade} · {nucleo.estado}</Texto>
      {nucleo.descricao ? <Texto cor="secundario">{nucleo.descricao}</Texto> : null}
      <Card plano>
        <Texto variante="legenda" cor="secundario">Coordenação</Texto>
        {coordenador ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <Avatar nome={coordenador.nome_publico} url={coordenador.avatar_url} />
            <Texto variante="corpoForte" onPress={() => router.push(`/perfil/membro/${coordenador.id}`)}>{coordenador.nome_publico}</Texto>
          </View>
        ) : <Texto>Sem coordenação definida</Texto>}
        <Texto variante="legenda" cor="secundario" style={{ marginTop: 8 }}>{plural(totalMembros, 'membro')}</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }} accessibilityLabel="Alguns membros do núcleo">
          {membros.map((m) => m && <Avatar key={m.id} nome={m.nome_publico} url={m.avatar_url} tamanho={30} />)}
        </View>
      </Card>
      {coordeno ? <Botao titulo="Criar evento do núcleo" icone="calendar" variante="secundario" onPress={() => router.push({ pathname: '/mutirao/evento/novo', params: { nucleo: nucleo.id } })} /> : null}
      <Secao titulo="Projetos locais">
        {projetos.length ? projetos.map((p) => <CardProjeto key={p.id} p={p} />) : <EstadoVazio ilustracao="maos" titulo="Nenhum projeto local" descricao="Converse com o núcleo e proponha uma ação." />}
      </Secao>
      <Secao titulo="Próximos eventos">
        {eventos.length ? eventos.map((e) => <CardEvento key={e.id} e={e} />) : <Texto cor="sutil">Nenhum evento marcado.</Texto>}
      </Secao>
    </Tela>
  );
}

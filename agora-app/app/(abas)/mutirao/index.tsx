import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Erro } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Segmentos } from '@/components/Segmentos';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { useState } from 'react';
import { CardEvento, CardProjeto, CardTarefa } from '@/features/mutirao/componentes';
import { useEventos, useMinhasTarefas, useProjetos } from '@/features/mutirao/hooks';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { CAUSAS } from '@/lib/constantes';
import { usePreferencias } from '@/stores/preferencias';
import { useTema } from '@/theme/ThemeProvider';

export default function MutiraoInicio() {
  const { espaco } = useTema();
  const { data: perfil } = useMeuPerfil();
  const filtro = usePreferencias((s) => s.filtroMutirao);
  const definirFiltro = usePreferencias((s) => s.definirFiltroMutirao);
  const [causa, setCausa] = useState<string | null>(null);
  const nucleoId = filtro === 'meu_nucleo' ? perfil?.nucleo_id ?? null : null;
  const projetos = useProjetos({ nucleoId, causa, status: ['ativo', 'planejamento'] });
  const eventos = useEventos({ nucleoId, limite: 5 });
  const tarefas = useMinhasTarefas();
  const atualizar = () => {
    projetos.refetch();
    eventos.refetch();
    tarefas.refetch();
  };

  return (
    <Tela aoAtualizar={atualizar} atualizando={projetos.isRefetching}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
        <Botao titulo="Check-in" icone="camera" variante="secundario" compacto onPress={() => router.push('/mutirao/evento/checkin')} />
        <Botao titulo="Núcleos" icone="map-pin" variante="secundario" compacto onPress={() => router.push('/mutirao/nucleos')} />
        {podeNivel(perfil, 4) ? <Botao titulo="Novo projeto" icone="plus" variante="secundario" compacto onPress={() => router.push('/mutirao/projeto/novo')} /> : null}
      </ScrollView>

      {tarefas.data?.length ? (
        <Secao titulo="Minhas tarefas">
          {tarefas.data.slice(0, 4).map((t) => <CardTarefa key={t.id} t={t} mostrarProjeto />)}
        </Secao>
      ) : null}

      <Secao titulo="Projetos">
        <Segmentos
          opcoes={[{ valor: 'meu_nucleo', rotulo: perfil?.nucleo_id ? 'Meu núcleo' : 'Meu núcleo (nenhum)' }, { valor: 'todos', rotulo: 'Todos' }]}
          valor={filtro}
          aoMudar={(v) => definirFiltro(v as 'meu_nucleo' | 'todos')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <ChipTema rotulo="Todas as causas" selecionado={!causa} onPress={() => setCausa(null)} />
          {CAUSAS.map((cz) => <ChipTema key={cz} rotulo={cz} selecionado={causa === cz} onPress={() => setCausa(causa === cz ? null : cz)} />)}
        </ScrollView>
        {projetos.isLoading ? <SkeletonLista itens={2} /> : projetos.error ? <Erro erro={projetos.error} aoTentar={projetos.refetch} /> : projetos.data?.length ? (
          projetos.data.map((p) => <CardProjeto key={p.id} p={p} />)
        ) : (
          <EstadoVazio
            ilustracao="maos"
            titulo="Nenhum projeto por aqui"
            descricao={filtro === 'meu_nucleo' ? 'Seu núcleo ainda não tem projetos ativos. Veja os de outras cidades ou proponha um!' : 'Que tal organizar a primeira ação?'}
            acao={filtro === 'meu_nucleo' ? { titulo: 'Ver todos', onPress: () => definirFiltro('todos') } : podeNivel(perfil, 4) ? { titulo: 'Criar projeto', onPress: () => router.push('/mutirao/projeto/novo') } : undefined}
          />
        )}
      </Secao>

      <Secao titulo="Próximos eventos">
        {eventos.data?.length ? eventos.data.map((e) => <CardEvento key={e.id} e={e} />) : (
          <EstadoVazio ilustracao="maos" titulo="Agenda livre" descricao="Nenhum evento marcado. Coordenações de núcleo e projeto podem criar encontros." />
        )}
      </Secao>
      <View style={{ height: 8 }} />
    </Tela>
  );
}

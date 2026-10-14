import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { abrirDenuncia } from '@/components/BarraAcoes';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { ChipTema } from '@/components/ChipTema';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Carregando, Erro } from '@/components/Estados';
import { ItemLista } from '@/components/ItemLista';
import { MarkdownView } from '@/components/MarkdownView';
import { Secao } from '@/components/Secao';
import { Segmentos } from '@/components/Segmentos';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { CardEvento, CardTarefa, MetaFinanceira } from '@/features/mutirao/componentes';
import { useCaixa, useEventos, useInvalidarMutirao, useProjeto, useTarefas } from '@/features/mutirao/hooks';
import * as s from '@/features/mutirao/services';
import { ROTULO_STATUS_PROJETO, ROTULO_STATUS_TAREFA, type StatusTarefa } from '@/features/mutirao/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { podeNivel } from '@/features/perfil/types';
import { textoDoErro } from '@/lib/erros';
import { formatarData, formatarMoeda } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

type Aba = 'tarefas' | 'voluntarios' | 'eventos' | 'caixa';

export default function TelaProjeto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, espaco, raio } = useTema();
  const [aba, setAba] = useState<Aba>('tarefas');
  const { data: perfil } = useMeuPerfil();
  const q = useProjeto(id);
  const tarefas = useTarefas(id);
  const eventos = useEventos({ projetoId: id, futuros: false });
  const caixa = useCaixa(id);
  const invalidar = useInvalidarMutirao();

  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Projeto não encontrado'} aoTentar={q.refetch} />;
  const { projeto: p, membros } = q.data;
  const coordeno = p.coordenador_id === perfil?.id || membros.some((m) => m.profile_id === perfil?.id && m.papel === 'coordenador') || perfil?.papel === 'admin';
  const participo = membros.some((m) => m.profile_id === perfil?.id);
  const encerrado = p.status === 'concluido' || p.status === 'cancelado';

  async function acao(fn: () => Promise<unknown>, msg: string) {
    try {
      await fn();
      invalidar();
      toast.sucesso(msg);
    } catch (e) {
      toast.erro(textoDoErro(e));
    }
  }

  const colunas: StatusTarefa[] = ['a_fazer', 'fazendo', 'feito'];

  return (
    <Tela aoAtualizar={() => { q.refetch(); tarefas.refetch(); caixa.refetch(); }} atualizando={q.isRefetching}>
      <Stack.Screen options={{ title: 'Projeto' }} />
      {p.capa_url ? <Image source={{ uri: p.capa_url }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: raio.lg }} contentFit="cover" accessibilityLabel="Capa do projeto" /> : null}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <ChipTema rotulo={p.causa} tom="secundaria" />
          <ChipTema rotulo={ROTULO_STATUS_PROJETO[p.status]} tom={p.status === 'ativo' ? 'primaria' : 'dourado'} />
          {p.nucleo ? <ChipTema rotulo={`${p.nucleo.cidade} · ${p.nucleo.estado}`} icone="map-pin" /> : null}
        </View>
        <Texto variante="titulo">{p.titulo}</Texto>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/perfil/membro/${p.coordenador_id}`)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Avatar nome={p.coordenador?.nome_publico} url={p.coordenador?.avatar_url} tamanho={28} />
          <Texto variante="legenda" cor="secundario">Coordenação: {p.coordenador?.nome_publico}</Texto>
        </Pressable>
        {p.data_inicio ? <Texto variante="legenda" cor="sutil">{formatarData(p.data_inicio)}{p.data_fim ? ` até ${formatarData(p.data_fim)}` : ''}</Texto> : null}
      </View>
      <MetaFinanceira p={p} />
      {!encerrado ? (
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Botao titulo="Doar" icone="heart" onPress={() => router.push({ pathname: '/mutirao/doar', params: { projeto: p.id } })} />
          {participo ? (
            !coordeno ? <Botao titulo="Sair do projeto" variante="fantasma" onPress={() => acao(() => s.sairDoProjeto(p.id), 'Você saiu do projeto.')} /> : null
          ) : (
            <Botao titulo="Quero ajudar" icone="user-plus" variante="secundario" onPress={() => acao(() => s.entrarNoProjeto(p.id), 'Bem-vinda(o) ao projeto! Assuma uma tarefa livre.')} />
          )}
        </View>
      ) : null}
      {p.oculto ? <Texto cor="sutil">Descrição removida pela moderação.</Texto> : <MarkdownView texto={p.descricao_md} />}

      {coordeno && !encerrado ? (
        <Card plano style={{ gap: 8 }}>
          <Texto variante="secao" cor="secundario">Coordenação</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Botao titulo="Nova tarefa" icone="plus" compacto variante="secundario" onPress={() => router.push({ pathname: '/mutirao/tarefa/nova', params: { projeto: p.id } })} />
            {podeNivel(perfil, 4) ? <Botao titulo="Lançar no caixa" icone="dollar-sign" compacto variante="secundario" onPress={() => router.push({ pathname: '/mutirao/projeto/lancar', params: { projeto: p.id } })} /> : null}
            <Botao titulo="Horas a confirmar" icone="clock" compacto variante="secundario" onPress={() => router.push({ pathname: '/mutirao/projeto/horas', params: { id: p.id } })} />
            <Botao titulo="Novo evento" icone="calendar" compacto variante="secundario" onPress={() => router.push({ pathname: '/mutirao/evento/novo', params: { projeto: p.id, nucleo: p.nucleo_id ?? '' } })} />
            <Botao titulo="Editar" icone="edit-2" compacto variante="secundario" onPress={() => router.push({ pathname: '/mutirao/projeto/novo', params: { id: p.id } })} />
            {p.status === 'planejamento' ? <Botao titulo="Ativar" compacto onPress={() => acao(() => s.salvarProjeto({ ...p, status: 'ativo' }), 'Projeto ativo!')} /> : null}
            {p.status === 'ativo' ? (
              <Botao titulo="Concluir projeto" compacto icone="check-circle" onPress={() =>
                Alert.alert('Concluir projeto?', 'O caixa continua público. Esta ação não pode ser desfeita.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Concluir', onPress: () => acao(() => s.salvarProjeto({ ...p, status: 'concluido' }), 'Projeto concluído. Obrigado!') },
                ])}
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      <Segmentos
        opcoes={[
          { valor: 'tarefas', rotulo: 'Tarefas', contagem: tarefas.data?.filter((t) => t.status !== 'feito').length },
          { valor: 'voluntarios', rotulo: 'Pessoas', contagem: membros.length },
          { valor: 'eventos', rotulo: 'Eventos' },
          { valor: 'caixa', rotulo: 'Caixa' },
        ]}
        valor={aba}
        aoMudar={(v) => setAba(v as Aba)}
      />

      {aba === 'tarefas' ? (
        tarefas.data?.length ? (
          colunas.map((col) => {
            const lista = tarefas.data.filter((t) => t.status === col);
            return (
              <Secao key={col} titulo={`${ROTULO_STATUS_TAREFA[col]} (${lista.length})`}>
                {lista.length ? lista.map((t) => <CardTarefa key={t.id} t={t} />) : <Texto variante="legenda" cor="sutil">Nada aqui.</Texto>}
              </Secao>
            );
          })
        ) : (
          <EstadoVazio ilustracao="maos" titulo="Sem tarefas ainda" descricao="O quadro de tarefas organiza quem faz o quê." acao={coordeno ? { titulo: 'Criar a primeira', onPress: () => router.push({ pathname: '/mutirao/tarefa/nova', params: { projeto: p.id } }) } : undefined} />
        )
      ) : null}

      {aba === 'voluntarios' ? membros.map((m) => (
        <ItemLista key={m.profile_id} titulo={m.perfil?.nome_publico ?? 'Membro'} subtitulo={m.papel === 'coordenador' ? 'Coordenação' : 'Voluntária(o)'} direita={<Avatar nome={m.perfil?.nome_publico} url={m.perfil?.avatar_url} tamanho={32} />} onPress={() => router.push(`/perfil/membro/${m.profile_id}`)} />
      )) : null}

      {aba === 'eventos' ? (
        eventos.data?.length ? eventos.data.map((e) => <CardEvento key={e.id} e={e} />) : <EstadoVazio ilustracao="maos" titulo="Nenhum evento ligado" descricao="Mutirões presenciais aparecem aqui." />
      ) : null}

      {aba === 'caixa' ? (
        <Card plano>
          <Texto variante="secao" cor="secundario">Saldo</Texto>
          <Texto variante="numero" cor={Number(p.resumo?.saldo ?? 0) >= 0 ? 'secundaria' : 'perigo'}>{formatarMoeda(p.resumo?.saldo)}</Texto>
          <Texto variante="legenda" cor="secundario">Entradas {formatarMoeda(p.resumo?.total_entradas)} · Saídas {formatarMoeda(p.resumo?.total_saidas)} · {caixa.data?.length ?? 0} lançamentos</Texto>
          <Botao titulo="Abrir caixa transparente" icone="eye" variante="secundario" compacto style={{ marginTop: 10 }} onPress={() => router.push({ pathname: '/mutirao/projeto/caixa', params: { id: p.id } })} />
        </Card>
      ) : null}

      <Botao titulo="Denunciar projeto" variante="fantasma" compacto onPress={() => abrirDenuncia('projeto', p.id)} />
      <View style={{ height: espaco.sm, backgroundColor: c.fundo }} />
    </Tela>
  );
}

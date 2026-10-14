import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Platform, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Botao } from '@/components/Botao';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { Secao } from '@/components/Secao';
import { Segmentos } from '@/components/Segmentos';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useEvento, useInvalidarMutirao } from '@/features/mutirao/hooks';
import { responderRsvp } from '@/features/mutirao/services';
import type { StatusRsvp } from '@/features/mutirao/types';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { textoDoErro } from '@/lib/erros';
import { formatarDataHora, formatarEvento, plural } from '@/lib/formatos';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

async function adicionarAoCalendario(e: { titulo: string; inicio: string; fim: string; endereco: string | null; descricao: string | null }) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') throw new Error('Permita o acesso ao calendário para adicionar o evento.');
  const padrao = Platform.OS === 'ios' ? await Calendar.getDefaultCalendarAsync() : (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find((c) => c.allowsModifications);
  if (!padrao) throw new Error('Nenhum calendário disponível no aparelho.');
  await Calendar.createEventAsync(padrao.id, {
    title: e.titulo,
    startDate: new Date(e.inicio),
    endDate: new Date(e.fim),
    location: e.endereco ?? undefined,
    notes: e.descricao ?? undefined,
    alarms: [{ relativeOffset: -60 * 24 }],
  });
}

export default function TelaEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTema();
  const { data: perfil } = useMeuPerfil();
  const q = useEvento(id);
  const invalidar = useInvalidarMutirao();
  if (q.isLoading) return <Carregando />;
  if (!q.data) return <Erro erro={q.error ?? 'Evento não encontrado'} aoTentar={q.refetch} />;
  const { evento: e, rsvps, meu, confirmados } = q.data;
  const passado = new Date(e.fim) < new Date();
  const organizo = e.criado_por === perfil?.id || perfil?.papel === 'admin';
  const lotado = e.vagas !== null && confirmados >= e.vagas && meu?.status !== 'vou';

  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Stack.Screen options={{ title: 'Evento' }} />
      <Texto variante="titulo">{e.titulo}</Texto>
      <Card plano style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}><Icone nome="calendar" cor={c.primaria} /><Texto style={{ flex: 1 }}>{formatarEvento(e.inicio)} — até {formatarDataHora(e.fim)}</Texto></View>
        {e.local_nome || e.endereco ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Icone nome="map-pin" cor={c.primaria} />
            <View style={{ flex: 1 }}>
              <Texto>{e.local_nome}</Texto>
              {e.endereco ? <Texto variante="legenda" cor="primaria" accessibilityRole="link" onPress={() => Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?q=${encodeURIComponent(e.endereco!)}` : `geo:0,0?q=${encodeURIComponent(e.endereco!)}`)}>{e.endereco} · abrir no mapa</Texto> : null}
            </View>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}><Icone nome="users" cor={c.primaria} /><Texto>{plural(confirmados, 'confirmação', 'confirmações')}{e.vagas ? ` · ${e.vagas} vagas` : ''}</Texto></View>
        {e.projeto ? <Texto variante="legenda" cor="primaria" onPress={() => e.projeto_id && router.push(`/mutirao/projeto/${e.projeto_id}`)}>Projeto: {e.projeto.titulo} ›</Texto> : null}
      </Card>
      {e.descricao ? <Texto variante="leitura" style={{ fontSize: 17 }}>{e.descricao}</Texto> : null}

      {!passado ? (
        <Secao titulo="Você vai?">
          <Segmentos
            opcoes={[{ valor: 'vou', rotulo: lotado ? 'Lotado' : 'Vou' }, { valor: 'talvez', rotulo: 'Talvez' }, { valor: 'nao_vou', rotulo: 'Não vou' }]}
            valor={meu?.status ?? ''}
            aoMudar={async (v) => {
              try {
                await responderRsvp(e.id, v as StatusRsvp);
                invalidar();
                q.refetch();
              } catch (err) {
                toast.erro(textoDoErro(err));
              }
            }}
          />
          <Botao titulo="Adicionar ao calendário" icone="calendar" variante="secundario" onPress={() => adicionarAoCalendario(e).then(() => toast.sucesso('Evento adicionado ao seu calendário.')).catch((err) => toast.erro(textoDoErro(err)))} />
        </Secao>
      ) : null}

      {meu?.presente ? (
        <Card destaque="secundaria" plano><Texto variante="corpoForte">✓ Presença confirmada {meu.checkin_em ? `às ${new Date(meu.checkin_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</Texto></Card>
      ) : !passado || Date.now() - new Date(e.fim).getTime() < 2 * 3600_000 ? (
        <Botao titulo="Fazer check-in (escanear QR)" icone="camera" largura="total" onPress={() => router.push('/mutirao/evento/checkin')} />
      ) : null}

      {organizo ? (
        <Card plano style={{ gap: 8 }}>
          <Texto variante="secao" cor="secundario">Organização</Texto>
          <Botao titulo="Lista de presença e QR" icone="grid" variante="secundario" onPress={() => router.push({ pathname: '/mutirao/evento/presenca', params: { id: e.id } })} />
          <Botao titulo="Editar evento" icone="edit-2" variante="fantasma" onPress={() => router.push({ pathname: '/mutirao/evento/novo', params: { id: e.id } })} />
        </Card>
      ) : null}

      <Secao titulo="Quem vai">
        {rsvps.filter((r) => r.status === 'vou').map((r) => (
          <View key={r.profile_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar nome={r.perfil?.nome_publico} url={r.perfil?.avatar_url} tamanho={30} />
            <Texto style={{ flex: 1 }}>{r.perfil?.nome_publico}</Texto>
            {r.presente ? <Icone nome="check-circle" cor={c.sucesso} /> : null}
          </View>
        ))}
        {!rsvps.some((r) => r.status === 'vou') ? <Texto cor="sutil">Ninguém confirmou ainda — seja a primeira pessoa!</Texto> : null}
      </Secao>
    </Tela>
  );
}

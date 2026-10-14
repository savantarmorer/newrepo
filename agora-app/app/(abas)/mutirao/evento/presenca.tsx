import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Switch, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Carregando, Erro } from '@/components/Estados';
import { Secao } from '@/components/Secao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useEvento, useInvalidarMutirao } from '@/features/mutirao/hooks';
import { codigoCheckin, marcarPresenca } from '@/features/mutirao/services';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';

/** Tela da organização: exibe o QR do check-in e a lista de presença. */
export default function Presenca() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTema();
  const q = useEvento(id);
  const codigo = useQuery({ queryKey: ['evento', 'codigo', id], queryFn: () => codigoCheckin(id), enabled: !!id });
  const invalidar = useInvalidarMutirao();
  if (q.isLoading || codigo.isLoading) return <Carregando />;
  if (codigo.error) return <Erro erro={codigo.error} />;
  const presentes = q.data?.rsvps.filter((r) => r.presente).length ?? 0;
  return (
    <Tela aoAtualizar={q.refetch} atualizando={q.isRefetching}>
      <Texto variante="subtitulo">{q.data?.evento.titulo}</Texto>
      <Card plano style={{ alignItems: 'center', gap: 12 }}>
        <Texto cor="secundario" centro>Mostre este QR para os participantes escanearem em “Check-in”.</Texto>
        <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 }} accessible accessibilityLabel="QR Code de check-in do evento">
          {codigo.data ? <QRCode value={codigo.data} size={230} /> : null}
        </View>
        <Texto variante="legenda" cor="sutil" centro>O check-in abre 1h antes e fecha 2h depois do evento. Cada presença gera reputação.</Texto>
      </Card>
      <Secao titulo={`Lista de presença · ${presentes} presentes`}>
        {q.data?.rsvps.map((r) => (
          <View key={r.profile_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
            <Avatar nome={r.perfil?.nome_publico} url={r.perfil?.avatar_url} tamanho={32} />
            <View style={{ flex: 1 }}>
              <Texto>{r.perfil?.nome_publico}</Texto>
              <Texto variante="legenda" cor="sutil">{r.status === 'vou' ? 'Confirmou' : r.status === 'talvez' ? 'Talvez' : 'Não vai'}{r.checkin_em ? ' · check-in feito' : ''}</Texto>
            </View>
            <Switch
              value={r.presente}
              accessibilityLabel={`Presença de ${r.perfil?.nome_publico}`}
              trackColor={{ true: c.secundaria, false: c.bordaForte }}
              onValueChange={async (v) => {
                try {
                  await marcarPresenca(id, r.profile_id, v);
                  invalidar();
                  q.refetch();
                } catch (e) {
                  toast.erro(textoDoErro(e));
                }
              }}
            />
          </View>
        ))}
      </Secao>
    </Tela>
  );
}

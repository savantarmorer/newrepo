import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { FormServidor } from '@/features/servidor/FormServidor';
import { servidorDoLink } from '@/lib/servidor';
import { useServidor } from '@/stores/servidor';

/**
 * Conexão com o servidor (Supabase) da comunidade. É a primeira tela quando o app não tem
 * servidor embutido nem salvo, e também abre por link de convite: agora://servidor?url=…&chave=…
 */
export default function TelaServidor() {
  const params = useLocalSearchParams<{ url?: string; chave?: string }>();
  const convite = servidorDoLink(params);
  const primeiraVez = !useServidor((s) => s.servidor);
  return (
    <Tela teclado bordas={['top', 'left', 'right']}>
      {!primeiraVez && router.canGoBack() ? (
        <Botao titulo="Voltar" icone="arrow-left" variante="fantasma" compacto onPress={() => router.back()} />
      ) : null}
      {primeiraVez ? (
        <View style={{ alignItems: 'center', gap: 6, marginTop: 24 }}>
          <Texto variante="display" cor="primaria" accessibilityRole="header">Ágora</Texto>
          <Texto cor="secundario" centro>Conecte o app ao servidor da sua comunidade.</Texto>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        {!primeiraVez ? <Texto variante="subtitulo">Servidor da comunidade</Texto> : null}
        <Texto cor="secundario">
          {convite.url
            ? 'Você abriu um convite. Confira o endereço abaixo antes de conectar — só aceite convites de quem você conhece.'
            : primeiraVez
              ? 'Leia o QR Code de convite que a administração compartilhou ou cole o endereço e a chave pública do projeto Supabase. Você só precisa fazer isso uma vez.'
              : 'Cada comunidade Ágora tem seu próprio servidor. Ao trocar, você entra com a conta daquele servidor.'}
        </Texto>
      </View>
      <FormServidor
        key={`${convite.url}|${convite.chave}`}
        inicial={convite.url ? convite : undefined}
        aoConectar={() => router.replace('/')}
      />
    </Tela>
  );
}

import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Carregando } from '@/components/Estados';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { destinoInicial } from '@/lib/navegacao';
import { useServidor } from '@/stores/servidor';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

export default function Inicio() {
  const { c } = useTema();
  const { sessao, carregando } = useSessao();
  const servidor = useServidor((s) => s.servidor);
  const perfil = useMeuPerfil();
  if (!servidor) return <Redirect href="/servidor" />;
  if (carregando || (sessao && perfil.isLoading)) {
    return <View style={{ flex: 1, backgroundColor: c.fundo, justifyContent: 'center' }}><Carregando texto="Abrindo a Ágora…" /></View>;
  }
  const destino = destinoInicial(!!sessao, perfil.data);
  if (destino === '/carregando') {
    return <View style={{ flex: 1, backgroundColor: c.fundo, justifyContent: 'center' }}><Carregando texto="Preparando seu perfil…" /></View>;
  }
  return <Redirect href={destino as never} />;
}

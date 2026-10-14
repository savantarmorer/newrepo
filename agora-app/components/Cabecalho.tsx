import { router } from 'expo-router';
import { View } from 'react-native';
import { useNaoLidas } from '@/features/notificacoes/hooks';
import { BotaoIcone } from './Botao';

/** Ações de topo de cada aba: busca global e sino de notificações. */
export function AcoesCabecalho() {
  const { data: naoLidas } = useNaoLidas();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <BotaoIcone icone="search" rotulo="Buscar na Ágora" onPress={() => router.push('/busca')} />
      <BotaoIcone icone="bell" rotulo="Notificações" badge={naoLidas ?? 0} onPress={() => router.push('/notificacoes')} />
    </View>
  );
}

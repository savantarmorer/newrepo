import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Icone } from './Icone';
import { Texto } from './Texto';

export function BannerOffline() {
  const { c } = useTema();
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener((s) => setOffline(s.isConnected === false)), []);
  if (!offline) return null;
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.avisoSuave, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Icone nome="wifi-off" tamanho={16} cor={c.aviso} />
      <Texto variante="legenda" style={{ color: c.aviso, flex: 1 }}>Você está off-line. Mostrando o que já foi carregado e seus artigos salvos.</Texto>
    </View>
  );
}

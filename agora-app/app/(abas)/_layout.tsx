import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { BannerOffline } from '@/components/BannerOffline';
import { Carregando } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { destinoInicial } from '@/lib/navegacao';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

export default function AbasLayout() {
  const { c, familias } = useTema();
  const { sessao, carregando } = useSessao();
  const perfil = useMeuPerfil();

  if (carregando || (sessao && perfil.isLoading)) {
    return <View style={{ flex: 1, backgroundColor: c.fundo, justifyContent: 'center' }}><Carregando /></View>;
  }
  const destino = destinoInicial(!!sessao, perfil.data);
  if (destino !== '/biblioteca' && destino !== '/carregando') return <Redirect href={destino as never} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <BannerOffline />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primaria,
          tabBarInactiveTintColor: c.textoSutil,
          tabBarStyle: { backgroundColor: c.superficie, borderTopColor: c.borda, minHeight: 60 },
          tabBarLabelStyle: { fontFamily: familias.uiMedio, fontSize: 12 },
          tabBarItemStyle: { minHeight: 48 },
        }}
      >
        <Tabs.Screen name="biblioteca" options={{ title: 'Biblioteca', tabBarIcon: ({ color }) => <Icone nome="book-open" cor={color as string} />, tabBarAccessibilityLabel: 'Biblioteca' }} />
        <Tabs.Screen name="mutirao" options={{ title: 'Mutirão', tabBarIcon: ({ color }) => <Icone nome="heart" cor={color as string} />, tabBarAccessibilityLabel: 'Mutirão' }} />
        <Tabs.Screen name="assembleia" options={{ title: 'Assembleia', tabBarIcon: ({ color }) => <Icone nome="users" cor={color as string} />, tabBarAccessibilityLabel: 'Assembleia' }} />
        <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Icone nome="user" cor={color as string} />, tabBarAccessibilityLabel: 'Perfil' }} />
      </Tabs>
    </View>
  );
}

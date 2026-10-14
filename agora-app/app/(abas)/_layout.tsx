import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { BannerOffline } from '@/components/BannerOffline';
import { Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { destinoInicial } from '@/lib/navegacao';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

export default function AbasLayout() {
  const { c, familias } = useTema();
  const { sessao, carregando } = useSessao();
  const perfil = useMeuPerfil();

  // Nunca trocamos o navegador por outro componente enquanto carrega: isso faria o
  // Tabs remontar e perder o deep link (ex.: notificação abrindo uma proposta).
  if (!carregando && !sessao) return <Redirect href="/boas-vindas" />;
  const destino = destinoInicial(!!sessao, perfil.data);
  if (perfil.data && destino !== '/biblioteca') return <Redirect href={destino as never} />;
  const carregandoPerfil = carregando || !perfil.data;

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
      {carregandoPerfil ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.fundo, justifyContent: 'center' }}>
          {perfil.isError ? <Erro erro={perfil.error} aoTentar={() => perfil.refetch()} /> : <Carregando />}
        </View>
      ) : null}
    </View>
  );
}

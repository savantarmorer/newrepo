import { Redirect, Stack } from 'expo-router';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

export default function PublicoLayout() {
  const { c, familias } = useTema();
  const sessao = useSessao((s) => s.sessao);
  if (sessao) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.fundo },
        headerTintColor: c.texto,
        headerTitleStyle: { fontFamily: familias.uiNegrito },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.fundo },
      }}
    >
      <Stack.Screen name="boas-vindas" options={{ headerShown: false }} />
      <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
      <Stack.Screen name="entrar-discord" options={{ title: 'Entrar com o Discord' }} />
      <Stack.Screen name="sobre" options={{ title: 'A Ágora' }} />
    </Stack>
  );
}

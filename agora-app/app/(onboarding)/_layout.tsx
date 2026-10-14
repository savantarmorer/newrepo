import { Redirect, Stack } from 'expo-router';
import { useSessao } from '@/stores/sessao';
import { useTema } from '@/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { c, familias } = useTema();
  const sessao = useSessao((s) => s.sessao);
  if (!sessao) return <Redirect href="/boas-vindas" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.fundo },
        headerTintColor: c.texto,
        headerTitleStyle: { fontFamily: familias.uiNegrito },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.fundo },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="onboarding-perfil" options={{ title: 'Seu perfil · 1 de 2' }} />
      <Stack.Screen name="onboarding-conduta" options={{ title: 'Código de Conduta · 2 de 2' }} />
    </Stack>
  );
}

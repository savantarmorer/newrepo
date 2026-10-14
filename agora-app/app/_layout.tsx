import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '@/components/ToastHost';
import { useNotificacoesTempoReal } from '@/features/notificacoes/hooks';
import { concluirLoginPorUrl } from '@/lib/auth';
import { registrarPush } from '@/lib/push';
import { persistidor, queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useSessao } from '@/stores/sessao';
import { toast } from '@/stores/toast';
import { fontesDoApp } from '@/theme/fontes';
import { ThemeProvider, useTema } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RaizLayout() {
  const [fontesOk, erroFontes] = useFonts(fontesDoApp);
  const definirSessao = useSessao((s) => s.definir);
  const carregandoSessao = useSessao((s) => s.carregando);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => definirSessao(data.session));
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      definirSessao(sessao);
      if (evento === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [definirSessao]);

  // Retorno do link mágico / Google por deep link
  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (url && /[?#&](code|access_token|error_description)=/.test(url)) {
      concluirLoginPorUrl(url).catch((e: Error) => toast.erro(e.message));
    }
  }, [url]);

  const pronto = (fontesOk || !!erroFontes) && !carregandoSessao;
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => undefined);
  }, [pronto]);

  // Splash até fontes e sessão estarem prontas: as telas já montam com a sessão certa
  if (!pronto) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: persistidor, maxAge: 1000 * 60 * 60 * 24 * 7, buster: 'v1' }}
        >
          <ThemeProvider>
            <Navegacao />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navegacao() {
  const { c, esquema, familias } = useTema();
  const sessao = useSessao((s) => s.sessao);
  useNotificacoesTempoReal();

  useEffect(() => {
    if (sessao?.user.id) registrarPush(sessao.user.id).catch(() => undefined);
  }, [sessao?.user.id]);

  // Toque numa notificação push abre o link dela
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const link = r.notification.request.content.data?.link;
      if (typeof link === 'string' && link.startsWith('/')) router.push(link as never);
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.fundo },
          headerTintColor: c.texto,
          headerTitleStyle: { fontFamily: familias.uiNegrito, fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.fundo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(publico)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(abas)" options={{ headerShown: false }} />
        <Stack.Screen name="inativo" options={{ title: 'Assinatura' }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="busca" options={{ title: 'Buscar', presentation: 'modal' }} />
        <Stack.Screen name="notificacoes" options={{ title: 'Notificações', presentation: 'modal' }} />
        <Stack.Screen name="denunciar" options={{ title: 'Denunciar conteúdo', presentation: 'modal' }} />
      </Stack>
      <ToastHost />
    </>
  );
}

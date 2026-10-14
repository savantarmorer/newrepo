import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { router, Stack, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '@/components/ToastHost';
import { useNotificacoesTempoReal } from '@/features/notificacoes/hooks';
import { iniciarServidor } from '@/features/servidor/ativar';
import { concluirLoginPorUrl } from '@/lib/auth';
import { registrarPush } from '@/lib/push';
import { persistidor, queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useServidor } from '@/stores/servidor';
import { useSessao } from '@/stores/sessao';
import { toast } from '@/stores/toast';
import { fontesDoApp } from '@/theme/fontes';
import { ThemeProvider, useTema } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RaizLayout() {
  const [fontesOk, erroFontes] = useFonts(fontesDoApp);
  const definirSessao = useSessao((s) => s.definir);
  const carregandoSessao = useSessao((s) => s.carregando);
  const servidor = useServidor((s) => s.servidor);
  const servidorCarregado = useServidor((s) => s.carregado);
  const versaoServidor = useServidor((s) => s.versao);

  useEffect(() => {
    iniciarServidor().catch(() => useServidor.getState().definir(null));
  }, []);

  // Escuta a sessão do servidor atual (reinicia quando o servidor muda)
  useEffect(() => {
    if (!servidor) return;
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => { if (ativo) definirSessao(data.session); }).catch(() => definirSessao(null));
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      definirSessao(sessao);
      if (evento === 'SIGNED_OUT') queryClient.clear();
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [servidor, versaoServidor, definirSessao]);

  // Retorno do link mágico / Google por deep link
  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (servidor && url && /[?#&](code|access_token|error_description)=/.test(url)) {
      concluirLoginPorUrl(url).catch((e: Error) => toast.erro(e.message));
    }
  }, [url, servidor]);

  // Só a primeira abertura espera a sessão; numa troca de servidor a navegação continua montada
  const jaAbriu = useRef(false);
  const pronto = jaAbriu.current || ((fontesOk || !!erroFontes) && servidorCarregado && (!servidor || !carregandoSessao));
  if (pronto) jaAbriu.current = true;
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => undefined);
  }, [pronto]);

  // Splash até fontes, servidor e sessão estarem prontos: as telas já montam com a sessão certa
  if (!pronto) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: persistidor, maxAge: 1000 * 60 * 60 * 24 * 7, buster: `v2:${servidor?.url ?? ''}` }}
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
  const servidor = useServidor((s) => s.servidor);
  const segmentos = useSegments();
  useNotificacoesTempoReal();

  // Sem servidor configurado, qualquer rota leva à tela de conexão
  const naTelaServidor = segmentos[0] === 'servidor';
  useEffect(() => {
    if (!servidor && !naTelaServidor) router.replace('/servidor');
  }, [servidor, naTelaServidor]);

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
        {/* Opções fixas: mudar presentation/header de uma tela já montada derruba o react-native-screens no Android */}
        <Stack.Screen name="servidor" options={{ headerShown: false }} />
      </Stack>
      <ToastHost />
    </>
  );
}

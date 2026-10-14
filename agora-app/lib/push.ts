import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/** Pede permissão e registra o token Expo Push do aparelho no Supabase. */
export async function registrarPush(profileId: string): Promise<string | null> {
  // Sem projeto EAS (ex.: APK de teste do CI) não há token Expo Push: nem pede a permissão.
  const projectId = idProjetoExpo();
  if (Platform.OS === 'web' || !Device.isDevice || !projectId) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('padrao', {
      name: 'Ágora',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  let status = atual.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('dispositivos_push').upsert({ token, profile_id: profileId, plataforma: Platform.OS });
    return token;
  } catch (e) {
    console.warn('[Ágora] push indisponível:', e);
    return null;
  }
}

function idProjetoExpo(): string | null {
  const id =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  return id && !/^0{8}-/.test(id) ? id : null;
}

export async function removerPushDoAparelho() {
  const projectId = idProjetoExpo();
  if (Platform.OS === 'web' || !Device.isDevice || !projectId) return;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('dispositivos_push').delete().eq('token', token);
  } catch {
    /* sem token */
  }
}

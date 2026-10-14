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
  if (Platform.OS === 'web' || !Device.isDevice) return null;
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
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  try {
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await supabase.from('dispositivos_push').upsert({ token, profile_id: profileId, plataforma: Platform.OS });
    return token;
  } catch (e) {
    console.warn('[Ágora] push indisponível:', e);
    return null;
  }
}

export async function removerPushDoAparelho() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase.from('dispositivos_push').delete().eq('token', token);
  } catch {
    /* sem token */
  }
}

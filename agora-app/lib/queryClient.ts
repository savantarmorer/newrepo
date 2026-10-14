import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24 * 7, // uma semana: leitura offline do que já foi visto
      retry: (falhas, erro) => falhas < 2 && !/permissão|não encontramos/i.test(String((erro as Error)?.message)),
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'online' },
  },
});

export const persistidor = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'agora-cache-v1',
  throttleTime: 2000,
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((estado) => setOnline(!!estado.isConnected)),
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
}

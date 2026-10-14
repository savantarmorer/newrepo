import { Stack } from 'expo-router';
import { useTema } from '@/theme/ThemeProvider';
import { AcoesCabecalho } from './Cabecalho';

/** Stack de cada aba com o cabeçalho padrão (busca + sino na tela inicial). */
export function PilhaAba({ tituloInicial, telas }: { tituloInicial: string; telas: { nome: string; titulo: string; modal?: boolean }[] }) {
  const { c, familias } = useTema();
  return (
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
      <Stack.Screen
        name="index"
        options={{
          title: tituloInicial,
          headerTitleStyle: { fontFamily: familias.titulo, fontSize: 26 },
          headerLargeTitle: false,
          headerRight: () => <AcoesCabecalho />,
        }}
      />
      {telas.map((t) => (
        <Stack.Screen key={t.nome} name={t.nome} options={{ title: t.titulo, presentation: t.modal ? 'modal' : undefined }} />
      ))}
    </Stack>
  );
}

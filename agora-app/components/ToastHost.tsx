import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, type Toast } from '@/stores/toast';
import { useTema } from '@/theme/ThemeProvider';
import { Icone } from './Icone';
import { Texto } from './Texto';

function ItemToast({ t }: { t: Toast }) {
  const { c, raio, espaco, sombra } = useTema();
  const remover = useToast((s) => s.remover);
  useEffect(() => {
    const id = setTimeout(() => remover(t.id), t.tipo === 'erro' ? 5000 : 3200);
    return () => clearTimeout(id);
  }, [t, remover]);
  const cor = t.tipo === 'sucesso' ? c.sucesso : t.tipo === 'erro' ? c.perigo : c.secundaria;
  return (
    <Pressable
      onPress={() => remover(t.id)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={t.mensagem}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: c.superficieElevada, borderRadius: raio.md, padding: espaco.md, borderLeftWidth: 4, borderLeftColor: cor, ...sombra }}
    >
      <Icone nome={t.tipo === 'sucesso' ? 'check-circle' : t.tipo === 'erro' ? 'alert-circle' : 'info'} cor={cor} />
      <Texto style={{ flex: 1 }}>{t.mensagem}</Texto>
    </Pressable>
  );
}

export function ToastHost() {
  const fila = useToast((s) => s.fila);
  const insets = useSafeAreaInsets();
  if (!fila.length) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 72, gap: 8 }}>
      {fila.map((t) => <ItemToast key={t.id} t={t} />)}
    </View>
  );
}

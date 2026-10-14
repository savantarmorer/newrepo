import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Erro } from '@/components/Estados';
import { Icone, type NomeIcone } from '@/components/Icone';
import { SkeletonLista } from '@/components/Skeleton';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useTemas } from '@/features/biblioteca/hooks';
import { useTema } from '@/theme/ThemeProvider';

const ICONES: Record<string, NomeIcone> = {
  sparkles: 'star', layers: 'layers', scale: 'shield', landmark: 'home', scroll: 'file-text', 'book-open': 'book-open', flame: 'sun', users: 'users',
};

export default function Temas() {
  const { c, raio, espaco } = useTema();
  const { data, isLoading, error, refetch, isRefetching } = useTemas();
  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      {isLoading ? <SkeletonLista /> : error ? <Erro erro={error} aoTentar={refetch} /> : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md }}>
          {data?.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${t.nome}. ${t.descricao ?? ''}`}
              onPress={() => router.push(`/biblioteca/tema/${t.slug}`)}
              style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, minHeight: 130, padding: espaco.lg, borderRadius: raio.lg, backgroundColor: c.superficie, borderWidth: 1, borderColor: c.borda, opacity: pressed ? 0.8 : 1, gap: 8 })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.primariaSuave, alignItems: 'center', justifyContent: 'center' }}>
                <Icone nome={ICONES[t.icone ?? ''] ?? 'book'} cor={c.primaria} />
              </View>
              <Texto variante="subtitulo" style={{ fontSize: 21, lineHeight: 25 }}>{t.nome}</Texto>
              <Texto variante="legenda" cor="secundario" numberOfLines={3}>{t.descricao}</Texto>
            </Pressable>
          ))}
        </View>
      )}
    </Tela>
  );
}

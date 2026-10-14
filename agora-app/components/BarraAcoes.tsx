import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { ALVO_TOQUE } from '@/theme/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

export interface AcaoBarra {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
  ativo?: boolean;
}

/** Linha de ações discretas (salvar, denunciar, compartilhar…) — sem contadores públicos. */
export function BarraAcoes({ acoes }: { acoes: AcaoBarra[] }) {
  const { c } = useTema();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {acoes.map((a) => (
        <Pressable
          key={a.rotulo}
          accessibilityRole="button"
          accessibilityLabel={a.rotulo}
          accessibilityState={{ selected: !!a.ativo }}
          onPress={a.onPress}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: ALVO_TOQUE, paddingHorizontal: 10, borderRadius: 22, backgroundColor: pressed ? c.superficieAfundada : 'transparent' })}
        >
          <Icone nome={a.icone} tamanho={18} cor={a.ativo ? c.primaria : c.textoSecundario} />
          <Texto variante="rotulo" style={{ color: a.ativo ? c.primaria : c.textoSecundario }}>{a.rotulo}</Texto>
        </Pressable>
      ))}
    </View>
  );
}

export const abrirDenuncia = (tipo: string, id: string) => router.push({ pathname: '/denunciar', params: { tipo, id } });

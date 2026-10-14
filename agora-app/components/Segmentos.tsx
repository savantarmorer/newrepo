import { Pressable, ScrollView, View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Texto } from './Texto';

interface Opcao {
  valor: string;
  rotulo: string;
  contagem?: number;
}

export function Segmentos({ opcoes, valor, aoMudar, compacto }: { opcoes: Opcao[]; valor: string; aoMudar: (v: string) => void; compacto?: boolean }) {
  const { c, raio } = useTema();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: compacto ? 0 : 1 }}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.superficieAfundada, borderRadius: raio.pilula, padding: 3, flexGrow: 1 }}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={o.contagem !== undefined ? `${o.rotulo}, ${o.contagem}` : o.rotulo}
              onPress={() => aoMudar(o.valor)}
              style={{ flexGrow: 1, minHeight: compacto ? 32 : 40, paddingHorizontal: compacto ? 10 : 14, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center', backgroundColor: ativo ? c.superficieElevada : 'transparent' }}
            >
              <Texto variante="rotulo" style={{ color: ativo ? c.texto : c.textoSecundario, fontSize: compacto ? 13 : 14 }}>
                {o.rotulo}{o.contagem !== undefined ? ` · ${o.contagem}` : ''}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

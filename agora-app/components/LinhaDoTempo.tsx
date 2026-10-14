import { View } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import { Icone } from './Icone';
import { Texto } from './Texto';

export interface EtapaLinha {
  titulo: string;
  detalhe?: string;
  estado: 'feito' | 'atual' | 'futuro' | 'alerta';
}

export function LinhaDoTempo({ etapas }: { etapas: EtapaLinha[] }) {
  const { c } = useTema();
  return (
    <View accessibilityRole="list">
      {etapas.map((e, i) => {
        const cor = e.estado === 'feito' ? c.secundaria : e.estado === 'atual' ? c.primaria : e.estado === 'alerta' ? c.perigo : c.bordaForte;
        const ultimo = i === etapas.length - 1;
        return (
          <View key={`${e.titulo}-${i}`} style={{ flexDirection: 'row', gap: 12 }} accessible accessibilityLabel={`${e.titulo}${e.detalhe ? ', ' + e.detalhe : ''}, ${e.estado === 'feito' ? 'concluída' : e.estado === 'atual' ? 'etapa atual' : e.estado === 'alerta' ? 'atenção' : 'próxima'}`}>
            <View style={{ alignItems: 'center', width: 22 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cor, backgroundColor: e.estado === 'feito' || e.estado === 'atual' ? cor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {e.estado === 'feito' ? <Icone nome="check" tamanho={12} cor={c.textoSobreSecundaria} /> : null}
                {e.estado === 'alerta' ? <Icone nome="alert-triangle" tamanho={11} cor={c.perigo} /> : null}
              </View>
              {!ultimo ? <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: e.estado === 'feito' ? c.secundaria : c.borda }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: ultimo ? 0 : 14 }}>
              <Texto variante={e.estado === 'atual' ? 'corpoForte' : 'corpo'} cor={e.estado === 'futuro' ? 'sutil' : 'texto'}>
                {e.titulo}
              </Texto>
              {e.detalhe ? <Texto variante="legenda" cor="secundario">{e.detalhe}</Texto> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

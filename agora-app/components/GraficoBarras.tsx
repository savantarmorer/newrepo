import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { formatarMes, formatarMoeda } from '@/lib/formatos';
import { useTema } from '@/theme/ThemeProvider';
import { Texto } from './Texto';

export interface PontoMensal {
  mes: string;
  entradas: number;
  saidas: number;
}

/** Barras agrupadas de entradas × saídas por mês (últimos 6 meses). */
export function GraficoBarras({ dados, largura = 320 }: { dados: PontoMensal[]; largura?: number }) {
  const { c, familias } = useTema();
  const pontos = dados.slice(-6);
  const altura = 150;
  const max = Math.max(1, ...pontos.flatMap((p) => [Number(p.entradas), Number(p.saidas)]));
  const grupo = largura / Math.max(1, pontos.length);
  const barra = Math.min(18, grupo / 3);
  const descricao = pontos.map((p) => `${formatarMes(p.mes)}: entradas ${formatarMoeda(p.entradas)}, saídas ${formatarMoeda(p.saidas)}`).join('; ');
  return (
    <View accessible accessibilityLabel={`Gráfico de entradas e saídas. ${descricao}`}>
      <Svg width={largura} height={altura + 24}>
        <Line x1={0} y1={altura} x2={largura} y2={altura} stroke={c.borda} strokeWidth={1} />
        {pontos.map((p, i) => {
          const x = i * grupo + grupo / 2;
          const hE = (Number(p.entradas) / max) * (altura - 10);
          const hS = (Number(p.saidas) / max) * (altura - 10);
          return (
            <G key={p.mes}>
              <Rect x={x - barra - 2} y={altura - hE} width={barra} height={hE} rx={3} fill={c.secundaria} />
              <Rect x={x + 2} y={altura - hS} width={barra} height={hS} rx={3} fill={c.primaria} />
              <SvgText x={x} y={altura + 16} fontSize={11} fill={c.textoSecundario} textAnchor="middle" fontFamily={familias.ui}>
                {formatarMes(p.mes)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c.secundaria }} />
          <Texto variante="legenda" cor="secundario">Entradas</Texto>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c.primaria }} />
          <Texto variante="legenda" cor="secundario">Saídas</Texto>
        </View>
      </View>
    </View>
  );
}

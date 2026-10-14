import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTema } from '@/theme/ThemeProvider';
import type { VarianteTexto } from '@/theme/tokens';

type CorTexto = 'texto' | 'secundario' | 'sutil' | 'primaria' | 'secundaria' | 'dourado' | 'perigo' | 'sucesso' | 'sobrePrimaria';

export interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: CorTexto;
  centro?: boolean;
  maiusculas?: boolean;
}

export function Texto({ variante = 'corpo', cor = 'texto', centro, maiusculas, style, ...props }: TextoProps) {
  const { c, tipografia } = useTema();
  const mapaCor: Record<CorTexto, string> = {
    texto: c.texto,
    secundario: c.textoSecundario,
    sutil: c.textoSutil,
    primaria: c.primaria,
    secundaria: c.secundaria,
    dourado: c.douradoTexto,
    perigo: c.perigo,
    sucesso: c.sucesso,
    sobrePrimaria: c.textoSobrePrimaria,
  };
  const estilo: TextStyle = {
    ...tipografia[variante],
    color: mapaCor[cor],
    textAlign: centro ? 'center' : undefined,
    textTransform: maiusculas || variante === 'secao' ? 'uppercase' : undefined,
  };
  const ehTitulo = variante === 'display' || variante === 'titulo' || variante === 'subtitulo';
  return (
    <Text
      accessibilityRole={ehTitulo ? 'header' : undefined}
      maxFontSizeMultiplier={variante === 'leitura' ? 2.2 : 1.7}
      style={[estilo, style]}
      {...props}
    />
  );
}
